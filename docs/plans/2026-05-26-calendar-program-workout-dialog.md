# Calendar Program Workout Dialog Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Reuse the workout library edit dialog for calendar-side scheduled workouts by loading and editing real `program_workout` trees, and add a new calendar `Add Workout` template-picker flow that creates a new `program_workout` from a selected `workout_template`.

**Architecture:** Extract the current workout dialog shell out of `workouts-data-table.jsx` into a shared dialog component that accepts a normalized data shape plus mode-specific persistence handlers. Add a `program_workout` repository/API layer that can fetch one scheduled workout tree, update it, and create a new scheduled workout by cloning a chosen template into `program_workouts`, `program_workout_exercises`, and `program_workout_sets`.

**Tech Stack:** Next.js app router, local admin components, existing `WorkoutTrainingBuilder`, Supabase REST via server routes, source-level node tests.

---

## What already exists

### Existing UI seams
- Workout library dialog currently lives in:
  - `apps/web/components/admin/workouts-data-table.jsx`
- Training tab builder already exists in:
  - `apps/web/components/admin/workout-training-builder.jsx`
- Calendar surface currently lives in:
  - `apps/web/components/admin/workouts-calendar-view.jsx`

### Existing data seams
- Schema already defines:
  - `program_workouts`
  - `program_workout_exercises`
  - `program_workout_sets`
- Existing copy/clone logic already exists in:
  - `infra/supabase/functions/complete-athlete-invitation/runtime.js`

### Important schema findings
From `infra/supabase/schema-v1.sql`:
- `program_workouts` has:
  - `id`
  - `athlete_id`
  - `coach_id`
  - `program_id`
  - `program_day_id`
  - `workout_template_id`
  - `name_snapshot`
  - `notes`
  - `bg_color`
  - `text_color`
  - `status`
  - `sort_order`
  - `scheduled_date`
  - `scheduled_start_time`
  - `scheduled_end_time`
- `program_workout_exercises` has:
  - `id`
  - `program_workout_id`
  - `exercise_id`
  - `name_snapshot`
  - `sort_order`
  - `notes`
  - `default_rest_seconds`
- `program_workout_sets` has:
  - `id`
  - `program_workout_exercise_id`
  - `sort_order`
  - `set_type`
  - `target_reps`
  - `target_load`
  - `target_load_unit`
  - `target_duration_seconds`
  - `target_distance`
  - `target_distance_unit`
  - `target_rpe`
  - `target_rir`
  - `target_rest_seconds`
  - `notes`

### Important reality check
The current workout library dialog is still mostly seeded/local UI. That is fine for shell reuse, but the calendar-side version must be honest about which fields are truly persisted in `program_workout` mode.

---

# Delivery shape

## Flow A: click existing calendar card
1. User clicks a scheduled card in `/admin/workouts/calendar`
2. App loads the selected `program_workout` tree
3. Shared dialog opens in **edit scheduled workout** mode
4. **Details** tab is prefilled from `program_workout`
5. **Training** tab is prefilled from `program_workout_exercises` and `program_workout_sets`
6. Save updates the scheduled workout tables, not the template

## Flow B: click `Add Workout` in calendar
1. User clicks `Add Workout`
2. App opens a new **template picker dialog**
3. User selects a `workout_template`
4. User fills required scheduling fields in the picker before create:
   - first row:
     - `Start date`
     - `Start time`
   - second row:
     - `End date`
     - `End time`
5. App creates:
   - one `program_workout`
   - its `program_workout_exercises`
   - its `program_workout_sets`
6. App closes picker and opens shared scheduled-workout dialog on the new `program_workout`

---

# Implementation tasks

## Task 1: Extract the shared workout dialog shell

**Objective:** Move the modal shell currently embedded in `workouts-data-table.jsx` into a reusable component.

**Files:**
- Create: `apps/web/components/admin/workout-editor-dialog.jsx`
- Modify: `apps/web/components/admin/workouts-data-table.jsx`
- Test: `tests/web-admin-ui-reference.test.js`

