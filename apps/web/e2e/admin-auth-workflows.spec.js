import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { hasAdminLoginCredentials, loginAdminThroughUi } from './authenticated-session.js'
import { resolveWebBaseUrl } from './base-url.js'

export const ADMIN_LOGIN_SEEDED_ACCOUNT_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-login-seeded-account',
  route: '/admin/login',
  interaction: 'seeded-admin-account-login',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
  requiredEnv: Object.freeze(['PPLUS_WEB_ADMIN_EMAIL', 'PPLUS_WEB_ADMIN_PASSWORD']),
})

export const ADMIN_LOGIN_INVALID_VISIBLE_ERROR_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-login-invalid-visible-error',
  route: '/admin/login',
  interaction: 'invalid-login-visible-error',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_FORGOT_PASSWORD_SUCCESS_NON_ENUMERATING_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-forgot-password-success-non-enumerating',
  route: '/admin/forgot-password',
  interaction: 'forgot-password-success-visible-without-user-enumeration',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_RESET_PASSWORD_INVALID_TOKEN_VISIBLE_ERROR_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-reset-password-invalid-token-visible-error',
  route: '/admin/reset-password',
  interaction: 'reset-password-invalid-token-visible-error',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_LOGOUT_RETURNS_TO_LOGIN_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-logout-returns-to-login',
  route: '/admin/dashboard',
  interaction: 'logout-returns-user-to-login',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

test.describe('Admin auth workflows', () => {
  test('Admin login works with seeded admin account', async ({ page }) => {
    test.skip(
      !hasAdminLoginCredentials(process.env),
      'Authenticated admin login workflow requires PPLUS_WEB_ADMIN_EMAIL and PPLUS_WEB_ADMIN_PASSWORD; skipped in PR CI without local-only secrets.',
    )

    await loginAdminThroughUi(page)

    await expect(page).toHaveURL(/\/admin\/dashboard(?:\?|$)/)
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar')).toBeVisible()
  })

  test('Invalid login shows visible error', async ({ page }) => {
    await page.route('**/api/admin/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password.' }),
      })
    })

    await page.goto('/admin/login')
    await page.locator('#email').fill('not-admin@example.com')
    await page.locator('#password').fill('wrong-password')
    await page.getByRole('button', { name: /Sign in/i }).click()

    await expect(page.locator('.admin-login-error[role="alert"]')).toContainText('Invalid email or password.')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('Forgot-password success state is visible without user enumeration', async ({ page }) => {
    await page.route('**/api/admin/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'If an account exists for that email, a reset link has been sent.' }),
      })
    })

    await page.goto('/admin/forgot-password')
    await page.locator('#forgot-email').fill('unknown-admin@example.com')
    await page.getByRole('button', { name: /Send reset link/i }).click()

    await expect(page.locator('.admin-login-success[role="status"]')).toContainText('If an account exists for that email, a reset link has been sent.')
    await expect(page.locator('.admin-login-error[role="alert"]')).toHaveCount(0)
    await expect(page).toHaveURL(/\/admin\/forgot-password/)
  })

  test('Reset-password invalid token state is visible', async ({ page }) => {
    await page.route('**/api/admin/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Recovery token is invalid or expired.' }),
      })
    })

    await page.goto('/admin/reset-password#access_token=expired-reset-token&type=recovery')
    await page.locator('#new-password').fill('new-password')
    await page.locator('#confirm-password').fill('new-password')
    await page.getByRole('button', { name: /Update password/i }).click()

    await expect(page.locator('.admin-login-error[role="alert"]')).toContainText('Recovery token is invalid or expired.')
    await expect(page).toHaveURL(/\/admin\/reset-password/)
  })

  test('Logout returns user to login', async ({ page }) => {
    const cookieUrl = resolveWebBaseUrl()
    await page.context().addCookies([
      {
        name: 'pplus_admin_access_token',
        value: 'browser-smoke-access-token',
        url: cookieUrl,
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'pplus_admin_refresh_token',
        value: 'browser-smoke-refresh-token',
        url: cookieUrl,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    await page.goto('/admin/dashboard')
    await expect(page.locator('.admin-dashboard-sidebar')).toBeVisible()

    await page.getByRole('button', { name: /Open top account menu/i }).click()
    await page.getByRole('menuitem', { name: /Log out/i }).click()

    await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/)
    await expect(page.locator('#email')).toBeVisible()
  })
})
