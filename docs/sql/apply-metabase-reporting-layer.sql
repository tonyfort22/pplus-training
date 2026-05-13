-- PPLUS Metabase reporting layer
--
-- Purpose:
-- 1. Create a clean reporting schema for Metabase
-- 2. Add first-pass reporting views over the current PPLUS execution/analytics tables
-- 3. Optionally create and grant a read-only role for Metabase
--
-- Recommended usage:
-- - Run the schema + view section first
-- - Review the views in Supabase SQL editor
-- - Only then create the login role and grants with a real strong password
--
-- Notes:
-- - This file is designed for the current PPLUS schema in infra/supabase/schema-v1.sql
-- - It does NOT modify app tables or migrations
-- - It is safe to re-run because it uses create or replace view / create schema if not exists

begin;

create schema if not exists reporting;

comment on schema reporting is 'Read-optimized reporting layer for Metabase and internal analytics dashboards.';

-- ---------------------------------------------------------------------------
-- View 1: completed_session_summary
-- One row per completed session.
-- ---------------------------------------------------------------------------
create or replace view reporting.completed_session_summary as
select
  ws.id as workout_session_id,
  ws.athlete_id,
  ws.coach_id,
  ws.program_id,
  ws.program_day_id,
  ws.program_workout_id,
  ws.workout_template_id,
  ws.name_snapshot,
  ws.status,
  ws.started_at,
  ws.completed_at,
  ws.elapsed_seconds,
  ws.notes,
  ws.perceived_difficulty,
  ws.total_exercises_count,
  ws.completed_exercises_count,
  ws.total_sets_count,
  ws.completed_sets_count,
  ws.created_at,
  ws.updated_at
from public.workout_sessions ws
where ws.status = 'completed';

comment on view reporting.completed_session_summary is 'Completed workout sessions only. Primary high-level session reporting source for Metabase.';

-- ---------------------------------------------------------------------------
-- View 2: discarded_session_summary
-- One row per discarded / abandoned session.
-- ---------------------------------------------------------------------------
create or replace view reporting.discarded_session_summary as
select
  ws.id as workout_session_id,
  ws.athlete_id,
  ws.coach_id,
  ws.program_id,
  ws.program_day_id,
  ws.program_workout_id,
  ws.workout_template_id,
  ws.name_snapshot,
  ws.status,
  ws.started_at,
  ws.completed_at,
  ws.elapsed_seconds,
  ws.notes,
  ws.perceived_difficulty,
  ws.total_exercises_count,
  ws.completed_exercises_count,
  ws.total_sets_count,
  ws.completed_sets_count,
  ws.created_at,
  ws.updated_at
from public.workout_sessions ws
where ws.status in ('discarded', 'abandoned');

comment on view reporting.discarded_session_summary is 'Discarded or abandoned workout sessions. Useful for workflow/debug/adherence dashboards.';

-- ---------------------------------------------------------------------------
-- View 3: exercise_completion_history
-- One row per completed workout_session_exercise, with best-set rollup.
-- ---------------------------------------------------------------------------
create or replace view reporting.exercise_completion_history as
with completed_sets as (
  select
    wse.id as workout_session_exercise_id,
    wse.workout_session_id,
    wse.exercise_id,
    wse.name_snapshot as exercise_name,
    wss.id as workout_session_set_id,
    wss.sort_order,
    wss.actual_load,
    wss.actual_load_unit,
    wss.actual_reps,
    wss.actual_rpe,
    wss.completed_at,
    wss.is_completed
  from public.workout_session_exercises wse
  join public.workout_session_sets wss
    on wss.workout_session_exercise_id = wse.id
  where wss.is_completed = true
),
ranked_sets as (
  select
    cs.*,
    row_number() over (
      partition by cs.workout_session_exercise_id
      order by cs.actual_load desc nulls last, cs.actual_reps desc nulls last, cs.sort_order desc
    ) as best_set_rank
  from completed_sets cs
)
select
  ws.id as workout_session_id,
  ws.athlete_id,
  ws.coach_id,
  ws.program_workout_id,
  ws.completed_at as session_completed_at,
  r.workout_session_exercise_id,
  r.exercise_id,
  r.exercise_name,
  count(*) over (partition by r.workout_session_exercise_id) as completed_set_count,
  r.workout_session_set_id as best_set_id,
  r.sort_order as best_set_sort_order,
  r.actual_load as best_set_load,
  r.actual_load_unit as best_set_load_unit,
  r.actual_reps as best_set_reps,
  r.actual_rpe as best_set_rpe
