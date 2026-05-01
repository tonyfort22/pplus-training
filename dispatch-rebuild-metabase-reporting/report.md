# Metabase reporting rebuild report

## Outcome
I restored the manifest-defined PPLUS Metabase reporting structure into the existing healthy Metabase instance on `http://127.0.0.1:3002` without recreating services, wiping metadata, recreating the Metabase container, replacing the Metabase metadata volume, or replacing the preserved Supabase connection. The live Metabase structure now includes the required root collection, four child collections, ten manifest-aligned saved questions, and four manifest-aligned dashboards while preserving the pre-existing PPLUS operational content.

## What was restored
### Root collection
- `PPLUS Reporting` (id `5`)

### Child collections
- `PPLUS Reporting / Sessions` (id `6`, created_during_restore `True`)
- `PPLUS Reporting / Performance` (id `7`, created_during_restore `True`)
- `PPLUS Reporting / Workload & Fatigue` (id `8`, created_during_restore `True`)
- `PPLUS Reporting / Ops` (id `9`, created_during_restore `True`)

### Saved questions
- `Completed Sessions` in `PPLUS Reporting / Sessions` from `reporting.completed_session_summary` (card id `50`, created_during_restore `True`)
- `Discarded Sessions` in `PPLUS Reporting / Sessions` from `reporting.discarded_session_summary` (card id `51`, created_during_restore `True`)
- `Exercise Completion History` in `PPLUS Reporting / Performance` from `reporting.exercise_completion_history` (card id `52`, created_during_restore `True`)
- `Exercise Performance History` in `PPLUS Reporting / Performance` from `reporting.exercise_performance_history` (card id `53`, created_during_restore `True`)
- `PR Events` in `PPLUS Reporting / Performance` from `reporting.pr_events` (card id `54`, created_during_restore `True`)
- `Session Load History` in `PPLUS Reporting / Workload & Fatigue` from `reporting.session_load_history` (card id `55`, created_during_restore `True`)
- `Muscle Load Event History` in `PPLUS Reporting / Workload & Fatigue` from `reporting.muscle_load_event_history` (card id `56`, created_during_restore `True`)
- `Muscle Fatigue Summary` in `PPLUS Reporting / Workload & Fatigue` from `reporting.muscle_fatigue_summary` (card id `57`, created_during_restore `True`)
- `Athlete Adherence Summary` in `PPLUS Reporting / Ops` from `reporting.athlete_adherence_summary` (card id `58`, created_during_restore `True`)
- `Coach Activity Summary` in `PPLUS Reporting / Ops` from `reporting.coach_activity_summary` (card id `59`, created_during_restore `True`)

### Dashboards
- `PPLUS Reporting - Sessions` in `PPLUS Reporting` (dashboard id `4`, dashcards `2`, created_during_restore `True`)
- `PPLUS Reporting - Performance & PRs` in `PPLUS Reporting` (dashboard id `5`, dashcards `3`, created_during_restore `True`)
- `PPLUS Reporting - Workload & Fatigue` in `PPLUS Reporting` (dashboard id `6`, dashcards `3`, created_during_restore `True`)
- `PPLUS Reporting - Adherence & Coach Ops` in `PPLUS Reporting` (dashboard id `7`, dashcards `2`, created_during_restore `True`)

## What was preserved
- Preserved the existing `metabase` container. No container recreation was performed.
- Preserved the existing `metabase-data` metadata volume. No reset, wipe, or replacement was performed.
- Preserved the existing Metabase application metadata store and worked through the authenticated Metabase API only.
- Preserved the existing Metabase database connection with database id `2`, name `postgres`, engine `postgres`, host `aws-1-us-east-2.pooler.supabase.com`, and SSL enabled.
- Preserved the already-existing PPLUS operational content under `PPLUS Reporting`, including `PPLUS Workflow Monitor v2`, `PPLUS Session Anomalies`, and the previously restored ops-oriented saved questions that did not conflict with the manifest.
- Preserved sample content and unrelated collections.

## Verification
Authenticated API verification confirmed the following:
- Metabase authenticated user: `tonyfortugno22@gmail.com`
- Preserved database id: `2`
- Reporting schema visible objects: `10`
- Child collections are present under the root collection in the live collection inventory.
- Each manifest question executed successfully against the preserved database connection and returned preview metadata.
- Each manifest dashboard exists and contains the expected manifest card set.

