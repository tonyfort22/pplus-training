# PPLUS Training, Schema v1

## Purpose
This is the working schema v1 for PPLUS Training.

It is based on three real sources we now have:
- the content corpus collected so far, including HockeyTraining inventory and the Thibault source material
- the mobile app structure and surfaces already built in this repo
- the old PPHT / OpenClaw execution and analytics model, especially prescribed-vs-actual logging, session lineage, and fatigue/progress tracking

This document is the product-level source of truth before final SQL.
It should later reconcile into:
- `infra/supabase/schema-v1.sql`
- `infra/supabase/migrations/0001_initial_schema.sql`

---

## Core design rules

1. **Content, planning, execution, and analytics are separate layers**
   - imported content is not the same thing as an assigned program
   - an assigned program is not the same thing as a completed session
   - analytics must come from actual performed work, not planned rows

2. **Prescribed and actual values stay separate**
   - prescribed fields are snapshots of the assigned plan
   - actual fields store what the athlete really performed
   - actual values must never overwrite prescribed values

3. **Execution has real lineage**
   - a completed set should point back to the session, exercise, assigned plan row, and normalized exercise if available
   - fatigue and progress rows should trace back to actual completed work

4. **The content library has to support messy real-world source material**
   - PDFs, phases, lessons, workouts, videos, links, and alternate naming all exist
   - source text should be preservable even when normalization is incomplete

5. **The mobile app should map cleanly onto the schema**
   - Train maps to program planning and session execution
   - Progress maps to analytics and history
   - Team/Inbox are later domains and should not distort the training schema

6. **Schema v1 should be practical, not overbuilt**
   - include what the current app and content need now
   - defer things that are not yet required, but leave clean extension points

---

## Product surfaces this schema must support

### Athlete mobile app
- Train
  - current program
  - weekly calendar
  - workout detail
  - active session
  - completed session summary
- Progress
  - exercise progress
  - exercise history
  - estimated 1RM / best performance
  - training load
  - muscle fatigue / recovery
  - body metrics later
- Profile / settings later

### Coach/admin side
- content library
- exercise library
- workout template builder
- program assignment
- athlete progress review

---

# Layer 1: Identity

Supabase `auth.users` is the canonical identity source for sign-in credentials.
Application-owned profile tables hang off `auth.users.id` rather than duplicating a `public.users` table.
New auth signups should automatically provision the correct profile row through the auth-user trigger in the SQL foundation:
- `coach_profiles` when `raw_user_meta_data.role = 'coach'`
- `athlete_profiles` otherwise

## athlete_profiles
- id
- user_id (`auth.users.id`)
- coach_id nullable
- first_name
- last_name
- date_of_birth nullable
- sport
- position nullable
- status
- handedness nullable
- units_preference nullable
- created_at
- updated_at

## coach_profiles
- id
- user_id
- display_name
- organization_name nullable
- bio nullable
- created_at
- updated_at

## athlete_groups
Coach-owned athlete collections used for admin organization, filtering, and bulk assignment targeting.
These groups are not community chat rooms or public social spaces.
- id
- coach_id
- name
- description nullable
- access_level (`private`, `public`)
- status (`active`, `archived`)
- created_by_user_id nullable
- archived_at nullable
- created_at
- updated_at

## athlete_group_memberships
Current membership rows linking athletes into coach-owned groups.
This seam is for admin organization and targeting, not social following or chat presence.
- id
- athlete_group_id
- athlete_id
- added_by_user_id nullable
- created_at
- updated_at

---

# Layer 2: Source content library
This layer stores imported source material exactly as we found it.
This is where HockeyTraining, Thibault, and later source packs belong.

**Boundary rule:** Layer 2 is for ingestion, browsing, provenance, and reference.
It is not the table family that powers set logging, athlete assignment, or execution analytics.
If a piece of source content becomes a reusable structured workout, it should be promoted into Layer 4.

## content_sources
Top-level source systems or import batches.
- id
- code
- name
- source_type (`hockeytraining`, `thibault_pdf`, `manual`, `hybrid`)
- description nullable
- origin_url nullable
- import_notes nullable
- imported_at nullable
- created_at
- updated_at

## content_collections
High-level source groups such as programs, phases, courses, toolboxes, or guide packs.

