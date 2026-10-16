-- Migration: 20261016_activity_invitations.sql
-- Description: Activity Invitations System for BreakTym
-- Author: BreakTym Team

-- 1. ACTIVITY INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.activity_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL,
    activity_title TEXT NOT NULL,
    custom_note TEXT,
    status TEXT NOT NULL CHECK (status IN ('sent', 'accepted', 'declined', 'expired')) DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_invitation CHECK (sender_id <> recipient_id)
);

-- Enable RLS
ALTER TABLE public.activity_invitations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON public.activity_invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient ON public.activity_invitations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_invitations_created ON public.activity_invitations(created_at DESC);

-- RLS Policies
DROP POLICY IF EXISTS "Users can view sent or received invitations" ON public.activity_invitations;
CREATE POLICY "Users can view sent or received invitations"
    ON public.activity_invitations FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can dispatch invitations" ON public.activity_invitations;
CREATE POLICY "Users can dispatch invitations"
    ON public.activity_invitations FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);

DROP POLICY IF EXISTS "Recipient can update invitation status" ON public.activity_invitations;
CREATE POLICY "Recipient can update invitation status"
    ON public.activity_invitations FOR UPDATE
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id AND status IN ('accepted', 'declined'));
