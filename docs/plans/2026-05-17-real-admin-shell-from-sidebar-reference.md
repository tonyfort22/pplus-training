# Real Admin Shell From Sidebar Reference Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the current `/admin/ui` design-system showcase behavior with a real admin application shell that matches the new reference direction: persistent dark sidebar on the left, large mostly-empty workspace on the right, and product-like proportions rather than a component gallery.

**Architecture:** Keep the shared UI kit under `apps/web/components/ui/`, but stop using `/admin/ui` as a showroom page. Treat it as a real app shell route built from `SidebarLayout`, `Sidebar`, and a quieter header/content scaffold. Sidebar remains the strongest designed artifact. The main area becomes a true route workspace with one honest first page instead of a wall of component demos.

**Tech Stack:** Next.js App Router, React 19, shared `components/ui/*`, Tailwind utility classes plus token-driven CSS in `apps/web/app/globals.css`, lucide-react icons, node:test source-level regressions.

---

## Current truth before implementation

### What exists now
- `apps/web/components/ui/sidebar.jsx`
  - already much closer to the image direction
  - supports grouped sections, bottom sections, search, brand mark, nested child links
- `apps/web/components/ui/sidebar-layout.jsx`
  - two-region app shell wrapper with sidebar + navbar + content
- `apps/web/components/ui/navbar.jsx`
  - current topbar shell
- `apps/web/app/admin/ui/page.jsx`
  - **still a showcase page** with Foundations / Primitives / Structure / Layouts sections
  - now uses the improved sidebar, but the right side is still a component gallery
- `apps/web/app/globals.css`
  - contains the new dark nested sidebar styling
  - still also contains lots of showcase styling used by the current `/admin/ui` page
- tests:
  - `tests/web-admin-ui-reference.test.js`
  - `tests/web-ui-structural.test.js`

### What the new reference changes
The attached reference image is not asking for a component gallery. It is asking for:
- a **real admin shell**
- a **narrow persistent sidebar**
- a **large dark workspace canvas**
- **minimal visible content in the main panel**
- a layout that feels like a real app frame, not a documentation page

### Main implementation decision
Use `/admin/ui` as the first **real shell route**, not the source-of-truth showcase anymore.

If we still want a design-system reference route later, move that responsibility elsewhere, for example:
- `/admin/ui-kit`
- `/admin/system`
- or a separate internal docs route

This plan assumes:
- `/admin/ui` becomes the real shell page
- the current showcase content is removed from that route

---

## Target page shape

### Left side
Persistent sidebar with:
- `P+ TRAINING` brand lockup
- search field inside sidebar
- grouped nav:
  - Dashboard
  - Athletes
  - Programs
  - Workouts
  - Exercises
  - Analytics
- divider
- Settings group

### Right side
Large quiet workspace panel with:
- no component showroom sections
- no big card wall
- no docs-page headings like Foundations / Primitives / Structure / Layouts
- one honest first-shell state, either:
  1. a near-empty workspace, or
  2. a very restrained first admin page like `Dashboard / Overview`

### Recommendation for first content state
Use a **minimal dashboard workspace** instead of a truly blank void.

That means:
- a small page heading area
- maybe 1 subtitle line
- maybe a single subdued placeholder panel or empty workspace block
- lots of empty negative space preserved

This keeps it feeling real without falling back into showcase mode.

---

## Scope boundaries

### In scope
- replace `/admin/ui` layout/content composition
- keep improved sidebar and refine if needed
- simplify right-side shell
- align proportions with reference
- maintain tests/build honesty

### Out of scope for this pass
- full dashboard feature implementation
- data wiring
- real athlete/program/workout CRUD
- multi-route nav implementation
- click behavior for each nav node
- auth/permissions
- moving the old showcase to a new route unless explicitly requested

---

## Task 1: Lock the new page intent with failing regression

**Objective:** Rewrite the `/admin/ui` reference test so it stops expecting the current showcase structure and starts expecting a real admin shell.

**Files:**
- Modify: `tests/web-admin-ui-reference.test.js`
- Read: `apps/web/app/admin/ui/page.jsx`

**Step 1: Replace showcase expectations with shell expectations**

Update the test to assert things like:
- `/admin/ui` still imports the shared UI kit pieces it really uses
- it contains the improved sidebar props and section labels
- it does **not** contain the old showcase headings:
  - `Foundations`
  - `Primitives`
  - `Structure`
  - `Layouts`
  - `Overview metrics`
  - `Button family`
  - `Form controls`
  - etc.
- it does contain one real shell page heading and one restrained workspace surface

Suggested expectations to add:
- page source contains `brandMark="P+"`
- page source contains `searchPlaceholder="Search for..."`
- page source contains the nav labels from the real shell
- page source contains a real workspace title like `Dashboard overview` or similar
- page source does **not** contain `ThemeBadgeRow`
- page source does **not** contain `ShowcaseSection`
- page source does **not** contain `ShowcasePanel`

**Step 2: Run the test and confirm failure**

Run:
```bash
node --test tests/web-admin-ui-reference.test.js
```

