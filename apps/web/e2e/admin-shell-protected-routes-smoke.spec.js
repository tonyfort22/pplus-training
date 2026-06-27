import { test } from '@playwright/test'

import { assertUnauthenticatedRedirectToLogin } from './unauthenticated-redirect.js'

export const ADMIN_SHELL_PROTECTED_ROUTE_SMOKE_PATHS = Object.freeze([
  '/admin',
  '/admin/dashboard',
  '/admin/athletes/invites',
  '/admin/ui',
])

test.describe('PPLUS admin shell protected route smoke', () => {
  for (const route of ADMIN_SHELL_PROTECTED_ROUTE_SMOKE_PATHS) {
    test(`${route} redirects unauthenticated users to login with CSS`, async ({ page }) => {
      await assertUnauthenticatedRedirectToLogin(page, route)
    })
  }
})
