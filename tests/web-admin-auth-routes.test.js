import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createAdminAuthRouteHandlers } from '../apps/web/lib/admin-auth-route-handlers.js'
import {
  PPLUS_ADMIN_ACCESS_TOKEN_COOKIE,
  PPLUS_ADMIN_REFRESH_TOKEN_COOKIE,
} from '../apps/web/lib/admin-auth-cookies.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function jsonRequest(path, payload) {
  return new Request(`https://admin.pplus.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

function invalidJsonRequest(path) {
  return new Request(`https://admin.pplus.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not-json',
  })
}

async function readPayload(response) {
  return response.json()
}

function setCookieHeaders(response) {
  if (response.headers.getSetCookie) return response.headers.getSetCookie()
  return response.headers.get('set-cookie')?.split(', ') ?? []
}

test('admin auth route files delegate to the shared auth route handlers', () => {
  const routePaths = [
    'apps/web/app/api/admin/auth/login/route.js',
    'apps/web/app/api/admin/auth/logout/route.js',
    'apps/web/app/api/admin/auth/forgot-password/route.js',
    'apps/web/app/api/admin/auth/reset-password/route.js',
  ]

  for (const routePath of routePaths) {
    const source = readFileSync(resolve(repoRoot, routePath), 'utf8')
    assert.match(source, /createAdminAuthRouteHandlers/)
  }
})

test('login route rejects invalid JSON with a 400', async () => {
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({ async signInAdminWithPassword() {} }),
  })

  const response = await handlers.login(invalidJsonRequest('/api/admin/auth/login'))

  assert.equal(response.status, 400)
  assert.deepEqual(await readPayload(response), { error: 'Invalid JSON request body.' })
})

test('login route rejects missing credentials before creating the Supabase repository', async () => {
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => {
      throw new Error('Repository should not be created for invalid login payloads')
    },
  })

  const response = await handlers.login(jsonRequest('/api/admin/auth/login', {
    email: '',
    password: '',
  }))

  assert.equal(response.status, 400)
  assert.deepEqual(await readPayload(response), { error: 'Email and password are required.' })
})

test('login route sets admin auth cookies and returns the admin redirect', async () => {
  const calls = []
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({
      async signInAdminWithPassword(payload) {
        calls.push(payload)
        return {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: 'user-1', email: 'coach@example.com' },
          coachProfile: { id: 'coach-1', userId: 'user-1' },
        }
      },
    }),
    nodeEnv: 'production',
  })

  const response = await handlers.login(jsonRequest('/api/admin/auth/login', {
    email: 'coach@example.com',
    password: 'secret-password',
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readPayload(response), { success: true, redirectTo: '/admin' })
  assert.deepEqual(calls, [{ email: 'coach@example.com', password: 'secret-password' }])

  const cookies = setCookieHeaders(response)
  assert.ok(cookies.some((cookie) => cookie.startsWith(`${PPLUS_ADMIN_ACCESS_TOKEN_COOKIE}=access-token`)))
  assert.ok(cookies.some((cookie) => cookie.startsWith(`${PPLUS_ADMIN_REFRESH_TOKEN_COOKIE}=refresh-token`)))
})

test('login route maps bad credentials to 401 and non-coach accounts to 403', async () => {
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({
      async signInAdminWithPassword({ email }) {
        const error = new Error(email === 'athlete@example.com' ? 'This account does not have admin access.' : 'Invalid email or password.')
        error.status = email === 'athlete@example.com' ? 403 : 401
        throw error
      },
    }),
  })

  const badCredentials = await handlers.login(jsonRequest('/api/admin/auth/login', {
    email: 'bad@example.com',
    password: 'wrong',
  }))
  assert.equal(badCredentials.status, 401)
  assert.deepEqual(await readPayload(badCredentials), { error: 'Invalid email or password.' })

  const nonCoach = await handlers.login(jsonRequest('/api/admin/auth/login', {
    email: 'athlete@example.com',
    password: 'secret-password',
  }))
  assert.equal(nonCoach.status, 403)
  assert.deepEqual(await readPayload(nonCoach), { error: 'This account does not have admin access.' })
})

test('logout route clears admin auth cookies', async () => {
  const handlers = createAdminAuthRouteHandlers({ nodeEnv: 'production' })

  const response = await handlers.logout(new Request('https://admin.pplus.test/api/admin/auth/logout', { method: 'POST' }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readPayload(response), { success: true })
  const cookies = setCookieHeaders(response)
  assert.ok(cookies.some((cookie) => cookie.startsWith(`${PPLUS_ADMIN_ACCESS_TOKEN_COOKIE}=`) && /Max-Age=0/i.test(cookie)))
  assert.ok(cookies.some((cookie) => cookie.startsWith(`${PPLUS_ADMIN_REFRESH_TOKEN_COOKIE}=`) && /Max-Age=0/i.test(cookie)))
})

test('forgot-password route sends reset email using an absolute reset URL and safe response copy', async () => {
  const calls = []
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({
      async requestPasswordReset(payload) {
        calls.push(payload)
        return { success: true }
      },
    }),
  })

  const response = await handlers.forgotPassword(jsonRequest('/api/admin/auth/forgot-password', {
    email: 'coach@example.com',
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readPayload(response), {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  })
  assert.deepEqual(calls, [{
    email: 'coach@example.com',
    redirectTo: 'https://admin.pplus.test/admin/reset-password',
  }])
})

test('forgot-password route rejects missing email before creating the Supabase repository', async () => {
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => {
      throw new Error('Repository should not be created for invalid forgot-password payloads')
    },
  })

  const response = await handlers.forgotPassword(jsonRequest('/api/admin/auth/forgot-password', {
    email: '',
  }))

  assert.equal(response.status, 400)
  assert.deepEqual(await readPayload(response), { error: 'Email is required.' })
})

test('reset-password route rejects missing payload and updates password with a recovery token', async () => {
  const calls = []
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({
      async updatePasswordWithRecoveryToken(payload) {
        calls.push(payload)
        return { success: true }
      },
    }),
  })

  const missing = await handlers.resetPassword(jsonRequest('/api/admin/auth/reset-password', {
    accessToken: '',
    password: '',
  }))
  assert.equal(missing.status, 400)
  assert.deepEqual(await readPayload(missing), { error: 'Recovery token and password are required.' })

  const response = await handlers.resetPassword(jsonRequest('/api/admin/auth/reset-password', {
    accessToken: 'recovery-access-token',
    password: 'new-secret-password',
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readPayload(response), { success: true, redirectTo: '/admin/login?passwordReset=1' })
  assert.deepEqual(calls, [{ accessToken: 'recovery-access-token', password: 'new-secret-password' }])
})
