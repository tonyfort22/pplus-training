-- PPLUS Metabase analytics reporting views
--
-- Purpose:
-- Add workload + muscle-load reporting views for Metabase without touching app tables.
-- Safe to re-run.

begin;

create schema if not exists reporting;

-- ---------------------------------------------------------------------------
-- View 1: session_load_history
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
-- View 2: muscle_load_event_history
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
-- View 3: muscle_fatigue_summary
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

commit;
