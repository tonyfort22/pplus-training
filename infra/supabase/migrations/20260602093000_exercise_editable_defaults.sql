alter table public.exercises add column if not exists default_sets text;
alter table public.exercises add column if not exists default_reps text;
alter table public.exercises add column if not exists default_distance text;
alter table public.exercises add column if not exists default_weight text;
alter table public.exercises add column if not exists default_duration text;
alter table public.exercises add column if not exists default_rest text;
alter table public.exercises add column if not exists default_tempo text;
alter table public.exercises add column if not exists status text not null default 'active' check (status in ('draft', 'active', 'archived'));
