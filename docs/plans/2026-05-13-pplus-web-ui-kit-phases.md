# PPLUS Web UI Kit Implementation Plan

> **For Hermes:** Use strict TDD and execute this plan step by step. Do not claim completion early. The final target is a real `/admin/ui` source-of-truth page that reads like a standard UI kit demo, near-clone in structure to the referenced kit, but with PPLUS styling.

**Goal:** Build a real reusable web UI kit in `apps/web` with the same component categories and coverage as the reference kit, using PPLUS branding and a disciplined system.

**Agreed direction:**
- Scope: same component categories and coverage as the reference UI kit
- Brand direction: near-clone structure, PPLUS styling
- Theme: dark + light
- Accent: current green/teal
- Font: Geist
- Radius: tighter/systematic
- Icon style: Lucide
- API: simple
- Location: best practice

**Best-practice location:**
- Place reusable kit code under `apps/web/components/ui/`
- Keep admin-specific page composition under `apps/web/components/admin/` only when it is not generic kit code
- `/admin/ui` becomes the showcase page for the shared kit, not a one-off admin-only styling sandbox

---

## Phase 1: Foundations

**Deliverables**
- global theme tokens for dark + light
- Geist font wired into the web app
- semantic color tokens
- spacing scale
- radius scale
- type scale
- shadow scale
- surface tokens
- interaction state tokens
- a documented simple API naming convention

**Likely files**
- `apps/web/app/layout.jsx`
- `apps/web/app/globals.css`
- `apps/web/components/ui/` (new directory)
- `docs/admin-ui-ruleset.md` or a renamed broader kit rules doc
- `tests/web-admin-login.test.js`
- `tests/web-admin-ui-reference.test.js`
- possibly new tests for shared UI primitives

**Acceptance bar**
- dark and light tokens both exist
- Geist is active
- spacing/radius/type/surface decisions are tokenized
- no more made-up page-level styling drift
- admin login and `/admin/ui` can both consume the same foundation

---

## Phase 2: Primitive kit

**Components**
- Button
- Badge
- Input
- Select
- Textarea
- Checkbox
- Radio
- Switch
- Avatar

**Rules**
- simple prop API
- consistent size model
- consistent state styling
- dark + light support from tokens
- Lucide-compatible icon spacing

**Acceptance bar**
- all primitives rendered from shared kit components
- no page-specific one-off button/input skins on `/admin/ui`

---

## Phase 3: Structural kit

**Components**
- Sidebar
- Navbar
- Dropdown
- Dialog
- Fieldset
- Table
- Pagination
- Description list
- Alert

**Acceptance bar**
- shell structure reads like a real UI kit, not a custom showcase
- navigation, tables, and overlays all share the same system logic

---

## Phase 4: Layouts

**Layouts**
- Sidebar layout
- Stacked layout
- Auth layout

**Acceptance bar**
- layouts are reusable wrappers, not embedded page hacks
- `/admin/ui` and `/` consume shared layouts where appropriate

---

## Phase 5: Reference page

**Goal**
Rebuild `/admin/ui` into the real source of truth page:
- component families grouped clearly
- layouts shown cleanly
- primitives shown cleanly
- structure near-clone to the reference kit’s demo logic
- PPLUS styling applied consistently

**Acceptance bar**
- the page looks like a standard UI kit docs/demo surface
- not bloated, not custom-chaotic, not over-explained
- every section is there for a reason
- typography, spacing, cards, and controls read as one system

---

## Execution order
1. Lock Phase 1 foundations
2. Move primitives into shared `components/ui`
3. Build structural components on top of those primitives
4. Build the three layouts
5. Rebuild `/admin/ui` last, using the real kit

---

## Important guardrails
- No overclaiming. "Partially wired" is not "applied".
- Do not let `/admin/ui` become a design mood board again.
- The page should demonstrate the kit, not improvise around it.
- Use Tailwind for layout, spacing, sizing, and structure.
- Use CSS variables/tokens for theme and semantic styling.
- Prefer shared kit components over admin-local wrappers.

---

## Immediate next step
Start **Phase 1 only**.

That means:
- establish the shared `components/ui` direction
- wire Geist
- create the dual-theme foundation
- normalize tokens and system scales
- update tests so the foundation is locked before building more components
