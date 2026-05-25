-- PPLUS Training schema v1
-- Migration 0001: app-first reset aligned to the current mobile app and session engine.

create extension if not exists pgcrypto;

-- Identity

create table if not exists coach_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  first_name text,
  last_name text,
  organization_name text,
  bio text,
  phone_number text,
  avatar_url text,
  weight_unit_preference text check (weight_unit_preference in ('lb', 'kg')) default 'lb',
  distance_unit_preference text check (distance_unit_preference in ('mi', 'km')) default 'km',
  theme_preference text check (theme_preference in ('dark', 'light')) default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  coach_id uuid references coach_profiles(id) on delete set null,
  first_name text,
  last_name text,
  date_of_birth date,
  sport text,
  position text,
  handedness text,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  avatar_url text,
  units_preference text,
  weight_unit_preference text check (weight_unit_preference in ('lb', 'kg')) default 'lb',
  distance_unit_preference text check (distance_unit_preference in ('mi', 'km')) default 'km',
  theme_preference text check (theme_preference in ('dark', 'light')) default 'dark',
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role text := coalesce(new.raw_user_meta_data ->> 'role', 'athlete');
  signup_coach_email text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'coach_email', '')), '');
  linked_coach_id uuid := null;
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
    if signup_coach_email is not null then
      select coach_profiles.id
      into linked_coach_id
      from public.coach_profiles
      join auth.users coach_users on coach_users.id = coach_profiles.user_id
      where lower(coach_users.email) = lower(signup_coach_email)
      limit 1;
    end if;

    insert into public.athlete_profiles (user_id, coach_id, first_name, last_name)
    values (
      new.id,
      linked_coach_id,
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

-- Exercise library

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  coaching_cues text,
  video_url text,
  thumbnail_url text,
  difficulty text,
  movement_pattern text,
  stimulus_type text,
  body_region text,
  default_equipment text,
  default_load_unit text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exercise_aliases (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  alias_text text not null,
  alias_type text not null check (alias_type in ('source_import', 'display_variant', 'search_synonym', 'coach_label')),
  source_system text,
  created_at timestamptz not null default now()
);

create table if not exists muscles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  body_region text,
  thumbnail_url text,
  sort_order integer,
  is_active boolean not null default true
);

create table if not exists sub_muscles (
  id uuid primary key default gen_random_uuid(),
  muscle_id uuid not null references muscles(id) on delete cascade,
  name text not null,
  slug text,
  thumbnail_url text,
  sort_order integer,
  is_active boolean not null default true,
  unique (muscle_id, name)
);

create table if not exists exercise_muscle_maps (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  muscle_id uuid not null references muscles(id) on delete restrict,
  role text not null check (role in ('primary', 'secondary', 'stabilizer')),
  contribution_percent numeric,
  sort_order integer,
  created_at timestamptz not null default now()
);

create table if not exists exercise_sub_muscle_maps (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  exercise_muscle_map_id uuid references exercise_muscle_maps(id) on delete cascade,
  sub_muscle_id uuid not null references sub_muscles(id) on delete restrict,
  role text not null check (role in ('primary', 'secondary', 'stabilizer')),
  contribution_percent numeric,
  sort_order integer,
  created_at timestamptz not null default now()
);

-- Workout templates

create table if not exists workout_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coach_profiles(id) on delete set null,
  name text not null,
  description text,
  category text,
  focus_area text,
  training_type text,
  estimated_duration_minutes integer,
  thumbnail_url text,
  status text not null check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references workout_templates(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  name_snapshot text not null,
  sort_order integer not null,
  notes text,
  default_rest_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_template_id, sort_order)
);

create table if not exists workout_template_sets (
  id uuid primary key default gen_random_uuid(),
  workout_template_exercise_id uuid not null references workout_template_exercises(id) on delete cascade,
  sort_order integer not null,
  set_type text not null check (set_type in ('straight', 'superset', 'dropset', 'timed', 'distance', 'amrap', 'emom', 'other')),
  target_reps integer,
  target_load numeric,
  target_load_unit text,
  target_duration_seconds integer,
  target_distance numeric,
  target_distance_unit text,
  target_rpe numeric,
  target_rir numeric,
  target_rest_seconds integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_template_exercise_id, sort_order)
);

