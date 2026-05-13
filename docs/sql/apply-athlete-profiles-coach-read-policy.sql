-- Apply this in Supabase SQL Editor for the PPLUS project.
-- Purpose: allow authenticated coaches to read athlete_profiles rows linked to their own coach_profiles row.

drop policy if exists athlete_profiles_select_coach_linked on public.athlete_profiles;
create policy athlete_profiles_select_coach_linked on public.athlete_profiles
for select to authenticated
using (
  exists (
    select 1
    from public.coach_profiles
    where public.coach_profiles.id = public.athlete_profiles.coach_id
      and public.coach_profiles.user_id = auth.uid()
  )
);
