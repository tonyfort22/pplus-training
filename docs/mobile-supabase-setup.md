# Mobile Supabase setup

This Expo app only talks to the real backend when the public Supabase env vars are present at runtime.

## Required file

Create this file locally:

`apps/mobile/.env`

Start from:

`apps/mobile/.env.example`

Add:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## What these vars unlock

With those two vars present, the mobile app can use the real Supabase-backed auth and athlete profile seams for:

- sign in
- sign up
- password reset
- auth bootstrap
- athlete profile fetch
- athlete profile update

Without them, the app cannot bootstrap a real coach or athlete context, so entry falls back to the auth route instead of any in-app home scaffold.

## Profile row provisioning

New signups should get the right profile row automatically from the SQL auth trigger on `auth.users`.

- `coach_profiles` when signup metadata includes `role: 'coach'`
- `athlete_profiles` for athlete signups and as the default fallback when role is missing

That means the mobile app should not need a client-side profile insert just to make first profile read/save work.

## Current save behavior

The Profile save flow is already wired to call the backend path.

If config is missing, save will fail with:

`Profile update requires Supabase auth configuration`

If config is present and the athlete is authenticated, save will issue a real PATCH against `athlete_profiles` through the shared Supabase REST identity repository.

## Practical local workflow

1. Copy `apps/mobile/.env.example` to `apps/mobile/.env`
2. Fill in `EXPO_PUBLIC_SUPABASE_URL`
3. Fill in `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Restart Expo completely
5. Sign in with a real athlete account
6. Open Profile, edit values, and save
7. Reopen the screen to confirm the values round-trip from Supabase

## Next backend milestone after this

Once profile read/write is confirmed live, the next priority is workout persistence:

- create workout session
- save set actuals
- finish/discard session
- reload and resume session
- drive calendar/progress from real completed data
