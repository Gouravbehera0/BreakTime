-- Migration: 20261018_invitation_celebration_and_streaks.sql
-- Description: Invitation Acceptance Celebration visible to both users and Acceptance Streaks (non-daily)
-- Author: BreakTym Senior Engineering Team

-- 1. EXTEND public.activity_invitations WITH CELEBRATION & MEETING TRACKING
ALTER TABLE public.activity_invitations
    ADD COLUMN IF NOT EXISTS meeting_status TEXT NOT NULL DEFAULT 'pending' CHECK (meeting_status IN ('pending', 'completed', 'cancelled', 'missed')),
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS headline TEXT,
    ADD COLUMN IF NOT EXISTS sender_celebrated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS recipient_celebrated_at TIMESTAMPTZ;

-- 2. CREATE INDEXES FOR FAST STREAK COUNTS & CELEBRATION QUERIES
CREATE INDEX IF NOT EXISTS idx_invitations_sender_accepted ON public.activity_invitations(sender_id) WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_invitations_pair_accepted ON public.activity_invitations(sender_id, recipient_id) WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_invitations_meeting_status ON public.activity_invitations(meeting_status);

-- 3. SECURE RPC: respond_to_activity_invitation (UPDATED WITH ATOMIC CELEBRATION & MEETING STATUS)
CREATE OR REPLACE FUNCTION public.respond_to_activity_invitation(
    input_invitation_id UUID,
    input_status TEXT
)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    inv_record public.activity_invitations%ROWTYPE;
    selected_headline TEXT;
    sender_name TEXT;
    recipient_name TEXT;
    p_streak INT;
    f_streak INT;
BEGIN
    -- Step 1: Verify authenticated user
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required. Please sign in.');
    END IF;

    -- Step 2: Validate status
    IF input_status = 'declined' THEN
        input_status := 'rejected';
    ELSIF input_status NOT IN ('accepted', 'rejected') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid status. Must be accepted or rejected.');
    END IF;

    -- Step 3: Fetch invitation
    SELECT * INTO inv_record
    FROM public.activity_invitations
    WHERE id = input_invitation_id;

    IF inv_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation not found.');
    END IF;

    -- Step 4: Strict authorization: only recipient can accept or reject
    IF inv_record.recipient_id <> current_uid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only respond to invitations sent to you.');
    END IF;

    -- Step 5: Idempotency check - prevent duplicate transitions & duplicate streak increments
    IF inv_record.status NOT IN ('pending', 'sent') THEN
        IF inv_record.status = input_status OR (input_status = 'rejected' AND inv_record.status = 'declined') THEN
            SELECT COUNT(DISTINCT id)::INT INTO p_streak
            FROM public.activity_invitations
            WHERE sender_id = inv_record.sender_id AND status = 'accepted';

            SELECT COUNT(DISTINCT id)::INT INTO f_streak
            FROM public.activity_invitations
            WHERE ((sender_id = inv_record.sender_id AND recipient_id = inv_record.recipient_id)
                OR (sender_id = inv_record.recipient_id AND recipient_id = inv_record.sender_id))
              AND status = 'accepted';

            RETURN jsonb_build_object(
                'success', true,
                'message', 'Invitation is already ' || inv_record.status || '.',
                'invitation_id', input_invitation_id,
                'status', inv_record.status,
                'meeting_status', COALESCE(inv_record.meeting_status, 'pending'),
                'headline', inv_record.headline,
                'personal_streak', p_streak,
                'friendship_streak', f_streak
            );
        END IF;

        RETURN jsonb_build_object('success', false, 'error', 'This invitation has already been ' || inv_record.status || '.');
    END IF;

    -- Step 6: Fetch display names for response
    SELECT COALESCE(display_name, 'Friend') INTO sender_name FROM public.profiles WHERE id = inv_record.sender_id;
    SELECT COALESCE(display_name, 'Friend') INTO recipient_name FROM public.profiles WHERE id = inv_record.recipient_id;

    IF input_status = 'accepted' THEN
        -- Deterministically select one canonical headline consistent for both users
        selected_headline := CASE (abs(hashtext(inv_record.id::text)) % 5)
            WHEN 0 THEN 'IT''S A PLAN! 🔥'
            WHEN 1 THEN 'THE VIBE IS CONFIRMED! 💜'
            WHEN 2 THEN 'PLOT TWIST: THEY SAID YES! 👀'
            WHEN 3 THEN 'THAT''S A YES. 💌'
            ELSE 'A MOMENT IN THE MAKING ✨'
        END;

        -- Atomic update: transition to accepted, initialize meeting_status as 'pending'
        -- Note: recipient_celebrated_at remains NULL until acknowledged by user
        UPDATE public.activity_invitations
        SET status = 'accepted',
            meeting_status = 'pending',
            accepted_at = NOW(),
            headline = selected_headline,
            updated_at = NOW()
        WHERE id = input_invitation_id;

        -- Calculate fresh personal streak for sender (unique accepted invitations)
        SELECT COUNT(DISTINCT id)::INT INTO p_streak
        FROM public.activity_invitations
        WHERE sender_id = inv_record.sender_id AND status = 'accepted';

        -- Calculate fresh friendship streak between this pair
        SELECT COUNT(DISTINCT id)::INT INTO f_streak
        FROM public.activity_invitations
        WHERE ((sender_id = inv_record.sender_id AND recipient_id = inv_record.recipient_id)
            OR (sender_id = inv_record.recipient_id AND recipient_id = inv_record.sender_id))
          AND status = 'accepted';

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Break invitation accepted! Enjoy your ' || inv_record.activity_title || ' ✨',
            'invitation_id', input_invitation_id,
            'status', 'accepted',
            'meeting_status', 'pending',
            'headline', selected_headline,
            'activity_title', inv_record.activity_title,
            'sender_id', inv_record.sender_id,
            'sender_name', sender_name,
            'recipient_id', inv_record.recipient_id,
            'recipient_name', recipient_name,
            'personal_streak', p_streak,
            'friendship_streak', f_streak
        );
    ELSE
        -- Decline / reject transition
        UPDATE public.activity_invitations
        SET status = 'rejected',
            meeting_status = 'cancelled',
            updated_at = NOW()
        WHERE id = input_invitation_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Break invitation declined.',
            'invitation_id', input_invitation_id,
            'status', 'rejected',
            'meeting_status', 'cancelled'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SECURE RPC: mark_invitation_celebrated
