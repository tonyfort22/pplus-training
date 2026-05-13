# PPLUS Fresh-Start Foundation v1

> **For Hermes:** Treat this as the canonical restart plan for the PPLUS training app. Preserve the product model from prior docs, but allow the implementation to restart cleanly.

**Goal:** Restart PPLUS from a clean code foundation without losing the validated product logic.

**Architecture:** PPLUS is a mobile-first training platform with a coach web surface and a shared backend/domain layer. The architecture is built around four distinct layers: content, planning, execution, and analytics. The core product flow is planned workout -> workout session -> completed actual work -> analytics.

**Tech Stack:** Expo / React Native, Next.js, Supabase / Postgres, TypeScript where useful, Zod, TanStack Query, Zustand, pnpm monorepo.

---

## 1. Non-negotiable product truths

These must survive the restart.

1. **Planning is not execution**
   - planned workouts define what should happen
   - workout sessions record what actually happened

2. **Prescribed is not actual**
   - prescribed values are copied into the session at start
   - actual values record what the athlete performed
   - analytics only trust actual completed work

3. **The active workout flow is the product core**
   - if session logging is strong, the product is strong
   - if session logging is weak, everything downstream becomes unreliable

4. **SPOTR is the interaction benchmark**
   - not to clone blindly
   - but to match its clarity around today, programs, live logging, timers, and adherence

---

## 2. Product surfaces to build

### Athlete mobile app
Primary navigation:
1. Train
2. Progress
3. Team
4. Inbox

Core athlete surfaces:
- Home / Today
- Program overview
- Weekly calendar
- Workout detail before start
- Active workout session
- Progress and compliance
- Settings/profile

### Coach web app
Primary sections:
1. Dashboard
2. Athletes
3. Programs
4. Workouts
5. Exercises
6. Analytics

Core coach responsibilities:
- author exercises
- map muscles and sub-muscles
- build workouts
- build and assign programs
- review athlete compliance and progress

---

## 3. Canonical domain model

### Content layer
- exercises
- muscles
- sub_muscles
- exercise_muscle_maps
- exercise_sub_muscle_maps
- workout_templates
- workout_template_exercises
- workout_template_sets

### Planning layer
- programs
- program_weeks
- program_days
- program_workouts
- program_workout_exercises
- program_workout_sets

### Execution layer
- workout_sessions
- workout_session_exercises
- workout_session_sets
- rest_timer_states

### Analytics layer
- muscle_load_events
- session_muscle_load_summaries
- session_sub_muscle_load_summaries
- exercise_performance_snapshots
- body_metric_logs
- recovery_snapshots

---

## 4. MVP database scope

This is the minimum database scope the actual SQL must support before broad UI work.

### Required for MVP
- users
- athlete_profiles
- coach_profiles
- exercises
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

### Required MVP execution references
These must exist in execution rows:
- `workout_session_exercises.program_workout_exercise_id`
- `workout_session_sets.program_workout_set_id`

### Deferred but designed now
- muscle_load_events
- session_muscle_load_summaries
- session_sub_muscle_load_summaries
- exercise_performance_snapshots
- body_metric_logs
- recovery_snapshots

The deferred tables can be implemented in milestone 2 if needed, but the schema plan must stay compatible with them.

---

## 5. Recommended repo structure

```txt
apps/
  mobile/
  web/

packages/
  core/
  data/
  ui/
  types/

infra/
  supabase/

docs/
  plans/
```

### apps/mobile
Owns athlete experience only:
- Train
- Progress
- Team
- Inbox
- Settings

### apps/web
Owns coach workflows only:
- Dashboard
- Athletes
- Programs
- Workouts
- Exercises
- Analytics

### packages/core
Owns pure business logic:
- session creation
- set completion
- finish session
- fatigue logic
- analytics builders

### packages/data
Owns database access and repositories:
- Supabase client
- query helpers
- persistence adapters

### packages/types
Owns shared domain types and payload contracts if TypeScript is used broadly

### packages/ui
Optional shared presentation primitives

---

## 6. Fresh-start implementation order

### Phase 1: foundation reset
- reconcile docs with real SQL
- define canonical MVP schema
- define shared package responsibilities
- verify repo tooling and scripts

### Phase 2: shared domain layer
- create session service
- complete set service
- finish session service
- timer state service
- domain constants and validation

### Phase 3: mobile session path
- train home
- today screen
- workout detail
- active workout session
- timer modal / bottom sheet
- completion and discard flow

### Phase 4: coach authoring path
- exercise CRUD
- workout template builder
- program builder
- athlete assignment flow

### Phase 5: analytics
- muscle load generation
- performance snapshots
- compliance views
- coach analytics dashboard

---

## 7. GitHub and repository rules

Current repo:
- `https://github.com/tonyfort22/pplus-training`
- private
- default branch: `main`

Rules for the restart:
1. keep this repo as the canonical project repo unless Anthony says otherwise
2. do restart work on a dedicated branch first
3. land foundation changes in small clean commits
4. keep docs and schema in sync
5. do not let placeholder UI drift ahead of domain model

Recommended first branch:
- `fresh-start-foundation`

---

## 8. First implementation tasks

### Task 1: create fresh-start branch
**Objective:** isolate restart work from current main

**Files:**
- none

**Command:**
```bash
git checkout -b fresh-start-foundation
```

### Task 2: reconcile SQL with canonical MVP schema
**Objective:** make the real SQL match the actual product model

**Files:**
- Modify: `infra/supabase/schema-v1.sql`
- Modify: `infra/supabase/migrations/0001_initial_schema.sql`
- Modify: `docs/schema-v1.md`

**Verification:**
- required MVP tables exist
- execution references to planned rows exist
- docs no longer describe tables missing from SQL unless explicitly marked deferred

### Task 3: normalize monorepo contracts
**Objective:** make package responsibilities explicit before more code is added

**Files:**
- Modify: `README.md`
- Modify: `packages/core/src/index.*`
- Modify: `packages/data/src/index.*`
- Create or update package readmes if needed

**Verification:**
- a new contributor can tell where domain logic vs data logic belongs

### Task 4: implement session engine first
**Objective:** make the product core real before broad screen work

**Files:**
- Create: `packages/core/src/sessions/createWorkoutSession.ts`
- Create: `packages/core/src/sessions/completeWorkoutSet.ts`
- Create: `packages/core/src/sessions/finishWorkoutSession.ts`
- Create tests beside them

**Verification:**
- one planned workout can become one session
- one set can be completed without mutating prescribed values
- finishing session marks authoritative completion state

### Task 5: wire the mobile Train path
**Objective:** make the app usable for the athlete’s most important flow

**Files:**
- `apps/mobile/src/train/*`

**Verification:**
- athlete can view today’s workout
- athlete can start a session
- athlete can complete sets
- athlete can use timer/rest tools

---

## 9. Definition of done for the restart foundation

The fresh start is considered properly established when:
- the product model is locked
- SQL matches the agreed MVP schema
- branch and GitHub flow are clean
- session engine is the first real implementation priority
- the mobile Train path is clearly the first athlete surface to ship

---

## 10. Final recommendation

Do not throw away the product thinking.
Throw away only what is unclear, inconsistent, or prematurely built.

This is a **fresh code start with preserved product intelligence**, not a blind reset.
