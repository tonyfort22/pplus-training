-- Add program phases as the grouping layer between programs and workouts.

create table if not exists program_phases (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  name text not null,
  description text,
  training_type text,
  start_week integer,
  end_week integer,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, sort_order)
);

alter table program_workouts
  add column if not exists program_phase_id uuid references program_phases(id) on delete set null;

create index if not exists idx_program_phases_program on program_phases(program_id);
create index if not exists idx_program_workouts_phase on program_workouts(program_phase_id);
