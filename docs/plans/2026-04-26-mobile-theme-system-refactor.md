# Mobile Theme System Refactor Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace patchy hardcoded mobile styling with a real theme/token system and shared UI primitives that screens compose consistently.

**Architecture:** Keep `getAppTheme()` as the source of truth for semantic color tokens, then add a lightweight primitive layer in `apps/mobile/src/ui/` for cards, buttons, rows, segmented controls, and sheet headers. Migrate shared renderers and high-traffic screens onto those primitives before cleaning lower-priority screens.

**Tech Stack:** Expo, React Native, NativeWind, StyleSheet, lucide-react-native, node:test

---

## Phase 1: Foundation audit and token contract

### Task 1: Lock the current theme contract in tests
**Objective:** Prove the semantic theme tokens that the primitive layer will rely on.

**Files:**
- Modify: `tests/mobile-theme-surface-pass.test.js`
- Read: `apps/mobile/src/theme/app-theme.js`

**Steps:**
1. Add source assertions for core tokens in `getAppTheme()`:
   - `background`
   - `backgroundMuted`
   - `surface`
   - `surfaceMuted`
   - `border`
   - `borderStrong`
   - `text`
   - `textMuted`
   - `textSoft`
   - `accent`
   - `accentSurface`
   - `accentBorder`
   - `accentText`
   - `dangerSurface`
   - `dangerBorder`
   - `dangerText`
   - `overlay`
   - `icon`
   - `iconMuted`
   - `cardShadow`
2. Run the focused theme test and confirm it passes.
3. Commit.

### Task 2: Inventory primitive candidates
**Objective:** Identify the repeated visual patterns that must become primitives.

**Files:**
- Read: `apps/mobile/src/ui/cards.js`
- Read: `apps/mobile/src/screens/styles.js`
- Read: `apps/mobile/src/screens/profile-view.js`
- Read: `apps/mobile/src/screens/program-sheet.js`
- Read: `apps/mobile/src/screens/exercise-detail-view.js`

**Patterns to capture:**
- surface cards
- primary/destructive buttons
- sheet header back/action rows
- segmented controls
- search/input rows
- info/list rows
- status badges

---

## Phase 2: Shared primitive layer

### Task 3: Create shared primitive file
**Objective:** Add a reusable primitive layer under `apps/mobile/src/ui/`.

**Files:**
- Create: `apps/mobile/src/ui/primitives.js`
- Modify: `tests/mobile-theme-surface-pass.test.js`

**Primitive exports to add:**
- `AppSurfaceCard`
- `AppButton`
- `AppSheetHeader`
- `AppSegmentedControl`
- `AppListRow`
- `AppSearchInput`
- `AppStatusBadge`

**Rules:**
- All primitives accept `theme`
- No hardcoded raw hex in primitive render logic except intentionally fixed status colors when required
- Use semantic token mapping for all text/background/border/icon states

### Task 4: Refactor `cards.js` onto primitives
**Objective:** Make `cards.js` compose primitives instead of hardcoded Tailwind color classes.

**Files:**
- Modify: `apps/mobile/src/ui/cards.js`
- Modify: `tests/mobile-theme-surface-pass.test.js`

**Expected outcome:**
- `SurfaceCard` and `MetricCard` consume primitive wrappers and `styles.theme`
- remove remaining `bg-slate-*`, `text-white`, `text-slate-*`, `bg-emerald-*` classes from `cards.js`

---

## Phase 3: Shared renderer migration

### Task 5: Migrate shared renderers to primitives
**Objective:** Move `renderers.js` from ad hoc styling to primitive composition and theme semantics.

**Files:**
- Modify: `apps/mobile/src/screens/renderers.js`
- Modify: `tests/mobile-theme-surface-pass.test.js`

**Expected outcome:**
- generic section rows use `AppListRow` or `AppSurfaceCard`
- session header/rest surfaces use `AppButton` and semantic text styles
- calendar strip uses theme-driven styles, not utility color classes

### Task 6: Tighten `styles.js`
**Objective:** Shrink `styles.js` into layout/style tokens, not raw color storage.

**Files:**
- Modify: `apps/mobile/src/screens/styles.js`
- Modify: `tests/mobile-theme-surface-pass.test.js`

**Expected outcome:**
- replace remaining raw color literals where possible with theme tokens
- keep only unavoidable fixed status colors if truly semantic
- keep `return { ...styles, theme }`

---

## Phase 4: High-traffic screen migration

### Task 7: Refactor profile stack onto primitives
**Objective:** Reduce `profile-view.js` as the biggest styling debt hotspot.

**Files:**
- Modify: `apps/mobile/src/screens/profile-view.js`
- Modify: `tests/mobile-profile-view.test.js`

**Expected outcome:**
- sheet headers use `AppSheetHeader`
- segmented controls use `AppSegmentedControl`
- row cards/list rows use `AppListRow` / `AppSurfaceCard`
- sign-out and save buttons use `AppButton`

### Task 8: Refactor analytics and coach sheets onto primitives
**Objective:** Normalize the non-profile modal surfaces.

**Files:**
- Modify: `apps/mobile/src/screens/analytics-view.js`
- Modify: `apps/mobile/src/screens/coach-athletes-sheet.js`
- Modify: `apps/mobile/src/screens/coach-athlete-workspace-sheet.js`
- Modify: `tests/mobile-analytics-view.test.js`

### Task 9: Refactor workout/program/exercise sheets onto primitives
**Objective:** Unify the remaining major detail surfaces.

**Files:**
- Modify: `apps/mobile/src/screens/program-sheet.js`
- Modify: `apps/mobile/src/screens/exercise-detail-view.js`
- Modify: `apps/mobile/src/screens/workout-sheet.js`
- Modify: `apps/mobile/src/screens/workout-edit-view.js`

---

## Phase 5: Verification

### Task 10: Run regression and audit leftovers
**Objective:** Prove the architecture works and list remaining hardcoded styling debt.

**Files:**
- Run tests only

**Commands:**
```bash
pnpm test -- tests/mobile-app-shell.test.js tests/mobile-analytics-view.test.js tests/mobile-profile-view.test.js tests/mobile-exercise-detail-view.test.js tests/mobile-theme-surface-pass.test.js
```

Then run a search for remaining literals:
```bash
# conceptual check
search remaining raw color literals in apps/mobile/src/
```

**Success criteria:**
- tests pass
- primary screens use primitives
- remaining hardcoded styling is lower-priority and intentionally isolated