Examples:
- `Off-Season '26`
- `Men's League '26`
- `Youth Off-Season '26`
- `Explosive First-Step`
- `5 Free Follow-Along Workouts`
- `7-Days to Better Stickhandling`
- Thibault guide collections
- nutrition references
- FAQ/getting started collections
- weekly planner resources

Fields:
- id
- content_source_id
- parent_collection_id nullable
- collection_type (`program`, `phase`, `course`, `lesson_series`, `toolbox`, `resource_hub`, `guide_pack`, `video_library`, `mixed`)
- name
- slug
- description nullable
- audience nullable
- sport nullable
- level nullable
- season_label nullable
- sort_order nullable
- created_at
- updated_at

## content_items
Canonical ingestion rows for the collected inventory.
These rows may represent things that are playable, readable, watchable, downloadable, or eventually normalizable into workouts/exercises.
- id
- content_collection_id
- parent_item_id nullable
- item_type (`workout`, `exercise`, `lesson`, `video`, `pdf`, `resource`, `faq`, `planner`, `phase_overview`, `course_lesson`, `replay`, `challenge`, `guide_section`)
- title
- slug nullable
- summary nullable
- source_display_text nullable
- source_url nullable
- source_file_label nullable
- source_identifier nullable
- content_text nullable
- duration_seconds nullable
- estimated_duration_minutes nullable
- sort_order nullable
- published_at nullable
- normalization_status (`raw`, `reviewed`, `template_ready`, `normalized`, `ignored`)
- created_at
- updated_at

## content_item_assets
Links and files attached to a content item.
- id
- content_item_id
- asset_type (`video`, `pdf`, `image`, `link`, `thumbnail`, `download`)
- url
- label nullable
- mime_type nullable
- provider nullable
- created_at

## content_item_tags
- id
- content_item_id
- tag
- created_at

## content_item_exercise_maps
Use when a content item points to a normalized exercise.
This is still a reference mapping, not a template or execution row.
- id
- content_item_id
- exercise_id
- relation_type (`demonstrates`, `uses`, `teaches`, `contains`, `primary_focus`)
- created_at

## content_item_template_maps
Use when a source content row has been promoted into a reusable workout template.
This is the clean bridge between Layer 2 and Layer 4.
- id
- content_item_id
- workout_template_id
- mapping_type (`direct_template`, `derived_template`, `partial_template_source`)
- created_at

---

# Layer 3: Exercise and body map library

## exercises
Normalized exercise records used by templates, plans, sessions, and analytics.
- id
- name
- slug
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
- fatigue_multiplier nullable
- axial_fatigue_multiplier nullable
- skill_fatigue_multiplier nullable
- status
- created_by nullable
- created_at
- updated_at

## exercise_aliases
Keep source names and alternate labels.
- id
- exercise_id
- alias_text
- alias_type (`source_import`, `display_variant`, `search_synonym`, `coach_label`)
- source_system nullable
- created_at

## exercise_options
For source rows that are really exercise choices.
Example: one slot can map to multiple valid exercises.
- id
- group_name
- source_display_text nullable
- selection_rule (`choose_one`, `coach_selects`, `athlete_selects`)
- created_at
- updated_at

## exercise_option_members
- id
- exercise_option_id
- exercise_id
- sort_order
- created_at

## muscles
- id
- name
- slug
- body_region
- thumbnail_url nullable
- sort_order nullable
- is_active

## sub_muscles
- id
- muscle_id
- name
- slug
- thumbnail_url nullable
- sort_order nullable
- is_active

## exercise_muscle_maps
- id
- exercise_id
- muscle_id
- role (`primary`, `secondary`, `stabilizer`)
- contribution_percent nullable
- sort_order nullable
- created_at

## exercise_sub_muscle_maps
- id
- exercise_id
- exercise_muscle_map_id nullable
- sub_muscle_id
- role (`primary`, `secondary`, `stabilizer`)
- contribution_percent nullable
- sort_order nullable
- created_at

---

# Layer 4: Workout template library
This is the reusable structured training layer.
It exists for workouts that the system can actually assign, render cleanly in the app, and snapshot into execution rows.

