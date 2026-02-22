# Supabase: Enable first-time onboarding

PollenCast shows a one-time onboarding screen (how the app works + disclaimer) for new users. To support this, Supabase must store whether each user has completed onboarding.

## What you need to do in Supabase

### 1. Add the onboarding column to `profiles`

1. Open your project: [Supabase Dashboard](https://app.supabase.com) → select your project.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste and run this SQL:

```sql
-- PollenCast: track whether user has completed onboarding (shown once per account)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Set when the user completes the first-time onboarding.';
```

5. Click **Run** (or Ctrl/Cmd + Enter).

You should see “Success. No rows returned.” That’s normal — the column was added.

### 2. Add questionnaire columns (onboarding page 2)

On the second onboarding screen, users answer three health questions. Store their answers on `profiles`. In the SQL Editor, run this in a **new query**:

```sql
-- PollenCast: store onboarding health questionnaire on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS had_allergies BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS respiratory_issues BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS immunocompromised BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN public.profiles.had_allergies IS 'From onboarding: Have you had allergies before?';
COMMENT ON COLUMN public.profiles.respiratory_issues IS 'From onboarding: Do you have any respiratory issues?';
COMMENT ON COLUMN public.profiles.immunocompromised IS 'From onboarding: Are you immunocompromised?';
```

Click **Run**. No RLS changes are needed; users already update their own profile.

### 3. No RLS changes

Existing RLS already lets users **update** their own `profiles` row, so they can set `onboarding_completed_at` and the questionnaire fields after completing onboarding. You don’t need to add new policies.

### 4. Existing users (optional)

If you had users **before** adding this column, they will have `onboarding_completed_at = NULL`, so the next time they log in they’ll see the onboarding screen once. If you prefer that existing users skip onboarding, run:

```sql
-- Optional: mark all existing users as having completed onboarding
UPDATE public.profiles
SET onboarding_completed_at = NOW()
WHERE onboarding_completed_at IS NULL;
```

### Summary

| Step | Action |
|------|--------|
| 1 | SQL Editor → run the `onboarding_completed_at` migration (step 1 above) |
| 2 | SQL Editor → run the questionnaire migration (step 2 above) |
| 3 | (Optional) Run the `UPDATE` if you want existing users to skip onboarding |

After that, new signups see onboarding (page 1: how it works, page 2: questionnaire + disclaimer). When they tap “Get started”, the app sets `onboarding_completed_at` and the three questionnaire columns, then they go to the main app.
