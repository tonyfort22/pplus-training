# Coach vs Athlete Auth Split Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make authentication role-aware so users explicitly enter as coach or athlete, the right profile row is created at signup, and the app bootstraps into role-specific surfaces.

**Architecture:** Keep Supabase Auth as the identity layer and store the selected role in auth metadata. Continue using `auth.users` as the source of truth, then provision either `coach_profiles` or `athlete_profiles` from auth triggers based on that role. Bootstrap should resolve the signed-in role first, then load the matching app shell branch.

**Tech Stack:** Expo React Native, Supabase Auth + Postgres, node:test source-level tests, current `MobileAuthSessionProvider` auth/bootstrap flow.

---

## Product decision

Use this role model:
- `athlete`
- `coach`

At auth entry:
- user chooses role in the UI
- sign up stores that role in auth metadata
- sign in uses the resolved role from auth metadata / resolved profile row

Initial product assumption:
- Anthony is a `coach`
- athlete users get athlete profile surfaces
- coach users get coach/admin-style surfaces later, even if the first pass is a placeholder coach dashboard

## Current repo facts

Already true:
- `auth.users` is the identity source
- `athlete_profiles` and `coach_profiles` both exist
- the auth trigger now auto-provisions `coach_profiles` for `role = 'coach'` and `athlete_profiles` otherwise
- auth signup already sends metadata with the selected `role`
- bootstrap currently assumes athlete-first resolution

This means the next pass is not greenfield. It is a role split on top of the current auth shell.

---

## Task 1: Add failing tests for role-aware auth UI

**Objective:** Lock the UI contract before changing implementation.

**Files:**
- Modify: `tests/mobile-auth-screen-models.test.js` or create if missing
- Read: `apps/mobile/src/auth/auth-screen-models.js`

**Test expectations:**
- sign-up screen exposes a role selector with `Coach` and `Athlete`
- sign-in screen also exposes role context or at minimum role copy
- sign-up submit copy is role-aware
- default role can be athlete for now, but role choice must be editable

**Run:**
```bash
node --test tests/mobile-auth-screen-models.test.js
```

---

## Task 2: Implement role selector in auth screen model

**Objective:** Make the auth UI explicitly role-aware.

**Files:**
- Modify: `apps/mobile/src/auth/auth-screen-models.js`
- Possibly modify: `apps/mobile/src/screens/auth-view.js`

**Implementation notes:**
- add a role field/control to sign-up model
- likely also keep the selected role visible during sign-in
- keep it simple, mobile-native, and not over-designed
- reuse the app’s dark + green style system

**Verify:**
```bash
node --test tests/mobile-auth-screen-models.test.js
```

---

## Task 3: Add failing tests for coach vs athlete signup metadata

**Objective:** Prove sign-up sends the selected role instead of hardcoding athlete.

**Files:**
- Modify: `tests/mobile-auth-session-provider.test.js`
- Modify: `tests/mobile-auth-bootstrap.test.js` if needed
- Read: `apps/mobile/App.js`
- Read: `apps/mobile/src/auth/session-provider.js`

**Test expectations:**
- sign-up payload includes selected role
- athlete sign-up still sends first/last name metadata
- coach sign-up sends role `coach`
- no hardcoded `role: 'athlete'` remains in the submit path

**Run:**
```bash
node --test tests/mobile-auth-session-provider.test.js tests/mobile-auth-bootstrap.test.js
```

---

## Task 4: Implement role-aware signup submit path

**Objective:** Pass selected role through the current sign-up flow.

**Files:**
- Modify: `apps/mobile/App.js`
- Possibly modify: `apps/mobile/src/screens/auth-view.js`
- Possibly modify: `apps/mobile/src/auth/session-provider.js`

**Implementation notes:**
- replace hardcoded athlete role in signup metadata
- include first/last name only when useful
- keep validation tight and explicit

**Verify:**
```bash
node --test tests/mobile-auth-session-provider.test.js tests/mobile-auth-bootstrap.test.js
```

---

## Task 5: Add failing schema tests for coach auto-provisioning

**Objective:** Extend the SQL contract to provision the correct profile table based on role.

**Files:**
- Modify: `tests/schema-foundation.test.js`
- Read: `infra/supabase/schema-v1.sql`
- Read: `infra/supabase/migrations/0001_initial_schema.sql`

