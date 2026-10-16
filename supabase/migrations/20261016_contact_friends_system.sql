-- Migration: 20261016_contact_friends_system.sql
-- Description: Complete Contact-Based Friends System for BreakTime
-- Author: BreakTime Team
-- Requirements:
--   - Contact discovery ONLY through phone numbers (NO usernames, NO public directory)
--   - Privacy-preserving contact matching via SECURITY DEFINER function
--   - Strict RLS policies and database constraints

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_friend_request CHECK (requester_id <> recipient_id),
    CONSTRAINT unique_active_request UNIQUE (requester_id, recipient_id)
);

-- Enable RLS on friend_requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 3. FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT canonical_user_ordering CHECK (user_id1 < user_id2),
    CONSTRAINT unique_friendship UNIQUE (user_id1, user_id2)
);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON public.friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient ON public.friend_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON public.friendships(user_id1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON public.friendships(user_id2);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view friends profiles" ON public.profiles;
CREATE POLICY "Users can view friends profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE (f.user_id1 = auth.uid() AND f.user_id2 = profiles.id)
               OR (f.user_id2 = auth.uid() AND f.user_id1 = profiles.id)
        )
        OR EXISTS (
            SELECT 1 FROM public.friend_requests r
            WHERE (r.requester_id = auth.uid() AND r.recipient_id = profiles.id)
               OR (r.recipient_id = auth.uid() AND r.requester_id = profiles.id)
        )
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Friend Requests RLS
DROP POLICY IF EXISTS "Users can view incoming or outgoing requests" ON public.friend_requests;
CREATE POLICY "Users can view incoming or outgoing requests"
    ON public.friend_requests FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can create friend requests" ON public.friend_requests;
CREATE POLICY "Users can create friend requests"
    ON public.friend_requests FOR INSERT
    WITH CHECK (
        auth.uid() = requester_id
        AND requester_id <> recipient_id
        AND NOT EXISTS (
            SELECT 1 FROM public.friendships
            WHERE (user_id1 = LEAST(requester_id, recipient_id) AND user_id2 = GREATEST(requester_id, recipient_id))
        )
    );

DROP POLICY IF EXISTS "Recipient can update friend request status" ON public.friend_requests;
CREATE POLICY "Recipient can update friend request status"
    ON public.friend_requests FOR UPDATE
    USING (auth.uid() = recipient_id OR auth.uid() = requester_id)
    WITH CHECK (
        (auth.uid() = recipient_id AND status IN ('accepted', 'declined'))
        OR
        (auth.uid() = requester_id AND status = 'cancelled')
    );

-- Friendships RLS
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships"
    ON public.friendships FOR SELECT
    USING (auth.uid() = user_id1 OR auth.uid() = user_id2);

DROP POLICY IF EXISTS "Users can remove their friendships" ON public.friendships;
CREATE POLICY "Users can remove their friendships"
    ON public.friendships FOR DELETE
    USING (auth.uid() = user_id1 OR auth.uid() = user_id2);

-- 5. FUNCTION & TRIGGER: Auto-create friendship when request is accepted
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO public.friendships (user_id1, user_id2)
        VALUES (
            LEAST(NEW.requester_id, NEW.recipient_id),
            GREATEST(NEW.requester_id, NEW.recipient_id)
        )
        ON CONFLICT (user_id1, user_id2) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_friend_request_accepted ON public.friend_requests;
CREATE TRIGGER trg_friend_request_accepted
    AFTER UPDATE OF status ON public.friend_requests
    FOR EACH ROW
    WHEN (NEW.status = 'accepted')
    EXECUTE FUNCTION public.handle_friend_request_accepted();

-- 6. PRIVACY-PRESERVING CONTACT MATCHING FUNCTION (SECURITY DEFINER)
-- Matches a batch of normalized phone numbers against registered users.
-- Does NOT reveal the entire user base or store the contact list.
CREATE OR REPLACE FUNCTION public.match_phone_contacts(phone_numbers TEXT[])
RETURNS TABLE (
    user_id UUID,
    phone_number TEXT,
    display_name TEXT,
    avatar_url TEXT,
    friendship_status TEXT
) AS $$
DECLARE
    current_uid UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.phone_number,
        p.display_name,
        p.avatar_url,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE (f.user_id1 = LEAST(current_uid, p.id) AND f.user_id2 = GREATEST(current_uid, p.id))
            ) THEN 'friends'
            WHEN EXISTS (
                SELECT 1 FROM public.friend_requests r
                WHERE r.requester_id = current_uid AND r.recipient_id = p.id AND r.status = 'pending'
            ) THEN 'pending_sent'
            WHEN EXISTS (
                SELECT 1 FROM public.friend_requests r
                WHERE r.requester_id = p.id AND r.recipient_id = current_uid AND r.status = 'pending'
            ) THEN 'pending_received'
            ELSE 'none'
        END AS friendship_status
    FROM public.profiles p
    WHERE p.phone_number = ANY(phone_numbers)
      AND p.id <> current_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