**Component contract v1:**
```jsx
export default function WorkoutEditorDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  detailsValues,
  onDetailsChange,
  trainingSections,
  onTrainingSectionsChange,
  showTrainingTab = true,
  primaryActionLabel,
  onPrimaryAction,
  onDelete = null,
})
```

**Notes:**
- keep the existing visual shell and tabs
- keep page-scrollable behavior
- keep existing Details/Training tab look
- keep the builder mounted through `WorkoutTrainingBuilder`
- move only the shell first, not the new calendar behavior yet

**Red seams to add:**
- `workouts-data-table.jsx` imports `WorkoutEditorDialog`
- shared dialog file exists
- old embedded dialog shell no longer owns the full layout inline

---

## Task 2: Make the training builder controlled instead of local-only

**Objective:** Let the shared dialog inject and read real `program_workout` training data.

**Files:**
- Modify: `apps/web/components/admin/workout-training-builder.jsx`
- Test: `tests/web-admin-ui-reference.test.js`

**Required change:**
The builder must stop being initial-state-only and support controlled updates.

**Target API:**
```jsx
export default function WorkoutTrainingBuilder({
  sections,
  onSectionsChange,
  readOnly = false,
})
```

**Keep exported helpers:**
- `createInitialTrainingSections()`
- add new helpers for mapping

**Why:**
The calendar dialog will receive real DB rows and must be able to:
- render them
- edit them
- pass edits back up for save

---

## Task 3: Add mappers between DB rows and builder/dialog state

**Objective:** Normalize `program_workout` data into the shared dialog shape.

**Files:**
- Create: `apps/web/components/admin/program-workout-dialog-mappers.js`
- Test: `tests/program-workout-dialog-mappers.test.js`

**Required functions:**
```js
export function mapProgramWorkoutToDetailsValues(programWorkoutTree) {}
export function mapProgramWorkoutToTrainingSections(programWorkoutTree) {}
export function mapTrainingSectionsToProgramWorkoutExercisePayloads(programWorkoutId, sections) {}
export function mapTrainingSectionsToProgramWorkoutSetPayloads(exerciseIdMap, sections) {}
```

**Expected mapping rules:**
- section labels should be rebuilt from grouped order, likely `A1`, `A2`, etc.
- exercise rows come from `program_workout_exercises`
- set rows come from `program_workout_sets`
- set fields should map honestly:
  - `reps` ← `target_reps`
  - `duration` ← `target_duration_seconds`
  - `distance` ← `target_distance`
  - `rest` ← `target_rest_seconds`
  - `effort` ← `target_rpe`
- unsupported fields like `Tempo` or `L/R` need an explicit rule

**Important honesty rule:**
If a visible builder field has no backing `program_workout_set` column, do not silently pretend it persists. Either:
- store it nowhere and label it as local-only for now, or
- trim it from `program_workout` mode if Anthony wants strict honesty

This is the biggest design checkpoint in the whole feature.

---

## Task 4: Add server repository for one `program_workout` tree

**Objective:** Read one scheduled workout with its exercises and sets.

**Files:**
- Create: `apps/web/lib/program-workout-repository.js`
- Create: `apps/web/app/api/admin/program-workouts/[programWorkoutId]/route.js`
- Test: `tests/program-workout-repository.test.js`

**Repository functions:**
```js
export function createProgramWorkoutRepository() {
  return {
    async getProgramWorkoutTree(programWorkoutId) {},
    async updateProgramWorkoutDetails(programWorkoutId, payload) {},
    async replaceProgramWorkoutChildren(programWorkoutId, payload) {},
    async createProgramWorkoutFromTemplate(payload) {},
  }
}
```

**GET shape should return:**
```js
{
  workout: {...program_workout},
  exercises: [...program_workout_exercises],
  sets: [...program_workout_sets],
}
```

**Implementation note:**
Read children separately and join in JS. It will be simpler and easier to debug than fighting one large nested REST select immediately.

---

## Task 5: Add update route for scheduled workout details + training tree

**Objective:** Persist edits from the shared dialog in calendar mode.

