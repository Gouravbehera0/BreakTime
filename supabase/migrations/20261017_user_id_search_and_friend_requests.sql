-- Migration: 20261017_user_id_search_and_friend_requests.sql
-- Description: Complete User ID Search and Friend Request System for BreakTym
-- Author: BreakTym Team

-- 1. PROFILES TABLE ENHANCEMENTS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'BreakTym Member',
    username TEXT,
    avatar_url TEXT,
    bio TEXT DEFAULT 'Living for spontaneous moments ✨',
    phone_number TEXT,
    qr_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was partially created
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Living for spontaneous moments ✨',
    ADD COLUMN IF NOT EXISTS phone_number TEXT,
    ADD COLUMN IF NOT EXISTS qr_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Case-insensitive unique username constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
    ON public.profiles(LOWER(username)) 
    WHERE username IS NOT NULL;

-- Validate username format: 3-20 characters, lowercase/uppercase alphanumeric and underscore
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_username_format;
ALTER TABLE public.profiles ADD CONSTRAINT valid_username_format
    CHECK (username IS NULL OR (LENGTH(username) >= 3 AND LENGTH(username) <= 20 AND username ~ '^[a-zA-Z0-9_]+$'));

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'declined', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_friend_request CHECK (sender_id <> recipient_id)
);

-- Enforce only ONE pending request between sender and recipient
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request 
    ON public.friend_requests(sender_id, recipient_id) 
    WHERE status = 'pending';

-- Enable RLS on friend_requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 3. FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_friendship CHECK (user_id <> friend_id),
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient ON public.friend_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles RLS:
-- Users can view public fields of other profiles, and update only their own profile
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Friend Requests RLS:
DROP POLICY IF EXISTS "Users can view their own sent or received requests" ON public.friend_requests;
CREATE POLICY "Users can view their own sent or received requests"
    ON public.friend_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
CREATE POLICY "Users can send friend requests"
    ON public.friend_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id 
        AND sender_id <> recipient_id
        AND NOT EXISTS (
            SELECT 1 FROM public.friendships 
            WHERE user_id = auth.uid() AND friend_id = recipient_id
        )
    );

DROP POLICY IF EXISTS "Users can update their friend requests" ON public.friend_requests;
CREATE POLICY "Users can update their friend requests"
    ON public.friend_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = recipient_id OR auth.uid() = sender_id)
    WITH CHECK (
        (auth.uid() = recipient_id AND status IN ('accepted', 'rejected', 'declined'))
        OR
        (auth.uid() = sender_id AND status = 'cancelled')
    );

DROP POLICY IF EXISTS "Users can delete their own pending or cancelled requests" ON public.friend_requests;
CREATE POLICY "Users can delete their own pending or cancelled requests"
    ON public.friend_requests FOR DELETE
    TO authenticated
    USING (auth.uid() = sender_id);

-- Friendships RLS:
-- Users can only view their own friendships
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships"
    ON public.friendships FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users cannot insert arbitrary friendships directly; friendship creation is strictly handled
-- by the SECURITY DEFINER function or trigger when a friend request is accepted!
DROP POLICY IF EXISTS "Prevent direct friendship insertion" ON public.friendships;
CREATE POLICY "Prevent direct friendship insertion"
    ON public.friendships FOR INSERT
    TO authenticated
    WITH CHECK (false);

-- Users can remove a friend
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;
CREATE POLICY "Users can delete their own friendships"
    ON public.friendships FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 5. TRIGGER & SECURITY DEFINER FUNCTION FOR ACCEPTED REQUESTS
CREATE OR REPLACE FUNCTION public.handle_friend_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        -- Create bidirectional friendship atomically
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

DROP TRIGGER IF EXISTS trg_friend_request_insert_status ON public.friend_requests;
CREATE TRIGGER trg_friend_request_insert_status
    AFTER INSERT ON public.friend_requests
    FOR EACH ROW
    WHEN (NEW.status = 'accepted')
    EXECUTE FUNCTION public.handle_friend_request_status_change();

-- 6. RPC: SEARCH PROFILES BY USER ID OR EXACT/PREFIX USERNAME
CREATE OR REPLACE FUNCTION public.search_profiles_by_user_id(
    search_query TEXT,
    max_results INT DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    friendship_status TEXT
) AS $$
DECLARE
    clean_query TEXT := LOWER(TRIM(REPLACE(search_query, '@', '')));
    current_uid UUID := auth.uid();
    is_valid_uuid BOOLEAN := FALSE;
    query_uuid UUID;
