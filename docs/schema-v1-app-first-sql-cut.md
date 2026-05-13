# PPLUS Training, App-First SQL v1 Minimal Cut

## Purpose
This document defines the recommended **first SQL migration cut** based on the **app-first reset**, not the older OpenClaw-heavy schema direction.

Primary source of truth:
- `docs/schema-v1-app-first-reset.md`

The goal is simple:
- model the app we already built
- support the current Train and Progress surfaces
- avoid overbuilding for imports or historical architecture ideas

---

## First-pass philosophy
Migration 0001 should create the **smallest honest schema spine** that supports:
- athlete identity
- exercise normalization
- workout templates
- assigned program workouts
- session execution with prescribed vs actual values
- current progress metrics derived from completed sessions

Anything beyond that should wait.

---

# Include in migration 0001

## 1. Identity
These are required immediately.

### users
Why now:
- base identity row for athlete/coach/admin

### athlete_profiles
Why now:
- the app is athlete-first
- programs, sessions, and progress all need athlete lineage

### coach_profiles
Why now:
- needed for ownership, assignment, and coach-side future flows

---

## 2. Exercise library
This is core to both Train and Progress.

### exercises
Why now:
- current workout and session objects already refer to `exerciseId`
- progress logic depends on exercise identity

### exercise_aliases
Why now:
- imported source names will be messy
- aliasing is a cheap safety layer

### muscles
### sub_muscles
### exercise_muscle_maps
### exercise_sub_muscle_maps
Why now:
- current progress direction clearly wants muscle fatigue/recovery
- old PPHT context supports this, but the app also points to it directly

### Defer from exercise library
Do **not** include in 0001 unless the import implementation immediately requires them:
- `exercise_options`
- `exercise_option_members`

Why defer:
- the current app does not clearly depend on substitute/choice groups yet

---

## 3. Workout templates
These stay in 0001 because current planning already references `workoutTemplateId`.

### workout_templates
Why now:
- current train planning references template identity

### workout_template_exercises
Why now:
- templates need an exercise list to create planned workouts cleanly

### workout_template_sets
Why now:
- set-level prescription exists in the current app and session engine

### Defer from templates
Do **not** include in 0001 unless the product starts proving a need:
- `workout_template_blocks`

Why defer:
- current app behavior works with flat ordered exercise/set lists
- blocks are not yet part of the proven app spine

---

## 4. Program planning
This is the planning domain the app visibly uses now.

### programs
Why now:
- top-level athlete program container

### program_weeks
Why now:
- Program and Calendar surfaces clearly think in weeks

### program_days
Why now:
- calendar and workout selection depend on day-level planning

### program_workouts
Why now:
- this is the main pre-session planning object in the app
- persisted workout state should stay scheduling-focused (`scheduled`, `completed`, `missed`, `skipped`)
- the right-side checkbox should not depend on a single raw workout field alone
- future vs missed should be derived from `program_days.date` plus the latest linked `workout_sessions` row

### program_workout_display_states view
Why now:
- gives one canonical database-level source for the three workout checkbox states
- `completed` when the latest linked session is completed or the planned workout was explicitly completed
- `missed` when the workout day is behind `current_date` without completion, or the latest linked session was abandoned/discarded
- `upcoming` when the workout is still today/future and not completed

### program_workout_exercises
Why now:
- workout detail needs planned exercise rows

### program_workout_sets
Why now:
- this is the source of prescribed set values before session start

### Defer from planning
Do **not** include in 0001 unless the next app step proves them necessary:
- `program_phases`
- `program_workout_blocks`

Why defer:
- weeks/days/workouts/exercises/sets are enough for the current app spine
- blocks/phases may be useful later, but are not clearly required right now

---

## 5. Session execution
This is the most important part of the app-first schema.

### workout_sessions
Why now:
- current app already has active/completed/discarded session behavior

### workout_session_exercises
Why now:
- session state is tracked per exercise

### workout_session_sets
Why now:
- this is the core execution ledger
- prescribed vs actual separation lives here
- completion logic lives here
- progress metrics depend on this table

### rest_timer_states
Why now:
- current app/session model explicitly includes rest timer behavior

### Defer from execution
Do **not** include in 0001 unless blocks become essential in the app:
- `workout_session_blocks`

Why defer:
- flat session exercise order currently matches the app well enough

---

## 6. Progress foundation
Only include analytics that the current app clearly justifies.

### exercise_performance_snapshots
Why now:
- current app already computes exercise performance, best sets, and estimated 1RM

### muscle_load_events
Why now:
- gives event lineage from completed session work to fatigue/recovery calculations

### session_muscle_load_summaries
Why now:
- enough to support the current muscle-fatigue summary direction

### recovery_snapshots
Why now:
- supports recovery/readiness views without overcommitting to advanced formulas

### body_metric_logs
Why now:
- app already points toward health metrics like sleep/HRV/recovery inputs

### Defer from analytics
Do **not** include in 0001 unless the app soon proves the need:
- sub-muscle summary tables
- generalized progress ledger tables
- advanced readiness modeling tables

Why defer:
- current app does not need a huge analytics subsystem to be coherent

---

# Recommended 0001 table list

## Definitive include list

### Identity
- `users`
- `athlete_profiles`
- `coach_profiles`

### Exercise library
- `exercises`
- `exercise_aliases`
- `muscles`
- `sub_muscles`
- `exercise_muscle_maps`
- `exercise_sub_muscle_maps`

### Workout templates
- `workout_templates`
- `workout_template_exercises`
- `workout_template_sets`

### Program planning
- `programs`
- `program_weeks`
- `program_days`
- `program_workouts`
- `program_workout_exercises`
- `program_workout_sets`

### Session execution
- `workout_sessions`
- `workout_session_exercises`
- `workout_session_sets`
- `rest_timer_states`

### Progress foundation
- `exercise_performance_snapshots`
- `muscle_load_events`
- `session_muscle_load_summaries`
- `recovery_snapshots`
- `body_metric_logs`

---

# Recommended defer-to-0002 list

## Good candidates for the second migration
- `exercise_options`
- `exercise_option_members`
- `content_sources`
- `content_collections`
- `content_items`
- `workout_template_blocks`
- `program_phases`
- `program_workout_blocks`
- `workout_session_blocks`
- sub-muscle summary tables
- generalized progress log tables

Why these are safe to defer:
- they enrich the system
- but they do not define the current app spine
- the current product can be modeled honestly without them in the first pass

---

# What this means in practice

If we follow the app-first reset, migration 0001 becomes:

**Identity -> Exercises -> Templates -> Planned Workouts -> Session Ledger -> Progress**

That is much tighter than the older direction.

It also means:
- imported content support is important, but not first-spine critical
- blocks are optional until the app proves they are central
- the session ledger is more important than the import model
- the progress system should stay simple at first

---

# Final recommendation

If we want a clean restart from the drifted SQL, the best move is:
- treat this app-first cut as the new migration 0001 target
- stop trying to preserve the inflated schema shape
- regenerate SQL from this smaller, app-faithful model

That will give us a backend foundation that matches the product we are actually building right now.