**Boundary rule:** Layer 4 is not the raw content vault.
A row belongs here only if it has enough structure to behave like a workout template or a template fragment in Train.
If a source item is just an article, replay page, PDF, lesson, or reference resource, it should stay in Layer 2.

## workout_templates
A reusable workout template that can be scheduled to an athlete.
It may be coach-authored, imported, or normalized from source content.
- id
- content_item_id nullable
- coach_id nullable
- name
- slug nullable
- description nullable
- category nullable
- difficulty nullable
- focus_area nullable
- training_type nullable
- estimated_duration_minutes nullable
- thumbnail_url nullable
- source_type (`imported`, `manual`, `hybrid`)
- template_status (`draft`, `active`, `archived`)
- created_at
- updated_at

## workout_template_blocks
The ordered structure that the app can render cleanly in workout detail and active session views.
- id
- workout_template_id
- block_code nullable
- block_kind (`warmup`, `primary`, `secondary`, `accessory`, `conditioning`, `cooldown`, `education`, `other`)
- title nullable
- instructions nullable
- sort_order
- created_at
- updated_at

## workout_template_exercises
One exercise slot inside a structured block.
This may reference:
- a normalized exercise
- an exercise option group
- or a source content item when normalization is still partial
- id
- workout_template_block_id
- exercise_id nullable
- exercise_option_id nullable
- content_item_id nullable
- source_display_text nullable
- name_snapshot
- notes nullable
- default_rest_seconds nullable
- sort_order
- created_at
- updated_at

## workout_template_sets
The loggable prescription rows that eventually become program and session set snapshots.
- id
- workout_template_exercise_id
- sort_order
- set_type (`straight`, `superset`, `dropset`, `timed`, `distance`, `amrap`, `emom`, `other`)
- target_reps nullable
- target_load nullable
- target_load_unit nullable
- target_duration_seconds nullable
- target_distance nullable
- target_distance_unit nullable
- target_rpe nullable
- target_rir nullable
- target_rest_seconds nullable
- tempo_text nullable
- sets_reps_text nullable
- rest_text nullable
- notes nullable
- created_at
- updated_at

## template_inclusion_rule
Use this as a practical rule, not a table:
A source row should be promoted into Layer 4 only if at least one of these is true:
- it is a real workout the athlete can complete
- it has ordered blocks/exercises/sets that should render in Train
- it needs prescribed-vs-actual logging
- it should be assignable on a program day

Otherwise, it stays in Layer 2.

---

# Layer 5: Program planning and athlete assignment
This is the athlete-facing planning layer that powers Train, calendar, and scheduled workout detail.
It is the assigned plan snapshot, not the performed-work ledger.

**Boundary rule:** Layer 5 answers questions like:
- what is scheduled for this athlete?
- what should they do on this day?
- what workout structure should appear in workout detail before the session starts?

Layer 5 does **not** store the authoritative performed set history.
Once a workout is started, Layer 6 becomes the execution source of truth.

## programs
Coach-authored program plans. A program may start unassigned and later be attached to an athlete, while assigned athlete views still consume athlete-linked programs.
- id
- athlete_id nullable
- coach_id
- content_collection_id nullable
- name
- description nullable
- start_date
- end_date nullable
- status (`draft`, `active`, `paused`, `completed`, `archived`)
- created_at
- updated_at

## program_phases
Optional but useful because the imported sources are phase-heavy.
- id
- program_id
- content_collection_id nullable
- name
- phase_index nullable
- start_date nullable
- end_date nullable
- sort_order
- created_at
- updated_at

## program_weeks
- id
- program_id
- program_phase_id nullable
- week_index
- name nullable
- start_date nullable
- end_date nullable
- created_at
- updated_at

## program_days
- id
- program_week_id
- day_index
- date nullable
- name nullable
- notes nullable
- day_type (`training`, `recovery`, `off`, `education`, `testing`)
- created_at
- updated_at

## program_day_warmups
Optional warmup assignments tied to a calendar day.
- id
- program_day_id
- workout_template_id nullable
- name_snapshot
- sort_order
- created_at
- updated_at

