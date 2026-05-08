# PPLUS current surface role map

## Product rule used for this map
- **Coach is the main operator**
  - enters metrics
  - manages most flows
  - uses most operational screens
- **Athlete is mostly a viewer**
  - mainly sees their own progress metrics
  - should not get the full coach-side editing and management shell

This map classifies the current mobile surfaces based on that rule, not on the earlier athlete-first assumption.

---

## 1. Coach-first surfaces

These are the screens that should be treated as coach-side by default.

### Auth
- `apps/mobile/src/screens/auth-view.js`
- Why coach-first:
  - the coach is the main operator
  - coach signup/signin is the main operational entry path
  - athlete auth can exist, but should not drive the core app IA

### Coach Home placeholder
- currently routed from `authenticated_coach` + `activeTab === 'train'`
- file anchor: `apps/mobile/App.js`
- Current label: `Coach Home`
- Why coach-first:
  - this is now the main coach landing slot
  - should eventually become dashboard / today priorities / athlete follow-up

### Programs
- `apps/mobile/src/screens/program-sheet.js`
- current coach placeholder tab label in `App.js`: `Programs`
- Why coach-first:
  - programming is a coach action
  - assigning plans and editing structure belongs to coach workflow

### Workout planning / workout editing
- `apps/mobile/src/screens/workout-sheet.js`
- `apps/mobile/src/screens/workout-edit-view.js`
- Why coach-first:
  - these are management / authoring surfaces
  - they fit coach workflow far more than athlete workflow
  - athlete should not be the one editing most workout structure if coach enters the metrics and manages the flow

### Training calendar management
- `apps/mobile/src/screens/training-calendar-sheet.js`
- Why coach-first:
  - scheduling, loading older weeks, and reviewing plan distribution fit coach behavior

### Exercise detail in its current form
- `apps/mobile/src/screens/exercise-detail-view.js`
- Why coach-first or coach-leaning shared:
  - contains richer history/progression context
  - useful for coach review and adjustment
  - could later expose a reduced athlete version, but current shape is closer to coach review

### Athletes roster placeholder
- currently routed from `authenticated_coach` + `activeTab === 'progress'`
- file anchor: `apps/mobile/App.js`
- Current label: `Athletes`
- Why coach-first:
  - this should become roster / athlete drilldown / metric-entry starting point
  - this is a better home for coach-side progress workflows than the old athlete analytics assumption

### Inbox
- currently routed from `authenticated_coach` + utility tab
- file anchor: `apps/mobile/App.js`
- Why coach-first:
  - communication and follow-up are coach operator flows

### Profile menu in its current breadth
- `apps/mobile/src/screens/profile-view.js`
- Why coach-first or needs split:
  - current menu includes training/admin-style options like Exercises and Programs
  - this is too broad for an athlete-only view if athletes are mostly limited to progress visibility

---

## 2. Athlete-first surfaces

These are the screens that currently make sense for the athlete to see directly.

### Athlete progress visibility
- current analytics / progress area
- `apps/mobile/src/screens/analytics-view.js`
- related model path: `apps/mobile/src/progress/index.js`
- Why athlete-first:
  - Anthony explicitly clarified that the athlete mainly sees their own progress metrics
  - this should likely become the core athlete surface, but probably simplified to athlete-safe read-only views

### Limited athlete profile
- subset of `apps/mobile/src/screens/profile-view.js`
- Why athlete-first:
  - athlete likely still needs some personal info visibility / maybe lightweight edits
  - but not the full current operational menu

---

## 3. Shared infrastructure, role-dependent presentation

These are not inherently coach or athlete, but the presentation or allowed actions should branch by role.

### App shell + routing
- `apps/mobile/App.js`
- `apps/mobile/src/screens/app-render-models.js`
- `apps/mobile/src/screens/shell-renderers.js`
- Why shared:
  - shell exists for both roles
  - but destination screens and permissions should branch sharply

### Bootstrap
- `apps/mobile/src/auth/bootstrap.js`
- Why shared:
  - resolves identity and routes correctly
  - should now be treated as coach-main / athlete-limited

### Session engine and train data plumbing
- `apps/mobile/src/train/session-runtime.js`
- `packages/data/src/identity/index.js`
- Why shared:
  - these power core data access
  - but role permissions and entry points should differ

### Train surface models
- `apps/mobile/src/train/*`
- Why shared but currently misclassified historically:
  - many of these were built under an athlete-first assumption
  - a chunk of them probably belong to coach workflow instead

---

## 4. What is probably wrong right now

### Wrong assumption that drove earlier work
The app has been leaning too much toward:
- athlete as main in-app operator
- coach as alternate branch

But the clarified product model is:
- coach = main operator
- athlete = restricted viewer, mainly own metrics

### Concretely likely wrong
1. `Train` as the rich day-to-day main app for athlete
2. broad athlete access to editing-oriented workout/program surfaces
3. broad athlete profile menu with exercises/programs/admin-ish options
4. progress logic framed too much as athlete operating the system instead of athlete consuming coach-entered data

---

## 5. Recommended reframe from here

### Coach shell should own
- Coach Home
- Athletes
- Programs
- Inbox
- workout editing / calendar / assignment flows
- metric entry flows

### Athlete shell should likely shrink to
- Progress
- maybe limited profile
- maybe limited session visibility only if product truly needs it

### Do not assume
- athlete gets the same tab system
- athlete gets the same profile menu breadth
- athlete edits the same objects as coach

---

## 6. Recommended implementation order

1. **Lock the product rule into tests and routing language**
   - coach is primary operator
   - athlete is restricted viewer

2. **Refactor athlete shell downward**
   - reduce athlete-visible surfaces to progress-first
   - remove broad management surfaces from athlete path

3. **Treat current coach placeholder tabs as real coach IA anchors**
   - Coach Home
   - Athletes
   - Programs
   - Inbox

4. **Convert existing operational surfaces into coach-owned screens**
   - workout sheet
   - workout edit
   - calendar
   - richer profile/admin menus

5. **Only then define what athlete can still do beyond seeing metrics**

---

## Bottom line
The key correction is simple:

**Most of the current rich operational UI should be considered coach-side, not athlete-side.**

The athlete app should likely be much smaller than the coach app.
