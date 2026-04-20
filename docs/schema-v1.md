# PPLUS Training, Schema v1

## Purpose
This schema is the first clean relational model for PPLUS Training.
It preserves what mattered from the PPHT Bubble work while removing the planning and execution overlap.

## Main design rules
- content, planning, execution, and analytics are separate layers
- execution rows are snapshots of planned data at session start
- prescribed values are immutable references to plan inside a session set
- actual values capture what the athlete performed
- analytics run from actual completed session data

## Core tables

## Identity

### users
- id
- email
- role (`athlete`, `coach`, `admin`)
- created_at
- updated_at

### athlete_profiles
- id
- user_id
- coach_id
- first_name
- last_name
- date_of_birth
- sport
- position
- status
- created_at
- updated_at

### coach_profiles
- id
- user_id
- display_name
- organization_name
- bio
- created_at
- updated_at

## Exercise library

### exercises
- id
- name
- slug
- description
- coaching_cues
- video_url
- thumbnail_url
- difficulty
- movement_pattern
- stimulus_type
- body_region
- default_equipment
- fatigue_multiplier
- axial_fatigue_multiplier
- skill_fatigue_multiplier
- status
- created_by
- created_at
- updated_at

### muscles
- id
- name
- slug
- body_region
- thumbnail_url
- sort_order
- is_active

### sub_muscles
- id
- muscle_id
- name
- slug
- thumbnail_url
- sort_order
- is_active

### exercise_muscle_maps
- id
- exercise_id
- muscle_id
- role (`primary`, `secondary`, `stabilizer`)
- contribution_percent
- sort_order
- created_at

### exercise_sub_muscle_maps
- id
- exercise_id
- exercise_muscle_map_id
- sub_muscle_id
- role (`primary`, `secondary`, `stabilizer`)
- contribution_percent
- sort_order
- created_at

## Workout templates

### workout_templates
- id
- coach_id
- name
- description
- category
- difficulty
- focus_area
- estimated_duration_minutes
- thumbnail_url
- is_active
- created_at
- updated_at

### workout_template_exercises
- id
- workout_template_id
- exercise_id
- name_snapshot
- sort_order
- notes
- default_rest_seconds
- created_at
- updated_at

### workout_template_sets
- id
- workout_template_exercise_id
- sort_order
- set_type
- target_reps
- target_load
- target_load_unit
- target_duration_seconds
- target_distance
- target_distance_unit
- target_rpe
- target_rir
- target_rest_seconds
- notes
- created_at
- updated_at

## Program planning

### programs
- id
- athlete_id
- coach_id
- name
- description
- start_date
- end_date
- status
- created_at
- updated_at

### program_weeks
- id
- program_id
- week_index
- name
- start_date
- end_date
- created_at
- updated_at

### program_days
- id
- program_week_id
- day_index
- date
- name
- notes
- created_at
- updated_at

### program_workouts
- id
- program_day_id
- workout_template_id
- name_snapshot
- description_snapshot
- category_snapshot
- difficulty_snapshot
- focus_area_snapshot
- estimated_duration_minutes_snapshot
- sort_order
- status
- created_at
- updated_at

### program_workout_exercises
- id
- program_workout_id
- workout_template_exercise_id
- exercise_id
- name_snapshot
- sort_order
- notes
- default_rest_seconds
- created_at
- updated_at

### program_workout_sets
- id
- program_workout_exercise_id
- workout_template_set_id
- sort_order
- set_type
- target_reps
- target_load
- target_load_unit
- target_duration_seconds
- target_distance
- target_distance_unit
- target_rpe
- target_rir
- target_rest_seconds
- notes
- created_at
- updated_at

## Session execution

### workout_sessions
- id
- athlete_id
- coach_id
- program_id
- program_day_id
- program_workout_id
- workout_template_id
- name_snapshot
- status (`draft`, `in_progress`, `paused`, `completed`, `abandoned`)
- started_at
- completed_at
- elapsed_seconds
- notes
- perceived_difficulty
- total_exercises_count
- completed_exercises_count
- total_sets_count
- completed_sets_count
- created_at
- updated_at

### workout_session_exercises
- id
- workout_session_id
- program_workout_exercise_id
- exercise_id
- name_snapshot
- sort_order
- status (`not_started`, `active`, `completed`, `skipped`)
- notes
- default_rest_seconds
- created_at
- updated_at

### workout_session_sets
- id
- workout_session_exercise_id
- program_workout_set_id
- sort_order
- set_type
- prescribed_reps
- prescribed_load
- prescribed_load_unit
- prescribed_duration_seconds
- prescribed_distance
- prescribed_distance_unit
- prescribed_rpe
- prescribed_rir
- prescribed_rest_seconds
- actual_reps
- actual_load
- actual_load_unit
- actual_duration_seconds
- actual_distance
- actual_distance_unit
- actual_rpe
- actual_rir
- actual_rest_seconds
- completed_at
- is_completed
- notes
- created_at
- updated_at

### rest_timer_states
- id
- workout_session_id
- workout_session_set_id
- mode (`timer`, `stopwatch`)
- duration_seconds
- remaining_seconds
- started_at
- ended_at
- is_running
- created_at
- updated_at

## Analytics

### muscle_load_events
- id
- athlete_id
- workout_session_id
- workout_session_exercise_id
- workout_session_set_id
- exercise_id
- muscle_id
- sub_muscle_id
- is_sub_muscle
- event_date
- percent
- score
- created_at

### session_muscle_load_summaries
- id
- athlete_id
- workout_session_id
- muscle_id
- event_date
- percent
- score
- cap
- level
- created_at

### session_sub_muscle_load_summaries
- id
- athlete_id
- workout_session_id
- muscle_id
- sub_muscle_id
- event_date
- percent
- score
- cap
- level
- created_at

### exercise_performance_snapshots
- id
- athlete_id
- exercise_id
- workout_session_id
- workout_session_exercise_id
- metric_type
- load
- reps
- sets
- duration_seconds
- distance
- unit
- body_region
- log_date
- notes
- created_at

### body_metric_logs
- id
- athlete_id
- coach_id
- log_date
- weight_lb
- sleep_hours
- recovery_score
- energy_score
- mood_score
- training_compliance
- nutrition_compliance
- notes
- progress_photo_url
- created_at

### recovery_snapshots
- id
- athlete_id
- snapshot_date
- muscle_id
- sub_muscle_id
- fatigue_score
- recovery_score
- readiness_level
- created_at

## Critical workflow rules tied to schema

### Create session from plan
When a session starts:
- create `workout_sessions`
- create `workout_session_exercises`
- create `workout_session_sets`
- copy planned values into prescribed fields
- leave actual fields blank until performed or defaulted on completion

### Complete set
When a set is marked complete:
- if actual field is blank, copy prescribed value to matching actual field
- set `is_completed = true`
- set `completed_at`
- do not overwrite prescribed fields

### Finish session
When session is completed:
- set authoritative completion fields on `workout_sessions`
- trigger analytics creation from completed actual set values

## Notes for Supabase implementation later
- use Postgres enums for major statuses where stable
- add foreign keys and cascading delete carefully
- use row level security for athlete and coach access
- prefer generated SQL migrations over ad hoc manual table editing
