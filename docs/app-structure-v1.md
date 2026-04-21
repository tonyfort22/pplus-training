# PPLUS Training, App Structure v1

## Goal
Translate the broader product model into concrete app surfaces.

This structure is informed by:
- the existing PPLUS / PPHT product direction
- the product-map document
- SPOTR as an interaction and surface reference

## Athlete mobile app structure

### Primary navigation
Recommended bottom navigation for the athlete app:

1. Train
2. Progress
3. Team
4. Inbox

This mirrors the broad shape visible in SPOTR without copying it blindly.

### Athlete surfaces

#### 1. Train
This is the operational home for an athlete.

Sub-surfaces:
- Home
- Today
- Program overview
- Weekly calendar
- Workout detail
- Active workout session

Responsibilities:
- show what the athlete should do next
- show current program state
- provide fast access to starting and completing workouts

#### 2. Progress
This is the athlete analytics and review area.

Sub-surfaces:
- strength metrics
- performance snapshots
- training load
- muscle fatigue / recovery
- health metrics later

Responsibilities:
- show trend views over time
- show current training status
- connect workouts to adaptation and readiness

#### 3. Team
This is the people and relationship area.

Sub-surfaces:
- coach view
- teammates or community later
- referrals or invites later if desired

Responsibilities:
- keep athlete identity connected to coaching and team context

#### 4. Inbox
This is the communication area.

Sub-surfaces:
- coach messages later
- support messages later
- alerts / reminders later

Responsibilities:
- centralize important communication instead of scattering it

### Athlete secondary surfaces
Accessible through profile/menu:
- profile
- settings
- unit preferences
- reminder preferences
- integrations later
- exercise library reference
- equipment preferences later

## Coach web app structure

### Primary sections
1. Dashboard
2. Athletes
3. Programs
4. Workouts
5. Exercises
6. Analytics

### Coach section responsibilities

#### Dashboard
- overall activity
- recent sessions
- athlete overview
- quick navigation to management areas

#### Athletes
- athlete list
- athlete detail
- assigned program
- recent sessions
- progress overview

#### Programs
- program list
- program builder
- week/day structure
- assignment flow

#### Workouts
- workout template list
- workout template detail
- exercise/set composition

#### Exercises
- exercise library
- exercise detail
- muscle maps
- sub-muscle maps

#### Analytics
- fatigue trends
- performance snapshots
- compliance metrics
- workload summaries

## Product routing principle
The active workout session is one surface inside Train.
It is not the root of the app architecture.

The timer is one tool inside the active workout session.
It is not the root of the product.

## Suggested repo mapping

### Mobile app
- `train/`
- `progress/`
- `team/`
- `inbox/`
- `settings/`

### Web app
- `dashboard/`
- `athletes/`
- `programs/`
- `workouts/`
- `exercises/`
- `analytics/`

### Data layer
- `identity`
- `athletes`
- `exercises`
- `workouts`
- `programs`
- `sessions`
- `analytics`

## Current implementation note
The active workout session slice already exists in early form.
The next code structure work should place that slice under the Train area instead of letting it stand in for the whole mobile product.