**Files:**
- Modify: `apps/web/app/api/admin/program-workouts/[programWorkoutId]/route.js`
- Modify: `apps/web/lib/program-workout-repository.js`
- Test: `tests/program-workout-repository.test.js`

**Suggested route behavior:**
- `GET /api/admin/program-workouts/[id]`
- `PATCH /api/admin/program-workouts/[id]`

**PATCH body shape:**
```js
{
  details: {
    name_snapshot,
    notes,
    status,
    scheduled_date,
    scheduled_start_time,
    scheduled_end_time,
  },
  trainingSections: [...]
}
```

**Write strategy:**
For v1, the simplest honest approach is:
1. update the parent `program_workout`
2. delete old `program_workout_sets` for this workout tree
3. delete old `program_workout_exercises` for this workout
4. recreate exercises in order
5. recreate sets in order

That is blunt but reliable for an admin modal save.

---

## Task 6: Add template-picker dialog for calendar `Add Workout`

**Objective:** Build the first modal shown from the calendar Add Workout button.

**Files:**
- Create: `apps/web/components/admin/calendar-add-workout-dialog.jsx`
- Modify: `apps/web/components/admin/workouts-calendar-view.jsx`
- Test: `tests/web-admin-ui-reference.test.js`

**Dialog behavior:**
- searchable list of available `workout_templates`
- display enough metadata to choose well:
  - name
  - duration
  - training type / focus area if available
- include required scheduling inputs before create:
  - first row container:
    - `Start date`
    - `Start time`
  - second row container:
    - `End date`
    - `End time`
- primary action button should be something like `Create workout`
- create stays disabled until:
  - template selected
  - start date filled
  - start time filled
  - end date filled
  - end time filled

**Data source:**
Add an API route for templates if one doesn’t already exist for this purpose.
Likely:
- `apps/web/app/api/admin/workout-templates/route.js`

---

## Task 7: Clone `workout_template` into a new `program_workout` tree

**Objective:** When the user confirms a template, create a real scheduled workout copy.

**Files:**
- Modify: `apps/web/lib/program-workout-repository.js`
- Modify: `apps/web/app/api/admin/program-workouts/route.js` or create one
- Reuse reference logic from: `infra/supabase/functions/complete-athlete-invitation/runtime.js`
- Test: `tests/program-workout-repository.test.js`

**Create payload should include:**
```js
{
  athleteId,
  coachId,
  programId,
  programDayId,
  templateId,
  scheduledDate,
  scheduledStartTime,
  scheduledEndDate,
  scheduledEndTime,
}
```

**Implementation rule:**
Use the invitation runtime’s copy path as the reference for:
- template-to-workout field copy
- exercise copy
- set copy

Also add one honest scheduling rule before create:
- combine `Start date` + `Start time` into the created `scheduled_date` and `scheduled_start_time`
- combine `End date` + `End time` into the created scheduling end state
- if the current schema only supports one `scheduled_date` plus `scheduled_end_time`, treat multi-day carryover as out of scope for v1 and validate end date must equal start date unless Anthony wants true cross-day workouts now

Do not invent the clone mapping from memory.

---

## Task 8: Wire existing calendar card click to shared dialog

**Objective:** Replace the current placeholder calendar event editor with the reused shared dialog.

**Files:**
- Modify: `apps/web/components/admin/workouts-calendar-view.jsx`
- Test: `tests/web-admin-ui-reference.test.js`

**Required local state:**
```js
const [isProgramWorkoutDialogOpen, setIsProgramWorkoutDialogOpen] = useState(false)
const [selectedProgramWorkoutId, setSelectedProgramWorkoutId] = useState(null)
const [selectedProgramWorkoutTree, setSelectedProgramWorkoutTree] = useState(null)
const [programWorkoutDialogLoadState, setProgramWorkoutDialogLoadState] = useState('idle')
const [programWorkoutDetailsValues, setProgramWorkoutDetailsValues] = useState(...)
const [programWorkoutTrainingSections, setProgramWorkoutTrainingSections] = useState([])
```

**On card click:**
1. set loading state
2. fetch `/api/admin/program-workouts/[id]`
3. map to shared dialog state
4. open dialog