**Test expectations:**
- auth trigger function references role metadata
- coach signups provision `coach_profiles`
- athlete signups provision `athlete_profiles`
- duplicate inserts remain conflict-safe

**Run:**
```bash
node --test tests/schema-foundation.test.js
```

---

## Task 6: Update SQL auth trigger for role-based profile provisioning

**Objective:** Provision the right profile row at signup.

**Files:**
- Modify: `infra/supabase/schema-v1.sql`
- Modify: `infra/supabase/migrations/0001_initial_schema.sql`

**Implementation notes:**
- evolve `public.handle_new_auth_user()`
- inspect `new.raw_user_meta_data ->> 'role'`
- if role is `coach`, insert into `coach_profiles`
- else insert into `athlete_profiles`
- maintain idempotency with `on conflict do nothing`

**Verify:**
```bash
node --test tests/schema-foundation.test.js
pnpm test
```

---

## Task 7: Apply updated trigger to live Supabase and verify

**Objective:** Keep the connected project aligned with repo truth.

**Files:**
- External action via Codex MCP / Supabase MCP

**Verification:**
- `public.handle_new_auth_user()` exists
- trigger on `auth.users` exists
- function provisions correct profile table by role

**Run:**
- apply migration through the connected Supabase MCP path
- verify function definition and trigger definition through read-only SQL inspection

---

## Task 8: Add failing bootstrap tests for role resolution

**Objective:** Force bootstrap to stop assuming every signed-in user is an athlete.

**Files:**
- Modify: `tests/mobile-auth-bootstrap.test.js`
- Modify: `tests/mobile-app-shell.test.js` if needed
- Read: `apps/mobile/src/auth/bootstrap.js`
- Read: `apps/mobile/src/train/session-runtime.js`

**Test expectations:**
- athlete user resolves athlete bootstrap branch
- coach user resolves coach bootstrap branch
- coach with no athlete profile does not get treated as broken athlete auth

**Run:**
```bash
node --test tests/mobile-auth-bootstrap.test.js tests/mobile-app-shell.test.js
```

---

## Task 9: Implement role-aware bootstrap

**Objective:** Branch the authenticated app by role.

**Files:**
- Modify: `apps/mobile/src/auth/bootstrap.js`
- Modify: `apps/mobile/src/train/session-runtime.js`
- Possibly modify: `apps/mobile/src/auth/session-provider.js`

**Implementation notes:**
- resolve current auth user role from auth user metadata first
- athlete branch:
  - fetch athlete profile
  - continue current workout bootstrap logic
- coach branch:
  - fetch coach profile
  - return a coach-specific bootstrap state
  - first pass can use a clean placeholder coach home surface if full coach screens are not built yet

**Verify:**
```bash
node --test tests/mobile-auth-bootstrap.test.js tests/mobile-app-shell.test.js
```

---

## Task 10: Add minimal coach shell branch

**Objective:** Avoid dumping coaches into athlete views.

**Files:**
- Modify: `apps/mobile/App.js`
- Possibly create: `apps/mobile/src/screens/coach-home-view.js`
- Possibly modify: `apps/mobile/src/screens/app-render-models.js`

**First-pass scope:**
- clear coach title
- clear “coach workspace coming next” body
- do not reuse athlete train surface

**Verify:**
```bash
pnpm test
```

---

## Task 11: Live verification checklist

**Objective:** Prove the auth split works in the real app.

**Checklist:**
1. sign up as athlete
2. confirm `athlete_profiles` row is created
3. sign in as athlete
4. athlete lands in athlete shell
5. sign up as coach
6. confirm `coach_profiles` row is created
7. sign in as coach
8. coach lands in coach shell, not athlete shell

---

## Recommended implementation order
1. auth UI role selector
2. signup metadata role wiring
3. SQL trigger role split
4. bootstrap role split
5. coach shell placeholder
6. live verification

## Important non-goals for this pass
Do **not** build yet:
- coach-to-athlete assignment UI
- invite systems
- full coach dashboard
- permissions matrix beyond basic role split
- team management flows

Those come after the auth foundation is correct.

## Why this order matters
This auth split determines:
- which profile table exists
- which bootstrap branch runs
- which app surfaces the user sees
- future assignment and permissions logic

So yes, this should happen before going deeper on exercises/programs/session UX.
