-- HackEurope Row Level Security Policies
-- Migration 002: Enable RLS and create policies for all tables

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allergy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Note: pollen_cache is shared across users, no RLS needed
-- But we still enable it for future flexibility
ALTER TABLE public.pollen_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Profiles Table Policies
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but explicit for safety)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- User Allergy Profiles Policies
-- ============================================================================

-- Users can view their own allergy profile
CREATE POLICY "Users can view own allergy profile"
  ON public.user_allergy_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own allergy profile
CREATE POLICY "Users can insert own allergy profile"
  ON public.user_allergy_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own allergy profile
CREATE POLICY "Users can update own allergy profile"
  ON public.user_allergy_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own allergy profile
CREATE POLICY "Users can delete own allergy profile"
  ON public.user_allergy_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Analysis History Policies
-- ============================================================================

-- Users can view their own analysis history
CREATE POLICY "Users can view own analyses"
  ON public.analysis_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
  ON public.analysis_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses (for edits/notes)
CREATE POLICY "Users can update own analyses"
  ON public.analysis_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON public.analysis_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Pollen Cache Policies
-- ============================================================================

-- All authenticated users can read pollen cache (shared resource)
CREATE POLICY "Authenticated users can read pollen cache"
  ON public.pollen_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update pollen cache (backend only)
-- This is handled by the service role key, not RLS
-- But we add a policy for explicit documentation
CREATE POLICY "Service role can manage pollen cache"
  ON public.pollen_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Helper Function for Anonymous Access (if needed in future)
-- ============================================================================

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant select on all tables to authenticated users (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant insert/update/delete on user-owned tables
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_allergy_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.analysis_history TO authenticated;

-- Grant select on pollen cache to authenticated (read-only for users)
GRANT SELECT ON public.pollen_cache TO authenticated;

-- Grant access to sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.is_authenticated() TO authenticated, anon;
