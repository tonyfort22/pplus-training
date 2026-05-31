import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createAdminAuthRepository,
  createAdminAuthError,
} from '../apps/web/lib/admin-auth-repository.js'

function createIdentityRepositoryFactory(instances) {
  const calls = []
  return {
    calls,
    factory(config) {
      calls.push(config)
      const next = instances.shift()
      if (!next) throw new Error('Unexpected identity repository creation')
      return next
    },
  }
}

test('createAdminAuthError exposes a safe message and status', () => {
  const error = createAdminAuthError('Nope', 403)

  assert.equal(error.message, 'Nope')
  assert.equal(error.status, 403)
})

test('signInAdminWithPassword rejects missing credentials with a 400 status', async () => {
  const repository = createAdminAuthRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    identityRepositoryFactory: () => ({}),
  })

  await assert.rejects(
    () => repository.signInAdminWithPassword({ email: '', password: '' }),
    (error) => error.message === 'Email and password are required.' && error.status === 400,
  )
})

test('signInAdminWithPassword signs in, verifies the current user coach profile, and returns the session', async () => {
  const signInRepository = {
    async signInWithPassword(credentials) {
      assert.deepEqual(credentials, {
        email: 'coach@example.com',
        password: 'secret-password',
      })
      return {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }
    },
  }
  const sessionRepository = {
    async getCurrentUser() {
      return { id: 'user-1', email: 'coach@example.com' }
    },
    async getCoachProfileByUserId(userId) {
      assert.equal(userId, 'user-1')
      return { id: 'coach-1', userId: 'user-1', displayName: 'Coach One' }
    },
  }
  const { calls, factory } = createIdentityRepositoryFactory([signInRepository, sessionRepository])
  const repository = createAdminAuthRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    identityRepositoryFactory: factory,
  })

  const session = await repository.signInAdminWithPassword({
    email: 'coach@example.com',
    password: 'secret-password',
  })

  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'https://example.supabase.co')
  assert.equal(calls[0].anonKey, 'anon-key')
  assert.equal(calls[1].accessToken, 'access-token')
  assert.deepEqual(session, {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 'user-1', email: 'coach@example.com' },
    coachProfile: { id: 'coach-1', userId: 'user-1', displayName: 'Coach One' },
  })
})

test('signInAdminWithPassword maps Supabase bad credential responses to a safe 401', async () => {
  const repository = createAdminAuthRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    identityRepositoryFactory: () => ({
      async signInWithPassword() {
        throw new Error('Supabase identity request failed (400): Bad Request')
      },
    }),
  })

  await assert.rejects(
    () => repository.signInAdminWithPassword({ email: 'coach@example.com', password: 'wrong-password' }),
    (error) => error.message === 'Invalid email or password.' && error.status === 401,
  )
})

test('signInAdminWithPassword rejects a signed-in user without a coach profile', async () => {
  const { factory } = createIdentityRepositoryFactory([
    {
      async signInWithPassword() {
        return { accessToken: 'access-token', refreshToken: 'refresh-token' }
      },
    },
    {
      async getCurrentUser() {
        return { id: 'user-1', email: 'athlete@example.com' }
      },
      async getCoachProfileByUserId() {
        return null
      },
    },
  ])
  const repository = createAdminAuthRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    identityRepositoryFactory: factory,
  })

  await assert.rejects(
    () => repository.signInAdminWithPassword({ email: 'athlete@example.com', password: 'secret-password' }),
    (error) => error.message === 'This account does not have admin access.' && error.status === 403,
  )
})

test('requestPasswordReset sends a recovery email with the reset redirect URL', async () => {
  const calls = []
  const repository = createAdminAuthRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    identityRepositoryFactory: () => ({
      async resetPasswordForEmail(payload) {
        calls.push(payload)
        return { success: true }
      },
    }),
  })

  const result = await repository.requestPasswordReset({
    email: 'coach@example.com',
    redirectTo: 'https://admin.pplus.test/admin/reset-password',
  })

  assert.deepEqual(calls, [
    {
      email: 'coach@example.com',
      redirectTo: 'https://admin.pplus.test/admin/reset-password',
    },
  ])
  assert.deepEqual(result, { success: true })
})

test('updatePasswordWithRecoveryToken patches Supabase auth user password with the recovery access token', async () => {
  const calls = []
  const repository = createAdminAuthRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify({ id: 'user-1' })
        },
      }
    },
  })

  const result = await repository.updatePasswordWithRecoveryToken({
    accessToken: 'recovery-access-token',
    password: 'new-secret-password',
  })

  assert.deepEqual(result, { success: true })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://example.supabase.co/auth/v1/user')
  assert.equal(calls[0].options.method, 'PATCH')
  assert.equal(calls[0].options.headers.apikey, 'anon-key')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer recovery-access-token')
  assert.deepEqual(JSON.parse(calls[0].options.body), { password: 'new-secret-password' })
})
