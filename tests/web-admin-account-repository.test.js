import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminAccountRepository } from '../apps/web/lib/admin-account-repository.js'

test('admin account repository loads the authenticated admin account email', async () => {
  const repository = createAdminAccountRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'admin-access-token',
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://example.supabase.co/auth/v1/user')
      assert.equal(options.method, 'GET')
      assert.equal(options.headers.apikey, 'anon-key')
      assert.equal(options.headers.Authorization, 'Bearer admin-access-token')
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify({ id: 'user-1', email: 'coach@example.com' })
        },
      }
    },
  })

  assert.deepEqual(await repository.getCurrentAccount(), { email: 'coach@example.com' })
})

test('admin account repository patches Supabase auth email and password with the admin session token', async () => {
  const calls = []
  const repository = createAdminAccountRepository({
    supabaseUrl: 'https://example.supabase.co/',
    anonKey: 'anon-key',
    accessToken: 'admin-access-token',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify({ id: 'user-1', email: 'new-coach@example.com' })
        },
      }
    },
  })

  const result = await repository.updateCurrentAccount({
    email: ' new-coach@example.com ',
    password: 'new-secret-password',
    confirmPassword: 'new-secret-password',
  })

  assert.deepEqual(result, { email: 'new-coach@example.com' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://example.supabase.co/auth/v1/user')
  assert.equal(calls[0].options.method, 'PATCH')
  assert.equal(calls[0].options.headers.apikey, 'anon-key')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer admin-access-token')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: 'new-coach@example.com',
    password: 'new-secret-password',
  })
})

test('admin account repository rejects mismatched password confirmation before patching auth', async () => {
  const repository = createAdminAccountRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'admin-access-token',
    fetchImpl: async () => {
      throw new Error('fetch should not be called')
    },
  })

  await assert.rejects(
    () => repository.updateCurrentAccount({
      email: 'coach@example.com',
      password: 'one-password',
      confirmPassword: 'other-password',
    }),
    (error) => error.message === 'New password and confirmation must match.' && error.status === 400,
  )
})