from ranked_sets r
join public.workout_sessions ws
  on ws.id = r.workout_session_id
where r.best_set_rank = 1
  and ws.status = 'completed';

comment on view reporting.exercise_completion_history is 'Completed exercise results with best-set rollup per workout_session_exercise.';

-- ---------------------------------------------------------------------------
-- View 4: exercise_performance_history
-- Direct reporting pass-through for derived exercise performance snapshots.
-- ---------------------------------------------------------------------------
create or replace view reporting.exercise_performance_history as
select
  eps.id,
  eps.athlete_id,
  eps.exercise_id,
  eps.workout_session_id,
  eps.workout_session_exercise_id,
  eps.metric_type,
  eps.load,
  eps.reps,
  eps.sets,
  eps.duration_seconds,
  eps.distance,
  eps.unit,
  eps.log_date,
  eps.estimated_one_rep_max,
  eps.notes,
  eps.created_at
from public.exercise_performance_snapshots eps;

comment on view reporting.exercise_performance_history is 'Derived exercise performance snapshots for progress and PR reporting.';

-- ---------------------------------------------------------------------------
-- View 5: pr_events
-- First-pass PR detection using strength snapshots.
--
-- Rule:
-- - metric_type = strength
-- - a PR event occurs when current load is greater than all prior loads for the same athlete/exercise/metric_type
-- - simple and readable first pass; can be refined later with e1RM or load+reps logic
-- ---------------------------------------------------------------------------
create or replace view reporting.pr_events as
with ranked as (
  select
    eps.*,
    lag(eps.load) over (
      partition by eps.athlete_id, eps.exercise_id, eps.metric_type
      order by eps.log_date, eps.created_at
    ) as previous_load,
    lag(eps.reps) over (
      partition by eps.athlete_id, eps.exercise_id, eps.metric_type
      order by eps.log_date, eps.created_at
    ) as previous_reps,
    max(eps.load) over (
      partition by eps.athlete_id, eps.exercise_id, eps.metric_type
      order by eps.log_date, eps.created_at
      rows between unbounded preceding and 1 preceding
    ) as prior_best_load
  from public.exercise_performance_snapshots eps
  where eps.metric_type = 'strength'
)
select
  id,
  athlete_id,
  exercise_id,
  workout_session_id,
  workout_session_exercise_id,
  log_date,
  load,
  reps,
  unit,
  estimated_one_rep_max,
  previous_load,
  previous_reps,
  prior_best_load
from ranked
where load is not null
  and (prior_best_load is null or load > prior_best_load);

comment on view reporting.pr_events is 'First-pass PR events derived from exercise_performance_snapshots metric_type = strength.';

-- ---------------------------------------------------------------------------
-- View 6: session_load_history
-- One row per completed session load summary.
-- ---------------------------------------------------------------------------
create or replace view reporting.session_load_history as
select
  sls.id,
  sls.athlete_id,
  ws.coach_id,
  sls.workout_session_id,
  ws.program_id,
  ws.program_day_id,
  ws.program_workout_id,
  ws.workout_template_id,
  ws.name_snapshot,
  ws.completed_at,
  sls.log_date,
  sls.completed_sets,
  sls.completed_reps,
  sls.volume_load,
  sls.effort_adjusted_load,
  sls.session_difficulty,
  ws.perceived_difficulty,
  ws.elapsed_seconds,
  ws.total_exercises_count,
  ws.completed_exercises_count,
  ws.total_sets_count,
  ws.completed_sets_count,
  sls.created_at
