alter table public.programs
  alter column athlete_id drop not null;

alter table public.programs
  drop constraint if exists programs_athlete_id_fkey;

alter table public.programs
  add constraint programs_athlete_id_fkey
  foreign key (athlete_id)
  references public.athlete_profiles(id)
  on delete set null;
