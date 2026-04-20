# PPLUS Training, Architecture v1

## Goal
Build a mobile-first training app for athletes and coaches with a clean separation between planning, execution, and analytics.

This replaces the Bubble implementation with a typed, relational system that preserves the core product logic already established:
- programs assign workouts over time
- workouts contain exercises and prescribed sets
- workout sessions capture actual performed work
- analytics derive from actual completed work
- muscle fatigue is calculated from performed sets and exercise muscle mappings

## Product surfaces

### 1. Athlete mobile app
Primary product surface.

Core jobs:
- view assigned program and today’s workout
- start workout session
- complete sets
- edit actual performance values
- use rest timer and workout timer
- review progress and fatigue

### 2. Coach web dashboard
Management and authoring surface.

Core jobs:
- manage athletes
- manage exercises and muscle mappings
- build workouts and programs
- review athlete progress
- review fatigue and compliance

### 3. Shared backend and domain layer
Owns truth and business logic.

Core jobs:
- data model
- session creation from planned workouts
- prescribed to actual workflow
- analytics generation
- fatigue calculations
- auth and permissions

## Core architectural rules

### 1. Planning is not execution
Planning data defines what should happen.
Execution data records what did happen.

Never use template or program rows as the source of truth for completed workout performance.

### 2. Prescribed is not actual
Every performed set can diverge from plan.

- prescribed fields = planned values
- actual fields = performed values
- analytics = calculated from actual values only

### 3. Analytics require execution proof
Fatigue, progress, and performance snapshots must come from completed workout session data, not from templates or planned rows.

### 4. Exercise muscle mappings are foundational
The fatigue engine depends on exercise to muscle and sub-muscle mappings plus intensity/load multipliers.

### 5. The session flow is the product core
If workout session execution is solid, everything else becomes simpler.
If session execution is messy, the entire product becomes unreliable.

## Domain layers

### Content layer
Reusable content authored by coaches.

Entities:
- Exercise
- ExerciseMuscleMap
- ExerciseSubMuscleMap
- WorkoutTemplate
- WorkoutTemplateExercise
- WorkoutTemplateSet

### Planning layer
Scheduled training assigned to an athlete.

Entities:
- Program
- ProgramWeek
- ProgramDay
- ProgramWorkout
- ProgramWorkoutExercise
- ProgramWorkoutSet

### Execution layer
Actual performed training by the athlete.

Entities:
- WorkoutSession
- WorkoutSessionExercise
- WorkoutSessionSet
- RestTimerState

### Analytics layer
Derived data from completed sessions.

Entities:
- MuscleLoadEvent
- SessionMuscleLoadSummary
- SessionSubMuscleLoadSummary
- ExercisePerformanceSnapshot
- RecoverySnapshot
- BodyMetricLog

## Canonical flow

### 1. Coach authors content
Coach creates exercises, workouts, and programs.

### 2. Athlete receives planned workout
A program day points to a planned workout.

### 3. Athlete starts workout session
The app creates a WorkoutSession from the planned workout.
At this point prescribed values are copied into session rows.

### 4. Athlete completes sets
When a set is completed:
- the set is marked completed
- actual values are stored
- if actual fields are still blank, prescribed values are copied into actual fields as the default performed result
- prescribed values remain unchanged

### 5. Athlete finishes session
Session becomes authoritative and complete.

### 6. Analytics run from completed session
Derived records are created from actual performed values.

## Session behavior rules

### Start session
- one planned workout becomes one execution session
- session rows are snapshots, not live pointers into mutable planning rows

### Complete set
- only mutate the selected WorkoutSessionSet
- do not overwrite prescribed values
- actual values are the values used for later calculations

### Finish session
- closing the session is the authoritative trigger for downstream analytics
- partial intermediate edits should not create final fatigue summaries

## Fatigue engine boundaries
The fatigue engine should be implemented as a shared pure domain module.
It should not live inside UI code.

Inputs:
- completed session sets
- actual reps, load, duration, distance, effort values
- exercise muscle and sub-muscle mappings
- fatigue multipliers and intensity logic

Outputs:
- muscle load events
- session muscle summaries
- sub-muscle summaries
- athlete-facing readiness or fatigue views later

## State ownership

### Stored in database
- users, athletes, coaches
- exercises and mappings
- plans
- sessions
- completed sets
- analytics and snapshots

### Stored in client state
- active filters
- in-progress UI state
- currently open timer modal
- local optimistic state for session UX

## Recommended implementation boundaries

### Mobile app
- athlete flows only
- optimized set logging and timers

### Web app
- coach workflows and dashboards
- exercise library and program authoring

### Shared packages
- types
- validation schemas
- domain services
- fatigue engine
- formatting helpers

## Non-goals for v1
- advanced social features
- chat or messaging between athletes and coaches
- wearable integrations
- offline sync beyond basic cached UX
- complex AI coaching generation

## v1 success criteria
- coach can define exercises, workouts, and programs
- athlete can start a workout session and complete sets cleanly
- prescribed and actual values stay separate
- fatigue calculations run from actual performed work
- progress history is reliable
- dashboard shows useful training data without Bubble-style schema confusion
