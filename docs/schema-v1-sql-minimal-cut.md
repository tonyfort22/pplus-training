# PPLUS Training, SQL v1 Minimal Cut

## Purpose
This document defines the recommended **first SQL migration cut** for PPLUS Training.

It is derived from:
- `docs/schema-v1.md`
- the mobile app surfaces already built
- the old PPHT/OpenClaw execution and analytics lessons

This is the answer to:
- what should go into `0001_initial_schema.sql`
- what should wait until later migrations

The goal is to ship the smallest schema that still cleanly supports:
- imported content references
- exercise normalization
- reusable workout templates
- athlete program planning
- active workout sessions with prescribed vs actual logging
- the current Progress surface foundation

---

## First migration philosophy

Migration 0001 should create the **spine** of the product, not every table we may eventually want.

That means:
- include tables that directly support the current app and the known content/import path
- include tables that define the planning-to-execution contract
- include tables that make analytics possible from real session data
- defer flexible or debatable tables that can be added later without breaking the core model

---

# Include in migration 0001

## 1. Identity
These are required immediately.

### auth.users
Why now:
- Supabase Auth is the canonical user identity system
- app-owned profile tables should reference `auth.users.id` instead of duplicating a `public.users` table

### athlete_profiles
Why now:
- the app is athlete-centered
- program assignment and analytics need athlete lineage
- the auth trigger should auto-provision this row from `auth.users` when signup role is not `coach`

### coach_profiles
Why now:
- needed for assignment ownership and future admin/coach workflows
- the same auth trigger should auto-provision this row from `auth.users` when signup role is `coach`

---

## 2. Core source-content ingestion
Keep this minimal in SQL v1.
The goal is not full editorial richness yet, just enough to preserve and organize imported source material.

### content_sources
Why now:
- needed to separate HockeyTraining, Thibault, and future imports

### content_collections
Why now:
- needed to group imported source material into usable top-level buckets
- supports programs/phases/courses/toolboxes without over-normalizing too early

### content_items
Why now:
- this is the canonical imported-content row
- gives us a place for workouts, PDFs, replays, lessons, resources, and source text references

### content_item_assets
Why now:
- imported content often carries PDFs, links, videos, thumbnails
- better to support attached assets from day one

### content_item_template_maps
Why now:
- this is the clean bridge from imported content to reusable workout templates
- it keeps Layer 2 and Layer 4 separate

### Defer from Layer 2 for later
Do **not** include in 0001 unless implementation clearly needs them immediately:
- `content_item_tags`
- `content_item_exercise_maps`

Why defer:
- useful, but not necessary to establish the main product spine
- can be added safely in later migrations

---

## 3. Exercise and body map library
This should be in 0001 because the app and analytics both depend on it.

### exercises
Why now:
- used by templates, programs, sessions, and progress history

### exercise_aliases
Why now:
- imported naming will be messy from day one
- aliases give us a safe normalization buffer

### exercise_options
### exercise_option_members
Why now:
- source programs may contain substitute/choice style exercise slots
- better to support the structure now than fake it later

### muscles
### sub_muscles
### exercise_muscle_maps
### exercise_sub_muscle_maps
Why now:
- the Progress surface and fatigue model depend on muscle mapping
- old PPHT work clearly treated this as first-class

---

## 4. Workout template layer
This is required in 0001.
It is the structured reusable training layer.

### workout_templates
Why now:
- needed for assignable workouts
- needed to separate reusable structure from source content and athlete assignment

### workout_template_blocks
Why now:
- block structure is part of the workout UX and real source material

### workout_template_exercises
Why now:
- needed to connect workouts to exercises and exercise options

### workout_template_sets
Why now:
- the full prescribed-vs-actual design depends on set-level structure

---

## 5. Program planning and athlete assignment
This is required in 0001 because the Train surface is assignment-driven.

### programs
Why now:
- top-level athlete assignment object

### program_weeks
Why now:
- current Train/calendar structure depends on week grouping

### program_days
Why now:
- the app needs day-level workout scheduling

### program_workouts
Why now:
- the athlete needs a concrete assigned workout snapshot before execution starts
- persisted workout state should stay scheduling-focused (`scheduled`, `completed`, `missed`, `skipped`)
- the checkbox UI should not guess from one raw status alone
- upcoming vs missed should be derived from `program_days.date` plus the latest linked `workout_sessions` row

### program_workout_display_states view
Why now:
- gives one canonical database-level place to derive the three checkbox states the UI needs
- `completed` when the latest linked session is completed or the planned workout was explicitly completed
- `missed` when the day is behind `current_date` without a completed session, or when the latest linked session was abandoned/discarded
- `upcoming` when the workout is still in the future or today and has not been completed

### program_workout_blocks
Why now:
- preserves assignable block structure from templates

### program_workout_exercises
Why now:
- preserves the exercise slots and any athlete-specific selection before starting the session

### program_workout_sets
Why now:
- needed for the planned workout detail view
- this is the pre-session prescription source

### Conditional in 0001
These are nice but can be deferred if the first SQL pass needs trimming:

