-- ============================================================================
-- HackEurope Complete Database Setup
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- PART 1: INITIAL SCHEMA
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE public.user_allergy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  known_allergens TEXT[],
  allergy_history TEXT,
  seasonal_patterns JSONB,
  medications TEXT[],
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TRIGGER set_allergy_profiles_updated_at
  BEFORE UPDATE ON public.user_allergy_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eye_image_url TEXT NOT NULL,
  voice_recording_url TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  location_display_name TEXT,
  pollen_data JSONB,
  environmental_summary TEXT,
  symptom_description TEXT,
  allergy_history_snapshot TEXT,
  sickness_probability INTEGER NOT NULL CHECK (sickness_probability >= 0 AND sickness_probability <= 100),
  sickness_reasoning TEXT,
  allergy_probability INTEGER CHECK (allergy_probability IS NULL OR (allergy_probability >= 0 AND allergy_probability <= 100)),
  allergy_reasoning TEXT,
  severity TEXT CHECK (severity IN ('none', 'mild', 'moderate', 'severe')),
  symptoms TEXT[],
  eye_analysis TEXT,
  voice_analysis JSONB,
  recommendations TEXT,
  should_see_doctor BOOLEAN DEFAULT FALSE,
  is_unilateral BOOLEAN DEFAULT FALSE,
  discharge_type TEXT,
  gemini_raw_response JSONB,
  analysis_version TEXT DEFAULT '2.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_user_created ON public.analysis_history(user_id, created_at DESC);
CREATE INDEX idx_analysis_severity ON public.analysis_history(user_id, severity) WHERE severity != 'none';
CREATE INDEX idx_analysis_allergy ON public.analysis_history(user_id, allergy_probability) WHERE allergy_probability IS NOT NULL;

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

CREATE INDEX idx_pollen_location_date ON public.pollen_cache(latitude, longitude, date DESC);

-- PART 2: ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allergy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pollen_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own allergy profile" ON public.user_allergy_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own allergy profile" ON public.user_allergy_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own allergy profile" ON public.user_allergy_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own allergy profile" ON public.user_allergy_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analyses" ON public.analysis_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analysis_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON public.analysis_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.analysis_history FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read pollen cache" ON public.pollen_cache FOR SELECT TO authenticated USING (true);

-- PART 3: STORAGE POLICIES
-- ============================================================================

CREATE POLICY "Users can upload own eye images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'eye-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own eye images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'eye-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own eye images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'eye-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'eye-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own eye images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'eye-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own voice recordings" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own voice recordings" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own voice recordings" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own voice recordings" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
