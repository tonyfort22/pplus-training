import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const supportWorkflowSpecPath = resolve(repoRoot, 'apps/web/e2e/public-support-workflows.spec.js')
const pageTestManifestPath = resolve(repoRoot, 'apps/web/testing/page-test-manifest.js')

test('public support form validation workflow is covered as a safe L6 browser workflow', () => {
  assert.ok(existsSync(supportWorkflowSpecPath), 'expected public support workflow Playwright spec')

  const workflowSpecSource = readFileSync(supportWorkflowSpecPath, 'utf8')
  const manifestSource = readFileSync(pageTestManifestPath, 'utf8')

  assert.match(workflowSpecSource, /PUBLIC_SUPPORT_FORM_VALIDATION_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /id:\s*'public-support-form-validation'/)
  assert.match(workflowSpecSource, /route:\s*'\/support'/)
  assert.match(workflowSpecSource, /interaction:\s*'support-form-validation'/)
  assert.match(workflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(workflowSpecSource, /page\.route\('.*api\/support-requests'/)
  assert.match(workflowSpecSource, /expect\(supportApiRequests\)\.toHaveLength\(0\)/)
  assert.match(workflowSpecSource, /Please select an item/)
  assert.match(workflowSpecSource, /Please enter a valid email/)
  assert.match(workflowSpecSource, /support-template-success/)
  assert.match(workflowSpecSource, /expect\(supportApiRequests\)\.toEqual/)

  assert.match(manifestSource, /publicSafeWorkflowSpecFile:\s*'apps\/web\/e2e\/public-support-workflows\.spec\.js'/)
  assert.match(manifestSource, /publicSafeWorkflowChecks:\s*Object\.freeze/)
  assert.match(manifestSource, /id:\s*'public-support-form-validation'[\s\S]*?layer:\s*WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(manifestSource, /const publicSupportPageLayers = Object\.freeze\(\[[\s\S]*WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
})

test('public support form safe-create workflow is covered without sending real notifications', () => {
  assert.ok(existsSync(supportWorkflowSpecPath), 'expected public support workflow Playwright spec')

  const workflowSpecSource = readFileSync(supportWorkflowSpecPath, 'utf8')
  const manifestSource = readFileSync(pageTestManifestPath, 'utf8')

  assert.match(workflowSpecSource, /PUBLIC_SUPPORT_FORM_SAFE_CREATE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /id:\s*'public-support-form-safe-create'/)
  assert.match(workflowSpecSource, /interaction:\s*'support-form-safe-test-request-create'/)
  assert.match(workflowSpecSource, /PPLUS SAFE TEST SUPPORT REQUEST/)
  assert.match(workflowSpecSource, /support-request-safe-playwright/)
  assert.match(workflowSpecSource, /supportConversationId:\s*'conversation-safe-playwright'/)
  assert.match(workflowSpecSource, /expect\(supportApiRequests\)\.toEqual/)
  assert.match(workflowSpecSource, /not\.toContain\('api\.loops\.so'\)/)

  assert.match(manifestSource, /id:\s*'public-support-form-safe-create'[\s\S]*?interaction:\s*'support-form-safe-test-request-create'[\s\S]*?layer:\s*WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
})

test('public theme switch persists across public route navigation as a safe L6 browser workflow', () => {
  assert.ok(existsSync(supportWorkflowSpecPath), 'expected public support workflow Playwright spec')

  const workflowSpecSource = readFileSync(supportWorkflowSpecPath, 'utf8')
  const manifestSource = readFileSync(pageTestManifestPath, 'utf8')

  assert.match(workflowSpecSource, /PUBLIC_THEME_ROUTE_NAVIGATION_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /id:\s*'public-theme-route-navigation'/)
  assert.match(workflowSpecSource, /route:\s*'\/'/)
  assert.match(workflowSpecSource, /interaction:\s*'theme-switch-persists-across-public-navigation'/)
  assert.match(workflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(workflowSpecSource, /localStorage\.getItem\('pplus-public-theme'\)/)
  assert.match(workflowSpecSource, /document\.documentElement\.dataset\.publicTheme/)
  assert.match(workflowSpecSource, /getByRole\('button', \{ name: \/Switch to light mode\//)
  assert.match(workflowSpecSource, /getByRole\('link', \{ name: 'FAQ' \}\)/)
  assert.match(workflowSpecSource, /getByRole\('link', \{ name: 'Support' \}\)/)

  assert.match(manifestSource, /id:\s*'public-theme-route-navigation'[\s\S]*?interaction:\s*'theme-switch-persists-across-public-navigation'[\s\S]*?layer:\s*WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
})
