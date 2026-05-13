# Send Athlete Invitation Deployment Guide

This function is the live backend seam for coach-side athlete invitations.

## What it does
1. verifies the signed-in user resolves to a coach profile
2. generates a 6-character invite code
3. hashes the code
4. stores the invite row in `athlete_invitations`
5. sends the Loops transactional email
6. returns success payload back to the mobile app

## Required secrets and env

### Supabase function env
Set these before deploying:

```bash
supabase secrets set \
  LOOPS_API_KEY="<loops-api-key>" \
  PPLUS_APP_STORE_URL="https://apps.apple.com/app/<your-app-id>"
```

If your project does not already expose them to Edge Functions, also set:

```bash
supabase secrets set \
  SUPABASE_URL="https://<project-ref>.supabase.co" \
  SUPABASE_ANON_KEY="<supabase-anon-key>"
```

### Mobile env
`apps/mobile/.env` should have:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
EXPO_PUBLIC_PPLUS_APP_STORE_URL=https://apps.apple.com/app/<your-app-id>
```

## Database prep
Apply the new `athlete_invitations` table and RLS changes first.

Preferred:

```bash
pnpm supabase:db:push
```

Direct CLI equivalent:

```bash
supabase db push
```

If your workflow uses migrations directly instead:

```bash
supabase migration up
```

## Function deploy
From repo root:

```bash
pnpm supabase:functions:deploy:invite
```

Direct CLI equivalent:

```bash
supabase functions deploy send-athlete-invitation
```

## Optional local function serve
If you want to boot the function locally first:

```bash
pnpm supabase:functions:serve:invite
```

## Optional quick HTTP smoke test
Use a real coach bearer token from the signed-in app session.

```bash
curl -i \
  -X POST "https://<project-ref>.supabase.co/functions/v1/send-athlete-invitation" \
  -H "Authorization: Bearer <coach-access-token>" \
  -H "apikey: <supabase-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "inviteeEmail": "athlete@example.com",
    "appStoreUrl": "https://apps.apple.com/app/<your-app-id>"
  }'
```

Expected success shape:

```json
{
  "success": true,
  "invitationId": "<uuid>",
  "inviteeEmail": "athlete@example.com",
  "expiresAt": "<iso-date>"
}
```

## Maestro live verification
Prepared flow:
- `maestro/send-athlete-invitation-smoke.yaml`

Recommended order:
1. make sure Expo is up
2. deploy the function
3. confirm secrets are set
4. sign in as a real coach in Expo Go
5. run the Maestro flow
6. verify the success screen appears
7. confirm a row exists in `athlete_invitations`
8. confirm the Loops transactional send landed

## Notes
- JWT verification stays enabled in `infra/supabase/config.toml`
- the server ignores client-supplied coach names and resolves the coach from auth
- the mobile app now waits for the backend result before showing `The invitation was sent!`
