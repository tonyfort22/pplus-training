# PPLUS Workout Settings Structure Plan

> **For Hermes:** Use this as the product and data-model reference before building the Workout Settings surface.

**Goal:** Define the right data structure for SPOTR-style workout settings in PPLUS before more active-workout features harden around the wrong assumptions.

**Architecture:** Treat workout settings as a layered override system, with the **active workout session** as the main operational owner in the mobile app. Some settings may be seeded from user defaults or workout-template defaults, but the active workout should resolve to a concrete effective settings object that can diverge for that specific session.

**Tech Stack:** Expo mobile app, shared JS domain layer in `packages/core`, data adapters in `packages/data`, Supabase-backed session persistence, repo docs under `docs/`.

---

## Recommendation

**Yes, we should do this now.**

Not necessarily the full polished UI first, but definitely the **data model and state boundaries**.

Why:
- the SPOTR settings are not cosmetic
- they affect active session behavior
- they touch timers, post-set UX, and progression logic
- if we delay the structure, we will likely retrofit session objects and active-workout logic later

---

## What the SPOTR recording implies

The `workout_settings_spotr.MP4` surface shows four settings:

1. **Default Rest Time**
2. **Auto-Progress**
3. **Keep Awake**
4. **Adjust Effort After Set**

These are presented inside an active workout context, so the most important interpretation is:

> These behave primarily like **session-level workout settings**, even if some of them may also come from user defaults or workout-template defaults.

That distinction matters.

---

## Current repo reality

### Already present
- `packages/core/src/index.js`
  - session creation
  - set completion
  - rest timer state
  - prescribed vs actual separation
- `apps/mobile/src/screens/active-workout-view.js`
  - active workout UI
  - local floating timer / stopwatch UI state
- `apps/mobile/src/train/active-workout-view-models.js`
  - derives active workout display state from `session`
- `docs/schema-v1.md`
  - strong planning vs execution separation
- `docs/architecture-v1.md`
  - `WorkoutSession` is already a first-class execution entity

### Not yet present
There is **no real workout settings object** yet.

Right now the nearest related fields are:
- `exercise.defaultRestSeconds`
- `set.prescribedRestSeconds`
- timer-specific ephemeral UI state like `activeRestTimer`

There is nothing yet for:
- `autoProgressEnabled`
- `keepAwake`
- `adjustEffortAfterSet`
- session-level overrideable workout defaults

---

## Proposed settings hierarchy

We should use a layered precedence model:

```text
session override
> planned workout default
> user default
> system default
```

This means the app always resolves one effective settings object for the current session, but we only persist overrides where needed.

---

## Proposed settings ownership

## 1. User defaults
These should live at the athlete profile / user-settings layer.

Examples:
- preferred default rest time
- keep awake preference
- adjust effort after set preference
- auto-progress preference

These are reusable across all workouts.

## 2. Planned workout defaults
These belong to the planned workout layer and should seed a session when relevant.

Examples:
- workout default rest time
- auto-progress default for this workout
- adjust effort after set default for this workout

This is useful when a coach wants a workout to behave differently from the user’s general preference.

## 3. Session-level resolved settings
This is the critical layer for the mobile app.

These are the concrete settings used during the in-progress workout session.

Examples:
- rest time changed to `3:00` for this specific workout today
- keep awake turned on only for this session
- auto-progress turned off during this session
- adjust effort after set turned on or off while lifting

This should be the main source of truth for active-workout behavior.

---

## Proposed data model

## A. User-level defaults

We can either:
- extend athlete profile preferences directly, or
- create a dedicated `user_settings` / `athlete_settings` table

### Recommended shape

```ts
AthleteWorkoutSettingsDefaults {
  athleteId: string
  defaultRestSeconds: number | null
  autoProgressEnabled: boolean | null
  keepAwakeDuringWorkout: boolean | null
  adjustEffortAfterSet: boolean | null
}
```

### Recommendation
Use a dedicated table or settings object rather than bloating `athlete_profiles` forever.

---

## B. Planned workout defaults

These belong on the planned workout layer.

### Minimal recommended fields on `program_workouts`
- `default_rest_seconds nullable`
- `auto_progress_enabled nullable`
- `adjust_effort_after_set nullable`

### Why not `keepAwake` here?
Because `keepAwake` is a device/runtime concern, not really a programming concern.
It can still be overridden at session level.

If we want cleaner grouping later, we can also collapse these into a JSON settings blob, but for v1 I think explicit columns are cleaner and easier to query.

---

## C. Workout session settings

This is the important new structure.

### Recommended minimal shape on `workout_sessions`
- `default_rest_seconds nullable`
- `auto_progress_enabled nullable`
- `keep_awake nullable`
- `adjust_effort_after_set nullable`

### Interpretation
These are **resolved session settings**, not just arbitrary metadata.

When a session starts:
- seed them from program-workout defaults if present
- otherwise fall back to athlete defaults
- otherwise fall back to system defaults

After that, the session can diverge independently.

---

## Recommended domain shape in JS

For the active app/runtime layer, the cleanest shape is:

```ts
WorkoutSessionSettings = {
  defaultRestSeconds: number | null,
  autoProgressEnabled: boolean,
  keepAwake: boolean,
  adjustEffortAfterSet: boolean,
}
```

And on the session object:

```ts
WorkoutSession = {
  ...,
  settings: WorkoutSessionSettings,
}
```

