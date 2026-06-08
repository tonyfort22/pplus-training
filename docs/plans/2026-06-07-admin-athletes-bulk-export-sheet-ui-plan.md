# Admin Athletes Bulk Export Sheet UI Plan

> **For Hermes:** Use test-driven-development for the source contract, then implement the sheet UI only. Do not wire real CSV/PDF generation in this pass unless Anthony explicitly asks for export workflow next.

**Goal:** Replace the placeholder bulk `Export` menu action with a real right-side sheet design that is ready for the later export workflow.

**Architecture:** Reuse the exact bulk sheet pattern already established in `AthletesDataTable`: menu item opens a right-side `Sheet`, local UI state owns selections, footer actions close/reset state. This pass is UI-only: it should collect export preferences and summarize the selected athlete set, but the final export button can stay disabled or show “workflow next” copy until the backend/file generation pass.

**Tech Stack:** Next.js app router, React client component, shadcn/Radix `Sheet`, existing admin theme tokens, Node source tests.

---

## Current code facts

- Main file: `apps/web/components/admin/athletes-data-table.jsx`
- Current bulk actions live around the selected row toolbar/menu.
- Current `Export` menu item is a placeholder:
  - uses `<Download className="size-4" />`
  - calls `event.preventDefault()` only
  - does not open a sheet
- Existing bulk sheet patterns to mirror:
  - `isAddToGroupsSheetOpen`
  - `isBulkInviteSheetOpen`
  - `isAssignProgramSheetOpen`
- Existing source contract file:
  - `tests/web-admin-ui-reference.test.js`

---

## Product scope

### In scope for this UI pass

- Add an export sheet opened from bulk actions > `Export`.
- Use same right-side sheet shell as Add to groups / Send invites / Assign program.
- Show selected-athlete export summary.
- Let the coach choose export format visually.
- Let the coach choose which fields to include.
- Show an honest disabled footer button if export generation is not wired yet.
- Reset export UI state on close.

### Out of scope for this UI pass

- No CSV generation.
- No XLSX generation.
- No PDF generation.
- No backend route.
- No download side effect.
- No live file creation.

---

## Proposed sheet design

### Sheet header

- Title: `Export athletes`
- Description: `Choose what to include for {selectedAthleteCount} selected athletes.`

### Body sections

1. **Export summary**
   - Three stat cards, matching Send invites readiness cards:
     - `Selected`: `{selectedAthleteCount}`
     - `Active`: count of selected athletes with status `Active`
     - `Inactive`: count of selected athletes not active
   - This keeps the sheet visibly useful before the workflow exists.

2. **Format**
   - Card/radio style options, matching Add to groups selectable cards:
     - `CSV`
       - subcopy: `Spreadsheet-friendly athlete rows`
     - `PDF`
       - subcopy: `Printable roster summary`
   - Default: `CSV`
   - Selected state uses the same green tint:
     - `border-[var(--admin-shell-primary-button-bg)] bg-[#3BE0AF]/10`
   - Hover state should be visibly green-tinted for unselected cards.

3. **Included fields**
   - Checkbox/card list:
     - `Profile`: name, DOB, gender, position
     - `Contact`: invite email and invite status
     - `Training`: assigned program and workout progress
     - `Activity`: status and last active date
   - Default selected:
     - Profile
     - Training
     - Activity
   - Contact can be off by default to avoid exporting email-related data unless intentionally selected.

4. **Selected athletes preview**
   - Show first 3 selected athlete names + program/status.
   - If more than 3 selected, show `+ {selectedAthleteCount - 3} more`.
   - Use the same compact preview pattern from Assign program.

5. **Honesty note**
   - Copy: `This pass prepares the export options. File generation will be wired in the next step.`
   - This prevents a fake working export claim.

### Footer

- `Cancel`
  - closes sheet
  - resets export UI state
- Primary button:
  - label: `Export athletes`
  - disabled for this UI pass
  - optional disabled label copy can remain normal, because the note above explains why

---

## State design

Add state near other bulk state:

