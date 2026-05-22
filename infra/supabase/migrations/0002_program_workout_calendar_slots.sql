alter table program_workouts
  add column if not exists scheduled_date date,
  add column if not exists scheduled_start_time time,
  add column if not exists scheduled_end_time time;

create index if not exists idx_program_workouts_scheduled_date on program_workouts(scheduled_date);
create index if not exists idx_program_workouts_scheduled_start_time on program_workouts(scheduled_start_time);
