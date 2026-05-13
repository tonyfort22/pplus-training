-- Add the missing session_load_summaries table required by Metabase analytics views.
-- Safe to run. Creates only the table and its index if they do not already exist.

begin;

create table if not exists public.session_load_summaries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  completed_sets integer,
  completed_reps integer,
  volume_load numeric,
  effort_adjusted_load numeric,
  session_difficulty numeric,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (workout_session_id)
);

create index if not exists idx_session_load_summaries_workout_session
  on public.session_load_summaries(workout_session_id);

commit;