Even if the SQL stores explicit columns, the domain/UI layer should group them as `session.settings`.

That keeps the app logic readable.

---

## What each setting should control

## 1. Default Rest Time
Controls:
- fallback timer value when opening the timer sheet in idle state
- default rest timer when a set finishes, unless a set/exercise-specific rest overrides it
- potentially newly added sets in the live session

Important:
- set-level prescribed rest still matters
- exercise-level default rest still matters
- workout/session default rest is a higher-level fallback, not a replacement for all lower-level fields

### Proposed precedence for rest at set completion

```text
session set actualRestSeconds
> session set prescribedRestSeconds
> session exercise defaultRestSeconds
> session.settings.defaultRestSeconds
> system default 0
```

---

## 2. Auto-Progress
Controls:
- whether the app pre-fills incremented target values for future sets/workouts
- whether the active workout should use progression suggestions or plain prescribed values

Important:
- do not implement a fake progression engine just to satisfy the setting
- first store the setting and define the seam
- actual progression logic can come in the next pass

---

## 3. Keep Awake
Controls:
- active mobile runtime behavior only
- screen sleep suppression during the current workout

Important:
- this is client/runtime behavior
- it should still live in session settings because it is a workout-experience toggle
- but it does not need to distort server-side planning entities

---

## 4. Adjust Effort After Set
Controls:
- whether the app prompts the athlete to adjust/set effort after completing a set
- whether post-completion flow should auto-open an effort selector sheet/surface

This one is especially important because it will influence the next layer of active-workout UX.

---

## Recommended implementation phases

## Phase 1: Structure now
Do this first.

### Objective
Create the right settings model and resolution rules without overbuilding the UI.

### Files likely involved
- `packages/core/src/index.js`
- `packages/data/src/sessions/index.js`
- `apps/mobile/src/train/session-runtime.js`
- `apps/mobile/src/train/active-workout-view-models.js`
- `docs/schema-v1.md`
- `infra/supabase/schema-v1.sql`
- `infra/supabase/migrations/0001_initial_schema.sql`

### Deliverables
1. Add session-level settings shape to the domain model
2. Define settings resolution precedence
3. Seed session settings at `createWorkoutSession(...)`
4. Keep current UI behavior working with default fallbacks

---

## Phase 2: Basic Workout Settings sheet in PPLUS
After the structure exists.

### Objective
Expose the actual workout settings UI inside the active workout session.

### MVP scope
- Default Rest Time
- Keep Awake
- Adjust Effort After Set
- optional placeholder storage for Auto-Progress if engine is not ready yet

### Note
This UI can ship before full auto-progression logic exists, as long as we are honest in the behavior.

---

## Phase 3: Progression and post-set workflow
Once the settings are real.

### Objective
Make `autoProgressEnabled` and `adjustEffortAfterSet` drive real behavior.

This is where we connect the settings to:
- future set prefills
- progression suggestions
- post-set effort modal flow

---

## Schema recommendation for v1

## Minimal SQL-forward recommendation

### On `program_workouts`
Add nullable defaults:
- `default_rest_seconds`
- `auto_progress_enabled`
- `adjust_effort_after_set`

### On `workout_sessions`
Add resolved session values:
- `default_rest_seconds`
- `auto_progress_enabled`
- `keep_awake`
- `adjust_effort_after_set`

### Optional later
If settings expand a lot, we can move to:
- `workout_session_settings` table, or
- structured JSON settings blob

But I do **not** think we need that complexity yet.

---

## Why this should influence future build now

Because several upcoming features depend on the same boundary:
- idle timer defaults
- set completion behavior
- post-set effort flow
- progression logic
- runtime keep-awake behavior

If we don’t settle the ownership model now, we’ll end up scattering these across:
- exercise defaults
- user preferences
- active screen local state
- ad hoc session flags

That will get messy fast.

---

## Recommendation summary

### My opinion
We should do this now in the following order:

1. **Lock the data model and settings precedence**
2. **Add session-level settings to the domain/session structure**
3. **Then build the Workout Settings surface on top of that**

### Short version
- yes, this is the right next move
- yes, it affects structure enough to do early
- no, we should not wait until more active-workout features pile up

---

## Exact next build recommendation

If we continue right after this spec, the next task should be:

### `Workout Settings foundation`
Implement the settings structure without full SPOTR-polish yet.

#### First fields to support for real
- `defaultRestSeconds`
- `keepAwake`
- `adjustEffortAfterSet`

#### Field to scaffold but maybe not fully activate yet
- `autoProgressEnabled`

That gives us the right foundation without pretending the progression engine is done.

---

## Relevant current repo seams

- `packages/core/src/index.js`
  - session creation currently seeds rest-related values only at exercise/set level
  - this is where session settings should be attached
- `apps/mobile/src/screens/active-workout-view.js`
  - current timer and stopwatch behavior will eventually read from `session.settings.defaultRestSeconds`
- `apps/mobile/src/train/active-workout-view-models.js`
  - currently derives `defaultRestTimerLabel` from first exercise rest
  - that should eventually resolve from session settings first
- `docs/schema-v1.md`
  - should be updated to explicitly mention workout/session settings ownership

---

## Suggested follow-up task

After reviewing this spec, the next concrete implementation step should be:

**Add session-level workout settings to the domain/session model and seed them at session creation.**

That is the clean foundation before we build the full Workout Settings UI.
