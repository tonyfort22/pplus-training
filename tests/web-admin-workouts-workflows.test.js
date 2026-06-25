import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import {
  WEB_BROWSER_SMOKE_HARNESS,
  WEB_TEST_LAYERS,
} from '../apps/web/testing/page-test-manifest.js'

const repoRoot = process.cwd()
const workoutsWorkflowSpecPath = 'apps/web/e2e/admin-workouts-workflows.spec.js'
const workoutsWorkflowSpecFullPath = join(repoRoot, workoutsWorkflowSpecPath)

test('admin Workouts workflow manifest includes create, edit, assign, export, delete/archive, and calendar route-opening L6 checks', () => {
  assert.equal(WEB_BROWSER_SMOKE_HARNESS.adminWorkoutsSafeWorkflowSpecFile, workoutsWorkflowSpecPath)
  assert.deepEqual(WEB_BROWSER_SMOKE_HARNESS.adminWorkoutsSafeWorkflowChecks, [
    {
      id: 'admin-workouts-create-test-workout-template',
      route: '/admin/workouts',
      interaction: 'create-workout-template-submits-mocked-post-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-edit-test-workout-template',
      route: '/admin/workouts',
      interaction: 'edit-workout-template-submits-mocked-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-assign-workout-template-to-test-program',
      route: '/admin/workouts',
      interaction: 'assign-workout-template-submits-mocked-program-assignment-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-export-workouts-csv-review-download',
      route: '/admin/workouts',
      interaction: 'export-workouts-opens-review-sheet-and-downloads-csv',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-delete-archive-test-workout-through-confirmation',
      route: '/admin/workouts',
      interaction: 'archive-and-delete-workouts-through-confirmation-dialogs',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-open-workout-calendar-route',
      route: '/admin/workouts',
      interaction: 'open-workout-calendar-route-from-workouts-sidebar-nav',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-calendar-fixture-appears-on-expected-date',
      route: '/admin/workouts/calendar',
      interaction: 'calendar-fixture-renders-in-scheduled-date-cell',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
})

test('admin Workouts create test workout template workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(workoutsWorkflowSpecFullPath), true, `missing Workouts workflow spec: ${workoutsWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(workoutsWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_WORKOUTS_CREATE_TEST_WORKOUT_TEMPLATE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-workouts-create-test-workout-template/)
  assert.match(workflowSpecSource, /Create test workout template/)
  assert.match(workflowSpecSource, /create-workout-template-submits-mocked-post-and-refreshes-table/)
  assert.match(workflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'POST'/)
  assert.match(workflowSpecSource, /createdWorkoutTemplateRequests/)
  assert.match(workflowSpecSource, /Test Workflow Workout Template/)
  assert.match(workflowSpecSource, /Created by the safe Workouts workflow\./)
  assert.match(workflowSpecSource, /estimated_duration_minutes:\s*45/)
  assert.match(workflowSpecSource, /section_count:\s*0/)
  assert.match(workflowSpecSource, /exercise_count:\s*0/)
  assert.match(workflowSpecSource, /set_count:\s*0/)
  assert.match(workflowSpecSource, /await page\.getByRole\(['"]button['"], \{ name: 'Create workout' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Name['"]\)\.fill\(['"]Test Workflow Workout Template['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Duration['"]\)\.fill\(['"]45['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Description['"]\)\.fill\(['"]Created by the safe Workouts workflow\.['"]\)/)
  assert.match(workflowSpecSource, /expect\(workoutsApiState\.createdWorkoutTemplateRequests\)\.toHaveLength\(1\)/)
})

test('admin Workouts edit test workout template workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(workoutsWorkflowSpecFullPath), true, `missing Workouts workflow spec: ${workoutsWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(workoutsWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_WORKOUTS_EDIT_TEST_WORKOUT_TEMPLATE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-workouts-edit-test-workout-template/)
  assert.match(workflowSpecSource, /Edit test workout template/)
  assert.match(workflowSpecSource, /edit-workout-template-submits-mocked-patch-and-refreshes-table/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'PATCH'/)
  assert.match(workflowSpecSource, /updatedWorkoutTemplateRequests/)
  assert.match(workflowSpecSource, /Updated Workflow Workout Template/)
  assert.match(workflowSpecSource, /Updated by the safe Workouts workflow\./)
  assert.match(workflowSpecSource, /const originalWorkoutRow = page\.getByRole\(['"]row['"], \{ name: \/Explosive first step\/ \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: 'Edit' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Name['"]\)\.fill\(['"]Updated Workflow Workout Template['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Duration['"]\)\.fill\(['"]55['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Description['"]\)\.fill\(['"]Updated by the safe Workouts workflow\.['"]\)/)
  assert.match(workflowSpecSource, /expect\(workoutsApiState\.updatedWorkoutTemplateRequests\)\.toHaveLength\(1\)/)
  assert.match(workflowSpecSource, /not\.toBeVisible\(\)/)
})


test('admin Workouts assign workout template to test program workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(workoutsWorkflowSpecFullPath), true, `missing Workouts workflow spec: ${workoutsWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(workoutsWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_WORKOUTS_ASSIGN_WORKOUT_TEMPLATE_TO_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-workouts-assign-workout-template-to-test-program/)
  assert.match(workflowSpecSource, /Assign workout template to test program/)
  assert.match(workflowSpecSource, /assign-workout-template-submits-mocked-program-assignment-patch-and-refreshes-table/)
  assert.match(workflowSpecSource, /assignedWorkoutTemplateRequests/)
  assert.match(workflowSpecSource, /action:\s*'assign-workout-templates-to-program'/)
  assert.match(workflowSpecSource, /programId:\s*'program-1'/)
  assert.match(workflowSpecSource, /workoutTemplateIds:\s*\['workout-1'\]/)
  assert.match(workflowSpecSource, /getByRole\(['"]checkbox['"], \{ name: 'Select row' \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: 'Workout bulk actions' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: 'Assign to program' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: 'Assign to program' \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]option['"], \{ name: 'Summer strength block' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: 'Confirm assignment' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /Assigned 1 workout to Summer strength block\./)
})

test('admin Workouts export workouts CSV review and download workflow is browser-safe', () => {
  assert.equal(existsSync(workoutsWorkflowSpecFullPath), true, `missing Workouts workflow spec: ${workoutsWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(workoutsWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_WORKOUTS_EXPORT_WORKOUTS_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-workouts-export-workouts-csv-review-download/)
  assert.match(workflowSpecSource, /Export workouts CSV review\/download path/)
  assert.match(workflowSpecSource, /export-workouts-opens-review-sheet-and-downloads-csv/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: 'Export workouts' \}\)/)
  assert.match(workflowSpecSource, /Review the selected workouts before downloading a CSV export\./)
  assert.match(workflowSpecSource, /Selected workout preview/)
  assert.match(workflowSpecSource, /Workout template ID/)
  assert.match(workflowSpecSource, /Coach ID/)
  assert.match(workflowSpecSource, /page\.waitForEvent\(['"]download['"]\)/)
  assert.match(workflowSpecSource, /suggestedFilename\(\)/)
  assert.match(workflowSpecSource, /pplus-workouts-export-/)
  assert.match(workflowSpecSource, /download\.path\(\)/)
  assert.match(workflowSpecSource, /Workout name/)
  assert.match(workflowSpecSource, /Explosive first step/)
})

test('admin Workouts delete/archive test workout through confirmation workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(workoutsWorkflowSpecFullPath), true, `missing Workouts workflow spec: ${workoutsWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(workoutsWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_WORKOUTS_DELETE_ARCHIVE_TEST_WORKOUT_THROUGH_CONFIRMATION_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-workouts-delete-archive-test-workout-through-confirmation/)
  assert.match(workflowSpecSource, /Delete\/archive test workout through confirmation/)
  assert.match(workflowSpecSource, /archive-and-delete-workouts-through-confirmation-dialogs/)
  assert.match(workflowSpecSource, /archivedWorkoutTemplateRequests/)
  assert.match(workflowSpecSource, /deletedWorkoutTemplateRequests/)
  assert.match(workflowSpecSource, /action:\s*'archive-workout-templates'/)
  assert.match(workflowSpecSource, /workoutTemplateIds:\s*\['workout-archive-fixture'\]/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'DELETE'/)
  assert.match(workflowSpecSource, /workoutTemplateIds:\s*\['workout-delete-fixture'\]/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: 'Archive workouts' \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: 'Archive workouts' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /Archived 1 workout\./)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: 'Delete workouts' \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: 'Delete workouts' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /Deleted 1 workout\./)
})

test('admin Workouts open workout calendar route workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(workoutsWorkflowSpecFullPath), true, `missing Workouts workflow spec: ${workoutsWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(workoutsWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_WORKOUTS_OPEN_WORKOUT_CALENDAR_ROUTE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-workouts-open-workout-calendar-route/)
  assert.match(workflowSpecSource, /Open workout calendar route/)
  assert.match(workflowSpecSource, /open-workout-calendar-route-from-workouts-sidebar-nav/)
  assert.match(workflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/workout-calendar\*\*['"]/)
  assert.match(workflowSpecSource, /calendarAssignmentRequests/)
  assert.match(workflowSpecSource, /getByRole\(['"]link['"], \{ name: 'Calendar' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /toHaveURL\(\/\\\/admin\\\/workouts\\\/calendar\//)
  assert.match(workflowSpecSource, /getByRole\(['"]region['"], \{ name: 'Workout calendar admin view' \}\)/)
  assert.match(workflowSpecSource, /getByText\(['"]Calendar route speed session['"]\)/)
  assert.match(workflowSpecSource, /expect\(workoutsApiState\.calendarAssignmentRequests\)\.toHaveLength\(1\)/)
})

test('admin Workouts calendar fixture appears on expected date workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(workoutsWorkflowSpecFullPath), true, `missing Workouts workflow spec: ${workoutsWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(workoutsWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_WORKOUTS_CALENDAR_FIXTURE_EXPECTED_DATE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-workouts-calendar-fixture-appears-on-expected-date/)
  assert.match(workflowSpecSource, /Calendar fixture workout appears on expected date/)
  assert.match(workflowSpecSource, /calendar-fixture-renders-in-scheduled-date-cell/)
  assert.match(workflowSpecSource, /scheduled_date:\s*'2026-05-04'/)
  assert.match(workflowSpecSource, /const expectedDateSlot = page\.locator\(['"]\[data-month-slot="month-slot:2026-05-04T04:00:00\.000Z"\]['"]\)/)
  assert.match(workflowSpecSource, /expectedDateSlot\.getByText\(['"]Calendar route speed session['"]\)/)
  assert.match(workflowSpecSource, /const wrongDateSlot = page\.locator\(['"]\[data-month-slot="month-slot:2026-05-05T04:00:00\.000Z"\]['"]\)/)
  assert.match(workflowSpecSource, /wrongDateSlot\.getByText\(['"]Calendar route speed session['"]\)\)\.toHaveCount\(0\)/)
})
