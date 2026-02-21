# Supabase Setup Guide

This guide walks you through setting up the Supabase backend for HackEurope.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Supabase account (sign up at https://supabase.com)

## Option 1: Hosted Supabase (Recommended for Production)

### Step 1: Create a New Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: `hackeurope`
   - **Database Password**: (generate strong password and save it securely)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for provisioning (~2 minutes)

### Step 2: Get Your Project Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (for client-side use)
   - **service_role** key (for server-side use - keep secret!)

### Step 3: Link Your Local Project

```bash
# Login to Supabase CLI
supabase login

# Link to your remote project
cd /Users/vladmanea/hackeurope
supabase link --project-ref <your-project-ref>

# Your project ref is the subdomain from your Project URL
# e.g., if URL is https://abcdefgh.supabase.co, ref is "abcdefgh"
```

### Step 4: Run Migrations

```bash
# Apply all migrations to your remote database
supabase db push

# Verify migrations were applied
supabase db remote list
```

### Step 5: Create Storage Buckets

**Via Supabase Dashboard:**

1. Go to **Storage** section
2. Click "Create bucket"
3. Create first bucket:
   - **Name**: `eye-images`
   - **Public**: Unchecked (private)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`
4. Create second bucket:
   - **Name**: `voice-recordings`
   - **Public**: Unchecked (private)
   - **File size limit**: 25 MB
   - **Allowed MIME types**: `audio/m4a`, `audio/mp4`, `audio/wav`, `audio/mpeg`

**Or via CLI:**

```bash
# Create buckets (file size limits set via dashboard)
supabase storage create eye-images --public false
supabase storage create voice-recordings --public false
```

### Step 6: Generate TypeScript Types

```bash
# Generate types from your database schema
npx supabase gen types typescript --linked > packages/shared/src/database.types.ts
```

### Step 7: Configure Environment Variables

**For Mobile App** (`apps/mobile/.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**For Backend** (`apps/server/.env`):

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_POLLEN_API_KEY=your_pollen_api_key
```

---

## Option 2: Local Development with Supabase CLI

For local development and testing:

### Step 1: Initialize Local Supabase

```bash
cd /Users/vladmanea/hackeurope
supabase init
```

### Step 2: Start Local Supabase

```bash
supabase start
```

This will start:
- PostgreSQL database (port 54322)
- Kong API Gateway (port 8000)
- Studio UI (http://localhost:54323)

### Step 3: Apply Migrations

```bash
# Migrations are automatically applied on start
# To manually reset and reapply:
supabase db reset
```

### Step 4: Get Local Credentials

```bash
supabase status
```

Copy the output values:
- API URL: `http://localhost:54321`
- anon key
- service_role key

### Step 5: Configure Local Environment

**Mobile App** (`apps/mobile/.env.local`):

```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
```

**Backend** (`apps/server/.env.local`):

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
```

---

## Verification Steps

### 1. Check Database Schema

```bash
# Connect to your database
supabase db remote connect

# Or for local:
psql postgresql://postgres:postgres@localhost:54322/postgres
```

**Verify tables exist:**

```sql
\dt public.*

-- Should show:
-- public.profiles
-- public.user_allergy_profiles
-- public.analysis_history
-- public.pollen_cache
```

### 2. Test RLS Policies

**Via Supabase Studio:**

1. Go to **Table Editor**
2. Try to insert a row in `profiles` without authentication (should fail)
3. Use the "Auth" tab to create a test user
4. Try to insert again with that user's JWT (should succeed)

**Via SQL:**

```sql
-- Set the JWT token context (use a real token from auth)
SET request.jwt.claim.sub = '<user-uuid>';

-- Try to select from profiles (should only return that user's profile)
SELECT * FROM public.profiles;
```

### 3. Test Storage Buckets

**Via Supabase Studio:**

1. Go to **Storage** section
2. Click on `eye-images` bucket
3. Try to upload a file
4. Verify it appears in the bucket

**Via Code:**

```typescript
import { supabase } from './lib/supabase';

// Test upload
const { data, error } = await supabase.storage
  .from('eye-images')
  .upload('test/sample.jpg', fileBlob);

console.log('Upload result:', { data, error });
```

---

## Troubleshooting

### Issue: Migrations fail with "permission denied"

**Solution:** Ensure you're using the correct project ref and have owner access to the project.

### Issue: Storage policies not working

**Solution:**
1. Verify buckets were created with correct names (`eye-images`, `voice-recordings`)
2. Check that RLS is enabled on `storage.objects` table
3. Verify file paths follow pattern: `{user_id}/{filename}`

### Issue: TypeScript types not generating

**Solution:**

```bash
# Ensure you're linked to the project
supabase link --project-ref <your-project-ref>

# Try generating again
npx supabase gen types typescript --linked > packages/shared/src/database.types.ts

# For local development:
npx supabase gen types typescript --local > packages/shared/src/database.types.ts
```

### Issue: RLS policies too restrictive

**Solution:** Check your JWT token includes the correct user ID:

```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);
```

---

## Migration Management

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new <migration_name>

# Edit the file in supabase/migrations/
# Then apply it:
supabase db push
```

### Rolling Back Migrations

```bash
# Reset to a specific migration
supabase db reset --version <migration_version>

# Reset entire database (DESTRUCTIVE)
supabase db reset
```

---

## Next Steps

After completing Supabase setup:

1. ✅ Proceed to **Phase 2: Monorepo Restructuring**
2. ✅ Implement authentication in **Phase 3**
3. ✅ Start building the three-page app

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Documentation](https://supabase.com/docs/guides/storage)
- [CLI Reference](https://supabase.com/docs/reference/cli)
