# PPLUS Training, Product Map v1

## Purpose
This document re-anchors the build around the whole product.

The app is not a timer app.
The app is not only a workout logger.
The app is a training platform for hockey athletes and coaches.

## Primary surfaces

### Athlete mobile app
The athlete app should include these major surfaces:

1. Home
   - high-level welcome
   - current training state
   - quick links into today, progress, and recovery

2. Today / Dashboard
   - today’s assigned workout
   - quick progress summary
   - readiness/fatigue summary later
   - outstanding tasks like check-ins later

3. Program
   - current program overview
   - week/day structure
   - workout schedule
   - workout completion state

4. Workout detail
   - planned workout view before start
   - exercise list
   - prescribed sets
   - estimated duration
   - notes

5. Active workout session
   - set logging
   - actual values
   - timer and rest flow
   - completion state

6. Progress
   - exercise progress
   - workload trends
   - performance snapshots
   - compliance over time

7. Profile / settings
   - athlete account
   - preferences
   - app settings

### Coach web app
The coach app should include these major surfaces:

1. Dashboard
   - system overview
   - athlete activity
   - current program activity
   - recent sessions

2. Athletes
   - athlete list
   - athlete detail
   - readiness and fatigue status later
   - progress review

3. Programs
   - program list
   - program builder
   - weekly/day structure
   - athlete assignment

4. Workouts
   - workout template list
   - workout builder
   - planned exercise and set structure

5. Exercises
   - exercise library
   - exercise detail
   - muscle mapping
   - sub-muscle mapping

6. Analytics
   - fatigue views
   - performance views
   - compliance views
   - trend summaries

## Product domain map

### Identity domain
- users
- athlete profiles
- coach profiles
- permissions

### Exercise domain
- exercises
- muscles
- sub-muscles
- exercise muscle mappings
- exercise sub-muscle mappings
- fatigue multipliers

### Workout domain
- workout templates
- workout template exercises
- workout template sets

### Program domain
- programs
- program weeks
- program days
- planned workouts
- planned workout exercises
- planned workout sets

### Session domain
- workout sessions
- session exercises
- session sets
- prescribed vs actual values
- workout timers
- rest timers
- completion flow

### Analytics domain
- muscle load events
- session muscle summaries
- session sub-muscle summaries
- performance snapshots
- progress summaries
- recovery/readiness later

## Core rule
No single feature should define the product architecture.

The timer is a feature.
The active workout is a feature.
The product is the full training system.

## Build intent
From this point forward, implementation should clearly map back to one of the major product domains above.
If a change only serves one narrow workflow and does not fit the broader product map, it should be treated as incomplete.
