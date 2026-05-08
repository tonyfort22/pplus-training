# Start Workout Active Session Flow Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make the workout sheet `Start Workout` button create or resume a real live session and open a dedicated active workout surface that matches the screen recording flow.

**Architecture:** Reuse the existing PPLUS session engine and session store instead of inventing a second workout runtime. Keep the current workout preview sheet as the pre-start surface, then transition into a dedicated active workout modal/screen backed by `workout_session` state. Share as much workout/exercise rendering structure as possible between preview and active surfaces, but keep planning and execution data separate.

**Tech Stack:** Expo / React Native, existing mobile app shell in `apps/mobile`, `packages/core` session engine, `packages/data` session repository, NativeWind, lucide-react-native, current theme primitives.

---

## What the video requires

The recording at `~/Downloads/start_workout_button.MP4` shows this exact UX:

1. User starts on the existing workout preview/detail sheet.
2. A large bottom `Start Workout` CTA is visible.
3. Tapping it does **not** open a confirm sheet.
4. The app transitions directly into a live workout session for the same workout.
5. The destination surface shows:
   - elapsed timer
   - progress like `0/20 Sets`
   - `Finish` button
   - notes field
   - interactive exercise/set rows
   - rest timers
   - completion feedback
6. The live surface is visually close to the preview surface, but behavior changes from planned to active execution.

So the implementation should be:
- **preview sheet** remains the pre-start layer
- **active session surface** becomes a new dedicated layer
- `Start Workout` should create/resume a `workout_session` and immediately open that layer

---

## Current repo state

### Existing seams we should reuse
- `apps/mobile/src/screens/workout-sheet.js`
  - current preview/detail sheet with `Start Workout`
- `apps/mobile/src/train/session-runtime.js`
  - already has `createTrainSessionStore`, `startSession`, `resumeSession`, `saveSession`
- `packages/core/src/index.js`
  - existing session engine helpers already used by `App.js`
- `apps/mobile/App.js`
  - already owns session state, elapsed timer updates, and handlers like:
    - `handleCompleteSet`
    - `handleFinishWorkout`
    - `handleDiscardWorkout`
    - `persistSessionUpdate`
- `apps/mobile/src/train/session-models.js`
  - already derives header/progress/rest/session exercise view models
- `apps/mobile/src/train/active-session-models.js`
  - already derives active-session surface models

### Current mismatch vs the recording
Today, `onStartWorkout={handleOpenOrResumeSession}` is still anchored to the older Train session-tab flow, not a dedicated active-workout surface matching the video.

The app already has the domain engine. What is missing is the **right UI seam** and **right navigation/state handoff**.

---

## High-level implementation approach

### Keep
- current workout preview sheet
- current session engine
- current session store
- current session mutation handlers in `App.js`

### Add
- a dedicated `ActiveWorkoutView` surface in `apps/mobile/src/screens/`
- an active-workout view model layer that reshapes existing session data to match the recording
- app-shell state for opening/closing the active workout surface
- a clean `handleStartWorkoutFromSheet()` seam that:
  - resumes an in-progress session for the selected `programWorkoutId` when appropriate
  - otherwise starts a fresh session
  - opens the active workout surface immediately

### Avoid
- creating a second session engine
- mutating planned workout rows directly during execution
- opening a confirmation modal before session start
- pushing the user into the generic Train tab session surface if it does not match the recorded UX

---

## Target UX contract

### Pre-start sheet
Source surface remains `WorkoutSheet` with:
- close button
- edit action
- title and summary metadata
- planned exercise preview
- sticky `Start Workout` CTA

### After pressing Start Workout
Immediate behavior:
- if current session belongs to same `programWorkoutId` and is still in progress, resume it
- else start a new session from that workout
- close `WorkoutSheet`
- open `ActiveWorkoutView`

### Active workout surface
Must include:
- top row with compact dismiss/close affordance, timer, settings/utility affordance, finish CTA
- title + live progress summary
- notes field
- exercise sections with live rows
- completion controls
- rest timer controls
- bottom actions like discard/add-exercise later

