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
const adminAuthWorkflowSpecPath = resolve(repoRoot, 'apps/web/e2e/admin-auth-workflows.spec.js')
const authenticatedSessionHelperPath = resolve(repoRoot, 'apps/web/e2e/authenticated-session.js')

function findRoute(routePath) {
  return getWebPageTestManifest().find((route) => route.path === routePath)
}

test('admin auth browser workflow manifest tracks safe auth workflows as L6 coverage', () => {
  const harness = getWebBrowserSmokeHarness()
  const adminLoginRoute = findRoute('/admin/login')
  const adminForgotPasswordRoute = findRoute('/admin/forgot-password')
  const adminResetPasswordRoute = findRoute('/admin/reset-password')

  assert.ok(adminLoginRoute, 'expected /admin/login route in page test manifest')
  assert.ok(adminForgotPasswordRoute, 'expected /admin/forgot-password route in page test manifest')
  assert.ok(adminResetPasswordRoute, 'expected /admin/reset-password route in page test manifest')
  assert.ok(existsSync(adminAuthWorkflowSpecPath), 'expected admin auth workflow Playwright spec')
  assert.equal(harness.adminAuthSafeWorkflowSpecFile, 'apps/web/e2e/admin-auth-workflows.spec.js')
  assert.deepEqual(harness.adminAuthSafeWorkflowChecks, [
    {
      id: 'admin-login-seeded-account',
      route: '/admin/login',
      interaction: 'seeded-admin-account-login',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-login-invalid-visible-error',
      route: '/admin/login',
      interaction: 'invalid-login-visible-error',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-forgot-password-success-non-enumerating',
      route: '/admin/forgot-password',
      interaction: 'forgot-password-success-visible-without-user-enumeration',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-reset-password-invalid-token-visible-error',
      route: '/admin/reset-password',
      interaction: 'reset-password-invalid-token-visible-error',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-logout-returns-to-login',
      route: '/admin/dashboard',
      interaction: 'logout-returns-user-to-login',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.ok(adminLoginRoute.existingTestFiles.includes('tests/web-admin-auth-workflows.test.js'))
  assert.ok(adminForgotPasswordRoute.existingTestFiles.includes('tests/web-admin-auth-workflows.test.js'))
  assert.ok(adminResetPasswordRoute.existingTestFiles.includes('tests/web-admin-auth-workflows.test.js'))
  assert.ok(adminLoginRoute.layers.includes(WEB_TEST_LAYERS.SAFE_WORKFLOW))
  assert.ok(adminForgotPasswordRoute.layers.includes(WEB_TEST_LAYERS.SAFE_WORKFLOW))
  assert.ok(adminResetPasswordRoute.layers.includes(WEB_TEST_LAYERS.SAFE_WORKFLOW))
})

test('admin seeded login browser workflow uses the real UI path and seeded credential env when available', () => {
  const specSource = readFileSync(adminAuthWorkflowSpecPath, 'utf8')
  const helperSource = readFileSync(authenticatedSessionHelperPath, 'utf8')

  assert.match(specSource, /ADMIN_LOGIN_SEEDED_ACCOUNT_WORKFLOW_CHECK/)
  assert.match(specSource, /admin-login-seeded-account/)
  assert.match(specSource, /seeded-admin-account-login/)
  assert.match(specSource, /hasAdminLoginCredentials\(process\.env\)/)
  assert.match(specSource, /test\.skip\([\s\S]*requires PPLUS_WEB_ADMIN_EMAIL and PPLUS_WEB_ADMIN_PASSWORD/)
  assert.match(specSource, /loginAdminThroughUi\(page/)
  assert.match(specSource, /PPLUS_WEB_ADMIN_EMAIL/)
  assert.match(specSource, /PPLUS_WEB_ADMIN_PASSWORD/)
  assert.match(specSource, /expect\(page\)\.toHaveURL\(\/\\\/admin\\\/dashboard/)
  assert.match(specSource, /getByRole\(['"]heading['"], \{ name: \/Dashboard\/i \}\)/)
  assert.match(specSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)

  assert.match(helperSource, /hasAdminLoginCredentials/)
  assert.match(helperSource, /readAdminLoginCredentials/)
  assert.match(helperSource, /loginAdminThroughUi/)
  assert.match(helperSource, /assertAdminCookies/)
  assert.match(helperSource, /assertAuthenticatedPath/)
})

test('admin invalid login browser workflow posts bad credentials and shows a visible error', () => {
  const specSource = readFileSync(adminAuthWorkflowSpecPath, 'utf8')

  assert.match(specSource, /ADMIN_LOGIN_INVALID_VISIBLE_ERROR_WORKFLOW_CHECK/)
  assert.match(specSource, /admin-login-invalid-visible-error/)
  assert.match(specSource, /invalid-login-visible-error/)
  assert.match(specSource, /page\.route\(['"]\*\*\/api\/admin\/auth\/login['"]/)
  assert.match(specSource, /status:\s*401/)
  assert.match(specSource, /Invalid email or password\./)
  assert.match(specSource, /locator\(['"]#email['"]\)\.fill/)
  assert.match(specSource, /locator\(['"]#password['"]\)\.fill/)
  assert.match(specSource, /getByRole\(['"]button['"], \{ name: \/Sign in\/i \}\)\.click/)
  assert.match(specSource, /admin-login-error\[role="alert"\]/)
  assert.match(specSource, /expect\(page\)\.toHaveURL\(\/\\\/admin\\\/login/)
  assert.match(specSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
})

test('admin forgot-password browser workflow shows the same success state for an accepted request', () => {
  const specSource = readFileSync(adminAuthWorkflowSpecPath, 'utf8')

  assert.match(specSource, /ADMIN_FORGOT_PASSWORD_SUCCESS_NON_ENUMERATING_WORKFLOW_CHECK/)
  assert.match(specSource, /admin-forgot-password-success-non-enumerating/)
  assert.match(specSource, /forgot-password-success-visible-without-user-enumeration/)
  assert.match(specSource, /page\.route\(['"]\*\*\/api\/admin\/auth\/forgot-password['"]/)
  assert.match(specSource, /status:\s*200/)
  assert.match(specSource, /If an account exists for that email, a reset link has been sent\./)
  assert.match(specSource, /locator\(['"]#forgot-email['"]\)\.fill/)
  assert.match(specSource, /getByRole\(['"]button['"], \{ name: \/Send reset link\/i \}\)\.click/)
  assert.match(specSource, /admin-login-success\[role="status"\]/)
  assert.match(specSource, /expect\(page\)\.toHaveURL\(\/\\\/admin\\\/forgot-password/)
  assert.match(specSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
})

test('admin reset-password browser workflow shows invalid token errors visibly', () => {
  const specSource = readFileSync(adminAuthWorkflowSpecPath, 'utf8')

  assert.match(specSource, /ADMIN_RESET_PASSWORD_INVALID_TOKEN_VISIBLE_ERROR_WORKFLOW_CHECK/)
  assert.match(specSource, /admin-reset-password-invalid-token-visible-error/)
  assert.match(specSource, /reset-password-invalid-token-visible-error/)
  assert.match(specSource, /page\.route\(['"]\*\*\/api\/admin\/auth\/reset-password['"]/)
  assert.match(specSource, /status:\s*400/)
  assert.match(specSource, /Recovery token is invalid or expired\./)
  assert.match(specSource, /\/admin\/reset-password#access_token=expired-reset-token&type=recovery/)
  assert.match(specSource, /locator\(['"]#new-password['"]\)\.fill/)
  assert.match(specSource, /locator\(['"]#confirm-password['"]\)\.fill/)
  assert.match(specSource, /getByRole\(['"]button['"], \{ name: \/Update password\/i \}\)\.click/)
  assert.match(specSource, /admin-login-error\[role="alert"\]/)
  assert.match(specSource, /expect\(page\)\.toHaveURL\(\/\\\/admin\\\/reset-password/)
  assert.match(specSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
})

test('admin logout browser workflow returns the user to login through the account menu', () => {
  const specSource = readFileSync(adminAuthWorkflowSpecPath, 'utf8')
  const shellSource = readFileSync(resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx'), 'utf8')

  assert.match(specSource, /ADMIN_LOGOUT_RETURNS_TO_LOGIN_WORKFLOW_CHECK/)
  assert.match(specSource, /admin-logout-returns-to-login/)
  assert.match(specSource, /logout-returns-user-to-login/)
  assert.match(specSource, /resolveWebBaseUrl/)
  assert.match(specSource, /page\.context\(\)\.addCookies/)
  assert.match(specSource, /name:\s*['"]pplus_admin_access_token['"]/)
  assert.match(specSource, /name:\s*['"]pplus_admin_refresh_token['"]/)
  assert.match(specSource, /page\.goto\(['"]\/admin\/dashboard['"]\)/)
  assert.match(specSource, /admin-dashboard-sidebar/)
  assert.match(specSource, /getByRole\(['"]button['"], \{ name: \/Open top account menu\/i \}\)\.click/)
  assert.match(specSource, /getByRole\(['"]menuitem['"], \{ name: \/Log out\/i \}\)\.click/)
  assert.match(specSource, /expect\(page\)\.toHaveURL\(\/\\\/admin\\\/login/)
  assert.match(specSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)

  assert.match(shellSource, /async function handleLogout/)
  assert.match(shellSource, /fetch\(['"]\/api\/admin\/auth\/logout['"], \{\s*method: ['"]POST['"]/s)
  assert.match(shellSource, /router\.replace\(['"]\/admin\/login['"]\)/)
  assert.match(shellSource, /Log out/)
})
