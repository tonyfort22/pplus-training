# PPLUS Finish Workout Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build the active-workout Finish flow with correct empty-workout blocking, discard handoff, authoritative session finalization, and safe downstream metric derivation.

**Architecture:** Treat Finish as a domain transition owned by the shared session engine, not a UI-only action. The mobile active-workout screen should validate whether a session may finish and route the user into the right branch, but the authoritative data writes belong to `workout_sessions`, `workout_session_exercises`, and `workout_session_sets`. Derived progress and fatigue data must come only from completed session actuals.

**Tech Stack:** Expo mobile app, shared JS domain layer in `packages/core`, Supabase adapters in `packages/data`, source-contract tests in `tests/`, plan/docs in `docs/`.

---

## Current repo reality

### Already present
- `apps/mobile/App.js`
  - `handleFinishWorkout()` exists
  - `handleDiscardWorkout()` exists
  - optimistic session persistence already exists
- `packages/core/src/index.js`
  - `finishWorkoutSession(...)`
  - `discardWorkoutSession(...)`
- `packages/data/src/sessions/index.js`
  - round-trips `completed_sets_count`, `completed_exercises_count`, `perceived_difficulty`
- `infra/supabase/schema-v1.sql`
  - `workout_sessions`
  - `workout_session_exercises`
  - `workout_session_sets`
  - `exercise_performance_snapshots`
  - `muscle_load_events`

### Important current gap
Right now `handleFinishWorkout()` is too blunt:

```js
async function handleFinishWorkout() {
  if (session.status === 'completed' || session.status === 'discarded') return;
  await persistSessionUpdate(finishWorkoutSession({ session, elapsedSeconds }));
}
```

That means:
- no empty-workout guard
- no SPOTR-style empty modal
- no final review seam
- no explicit analytics derivation seam
- no protected finish contract for cross-app metrics

---

## Product rules to preserve

1. **Planned is not performed**
2. **Prescribed is not actual**
3. **Only completed session rows feed analytics**
4. **Discarded sessions do not feed completed-performance analytics**
5. **Finish is the authoritative trigger for session completion metrics**
6. **Empty workouts cannot be finished**

---

## Recommended implementation phases

### Phase 1
Build the finish-state machine and SPOTR empty-workout behavior.

### Phase 2
Expand the finish contract to support final completion payload fields cleanly.

### Phase 3
Add the explicit derived-metrics seam for completed sessions.

### Phase 4
Refresh progress / status surfaces off the finalized session contract.

---

## Task 1: Lock the finish domain contract in shared core

**Objective:** Make the session engine expose explicit finish eligibility and completion semantics before touching the active-workout UI.

**Files:**
- Modify: `packages/core/src/index.js`
- Test: `tests/session-engine.test.js`

**Step 1: Write failing tests**
Add tests for:
- `canFinishWorkoutSession(session)` returns `false` when `completedSetsCount === 0`
- `canFinishWorkoutSession(session)` returns `true` when at least one set is completed
- `finishWorkoutSession(...)` preserves authoritative completed counts
- `discardWorkoutSession(...)` does not fake completion analytics state

Example test shape:

```js
test('canFinishWorkoutSession returns false for an empty session', () => {
  const session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(canFinishWorkoutSession(session), false)
})
```

**Step 2: Run the specific tests to verify failure**

Run:
```bash
node --test tests/session-engine.test.js
```

Expected:
- FAIL because `canFinishWorkoutSession` does not exist yet

**Step 3: Write minimal implementation**
Add a small helper in `packages/core/src/index.js`:

```js
export function canFinishWorkoutSession(session) {
  if (!session) return false
  return Number(session.completedSetsCount ?? 0) > 0
}
```

Do not add UI behavior here.

**Step 4: Keep finish/discard pure**
Keep `finishWorkoutSession(...)` and `discardWorkoutSession(...)` focused on:
- status
- timestamps
- elapsed time
- active timer clearing
- refreshed counts/statuses

