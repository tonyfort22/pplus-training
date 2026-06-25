import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  getWebBrowserSmokeHarness,
  WEB_TEST_LAYERS,
} from '../apps/web/testing/page-test-manifest.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const adminProgramsWorkflowSpecPath = resolve(repoRoot, 'apps/web/e2e/admin-programs-workflows.spec.js')
const pageTestManifestPath = resolve(repoRoot, 'apps/web/testing/page-test-manifest.js')
const programsDataTablePath = resolve(repoRoot, 'apps/web/components/admin/programs-data-table.jsx')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

test('admin Programs browser workflow manifest tracks unassigned test program create as L6 coverage', () => {
  const harness = getWebBrowserSmokeHarness()
  const manifestSource = readSource(pageTestManifestPath)

  assert.ok(existsSync(adminProgramsWorkflowSpecPath), 'expected admin Programs workflow Playwright spec')
  assert.equal(harness.adminProgramsSafeWorkflowSpecFile, 'apps/web/e2e/admin-programs-workflows.spec.js')
  assert.deepEqual(harness.adminProgramsSafeWorkflowChecks, [
    {
      id: 'admin-programs-create-unassigned-test-program',
      route: '/admin/programs',
      interaction: 'create-unassigned-program-submits-mocked-post-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-edit-test-program',
      route: '/admin/programs',
      interaction: 'edit-test-program-submits-mocked-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-assign-test-program-to-test-athlete',
      route: '/admin/programs',
      interaction: 'assign-test-program-submits-mocked-assign-athletes-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-duplicate-test-program',
      route: '/admin/programs',
      interaction: 'duplicate-test-program-submits-mocked-duplicate-post-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-export-selected-programs-csv',
      route: '/admin/programs',
      interaction: 'export-selected-programs-reviews-and-downloads-csv',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-archive-test-program-through-confirmation',
      route: '/admin/programs',
      interaction: 'archive-test-program-confirms-mocked-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-delete-test-program-through-confirmation',
      route: '/admin/programs',
      interaction: 'delete-test-program-confirms-mocked-delete-and-removes-row',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-open-detail-planner-route',
      route: '/admin/programs',
      interaction: 'open-program-detail-planner-route-from-program-name',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(manifestSource, /'tests\/web-admin-programs-workflows\.test\.js'/)
})

test('admin Programs open detail/planner workflow navigates from the program row link', () => {
  const workflowSpecSource = readSource(adminProgramsWorkflowSpecPath)
  const programsDataTableSource = readSource(programsDataTablePath)

  assert.match(workflowSpecSource, /ADMIN_PROGRAMS_OPEN_DETAIL_PLANNER_ROUTE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-programs-open-detail-planner-route/)
  assert.match(workflowSpecSource, /Open program detail planner route/)
  assert.match(workflowSpecSource, /open-program-detail-planner-route-from-program-name/)
  assert.match(workflowSpecSource, /id:\s*['"]program-1['"]/)
  assert.match(workflowSpecSource, /name:\s*['"]Summer strength block['"]/)
  assert.match(workflowSpecSource, /locator\(['"]a\[href=\"\/admin\/programs\/program-1\"\]['"]/)
  assert.ok(workflowSpecSource.includes("toHaveURL(/\\/admin\\/programs\\?athleteId=/)"))
  assert.ok(workflowSpecSource.includes("toHaveURL(/\\/admin\\/programs\\/program-1(?:\\?athleteId=.*)?$/)"))
  assert.match(workflowSpecSource, /getByRole\(['"]heading['"], \{ name: ['"]Program 1['"] \}\)/)
  assert.match(workflowSpecSource, /program-planner-page-header/)
  assert.match(workflowSpecSource, /program-planner-week-row/)
  assert.match(workflowSpecSource, /program-planner-day-card/)
  assert.match(workflowSpecSource, /program-planner-workout-card/)
  assert.match(workflowSpecSource, /getByRole\(['"]link['"], \{ name: \/Back\/ \}\)/)
  assert.match(programsDataTableSource, /<Link href=\{`\/admin\/programs\/\$\{programId\}`}[^>]*>/)
  assert.match(programsDataTableSource, /<ProgramCell programId=\{row\.original\.id\} name=\{row\.original\.name\} athletesLabel=\{row\.original\.athletesLabel\} \/>/)
})

test('admin Programs unassigned create workflow drives real UI with mocked safe POST', () => {
  const workflowSpecSource = readSource(adminProgramsWorkflowSpecPath)

  assert.match(workflowSpecSource, /ADMIN_PROGRAMS_CREATE_UNASSIGNED_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-programs-create-unassigned-test-program/)
  assert.match(workflowSpecSource, /Create unassigned test program/)
  assert.match(workflowSpecSource, /create-unassigned-program-submits-mocked-post-and-refreshes-table/)
  assert.match(workflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/programs\*\*['"]/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'POST'/)
  assert.match(workflowSpecSource, /createdProgramRequests/)
  assert.match(workflowSpecSource, /Test Workflow Program/)
  assert.match(workflowSpecSource, /Created by the safe Programs workflow\./)
  assert.match(workflowSpecSource, /athleteIds:\s*\[\]/)
  assert.match(workflowSpecSource, /athletesLabel:\s*['"]Unassigned['"]/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: ['"]Create a program['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Name['"]\)\.fill\(['"]Test Workflow Program['"]\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: ['"]Create program['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /expect\(programsApiState\.createdProgramRequests\)\.toHaveLength\(1\)/)
})

test('admin Programs edit workflow drives row action edit with mocked safe PATCH', () => {
  const workflowSpecSource = readSource(adminProgramsWorkflowSpecPath)
  const programsDataTableSource = readSource(programsDataTablePath)

  assert.match(workflowSpecSource, /ADMIN_PROGRAMS_EDIT_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-programs-edit-test-program/)
  assert.match(workflowSpecSource, /Edit test program/)
  assert.match(workflowSpecSource, /edit-test-program-submits-mocked-patch-and-refreshes-table/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'PATCH'/)
  assert.match(workflowSpecSource, /updatedProgramRequests/)
  assert.match(workflowSpecSource, /program-edit-fixture/)
  assert.match(workflowSpecSource, /Test Editable Program/)
  assert.match(workflowSpecSource, /Updated Test Workflow Program/)
  assert.match(workflowSpecSource, /Edited by the safe Programs workflow\./)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: ['"]Edit['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: ['"]Save changes['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /expect\(programsApiState\.updatedProgramRequests\)\.toHaveLength\(1\)/)
  assert.match(programsDataTableSource, /onEditAction=\{\(\) => setPendingRowAction\(\{ type: 'edit', programId: row\.original\.id \}\)\}/)
  assert.match(programsDataTableSource, /<Pencil className="size-4" aria-hidden="true" \/>/)
  assert.match(programsDataTableSource, />\s*Edit\s*</)
})

test('admin Programs assign workflow assigns a test program to a test athlete with mocked safe PATCH', () => {
  const workflowSpecSource = readSource(adminProgramsWorkflowSpecPath)
  const programsDataTableSource = readSource(programsDataTablePath)

  assert.match(workflowSpecSource, /ADMIN_PROGRAMS_ASSIGN_TEST_PROGRAM_TO_TEST_ATHLETE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-programs-assign-test-program-to-test-athlete/)
  assert.match(workflowSpecSource, /Assign test program to test athlete/)
  assert.match(workflowSpecSource, /assign-test-program-submits-mocked-assign-athletes-patch-and-refreshes-table/)
  assert.match(workflowSpecSource, /assignedProgramRequests/)
  assert.match(workflowSpecSource, /action:\s*['"]assign-athletes['"]/)
  assert.match(workflowSpecSource, /id:\s*['"]program-assign-fixture['"]/)
  assert.match(workflowSpecSource, /athleteIds:\s*\[\s*['"]athlete-fixture-1['"]\s*\]/)
  assert.match(workflowSpecSource, /Test Assignable Program/)
  assert.match(workflowSpecSource, /Thomas Thibault/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: ['"]Assign to athletes['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: ['"]Assign to athletes['"] \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: ['"]Assign athletes['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /expect\(programsApiState\.assignedProgramRequests\)\.toHaveLength\(1\)/)
  assert.match(programsDataTableSource, /onAssignAction=\{\(\) => setPendingRowAction\(\{ type: 'assign', programId: row\.original\.id \}\)\}/)
  assert.match(programsDataTableSource, />\s*Assign to athletes\s*</)
  assert.match(programsDataTableSource, /action: 'assign-athletes', id: selectedProgramId, athleteIds: programFormValues\.athleteIds/)
})

test('admin Programs duplicate workflow duplicates a test program with mocked safe POST', () => {
  const workflowSpecSource = readSource(adminProgramsWorkflowSpecPath)
  const programsDataTableSource = readSource(programsDataTablePath)

  assert.match(workflowSpecSource, /ADMIN_PROGRAMS_DUPLICATE_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-programs-duplicate-test-program/)
  assert.match(workflowSpecSource, /Duplicate test program/)
  assert.match(workflowSpecSource, /duplicate-test-program-submits-mocked-duplicate-post-and-refreshes-table/)
  assert.match(workflowSpecSource, /duplicatedProgramRequests/)
  assert.match(workflowSpecSource, /action:\s*['"]duplicate['"]/)
  assert.match(workflowSpecSource, /sourceProgramId:\s*['"]program-duplicate-fixture['"]/)
  assert.match(workflowSpecSource, /Test Duplicable Program/)
  assert.match(workflowSpecSource, /Test Duplicable Program copy/)
  assert.match(workflowSpecSource, /Duplicated by the safe Programs workflow\./)
  assert.match(workflowSpecSource, /copyOptions:\s*\{[\s\S]*details:\s*true[\s\S]*athletes:\s*false[\s\S]*schedule:\s*true[\s\S]*exercises:\s*true[\s\S]*notes:\s*true/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: ['"]Duplicate['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: ['"]Duplicate program['"] \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: ['"]Duplicate program['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /expect\(programsApiState\.duplicatedProgramRequests\)\.toHaveLength\(1\)/)
  assert.match(programsDataTableSource, /onDuplicateAction=\{\(\) => setPendingRowAction\(\{ type: 'duplicate', programId: row\.original\.id \}\)\}/)
  assert.match(programsDataTableSource, />\s*Duplicate\s*</)
  assert.match(programsDataTableSource, /action: 'duplicate', sourceProgramId: selectedDuplicateSourceProgramId, copyOptions: duplicateCopyOptions/)
})


test('admin Programs export workflow reviews selected programs and downloads CSV through bulk actions', () => {
  const workflowSpecSource = readSource(adminProgramsWorkflowSpecPath)
  const programsDataTableSource = readSource(programsDataTablePath)

  assert.match(workflowSpecSource, /ADMIN_PROGRAMS_EXPORT_SELECTED_PROGRAMS_CSV_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-programs-export-selected-programs-csv/)
  assert.match(workflowSpecSource, /Export selected programs CSV/)
  assert.match(workflowSpecSource, /export-selected-programs-reviews-and-downloads-csv/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Select row['"]\)\.nth\(0\)\.check\(\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Select row['"]\)\.nth\(1\)\.check\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: ['"]Program bulk actions['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: ['"]Export['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: ['"]Export programs['"] \}\)/)
  assert.match(workflowSpecSource, /Selected programs/)
  assert.match(workflowSpecSource, /pplus-programs-export-/)
  assert.match(workflowSpecSource, /Download CSV/)
  assert.match(workflowSpecSource, /waitForEvent\(['"]download['"]\)/)
  assert.match(workflowSpecSource, /suggestedFilename\(\)/)
  assert.match(workflowSpecSource, /"Program ID","Athlete ID","Assigned athlete IDs","Coach ID","Program type"/)
  assert.match(workflowSpecSource, /Summer strength block/)
  assert.match(workflowSpecSource, /Test Editable Program/)
  assert.match(programsDataTableSource, /aria-label="Program bulk actions"[\s\S]*disabled=\{selectedProgramCount === 0\}/)
  assert.match(programsDataTableSource, /function handleExportSelectedPrograms\(\) \{[\s\S]*openExportProgramSheet\(selectedProgramIds\)/)
  assert.match(programsDataTableSource, /<SheetTitle>Export programs<\/SheetTitle>[\s\S]*Review the selected programs before downloading a CSV export\./)
  assert.match(programsDataTableSource, /disabled=\{exportProgramsDisabled\}[\s\S]*onClick=\{handleConfirmExportPrograms\}[\s\S]*Download CSV/)
})


test('admin Programs archive workflow archives a test program through confirmation with mocked safe PATCH', () => {
  const workflowSpecSource = readSource(adminProgramsWorkflowSpecPath)
  const programsDataTableSource = readSource(programsDataTablePath)

  assert.match(workflowSpecSource, /ADMIN_PROGRAMS_ARCHIVE_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-programs-archive-test-program-through-confirmation/)
  assert.match(workflowSpecSource, /Archive test program through confirmation/)
  assert.match(workflowSpecSource, /archive-test-program-confirms-mocked-patch-and-refreshes-table/)
  assert.match(workflowSpecSource, /archivedProgramRequests/)
  assert.match(workflowSpecSource, /action:\s*['"]archive-programs['"]/)
  assert.match(workflowSpecSource, /programIds:\s*\[\s*['"]program-archive-fixture['"]\s*\]/)
  assert.match(workflowSpecSource, /Test Archivable Program/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: ['"]Archive['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: ['"]Archive programs['"] \}\)/)
  assert.match(workflowSpecSource, /Ready to archive/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: ['"]Archive 1 program['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /expect\(programsApiState\.archivedProgramRequests\)\.toHaveLength\(1\)/)
  assert.match(programsDataTableSource, /onArchiveAction=\{\(\) => setPendingRowAction\(\{ type: 'archive', programId: row\.original\.id \}\)\}/)
  assert.match(programsDataTableSource, /setSelectedArchiveProgramIds\(\[pendingRowAction\.programId\]\)/)
  assert.match(programsDataTableSource, /<DialogTitle>Archive programs<\/DialogTitle>[\s\S]*Review the selected programs before moving them out of active workflows\./)
  assert.match(programsDataTableSource, /onClick=\{handleArchiveProgram\}[\s\S]*Archive \$\{archiveEligiblePrograms\.length\} program/)
})


test('admin Programs delete workflow deletes a test program through confirmation with mocked safe DELETE', () => {
  const workflowSpecSource = readSource(adminProgramsWorkflowSpecPath)
  const programsDataTableSource = readSource(programsDataTablePath)

  assert.match(workflowSpecSource, /ADMIN_PROGRAMS_DELETE_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-programs-delete-test-program-through-confirmation/)
  assert.match(workflowSpecSource, /Delete test program through confirmation/)
  assert.match(workflowSpecSource, /delete-test-program-confirms-mocked-delete-and-removes-row/)
  assert.match(workflowSpecSource, /deletedProgramRequests/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'DELETE'/)
  assert.match(workflowSpecSource, /action:\s*['"]delete-programs['"]/)
  assert.match(workflowSpecSource, /programIds:\s*\[\s*['"]program-delete-fixture['"]\s*\]/)
  assert.match(workflowSpecSource, /Test Deletable Program/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: ['"]Delete['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: ['"]Delete program['"] \}\)/)
  assert.match(workflowSpecSource, /This action cannot be undone\./)
  assert.match(workflowSpecSource, /Programs selected/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: ['"]Delete program['"] \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /expect\(programsApiState\.deletedProgramRequests\)\.toHaveLength\(1\)/)
  assert.match(workflowSpecSource, /expect\(page\.getByRole\(['"]row['"], \{ name: \/Test Deletable Program\/ \}\)\)\.toBeHidden\(\)/)
  assert.match(programsDataTableSource, /onDeleteAction=\{\(\) => setPendingRowAction\(\{ type: 'delete', programId: row\.original\.id \}\)\}/)
  assert.match(programsDataTableSource, /setSelectedDeleteProgramIds\(\[pendingRowAction\.programId\]\)/)
  assert.match(programsDataTableSource, /<DialogTitle>\{deleteProgramCount === 1 \? 'Delete program' : 'Delete programs'\}<\/DialogTitle>[\s\S]*This action cannot be undone\./)
  assert.match(programsDataTableSource, /onClick=\{handleDeleteProgram\}[\s\S]*Delete program/)
})