-- Marks that the celebration has been displayed and acknowledged by the user
CREATE OR REPLACE FUNCTION public.mark_invitation_celebrated(
    input_invitation_id UUID,
    input_role TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    inv_record public.activity_invitations%ROWTYPE;
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
    END IF;

    SELECT * INTO inv_record
    FROM public.activity_invitations
    WHERE id = input_invitation_id;

    IF inv_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation not found.');
    END IF;

    IF current_uid = inv_record.sender_id THEN
        UPDATE public.activity_invitations
        SET sender_celebrated_at = NOW()
        WHERE id = input_invitation_id;
        RETURN jsonb_build_object('success', true, 'role', 'sender');
    ELSIF current_uid = inv_record.recipient_id THEN
        UPDATE public.activity_invitations
        SET recipient_celebrated_at = NOW()
        WHERE id = input_invitation_id;
        RETURN jsonb_build_object('success', true, 'role', 'recipient');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You are not a participant in this invitation.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SECURE RPC: get_invitation_streaks
-- Returns personal acceptance streak (invites sent by user that were accepted)
-- and friendship streak (accepted invites between user and a friend in either direction)
CREATE OR REPLACE FUNCTION public.get_invitation_streaks(
    target_friend_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    personal_streak INT := 0;
    friendship_streak INT := 0;
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('personal_streak', 0, 'friendship_streak', 0);
    END IF;

    -- Metric A: Personal streak - unique invitations sent by current user that were accepted
    SELECT COUNT(DISTINCT id)::INT INTO personal_streak
    FROM public.activity_invitations
    WHERE sender_id = current_uid
      AND status = 'accepted';

    -- Metric B: Friendship streak - unique accepted invitations between this pair in either direction
    IF target_friend_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT id)::INT INTO friendship_streak
        FROM public.activity_invitations
        WHERE ((sender_id = current_uid AND recipient_id = target_friend_id)
            OR (sender_id = target_friend_id AND recipient_id = current_uid))
          AND status = 'accepted';
    END IF;

    RETURN jsonb_build_object(
        'personal_streak', personal_streak,
        'friendship_streak', friendship_streak
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. SECURE RPC: get_user_invitations (UPDATED WITH MEETING STATUS & CELEBRATION FIELDS)
CREATE OR REPLACE FUNCTION public.get_user_invitations(filter_mode TEXT DEFAULT 'all')
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    recipient_id UUID,
    activity_id TEXT,
    activity_title TEXT,
    custom_note TEXT,
    status TEXT,
    meeting_status TEXT,
    headline TEXT,
    accepted_at TIMESTAMPTZ,
    sender_celebrated_at TIMESTAMPTZ,
    recipient_celebrated_at TIMESTAMPTZ,
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
        COALESCE(i.meeting_status, 'pending') AS meeting_status,
        i.headline,
        i.accepted_at,
        i.sender_celebrated_at,
        i.recipient_celebrated_at,
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

-- 7. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.respond_to_activity_invitation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invitation_celebrated(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_streaks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_invitations(TEXT) TO authenticated;

-- 8. REALTIME PUBLICATION VERIFICATION
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_invitations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