#### program_phases
Include only if:
- you want phase structure to be first-class immediately
- or the initial imported programs need it operationally, not just descriptively

Otherwise:
- defer to migration 0002

#### program_day_warmups
Include only if:
- warmup scheduling is part of the first actual build step after schema creation

Otherwise:
- defer to migration 0002

---

## 6. Session execution
This is non-negotiable in 0001.
It is the authoritative performed-work ledger.

### workout_sessions
Why now:
- top-level execution record
- the app already thinks in active/completed/discarded session states

### workout_session_blocks
Why now:
- keeps execution lineage consistent with assigned block structure
- cleaner than flattening block context away too early

### workout_session_exercises
Why now:
- needed for session-level exercise state and history lineage

### workout_session_sets
Why now:
- this is the core execution ledger
- prescribed vs actual separation lives here
- progress and analytics depend on this table

### rest_timer_states
Why now:
- current app/session flow explicitly includes rest timer behavior
- belongs in execution, not planning

---

## 7. Core analytics foundation
Do not bring the whole analytics wishlist into 0001.
Bring only what the current app and execution model clearly justify.

### muscle_load_events
Why now:
- atomic lineage rows for fatigue/recovery
- connects actual set work to muscle and sub-muscle effects

### session_muscle_load_summaries
Why now:
- enough to power the current muscle-fatigue/recovery summary view

### exercise_performance_snapshots
Why now:
- supports exercise history, best/recent progress, and estimated 1RM surfaces

### recovery_snapshots
Why now:
- supports the current recovery/readiness direction without forcing complex formulas into schema

### body_metric_logs
Why now:
- simple, generic, and aligned with current product direction

### Defer from analytics for later
Do **not** include in 0001 unless implementation specifically needs them immediately:
- `session_sub_muscle_load_summaries`
- `progress_log_entries`

Why defer:
- both are useful
- neither is required to establish the first operational analytics loop

---

# Recommended 0001 table list

## Definitive include list

### Identity
- `users`
- `athlete_profiles`
- `coach_profiles`

### Source content
- `content_sources`
- `content_collections`
- `content_items`
- `content_item_assets`
- `content_item_template_maps`

### Exercise/body library
- `exercises`
- `exercise_aliases`
- `exercise_options`
- `exercise_option_members`
- `muscles`
- `sub_muscles`
- `exercise_muscle_maps`
- `exercise_sub_muscle_maps`

### Workout templates
- `workout_templates`
- `workout_template_blocks`
- `workout_template_exercises`
- `workout_template_sets`

### Program planning
- `programs`
- `program_weeks`
- `program_days`
- `program_workouts`
- `program_workout_blocks`
- `program_workout_exercises`
- `program_workout_sets`

### Session execution
- `workout_sessions`
- `workout_session_blocks`
- `workout_session_exercises`
- `workout_session_sets`
- `rest_timer_states`

### Core analytics
- `muscle_load_events`
- `session_muscle_load_summaries`
- `exercise_performance_snapshots`
- `recovery_snapshots`
- `body_metric_logs`

---

# Recommended defer-to-0002 list

## Good candidates for the second migration
- `program_phases`
- `program_day_warmups`
- `content_item_tags`
- `content_item_exercise_maps`
- `session_sub_muscle_load_summaries`
- `progress_log_entries`

Why these are safe to defer:
- they enrich the model
- but they do not define the main execution contract
- the app can start functioning without them if we keep the first pass disciplined

---

# Practical notes for SQL generation

## Use enums early only where stable
Recommended stable enums for 0001:
- user role
- program status
- program day type
- program workout status
- workout session status
- workout session exercise status
- set type

Avoid over-enum-ing fields that are still likely to change, especially:
- fine-grained content classification
- advanced analytics labels
- readiness labels if the formula is still moving

## Foreign key discipline
The most important foreign key chains to get right in 0001 are:
- `programs -> athlete_profiles / coach_profiles`
- `program_weeks -> programs`
- `program_days -> program_weeks`
- `program_workouts -> program_days`
- `program_workout_blocks -> program_workouts`
- `program_workout_exercises -> program_workout_blocks`
- `program_workout_sets -> program_workout_exercises`
- `workout_sessions -> programs / program_days / program_workouts`
- `workout_session_blocks -> workout_sessions`
- `workout_session_exercises -> workout_sessions / workout_session_blocks`
- `workout_session_sets -> workout_session_exercises`
- analytics tables -> workout session lineage + athlete

## Nullability discipline
For 0001, be strict where meaning is clear and permissive where normalization is still in progress.

Examples:
- `name_snapshot` fields should usually be non-null
- `exercise_id` may stay nullable in some imported/template/planning rows while normalization is incomplete
- actual performance fields on session sets must stay nullable until the athlete performs or completes the set

---

# Final recommendation

If we want a realistic `0001_initial_schema.sql`, the best move is:
- include the product spine
- include the execution ledger
- include only the analytics foundation the current app truly needs
- defer enrichment tables and debatable extras to migration 0002

That gives us a schema that is:
- clean enough to build on
- not overbuilt
- aligned with the app already in motion
- flexible enough for the imported content reality
