-- Migration: 20261017_auth_profile_automation.sql
-- Description: Automatic user profile creation on auth signup, updated_at automation, and RLS hardening.
-- Author: BreakTym Team

-- 1. AUTOMATIC PROFILE CREATION TRIGGER FUNCTION (SECURITY DEFINER)
-- Automatically inserts a row into public.profiles whenever a new user registers in auth.users.
-- Extracts metadata (display_name, phone, avatar) if provided, assigns a fresh unique qr_token,
-- and uses ON CONFLICT (id) DO NOTHING / DO UPDATE to ensure zero duplicate profiles or race conditions.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_display_name TEXT;
    initial_qr_token TEXT;
BEGIN
    initial_display_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        'BreakTym Member'
    );
    initial_qr_token := encode(gen_random_bytes(16), 'hex');

    INSERT INTO public.profiles (
        id,
        display_name,
        phone_number,
        avatar_url,
        bio,
        qr_token,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        initial_display_name,
        NEW.phone,
        NEW.raw_user_meta_data->>'avatar_url',
        'Living for spontaneous moments ✨',
        initial_qr_token,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        phone_number = COALESCE(public.profiles.phone_number, EXCLUDED.phone_number),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Prevent blocking the auth user transaction if an edge case occurs
        RAISE WARNING 'handle_new_user notice: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_friend_requests_updated_at ON public.friend_requests;
CREATE TRIGGER set_friend_requests_updated_at
    BEFORE UPDATE ON public.friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_activity_invitations_updated_at ON public.activity_invitations;
CREATE TRIGGER set_activity_invitations_updated_at
    BEFORE UPDATE ON public.activity_invitations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. RLS HARDENING: Ensure users cannot alter profile ID or impersonate others
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