Expected: FAIL, because the current page is still the showcase implementation.

**Step 3: Commit after test rewrite only**

```bash
git add tests/web-admin-ui-reference.test.js
git commit -m "test: lock real admin shell expectations for /admin/ui"
```

---

## Task 2: Decide the first right-side workspace state

**Objective:** Freeze the exact content strategy for the main panel before rewriting the route.

**Files:**
- Modify later: `apps/web/app/admin/ui/page.jsx`
- Optional docs note: this plan file only

**Decision:** Use this exact first workspace structure:
- top workspace header row
  - eyebrow or small breadcrumb if needed, but quiet
  - title: `Dashboard overview`
  - one-line supporting copy
- one large restrained dark workspace panel
  - either a subtle placeholder block or minimal intro state
- preserve lots of empty canvas around it

**Why this is the right first pass**
- closer to the reference than a showcase
- avoids a jarring completely blank app
- keeps the shell feeling product-like
- gives a stable staging surface for future real dashboard content

**Step 1: No code yet, just freeze the target copy**

Recommended first shell copy:
- Title: `Dashboard overview`
- Subtitle: `Select a section from the sidebar to manage athletes, programs, workouts, and reporting.`
- Placeholder block title: `Workspace ready`
- Placeholder body: `This shell is now aligned to the real admin frame. Future pages should render here instead of reusing the old showcase layout.`

**Step 2: Commit only if you write this into docs**

```bash
git add docs/plans/2026-05-17-real-admin-shell-from-sidebar-reference.md
git commit -m "docs: define first workspace state for real admin shell"
```

---

## Task 3: Remove showcase-only helper content from `/admin/ui`

**Objective:** Strip the route file down so it stops behaving like a design-system presentation page.

**Files:**
- Modify: `apps/web/app/admin/ui/page.jsx`

**Step 1: Delete showcase-only helpers**
Remove helpers that only exist for the docs/showcase page, including:
- `ShowcaseSection`
- `ShowcasePanel`
- `MetricTile`
- `ThemeBadgeRow`
- `LayoutPreviewCard`
- the old `detailItems`, `tableRows`, `tableColumns` if no longer used
- imports only needed by those helpers

**Step 2: Keep only shared shell imports actually needed**
Expected survivors should be something like:
- `Sidebar`
- `SidebarLayout`
- maybe `Navbar` if we keep a very quiet topbar
- maybe `Button` or `Badge` only if the real shell needs them

**Step 3: Re-run test**

Run:
```bash
node --test tests/web-admin-ui-reference.test.js
```

Expected: still failing, but now closer, because the actual route body is not rebuilt yet.

**Step 4: Commit**

```bash
git add apps/web/app/admin/ui/page.jsx
git commit -m "refactor: remove showcase scaffolding from /admin/ui"
```

---

## Task 4: Rebuild `/admin/ui` as a real admin shell route

**Objective:** Replace the current route body with a real shell composition matching the reference image’s intent.

**Files:**
- Modify: `apps/web/app/admin/ui/page.jsx`

**Step 1: Keep `SidebarLayout` as the top-level frame**

Use the existing improved shared sidebar as the left rail.

Recommended sidebar props:
- `brandMark="P+"`
- `title="TRAINING"`
- `subtitle="Coach-first admin dashboard"`
- `searchPlaceholder="Search for..."`
- `sections={sidebarSections}`
- `bottomSections={sidebarBottomSections}`

**Step 2: Remove the showcase navbar content**

The current navbar is too busy:
- title
- search field
- design-system badges
- Share button

Replace it with one of these two patterns:

### Preferred pattern
No top navbar at all. Let the main workspace start directly on the right.

This is closer to the provided image, which does not show a topbar in the main panel.

That means using:
```jsx
<SidebarLayout sidebar={...}>
  ...workspace...
</SidebarLayout>
```
and passing `navbar={null}` implicitly.

### Acceptable fallback
If `SidebarLayout` looks awkward without a navbar, use a very quiet top row with just:
- page title
- maybe one small status chip

But default to **no top navbar** for visual parity with the reference.

**Step 3: Build the workspace content**

Recommended right-side structure:

```jsx
<div className="admin-shell-workspace">
  <div className="admin-shell-workspace-header">
    <span className="admin-shell-workspace-kicker">Dashboard</span>
    <h1 className="admin-shell-workspace-title">Dashboard overview</h1>
    <p className="admin-shell-workspace-description">
      Select a section from the sidebar to manage athletes, programs, workouts, and reporting.
    </p>
  </div>

  <div className="admin-shell-workspace-panel">
    <h2 className="admin-shell-workspace-panel-title">Workspace ready</h2>
    <p className="admin-shell-workspace-panel-copy">
      This shell is now aligned to the real admin frame. Future pages should render here instead of reusing the old showcase layout.
    </p>
  </div>
</div>
```

Keep it sparse. No cards grid. No table. No component demos.

**Step 4: Re-run the shell test**

Run:
```bash
node --test tests/web-admin-ui-reference.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/admin/ui/page.jsx
git commit -m "feat: rebuild /admin/ui as real admin shell"
```

