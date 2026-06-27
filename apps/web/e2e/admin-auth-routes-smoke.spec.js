import { expect, test } from '@playwright/test'

import { smokeRoute } from './route-smoke.js'

export const ADMIN_AUTH_ROUTE_SMOKE_PATHS = Object.freeze([
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
])

const ADMIN_AUTH_ROUTE_EXPECTED_TEXT = Object.freeze({
  '/admin/login': /Sign in|Login|Email/i,
  '/admin/forgot-password': /Forgot|Reset|Email/i,
  '/admin/reset-password': /Reset|Password/i,
})

test.describe('PPLUS admin auth route smoke', () => {
  for (const route of ADMIN_AUTH_ROUTE_SMOKE_PATHS) {
    test(`${route} renders unauthenticated auth UI with CSS`, async ({ page }) => {
      await smokeRoute(page, route)
      await expect(page.locator('form')).toBeVisible()
      await expect(page.locator('body')).toContainText(ADMIN_AUTH_ROUTE_EXPECTED_TEXT[route])
    })
  }
})