-- Program planning

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  coach_id uuid references coach_profiles(id) on delete set null,
  name text not null,
  description text,
  start_date date,
  end_date date,
  status text not null check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  week_index integer not null,
  name text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, week_index)
);

create table if not exists program_days (
  id uuid primary key default gen_random_uuid(),
  program_week_id uuid not null references program_weeks(id) on delete cascade,
  day_index integer not null,
  date date,
  name text,
  notes text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_week_id, day_index)
);

create table if not exists program_workouts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete set null,
  coach_id uuid references coach_profiles(id) on delete set null,
  program_id uuid references programs(id) on delete cascade,
  program_day_id uuid references program_days(id) on delete cascade,
  workout_template_id uuid references workout_templates(id) on delete set null,
  name_snapshot text not null,
  notes text,
  status text not null check (status in ('scheduled', 'available', 'in_progress', 'completed', 'missed', 'skipped')),
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists program_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  program_workout_id uuid not null references program_workouts(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  name_snapshot text not null,
  sort_order integer not null,
  notes text,
  default_rest_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_workout_id, sort_order)
);

create table if not exists program_workout_sets (
  id uuid primary key default gen_random_uuid(),
  program_workout_exercise_id uuid not null references program_workout_exercises(id) on delete cascade,
  sort_order integer not null,
  set_type text not null check (set_type in ('straight', 'superset', 'dropset', 'timed', 'distance', 'amrap', 'emom', 'other')),
  target_reps integer,
  target_load numeric,
  target_load_unit text,
  target_duration_seconds integer,
  target_distance numeric,
  target_distance_unit text,
  target_rpe numeric,
  target_rir numeric,
  target_rest_seconds integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_workout_exercise_id, sort_order)
);

-- Session execution

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete set null,
  coach_id uuid references coach_profiles(id) on delete set null,
  program_id uuid references programs(id) on delete set null,
  program_day_id uuid references program_days(id) on delete set null,
  program_workout_id uuid references program_workouts(id) on delete set null,
  workout_template_id uuid references workout_templates(id) on delete set null,
  name_snapshot text not null,
  status text not null check (status in ('draft', 'in_progress', 'paused', 'completed', 'discarded', 'abandoned')),
  started_at timestamptz,
  completed_at timestamptz,
  elapsed_seconds integer not null default 0,
  notes text,
  perceived_difficulty numeric,
  total_exercises_count integer not null default 0,
  completed_exercises_count integer not null default 0,
  total_sets_count integer not null default 0,
  completed_sets_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  program_workout_exercise_id uuid references program_workout_exercises(id) on delete set null,
  exercise_id uuid references exercises(id) on delete set null,
  name_snapshot text not null,
  sort_order integer not null,
  status text not null check (status in ('not_started', 'active', 'completed', 'skipped')),
  notes text,
  default_rest_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_session_id, sort_order)
);

create table if not exists workout_session_sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_exercise_id uuid not null references workout_session_exercises(id) on delete cascade,
  program_workout_set_id uuid references program_workout_sets(id) on delete set null,
  sort_order integer not null,
  set_type text not null check (set_type in ('straight', 'superset', 'dropset', 'timed', 'distance', 'amrap', 'emom', 'other')),
  prescribed_reps integer,
  prescribed_load numeric,
  prescribed_load_unit text,
  prescribed_duration_seconds integer,
  prescribed_distance numeric,
  prescribed_distance_unit text,
  prescribed_rpe numeric,
  prescribed_rir numeric,
  prescribed_rest_seconds integer,
  actual_reps integer,
  actual_load numeric,
  actual_load_unit text,
  actual_duration_seconds integer,
  actual_distance numeric,
  actual_distance_unit text,
  actual_rpe numeric,
  actual_rir numeric,
  actual_rest_seconds integer,
  completed_at timestamptz,
  is_completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_session_exercise_id, sort_order)
);