---

## Task 5: Add dedicated shell CSS for the new right-side workspace

**Objective:** Add only the minimal CSS needed for the new sparse admin workspace.

**Files:**
- Modify: `apps/web/app/globals.css`

**Step 1: Add new workspace classes**
Add styles for:
- `.admin-shell-workspace`
- `.admin-shell-workspace-header`
- `.admin-shell-workspace-kicker`
- `.admin-shell-workspace-title`
- `.admin-shell-workspace-description`
- `.admin-shell-workspace-panel`
- `.admin-shell-workspace-panel-title`
- `.admin-shell-workspace-panel-copy`

Suggested styling intent:
- lots of negative space
- wide max width but not full-card wall behavior
- subtle text hierarchy
- one restrained panel near the upper-left of the workspace
- keep everything dark and quiet

Suggested baseline values:
- outer workspace padding: `24px` to `32px`
- header gap: `8px`
- workspace title size: `1.75rem` to `2rem`
- description max width: `560px` to `640px`
- placeholder panel width: `min(100%, 520px)`
- panel padding: `20px 22px`
- panel radius: `18px` to `20px`

**Step 2: Do not add new flashy styles**
Avoid:
- bright hero backgrounds
- dashboard KPI grids
- docs-style section separators
- big accent badges

The page should feel under-designed on purpose, because the reference is shell-first.

**Step 3: Run tests**

Run:
```bash
node --test tests/web-admin-ui-reference.test.js tests/web-ui-structural.test.js
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/app/globals.css tests/web-admin-ui-reference.test.js tests/web-ui-structural.test.js
git commit -m "style: add sparse workspace styling for real admin shell"
```

---

## Task 6: Verify full suite and build

**Objective:** Make sure the route change didn’t break the web UI kit baseline.

**Files:**
- No code changes required

**Step 1: Run focused web test suite**

```bash
node --test \
  tests/web-ui-layouts.test.js \
  tests/web-ui-structural.test.js \
  tests/web-ui-primitives.test.js \
  tests/web-ui-foundations.test.js \
  tests/web-admin-login.test.js \
  tests/web-admin-ui-reference.test.js
```

Expected: all pass.

**Step 2: Run web build**

```bash
pnpm --dir apps/web build
```

Expected: PASS, static `/admin/ui` route builds successfully.

**Step 3: Commit verification if needed**

No commit needed if no code changed here.

---

## Task 7: Live-check the route against the image direction

**Objective:** Confirm the rendered page actually reads like a real admin shell and not a lingering showcase.

**Files:**
- No code changes required unless fixes are needed

**Step 1: Start local preview if needed**

```bash
pnpm --dir apps/web start --port 3005
```

**Step 2: Check the page at**
- `http://127.0.0.1:3005/admin/ui`
- or LAN URL if needed

**Step 3: Verify these visual truths**

Sidebar should:
- stay narrow and dense
- remain the strongest designed object
- keep nested structure and active child markers

Main workspace should:
- be mostly empty and dark
- not show the old Foundations / Primitives / Structure / Layouts sections
- not read like a docs page
- not have a busy top utility bar unless intentionally kept very quiet
- preserve a lot of open right-side space

**Step 4: If the page still reads like a showcase, stop and fix before claiming success**

This is the honesty gate.

---

## Task 8: Optional follow-up route split

**Objective:** Preserve both needs cleanly if desired: a real admin shell and a design-system reference.

**Files:**
- Create later if requested: `apps/web/app/admin/ui-kit/page.jsx`
- Reuse existing showcase fragments if still valuable

**When to do this**
Only if you still want a permanent internal component showcase route after `/admin/ui` becomes the real shell.

**Why optional**
This is useful, but not required for the current target.

---

## Implementation notes and guardrails

### Guardrail 1: Do not keep the showcase and just hide parts of it
The current route should be genuinely simplified, not cosmetically masked.

### Guardrail 2: Do not overfill the right side
The reference is powerful specifically because the right side is mostly open workspace.

### Guardrail 3: Keep the sidebar shared
Do not fork a one-off page-local sidebar. Keep improving `apps/web/components/ui/sidebar.jsx`.

### Guardrail 4: If the main area needs a header, keep it quiet
No chips row, no demo search, no share CTA unless the product page actually needs them.

### Guardrail 5: Keep route naming honest
If `/admin/ui` becomes the real shell, stop calling it a showcase in user-facing copy.

---

## Suggested final acceptance criteria

The work is done when all of these are true:

- `/admin/ui` renders as a real admin shell, not a component gallery
- the left sidebar remains close to the reference image direction
- the right side is mostly empty workspace with minimal real content
- the busy showcase navbar is removed or dramatically quieted
- old showcase section headings no longer exist on the page
- source tests pass
- web build passes
- live page visually reads like an app shell first

---

## Execution handoff

Plan complete and saved. Ready to execute in the next pass.

Recommended first execution order:
1. rewrite shell regression
2. strip showcase helpers
3. rebuild `/admin/ui` body as real shell
4. add sparse workspace CSS
5. verify tests + build + live page
