# Login Auth Workflows Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make the PPLUS web admin login page perform real Supabase-backed sign-in and forgot-password/reset-password workflows without fake saves or demo fallback.

**Architecture:** Keep `/admin/login` visually intact, but move the interactive form into a small client component. Add server-side API routes for login, logout, forgot password, and reset password. Store authenticated admin sessions in secure HTTP-only cookies, verify the signed-in user has a coach profile, and redirect successful login into `/admin`.

**Tech Stack:** Next.js App Router, React client components, Supabase Auth REST via `packages/data/src/identity/index.js`, Node `node:test` source/route tests, existing admin UI primitives.

---

## Current code facts

- Current login page: `apps/web/app/admin/login/page.jsx`
  - Server component.
  - Renders email/password fields but has no submit handler.
  - Forgot password link is currently `href="#"`.
  - Uses dictionary copy from `apps/web/lib/i18n/public-page-copy.js`.
- Existing identity repository: `packages/data/src/identity/index.js`
  - Already has `signInWithPassword({ email, password })`.
  - Already has `resetPasswordForEmail({ email, redirectTo })`.
  - Already has `getCurrentUser()` and `getCoachProfileByUserId(userId)`.
  - Does **not** yet expose `updatePassword` for Supabase recovery tokens.
- Current API route style: `apps/web/app/api/admin/*/route.js`
  - Uses thin `Response.json(...)` handlers and repository seams.
- Existing login tests: `tests/web-admin-login-i18n.test.js`
  - Source-level tests already protect localized login copy.

---

## UX decisions

1. Login stays at `/admin/login`.
2. Successful coach/admin login redirects to `/admin`.
3. Non-coach users get a clear error: `This account does not have admin access.`
4. Forgot password is a real page/state at `/admin/forgot-password`, not a hidden modal.
5. Forgot password submit always shows a safe success message if the request is accepted: `If an account exists for that email, a reset link has been sent.`
6. Reset password uses `/admin/reset-password` because Supabase recovery links can land with URL hash tokens. A client component reads the hash token and sends it to the server reset route.
7. Do not implement sign-up from web admin in this branch.
8. Do not expose service-role keys to the browser.

---

## Task 1: Add web auth environment/config seam

**Objective:** Centralize web Supabase auth config and avoid scattering env access.

**Files:**
- Create: `apps/web/lib/admin-auth-config.js`
- Test: `tests/web-admin-auth-config.test.js`

