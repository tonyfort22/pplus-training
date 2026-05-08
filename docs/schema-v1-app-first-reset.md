# PPLUS Training, Schema v1 App-First Reset

## Purpose
This is the reset version of schema v1, rebuilt from the **current app we actually built**.

Primary sources of truth for this document are:
- `apps/mobile/src/train/index.js`
- `packages/core/src/index.js`
- `apps/mobile/src/train/session-models.js`
- `apps/mobile/src/train/completed-session-models.js`
- `apps/mobile/src/progress/index.js`
- `apps/mobile/src/train/program-sheet-models.js`

Secondary inputs only:
- imported content from HockeyTraining and Thibault
- older PPHT / OpenClaw artifacts as background reference, not schema authority

## Core reset principle
The schema should first model the app that already exists.

That means:
- the train flow comes first
- the session engine comes first
- the progress logic comes from completed sessions
- content import supports the app, not the other way around

---

## What the app clearly has today

### Train flow
The current mobile app is built around these athlete surfaces:
- Today
- Program
- Calendar
- Workout
- Session

### Current planning shape in code
The app already thinks in terms of:
- a **program workout**
- with **exercises**
- with **sets**

The current demo structure in `apps/mobile/src/train/index.js` already uses:
- `programId`
- `programDayId`
- `workoutTemplateId`
- `nameSnapshot`
- `exerciseId`
- `nameSnapshot`
- `sortOrder`
- `defaultRestSeconds`
- `targetReps`
- `targetLoad`
- `targetLoadUnit`
- `targetRpe`
- `targetRestSeconds`

### Current execution shape in code
The session engine in `packages/core/src/index.js` already clearly uses:
- `workout session`
- `session exercises`
- `session sets`
- `prescribed*` fields
- `actual*` fields
- completion flags/timestamps
- rest timer state
- session-level counts and summaries

### Current progress shape in code
The current progress view already derives from completed sessions:
- estimated 1RM
- weekly load
- readiness label
- muscle fatigue rows
- recent momentum
- exercise breakdown

So the schema spine should directly support those things first.

---

# App-first schema spine

## Layer 1: Identity
This stays simple.

### users
- id
- email
- role (`athlete`, `coach`, `admin`)
- created_at
- updated_at

### athlete_profiles
- id
- user_id
- coach_id nullable
- first_name
- last_name
- date_of_birth nullable
- sport nullable
- position nullable
- handedness nullable
- units_preference nullable
- status nullable
- created_at
- updated_at

### coach_profiles
- id
- user_id
- display_name
- organization_name nullable
- bio nullable
- created_at
- updated_at

---

## Layer 2: Exercise library
This is required because both Train and Progress depend on normalized exercise identity.

### exercises
- id
- name
- slug nullable
- description nullable
- coaching_cues nullable
- video_url nullable
- thumbnail_url nullable
- difficulty nullable
- movement_pattern nullable
- stimulus_type nullable
- body_region nullable
- default_equipment nullable
- default_load_unit nullable
- created_by nullable
- created_at
- updated_at

### exercise_aliases
Keep this because imported source naming will be messy.
- id
- exercise_id
- alias_text
- alias_type (`source_import`, `display_variant`, `search_synonym`, `coach_label`)
- source_system nullable
- created_at

### muscles
- id
- name
- slug nullable
- body_region nullable
- thumbnail_url nullable
- sort_order nullable
- is_active

### sub_muscles
- id
- muscle_id
- name
- slug nullable
- thumbnail_url nullable
- sort_order nullable
- is_active

### exercise_muscle_maps
- id
- exercise_id
- muscle_id
- role (`primary`, `secondary`, `stabilizer`)
- contribution_percent nullable
- sort_order nullable
- created_at

### exercise_sub_muscle_maps
- id
- exercise_id
- exercise_muscle_map_id nullable
- sub_muscle_id
- role (`primary`, `secondary`, `stabilizer`)
- contribution_percent nullable
- sort_order nullable
- created_at

### Optional later
Only add these if the import path truly needs them early:
- `exercise_options`
- `exercise_option_members`

Reason:
The current app does not yet clearly depend on exercise-choice groups.
That was more import-driven than app-driven.

---

## Layer 3: Workout templates
The current planning objects still reference `workoutTemplateId`, so templates should exist.
But the shape should stay tight.

### workout_templates
- id
- coach_id nullable
- name
- description nullable
- category nullable
- focus_area nullable
- training_type nullable
- estimated_duration_minutes nullable
- thumbnail_url nullable
- status (`draft`, `active`, `archived`)
- created_at
- updated_at

