alter table program_workouts
  add column if not exists import_source text,
  add column if not exists import_source_file_name text;
