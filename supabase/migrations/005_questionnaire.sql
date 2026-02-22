-- PollenCast: store onboarding health questionnaire on profiles
-- Run in Supabase Dashboard -> SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS had_allergies BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS respiratory_issues BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS immunocompromised BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN public.profiles.had_allergies IS 'From onboarding: Have you had allergies before?';
COMMENT ON COLUMN public.profiles.respiratory_issues IS 'From onboarding: Do you have any respiratory issues?';
COMMENT ON COLUMN public.profiles.immunocompromised IS 'From onboarding: Are you immunocompromised?';
