-- HackEurope Initial Database Schema
-- Migration 001: Core tables, indexes, and triggers

-- ============================================================================
-- Table 1: profiles (extends auth.users)
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Table 2: user_allergy_profiles
-- ============================================================================

CREATE TABLE public.user_allergy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  known_allergens TEXT[], -- e.g., ['pollen', 'dust', 'pet dander']
  allergy_history TEXT, -- Free-form user description
  seasonal_patterns JSONB, -- e.g., {"spring": "severe", "summer": "mild"}
  medications TEXT[],
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TRIGGER set_allergy_profiles_updated_at
  BEFORE UPDATE ON public.user_allergy_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Table 3: analysis_history
-- ============================================================================

CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File uploads (Supabase Storage URLs)
  eye_image_url TEXT NOT NULL,
  voice_recording_url TEXT,

  -- Location & environmental data
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  location_display_name TEXT,
  pollen_data JSONB, -- 7-day historical pollen data
  environmental_summary TEXT,

  -- User inputs
  symptom_description TEXT,
  allergy_history_snapshot TEXT,

  -- Step 1: Overall sickness assessment
  sickness_probability INTEGER NOT NULL CHECK (sickness_probability >= 0 AND sickness_probability <= 100),
  sickness_reasoning TEXT,

  -- Step 2: Allergy differentiation (only if sickness detected)
  allergy_probability INTEGER CHECK (allergy_probability IS NULL OR (allergy_probability >= 0 AND allergy_probability <= 100)),
  allergy_reasoning TEXT,

  -- Detailed outputs
  severity TEXT CHECK (severity IN ('none', 'mild', 'moderate', 'severe')),
  symptoms TEXT[],
  eye_analysis TEXT,
  voice_analysis JSONB,
  recommendations TEXT,
  should_see_doctor BOOLEAN DEFAULT FALSE,
  is_unilateral BOOLEAN DEFAULT FALSE,
  discharge_type TEXT,

  -- Metadata
  gemini_raw_response JSONB,
  analysis_version TEXT DEFAULT '2.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient user history queries
CREATE INDEX idx_analysis_user_created
  ON public.analysis_history(user_id, created_at DESC);

-- Index for severity filtering
CREATE INDEX idx_analysis_severity
  ON public.analysis_history(user_id, severity)
  WHERE severity != 'none';

-- Index for allergy-specific queries
CREATE INDEX idx_analysis_allergy
  ON public.analysis_history(user_id, allergy_probability)
  WHERE allergy_probability IS NOT NULL;

-- ============================================================================
-- Table 4: pollen_cache
-- ============================================================================

CREATE TABLE public.pollen_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  date DATE NOT NULL,
  pollen_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(latitude, longitude, date)
);

-- Index for efficient location-based lookups
CREATE INDEX idx_pollen_location_date
  ON public.pollen_cache(latitude, longitude, date DESC);

-- Index for cleanup of expired entries
CREATE INDEX idx_pollen_expires
  ON public.pollen_cache(expires_at)
  WHERE expires_at < NOW();

-- Auto-cleanup expired pollen cache entries (optional, can be run as cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_pollen_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.pollen_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper Views
-- ============================================================================

-- View for user statistics
CREATE OR REPLACE VIEW public.user_health_stats AS
SELECT
  user_id,
  COUNT(*) as total_checks,
  MAX(created_at) as last_check_date,
  AVG(sickness_probability) as avg_sickness_score,
  AVG(allergy_probability) FILTER (WHERE allergy_probability IS NOT NULL) as avg_allergy_score,
  COUNT(*) FILTER (WHERE severity = 'severe') as severe_count,
  COUNT(*) FILTER (WHERE should_see_doctor = true) as doctor_recommendation_count
FROM public.analysis_history
GROUP BY user_id;
