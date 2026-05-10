-- Add the missing body_region column required by the live analytics persistence adapter.
-- Safe to run. Adds only the missing column if it does not already exist.

begin;

alter table if exists public.exercise_performance_snapshots
  add column if not exists body_region text;

commit;