## program_workouts
The assigned athlete-specific workout snapshot shown before execution starts.
These rows should usually come from a `workout_template`, with optional `content_item_id` kept for provenance only.
- id
- program_day_id
- workout_template_id nullable
- content_item_id nullable
- name_snapshot
- description_snapshot nullable
- category_snapshot nullable
- focus_area_snapshot nullable
- training_type_snapshot nullable
- estimated_duration_minutes_snapshot nullable
- source_file_label_snapshot nullable
- sort_order
- status (`scheduled`, `available`, `in_progress`, `completed`, `missed`, `skipped`)
- created_at
- updated_at

## program_workout_blocks
The assigned block structure copied from the template layer.
- id
- program_workout_id
- workout_template_block_id nullable
- block_code_snapshot nullable
- block_kind_snapshot nullable
- title_snapshot nullable
- instructions_snapshot nullable
- sort_order
- created_at
- updated_at

## program_workout_exercises
The assigned exercise slots copied from the template layer.
This is where any athlete-specific exercise selection can be locked before session start.
- id
- program_workout_block_id
- workout_template_exercise_id nullable
- exercise_id nullable
- exercise_option_id nullable
- selected_exercise_id nullable
- content_item_id nullable
- source_display_text_snapshot nullable
- name_snapshot
- notes_snapshot nullable
- default_rest_seconds nullable
- sort_order
- created_at
- updated_at

## program_workout_sets
The assigned prescription rows shown in workout detail before execution.
These are still planning rows, not actual performance rows.
- id
- program_workout_exercise_id
- workout_template_set_id nullable
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
- tempo_text nullable
- sets_reps_text nullable
- rest_text nullable
- notes nullable
- created_at
- updated_at

## planning_status_rule
Use this as a practical rule, not a table:
- `program_workouts` represent what is assigned
- `workout_sessions` represent what was actually performed
- if the athlete changes actual load, reps, or effort during the session, that belongs in Layer 6, not back on `program_workout_sets`

---

# Layer 6: Session execution
This is the authoritative performed-work layer.
It maps directly to the active workout session logic in the app.

**Boundary rule:** Layer 6 answers questions like:
- what did the athlete actually do?
- which sets were completed?
- what were the actual load, reps, duration, and effort?
- what session should feed summaries, history, and analytics?

If planning and execution ever disagree, Layer 6 wins for performance history and analytics.
Layer 5 remains the planned snapshot only.

## workout_sessions
The top-level execution record for a started workout.
- id
- athlete_id
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

## workout_session_blocks
Execution-time block snapshot.
- id
- workout_session_id
- program_workout_block_id nullable
- block_code_snapshot nullable
- block_kind_snapshot nullable
- title_snapshot nullable
- sort_order
- created_at
- updated_at

## workout_session_exercises
Execution-time exercise snapshot.
This is where the chosen exercise identity becomes fixed for the session.
- id
- workout_session_id
- workout_session_block_id nullable
- program_workout_exercise_id nullable
- exercise_id nullable
- selected_exercise_id nullable
- source_display_text_snapshot nullable
- name_snapshot
- sort_order
- status (`not_started`, `active`, `completed`, `skipped`)
- notes nullable
- default_rest_seconds nullable
- created_at
- updated_at

## workout_session_sets
The authoritative set ledger for prescribed-vs-actual logging.
These rows should be the direct input for completed-session summaries, exercise history, and analytics.
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

## rest_timer_states
Timer state attached to active execution, not planning.
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

## execution_authority_rule
Use this as a practical rule, not a table:
- if a session exists, athlete performance history should read from `workout_sessions`, `workout_session_exercises`, and `workout_session_sets`
- `program_workout_*` rows should remain unchanged except for assignment/completion sync fields
- prescribed values remain immutable snapshots inside session sets
- actual values are mutable during the session until the session is finalized

---

# Layer 7: Analytics and recovery
This layer is derived from completed actual work.
It powers the Progress surface.

**Boundary rule:** v1 analytics should stay close to what the app already shows now:
- exercise performance history
- simple training load
- muscle fatigue / recovery views
- body metrics

Anything requiring heavier predictive logic or long-horizon modeling should be deferred until the basic execution ledger is proven.

## muscle_load_events
Atomic event rows created from completed session work.
These are the main lineage rows for fatigue/recovery calculations.
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

