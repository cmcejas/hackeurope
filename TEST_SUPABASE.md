# Testing Your Supabase Setup

## ✅ Checklist

### 1. Environment Variables Set

**Open `/apps/mobile/.env` and fill in your Supabase credentials:**

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

💡 **Get these from:** Supabase Dashboard → Settings → API

---

### 2. Test the App

```bash
cd apps/mobile
npm start
```

**What should happen:**

1. App launches → You see the **Login screen** 🎉
2. Click "Sign Up" → You see the **Sign Up screen**
3. Create an account:
   - Enter name, email, password
   - Click "Create Account"
   - Check your email for verification link (optional)
4. Login with your credentials
5. You should be redirected to the **main app**

---

### 3. Verify Database

**Check Supabase Dashboard → Table Editor:**

- Go to `profiles` table
- You should see your new user profile created automatically!

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"

**Fix:** Make sure `.env` file has correct values:
```bash
cat apps/mobile/.env
```

Restart the app after changing .env:
```bash
# Press 'r' in the terminal where expo is running
```

---

### Login screen doesn't show

**Fix:** Clear Expo cache:
```bash
cd apps/mobile
npx expo start --clear
```

---

### "Invalid API key" error

**Fix:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the **anon public** key (NOT the service_role key)
3. Paste it into `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`

---

### User created but no profile in database

**Fix:** Check if migration ran correctly:
1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT * FROM profiles;`
3. If empty, check triggers:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

---

## 🎯 What's Working Now

✅ **Supabase Database** - All tables created
✅ **Row Level Security** - Users can only access their own data
✅ **Authentication** - Login/Signup pages functional
✅ **Auto Profile Creation** - New users get a profile automatically
✅ **Session Persistence** - Users stay logged in via SecureStore

---

## 📝 Next Steps

Once login is working, we can:

1. **Connect the existing health check flow** to save results to database
2. **Add history page** to view past analyses
3. **Implement file uploads** to Supabase Storage
4. **Add two-step diagnostic logic** in the backend

**Ready to test?** Just fill in your `.env` file and run `npm start`! 🚀
