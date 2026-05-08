alter table public.coach_profiles
  add column if not exists theme_preference text;

alter table public.athlete_profiles
  add column if not exists theme_preference text;

update public.coach_profiles
set theme_preference = 'dark'
where theme_preference is null;

update public.athlete_profiles
set theme_preference = 'dark'
where theme_preference is null;

alter table public.coach_profiles
  alter column theme_preference set default 'dark';

alter table public.athlete_profiles
  alter column theme_preference set default 'dark';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'coach_profiles_theme_preference_check'
  ) then
    alter table public.coach_profiles
      add constraint coach_profiles_theme_preference_check
      check (theme_preference in ('dark', 'light'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'athlete_profiles_theme_preference_check'
  ) then
    alter table public.athlete_profiles
      add constraint athlete_profiles_theme_preference_check
      check (theme_preference in ('dark', 'light'));
  end if;
end
$$;
