# PPLUS Training, Schema v1 Draft

> Draft only. This is the source-grounded schema revision based on the Thibault training program files in `/Users/anthonyfortugno/Desktop/thibault_training_program`.
>
> It is intentionally **not yet the live SQL contract**. We should revise this once, then reconcile it into:
> - `docs/schema-v1.md`
> - `infra/supabase/schema-v1.sql`
> - `infra/supabase/migrations/0001_initial_schema.sql`

## Why this draft exists
The Thibault source files showed a cleaner real-world structure than the current flat workout-template model.

The important findings were:
- workouts are organized into ordered **blocks** like `A1`, `B2`, `Conditioning`
- prescriptions change by **week**
- some exercise rows are really **choices** or **alternatives**
- warmups are a separate template type with **sections** and **steps**
- template/library data and athlete runtime data should stay separate

So this draft makes the library and planning model match the actual source program.

---

## Core design rules
- library content, planning, execution, and analytics stay separate
- source/imported text is preserved even when we later normalize it
- a workout is not a flat list, it is an ordered set of blocks
- weekly progression is first-class, not packed into one text field
- warmups are not forced into the same shape as strength/conditioning workouts
- athlete execution snapshots planned prescriptions at session start
- analytics run from actual completed execution data only

---

## Layer 1: Identity

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

---

## Layer 2: Exercise library

### exercises
Canonical exercise records when we can confidently normalize them.
- id
- name
- slug
- description
- coaching_cues
- video_url
- thumbnail_url
- movement_pattern
- stimulus_type
- body_region
- default_equipment
- difficulty
- status
- created_by
- created_at
- updated_at

### exercise_aliases
Preserve source naming and alternate labels.
- id
- exercise_id
- alias_text
- alias_type (`source_import`, `coach_label`, `search_synonym`, `display_variant`)
- source_system
- created_at

### exercise_options
For source rows like `Trap Bar Deadlift or Front Squat`.
This lets one source prescription point to multiple valid exercise choices.
- id
- group_name
- source_display_text
- selection_rule (`choose_one`, `coach_selects`, `athlete_selects`)
- created_at
- updated_at

### exercise_option_members
- id
- exercise_option_id
- exercise_id
- sort_order
- created_at

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

---

## Layer 3: Program source library
These tables represent imported program content before it becomes athlete-specific planning.

### program_sources
Top-level library collections, like a source pack or methodology.
- id
- code (`OSD26`)
- name
- description
- source_type (`pdf_csv_import`, `manual_builder`, `hybrid`)
- imported_from_path
- created_by
- created_at
- updated_at

### program_source_phases
Examples: `Phase 3`, `Phase 4`, `Phase 5`, `Phase 6`.
- id
- program_source_id
- name
- phase_index
- description
- created_at
- updated_at

### workout_library_templates
Examples: `Speed Accelerator A`, `Edge Work B`.
This is the reusable source workout definition, before athlete scheduling.
- id
- program_source_phase_id
- code
- name
- training_type (`speed`, `edge_work`, `strength`, `conditioning`, `recovery`, `mixed`)
- description
- estimated_duration_minutes
- source_file_label
- sort_order
- created_at
- updated_at

### workout_library_blocks
Examples: `A1`, `A2`, `B1`, `Conditioning`.
- id
- workout_library_template_id
- block_code
- block_kind (`primary`, `secondary`, `accessory`, `conditioning`, `other`)
- sort_order
- created_at
- updated_at

### workout_library_prescriptions
One source prescription row inside a block.
This is where we preserve the raw source identity before week-specific details.
- id
- workout_library_block_id
- sort_order
- source_display_text
- normalized_exercise_id nullable
- exercise_option_id nullable
- notes
- default_weight_log_mode nullable
- created_at
- updated_at

### workout_library_prescription_weeks
The source files clearly show week-specific progression.
- id
- workout_library_prescription_id
- week_index
- week_label
- tempo_text
- sets_reps_text
- rest_text
- target_reps nullable
- target_sets nullable
- target_duration_seconds nullable
- target_distance nullable
- target_distance_unit nullable
- notes_override nullable
- created_at
- updated_at

### workout_library_tags
Optional classification layer for search/filtering later.
- id
- workout_library_template_id
- tag
- created_at

---

## Layer 4: Warmup library
Warmups are not the same shape as workouts.

### warmup_templates
- id
- program_source_id
- code
- name
- description
- source_file_label
- created_at
- updated_at

### warmup_sections
Examples: `Get Mobile`, `Get Activated`, `Get Warm`, `Cooldown`.
- id
- warmup_template_id
- name
- instructions
- sort_order
- created_at
- updated_at

### warmup_steps
- id
- warmup_section_id
- sort_order
- source_step_label
- exercise_id nullable
- display_name
- tempo_text nullable
- sets_reps_text nullable
- rest_text nullable
- notes nullable
- created_at
- updated_at

---

## Layer 5: Athlete program planning
This is where reusable source content becomes athlete-specific planning.

### athlete_programs
- id
- athlete_id
- coach_id
- program_source_id nullable
- name
- description
- start_date
- end_date
- status
- created_at
- updated_at

### athlete_program_phases
Optional if the assigned program still tracks source phases explicitly.
- id
- athlete_program_id
- program_source_phase_id nullable
- name_snapshot
- phase_index
- start_date nullable
- end_date nullable
- sort_order
- created_at
- updated_at

### athlete_program_weeks
- id
- athlete_program_id
- athlete_program_phase_id nullable
- week_index
- name
- start_date
- end_date
- created_at
- updated_at