**Test first:**
- Assert config reads `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`.
- Assert config reads `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Assert missing config throws a clear admin-auth-specific error.
- Assert `getAdminAuthRedirectUrl('/admin/reset-password')` builds an absolute URL from request origin.

**Implementation:**
- Export:
  - `getAdminAuthConfig()`
  - `getAdminAuthRedirectUrl(request, path)`
- Use server-only env values when present, public values as fallback.
- No secrets in logs or errors.

**Verify:**
```bash
node --test tests/web-admin-auth-config.test.js
```

---

## Task 2: Add admin auth repository wrapper

**Objective:** Create a web-admin-specific auth seam over the shared identity repository.

**Files:**
- Create: `apps/web/lib/admin-auth-repository.js`
- Test: `tests/web-admin-auth-repository.test.js`

**Test first:**
- `signInAdminWithPassword` calls `signInWithPassword`.
- It rejects missing email/password with 400-style errors.
- It rejects users without a coach profile with 403-style error.
- It returns `{ accessToken, refreshToken, user, coachProfile }` for valid coach users.
- `requestPasswordReset` calls `resetPasswordForEmail` with a redirect URL.
- `updatePasswordWithRecoveryToken` calls the Supabase `/auth/v1/user` PATCH flow.

**Implementation notes:**
- Use `createSupabaseRestIdentityRepository` from `packages/data/src/identity/index.js`.
- For login:
  1. sign in with email/password
  2. create a second identity repo using the returned access token
  3. call `getCurrentUser()`
  4. call `getCoachProfileByUserId(user.id)`
  5. reject if no coach profile
- For reset password, add or wrap a method that PATCHes `/auth/v1/user` with `{ password }` using the recovery access token.

**Verify:**
```bash
node --test tests/web-admin-auth-repository.test.js
```

---

## Task 3: Add secure session cookie helpers

**Objective:** Store admin auth tokens in HTTP-only cookies through a tiny server helper.

**Files:**
- Create: `apps/web/lib/admin-auth-cookies.js`
- Test: `tests/web-admin-auth-cookies.test.js`

**Test first:**
- Session cookie names are stable and admin-scoped.
- Access token cookie is `httpOnly`, `sameSite: 'lax'`, `secure` in production, path `/admin`.
- Refresh token cookie follows the same constraints.
- Clear helper expires both cookies.

**Implementation:**
- Export cookie names:
  - `PPLUS_ADMIN_ACCESS_TOKEN_COOKIE`
  - `PPLUS_ADMIN_REFRESH_TOKEN_COOKIE`
- Export:
  - `setAdminAuthCookies(response, session)`
  - `clearAdminAuthCookies(response)`
- Keep max-age conservative. Access token can follow Supabase expiry if available later; start with 1 hour for access token, 30 days for refresh token.

**Verify:**
```bash
node --test tests/web-admin-auth-cookies.test.js
```

---

## Task 4: Add login/logout/forgot/reset API routes

**Objective:** Give the login UI real endpoints while keeping auth work server-side.

**Files:**
- Create: `apps/web/app/api/admin/auth/login/route.js`
- Create: `apps/web/app/api/admin/auth/logout/route.js`
- Create: `apps/web/app/api/admin/auth/forgot-password/route.js`
- Create: `apps/web/app/api/admin/auth/reset-password/route.js`
- Test: `tests/web-admin-auth-routes.test.js`

**Test first:**
- Login route rejects invalid JSON/missing fields.
- Login route calls repository and sets cookies on success.
- Login route returns 401 for bad credentials and 403 for non-coach account.
- Logout route clears cookies.
- Forgot-password route accepts email and sends reset redirect to `/admin/reset-password`.
- Reset-password route rejects missing recovery token/password.
- Reset-password route accepts recovery token and updates password.

**Implementation:**
- Keep route responses JSON:
  - login success: `{ success: true, redirectTo: '/admin' }`
  - forgot success: `{ success: true, message: 'If an account exists for that email, a reset link has been sent.' }`
  - reset success: `{ success: true, redirectTo: '/admin/login?passwordReset=1' }`
- Never return raw Supabase error payloads to the browser.
- Do not set cookies from forgot/reset except login.

**Verify:**
```bash
node --test tests/web-admin-auth-routes.test.js
```

---

## Task 5: Convert the login form into a real client workflow

**Objective:** Keep the current design, but make email/password login actually submit.

**Files:**
- Create: `apps/web/components/admin/admin-login-form.jsx`
- Modify: `apps/web/app/admin/login/page.jsx`
- Modify: `apps/web/lib/i18n/public-page-copy.js`
- Test: `tests/web-admin-login-workflow.test.js`

**Test first:**
- Login page imports and renders `AdminLoginForm`.
- Client form posts to `/api/admin/auth/login`.
- Submit button has idle/submitting copy.
- Error notice is rendered from failed API responses.
- Password visibility button toggles input type locally.
- Forgot password link points to localized `/admin/forgot-password`.

**Implementation:**
- Move the `<form className="admin-login-form">...</form>` block into `AdminLoginForm`.
- Mark `AdminLoginForm` with `'use client'`.
- Use `useState` for email/password/submitting/error/showPassword.
- On success, call `window.location.assign(payload.redirectTo || '/admin')`.
- Preserve existing classes and layout.

**Verify:**
```bash
node --test tests/web-admin-login-workflow.test.js tests/web-admin-login-i18n.test.js
```

---

## Task 6: Add forgot-password page and client form

**Objective:** Let admins request a real reset email from the login page.

**Files:**
- Create: `apps/web/app/admin/forgot-password/page.jsx`
- Create: `apps/web/components/admin/admin-forgot-password-form.jsx`
- Modify: `apps/web/lib/i18n/public-page-copy.js`
- Test: `tests/web-admin-forgot-password-workflow.test.js`

**Test first:**
- Page reuses the admin auth visual shell/logo/theme treatment.
- Form posts to `/api/admin/auth/forgot-password`.
- Email field is required and uses localized copy.
- Success message uses safe non-enumerating copy.
- Back-to-login link preserves `lang` query via `getLocalizedHref('/admin/login', language)`.

**Implementation:**
- Keep the marketing panel or use the same auth frame as login for visual continuity.
- Add dictionary keys:
  - `login.forgot.title`
  - `login.forgot.description`
  - `login.forgot.email`
  - `login.forgot.submit`
  - `login.forgot.success`
  - `login.forgot.backToLogin`
- Add French equivalents.

**Verify:**
```bash
node --test tests/web-admin-forgot-password-workflow.test.js
```

---

## Task 7: Add reset-password page and recovery-token client handling

**Objective:** Complete the password reset workflow after the Supabase email link is opened.

**Files:**
- Create: `apps/web/app/admin/reset-password/page.jsx`
- Create: `apps/web/components/admin/admin-reset-password-form.jsx`
- Modify: `apps/web/lib/i18n/public-page-copy.js`
- Test: `tests/web-admin-reset-password-workflow.test.js`

**Test first:**
- Reset page renders a password + confirm password form.
- Client component reads `window.location.hash` for `access_token` and `type=recovery`.
- Form rejects password shorter than 6 chars.
- Form rejects mismatched confirm password.
- Form posts `{ accessToken, password }` to `/api/admin/auth/reset-password`.
- Success redirects to `/admin/login?passwordReset=1`.
- Missing/invalid recovery token shows an honest error with a link back to forgot password.

**Implementation:**
- Mark component `'use client'`.
- Parse hash with `new URLSearchParams(window.location.hash.replace(/^#/, ''))`.
- Do not store recovery token in localStorage.
- Clear hash after successful submit using `window.history.replaceState(null, '', window.location.pathname + window.location.search)`.

**Verify:**
```bash
node --test tests/web-admin-reset-password-workflow.test.js
```

---

## Task 8: Gate admin pages with the session cookie

**Objective:** Stop unauthenticated users from reaching admin dashboard routes after login workflow exists.

**Files:**
- Create or modify: `apps/web/middleware.js`
- Create: `tests/web-admin-auth-middleware.test.js`

**Test first:**
- `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`, `/admin/support`, and `/admin/support/reference` stay public if intended.
- Dashboard routes like `/admin`, `/admin/athletes`, `/admin/settings/account` require the access token cookie.
- Unauthenticated dashboard requests redirect to `/admin/login?next=<encoded path>`.
- Authenticated requests pass through.

**Implementation:**
- Use Next middleware to inspect `PPLUS_ADMIN_ACCESS_TOKEN_COOKIE`.
- Preserve `next` param on login redirects.
- Do not gate API routes in middleware until API routes consume and validate session cookies consistently.

**Verify:**
```bash
node --test tests/web-admin-auth-middleware.test.js
```

---

## Task 9: Support `next` redirect after login

**Objective:** Return admins to the originally requested dashboard route after successful login.

**Files:**
- Modify: `apps/web/app/admin/login/page.jsx`
- Modify: `apps/web/components/admin/admin-login-form.jsx`
- Test: `tests/web-admin-login-next-redirect.test.js`

**Test first:**
- Login page reads `searchParams.next`.
- Only internal `/admin...` paths are accepted.
- External URLs are ignored and fall back to `/admin`.
- Login form includes the safe `next` redirect in its success path.

**Implementation:**
- Add helper `normalizeAdminNextPath(value)` in a small utility or inside the login form module.
- Reject `//evil.com`, `https://evil.com`, `/support`, and empty values.

**Verify:**
```bash
node --test tests/web-admin-login-next-redirect.test.js
```

---

## Task 10: Live browser verification

**Objective:** Prove the workflows render and behave in the local app.

**Files:**
- No code unless live verification finds a bug.

**Steps:**
1. Run full tests:
   ```bash
   pnpm test
   ```
2. Build web app:
   ```bash
   pnpm --dir apps/web build
   ```
3. Start production preview:
   ```bash
   PORT=3005 NODE_OPTIONS="--no-experimental-webstorage" pnpm --dir apps/web start
   ```
4. Browser-check:
   - `/admin/login`
   - invalid login shows an error and does not redirect
   - forgot password page renders
   - reset password page handles missing token honestly
   - login preserves visual design and theme toggle behavior

**Expected final verification:**
- `pnpm test` passes.
- `pnpm --dir apps/web build` passes.
- Browser routes return 200 where expected.
- No console errors from the client auth forms.

---

## Commit strategy

Use small commits after green tests:

1. `test: add admin auth config coverage`
2. `feat: add admin auth repository seam`
3. `feat: add admin auth session cookies`
4. `feat: add admin auth API routes`
5. `feat: wire real admin login form`
6. `feat: add admin forgot password workflow`
7. `feat: add admin reset password workflow`
8. `feat: gate admin dashboard routes behind auth`
9. `feat: preserve admin next redirect after login`

Final PR should target `admin-dashboard-dark-light-mode` because `login-auth-workflows` is stacked on top of the current admin dashboard branch.