---

## Task 9: Wire calendar `Add Workout` button to picker, then to shared dialog

**Objective:** Make top-right Add Workout create a new scheduled workout from a template.

**Files:**
- Modify: `apps/web/components/admin/workouts-calendar-view.jsx`
- Modify: `apps/web/components/admin/calendar-add-workout-dialog.jsx`
- Test: `tests/web-admin-ui-reference.test.js`

**Flow:**
1. click `Add Workout`
2. open template picker
3. select template
4. call create endpoint
5. refresh calendar data
6. fetch newly created program_workout tree
7. open shared dialog on it

**Important UX detail:**
The picker dialog and the shared editor dialog should be separate components.
Do not overload one modal to do both jobs.

---

## Task 10: Decide which details fields are real in `program_workout` mode

**Objective:** Prevent fake persistence claims.

**Files:**
- Modify: `apps/web/components/admin/workout-editor-dialog.jsx`
- Optionally document: `docs/plans/2026-05-26-calendar-program-workout-dialog.md`

**Field audit based on current known schema:**
Likely real on `program_workout` mode:
- name
- notes or description-like text
- status
- scheduled date/time
- maybe colors if live DB supports them

Likely not directly owned by `program_workout` mode in the current web path:
- thumbnail
- trainer
- equipment needed
- category
- difficulty
- focus area as a first-class scheduled-workout field

**Recommendation:**
For `program_workout` mode, first pass should either:
- hide template-only fields, or
- show them read-only if they come from the source template

I recommend **hide or read-only**, not fake editable.

This is the main product decision to confirm before implementation gets deep.

---

# Test plan

## New test files
- `tests/program-workout-dialog-mappers.test.js`
- `tests/program-workout-repository.test.js`
- optionally `tests/calendar-add-workout-dialog.test.js`

## Existing test files to extend
- `tests/web-admin-ui-reference.test.js`

## Source assertions to add
- shared dialog component exists and is imported in both places
- calendar view opens shared dialog on card click path
- calendar Add Workout opens template picker dialog
- template picker calls create-program-workout path
- `WorkoutTrainingBuilder` is used in program_workout mode with controlled sections
- repository has fetch/update/create methods for `program_workout`

---

# Verification workflow

## Commands
```bash
node --test tests/program-workout-dialog-mappers.test.js
node --test tests/program-workout-repository.test.js
node --test tests/web-admin-ui-reference.test.js
pnpm --dir apps/web build
```

## Live checks
1. Start preview on `3005`
2. Open calendar route with a real athlete
3. Click an existing card
4. Confirm shared dialog opens with populated details
5. Switch to Training tab
6. Confirm blocks, exercises, and sets render from real `program_workout` data
7. Edit one safe field and save
8. Reopen same card and verify persistence
9. Click `Add Workout`
10. Select a template
11. Confirm new card is created and editor opens on that new scheduled workout

---

# Risks / decision points

## 1. Details field parity vs schema honesty
The screenshots show more fields than `program_workout` obviously owns. We should confirm whether calendar mode should:
- hide unsupported fields
- show them read-only from template data
- or persist them elsewhere

## 2. Training builder structure mismatch
The current builder is section-centric and seeded. Real `program_workout` data is exercise/set centric. The mapper layer is what makes reuse possible.

## 3. Save strategy
Delete-and-recreate children is the simplest honest path first. If needed later, we can optimize into true row-diff updates.

---

# My recommendation on build order

1. Extract shared dialog shell
2. Make training builder controlled
3. Add program_workout repository + GET route
4. Wire existing card click to shared dialog
5. Add PATCH save for scheduled workout
6. Add template-picker dialog
7. Add create-from-template clone flow
8. Refine field visibility in program_workout mode

---

# Brief scope summary

This is a solid approach.

You are not asking for a new modal design. You are asking for:
- **one shared workout editor UI**
- **two backing models**
  - workout template mode
  - scheduled program_workout mode
- plus a **template-picker create flow** for the calendar

That makes sense and is the right long-term shape.