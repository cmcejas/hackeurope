# Merge Instructions - Supabase Integration

## 📦 What's in this commit?

This commit adds **Supabase authentication and database integration** to HackEurope:

- ✅ PostgreSQL database with 4 tables (profiles, allergies, analysis history, pollen cache)
- ✅ Row Level Security (RLS) for user data isolation
- ✅ Login/Signup screens with beautiful UI
- ✅ Auth routing (auto-redirect based on login state)
- ✅ Monorepo structure (`apps/mobile/` for Expo app)

---

## 🔀 How to Merge

### 1. Pull the latest changes

```bash
git pull origin master
```

### 2. Install dependencies

```bash
cd apps/mobile
npm install
```

**New dependencies added:**
- `@supabase/supabase-js` - Supabase client
- `expo-secure-store` - Secure session storage
- `react-native-url-polyfill` - URL polyfill for React Native

---

## ⚙️ Setup for Your Environment

### 1. Create Supabase Project (5 min)

Follow the guide: **`QUICKSTART_SUPABASE.md`**

**Quick steps:**
1. Go to https://supabase.com
2. Create new project called `hackeurope`
3. Go to **SQL Editor** → Paste content from `supabase/SETUP_ALL.sql` → Run
4. Go to **Storage** → Create buckets: `eye-images` and `voice-recordings`

### 2. Get API Keys

1. Supabase Dashboard → Settings (⚙️) → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...`

### 3. Create Environment File

```bash
cd apps/mobile
cp .env.example .env
```

Edit `.env` and fill in YOUR values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

⚠️ **Important:** Make sure URL ends with `.supabase.co` (NOT `.com`)

### 4. Run the App

```bash
cd apps/mobile
npm start
```

Press `i` for iOS or `a` for Android

**Expected:** You should see a login screen! 🎉

---

## 🧪 Testing

1. **Create account**: Click "Sign Up" and register
2. **Check database**: Go to Supabase Dashboard → Table Editor → `profiles` table
3. **Login**: Use your credentials to sign in
4. **Verify routing**: You should be redirected to the main app

---

## 📁 File Structure Changes

```
hackeurope/
├── apps/
│   └── mobile/              # ← Expo app moved here (was at root)
│       ├── app/
│       │   ├── (auth)/      # ← NEW: Login/Signup screens
│       │   ├── (tabs)/      # Existing health check flow
│       │   └── _layout.tsx  # ← MODIFIED: Added auth routing
│       ├── contexts/
│       │   └── AuthContext.tsx  # ← NEW: Auth state management
│       ├── lib/
│       │   └── supabase.ts      # ← NEW: Supabase client
│       ├── .env.example     # ← NEW: Environment template
│       └── package.json     # ← MODIFIED: Added dependencies
├── supabase/
│   ├── migrations/          # ← NEW: Database schema files
│   ├── SETUP_ALL.sql       # ← NEW: Combined migration
│   └── README.md           # ← NEW: Database docs
└── QUICKSTART_SUPABASE.md  # ← NEW: Setup guide
```

---

## 🐛 Troubleshooting

### App shows blank screen

**Fix:**
1. Check `.env` file has correct values
2. Make sure URL ends with `.supabase.co`
3. Clear Expo cache: `npx expo start --clear`
4. Check browser console for errors (Cmd+Option+J)

### "Missing Supabase environment variables" error

**Fix:**
- Make sure `.env` file exists in `apps/mobile/`
- Check no leading spaces before env variables
- Restart Expo server after changing `.env`

### Login works but no profile in database

**Fix:**
1. Go to Supabase SQL Editor
2. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. If missing, re-run `supabase/SETUP_ALL.sql`

---

## 📚 Documentation

- `QUICKSTART_SUPABASE.md` - Initial Supabase setup
- `TEST_SUPABASE.md` - Testing guide & troubleshooting
- `supabase/README.md` - Detailed database documentation
- `supabase/migrations/` - Individual migration files

---

## 🎯 Next Steps

After merging and testing:

1. ✅ Authentication works
2. ✅ Database is set up
3. 🔜 Connect health check flow to save results to database
4. 🔜 Add history page to view past analyses
5. 🔜 Implement file uploads to Supabase Storage

---

## ❓ Questions?

Check the docs or ask! All setup should take ~10 minutes if you follow `QUICKSTART_SUPABASE.md`.

**Ready to merge!** 🚀
