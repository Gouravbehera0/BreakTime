-- Migration: 20261017_fix_activity_invitations_delivery.sql
-- Description: Complete Activity Invitations Delivery System for BreakTym
-- Author: BreakTym Senior Engineering Team

-- 1. Create or adapt public.activity_invitations table
CREATE TABLE IF NOT EXISTS public.activity_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL,
    activity_title TEXT NOT NULL,
    custom_note TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'accepted', 'declined', 'cancelled', 'expired')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    CONSTRAINT no_self_invitation CHECK (sender_id <> recipient_id)
);

-- Ensure all columns exist if table was partially created
ALTER TABLE public.activity_invitations
    ADD COLUMN IF NOT EXISTS custom_note TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours');

-- Add foreign keys to profiles for clean joins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_invitations_sender_profile'
    ) THEN
        ALTER TABLE public.activity_invitations
            ADD CONSTRAINT fk_invitations_sender_profile 
            FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_invitations_recipient_profile'
    ) THEN
        ALTER TABLE public.activity_invitations
            ADD CONSTRAINT fk_invitations_recipient_profile 
            FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Enable Row Level Security
ALTER TABLE public.activity_invitations ENABLE ROW LEVEL SECURITY;

-- 2. Indexes for performance and high-speed query filtering
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON public.activity_invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient ON public.activity_invitations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient_status ON public.activity_invitations(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_created ON public.activity_invitations(created_at DESC);

-- 3. Row Level Security (RLS) Policies
DROP POLICY IF EXISTS "Users can view sent or received invitations" ON public.activity_invitations;
CREATE POLICY "Users can view sent or received invitations"
    ON public.activity_invitations FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can dispatch invitations" ON public.activity_invitations;
CREATE POLICY "Users can dispatch invitations"
    ON public.activity_invitations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);

DROP POLICY IF EXISTS "Users can update invitations" ON public.activity_invitations;
CREATE POLICY "Users can update invitations"
    ON public.activity_invitations FOR UPDATE
    TO authenticated
    USING (auth.uid() = recipient_id OR auth.uid() = sender_id)
    WITH CHECK (
        (auth.uid() = recipient_id AND status IN ('accepted', 'declined'))
        OR
        (auth.uid() = sender_id AND status = 'cancelled')
    );

DROP POLICY IF EXISTS "Users can delete sent invitations" ON public.activity_invitations;
CREATE POLICY "Users can delete sent invitations"
    ON public.activity_invitations FOR DELETE
    TO authenticated
    USING (auth.uid() = sender_id);

-- 4. Secure RPC: create_activity_invitation
-- Atomic validation, duplicate throttle protection, and insert
CREATE OR REPLACE FUNCTION public.create_activity_invitation(
    target_recipient_id UUID,
    input_activity_id TEXT,
    input_activity_title TEXT,
    input_custom_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    new_invitation_id UUID;
    recipient_name TEXT;
BEGIN
    -- Step 1: Verify authenticated user
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required. Please sign in.');
    END IF;

    -- Step 2: Prevent sending invitation to self
    IF current_uid = target_recipient_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot send an invitation to yourself.');
    END IF;

    -- Step 3: Verify recipient exists in profiles
    SELECT display_name INTO recipient_name
    FROM public.profiles
    WHERE id = target_recipient_id;

    IF recipient_name IS NULL THEN
        recipient_name := 'Friend';
    END IF;

    -- Step 4: Duplicate throttle protection (prevent duplicate clicks within 2 minutes)
    IF EXISTS (
        SELECT 1 FROM public.activity_invitations
        WHERE sender_id = current_uid
          AND recipient_id = target_recipient_id
          AND activity_id = input_activity_id
          AND status IN ('pending', 'sent')
          AND created_at > (NOW() - INTERVAL '2 minutes')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'An invitation for ' || input_activity_title || ' was recently sent to ' || recipient_name || '. Please wait for them to respond.'
        );
    END IF;

    -- Step 5: Insert invitation record
    INSERT INTO public.activity_invitations (
        sender_id,
        recipient_id,
        activity_id,
        activity_title,
        custom_note,
        status,
        created_at,
        updated_at,
        expires_at
    ) VALUES (
        current_uid,
        target_recipient_id,
        input_activity_id,
        input_activity_title,
        input_custom_note,
        'pending',
        NOW(),
        NOW(),
        NOW() + INTERVAL '24 hours'
    )
    RETURNING id INTO new_invitation_id;

    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', new_invitation_id,
        'recipient_name', recipient_name,
        'message', 'Invitation for ' || input_activity_title || ' sent to ' || recipient_name || '! ✨'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Secure RPC: get_user_invitations
-- Fetches invitations with sender and recipient display names, usernames, and avatars in a single query
CREATE OR REPLACE FUNCTION public.get_user_invitations(filter_mode TEXT DEFAULT 'all')
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    recipient_id UUID,
    activity_id TEXT,
    activity_title TEXT,
    custom_note TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    sender_display_name TEXT,
    sender_username TEXT,
    sender_avatar_url TEXT,
    recipient_display_name TEXT,
    recipient_username TEXT,
    recipient_avatar_url TEXT
) AS $$
DECLARE
    current_uid UUID := auth.uid();
