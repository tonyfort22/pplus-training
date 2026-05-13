-- Apply this in Supabase SQL Editor for the PPLUS project.
-- Purpose: lock athlete_profiles behind authenticated self-service RLS.

alter table public.athlete_profiles enable row level security;

revoke all on table public.athlete_profiles from anon;
revoke all on table public.athlete_profiles from authenticated;
grant select, update on table public.athlete_profiles to authenticated;

drop policy if exists athlete_profiles_select_own on public.athlete_profiles;
create policy athlete_profiles_select_own on public.athlete_profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists athlete_profiles_update_own on public.athlete_profiles;
create policy athlete_profiles_update_own on public.athlete_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