from public.session_load_summaries sls
join public.workout_sessions ws
  on ws.id = sls.workout_session_id
where ws.status = 'completed';

comment on view reporting.session_load_history is 'Completed-session load summaries for workload trend and difficulty reporting in Metabase.';

-- ---------------------------------------------------------------------------
-- View 7: muscle_load_event_history
-- Raw per-set muscle load events with exercise and muscle labels.
-- ---------------------------------------------------------------------------
create or replace view reporting.muscle_load_event_history as
select
  mle.id,
  mle.athlete_id,
  ws.coach_id,
  mle.workout_session_id,
  mle.workout_session_exercise_id,
  mle.workout_session_set_id,
  mle.exercise_id,
  e.name as exercise_name,
  mle.muscle_id,
  m.name as muscle_name,
  m.body_region as muscle_body_region,
  mle.sub_muscle_id,
  sm.name as sub_muscle_name,
  mle.is_sub_muscle,
  mle.event_date,
  mle.percent,
  mle.score,
  mle.created_at
from public.muscle_load_events mle
join public.workout_sessions ws
  on ws.id = mle.workout_session_id
left join public.exercises e
  on e.id = mle.exercise_id
left join public.muscles m
  on m.id = mle.muscle_id
left join public.sub_muscles sm
  on sm.id = mle.sub_muscle_id
where ws.status = 'completed';

comment on view reporting.muscle_load_event_history is 'Raw completed-set muscle load events with exercise and muscle labels for drilldown reporting.';

-- ---------------------------------------------------------------------------
-- View 8: muscle_fatigue_summary
-- Aggregated muscle load by completed session and target muscle.
-- ---------------------------------------------------------------------------
create or replace view reporting.muscle_fatigue_summary as
select
  mle.athlete_id,
  ws.coach_id,
  mle.workout_session_id,
  ws.program_id,
  ws.program_day_id,
  ws.program_workout_id,
  ws.name_snapshot,
  ws.completed_at,
  mle.event_date,
  mle.muscle_id,
  m.name as muscle_name,
  m.body_region as muscle_body_region,
  mle.sub_muscle_id,
  sm.name as sub_muscle_name,
  mle.is_sub_muscle,
  count(*) as contributing_event_count,
  count(distinct mle.exercise_id) as contributing_exercise_count,
  count(distinct mle.workout_session_set_id) as contributing_set_count,
  round(coalesce(sum(mle.percent), 0)::numeric, 2) as target_percent_total,
  round(coalesce(avg(mle.percent), 0)::numeric, 2) as target_percent_avg,
  round(coalesce(sum(mle.score), 0)::numeric, 2) as total_score,
  round(coalesce(avg(mle.score), 0)::numeric, 2) as avg_event_score,
  max(mle.created_at) as latest_event_created_at
from public.muscle_load_events mle
join public.workout_sessions ws
  on ws.id = mle.workout_session_id
left join public.muscles m
  on m.id = mle.muscle_id
left join public.sub_muscles sm
  on sm.id = mle.sub_muscle_id
where ws.status = 'completed'
group by
  mle.athlete_id,
  ws.coach_id,
  mle.workout_session_id,
  ws.program_id,
  ws.program_day_id,
  ws.program_workout_id,
  ws.name_snapshot,
  ws.completed_at,
  mle.event_date,
  mle.muscle_id,
  m.name,
  m.body_region,
  mle.sub_muscle_id,
  sm.name,
  mle.is_sub_muscle;

comment on view reporting.muscle_fatigue_summary is 'Session-by-session muscle load rollup for fatigue hotspot reporting in Metabase.';