create table if not exists rest_timer_states (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  workout_session_set_id uuid references workout_session_sets(id) on delete set null,
  mode text not null check (mode in ('timer', 'stopwatch')),
  duration_seconds integer not null,
  remaining_seconds integer not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  is_running boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Progress foundation

create table if not exists session_load_summaries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  completed_sets integer,
  completed_reps integer,
  volume_load numeric,
  effort_adjusted_load numeric,
  session_difficulty numeric,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (workout_session_id)
);

create table if not exists exercise_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  workout_session_id uuid references workout_sessions(id) on delete set null,
  workout_session_exercise_id uuid references workout_session_exercises(id) on delete set null,
  metric_type text not null check (metric_type in ('strength', 'volume', 'distance', 'duration', 'custom')),
  load numeric,
  reps integer,
  sets integer,
  duration_seconds integer,
  distance numeric,
  unit text,
  body_region text,
  log_date date not null,
  estimated_one_rep_max numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists muscle_load_events (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  workout_session_exercise_id uuid references workout_session_exercises(id) on delete set null,
  workout_session_set_id uuid references workout_session_sets(id) on delete set null,
  exercise_id uuid references exercises(id) on delete set null,
  muscle_id uuid references muscles(id) on delete set null,
  sub_muscle_id uuid references sub_muscles(id) on delete set null,
  is_sub_muscle boolean not null default false,
  event_date date not null,
  percent numeric,
  score numeric,
  created_at timestamptz not null default now()
);

create table if not exists session_muscle_load_summaries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  muscle_id uuid not null references muscles(id) on delete cascade,
  event_date date not null,
  percent numeric,
  score numeric,
  cap numeric,
  level text,
  created_at timestamptz not null default now(),
  unique (workout_session_id, muscle_id)
);

create table if not exists recovery_snapshots (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  snapshot_date date not null,
  muscle_id uuid references muscles(id) on delete set null,
  sub_muscle_id uuid references sub_muscles(id) on delete set null,
  fatigue_score numeric,
  recovery_score numeric,
  recovery_percent numeric,
  readiness_level text,
  source_window_days integer,
  created_at timestamptz not null default now()
);

create table if not exists body_metric_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  coach_id uuid references coach_profiles(id) on delete set null,
  metric_type text not null,
  value numeric not null,
  unit text,
  recorded_at timestamptz not null,
  source text,
  notes text,
  progress_photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists athlete_invitations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coach_profiles(id) on delete cascade,
  invitee_email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  sent_at timestamptz,
  athlete_profile_id uuid references athlete_profiles(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_invitations_code_hash_key unique (code_hash)
);

create table if not exists athlete_groups (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coach_profiles(id) on delete cascade,
  name text not null,
  description text,
  access_level text not null default 'private' check (access_level in ('private', 'public')),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by_user_id uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_groups_coach_name_key unique (coach_id, name)
);

create table if not exists athlete_group_memberships (
  id uuid primary key default gen_random_uuid(),
  athlete_group_id uuid not null references athlete_groups(id) on delete cascade,
  athlete_id uuid not null references athlete_profiles(id) on delete cascade,
  added_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_group_memberships_group_athlete_key unique (athlete_group_id, athlete_id)
);

create index if not exists idx_athlete_profiles_coach on athlete_profiles(coach_id);
create index if not exists idx_exercise_aliases_exercise on exercise_aliases(exercise_id);
create index if not exists idx_sub_muscles_muscle on sub_muscles(muscle_id);
create index if not exists idx_exercise_muscle_maps_exercise on exercise_muscle_maps(exercise_id);
create index if not exists idx_exercise_sub_muscle_maps_exercise on exercise_sub_muscle_maps(exercise_id);
create index if not exists idx_workout_template_exercises_template on workout_template_exercises(workout_template_id);
create index if not exists idx_workout_template_sets_exercise on workout_template_sets(workout_template_exercise_id);
create index if not exists idx_program_weeks_program on program_weeks(program_id);
create index if not exists idx_program_days_week on program_days(program_week_id);
create index if not exists idx_program_workouts_program on program_workouts(program_id);
create index if not exists idx_program_workouts_day on program_workouts(program_day_id);
create index if not exists idx_program_workout_exercises_workout on program_workout_exercises(program_workout_id);
create index if not exists idx_program_workout_sets_exercise on program_workout_sets(program_workout_exercise_id);
create index if not exists idx_workout_sessions_athlete on workout_sessions(athlete_id);
create index if not exists idx_workout_sessions_program_workout on workout_sessions(program_workout_id);