We do **not** need to finish every active-session nicety in one shot. First milestone is opening the correct surface with real session data and working timer/progress.

---

# Task plan

## Task 1: Audit the current Start Workout seam and lock the intended behavior in tests

**Objective:** Write failing tests that define the correct Start Workout transition before changing the UI.

**Files:**
- Modify: `tests/mobile-workout-sheet.test.js`
- Modify: `tests/mobile-session-runtime.test.js`
- Modify: `tests/mobile-app-shell.test.js` or create `tests/mobile-active-workout-view.test.js`

**Step 1: Write failing source-level tests for the new seam**

Add assertions for:
- `App.js` owns a new active-workout open state, e.g. `isActiveWorkoutViewOpen`
- `WorkoutSheet` uses `onStartWorkout={handleStartWorkoutFromSheet}` instead of the old generic flow
- `handleStartWorkoutFromSheet` checks selected `programWorkoutId`
- `handleStartWorkoutFromSheet` either resumes matching in-progress session or starts a fresh session
- `handleStartWorkoutFromSheet` closes `WorkoutSheet` and opens `ActiveWorkoutView`
- `App.js` renders `<ActiveWorkoutView ... />`

**Step 2: Run the failing test**

Run:
```bash
node --test tests/mobile-workout-sheet.test.js tests/mobile-app-shell.test.js
```

Expected: FAIL because `ActiveWorkoutView` and the new seam do not exist yet.

**Step 3: Commit after green later**

Commit message:
```bash
git commit -m "test: define start workout active session seam"
```

---

## Task 2: Add the dedicated ActiveWorkoutView screen shell

**Objective:** Create the new active workout surface component with the right structural slots before wiring behavior.

**Files:**
- Create: `apps/mobile/src/screens/active-workout-view.js`
- Test: `tests/mobile-active-workout-view.test.js`

**Step 1: Write failing structure test**

Create assertions for:
- exported `ActiveWorkoutView`
- modal/screen shell with `SafeAreaProvider` and `SafeAreaView`
- header containing timer label and finish action
- notes field placeholder
- exercise list rendering
- theme primitives only, no hardcoded colors

**Step 2: Run the failing test**

Run:
```bash
node --test tests/mobile-active-workout-view.test.js
```

Expected: FAIL because file does not exist yet.

**Step 3: Write minimal screen shell**

Build:
- `ActiveWorkoutView`
- `ActiveWorkoutViewContent`
- header area
- scroll area
- bottom safe-area spacing

Initial props should be:
```js
{
  isVisible,
  model,
  theme,
  onClose,
  onFinish,
  onDiscard,
  onOpenExerciseDetail,
  onCompleteSet,
  onAdjustQuickActual,
  onAdjustRestTimer,
  onDismissRestTimer,
}
```

**Step 4: Run the test to green**

Run:
```bash
node --test tests/mobile-active-workout-view.test.js
```

**Step 5: Commit**

```bash
git add apps/mobile/src/screens/active-workout-view.js tests/mobile-active-workout-view.test.js
git commit -m "feat: add active workout view shell"
```

---

## Task 3: Add an active workout view-model layer that matches the recording

**Objective:** Convert existing session data into a screen model shaped for the recorded UI instead of the older generic train-session cards.

**Files:**
- Create: `apps/mobile/src/train/active-workout-view-models.js`
- Test: `tests/mobile-active-workout-view-models.test.js`
- Read for reference: `apps/mobile/src/train/session-models.js`

**Step 1: Write failing model test**

Test the derived model includes:
- `title`
- `summaryItems` like exercises count, completed/total sets, elapsed timer
- `notesPlaceholder`
- exercise list with:
  - title
  - thumbnail icon
  - rest label
  - set rows
  - done state
  - actual/load/reps/effort values
- header actions like `finishLabel`

**Step 2: Run it red**

