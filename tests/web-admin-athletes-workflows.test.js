import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const repoRoot = dirname(fileURLToPath(import.meta.url)).replace(`${sep}tests`, '')
const athletesTablePath = join(repoRoot, 'apps/web/components/admin/athletes-data-table.jsx')
const athletesWorkflowSpecPath = join(repoRoot, 'apps/web/e2e/admin-athletes-workflows.spec.js')

test('All Athletes table has an L6 row/detail path workflow', () => {
  assert.equal(existsSync(athletesWorkflowSpecPath), true)
  const source = readFileSync(athletesWorkflowSpecPath, 'utf8')

  assert.match(source, /ADMIN_ATHLETES_ROW_DETAIL_PATH_WORKFLOW_CHECK/)
  assert.match(source, /admin-athletes-row-detail-path/)
  assert.match(source, /All Athletes table opens expected row\/detail path/)
  assert.match(source, /route:\s*'\/admin\/athletes'/)
  assert.match(source, /athleteId=athlete-fixture-2/)
  assert.match(source, /Open athlete detail for Jordan Lee/)
})

test('All Athletes table has an L6 create test athlete workflow', () => {
  assert.equal(existsSync(athletesWorkflowSpecPath), true)
  const source = readFileSync(athletesWorkflowSpecPath, 'utf8')

  assert.match(source, /ADMIN_ATHLETES_CREATE_TEST_ATHLETE_WORKFLOW_CHECK/)
  assert.match(source, /admin-athletes-create-test-athlete/)
  assert.match(source, /Create test athlete/)
  assert.match(source, /route:\s*'\/admin\/athletes'/)
  assert.match(source, /create-athlete-submits-mocked-post-and-refreshes-table/)
  assert.match(source, /request\.method\(\) === 'POST'/)
  assert.match(source, /Testy McAthlete/)
  assert.match(source, /testy\.mcathlete\+workflow@example\.com/)
  assert.match(source, /Invitation sent/)
  assert.match(source, /athlete-created-fixture/)
})

test('All Athletes table has an L6 edit test athlete workflow', () => {
  assert.equal(existsSync(athletesWorkflowSpecPath), true)
  const source = readFileSync(athletesWorkflowSpecPath, 'utf8')

  assert.match(source, /ADMIN_ATHLETES_EDIT_TEST_ATHLETE_WORKFLOW_CHECK/)
  assert.match(source, /admin-athletes-edit-test-athlete/)
  assert.match(source, /Edit test athlete/)
  assert.match(source, /route:\s*'\/admin\/athletes'/)
  assert.match(source, /edit-athlete-submits-mocked-patch-and-refreshes-table/)
  assert.match(source, /request\.method\(\) === 'PATCH'/)
  assert.match(source, /Alex Updated/)
  assert.match(source, /Athlete updated/)
  assert.match(source, /Changes saved for Alex Updated\./)
  assert.match(source, /updatedAthleteRequests/)
})

test('All Athletes table has an L6 invite test athlete workflow with safe email fixture', () => {
  assert.equal(existsSync(athletesWorkflowSpecPath), true)
  const source = readFileSync(athletesWorkflowSpecPath, 'utf8')

  assert.match(source, /ADMIN_ATHLETES_INVITE_TEST_ATHLETE_WORKFLOW_CHECK/)
  assert.match(source, /admin-athletes-invite-test-athlete-safe-email/)
  assert.match(source, /Invite test athlete with safe email fixture/)
  assert.match(source, /route:\s*'\/admin\/athletes'/)
  assert.match(source, /invite-athlete-submits-mocked-invite-post-with-safe-email/)
  assert.match(source, /request\.method\(\) === 'POST'/)
  assert.match(source, /\/api\/admin\/invites/)
  assert.match(source, /pplus\.safe\+invite\.workflow@example\.com/)
  assert.match(source, /Invite an athlete/)
  assert.match(source, /Sent an athlete invitation for \$\{SAFE_INVITE_EMAIL\}\./)
  assert.match(source, /sentInviteRequests/)
})

test('All Athletes table has an L6 bulk action zero-selection guard workflow', () => {
  assert.equal(existsSync(athletesWorkflowSpecPath), true)
  const source = readFileSync(athletesWorkflowSpecPath, 'utf8')

  assert.match(source, /ADMIN_ATHLETES_BULK_ACTION_ZERO_SELECTION_WORKFLOW_CHECK/)
  assert.match(source, /admin-athletes-bulk-action-zero-selection-guard/)
  assert.match(source, /Bulk action zero-selection guard/)
  assert.match(source, /route:\s*'\/admin\/athletes'/)
  assert.match(source, /bulk-actions-stays-disabled-and-closed-with-zero-selected-athletes/)
  assert.match(source, /getByRole\('button', \{ name: 'Bulk actions' \}\)/)
  assert.match(source, /toBeDisabled\(\)/)
  assert.match(source, /toHaveAttribute\('aria-disabled', 'true'\)/)
  assert.match(source, /getByRole\('menuitem', \{ name: 'Export' \}\)[\s\S]*toHaveCount\(0\)/)
})

test('All Athletes row name opens the selected-athlete detail query path', () => {
  const source = readFileSync(athletesTablePath, 'utf8')

  assert.match(source, /useRouter/)
  assert.match(source, /usePathname/)
  assert.match(source, /useSearchParams/)
  assert.match(source, /buildAthleteDetailQueryString/)
  assert.match(source, /Open athlete detail for/)
  assert.match(source, /onOpenAthleteDetail\(\)/)
  assert.match(source, /router\.replace\(`\$\{pathname\}\$\{nextQueryString\}`/)
  assert.match(source, /nextSearchParams\.set\('athleteId', athleteId\)/)
})
