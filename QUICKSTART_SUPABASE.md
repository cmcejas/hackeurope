# Supabase Quick Start (5 minutes)

## Step 1: Create Supabase Project (2 min)

1. Go to https://supabase.com
2. Click **"New Project"**
3. Fill in:
   - Name: `hackeurope`
   - Database Password: (generate strong password - SAVE IT!)
   - Region: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

## Step 2: Run Database Setup (1 min)

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy ALL content from `supabase/SETUP_ALL.sql`
4. Paste into the editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"

## Step 3: Create Storage Buckets (1 min)

1. Go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**

**Bucket 1:**
- Name: `eye-images`
- Public: **OFF** (keep private)
- File size limit: `10 MB`
- Allowed MIME types: `image/jpeg, image/png`

**Bucket 2:**
- Name: `voice-recordings`
- Public: **OFF**
- File size limit: `25 MB`
- Allowed MIME types: `audio/m4a, audio/mp4, audio/wav`

## Step 4: Get Your API Keys (1 min)

1. Go to **Settings** → **API** (left sidebar)
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (KEEP SECRET!)
```

## Step 5: Add to .env file

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## ✅ Verification

Go to **Table Editor** → You should see:
- ✅ profiles
- ✅ user_allergy_profiles
- ✅ analysis_history
- ✅ pollen_cache

Go to **Storage** → You should see:
- ✅ eye-images bucket
- ✅ voice-recordings bucket

## Next: Create Login Page

Once you see all tables and buckets, you're ready to build the login page!
