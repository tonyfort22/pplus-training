-- PPLUS Training schema v1
-- Initial backend foundation for the full product.

create table if not exists users (
  id uuid primary key,
  email text unique not null,
  role text not null check (role in ('athlete', 'coach', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists athlete_profiles (
  id uuid primary key,
  user_id uuid not null references users(id),
  coach_id uuid references users(id),
  first_name text,
  last_name text,
  date_of_birth date,
  sport text,
  position text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists coach_profiles (
  id uuid primary key,
  user_id uuid not null references users(id),
  display_name text,
  organization_name text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists muscles (
  id uuid primary key,
  name text not null,
  slug text unique,
  body_region text,
  sort_order integer,
  is_active boolean not null default true
);

create table if not exists sub_muscles (
  id uuid primary key,
  muscle_id uuid not null references muscles(id) on delete cascade,
  name text not null,
  slug text,
  sort_order integer,
  is_active boolean not null default true
);

create table if not exists exercises (
  id uuid primary key,
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
  fatigue_multiplier numeric,
  axial_fatigue_multiplier numeric,
  skill_fatigue_multiplier numeric,
  status text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exercise_muscle_maps (
  id uuid primary key,
  exercise_id uuid not null references exercises(id) on delete cascade,
  muscle_id uuid not null references muscles(id),
  role text,
  contribution_percent numeric,
  sort_order integer,
  created_at timestamptz not null default now()
);

create table if not exists exercise_sub_muscle_maps (
  id uuid primary key,
  exercise_id uuid not null references exercises(id) on delete cascade,
  exercise_muscle_map_id uuid not null references exercise_muscle_maps(id) on delete cascade,
  sub_muscle_id uuid not null references sub_muscles(id),
  role text,
  contribution_percent numeric,
  sort_order integer,
  created_at timestamptz not null default now()
);

create table if not exists workout_templates (
  id uuid primary key,
  coach_id uuid references users(id),
  name text not null,
  description text,
  category text,
  difficulty text,
  focus_area text,
  estimated_duration_minutes integer,
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_template_exercises (
  id uuid primary key,
  workout_template_id uuid not null references workout_templates(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  name_snapshot text,
  sort_order integer not null,
  notes text,
  default_rest_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_template_sets (
  id uuid primary key,
  workout_template_exercise_id uuid not null references workout_template_exercises(id) on delete cascade,
  sort_order integer not null,
  set_type text,
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
  updated_at timestamptz not null default now()
);

create table if not exists programs (
  id uuid primary key,
  athlete_id uuid not null references athlete_profiles(id),
  coach_id uuid references coach_profiles(id),
  name text not null,
  description text,
  start_date date,
  end_date date,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists program_weeks (
  id uuid primary key,
  program_id uuid not null references programs(id) on delete cascade,
  week_index integer not null,
  name text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists program_days (
  id uuid primary key,
  program_week_id uuid not null references program_weeks(id) on delete cascade,
  day_index integer not null,
  date date,
  name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists program_workouts (
  id uuid primary key,
  program_day_id uuid not null references program_days(id) on delete cascade,
  workout_template_id uuid references workout_templates(id),
  name_snapshot text,
  description_snapshot text,
  category_snapshot text,
  difficulty_snapshot text,
  focus_area_snapshot text,
  estimated_duration_minutes_snapshot integer,
  sort_order integer,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_sessions (
  id uuid primary key,
  athlete_id uuid not null references athlete_profiles(id),
  coach_id uuid references coach_profiles(id),
  program_id uuid references programs(id),
  program_day_id uuid references program_days(id),
  program_workout_id uuid references program_workouts(id),
  workout_template_id uuid references workout_templates(id),
  name_snapshot text,
  status text not null,
  started_at timestamptz,
  completed_at timestamptz,
  elapsed_seconds integer,
  notes text,
  perceived_difficulty numeric,
  total_exercises_count integer,
  completed_exercises_count integer,
  total_sets_count integer,
  completed_sets_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_session_exercises (
  id uuid primary key,
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  name_snapshot text,
  sort_order integer not null,
  status text,
  notes text,
  default_rest_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_session_sets (
  id uuid primary key,
  workout_session_exercise_id uuid not null references workout_session_exercises(id) on delete cascade,
  sort_order integer not null,
  set_type text,
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
  updated_at timestamptz not null default now()
);

create table if not exists muscle_load_events (
  id uuid primary key,
  athlete_id uuid not null references athlete_profiles(id),
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  workout_session_exercise_id uuid references workout_session_exercises(id) on delete cascade,
  workout_session_set_id uuid references workout_session_sets(id) on delete cascade,
  exercise_id uuid references exercises(id),
  muscle_id uuid references muscles(id),
  sub_muscle_id uuid references sub_muscles(id),
  is_sub_muscle boolean not null default false,
  event_date date,
  percent numeric,
  score numeric,
  created_at timestamptz not null default now()
);

create table if not exists session_muscle_load_summaries (
  id uuid primary key,
  athlete_id uuid not null references athlete_profiles(id),
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  muscle_id uuid not null references muscles(id),
  event_date date,
  percent numeric,
  score numeric,
  cap numeric,
  level text,
  created_at timestamptz not null default now()
);

create table if not exists session_sub_muscle_load_summaries (
  id uuid primary key,
  athlete_id uuid not null references athlete_profiles(id),
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  muscle_id uuid not null references muscles(id),
  sub_muscle_id uuid not null references sub_muscles(id),
  event_date date,
  percent numeric,
  score numeric,
  cap numeric,
  level text,
  created_at timestamptz not null default now()
);
