-- HackEurope Storage Bucket Policies
-- Migration 003: Set up storage buckets and access policies

-- ============================================================================
-- Storage Bucket Configuration
-- ============================================================================

-- Note: Buckets must be created via Supabase Dashboard or CLI first
-- These are the SQL policies that govern access to files in those buckets

-- Bucket 1: eye-images (private)
-- Bucket 2: voice-recordings (private)

-- ============================================================================
-- Eye Images Bucket Policies
-- ============================================================================

-- Policy: Users can upload their own eye images
-- Files should be stored with user ID as prefix: {user_id}/{filename}
CREATE POLICY "Users can upload own eye images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'eye-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own eye images
CREATE POLICY "Users can view own eye images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'eye-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own eye images (for overwriting)
CREATE POLICY "Users can update own eye images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'eye-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'eye-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own eye images
CREATE POLICY "Users can delete own eye images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'eye-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Voice Recordings Bucket Policies
-- ============================================================================

-- Policy: Users can upload their own voice recordings
CREATE POLICY "Users can upload own voice recordings"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own voice recordings
CREATE POLICY "Users can view own voice recordings"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own voice recordings
CREATE POLICY "Users can update own voice recordings"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own voice recordings
CREATE POLICY "Users can delete own voice recordings"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Service Role Access (Backend)
-- ============================================================================

-- The service role has full access to all buckets by default
-- No additional policies needed, but documented here for clarity:
-- - Backend can download any file using service role key
-- - Backend can upload files on behalf of users
-- - Backend should still organize files by user_id for RLS compatibility

-- ============================================================================
-- Storage Helper Functions
-- ============================================================================

-- Function to get user's storage path
CREATE OR REPLACE FUNCTION public.get_user_storage_path(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN user_uuid::text || '/';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_storage_path(UUID) TO authenticated;

-- ============================================================================
-- Bucket Creation Instructions (via Supabase CLI or Dashboard)
-- ============================================================================

-- Run these commands via Supabase CLI after applying migrations:
--
-- supabase storage create eye-images --public false
-- supabase storage create voice-recordings --public false
--
-- Or via Dashboard:
-- 1. Go to Storage section
-- 2. Create bucket "eye-images" (Private, max file size: 10MB)
-- 3. Create bucket "voice-recordings" (Private, max file size: 25MB)
-- 4. Configure allowed MIME types:
--    - eye-images: image/jpeg, image/png
--    - voice-recordings: audio/m4a, audio/mp4, audio/wav, audio/mpeg
