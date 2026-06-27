import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createAdminAuthRouteHandlers } from '../apps/web/lib/admin-auth-route-handlers.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const safeForgotPasswordPayload = {
  success: true,
  message: 'If an account exists for that email, a reset link has been sent.',
}

function forgotPasswordRequest(body, url = 'https://admin.pplus.test/api/admin/auth/forgot-password') {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function readJson(response) {
  return response.json()
}

test('forgot-password route file delegates POST requests to the shared admin auth handler', () => {
  const source = readFileSync(resolve(repoRoot, 'apps/web/app/api/admin/auth/forgot-password/route.js'), 'utf8')

  assert.match(source, /createAdminAuthRouteHandlers/)
  assert.match(source, /export async function POST\(request\)/)
  assert.match(source, /return handlers\.forgotPassword\(request\)/)
})

test('forgot-password API returns the same safe response for accepted reset requests', async () => {
  const calls = []
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({
      async requestPasswordReset(payload) {
        calls.push(payload)
        return { success: true }
      },
    }),
  })

  const response = await handlers.forgotPassword(forgotPasswordRequest({ email: 'coach@example.com' }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), safeForgotPasswordPayload)
  assert.deepEqual(calls, [{
    email: 'coach@example.com',
    redirectTo: 'https://admin.pplus.test/admin/reset-password',
  }])
})

test('forgot-password API does not enumerate accounts when reset delivery fails', async () => {
  const calls = []
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => ({
      async requestPasswordReset(payload) {
        calls.push(payload)
        const error = new Error('No user found with this email.')
        error.status = 404
        throw error
      },
    }),
  })

  const response = await handlers.forgotPassword(forgotPasswordRequest({ email: 'missing@example.com' }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), safeForgotPasswordPayload)
  assert.deepEqual(calls, [{
    email: 'missing@example.com',
    redirectTo: 'https://admin.pplus.test/admin/reset-password',
  }])
})

test('forgot-password API still rejects invalid payloads before repository access', async () => {
  const handlers = createAdminAuthRouteHandlers({
    createRepository: () => {
      throw new Error('repository should not be created for invalid forgot-password payloads')
    },
  })

  const response = await handlers.forgotPassword(forgotPasswordRequest({ email: '' }))

  assert.equal(response.status, 400)
  assert.deepEqual(await readJson(response), { error: 'Email is required.' })
}
)