Run:
```bash
node --test tests/mobile-active-workout-view-models.test.js
```

Expected: FAIL.

**Step 3: Implement the model**

Derive from existing session helpers, but reshape for the new surface.

Do **not** rebuild progress logic manually if `packages/core` already exposes it.

The model should prefer:
- `session.nameSnapshot`
- `session.exercises`
- `session.completedSetsCount` or `getSessionProgress(session)`
- `elapsedSeconds`

**Step 4: Run green**

```bash
node --test tests/mobile-active-workout-view-models.test.js
```

**Step 5: Commit**

```bash
git add apps/mobile/src/train/active-workout-view-models.js tests/mobile-active-workout-view-models.test.js
git commit -m "feat: add active workout view model"
```

---

## Task 4: Wire App.js state for opening the active workout surface

**Objective:** Add the new app-shell state and render path for the active workout surface.

**Files:**
- Modify: `apps/mobile/App.js`
- Test: `tests/mobile-app-shell.test.js`

**Step 1: Write failing assertions**

Add/extend tests asserting:
- `const [isActiveWorkoutViewOpen, setIsActiveWorkoutViewOpen] = useState(false);`
- `const activeWorkoutViewModel = useMemo(...);`
- `App.js` renders `<ActiveWorkoutView ... />`
- close handler returns to expected state without losing session state

**Step 2: Run red**

```bash
node --test tests/mobile-app-shell.test.js
```

**Step 3: Implement minimal state wiring**

In `App.js`:
- import `ActiveWorkoutView`
- import `getActiveWorkoutViewModel`
- create open/close state
- derive the model from current `session` + `elapsedSeconds`
- render the surface near `WorkoutSheet` and `WorkoutEditView`

**Step 4: Run green**

```bash
node --test tests/mobile-app-shell.test.js
```

**Step 5: Commit**

```bash
git add apps/mobile/App.js tests/mobile-app-shell.test.js
git commit -m "feat: wire active workout view into app shell"
```

---

## Task 5: Replace the current Start Workout handler with a dedicated sheet-to-session seam

**Objective:** Make the workout sheet button create or resume the right session and open the new surface immediately.

**Files:**
- Modify: `apps/mobile/App.js`
- Test: `tests/mobile-workout-sheet.test.js`
- Test: `tests/mobile-session-runtime.test.js`

**Step 1: Write failing behavior tests**

Test cases:
1. Starting from the workout sheet with no matching session:
   - calls `effectiveSessionStore.startSession({ startedAt, programWorkoutId })`
   - stores returned session
   - closes sheet
   - opens active workout view
2. Starting when current session is already `in_progress` for the same `programWorkoutId`:
   - resumes instead of creating duplicate session
3. Starting when current session belongs to a different workout:
   - starts a fresh session for selected workout

**Step 2: Run red**

```bash
node --test tests/mobile-workout-sheet.test.js tests/mobile-session-runtime.test.js
```

**Step 3: Implement `handleStartWorkoutFromSheet()`**

Recommended logic in `App.js`:
```js
async function handleStartWorkoutFromSheet() {
  if (!effectiveSessionStore || !selectedProgramWorkoutId) return

  const sameWorkoutInProgress = (
    session?.status === 'in_progress' &&
    session?.programWorkoutId === selectedProgramWorkoutId
  )

  let nextSession = session

  if (sameWorkoutInProgress) {
    nextSession = await effectiveSessionStore.resumeSession(session.id)
  } else {
    const result = await effectiveSessionStore.startSession({
      startedAt: new Date().toISOString(),
      programWorkoutId: selectedProgramWorkoutId,
    })
    nextSession = result?.session || null
  }

  if (!nextSession) return

  setSession(nextSession)
  setIsWorkoutSheetOpen(false)
  setIsActiveWorkoutViewOpen(true)
}
```

**Step 4: Run green**

```bash
node --test tests/mobile-workout-sheet.test.js tests/mobile-session-runtime.test.js
```

