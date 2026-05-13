# PPLUS Session Truth Cleanup Pass 1

**Date:** 2026-04-29
**Goal:** Clean the first structural seam after the single-active-workout fix: shared workout/session identity matching and leftover debug instrumentation.

## Why this pass
Current focused tests are green, but session truth is still spread across multiple ad-hoc comparisons like:
- `session.programWorkoutId || session.id`
- `workoutModel.actionPayload.programWorkoutId`
- direct equality checks repeated in multiple files

That is how regressions creep back in.

## Scope
1. Extract a shared helper for workout/session identity matching.
2. Use it in the train-home and workout-sheet seams.
3. Remove the temporary debug `console.info(...)` instrumentation from stable paths.
4. Re-run the focused session-truth tests.

## Files expected
- `apps/mobile/src/train/index.js`
- `apps/mobile/src/train/workout-sheet-models.js`
- `apps/mobile/src/train/session-runtime.js`
- `apps/mobile/App.js`
- `tests/mobile-session-runtime.test.js` if helper coverage needs to live there
- or a new focused test file under `tests/`

## Acceptance criteria
- one shared source of truth exists for comparing session vs workout identity
- train-home selected workout and workout-sheet use the shared helper
- temporary debug logs for session hydration/start/resume/save are removed
- focused session/workout tests stay green