Do not write analytics inside core.

**Step 5: Re-run tests**

Run:
```bash
node --test tests/session-engine.test.js
```

Expected:
- PASS

**Step 6: Commit**

```bash
git add packages/core/src/index.js tests/session-engine.test.js
git commit -m "feat: add finish eligibility helper for workout sessions"
```

---

## Task 2: Add the empty-workout modal contract to the active workout screen

**Objective:** Make the active-workout surface match the SPOTR empty-workout branch before changing the app-shell finish handler.

**Files:**
- Modify: `apps/mobile/src/screens/active-workout-view.js`
- Test: `tests/mobile-active-workout-view.test.js`

**Step 1: Write failing source-contract tests**
Assert the file contains:
- local state for `isEmptyWorkoutModalOpen`
- a modal component like `ActiveWorkoutEmptyWorkoutModal`
- copy:
  - `Empty Workout`
  - `Complete sets to finish a workout`
  - `Discard Workout`
  - `Continue`
- handlers:
  - `onOpenEmptyWorkoutModal`
  - `onCloseEmptyWorkoutModal`
  - `onConfirmEmptyWorkoutDiscard`

**Step 2: Run the test to verify failure**

Run:
```bash
node --test tests/mobile-active-workout-view.test.js
```

Expected:
- FAIL because the empty-workout modal structure does not exist yet

**Step 3: Implement the minimal UI contract**
Inside `ActiveWorkoutViewContent(...)`:
- add local modal-open state
- add a centered modal component matching the discard modal style family
- add props for:
  - `canFinishWorkout`
  - `onConfirmFinish`
  - `onDiscard`

Behavior rule:
- Finish button tap should not directly call the parent finish handler anymore
- it should branch:
  - if `canFinishWorkout` is false → open empty modal
  - else → call `onConfirmFinish`

**Step 4: Keep discard reuse clean**
From the empty-workout modal:
- `Continue` closes modal only
- `X` closes modal only
- `Discard Workout` calls the existing discard seam from parent

**Step 5: Re-run tests**

Run:
```bash
node --test tests/mobile-active-workout-view.test.js
```

Expected:
- PASS

**Step 6: Commit**

```bash
git add apps/mobile/src/screens/active-workout-view.js tests/mobile-active-workout-view.test.js
git commit -m "feat: add empty workout finish guard modal"
```

---

## Task 3: Replace the blunt app-shell finish handler with a finish state machine seam

**Objective:** Move finish branching into an explicit app-shell contract instead of finishing unconditionally.

**Files:**
- Modify: `apps/mobile/App.js`
- Test: `tests/mobile-app-shell.test.js`

**Step 1: Write failing source-contract tests**
Add assertions for:
- import/use of `canFinishWorkoutSession`
- a derived boolean like `const canFinishActiveWorkout = ...`
- `<ActiveWorkoutView ... canFinishWorkout={canFinishActiveWorkout} ... />`
- `handleFinishWorkout()` no longer directly finishes empty sessions

**Step 2: Run tests to verify failure**

Run:
```bash
node --test tests/mobile-app-shell.test.js
```

Expected:
- FAIL because `canFinishWorkout` is not threaded yet

**Step 3: Implement the shell seam**
In `App.js`:
- derive `canFinishActiveWorkout = canFinishWorkoutSession(session)`
- pass it into `ActiveWorkoutView`
- keep `handleFinishWorkout()` as the valid-finish path only

Recommended shape:

```js
const canFinishActiveWorkout = useMemo(
  () => canFinishWorkoutSession(session),
  [session]
)
```

**Step 4: Preserve current valid-finish behavior for now**
For this task only:
- if valid, still call `persistSessionUpdate(finishWorkoutSession({ session, elapsedSeconds }))`
- do not yet add review fields or analytics writes

**Step 5: Re-run tests**

Run:
```bash
node --test tests/mobile-app-shell.test.js tests/mobile-active-workout-view.test.js
```

