-- Migration: 20261017_fix_accept_friend_request.sql
-- Description: Fix Accept Friend Request functionality, atomic friendship creation, and RLS policies
-- Author: BreakTym Senior Engineering Team

-- 1. Ensure public.friendships table exists with proper columns and constraints
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_friendship CHECK (user_id <> friend_id),
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Ensure RLS is enabled
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 2. Update RLS policies on friendships
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships"
    ON public.friendships FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Prevent direct friendship insertion" ON public.friendships;
CREATE POLICY "Prevent direct friendship insertion"
    ON public.friendships FOR INSERT
    TO authenticated
    WITH CHECK (false);

DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;
CREATE POLICY "Users can delete their own friendships"
    ON public.friendships FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 3. Trigger function to ensure friendships are inserted whenever status becomes 'accepted'
CREATE OR REPLACE FUNCTION public.handle_friend_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        -- Atomically create reciprocal friendship
        INSERT INTO public.friendships (user_id, friend_id)
        VALUES 
            (NEW.sender_id, NEW.recipient_id),
            (NEW.recipient_id, NEW.sender_id)
        ON CONFLICT (user_id, friend_id) DO NOTHING;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_friend_request_status_change ON public.friend_requests;
CREATE TRIGGER trg_friend_request_status_change
    BEFORE UPDATE OF status ON public.friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_friend_request_status_change();

-- 4. Atomic RPC: accept_friend_request by sender_user_id
-- Ideal for search cards where caller knows target user ID
CREATE OR REPLACE FUNCTION public.accept_friend_request(target_sender_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    req_record public.friend_requests%ROWTYPE;
BEGIN
    -- Step 1: Verify authenticated user
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required. Please sign in.');
    END IF;

    IF current_uid = target_sender_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid operation: You cannot accept a request from yourself.');
    END IF;

    -- Check if already friends
    IF EXISTS (
        SELECT 1 FROM public.friendships 
        WHERE user_id = current_uid AND friend_id = target_sender_id
    ) THEN
        RETURN jsonb_build_object('success', true, 'already_friends', true, 'message', 'You are already friends with this user ✨');
    END IF;

    -- Step 2: Find pending request
    SELECT * INTO req_record
    FROM public.friend_requests
    WHERE recipient_id = current_uid AND sender_id = target_sender_id AND status = 'pending'
    LIMIT 1;

    -- Step 3: Check failure cases if no pending request found
    IF req_record.id IS NULL THEN
        -- Check if request was already accepted
        IF EXISTS (
            SELECT 1 FROM public.friend_requests
            WHERE recipient_id = current_uid AND sender_id = target_sender_id AND status = 'accepted'
        ) THEN
            -- Ensure friendship rows exist
            INSERT INTO public.friendships (user_id, friend_id)
            VALUES (current_uid, target_sender_id), (target_sender_id, current_uid)
            ON CONFLICT (user_id, friend_id) DO NOTHING;
            
            RETURN jsonb_build_object('success', true, 'already_accepted', true, 'message', 'Friend request has already been accepted ✨');
        END IF;

        -- Check if request was declined or cancelled
        IF EXISTS (
            SELECT 1 FROM public.friend_requests
            WHERE recipient_id = current_uid AND sender_id = target_sender_id AND status IN ('rejected', 'declined')
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'This friend request was previously declined.');
        END IF;

        IF EXISTS (
            SELECT 1 FROM public.friend_requests
            WHERE recipient_id = current_uid AND sender_id = target_sender_id AND status = 'cancelled'
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'This friend request was cancelled by the sender.');
        END IF;

        RETURN jsonb_build_object('success', false, 'error', 'No pending friend request found from this user.');
    END IF;

    -- Step 4: Update request status
    UPDATE public.friend_requests
    SET status = 'accepted', updated_at = NOW()
    WHERE id = req_record.id;

    -- Step 5: Atomically create bidirectional friendships
    INSERT INTO public.friendships (user_id, friend_id)
    VALUES 
        (current_uid, target_sender_id),
        (target_sender_id, current_uid)
    ON CONFLICT (user_id, friend_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'request_id', req_record.id,
        'message', 'Friend request accepted! Added to your circle ✨'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atomic RPC: respond_to_friend_request by request_id
-- Used for Received Requests tab and direct request response
CREATE OR REPLACE FUNCTION public.respond_to_friend_request(request_id UUID, new_status TEXT)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    req_record public.friend_requests%ROWTYPE;
BEGIN
    -- Verify authentication
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required. Please sign in.');
    END IF;

    IF new_status NOT IN ('accepted', 'rejected', 'declined') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid status response.');
    END IF;

    SELECT * INTO req_record
    FROM public.friend_requests
    WHERE id = request_id;

    IF req_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Friend request not found.');
    END IF;

    -- Enforce that only the intended recipient can accept or reject
    IF req_record.recipient_id <> current_uid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only respond to requests sent to you.');
    END IF;

    IF req_record.status <> 'pending' THEN
        IF req_record.status = 'accepted' THEN
            RETURN jsonb_build_object('success', true, 'already_accepted', true, 'message', 'Friend request has already been accepted ✨');
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Request is no longer pending.');
        END IF;
    END IF;

    -- Normalize status to 'rejected' if 'declined' passed
    IF new_status = 'declined' THEN
        new_status := 'rejected';
    END IF;

    -- Update request status
    UPDATE public.friend_requests
    SET status = new_status, updated_at = NOW()
    WHERE id = request_id;

    IF new_status = 'accepted' THEN
        -- Atomically create reciprocal friendship
        INSERT INTO public.friendships (user_id, friend_id)
        VALUES 
            (req_record.sender_id, req_record.recipient_id),
            (req_record.recipient_id, req_record.sender_id)
        ON CONFLICT (user_id, friend_id) DO NOTHING;

        RETURN jsonb_build_object('success', true, 'message', 'Friend request accepted! Added to your circle ✨');
    ELSE
        RETURN jsonb_build_object('success', true, 'message', 'Friend request declined.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_friend_request(UUID, TEXT) TO authenticated;