BEGIN
    IF current_uid IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        i.id,
        i.sender_id,
        i.recipient_id,
        i.activity_id,
        i.activity_title,
        i.custom_note,
        i.status,
        i.created_at,
        i.updated_at,
        i.expires_at,
        COALESCE(sp.display_name, 'BreakTym Friend') AS sender_display_name,
        sp.username AS sender_username,
        sp.avatar_url AS sender_avatar_url,
        COALESCE(rp.display_name, 'BreakTym Friend') AS recipient_display_name,
        rp.username AS recipient_username,
        rp.avatar_url AS recipient_avatar_url
    FROM public.activity_invitations i
    LEFT JOIN public.profiles sp ON sp.id = i.sender_id
    LEFT JOIN public.profiles rp ON rp.id = i.recipient_id
    WHERE (
        (filter_mode = 'received' AND i.recipient_id = current_uid) OR
        (filter_mode = 'sent' AND i.sender_id = current_uid) OR
        (filter_mode = 'pending_received' AND i.recipient_id = current_uid AND i.status IN ('pending', 'sent')) OR
        (filter_mode = 'all' AND (i.sender_id = current_uid OR i.recipient_id = current_uid))
    )
    ORDER BY i.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Secure RPC: respond_to_activity_invitation
CREATE OR REPLACE FUNCTION public.respond_to_activity_invitation(
    input_invitation_id UUID,
    input_status TEXT
)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    inv_record public.activity_invitations%ROWTYPE;
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required. Please sign in.');
    END IF;

    IF input_status NOT IN ('accepted', 'declined') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid status. Must be accepted or declined.');
    END IF;

    SELECT * INTO inv_record
    FROM public.activity_invitations
    WHERE id = input_invitation_id;

    IF inv_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation not found.');
    END IF;

    -- Only the recipient can accept or decline
    IF inv_record.recipient_id <> current_uid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only respond to invitations sent to you.');
    END IF;

    IF inv_record.status NOT IN ('pending', 'sent') THEN
        RETURN jsonb_build_object('success', false, 'error', 'This invitation has already been ' || inv_record.status || '.');
    END IF;

    UPDATE public.activity_invitations
    SET status = input_status, updated_at = NOW()
    WHERE id = input_invitation_id;

    IF input_status = 'accepted' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Break invitation accepted! Enjoy your ' || inv_record.activity_title || ' ✨');
    ELSE
        RETURN jsonb_build_object('success', true, 'message', 'Break invitation declined.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Permissions
GRANT EXECUTE ON FUNCTION public.create_activity_invitation(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_invitations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_activity_invitation(UUID, TEXT) TO authenticated;

-- 8. Enable Realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_invitations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