Expected:
- PASS

**Step 6: Commit**

```bash
git add apps/mobile/App.js tests/mobile-app-shell.test.js
 git commit -m "feat: wire finish eligibility through active workout shell"
```

---

## Task 4: Add the completion payload structure now, even if the UI uses only part of it first

**Objective:** Create the right finish payload seam so future fields do not get bolted awkwardly onto the finish action.

**Files:**
- Modify: `packages/core/src/index.js`
- Modify: `packages/data/src/sessions/index.js`
- Test: `tests/session-engine.test.js`
- Test: `tests/session-supabase-rest-db.test.js`

**Step 1: Write failing tests**
Add tests showing `finishWorkoutSession(...)` can accept optional payload like:
- `completedAt`
- `elapsedSeconds`
- `perceivedDifficulty`
- `notes`

Example:

```js
const finished = finishWorkoutSession({
  session,
  completedAt: '2026-04-21T20:30:00.000Z',
  elapsedSeconds: 1800,
  perceivedDifficulty: 7,
})

assert.equal(finished.perceivedDifficulty, 7)
```

**Step 2: Run the test to verify failure**

Run:
```bash
node --test tests/session-engine.test.js tests/session-supabase-rest-db.test.js
```

Expected:
- FAIL if payload is not preserved/round-tripped

**Step 3: Implement minimal payload support**
Support optional completion-time fields in the session object without inventing extra tables yet.

Keep first-pass scope tight:
- `perceivedDifficulty`
- completion-time note preservation only if provided explicitly

**Step 4: Re-run tests**

Run:
```bash
node --test tests/session-engine.test.js tests/session-supabase-rest-db.test.js
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/core/src/index.js packages/data/src/sessions/index.js tests/session-engine.test.js tests/session-supabase-rest-db.test.js
git commit -m "feat: support finish payload fields on workout sessions"
```

---

## Task 5: Add the explicit completed-session metrics derivation seam

**Objective:** Create a shared place where completed workout sessions can fan out into progress analytics safely.

**Files:**
- Create: `packages/data/src/analytics/index.js` or extend the existing analytics module
- Modify: `packages/data/src/index.js`
- Test: `tests/` add focused analytics derivation contract test

**Step 1: Write failing tests**
Add a test for a function like:
- `buildCompletedSessionAnalyticsPayload(session)`

Assert:
- it ignores discarded sessions
- it reads only completed session sets
- it emits exercise-performance-ready rows from actuals

**Step 2: Run the test to verify failure**

Run the new focused test.

Expected:
- FAIL because the derivation seam does not exist yet

**Step 3: Implement the minimal seam**
Do **not** fully ship every analytics write yet.
Start with a pure builder function that:
- accepts a completed session
- returns normalized payloads for:
  - exercise performance snapshots
  - muscle load event inputs

This keeps analytics deterministic and testable.

**Step 4: Re-run the focused test**
Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/data/src/analytics packages/data/src/index.js tests/[new-analytics-test].js
git commit -m "feat: add completed session analytics derivation seam"
```

---

## Task 6: Trigger derived metrics only after a valid completed finish

**Objective:** Hook finish completion to the new analytics seam without contaminating discard or in-progress flows.

**Files:**
- Modify: `apps/mobile/src/train/session-runtime.js`
- Modify: `packages/data/src/sessions/index.js` and/or analytics adapter files
- Test: `tests/mobile-session-runtime.test.js`

**Step 1: Write failing tests**
Cover:
- completed finish triggers analytics derivation/save path
- discarded session does not
- empty blocked finish does not

**Step 2: Run the test to verify failure**
Expected:
- FAIL because there is no analytics trigger path yet

**Step 3: Implement minimal trigger**
Best first-pass place:
- after a session is persisted as `completed`
- call the analytics derivation seam
- keep it idempotent-minded

Important first-pass guard:
- only trigger when `nextSession.status === 'completed'`
- never on `discarded`
- never on `in_progress`

**Step 4: Re-run tests**
Expected:
- PASS

**Step 5: Commit**

```bash
git add apps/mobile/src/train/session-runtime.js packages/data/src/sessions/index.js tests/mobile-session-runtime.test.js
 git commit -m "feat: trigger analytics only from completed workout finish"
