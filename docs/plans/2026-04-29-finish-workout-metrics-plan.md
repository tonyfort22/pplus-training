# PPLUS Finish Workout Metrics Plan

> **For Hermes:** Use this as the product and data-model reference before wiring the active-workout Finish flow.

**Goal:** Define the finish-workout workflow and the exact metric ownership so finishing, discarding, and post-workout analytics stay correct across the mobile app, coach views, and progress surfaces.

**Architecture:** Treat Finish as an execution-domain transition, not just a UI button. The active workout screen decides whether the session may finish, but the authoritative metric writes belong to the session ledger (`workout_sessions`, `workout_session_exercises`, `workout_session_sets`). Downstream progress and fatigue rows must be derived from completed session actuals only.

**Tech Stack:** Expo mobile app, shared domain logic in `packages/core`, data adapters in `packages/data`, Supabase schema in `infra/supabase`, docs under `docs/`.

---

## Core rule

**Finish must not directly write analytics rows from the UI.**

It should do two things only:
1. validate whether the session is allowed to finish
2. finalize the session ledger so downstream metrics can be derived safely

That keeps us from polluting all other app surfaces with half-finished or empty-workout junk data.

---

## What the finish button is actually responsible for

### Path A: Empty workout
If `completed_sets_count === 0`:
- block finish
- show `Empty Workout`
- allow `Continue`
- allow `Discard Workout`
- do **not** write completion analytics

### Path B: Valid finish
If `completed_sets_count > 0`:
- finalize the workout session
- freeze authoritative completion fields
- trigger derived metrics from completed session actuals
- refresh all app surfaces that read progress/history

### Path C: Discard from empty modal or active workout
If discard is chosen:
- set session status to `discarded`
- preserve enough lineage for audit/history rules if we want it
- do **not** create completed analytics rows
- allow schedule state to derive `missed` from discarded/abandoned latest session where appropriate

---

## Metric ownership

### 1. Source-of-truth execution ledger
These are the only tables that should own performed workout truth:
- `workout_sessions`
- `workout_session_exercises`
- `workout_session_sets`

### 2. Derived progress/analytics layer
These must be derived after a valid completed finish:
- `exercise_performance_snapshots`
- `muscle_load_events`
- future readiness/fatigue summaries
- progress charts / history views

### 3. Planning layer that must stay separate
These must never be treated as completed performance:
- `program_workouts`
- `program_workout_exercises`
- `program_workout_sets`

---

## Current schema already supporting the right boundary

### `workout_sessions`
Already has the important finish-level fields:
- `status`
- `started_at`
- `completed_at`
- `elapsed_seconds`
- `notes`
- `perceived_difficulty`
- `total_exercises_count`
- `completed_exercises_count`
- `total_sets_count`
- `completed_sets_count`

### `workout_session_sets`
Already has the key execution metrics:
- prescribed fields
- actual fields
- `is_completed`
- `completed_at`
- `notes`

### Derived analytics tables already present
- `exercise_performance_snapshots`
- `muscle_load_events`

So the main job now is not inventing the shape from scratch. It is making sure the finish workflow writes the session layer correctly and only then fans out into derived metrics.

---

## Recommended finish metric contract

### On every completed set during workout
Keep updating the live session ledger:
- set `actual_*` fields
- set `is_completed = true`
- set `completed_at`
- recompute session counts

### On valid finish
Write/freeze session-level fields:
- `workout_sessions.status = 'completed'`
- `workout_sessions.completed_at = now()`
- `workout_sessions.elapsed_seconds = final elapsed time`
- `workout_sessions.completed_sets_count = derived from session sets`
- `workout_sessions.completed_exercises_count = derived from session exercises`
- optional: `workout_sessions.notes`
- optional: `workout_sessions.perceived_difficulty`

### On discard
Write only discard/session state:
- `workout_sessions.status = 'discarded'`
- optionally `completed_at = now()` if we want a closed terminal state timestamp, otherwise leave null and use `updated_at`
- do **not** generate performance snapshots
- do **not** generate muscle load events

---

## Metrics we should explicitly support in the finish layer

### Session summary metrics
These affect multiple app surfaces immediately:
- final elapsed time
- completed exercise count
- completed set count
- completion status
- completion timestamp
- session notes
- perceived difficulty

### Exercise history metrics
Derived from completed session sets:
- actual load
- actual reps
- actual duration
- actual distance
- actual RPE / effort
- set count per exercise
- estimated 1RM inputs where applicable

### Muscle / fatigue metrics
Derived later from completed set actuals + exercise mappings:
- muscle load events
- sub-muscle load events
- per-session muscle totals
- readiness/fatigue summaries

### Schedule/state metrics
Derived from latest linked session + program day date:
- completed
- missed
- upcoming

---

## Recommended order of implementation

### Phase 1: Finish validation and state transitions
- empty workout block
- continue path
- discard path
- valid finish path
- authoritative session finalization

### Phase 2: Completion payload design
Define exactly what the finish action can capture now:
- notes
- perceived difficulty
- maybe later: tags, soreness, wellness, comments

Keep this small at first.

### Phase 3: Derived metrics trigger
After a session becomes `completed`, derive:
- exercise performance snapshots
- muscle load events

This can be app-triggered initially, but should still be implemented as a shared domain/data seam, not UI math inside a React component.

### Phase 4: Surface refresh rules
After finish/discard:
- active workout view closes
- today/workout status refreshes
- progress/history screens read the updated completed session data
- coach-facing surfaces reflect the latest session outcome

---

## Product decisions we should lock before coding the full finish flow

### 1. What counts as a completed set?
Recommended:
- `is_completed === true`
- not just entered numbers

### 2. What counts as a completed exercise?
Recommended:
- at least one completed set inside that session exercise

### 3. Should discarded sessions stay queryable?
Recommended:
- yes, keep them in `workout_sessions`
- exclude them from progress analytics
- allow schedule derivation to treat discarded/abandoned as missed when appropriate

### 4. Should finish collect any final inputs?
Recommended minimal first pass:
- no forced extra modal unless SPOTR shows one later
- keep only existing session notes + optional perceived difficulty if we want it

### 5. When do analytics rows get created?
Recommended:
- only after session status becomes `completed`
- never during in-progress edits
- never for discarded workouts

---

## Clean boundary to preserve

### UI layer
Responsible for:
- showing Finish button
- opening empty-workout modal
- optionally opening any final review step
- sending one finish command with the current session

### Domain layer
Responsible for:
- validating finish eligibility
- finalizing session
- freezing final session counts/status/timestamps

### Data layer
Responsible for:
- persisting finalized session rows
- creating derived analytics rows from completed actuals

If we keep that split, the same metrics stay reliable across:
- athlete mobile app
- coach views
- progress/history charts
- later web dashboards

---

## Recommendation

**Yes, we should plan this before building the full finish flow.**

The right move is:
1. lock the finish-state contract
2. lock what gets written to `workout_sessions` on finish vs discard
3. lock what downstream metrics are derived only from completed actual work
4. then build the UI flow around that contract

That avoids building a nice Finish button that quietly poisons the rest of the product.
