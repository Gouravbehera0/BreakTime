-- Migration: 20261017_flexible_friend_discovery.sql
-- Description: Flexible Friend Discovery System for BreakTym
-- Features:
--   1. Personal QR Code with secure, revocable token (resolve_profile_by_qr_token, regenerate_qr_token)
--   2. Optional Unique Username with case-insensitive uniqueness and validation (search_profiles_by_username, check_username_available)
--   3. Preservation of existing contact matching and friendships

-- 1. ADD USERNAME & QR_TOKEN TO PROFILES
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS qr_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');

-- Generate qr_token for any existing profiles that don't have one
UPDATE public.profiles 
SET qr_token = encode(gen_random_bytes(16), 'hex') 
WHERE qr_token IS NULL;

-- Enforce case-insensitive unique username constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
    ON public.profiles(LOWER(username)) 
    WHERE username IS NOT NULL;

-- Enforce unique qr_token constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_qr_token 
    ON public.profiles(qr_token) 
    WHERE qr_token IS NOT NULL;

-- Check constraint for username format: 3-20 characters, alphanumeric and underscore only
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS valid_username_format;

ALTER TABLE public.profiles
    ADD CONSTRAINT valid_username_format
    CHECK (username IS NULL OR (LENGTH(username) >= 3 AND LENGTH(username) <= 20 AND username ~ '^[a-zA-Z0-9_]+$'));

-- 2. CHECK USERNAME AVAILABILITY FUNCTION
CREATE OR REPLACE FUNCTION public.check_username_available(requested_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_username TEXT := LOWER(TRIM(requested_username));
    current_uid UUID := auth.uid();
BEGIN
    IF clean_username IS NULL OR clean_username = '' THEN
        RETURN FALSE;
    END IF;

    -- Check format
    IF NOT (LENGTH(clean_username) >= 3 AND LENGTH(clean_username) <= 20 AND clean_username ~ '^[a-z0-9_]+$') THEN
        RETURN FALSE;
    END IF;

    -- Return true if no other user has taken this username
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE LOWER(username) = clean_username
          AND (current_uid IS NULL OR id <> current_uid)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SEARCH PROFILES BY USERNAME FUNCTION
-- Returns public profile information only. Zero phone numbers or emails exposed.
CREATE OR REPLACE FUNCTION public.search_profiles_by_username(
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
    clean_query TEXT := LOWER(TRIM(search_query));
    current_uid UUID := auth.uid();
BEGIN
    IF clean_query IS NULL OR LENGTH(clean_query) < 2 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.display_name,
        p.username,
        p.avatar_url,
        p.bio,
        CASE
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE (f.user_id1 = LEAST(current_uid, p.id) AND f.user_id2 = GREATEST(current_uid, p.id))
            ) THEN 'friends'
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friend_requests r
                WHERE r.requester_id = current_uid AND r.recipient_id = p.id AND r.status = 'pending'
            ) THEN 'pending_sent'
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friend_requests r
                WHERE r.requester_id = p.id AND r.recipient_id = current_uid AND r.status = 'pending'
            ) THEN 'pending_received'
            ELSE 'none'
        END AS friendship_status
    FROM public.profiles p
    WHERE (LOWER(p.username) LIKE clean_query || '%' OR LOWER(p.display_name) LIKE clean_query || '%')
      AND (current_uid IS NULL OR p.id <> current_uid)
    ORDER BY 
        CASE WHEN LOWER(p.username) = clean_query THEN 1 ELSE 2 END,
        p.display_name ASC
    LIMIT LEAST(max_results, 25);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RESOLVE PROFILE BY QR TOKEN FUNCTION
-- Resolves an opaque QR token to the owner's public profile and mutual friendship state.
-- Zero private credentials, phone numbers, or emails are exposed.
CREATE OR REPLACE FUNCTION public.resolve_profile_by_qr_token(token_input TEXT)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    friendship_status TEXT
) AS $$
DECLARE
    clean_token TEXT := TRIM(token_input);
    current_uid UUID := auth.uid();
    target_profile public.profiles%ROWTYPE;
BEGIN
    IF clean_token IS NULL OR clean_token = '' THEN
        RETURN;
    END IF;

    SELECT * INTO target_profile
    FROM public.profiles
    WHERE qr_token = clean_token;

    IF target_profile.id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        target_profile.id AS user_id,
        target_profile.display_name,
        target_profile.username,
        target_profile.avatar_url,
        target_profile.bio,
        CASE
            WHEN current_uid IS NOT NULL AND target_profile.id = current_uid THEN 'self'
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE (f.user_id1 = LEAST(current_uid, target_profile.id) AND f.user_id2 = GREATEST(current_uid, target_profile.id))
            ) THEN 'friends'
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friend_requests r
                WHERE r.requester_id = current_uid AND r.recipient_id = target_profile.id AND r.status = 'pending'
            ) THEN 'pending_sent'
            WHEN current_uid IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friend_requests r
                WHERE r.requester_id = target_profile.id AND r.recipient_id = current_uid AND r.status = 'pending'
            ) THEN 'pending_received'
            ELSE 'none'
        END AS friendship_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REGENERATE QR TOKEN FUNCTION (REVOCATION)
-- Allows a user to revoke their existing QR code and issue a brand-new unguessable token.
CREATE OR REPLACE FUNCTION public.regenerate_qr_token()
RETURNS TEXT AS $$
DECLARE
    new_token TEXT := encode(gen_random_bytes(16), 'hex');
    current_uid UUID := auth.uid();
BEGIN
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.profiles
    SET qr_token = new_token,
        updated_at = NOW()
    WHERE id = current_uid;

    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
