import { test } from '@playwright/test'

import { assertUnauthenticatedRedirectToLogin } from './unauthenticated-redirect.js'

export const ADMIN_PRODUCT_ROUTE_SMOKE_PATHS = Object.freeze([
  '/admin/athletes',
  '/admin/athletes/invites',
  '/admin/athletes/groups',
  '/admin/athletes/rankings',
  '/admin/programs',
  '/admin/programs/:programId',
  '/admin/workouts',
  '/admin/workouts/calendar',
  '/admin/exercises',
])

function resolveAdminProductRoute(routeTemplate) {
  if (routeTemplate === '/admin/programs/:programId') {
    return '/admin/programs/program-1'
  }

  return routeTemplate
}

test.describe('PPLUS admin product route smoke', () => {
  for (const routeTemplate of ADMIN_PRODUCT_ROUTE_SMOKE_PATHS) {
    test(`${routeTemplate} redirects unauthenticated users to login with CSS`, async ({ page }) => {
      const route = resolveAdminProductRoute(routeTemplate)

      await assertUnauthenticatedRedirectToLogin(page, route)
    })
  }
})