Preview metadata observed during verification:
- `Completed Sessions`: sampled_rows `2`, columns `workout_session_id, athlete_id, coach_id, program_id, program_day_id, program_workout_id, workout_template_id, name_snapshot, status, started_at, completed_at, elapsed_seconds, notes, perceived_difficulty, total_exercises_count, completed_exercises_count, total_sets_count, completed_sets_count, created_at, updated_at`
- `Discarded Sessions`: sampled_rows `5`, columns `workout_session_id, athlete_id, coach_id, program_id, program_day_id, program_workout_id, workout_template_id, name_snapshot, status, started_at, completed_at, elapsed_seconds, notes, perceived_difficulty, total_exercises_count, completed_exercises_count, total_sets_count, completed_sets_count, created_at, updated_at`
- `Exercise Completion History`: sampled_rows `5`, columns `workout_session_id, athlete_id, coach_id, program_workout_id, session_completed_at, workout_session_exercise_id, exercise_id, exercise_name, completed_set_count, best_set_id, best_set_sort_order, best_set_load, best_set_load_unit, best_set_reps, best_set_rpe`
- `Exercise Performance History`: sampled_rows `5`, columns `id, athlete_id, exercise_id, workout_session_id, workout_session_exercise_id, metric_type, load, reps, sets, duration_seconds, distance, unit, log_date, estimated_one_rep_max, notes, created_at`
- `PR Events`: sampled_rows `4`, columns `id, athlete_id, exercise_id, workout_session_id, workout_session_exercise_id, log_date, load, reps, unit, estimated_one_rep_max, previous_load, previous_reps, prior_best_load`
- `Session Load History`: sampled_rows `2`, columns `id, athlete_id, coach_id, workout_session_id, program_id, program_day_id, program_workout_id, workout_template_id, name_snapshot, completed_at, log_date, completed_sets, completed_reps, volume_load, effort_adjusted_load, session_difficulty, perceived_difficulty, elapsed_seconds, total_exercises_count, completed_exercises_count, total_sets_count, completed_sets_count, created_at`
- `Muscle Load Event History`: sampled_rows `5`, columns `id, athlete_id, coach_id, workout_session_id, workout_session_exercise_id, workout_session_set_id, exercise_id, exercise_name, muscle_id, muscle_name, muscle_body_region, sub_muscle_id, sub_muscle_name, is_sub_muscle, event_date, percent, score, created_at`
- `Muscle Fatigue Summary`: sampled_rows `5`, columns `athlete_id, coach_id, workout_session_id, program_id, program_day_id, program_workout_id, name_snapshot, completed_at, event_date, muscle_id, muscle_name, muscle_body_region, sub_muscle_id, sub_muscle_name, is_sub_muscle, contributing_event_count, contributing_exercise_count, contributing_set_count, target_percent_total, target_percent_avg, total_score, avg_event_score, latest_event_created_at`
- `Athlete Adherence Summary`: sampled_rows `1`, columns `athlete_id, assigned_program_workouts, completed_sessions, discarded_sessions, in_progress_sessions, completion_rate_percent`
- `Coach Activity Summary`: sampled_rows `1`, columns `coach_id, athlete_count, assigned_workout_count, completed_session_count, discarded_session_count`

Dashboard layouts applied during verification:
- `PPLUS Reporting - Sessions`: Completed Sessions @ col 0 row 0 size 24x8; Discarded Sessions @ col 0 row 8 size 24x8
- `PPLUS Reporting - Performance & PRs`: PR Events @ col 0 row 0 size 24x8; Exercise Performance History @ col 0 row 8 size 24x8; Exercise Completion History @ col 0 row 16 size 24x8
- `PPLUS Reporting - Workload & Fatigue`: Session Load History @ col 0 row 0 size 24x8; Muscle Fatigue Summary @ col 0 row 8 size 24x8; Muscle Load Event History @ col 0 row 16 size 24x8
- `PPLUS Reporting - Adherence & Coach Ops`: Athlete Adherence Summary @ col 0 row 0 size 12x8; Coach Activity Summary @ col 12 row 0 size 12x8

## Remaining gaps
- The repo-visible artifacts did not include a historical Metabase export with exact visualization settings, dashboard filters, or pixel-perfect dashcard formatting, so the rebuild uses straightforward table questions plus sensible dashboard placement that follows the manifest guidance.
- The current rebuild restores the named reporting structure exactly where the manifest was explicit and preserves the existing healthy operational PPLUS content alongside it.

## Files written
- `/Users/anthonyfortugno/.openclaw.pre-migration/workspace/projects/pplus-training/dispatch-rebuild-metabase-reporting/report.md`
- `/Users/anthonyfortugno/.openclaw.pre-migration/workspace/projects/pplus-training/dispatch-rebuild-metabase-reporting/restore_result.json`
- `/Users/anthonyfortugno/.openclaw.pre-migration/workspace/projects/pplus-training/dispatch-rebuild-metabase-reporting/restore_run_output.json`

## Exact restore posture
This restore did not wipe metadata, did not recreate services, did not mutate the Supabase connection, and did not archive or delete pre-existing healthy PPLUS reporting content. It added the missing manifest-defined structure beside the preserved content and verified the result through the live Metabase API.
