import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createSupabaseServiceIdentityRepository,
  createSupabaseServiceInvitationRepository,
} from '../infra/supabase/functions/complete-athlete-invitation/runtime.js'

function json(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return JSON.stringify(payload)
    },
  }
}

test('createSupabaseServiceIdentityRepository exchanges the invited athlete password session without sending the publishable key as a bearer JWT', async () => {
  const calls = []
  const repo = createSupabaseServiceIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'sb_publishable_123',
    serviceRoleKey: 'service-role-jwt',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null,
      })

      if (parsedUrl.pathname === '/auth/v1/admin/users') {
        return json({ id: 'user-1', email: 'athlete@example.com' })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles') {
        if ((options.method || 'GET') === 'GET') {
          return json([
            {
              id: 'athlete-1',
              user_id: 'user-1',
              coach_id: null,
              first_name: 'Thomas',
              last_name: 'Thibault',
              gender: null,
              position: null,
              height_cm: null,
              weight_kg: null,
              avatar_url: null,
              status: 'pending',
            },
          ])
        }
      }

      if (parsedUrl.pathname === '/auth/v1/token') {
        return json({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        })
      }

      throw new Error(`Unexpected request: ${parsedUrl.toString()}`)
    },
  })

  const result = await repo.signUpAthleteWithInvitation({
    email: 'athlete@example.com',
    password: 'secret123',
    firstName: 'Thomas',
    lastName: 'Thibault',
  })

  assert.equal(result.session.accessToken, 'access-token')
  assert.equal(result.session.refreshToken, 'refresh-token')

  const tokenCall = calls.find((call) => call.url.includes('/auth/v1/token?grant_type=password'))
  assert.ok(tokenCall)
  assert.equal(tokenCall.headers.apikey, 'sb_publishable_123')
  assert.equal('Authorization' in tokenCall.headers, false)
})

test('createSupabaseServiceInvitationRepository does not send a one-part service secret as a bearer JWT on service-role requests', async () => {
  const calls = []
  const repo = createSupabaseServiceInvitationRepository({
    url: 'https://example.supabase.co',
    anonKey: 'sb_publishable_123',
    serviceRoleKey: 'sb_secret_456',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
        headers: options.headers || {},
      })

      return json([
        {
          id: 'invite-1',
          coach_id: 'coach-1',
          invitee_email: 'athlete@example.com',
          code_hash: 'hash-1',
          expires_at: '2026-05-18T16:30:00.000Z',
          used_at: null,
          revoked_at: null,
          sent_at: null,
          athlete_profile_id: null,
          created_by_user_id: 'user-1',
          created_at: '2026-05-11T12:00:00.000Z',
          updated_at: '2026-05-11T12:00:00.000Z',
        },
      ])
    },
  })

  await repo.getActiveInvitationByCode('7K9M2Q')

  const invitationCall = calls[0]
  assert.ok(invitationCall)
  assert.equal(invitationCall.headers.apikey, 'sb_secret_456')
  assert.equal('Authorization' in invitationCall.headers, false)
})

test('createSupabaseServiceIdentityRepository reuses an already-created invited athlete account when auth admin create returns 422', async () => {
  const calls = []
  const repo = createSupabaseServiceIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'sb_publishable_123',
    serviceRoleKey: 'sb_secret_456',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null,
      })

      if (parsedUrl.pathname === '/auth/v1/admin/users') {
        return json({ message: 'User already registered' }, 422)
      }

      if (parsedUrl.pathname === '/auth/v1/token') {
        return json({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        })
      }

      if (parsedUrl.pathname === '/auth/v1/user') {
        return json({
          id: 'user-1',
          email: 'athlete@example.com',
          user_metadata: { role: 'athlete', first_name: 'Thomas', last_name: 'Thibault' },
        })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles') {
        return json([
          {
            id: 'athlete-1',
            user_id: 'user-1',
            coach_id: null,
            first_name: 'Thomas',
            last_name: 'Thibault',
            gender: null,
            position: null,
            height_cm: null,
            weight_kg: null,
            avatar_url: null,
            status: 'pending',
          },
        ])
      }

      throw new Error(`Unexpected request: ${parsedUrl.toString()}`)
    },
  })

  const result = await repo.signUpAthleteWithInvitation({
    email: 'athlete@example.com',
    password: 'secret123',
    firstName: 'Thomas',
    lastName: 'Thibault',
  })

  assert.equal(result.user.id, 'user-1')
  assert.equal(result.athleteProfile.id, 'athlete-1')
  assert.equal(result.session.accessToken, 'access-token')
  assert.equal(result.session.refreshToken, 'refresh-token')
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/user')), true)
})

