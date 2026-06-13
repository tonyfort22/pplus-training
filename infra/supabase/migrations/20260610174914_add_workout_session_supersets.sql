alter table public.workout_session_exercises
  add column if not exists superset_group_id text,
  add column if not exists superset_order integer;

create index if not exists idx_workout_session_exercises_superset
  on public.workout_session_exercises(workout_session_id, superset_group_id, superset_order);
