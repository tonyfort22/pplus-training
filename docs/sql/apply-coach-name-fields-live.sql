-- Purpose: add proper coach first_name / last_name columns and update the auth provisioning trigger.

alter table public.coach_profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.coach_profiles cp
set
  first_name = coalesce(cp.first_name, au.raw_user_meta_data ->> 'first_name'),
  last_name = coalesce(cp.last_name, au.raw_user_meta_data ->> 'last_name'),
  display_name = coalesce(
    nullif(cp.display_name, 'Coach'),
    nullif(trim(concat_ws(' ', coalesce(cp.first_name, au.raw_user_meta_data ->> 'first_name'), coalesce(cp.last_name, au.raw_user_meta_data ->> 'last_name'))), ''),
    cp.display_name
  )
from auth.users au
where au.id = cp.user_id;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role text := coalesce(new.raw_user_meta_data ->> 'role', 'athlete');
begin
  if signup_role = 'coach' then
    insert into public.coach_profiles (user_id, display_name, first_name, last_name)
    values (
      new.id,
      coalesce(
        new.raw_user_meta_data ->> 'display_name',
        concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name')
      ),
      new.raw_user_meta_data ->> 'first_name',
      new.raw_user_meta_data ->> 'last_name'
    )
    on conflict (user_id) do nothing;
  else
    insert into public.athlete_profiles (user_id, first_name, last_name)
    values (
      new.id,
      new.raw_user_meta_data ->> 'first_name',
      new.raw_user_meta_data ->> 'last_name'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;