test('createSupabaseServiceIdentityRepository also reuses an already-created invited athlete account when auth admin create returns 400 bad request', async () => {
  const calls = []
  const repo = createSupabaseServiceIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'sb_publishable_123',
    serviceRoleKey: 'sb_secret_456',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null,
      })

      if (parsedUrl.pathname === '/auth/v1/admin/users') {
        return json({ error: 'Bad Request' }, 400)
      }

      if (parsedUrl.pathname === '/auth/v1/token') {
        return json({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        })
      }

      if (parsedUrl.pathname === '/auth/v1/user') {
        return json({
          id: 'user-1',
          email: 'athlete@example.com',
          user_metadata: { role: 'athlete', first_name: 'Thomas', last_name: 'Thibault' },
        })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles') {
        return json([
          {
            id: 'athlete-1',
            user_id: 'user-1',
            coach_id: null,
            first_name: 'Thomas',
            last_name: 'Thibault',
            gender: null,
            position: null,
            height_cm: null,
            weight_kg: null,
            avatar_url: null,
            status: 'pending',
          },
        ])
      }

      throw new Error(`Unexpected request: ${parsedUrl.toString()}`)
    },
  })

  const result = await repo.signUpAthleteWithInvitation({
    email: 'athlete@example.com',
    password: 'secret123',
    firstName: 'Thomas',
    lastName: 'Thibault',
  })

  assert.equal(result.user.id, 'user-1')
  assert.equal(result.athleteProfile.id, 'athlete-1')
  assert.equal(result.session.accessToken, 'access-token')
  assert.equal(result.session.refreshToken, 'refresh-token')
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/user')), true)
})

test('createSupabaseServiceIdentityRepository resets the existing invited athlete password when fallback sign-in returns invalid credentials', async () => {
  const calls = []
  let tokenAttemptCount = 0
  const repo = createSupabaseServiceIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'sb_publishable_123',
    serviceRoleKey: 'sb_secret_456',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null,
      })

      if (parsedUrl.pathname === '/auth/v1/admin/users' && (options.method || 'GET') === 'POST') {
        return json({ code: 400, error_code: 'email_exists', msg: 'User already registered' }, 400)
      }

      if (parsedUrl.pathname === '/auth/v1/token') {
        tokenAttemptCount += 1
        if (tokenAttemptCount === 1) {
          return json({ code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400)
        }
        return json({ access_token: 'access-token', refresh_token: 'refresh-token' })
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users' && (options.method || 'GET') === 'GET') {
        return json({ users: [{ id: 'user-1', email: 'athlete@example.com' }] })
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users/user-1' && (options.method || 'GET') === 'PUT') {
        return json({ id: 'user-1', email: 'athlete@example.com' })
      }

      if (parsedUrl.pathname === '/auth/v1/user') {
        return json({
          id: 'user-1',
          email: 'athlete@example.com',
          user_metadata: { role: 'athlete', first_name: 'Thomas', last_name: 'Thibault' },
        })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles') {
        return json([
          {
            id: 'athlete-1',
            user_id: 'user-1',
            coach_id: null,
            first_name: 'Thomas',
            last_name: 'Thibault',
            gender: null,
            position: null,
            height_cm: null,
            weight_kg: null,
            avatar_url: null,
            status: 'pending',
          },
        ])
      }

      throw new Error(`Unexpected request: ${parsedUrl.toString()}`)
    },
  })

  const result = await repo.signUpAthleteWithInvitation({
    email: 'athlete@example.com',
    password: 'secret123',
    firstName: 'Thomas',
    lastName: 'Thibault',
  })

  assert.equal(result.user.id, 'user-1')
  assert.equal(result.session.accessToken, 'access-token')
  assert.equal(result.session.refreshToken, 'refresh-token')
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/admin/users?email=athlete%40example.com')), true)
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/admin/users/user-1') && call.method === 'PUT'), true)
})
