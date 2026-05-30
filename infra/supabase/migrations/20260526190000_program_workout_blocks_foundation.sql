create table if not exists workout_template_blocks (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references workout_templates(id) on delete cascade,
  block_code text,
  title text,
  instructions text,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_template_id, sort_order)
);

alter table if exists workout_template_exercises
  add column if not exists workout_template_block_id uuid references workout_template_blocks(id) on delete set null;

create table if not exists program_workout_blocks (
  id uuid primary key default gen_random_uuid(),
  program_workout_id uuid not null references program_workouts(id) on delete cascade,
  block_code text,
  title text,
  instructions text,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_workout_id, sort_order)
);

alter table if exists program_workout_exercises
  add column if not exists program_workout_block_id uuid references program_workout_blocks(id) on delete set null;

create index if not exists idx_workout_template_blocks_template on workout_template_blocks(workout_template_id);
create index if not exists idx_workout_template_exercises_block on workout_template_exercises(workout_template_block_id);
create index if not exists idx_program_workout_blocks_workout on program_workout_blocks(program_workout_id);
create index if not exists idx_program_workout_exercises_block on program_workout_exercises(program_workout_block_id);