-- ---------------------------------------------------------------------------
-- View 9: athlete_adherence_summary
-- Aggregate assigned workouts vs completed/discarded/in-progress sessions per athlete.
-- ---------------------------------------------------------------------------
create or replace view reporting.athlete_adherence_summary as
with session_rollup as (
  select
    athlete_id,
    count(*) filter (where status = 'completed') as completed_sessions,
    count(*) filter (where status in ('discarded', 'abandoned')) as discarded_sessions,
    count(*) filter (where status = 'in_progress') as in_progress_sessions
  from public.workout_sessions
  group by athlete_id
),
assignment_rollup as (
  select
    athlete_id,
    count(*) as assigned_program_workouts
  from public.program_workouts
  group by athlete_id
)
select
  coalesce(a.athlete_id, s.athlete_id) as athlete_id,
  coalesce(a.assigned_program_workouts, 0) as assigned_program_workouts,
  coalesce(s.completed_sessions, 0) as completed_sessions,
  coalesce(s.discarded_sessions, 0) as discarded_sessions,
  coalesce(s.in_progress_sessions, 0) as in_progress_sessions,
  case
    when coalesce(a.assigned_program_workouts, 0) = 0 then null
    else round((coalesce(s.completed_sessions, 0)::numeric / a.assigned_program_workouts::numeric) * 100, 2)
  end as completion_rate_percent
from assignment_rollup a
full outer join session_rollup s
  on s.athlete_id = a.athlete_id;

comment on view reporting.athlete_adherence_summary is 'Assigned vs completed/discarded workout summary per athlete.';

-- ---------------------------------------------------------------------------
-- View 10: coach_activity_summary
-- Useful for internal ops / coach-side adoption reporting.
-- ---------------------------------------------------------------------------
create or replace view reporting.coach_activity_summary as
with athlete_counts as (
  select
    coach_id,
    count(*) as athlete_count
  from public.athlete_profiles
  where coach_id is not null
  group by coach_id
),
program_counts as (
  select
    coach_id,
    count(*) as assigned_workout_count
  from public.program_workouts
  where coach_id is not null
  group by coach_id
),
session_counts as (
  select
    coach_id,
    count(*) filter (where status = 'completed') as completed_session_count,
    count(*) filter (where status in ('discarded', 'abandoned')) as discarded_session_count
  from public.workout_sessions
  where coach_id is not null
  group by coach_id
)
select
  coalesce(ac.coach_id, pc.coach_id, sc.coach_id) as coach_id,
  coalesce(ac.athlete_count, 0) as athlete_count,
  coalesce(pc.assigned_workout_count, 0) as assigned_workout_count,
  coalesce(sc.completed_session_count, 0) as completed_session_count,
  coalesce(sc.discarded_session_count, 0) as discarded_session_count
from athlete_counts ac
full outer join program_counts pc
  on pc.coach_id = ac.coach_id
full outer join session_counts sc
  on sc.coach_id = coalesce(ac.coach_id, pc.coach_id);

comment on view reporting.coach_activity_summary is 'Coach-level rollup of athletes, assignments, completed sessions, and discarded sessions.';

commit;

-- ---------------------------------------------------------------------------
-- OPTIONAL: read-only Metabase role
--
-- IMPORTANT:
-- 1. Replace the password before running.
-- 2. If you already created a reporting role, skip this section.
-- 3. Use Supabase Session pooler credentials in Metabase unless you specifically
--    need direct connection because of IPv6 / IPv4 Add-On.
-- ---------------------------------------------------------------------------

-- create role metabase_reader
-- with
--   login
--   password 'REPLACE_WITH_STRONG_PASSWORD';
--
-- grant connect on database postgres to metabase_reader;
--
-- grant usage on schema reporting to metabase_reader;
-- grant usage on schema public to metabase_reader;
--
-- grant select on all tables in schema reporting to metabase_reader;
--
-- grant select on
--   public.workout_sessions,
--   public.workout_session_exercises,
--   public.workout_session_sets,
--   public.session_load_summaries,
--   public.exercise_performance_snapshots,
--   public.muscle_load_events,
--   public.muscles,
--   public.sub_muscles,
--   public.program_workouts,
--   public.program_workout_exercises,
--   public.program_workout_sets,
--   public.program_workout_display_states
-- to metabase_reader;
--
-- alter default privileges in schema reporting
-- grant select on tables to metabase_reader;
