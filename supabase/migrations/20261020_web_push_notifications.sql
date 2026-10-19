-- Migration: 20261020_web_push_notifications.sql
-- Description: Standards-based Web Push Subscriptions and Notification Management
-- Author: BreakTym Senior Engineering Team

-- 1. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_success_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ
);

-- Ensure all columns exist if partially created
ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id 
    ON public.push_subscriptions(user_id) 
    WHERE disabled_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_endpoint 
    ON public.push_subscriptions(endpoint);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
    ON public.push_subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own push subscriptions"
    ON public.push_subscriptions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions"
    ON public.push_subscriptions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions"
    ON public.push_subscriptions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. SECURE RPC: upsert_push_subscription
-- Safely registers or updates a device push endpoint for the authenticated user
CREATE OR REPLACE FUNCTION public.upsert_push_subscription(
    input_endpoint TEXT,
    input_p256dh TEXT,
    input_auth TEXT,
    input_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    sub_id UUID;
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
    END IF;

    IF input_endpoint IS NULL OR length(trim(input_endpoint)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid endpoint.');
    END IF;

    INSERT INTO public.push_subscriptions (
        user_id,
        endpoint,
        p256dh,
        auth,
        user_agent,
        updated_at,
        disabled_at
    ) VALUES (
        current_uid,
        input_endpoint,
        input_p256dh,
        input_auth,
        input_user_agent,
        NOW(),
        NULL
    )
    ON CONFLICT (endpoint) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = COALESCE(EXCLUDED.user_agent, public.push_subscriptions.user_agent),
        updated_at = NOW(),
        disabled_at = NULL
    RETURNING id INTO sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', sub_id,
        'message', 'Push subscription registered successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SECURE RPC: deactivate_push_subscription
-- Deactivates an endpoint when the user opts out or unregisters
CREATE OR REPLACE FUNCTION public.deactivate_push_subscription(
    input_endpoint TEXT
)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
    END IF;

    UPDATE public.push_subscriptions
    SET disabled_at = NOW(),
        updated_at = NOW()
    WHERE endpoint = input_endpoint AND user_id = current_uid;

    RETURN jsonb_build_object('success', true, 'message', 'Push subscription deactivated.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.upsert_push_subscription(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_push_subscription(TEXT) TO authenticated;

-- 7. NOTIFY POSTGREST SCHEMA CACHE RELOAD
NOTIFY pgrst, 'reload schema';
