-- Run after finishing a real workout session to verify v1 analytics persistence.
-- Replace the session id in each query if you want to target a specific completed workout.

-- 1) Most recent completed workout sessions
select
  id,
  athlete_id,
  program_workout_id,
  status,
  completed_at,
  completed_sets_count,
  total_sets_count,
  perceived_difficulty,
  updated_at
from workout_sessions
where status = 'completed'
order by completed_at desc nulls last, updated_at desc nulls last
limit 10;

-- 2) Session load summary rows for recent completed sessions
select
  sls.id,
  sls.workout_session_id,
  sls.athlete_id,
  sls.completed_sets,
  sls.completed_reps,
  sls.volume_load,
  sls.effort_adjusted_load,
  sls.session_difficulty,
  sls.log_date,
  sls.created_at
from session_load_summaries sls
join workout_sessions ws on ws.id = sls.workout_session_id
where ws.status = 'completed'
order by ws.completed_at desc nulls last, sls.created_at desc
limit 20;

-- 3) Exercise performance snapshot rows for recent completed sessions
select
  eps.id,
  eps.workout_session_id,
  eps.exercise_id,
  eps.metric_type,
  eps.load,
  eps.reps,
  eps.sets,
  eps.body_region,
  eps.estimated_one_rep_max,
  eps.log_date,
  eps.created_at
from exercise_performance_snapshots eps
join workout_sessions ws on ws.id = eps.workout_session_id
where ws.status = 'completed'
order by ws.completed_at desc nulls last, eps.created_at desc
limit 50;

-- 4) Muscle load event rows for recent completed sessions
select
  mle.id,
  mle.workout_session_id,
  mle.exercise_id,
  mle.muscle_id,
  mle.sub_muscle_id,
  mle.is_sub_muscle,
  mle.percent,
  mle.score,
  mle.event_date,
  mle.created_at
from muscle_load_events mle
join workout_sessions ws on ws.id = mle.workout_session_id
where ws.status = 'completed'
order by ws.completed_at desc nulls last, mle.created_at desc
limit 100;
