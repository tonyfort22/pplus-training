import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createAdminAuthRouteHandlers } from '../apps/web/lib/admin-auth-route-handlers.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function resetPasswordRequest(body) {
  return new Request('https://admin.pplus.test/api/admin/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function readJson(response) {
  return response.json()
}

test('reset-password route file delegates POST requests to the shared admin auth handler', () => {
  const source = readFileSync(resolve(repoRoot, 'apps/web/app/api/admin/auth/reset-password/route.js'), 'utf8')

  assert.match(source, /createAdminAuthRouteHandlers/)
  assert.match(source, /export async function POST\(request\)/)
  assert.match(source, /return handlers\.resetPassword\(request\)/)
})

test('reset-password API rejects missing recovery payload before repository access', async () => {
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => {
      throw new Error('repository should not be created for missing reset-password payloads')
    },
  })

  const missingToken = await handlers.resetPassword(resetPasswordRequest({ accessToken: '', password: 'new-secret-password' }))
  const missingPassword = await handlers.resetPassword(resetPasswordRequest({ accessToken: 'recovery-token', password: '' }))

  assert.equal(missingToken.status, 400)
  assert.deepEqual(await readJson(missingToken), { error: 'Recovery token and password are required.' })
  assert.equal(missingPassword.status, 400)
  assert.deepEqual(await readJson(missingPassword), { error: 'Recovery token and password are required.' })
})

test('reset-password API rejects invalid short passwords before repository access', async () => {
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => {
      throw new Error('repository should not be created for invalid reset-password payloads')
    },
  })

  const response = await handlers.resetPassword(resetPasswordRequest({ accessToken: 'recovery-token', password: '12345' }))

  assert.equal(response.status, 400)
  assert.deepEqual(await readJson(response), { error: 'Password must be at least 6 characters.' })
})

test('reset-password API maps invalid recovery tokens without reporting success', async () => {
  const calls = []
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({
      async updatePasswordWithRecoveryToken(payload) {
        calls.push(payload)
        const error = new Error('Recovery token is invalid or expired.')
        error.status = 401
        throw error
      },
    }),
  })

  const response = await handlers.resetPassword(resetPasswordRequest({ accessToken: 'expired-token', password: 'new-secret-password' }))

  assert.equal(response.status, 401)
  assert.deepEqual(await readJson(response), { error: 'Recovery token is invalid or expired.' })
  assert.deepEqual(calls, [{ accessToken: 'expired-token', password: 'new-secret-password' }])
})

test('reset-password API updates the password and returns the login redirect on success', async () => {
  const calls = []
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({
      async updatePasswordWithRecoveryToken(payload) {
        calls.push(payload)
        return { success: true }
      },
    }),
  })

  const response = await handlers.resetPassword(resetPasswordRequest({ accessToken: 'recovery-token', password: 'new-secret-password' }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), { success: true, redirectTo: '/admin/login?passwordReset=1' })
  assert.deepEqual(calls, [{ accessToken: 'recovery-token', password: 'new-secret-password' }])
})

test('reset-password client form covers missing token, mismatch, invalid, and success UI states', () => {
  const formSource = readFileSync(resolve(repoRoot, 'apps/web/components/admin/admin-reset-password-form.jsx'), 'utf8')

  assert.match(formSource, /setError\(resetCopy\.missingToken\)/)
  assert.match(formSource, /password\.length < 6[\s\S]*setError\(resetCopy\.tooShort\)/)
  assert.match(formSource, /password !== confirmPassword[\s\S]*setError\(resetCopy\.mismatch\)/)
  assert.match(formSource, /throw new Error\(payload\?\.error \|\| resetCopy\.error\)/)
  assert.match(formSource, /window\.history\.replaceState\(null, '', window\.location\.pathname \+ window\.location\.search\)/)
  assert.match(formSource, /window\.location\.assign\(payload\.redirectTo \|\| '\/admin\/login\?passwordReset=1'\)/)
})
