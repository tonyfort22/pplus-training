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

test('admin account repository verifies the current password before patching a new password', async () => {
  const calls = []
  const repository = createAdminAccountRepository({
    supabaseUrl: 'https://example.supabase.co/',
    anonKey: 'anon-key',
    accessToken: 'admin-access-token',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      if (url.endsWith('/auth/v1/token?grant_type=password')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          async text() {
            return JSON.stringify({ access_token: 'reauth-token' })
          },
        }
      }
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
    currentPassword: 'old-secret-password',
    password: 'new-secret-password',
    confirmPassword: 'new-secret-password',
  })

  assert.deepEqual(result, { email: 'new-coach@example.com' })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'https://example.supabase.co/auth/v1/token?grant_type=password')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers.apikey, 'anon-key')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: 'new-coach@example.com',
    password: 'old-secret-password',
  })
  assert.equal(calls[1].url, 'https://example.supabase.co/auth/v1/user')
  assert.equal(calls[1].options.method, 'PATCH')
  assert.equal(calls[1].options.headers.apikey, 'anon-key')
  assert.equal(calls[1].options.headers.Authorization, 'Bearer admin-access-token')
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    email: 'new-coach@example.com',
    password: 'new-secret-password',
  })
})

test('admin account repository rejects new password updates without the current password', async () => {
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
      password: 'new-secret-password',
      confirmPassword: 'new-secret-password',
    }),
    (error) => error.message === 'Current password is required to set a new password.' && error.status === 400,
  )
})

test('admin account repository maps bad current password verification to a safe error', async () => {
  const repository = createAdminAccountRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'admin-access-token',
    fetchImpl: async (url) => {
      assert.match(url, /\/auth\/v1\/token\?grant_type=password$/)
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        async text() {
          return JSON.stringify({ error_description: 'Invalid login credentials' })
        },
      }
    },
  })

  await assert.rejects(
    () => repository.updateCurrentAccount({
      email: 'coach@example.com',
      currentPassword: 'wrong-password',
      password: 'new-secret-password',
      confirmPassword: 'new-secret-password',
    }),
    (error) => error.message === 'Current password is incorrect.' && error.status === 401,
  )
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
