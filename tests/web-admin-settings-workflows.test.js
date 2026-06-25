import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  WEB_TEST_LAYERS,
  getWebBrowserSmokeHarness,
  getWebPageTestManifest,
} from '../apps/web/testing/page-test-manifest.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const adminSettingsWorkflowSpecPath = resolve(repoRoot, 'apps/web/e2e/admin-settings-workflows.spec.js')
const adminShellPath = resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx')
const settingsViewPath = resolve(repoRoot, 'apps/web/components/admin/settings-view.jsx')

function findRoute(routePath) {
  return getWebPageTestManifest().find((route) => route.path === routePath)
}

test('admin Settings browser workflow manifest tracks profile update as L6 coverage', () => {
  const harness = getWebBrowserSmokeHarness()
  const settingsRoute = findRoute('/admin/[section]')

  assert.ok(settingsRoute, 'expected /admin/[section] route in page test manifest for /admin/settings')
  assert.ok(existsSync(adminSettingsWorkflowSpecPath), 'expected admin Settings workflow Playwright spec')
  assert.equal(harness.adminSettingsSafeWorkflowSpecFile, 'apps/web/e2e/admin-settings-workflows.spec.js')
  assert.deepEqual(harness.adminSettingsSafeWorkflowChecks, [
    {
      id: 'admin-settings-profile-update-saves-visible-name-avatar',
      route: '/admin/settings',
      interaction: 'profile-update-saves-visible-name-avatar',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-settings-account-validation-errors-visible',
      route: '/admin/settings/account',
      interaction: 'account-validation-errors-appear-visibly',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-settings-account-save-renders-toast',
      route: '/admin/settings/account',
      interaction: 'account-save-renders-success-toast',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.ok(settingsRoute.existingTestFiles.includes('tests/web-admin-settings-workflows.test.js'))
  assert.ok(settingsRoute.layers.includes(WEB_TEST_LAYERS.SAFE_WORKFLOW))
})

test('admin Settings profile workflow drives real UI, mocked PATCH, and visible shell refresh', () => {
  const specSource = readFileSync(adminSettingsWorkflowSpecPath, 'utf8')
  const adminShellSource = readFileSync(adminShellPath, 'utf8')
  const settingsViewSource = readFileSync(settingsViewPath, 'utf8')

  assert.match(specSource, /ADMIN_SETTINGS_PROFILE_UPDATE_VISIBLE_WORKFLOW_CHECK/)
  assert.match(specSource, /admin-settings-profile-update-saves-visible-name-avatar/)
  assert.match(specSource, /profile-update-saves-visible-name-avatar/)
  assert.match(specSource, /page\.route\(\/\\\/admin\\\/api\\\/settings\\\/profile/)
  assert.match(specSource, /request\.method\(\) === 'PATCH'/)
  assert.match(specSource, /updatedCoachAvatarUrl/)
  assert.match(specSource, /admin-settings-profile-first-name/)
  assert.match(specSource, /admin-settings-profile-last-name/)
  assert.match(specSource, /admin-settings-profile-phone/)
  assert.match(specSource, /getByRole\(['"]button['"], \{ name: \/Save changes\/i \}\)\.click/)
  assert.match(specSource, /Profile updated\./)
  assert.match(specSource, /Updated Workflow Coach/)
  assert.match(specSource, /admin-dashboard-sidebar-primary-text/)
  assert.match(specSource, /admin-dashboard-sidebar-account-avatar/)
  assert.match(specSource, /admin-dashboard-topbar-avatar/)
  assert.match(specSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)

  assert.match(settingsViewSource, /window\.dispatchEvent\(new CustomEvent\('pplus-admin-profile-updated', \{ detail: payload\.profile \}\)\)/)
  assert.match(adminShellSource, /window\.addEventListener\('pplus-admin-profile-updated', loadCoachProfile\)/)
  assert.match(adminShellSource, /window\.removeEventListener\('pplus-admin-profile-updated', loadCoachProfile\)/)
})
test('admin Settings account workflow shows validation errors visibly without clearing form state', () => {
  const specSource = readFileSync(adminSettingsWorkflowSpecPath, 'utf8')
  const settingsViewSource = readFileSync(settingsViewPath, 'utf8')

  assert.match(specSource, /ADMIN_SETTINGS_ACCOUNT_VALIDATION_ERROR_WORKFLOW_CHECK/)
  assert.match(specSource, /admin-settings-account-validation-errors-visible/)
  assert.match(specSource, /account-validation-errors-appear-visibly/)
  assert.match(specSource, /page\.goto\(['"]\/admin\/settings\/account['"]\)/)
  assert.match(specSource, /page\.route\(['"]\*\*\/admin\/api\/settings\/account\*\*['"]/)
  assert.match(specSource, /request\.method\(\) === 'PATCH'/)
  assert.match(specSource, /New password and confirmation must match\./)
  assert.match(specSource, /getByRole\(['"]alert['"], \{ name: 'Account validation error' \}\)/)
  assert.match(specSource, /admin-settings-account-submit/)
  assert.match(specSource, /toHaveValue\(['"]one-password['"]\)/)

  assert.match(settingsViewSource, /const hasAccountError = Boolean\(errorMessage\)/)
  assert.match(settingsViewSource, /role=\{hasAccountError \? 'alert' : 'status'\}/)
  assert.match(settingsViewSource, /aria-label=\{hasAccountError \? 'Account validation error' : 'Account status'\}/)
  assert.match(settingsViewSource, /hasAccountError\s*\?\s*'[^']*border-\[#ef4444\]/)
})

test('admin Settings successful profile and account saves render success toasts', () => {
  const specSource = readFileSync(adminSettingsWorkflowSpecPath, 'utf8')
  const settingsViewSource = readFileSync(settingsViewPath, 'utf8')

  assert.match(specSource, /ADMIN_SETTINGS_ACCOUNT_SAVE_TOAST_WORKFLOW_CHECK/)
  assert.match(specSource, /admin-settings-account-save-renders-toast/)
  assert.match(specSource, /account-save-renders-success-toast/)
  assert.match(specSource, /getByText\(['"]Profile saved['"]\)/)
  assert.match(specSource, /getByText\(['"]Account saved['"]\)/)
  assert.match(specSource, /getByText\(['"]Your profile changes are live\.['"]\)/)
  assert.match(specSource, /getByText\(['"]Your account changes are saved\.['"]\)/)
  assert.match(specSource, /Account updated\./)

  assert.match(settingsViewSource, /import \{ useToast \} from '@\/hooks\/use-toast'/)
  assert.match(settingsViewSource, /const \{ toastManager \} = useToast\(\)/)
  assert.match(settingsViewSource, /toastManager\.show\(\{[\s\S]*title: 'Profile saved',[\s\S]*description: 'Your profile changes are live\.',[\s\S]*variant: 'success'/)
  assert.match(settingsViewSource, /toastManager\.show\(\{[\s\S]*title: 'Account saved',[\s\S]*description: 'Your account changes are saved\.',[\s\S]*variant: 'success'/)
})
