import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getAdminProtectedLoginRedirectUrl,
  shouldBypassAdminAuth,
} from '../apps/web/lib/admin-route-protection.js'
import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from '../apps/web/lib/admin-auth-cookies.js'

const protectedRouteExamples = [
  '/admin',
  '/admin/dashboard',
  '/admin/athletes/invites',
  '/admin/programs/program-1',
  '/admin/ui',
]

const publicAdminRouteExamples = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/support',
  '/admin/support/reference',
]

function createRequest(path, cookies = {}) {
  const nextUrl = new URL(`https://pplus.test${path}`)
  nextUrl.clone = () => new URL(nextUrl.toString())

  return {
    nextUrl,
    cookies: {
      get(name) {
        return cookies[name] ? { value: cookies[name] } : undefined
      },
    },
  }
}

test('admin protected routes build login redirects for unauthenticated users with next path preserved', () => {
  for (const path of protectedRouteExamples) {
    const request = createRequest(`${path}?tab=overview`)
    const redirectUrl = getAdminProtectedLoginRedirectUrl(request)

    assert.equal(
      redirectUrl.toString(),
      `https://pplus.test/admin/login?next=${encodeURIComponent(`${path}?tab=overview`)}`,
      `expected ${path} redirect to preserve next path`,
    )
  }
})

test('admin protected routes do not bypass auth unless the admin access token cookie is present', () => {
  for (const path of protectedRouteExamples) {
    assert.equal(shouldBypassAdminAuth(createRequest(path)), false, `expected ${path} to require auth`)
    assert.equal(
      shouldBypassAdminAuth(createRequest(path, { [PPLUS_ADMIN_ACCESS_TOKEN_COOKIE]: 'admin-token' })),
      true,
      `expected ${path} to continue when authenticated`,
    )
  }
})

test('admin auth and public support routes bypass auth without an admin cookie', () => {
  for (const path of publicAdminRouteExamples) {
    assert.equal(shouldBypassAdminAuth(createRequest(path)), true, `expected ${path} to stay public`)
  }
})