BEGIN
    IF clean_query IS NULL OR LENGTH(clean_query) < 2 THEN
        RETURN;
    END IF;

    -- Check if search query is a valid UUID
    BEGIN
        query_uuid := clean_query::UUID;
        is_valid_uuid := TRUE;
    EXCEPTION WHEN OTHERS THEN
        is_valid_uuid := FALSE;
    END;

    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.display_name,
        p.username,
        p.avatar_url,
        p.bio,
        CASE
            WHEN current_uid IS NOT NULL AND p.id = current_uid THEN 'self'
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE f.user_id = current_uid AND f.friend_id = p.id
            ) THEN 'friends'
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friend_requests r
                WHERE r.sender_id = current_uid AND r.recipient_id = p.id AND r.status = 'pending'
            ) THEN 'pending_sent'
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friend_requests r
                WHERE r.sender_id = p.id AND r.recipient_id = current_uid AND r.status = 'pending'
            ) THEN 'pending_received'
            ELSE 'none'
        END AS friendship_status
    FROM public.profiles p
    WHERE (
        LOWER(p.username) = clean_query
        OR LOWER(p.username) LIKE clean_query || '%'
        OR (is_valid_uuid AND p.id = query_uuid)
    )
    ORDER BY
        CASE 
            WHEN LOWER(p.username) = clean_query THEN 1
            WHEN is_valid_uuid AND p.id = query_uuid THEN 1
            ELSE 2 
        END,
        p.display_name ASC
    LIMIT LEAST(max_results, 25);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: SEND FRIEND REQUEST WITH VALIDATION
CREATE OR REPLACE FUNCTION public.send_friend_request(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    existing_request_id UUID;
    existing_request_status TEXT;
    new_request_id UUID;
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    IF current_uid = target_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot send a friend request to yourself');
    END IF;

    -- Check target user exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Check if already friends
    IF EXISTS (SELECT 1 FROM public.friendships WHERE user_id = current_uid AND friend_id = target_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are already friends with this user');
    END IF;

    -- Check if there is an outgoing pending request
    SELECT id, status INTO existing_request_id, existing_request_status
    FROM public.friend_requests
    WHERE sender_id = current_uid AND recipient_id = target_user_id AND status = 'pending';

    IF existing_request_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Friend request already sent');
    END IF;

    -- Check if there is an incoming pending request (reciprocal request)
    SELECT id INTO existing_request_id
    FROM public.friend_requests
    WHERE sender_id = target_user_id AND recipient_id = current_uid AND status = 'pending';

    IF existing_request_id IS NOT NULL THEN
        -- Accept reciprocal request directly
        UPDATE public.friend_requests
        SET status = 'accepted', updated_at = NOW()
        WHERE id = existing_request_id;

        RETURN jsonb_build_object('success', true, 'action', 'accepted_reciprocal', 'message', 'Reciprocal request detected! Friendship formed ✨');
    END IF;

    -- Insert new friend request
    INSERT INTO public.friend_requests (sender_id, recipient_id, status)
    VALUES (current_uid, target_user_id, 'pending')
    RETURNING id INTO new_request_id;

    RETURN jsonb_build_object('success', true, 'action', 'created', 'request_id', new_request_id, 'message', 'Friend request sent! ✨');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: RESPOND TO FRIEND REQUEST (ACCEPT / REJECT)
CREATE OR REPLACE FUNCTION public.respond_to_friend_request(request_id UUID, new_status TEXT)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    req_record public.friend_requests%ROWTYPE;
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    IF new_status NOT IN ('accepted', 'rejected', 'declined') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid status response');
    END IF;

    SELECT * INTO req_record
    FROM public.friend_requests
    WHERE id = request_id;

    IF req_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    -- Only the recipient can accept or reject
    IF req_record.recipient_id <> current_uid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only respond to requests sent to you');
    END IF;

    IF req_record.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request is no longer pending');
    END IF;

    UPDATE public.friend_requests
    SET status = new_status, updated_at = NOW()
    WHERE id = request_id;

    IF new_status = 'accepted' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Friend request accepted! Added to your circle ✨');
    ELSE
        RETURN jsonb_build_object('success', true, 'message', 'Friend request declined.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: CANCEL FRIEND REQUEST
CREATE OR REPLACE FUNCTION public.cancel_friend_request(request_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    req_record public.friend_requests%ROWTYPE;
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO req_record
    FROM public.friend_requests
    WHERE id = request_id;

    IF req_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    -- Only sender can cancel
    IF req_record.sender_id <> current_uid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only cancel requests you sent');
    END IF;

    UPDATE public.friend_requests
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = request_id;

    RETURN jsonb_build_object('success', true, 'message', 'Friend request cancelled.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ENABLE REALTIME PUBLICATION
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
