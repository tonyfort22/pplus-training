-- Apply this in Supabase SQL Editor for the PPLUS project.
-- Purpose: lock coach_profiles behind authenticated self-service RLS.

alter table public.coach_profiles enable row level security;

revoke all on table public.coach_profiles from anon;
revoke all on table public.coach_profiles from authenticated;
grant select, update on table public.coach_profiles to authenticated;

drop policy if exists coach_profiles_select_own on public.coach_profiles;
create policy coach_profiles_select_own on public.coach_profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists coach_profiles_update_own on public.coach_profiles;
create policy coach_profiles_update_own on public.coach_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
