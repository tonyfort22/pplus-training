create table if not exists exercise_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  sort_order integer not null,
  set_type text not null default 'straight' check (set_type in ('straight', 'superset', 'dropset', 'timed', 'distance', 'amrap', 'emom', 'other')),
  target_reps text,
  target_load text,
  target_load_unit text,
  target_duration text,
  target_distance text,
  target_rest text,
  tempo text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exercise_id, sort_order)
);

create index if not exists exercise_sets_exercise_id_sort_order_idx
  on exercise_sets (exercise_id, sort_order);