create or replace view program_workout_display_states as
with latest_session as (
  select distinct on (ws.program_workout_id)
    ws.program_workout_id,
    ws.status,
    ws.started_at,
    ws.completed_at,
    ws.updated_at
  from workout_sessions ws
  where ws.program_workout_id is not null
  order by ws.program_workout_id, ws.updated_at desc nulls last, ws.started_at desc nulls last
)
select
  pw.id as program_workout_id,
  pw.program_id,
  pw.program_day_id,
  pd.date as scheduled_date,
  pw.status as persisted_program_workout_status,
  latest_session.status as latest_workout_session_status,
  case
    when coalesce(latest_session.status, '') = 'completed' then 'completed'
    when coalesce(latest_session.status, '') in ('discarded', 'abandoned') then 'missed'
    when pw.status in ('completed') then 'completed'
    when pw.status in ('missed', 'skipped') then 'missed'
    when pd.date < current_date then 'missed'
    else 'upcoming'
  end as display_state
from program_workouts pw
join program_days pd on pd.id = pw.program_day_id
left join latest_session on latest_session.program_workout_id = pw.id;
create index if not exists idx_workout_session_exercises_session on workout_session_exercises(workout_session_id);
create index if not exists idx_workout_session_sets_exercise on workout_session_sets(workout_session_exercise_id);
create index if not exists idx_rest_timer_states_session on rest_timer_states(workout_session_id);
create index if not exists idx_session_load_summaries_session on session_load_summaries(workout_session_id);
create index if not exists idx_exercise_performance_snapshots_exercise_date on exercise_performance_snapshots(exercise_id, log_date desc);
create index if not exists idx_muscle_load_events_athlete_date on muscle_load_events(athlete_id, event_date desc);
create index if not exists idx_session_muscle_load_summaries_session on session_muscle_load_summaries(workout_session_id);
create index if not exists idx_recovery_snapshots_athlete_date on recovery_snapshots(athlete_id, snapshot_date desc);
create index if not exists idx_body_metric_logs_athlete_recorded on body_metric_logs(athlete_id, recorded_at desc);
create index if not exists idx_athlete_invitations_coach_created on athlete_invitations(coach_id, created_at desc);
create index if not exists idx_athlete_invitations_email_created on athlete_invitations(invitee_email, created_at desc);
create index if not exists idx_athlete_groups_coach_status on athlete_groups(coach_id, status, updated_at desc);
create index if not exists idx_athlete_group_memberships_group on athlete_group_memberships(athlete_group_id);
create index if not exists idx_athlete_group_memberships_athlete on athlete_group_memberships(athlete_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('athlete-avatars', 'athlete-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists athlete_avatars_select_public on storage.objects;
create policy athlete_avatars_select_public on storage.objects
for select to public
using (bucket_id = 'athlete-avatars');

drop policy if exists athlete_avatars_insert_own on storage.objects;
create policy athlete_avatars_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'athlete-avatars'
  and exists (
    select 1
    from public.athlete_profiles
    where athlete_profiles.user_id = auth.uid()
      and athlete_profiles.id::text = split_part(name, '/', 1)
  )
);

drop policy if exists athlete_avatars_update_own on storage.objects;
create policy athlete_avatars_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'athlete-avatars'
  and exists (
    select 1
    from public.athlete_profiles
    where athlete_profiles.user_id = auth.uid()
      and athlete_profiles.id::text = split_part(name, '/', 1)
  )
)
with check (
  bucket_id = 'athlete-avatars'
  and exists (
    select 1
    from public.athlete_profiles
    where athlete_profiles.user_id = auth.uid()
      and athlete_profiles.id::text = split_part(name, '/', 1)
  )
);