### workout_template_exercises
- id
- workout_template_id
- exercise_id nullable
- name_snapshot
- sort_order
- notes nullable
- default_rest_seconds nullable
- created_at
- updated_at

### workout_template_sets
- id
- workout_template_exercise_id
- sort_order
- set_type
- target_reps nullable
- target_load nullable
- target_load_unit nullable
- target_duration_seconds nullable
- target_distance nullable
- target_distance_unit nullable
- target_rpe nullable
- target_rir nullable
- target_rest_seconds nullable
- notes nullable
- created_at
- updated_at

### Why blocks are not mandatory in the reset spine
The app currently renders workout exercises in a flat ordered list.
It does **not** currently prove that workout blocks are essential to the product spine.

So:
- `workout_template_blocks` should be optional for later
- do not force block structure into v1 if the app can already function without it

That is a major difference from the OpenClaw-heavy version.

---

## Layer 4: Program planning
This is the app’s actual planning domain.
It powers Today, Program, Calendar, and Workout detail.

### programs
- id
- athlete_id
- coach_id nullable
- name
- description nullable
- start_date nullable
- end_date nullable
- status (`draft`, `active`, `paused`, `completed`, `archived`)
- created_at
- updated_at

### program_weeks
- id
- program_id
- week_index
- name nullable
- start_date nullable
- end_date nullable
- created_at
- updated_at

### program_days
- id
- program_week_id
- day_index
- date nullable
- name nullable
- notes nullable
- status nullable
- created_at
- updated_at

### program_workouts
This is the key planning object in the app.
- id
- athlete_id nullable
- coach_id nullable
- program_id nullable
- program_day_id nullable
- workout_template_id nullable
- name_snapshot
- status (`scheduled`, `available`, `in_progress`, `completed`, `missed`, `skipped`)
- sort_order nullable
- created_at
- updated_at

### program_workout_exercises
This matches what the app uses directly before session start.
- id
- program_workout_id
- exercise_id nullable
- name_snapshot
- sort_order
- notes nullable
- default_rest_seconds nullable
- created_at
- updated_at

### program_workout_sets
This is the pre-session prescription source.
- id
- program_workout_exercise_id
- sort_order
- set_type
- target_reps nullable
- target_load nullable
- target_load_unit nullable
- target_duration_seconds nullable
- target_distance nullable
- target_distance_unit nullable
- target_rpe nullable
- target_rir nullable
- target_rest_seconds nullable
- notes nullable
- created_at
- updated_at

### Why this layer matters most
The current app already clearly operates with:
- selected calendar day
- current program week
- workout preview
- scheduled workout detail

So this layer is not speculative. It is real.

---

## Layer 5: Session execution
This is the most important layer in the app-first schema.
It is already clearly defined in the core engine.

### workout_sessions
- id
- athlete_id nullable
- coach_id nullable
- program_id nullable
- program_day_id nullable
- program_workout_id nullable
- workout_template_id nullable
- name_snapshot
- status (`draft`, `in_progress`, `paused`, `completed`, `discarded`, `abandoned`)
- started_at
- completed_at nullable
- elapsed_seconds
- notes nullable
- perceived_difficulty nullable
- total_exercises_count
- completed_exercises_count
- total_sets_count
- completed_sets_count
- created_at
- updated_at

### workout_session_exercises
- id
- workout_session_id
- program_workout_exercise_id nullable
- exercise_id nullable
- name_snapshot
- sort_order
- status (`not_started`, `active`, `completed`, `skipped`)
- notes nullable
- default_rest_seconds nullable
- created_at
- updated_at

### workout_session_sets
This is the execution ledger.
- id
- workout_session_exercise_id
- program_workout_set_id nullable
- sort_order
- set_type
- prescribed_reps nullable
- prescribed_load nullable
- prescribed_load_unit nullable
- prescribed_duration_seconds nullable
- prescribed_distance nullable
- prescribed_distance_unit nullable
- prescribed_rpe nullable
- prescribed_rir nullable
- prescribed_rest_seconds nullable
- actual_reps nullable
- actual_load nullable
- actual_load_unit nullable
- actual_duration_seconds nullable
- actual_distance nullable
- actual_distance_unit nullable
- actual_rpe nullable
- actual_rir nullable
- actual_rest_seconds nullable
- completed_at nullable
- is_completed
- notes nullable
- created_at
- updated_at

### rest_timer_states
Because the app already has active rest-timer behavior.
- id
- workout_session_id
- workout_session_set_id nullable
- mode (`timer`, `stopwatch`)
- duration_seconds
- remaining_seconds
- started_at
- ended_at nullable
- is_running
- created_at
- updated_at

### Core rule
If planning and execution disagree, execution wins.