```jsx
const [isBulkExportSheetOpen, setIsBulkExportSheetOpen] = useState(false)
const [bulkExportFormat, setBulkExportFormat] = useState('csv')
const [bulkExportFields, setBulkExportFields] = useState(['profile', 'training', 'activity'])
```

Derived counts:

```jsx
const selectedExportActiveCount = selectedAthletes.filter((athlete) => athlete.status === 'Active').length
const selectedExportInactiveCount = selectedAthleteCount - selectedExportActiveCount
```

Reset helper:

```jsx
function resetBulkExportState() {
  setBulkExportFormat('csv')
  setBulkExportFields(['profile', 'training', 'activity'])
}
```

Open/close handler:

```jsx
function handleBulkExportSheetOpenChange(open) {
  setIsBulkExportSheetOpen(open)

  if (!open) {
    setIsBulkActionsMenuOpen(false)
    resetBulkExportState()
  }
}
```

Toggle field helper:

```jsx
function toggleBulkExportField(fieldId) {
  setBulkExportFields((currentFields) => (
    currentFields.includes(fieldId)
      ? currentFields.filter((currentField) => currentField !== fieldId)
      : [...currentFields, fieldId]
  ))
}
```

---

## Implementation tasks

### Task 1: Add failing source contract for export sheet state and menu handoff

**Objective:** Prove the placeholder `Export` action is no longer a dead menu item.

**Files:**
- Modify: `tests/web-admin-ui-reference.test.js`
- Inspect/target: `apps/web/components/admin/athletes-data-table.jsx`

**Test assertions to add:**

```js
assert.match(athletesDataTableSource, /const \[isBulkExportSheetOpen, setIsBulkExportSheetOpen\] = useState\(false\)/)
assert.match(athletesDataTableSource, /const \[bulkExportFormat, setBulkExportFormat\] = useState\('csv'\)/)
assert.match(athletesDataTableSource, /const \[bulkExportFields, setBulkExportFields\] = useState\(\['profile', 'training', 'activity'\]\)/)
assert.match(athletesDataTableSource, /function handleBulkExportSheetOpenChange\(open\)/)
assert.match(athletesDataTableSource, /function toggleBulkExportField\(fieldId\)/)
assert.match(athletesDataTableSource, /setIsBulkExportSheetOpen\(true\)[\s\S]*Export/)
assert.doesNotMatch(athletesDataTableSource, /<DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" onSelect=\{\(event\) => event\.preventDefault\(\)\}>[\s\S]*Export/)
```

**Run:**

```bash
node --test tests/web-admin-ui-reference.test.js
```

**Expected:** FAIL because the export sheet state and handoff do not exist yet.

---

### Task 2: Add export sheet state and open/close helpers

**Objective:** Add the local UI state and reset behavior without rendering the sheet yet.

**Files:**
- Modify: `apps/web/components/admin/athletes-data-table.jsx`

**Steps:**
1. Add `isBulkExportSheetOpen`, `bulkExportFormat`, and `bulkExportFields` near other bulk state.
2. Add `selectedExportActiveCount` and `selectedExportInactiveCount` near selected-athlete derived values.
3. Add `resetBulkExportState()`.
4. Add `handleBulkExportSheetOpenChange(open)`.
5. Add `toggleBulkExportField(fieldId)`.

**Run:**

```bash
node --test tests/web-admin-ui-reference.test.js
```

**Expected:** Still FAIL until the menu handoff and sheet JSX exist.

---

### Task 3: Wire bulk menu Export to open the sheet

**Objective:** Replace the placeholder `Export` action with a real sheet handoff.

**Files:**
- Modify: `apps/web/components/admin/athletes-data-table.jsx`

**Implementation shape:**

```jsx
<DropdownMenuItem
  className="admin-shell-athletes-bulk-menu-item"
  onSelect={(event) => {
    event.preventDefault()
    setIsBulkActionsMenuOpen(false)
    resetBulkExportState()
    setIsBulkExportSheetOpen(true)
  }}
>
  <Download className="size-4" aria-hidden="true" />
  Export
</DropdownMenuItem>
```

**Run:**

```bash
node --test tests/web-admin-ui-reference.test.js
```

**Expected:** State/menu tests pass, sheet JSX tests still fail if added in the next task.