drop policy if exists athlete_avatars_delete_own on storage.objects;
create policy athlete_avatars_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'athlete-avatars'
  and exists (
    select 1
    from public.athlete_profiles
    where athlete_profiles.user_id = auth.uid()
      and athlete_profiles.id::text = split_part(name, '/', 1)
  )
);

alter table athlete_profiles enable row level security;
revoke all on table athlete_profiles from anon;
revoke all on table athlete_profiles from authenticated;
grant select, update on table athlete_profiles to authenticated;

drop policy if exists athlete_profiles_select_own on athlete_profiles;
create policy athlete_profiles_select_own on athlete_profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists athlete_profiles_select_coach_linked on athlete_profiles;
create policy athlete_profiles_select_coach_linked on athlete_profiles
for select to authenticated
using (
  exists (
    select 1
    from coach_profiles
    where coach_profiles.id = athlete_profiles.coach_id
      and coach_profiles.user_id = auth.uid()
  )
);

drop policy if exists athlete_profiles_update_own on athlete_profiles;
create policy athlete_profiles_update_own on athlete_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

alter table athlete_invitations enable row level security;
revoke all on table athlete_invitations from anon;
revoke all on table athlete_invitations from authenticated;
grant select, insert, update on table athlete_invitations to authenticated;

drop policy if exists athlete_invitations_select_coach_owned on athlete_invitations;
create policy athlete_invitations_select_coach_owned on athlete_invitations
for select to authenticated
using (
  exists (
    select 1
    from coach_profiles
    where coach_profiles.id = athlete_invitations.coach_id
      and coach_profiles.user_id = auth.uid()
  )
);

drop policy if exists athlete_invitations_insert_coach_owned on athlete_invitations;
create policy athlete_invitations_insert_coach_owned on athlete_invitations
for insert to authenticated
with check (
  exists (
    select 1
    from coach_profiles
    where coach_profiles.id = athlete_invitations.coach_id
      and coach_profiles.user_id = auth.uid()
  )
);

drop policy if exists athlete_invitations_update_coach_owned on athlete_invitations;
create policy athlete_invitations_update_coach_owned on athlete_invitations
for update to authenticated
using (
  exists (
    select 1
    from coach_profiles
    where coach_profiles.id = athlete_invitations.coach_id
      and coach_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from coach_profiles
    where coach_profiles.id = athlete_invitations.coach_id
      and coach_profiles.user_id = auth.uid()
  )
);

alter table coach_profiles enable row level security;

revoke all on table coach_profiles from anon;
revoke all on table coach_profiles from authenticated;
grant select, update on table coach_profiles to authenticated;

drop policy if exists coach_profiles_select_own on coach_profiles;
create policy coach_profiles_select_own on coach_profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists coach_profiles_update_own on coach_profiles;
create policy coach_profiles_update_own on coach_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-avatars', 'coach-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists coach_avatars_select_public on storage.objects;
create policy coach_avatars_select_public on storage.objects
for select to public
using (bucket_id = 'coach-avatars');

drop policy if exists coach_avatars_insert_own on storage.objects;
create policy coach_avatars_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'coach-avatars'
  and exists (
    select 1
    from public.coach_profiles
    where coach_profiles.user_id = auth.uid()
      and coach_profiles.id::text = split_part(name, '/', 1)
  )
);

drop policy if exists coach_avatars_update_own on storage.objects;
create policy coach_avatars_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'coach-avatars'
  and exists (
    select 1
    from public.coach_profiles
    where coach_profiles.user_id = auth.uid()
      and coach_profiles.id::text = split_part(name, '/', 1)
  )
)
with check (
  bucket_id = 'coach-avatars'
  and exists (
    select 1
    from public.coach_profiles
    where coach_profiles.user_id = auth.uid()
      and coach_profiles.id::text = split_part(name, '/', 1)
  )
);

drop policy if exists coach_avatars_delete_own on storage.objects;
create policy coach_avatars_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'coach-avatars'
  and exists (
    select 1
    from public.coach_profiles
    where coach_profiles.user_id = auth.uid()
      and coach_profiles.id::text = split_part(name, '/', 1)
  )
);
