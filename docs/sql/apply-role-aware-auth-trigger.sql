-- Apply this in Supabase SQL Editor for the PPLUS project.
-- Purpose: auto-provision coach_profiles for coach signups and athlete_profiles otherwise.

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
    insert into public.coach_profiles (user_id, display_name)
    values (
      new.id,
      coalesce(
        new.raw_user_meta_data ->> 'display_name',
        concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name')
      )
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
