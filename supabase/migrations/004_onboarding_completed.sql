-- PollenCast: track whether user has completed onboarding (shown once per account)
-- Run this in Supabase Dashboard -> SQL Editor -> New query

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Set when the user completes the first-time onboarding.';
