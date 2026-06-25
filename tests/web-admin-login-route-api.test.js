import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminAuthRouteHandlers } from '../apps/web/lib/admin-auth-route-handlers.js'
import {
  PPLUS_ADMIN_ACCESS_TOKEN_COOKIE,
  PPLUS_ADMIN_REFRESH_TOKEN_COOKIE,
} from '../apps/web/lib/admin-auth-cookies.js'

function jsonRequest(payload) {
  return new Request('https://admin.pplus.test/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

async function readJson(response) {
  return response.json()
}

function getSetCookieHeaders(response) {
  if (response.headers.getSetCookie) return response.headers.getSetCookie()
  return response.headers.get('set-cookie')?.split(/,\s*(?=[^;,]+=)/) ?? []
}

function findCookie(cookies, name) {
  return cookies.find((cookie) => cookie.startsWith(`${name}=`)) || ''
}

test('login API returns success payload and production-shaped admin auth cookies', async () => {
  const signInCalls = []
  const handlers = createAdminAuthRouteHandlers({
    nodeEnv: 'production',
    createRepository: () => ({
      async signInAdminWithPassword(payload) {
        signInCalls.push(payload)
        return {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          user: { id: 'user-1', email: 'coach@example.com' },
          coachProfile: { id: 'coach-1', userId: 'user-1' },
        }
      },
    }),
  })

  const response = await handlers.login(jsonRequest({
    email: 'coach@example.com',
    password: 'correct-password',
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), { success: true, redirectTo: '/admin' })
  assert.deepEqual(signInCalls, [{ email: 'coach@example.com', password: 'correct-password' }])

  const cookies = getSetCookieHeaders(response)
  assert.equal(cookies.length, 2)

  const accessCookie = findCookie(cookies, PPLUS_ADMIN_ACCESS_TOKEN_COOKIE)
  assert.match(accessCookie, new RegExp(`^${PPLUS_ADMIN_ACCESS_TOKEN_COOKIE}=access-token-123;`))
  assert.match(accessCookie, /Path=\//)
  assert.match(accessCookie, /HttpOnly/)
  assert.match(accessCookie, /SameSite=Lax/)
  assert.match(accessCookie, /Max-Age=3600/)
  assert.match(accessCookie, /Secure/)

  const refreshCookie = findCookie(cookies, PPLUS_ADMIN_REFRESH_TOKEN_COOKIE)
  assert.match(refreshCookie, new RegExp(`^${PPLUS_ADMIN_REFRESH_TOKEN_COOKIE}=refresh-token-456;`))
  assert.match(refreshCookie, /Path=\//)
  assert.match(refreshCookie, /HttpOnly/)
  assert.match(refreshCookie, /SameSite=Lax/)
  assert.match(refreshCookie, /Max-Age=2592000/)
  assert.match(refreshCookie, /Secure/)
})

test('login API maps credential failures and clears stale admin auth cookies', async () => {
  const handlers = createAdminAuthRouteHandlers({
    nodeEnv: 'production',
    createRepository: () => ({
      async signInAdminWithPassword() {
        const error = new Error('Invalid email or password.')
        error.status = 401
        throw error
      },
    }),
  })

  const response = await handlers.login(jsonRequest({
    email: 'coach@example.com',
    password: 'wrong-password',
  }))

  assert.equal(response.status, 401)
  assert.deepEqual(await readJson(response), { error: 'Invalid email or password.' })

  const cookies = getSetCookieHeaders(response)
  assert.equal(cookies.length, 2)
  assert.match(findCookie(cookies, PPLUS_ADMIN_ACCESS_TOKEN_COOKIE), /Max-Age=0/)
  assert.match(findCookie(cookies, PPLUS_ADMIN_REFRESH_TOKEN_COOKIE), /Max-Age=0/)
})

test('login API rejects missing credentials before repository access and clears stale auth cookies', async () => {
  const handlers = createAdminAuthRouteHandlers({
    nodeEnv: 'production',
    createRepository: () => {
      throw new Error('repository should not be created for invalid login payloads')
    },
  })

  const response = await handlers.login(jsonRequest({ email: '', password: '' }))

  assert.equal(response.status, 400)
  assert.deepEqual(await readJson(response), { error: 'Email and password are required.' })

  const cookies = getSetCookieHeaders(response)
  assert.equal(cookies.length, 2)
  assert.match(findCookie(cookies, PPLUS_ADMIN_ACCESS_TOKEN_COOKIE), /Max-Age=0/)
  assert.match(findCookie(cookies, PPLUS_ADMIN_REFRESH_TOKEN_COOKIE), /Max-Age=0/)
})