## session_muscle_load_summaries
Session-level summary rows for muscle groups.
This is enough for the current app's fatigue/recovery surface.
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

## session_sub_muscle_load_summaries
Optional but still reasonable in v1 because the UI already hints at sub-muscle drill-down.
If SQL v1 needs trimming, this is one of the first analytics tables that can move to v1.5.
- id
- athlete_id
- workout_session_id
- muscle_id
- sub_muscle_id
- event_date
- percent nullable
- score nullable
- cap nullable
- level nullable
- created_at

## exercise_performance_snapshots
Used for exercise detail history and best/recent views.
This should support current views like estimated 1RM, recent/best set history, and strength progress.
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
- body_region nullable
- log_date
- estimated_one_rep_max nullable
- notes nullable
- created_at

## recovery_snapshots
Derived recovery rows used for the recovery/muscle-fatigue surface.
In v1, keep this simple and derived from recent completed work.
Do not overcommit to a complex readiness formula yet.
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

## body_metric_logs
Manual or imported body metrics.
Keep this generic in v1.
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

## progress_log_entries
Generic progress ledger.
Useful because the old PPHT model clearly had one, but this is not required for the first SQL pass if snapshots are enough.
Treat this as a flexible support table, not the core analytics source of truth.
- id
- athlete_id
- coach_id nullable
- exercise_id nullable
- program_workout_exercise_id nullable
- body_part nullable
- metric_type
- load nullable
- reps nullable
- sets nullable
- distance nullable
- duration_seconds nullable
- unit nullable
- notes nullable
- logged_at
- created_at

## analytics_v1_rule
Use this as a practical rule, not a table:
- required v1 analytics foundation: `muscle_load_events`, `session_muscle_load_summaries`, `exercise_performance_snapshots`, `recovery_snapshots`, `body_metric_logs`
- optional-but-keep-in-doc for now: `session_sub_muscle_load_summaries`, `progress_log_entries`
- do not lock in advanced readiness math at the schema level yet

---

# Critical workflow rules tied to schema

## Create session from assigned workout
When a session starts:
- create `workout_sessions`
- create `workout_session_blocks`
- create `workout_session_exercises`
- create `workout_session_sets`
- copy assigned set targets into prescribed fields
- leave actual fields blank until performed or defaulted on completion

## Complete set
When a set is completed:
- if an actual field is blank, it may default from the matching prescribed value
- set `is_completed = true`
- set `completed_at`
- do not overwrite prescribed values
- do not mutate sibling sets

## Finish session
When a session is completed:
- set authoritative completion fields on `workout_sessions`
- store `perceived_difficulty` at completion time, not session start
- trigger analytics creation from completed actual work
- sync program workout status from authoritative session completion

## Analytics derivation rule
Analytics must be derived from completed session rows only.
Never create fatigue, load, recovery, or performance rows from:
- content-library records
- workout template rows
- assigned plan rows that were never actually performed

---

# What is in v1 vs later

## Required in v1
- identity
- content source library
- exercise and muscle library
- workout template layer
- assigned program/day/workout layer
- session execution layer with prescribed vs actual separation
- core analytics foundation:
  - `muscle_load_events`
  - `session_muscle_load_summaries`
  - `exercise_performance_snapshots`
  - `recovery_snapshots`
  - `body_metric_logs`

## Good to keep in the doc, but optional for first SQL pass
- `session_sub_muscle_load_summaries`
- `progress_log_entries`
- deeper phase-level program metadata if we need to trim the first migration
- broader content-library enrichment tables beyond the core ingestion path

## Can be deferred to v1.5+
- rich messaging/inbox schema
- team/community chat schema beyond coach-managed athlete groups
- entitlement/paywall schema
- advanced video hosting metadata
- fully canonical content taxonomy if aliases are good enough for now
- deep readiness formulas if we want to tune them later
- coach organization / multi-tenant controls if not needed immediately

---

# Main schema call
For PPLUS v1, the recommended contract is:

- **content library** is first-class
- **program planning** is athlete assignment
- **session execution** is a real separate layer
- **analytics** are derived from actual completed session work

That is the cleanest way to support:
- the HockeyTraining source corpus
- the app we already built
- future progress/fatigue logic without repeating the old PPHT mixing problem