**Step 5: Commit**

```bash
git add apps/mobile/App.js tests/mobile-workout-sheet.test.js tests/mobile-session-runtime.test.js
git commit -m "feat: start workout from sheet into active session view"
```

---

## Task 6: Render the live session header exactly off real session state

**Objective:** Match the video’s top-of-screen live-session behavior.

**Files:**
- Modify: `apps/mobile/src/train/active-workout-view-models.js`
- Modify: `apps/mobile/src/screens/active-workout-view.js`
- Test: `tests/mobile-active-workout-view.test.js`

**Step 1: Write failing UI assertions**

Verify presence of:
- live timer label
- `Finish` action
- title
- summary progress like `0/20 Sets`
- notes placeholder

**Step 2: Run red**

```bash
node --test tests/mobile-active-workout-view.test.js
```

**Step 3: Implement minimal live header**

Use the session model to derive:
- `finishLabel`
- formatted elapsed timer
- progress text
- notes placeholder

Use existing theme primitives and no hardcoded colors.

**Step 4: Run green**

```bash
node --test tests/mobile-active-workout-view.test.js
```

**Step 5: Commit**

```bash
git add apps/mobile/src/train/active-workout-view-models.js apps/mobile/src/screens/active-workout-view.js tests/mobile-active-workout-view.test.js
git commit -m "feat: add live session header to active workout view"
```

---

## Task 7: Render the session exercises and sets on the new surface

**Objective:** Show the active workout exercise list using real session rows, not planned preview rows.

**Files:**
- Modify: `apps/mobile/src/train/active-workout-view-models.js`
- Modify: `apps/mobile/src/screens/active-workout-view.js`
- Test: `tests/mobile-active-workout-view.test.js`

**Step 1: Write failing test**

Assert the new view renders:
- exercise title rows
- set columns
- actual values
- completion affordance per set
- rest chips

**Step 2: Run red**

```bash
node --test tests/mobile-active-workout-view.test.js
```

**Step 3: Implement**

Map from `session.exercises` and `session.exercises[].sets`.

Important rule:
- active workout surface reads from **session rows**, not `workoutEditViewModel`, not `workoutSheetModel`

**Step 4: Run green**

```bash
node --test tests/mobile-active-workout-view.test.js
```

**Step 5: Commit**

```bash
git add apps/mobile/src/train/active-workout-view-models.js apps/mobile/src/screens/active-workout-view.js tests/mobile-active-workout-view.test.js
git commit -m "feat: render active workout exercise list from session state"
```

---

## Task 8: Wire set completion and quick actual controls into the new active surface

**Objective:** Make the active workout view actually operate on the real session.

**Files:**
- Modify: `apps/mobile/src/screens/active-workout-view.js`
- Modify: `apps/mobile/App.js`
- Test: `tests/mobile-active-workout-view.test.js`
- Test: `tests/mobile-session-runtime.test.js`

**Step 1: Write failing tests**

Need assertions that:
- `ActiveWorkoutView` receives `onCompleteSet`
- `ActiveWorkoutView` receives quick actual update handlers
- controls route through existing app seam functions

**Step 2: Run red**

```bash
node --test tests/mobile-active-workout-view.test.js tests/mobile-session-runtime.test.js
```

**Step 3: Implement with existing handlers**

Reuse these existing handlers from `App.js`:
- `handleCompleteSet`
- `handleQuickActualUpdate`
- `handleAdjustRestTimer`
- `handleDismissRestTimer`
- `handleFinishWorkout`
- `handleDiscardWorkout`

Do **not** duplicate session mutation logic in the screen component.

**Step 4: Run green**

```bash
node --test tests/mobile-active-workout-view.test.js tests/mobile-session-runtime.test.js
```

**Step 5: Commit**

```bash
git add apps/mobile/src/screens/active-workout-view.js apps/mobile/App.js tests/mobile-active-workout-view.test.js tests/mobile-session-runtime.test.js
git commit -m "feat: wire active workout controls to session handlers"
```