```

---

## Task 7: Refresh product surfaces from the finalized finish/discard contract

**Objective:** Make sure the rest of the app reads the authoritative finish outcome correctly.

**Files:**
- Modify as needed:
  - `apps/mobile/src/train/completed-session-models.js`
  - `apps/mobile/src/train/discarded-session-models.js`
  - `apps/mobile/src/train/workout-sheet-models.js`
  - `apps/mobile/src/train/progress-*`
- Tests:
  - `tests/mobile-completed-session-models.test.js`
  - `tests/mobile-discarded-session-models.test.js`
  - `tests/mobile-progress-models.test.js`
  - `tests/mobile-surface-models.test.js`

**Step 1: Write or tighten tests**
Assert:
- completed sessions surface valid summary info
- discarded sessions explicitly say they do not feed analytics
- progress views read only completed sessions

**Step 2: Run tests to verify failures where needed**

**Step 3: Implement minimal adjustments**
Do not redesign the surfaces here.
Just make sure they reflect the finish contract cleanly.

**Step 4: Run focused suite**

```bash
node --test tests/mobile-completed-session-models.test.js tests/mobile-discarded-session-models.test.js tests/mobile-progress-models.test.js tests/mobile-surface-models.test.js
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add apps/mobile/src/train tests/mobile-completed-session-models.test.js tests/mobile-discarded-session-models.test.js tests/mobile-progress-models.test.js tests/mobile-surface-models.test.js
git commit -m "feat: align session summary and progress surfaces with finish contract"
```

---

## Task 8: Run the final focused verification pass

**Objective:** Prove the finish workflow and metric contract are stable before device QA.

**Files:**
- No production code required unless regressions appear

**Step 1: Run focused tests**

```bash
node --test \
  tests/session-engine.test.js \
  tests/session-supabase-rest-db.test.js \
  tests/mobile-app-shell.test.js \
  tests/mobile-active-workout-view.test.js \
  tests/mobile-session-runtime.test.js \
  tests/mobile-completed-session-models.test.js \
  tests/mobile-discarded-session-models.test.js \
  tests/mobile-progress-models.test.js \
  tests/mobile-surface-models.test.js
```

Expected:
- all pass

**Step 2: Restart Expo cleanly**

```bash
pnpm --dir ./apps/mobile exec expo start --lan --port 8084 --clear
```

**Step 3: Device QA checklist**
On the phone:
1. Start a workout with **0 completed sets**
2. Tap **Finish**
3. Verify `Empty Workout` modal appears
4. Tap **Continue** and verify the workout remains open
5. Re-open modal and tap **Discard Workout**
6. Verify the workout closes and the session becomes discarded
7. Start another workout and complete at least one set
8. Tap **Finish**
9. Verify the valid finish path completes normally
10. Verify progress/history surfaces reflect the completed workout, not the discarded one

**Step 4: Commit**

```bash
git add .
git commit -m "feat: complete finish workout flow and metrics contract"
```

---

## Non-goals for this pass
- full post-finish celebration / summary redesign if not shown in reference yet
- advanced recovery calculations
- long-horizon readiness modeling
- new coach dashboard surfaces beyond consuming the finalized session contract

---

## Final notes

### Recommended first-pass scope
Keep the first implementation honest:
- empty finish block
- discard handoff
- valid finish finalization
- optional perceived difficulty payload seam
- analytics derivation seam

Do **not** over-build a giant completion wizard unless the SPOTR reference actually shows one.

### The main thing not to get wrong
Do not let any surface treat:
- planned set rows
- partially edited in-progress rows
- discarded sessions

as completed athlete performance.

That’s the line that protects the whole app.