That is not a theory.
That is already how the app works.

---

## Layer 6: Progress and analytics
This should stay close to what the app actually computes today.

### exercise_performance_snapshots
Needed for:
- exercise history
- estimated 1RM
- best/recent performance
- exercise detail charts later

Fields:
- id
- athlete_id
- exercise_id
- workout_session_id nullable
- workout_session_exercise_id nullable
- metric_type (`strength`, `volume`, `distance`, `duration`, `custom`)
- load nullable
- reps nullable
- sets nullable
- duration_seconds nullable
- distance nullable
- unit nullable
- log_date
- estimated_one_rep_max nullable
- notes nullable
- created_at

### muscle_load_events
Needed because the app already has muscle fatigue / recovery direction.
- id
- athlete_id
- workout_session_id
- workout_session_exercise_id nullable
- workout_session_set_id nullable
- exercise_id nullable
- muscle_id nullable
- sub_muscle_id nullable
- is_sub_muscle
- event_date
- percent nullable
- score nullable
- created_at

### session_muscle_load_summaries
This is enough for the current progress surface.
- id
- athlete_id
- workout_session_id
- muscle_id
- event_date
- percent nullable
- score nullable
- cap nullable
- level nullable
- created_at

### recovery_snapshots
Keep this simple for now.
- id
- athlete_id
- snapshot_date
- muscle_id nullable
- sub_muscle_id nullable
- fatigue_score nullable
- recovery_score nullable
- recovery_percent nullable
- readiness_level nullable
- source_window_days nullable
- created_at

### body_metric_logs
Because the current progress surface already points toward health metrics.
- id
- athlete_id
- coach_id nullable
- metric_type
- value
- unit nullable
- recorded_at
- source nullable
- notes nullable
- progress_photo_url nullable
- created_at

### What is intentionally not central in the reset
- giant generalized progress-ledger tables
- complex readiness formulas in schema
- sub-muscle summary tables unless the app really proves it needs them
- imported-content-driven analytics tables

---

## Layer 7: Content support, not content control
We still need imported content, but it should not dominate the whole schema.

This should stay lightweight in the app-first reset.

### content_sources
- id
- code
- name
- source_type
- description nullable
- origin_url nullable
- import_notes nullable
- created_at
- updated_at

### content_collections
- id
- content_source_id
- parent_collection_id nullable
- collection_type
- name
- slug nullable
- description nullable
- sort_order nullable
- created_at
- updated_at

### content_items
- id
- content_collection_id
- parent_item_id nullable
- item_type
- title
- slug nullable
- summary nullable
- source_url nullable
- source_file_label nullable
- source_identifier nullable
- content_text nullable
- duration_seconds nullable
- estimated_duration_minutes nullable
- normalization_status nullable
- created_at
- updated_at

### Use of content in the reset model
Imported content should support:
- exercise normalization
- future template creation
- future in-app libraries

But imported content should **not** be the main thing driving the train/session schema.

---

# Migration recommendation from the reset

## Must be in the first pass
- users
- athlete_profiles
- coach_profiles
- exercises
- exercise_aliases
- muscles
- sub_muscles
- exercise_muscle_maps
- exercise_sub_muscle_maps
- workout_templates
- workout_template_exercises
- workout_template_sets
- programs
- program_weeks
- program_days
- program_workouts
- program_workout_exercises
- program_workout_sets
- workout_sessions
- workout_session_exercises
- workout_session_sets
- rest_timer_states
- exercise_performance_snapshots
- muscle_load_events
- session_muscle_load_summaries
- recovery_snapshots
- body_metric_logs

## Good later additions, not first-pass spine
- exercise_options
- exercise_option_members
- content_sources
- content_collections
- content_items
- workout_template_blocks
- program phases
- program blocks
- session blocks
- sub-muscle summary tables
- generalized progress log tables

---

# Biggest differences versus the drifted version

## 1. The current app comes first
The old drifted version let historical architecture pull the design outward.
This reset anchors the schema to the app we actually built.

## 2. Blocks are no longer forced into the spine
The app currently works with flat ordered exercise/set lists.
So block tables are optional, not mandatory.

## 3. Content import is supportive, not dominant
The imported libraries matter, but they do not get to dictate the execution model.

## 4. Analytics stay close to current product reality
Only the progress structures the app already points to are kept central.

## 5. The whole thing is smaller
This reset is intentionally less clever and more faithful.
That is the point.

---

# Final call
If we stay honest to the current app, the real PPLUS schema spine is:

**Identity -> Exercises -> Workout Templates -> Program Workouts -> Workout Sessions -> Progress**

Everything else is supporting structure.