---

### Task 4: Add failing source contract for the export sheet design

**Objective:** Lock the intended UI before writing JSX.

**Files:**
- Modify: `tests/web-admin-ui-reference.test.js`

**Test assertions to add:**

```js
assert.match(athletesDataTableSource, /<Sheet open=\{isBulkExportSheetOpen\} onOpenChange=\{handleBulkExportSheetOpenChange\}>/)
assert.match(athletesDataTableSource, /<SheetTitle className="text-\[var\(--admin-dashboard-card-text\)\]">Export athletes<\/SheetTitle>/)
assert.match(athletesDataTableSource, /Choose what to include for \{selectedAthleteCount\} selected athletes\./)
assert.match(athletesDataTableSource, /\{selectedAthleteCount\}[\s\S]*Selected/)
assert.match(athletesDataTableSource, /\{selectedExportActiveCount\}[\s\S]*Active/)
assert.match(athletesDataTableSource, /\{selectedExportInactiveCount\}[\s\S]*Inactive/)
assert.match(athletesDataTableSource, /Export format[\s\S]*CSV[\s\S]*Spreadsheet-friendly athlete rows[\s\S]*PDF[\s\S]*Printable roster summary/)
assert.match(athletesDataTableSource, /Included fields[\s\S]*Profile[\s\S]*Contact[\s\S]*Training[\s\S]*Activity/)
assert.match(athletesDataTableSource, /selectedAthletes\.slice\(0, 3\)\.map/)
assert.match(athletesDataTableSource, /This pass prepares the export options\. File generation will be wired in the next step\./)
assert.match(athletesDataTableSource, /disabled=\{true\}[\s\S]*Export athletes/)
```

**Run:**

```bash
node --test tests/web-admin-ui-reference.test.js
```

**Expected:** FAIL because the sheet JSX does not exist yet.

---

### Task 5: Implement the export sheet JSX

**Objective:** Render the real right-side sheet with the proposed UI, matching existing admin sheet design.

**Files:**
- Modify: `apps/web/components/admin/athletes-data-table.jsx`

**Placement:**
- Put the export sheet beside the other bulk sheets, before or after Send invites.

**Style rules:**
- Reuse this shell class shape:

```jsx
<SheetContent side="right" className="admin-shell-athletes-export-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
```

- Use `SheetHeader`, scroll body, and `SheetFooter` exactly like the other sheets.
- Use green selected/hover states consistent with Add to groups.
- Do not introduce new CSS unless absolutely necessary.

**Run:**

```bash
node --test tests/web-admin-ui-reference.test.js
```

**Expected:** PASS.

---

### Task 6: Build and preview

**Objective:** Prove the implementation compiles and the preview is serving the updated build.

**Run:**

```bash
pnpm --dir apps/web build
```

**Expected:** `Compiled successfully`.

Restart preview:

```bash
bash -lc 'set -a; source apps/web/.env.local; set +a; PORT=3005 NODE_OPTIONS="--no-experimental-webstorage" pnpm --dir apps/web start'
```

**Expected:** app listens on port `3005`.

Non-destructive live check:

```bash
curl -I http://localhost:3005/admin/athletes
```

Expected: route responds or redirects to login. Do not perform export because this UI pass does not generate files.

---

## Acceptance criteria

- Bulk actions > Export opens a right-side sheet.
- Sheet uses existing admin sheet visual language.
- Sheet has summary cards for selected/active/inactive.
- Sheet has format choice cards for CSV/PDF.
- Sheet has field-selection cards for Profile/Contact/Training/Activity.
- Sheet previews selected athletes.
- Sheet honestly states file generation is next.
- Primary export button is disabled for UI-only pass.
- Closing sheet resets format/field choices.
- Focused source test passes.
- Web build passes.

---

## Later workflow pass notes

When Anthony asks to wire export:

- Decide whether export should be client-side CSV only first, or backend-generated files.
- For quickest useful testable workflow, implement CSV generation client-side from `selectedAthletes` and selected fields.
- PDF should be a separate pass unless explicitly required now.
- Add a real `handleBulkExportSubmit()` only after the UI pass is approved.
