# PPLUS Training, Build Roadmap v1

## Principle
Build the app around the workout session flow first.
That is the product core and the source of trustworthy analytics.

## Milestone 1, architecture and schema
Deliverables:
- architecture document
- schema document
- build roadmap

Outcome:
- stable product direction
- clear planning vs execution model
- clear prescribed vs actual model

## Milestone 2, repository and app skeleton
Deliverables:
- monorepo structure
- Expo app scaffold
- Next.js app scaffold
- shared package structure
- linting, formatting, TypeScript base config

Suggested structure:
- apps/mobile
- apps/web
- packages/types
- packages/core
- packages/ui
- infra/supabase

## Milestone 3, auth and base app shell
Deliverables:
- auth screens
- role-aware app shell
- athlete mobile navigation
- coach web dashboard shell

## Milestone 4, exercise library and mappings
Deliverables:
- exercise CRUD on web
- muscle map CRUD
- sub-muscle map CRUD
- validation rules around one primary path and clean contribution handling

## Milestone 5, workout template builder
Deliverables:
- workout template CRUD
- workout template exercise editor
- workout template set editor
- prescribed targets, rest, and notes

## Milestone 6, program planning
Deliverables:
- program CRUD
- week and day structure
- assign workouts to days
- athlete program view

## Milestone 7, workout session engine
Deliverables:
- create session from planned workout
- session timers
- set completion flow
- prescribed to actual handoff
- add set flow
- finish session flow

This is the first moment the product becomes truly usable.

## Milestone 8, athlete mobile experience
Deliverables:
- home page
- today dashboard
- active workout screen
- rest timer modal
- progress history screen

SPOTR is the interaction benchmark for this milestone.

## Milestone 9, analytics engine
Deliverables:
- muscle load event creation
- session muscle summary creation
- sub-muscle summary creation
- performance snapshot creation
- progress metrics and charts

## Milestone 10, coach analytics dashboard
Deliverables:
- athlete overview
- program compliance
- fatigue dashboard
- exercise progress dashboard
- session history review

## Implementation order inside the codebase

### Shared first
Build these before broad UI work:
- domain types
- Zod schemas
- session creation logic
- set completion logic
- fatigue engine stubs
- analytics trigger contracts

### Then mobile execution flow
Why:
- it validates the most important product path early
- it proves the schema works

### Then web authoring and analytics
Why:
- coach tooling depends on a stable domain model
- dashboards are much easier once execution data is trustworthy

## Early technical decisions to hold
- TypeScript everywhere
- server state with TanStack Query
- local session UX state with Zustand
- validation with Zod
- domain logic in shared packages, not duplicated between apps
- analytics derived from completed session actuals only

## Suggested first implementation tickets
1. create monorepo skeleton
2. create shared TypeScript config and lint setup
3. define domain types for planning and execution
4. implement session creation service
5. implement complete-set service
6. implement finish-session service
7. scaffold athlete mobile session screen
8. scaffold coach web dashboard
9. prepare SQL schema draft for Supabase migration
10. import initial exercise and program data

## Definition of done for v1 foundation
- the domain is documented
- the schema is documented
- the build order is documented
- the project can move into implementation without rethinking the model from scratch