---

## Task 9: Add finish and discard flows on the dedicated surface

**Objective:** Preserve the current session engine behavior while presenting it in the new recorded UX.

**Files:**
- Modify: `apps/mobile/src/screens/active-workout-view.js`
- Modify: `apps/mobile/App.js`
- Test: `tests/mobile-active-workout-view.test.js`

**Step 1: Write failing test**

Assert:
- Finish CTA exists and routes to `handleFinishWorkout`
- discard action exists and routes to `handleDiscardWorkout`
- completed or discarded sessions close or swap state appropriately

**Step 2: Run red**

```bash
node --test tests/mobile-active-workout-view.test.js
```

**Step 3: Implement minimal behavior**

Recommended first pass:
- `Finish` uses current `handleFinishWorkout`
- discard action uses current `handleDiscardWorkout`
- once finished/discarded, keep the surface open for summary or close it depending on the current shell UX decision

Simplest safe first behavior:
- finish -> persist session, keep active surface visible but in completed state
- discard -> persist session, close active view and return to train home or workout sheet

**Step 4: Run green**

```bash
node --test tests/mobile-active-workout-view.test.js
```

**Step 5: Commit**

```bash
git add apps/mobile/src/screens/active-workout-view.js apps/mobile/App.js tests/mobile-active-workout-view.test.js
git commit -m "feat: add finish and discard actions to active workout view"
```

---

## Task 10: Verification pass against the recording

**Objective:** Verify the active session flow matches the recording at a product level.

**Files:**
- No required code file
- Optional notes update in this plan file

**Step 1: Run focused tests**

```bash
node --test tests/mobile-workout-sheet.test.js \
  tests/mobile-app-shell.test.js \
  tests/mobile-active-workout-view.test.js \
  tests/mobile-active-workout-view-models.test.js \
  tests/mobile-session-runtime.test.js
```

**Step 2: Run broader related suite**

```bash
node --test tests/program-supabase-rest.test.js \
  tests/mobile-theme-surface-pass.test.js
```

**Step 3: Device verification checklist**

In Expo Go:
1. open a workout preview sheet
2. tap `Start Workout`
3. confirm it opens active workout view immediately
4. confirm timer starts
5. confirm progress shows `0/x Sets`
6. complete one set
7. confirm progress increments and row state updates
8. confirm rest timer appears/updates
9. confirm finish action works

**Step 4: Commit**

```bash
git add docs/plans/2026-04-29-start-workout-active-session-plan.md
git commit -m "docs: add active workout start flow plan"
```

---

# Implementation notes for whoever executes this

## Reuse, don’t rebuild
The repo already has a lot of session logic. The main risk is accidentally building a second runtime in the new active workout screen.

The new screen should be a **presentation layer over the existing session engine**.

## Preserve product boundaries
- planned workout preview stays planned
- active workout stays session-based
- copied planned rows are still not execution rows
- actual values must keep flowing through the session engine only

## Keep the first milestone tight
The first useful milestone is:
- `Start Workout` creates/resumes session
- active workout surface opens
- timer/progress render correctly
- set completion works

You do **not** need to fully match every floating control from the video on the first pass.

## Strong default shell decision
Use a dedicated modal/surface first, not a full tab reroute.
That matches the recording better and disturbs less of the app shell.

---

# Recommended execution order summary

1. Add failing tests for the new Start Workout seam
2. Create `ActiveWorkoutView`
3. Create `active-workout-view-models.js`
4. Wire app-shell open/close state
5. Replace `onStartWorkout` with `handleStartWorkoutFromSheet`
6. Render session header/progress/timer
7. Render session exercise list
8. Wire completion and quick actual controls
9. Wire finish/discard
10. Verify on device against the recording

---

# Ready-to-execute next step

The clean next move is to implement **Task 1 through Task 4** first, which gets the new active workout surface present in the shell without overcommitting to full execution behavior.