### athlete_program_days
- id
- athlete_program_week_id
- day_index
- date
- name
- notes
- created_at
- updated_at

### athlete_program_workouts
The scheduled athlete-specific workout copy.
- id
- athlete_program_day_id
- workout_library_template_id nullable
- name_snapshot
- training_type_snapshot
- description_snapshot
- source_file_label_snapshot
- sort_order
- status
- created_at
- updated_at

### athlete_program_workout_blocks
The athlete copy of block structure.
- id
- athlete_program_workout_id
- workout_library_block_id nullable
- block_code_snapshot
- block_kind_snapshot
- sort_order
- created_at
- updated_at

### athlete_program_workout_prescriptions
Athlete copy of each prescription row.
- id
- athlete_program_workout_block_id
- workout_library_prescription_id nullable
- normalized_exercise_id nullable
- exercise_option_id nullable
- source_display_text_snapshot
- selected_exercise_id nullable
- notes_snapshot
- sort_order
- created_at
- updated_at

### athlete_program_workout_prescription_weeks
Athlete copy of week-specific prescription values.
This is the actual prescribed plan the athlete is assigned.
- id
- athlete_program_workout_prescription_id
- workout_library_prescription_week_id nullable
- week_index
- tempo_text
- sets_reps_text
- rest_text
- target_reps nullable
- target_sets nullable
- target_duration_seconds nullable
- target_distance nullable
- target_distance_unit nullable
- created_at
- updated_at

### athlete_program_day_warmups
Optional scheduled warmup assignment.
- id
- athlete_program_day_id
- warmup_template_id nullable
- name_snapshot
- sort_order
- created_at
- updated_at

---

## Layer 6: Session execution
This layer is still aligned with the core idea we already had: execution snapshots the plan.

### workout_sessions
- id
- athlete_id
- coach_id
- athlete_program_id nullable
- athlete_program_day_id nullable
- athlete_program_workout_id nullable
- workout_library_template_id nullable
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

### workout_session_blocks
- id
- workout_session_id
- athlete_program_workout_block_id nullable
- block_code_snapshot
- block_kind_snapshot
- sort_order
- created_at
- updated_at

### workout_session_exercises
- id
- workout_session_id
- workout_session_block_id nullable
- athlete_program_workout_prescription_id nullable
- normalized_exercise_id nullable
- selected_exercise_id nullable
- source_display_text_snapshot
- name_snapshot
- sort_order
- status
- notes
- default_rest_seconds nullable
- created_at
- updated_at

### workout_session_sets
- id
- workout_session_exercise_id
- athlete_program_workout_prescription_week_id nullable
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
- id
- workout_session_id
- workout_session_set_id nullable
- mode
- duration_seconds
- remaining_seconds
- started_at
- ended_at
- is_running
- created_at
- updated_at

---

## Layer 7: Analytics and body load
This part stays conceptually the same, but it should point to the new execution lineage.

### muscle_load_events
- id
- athlete_id
- workout_session_id
- workout_session_exercise_id nullable
- workout_session_set_id nullable
- selected_exercise_id nullable
- muscle_id nullable
- sub_muscle_id nullable
- is_sub_muscle
- event_date
- percent nullable
- created_at

### recovery_snapshots
- id
- athlete_id
- snapshot_date
- muscle_id nullable
- sub_muscle_id nullable
- recovery_percent
- source_window_days
- created_at

### exercise_performance_snapshots
- id
- athlete_id
- selected_exercise_id
- snapshot_date
- best_load nullable
- best_reps nullable
- estimated_one_rep_max nullable
- total_completed_sets
- source_session_id nullable
- created_at

### body_metric_logs
- id
- athlete_id
- metric_type
- value
- unit
- recorded_at
- source
- created_at

---

## What changed versus the current schema
The biggest structural changes in this draft are:
- add a real **program source library** layer
- add **workout blocks** as first-class entities
- add **week-specific prescription rows**
- add **exercise options / substitutions**
- split **warmups** into their own template model
- keep athlete planning tables separate from library/source tables
- keep session execution tables separate from athlete planning

---

## What I would keep simple in v1
To avoid overbuilding too early, I would keep these as plain text in the first SQL pass:
- `tempo_text`
- `sets_reps_text`
- `rest_text`
- `source_display_text`
- notes/cues

And only parse some fields into structured numeric columns when obvious and useful.

That gives us:
- fidelity to the source
- lower import risk
- room to normalize later

---

## Recommended next revision pass
Before promoting this draft into the live SQL contract, I would decide these open questions:
1. do we want `program_sources` and `athlete_programs` both in v1, or just athlete programs plus library templates?
2. should week-specific planning live only at the source/library level, or also copied into athlete planning rows?
3. for `exercise options`, do we want coach-selected substitution only, or athlete-selected too?
4. should warmups be fully schedulable per day in v1, or attached to workouts more loosely?
5. how much of `sets_reps_text` do we parse into structured columns in v1 versus later?

---

## My recommendation
For the first real SQL revision after this draft:
- definitely add:
  - `program_sources`
  - `program_source_phases`
  - `workout_library_templates`
  - `workout_library_blocks`
  - `workout_library_prescriptions`
  - `workout_library_prescription_weeks`
  - `warmup_templates`
  - `warmup_sections`
  - `warmup_steps`
- keep existing execution tables, but relink them to the new planning lineage
- do not over-normalize all source strings yet

That would be a strong v1 without getting cute.
