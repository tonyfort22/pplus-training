import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminAthleteRepository } from '../apps/web/lib/admin-athlete-repository.js'

function json(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return JSON.stringify(payload)
    },
    async json() {
      return payload
    },
  }
}

test('createAdminAthleteRepository creates an auth athlete account, patches the provisioned athlete profile, and reuses the invitation service', async () => {
  const calls = []
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    createTemporaryPassword: () => 'TempPassword123!',
    invitationServiceFactory({ invitationRepository, loopsClient }) {
      calls.push({ type: 'invitationServiceFactory', invitationRepositoryType: typeof invitationRepository?.createAthleteInvitation, loopsClientType: typeof loopsClient?.sendTransactionalEmail })
      return {
        async sendAthleteInvitation(payload) {
          calls.push({ type: 'sendAthleteInvitation', payload })
          return {
            invitation: {
              id: 'invite-1',
              inviteeEmail: payload.inviteeEmail,
              athleteProfileId: payload.athleteProfileId,
            },
            inviteCode: '7K9M2Q',
            loopsResponse: { success: true },
          }
        },
      }
    },
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ type: 'fetch', url: parsedUrl.toString(), method, body, headers: options.headers || {} })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && method === 'GET') {
        return json([
          {
            id: 'coach-1',
            user_id: 'coach-user-1',
            first_name: 'Anthony',
            last_name: 'Fortugno',
          },
        ])
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users' && method === 'POST') {
        return json({
          id: 'auth-athlete-1',
          email: body.email,
          user_metadata: body.user_metadata,
        })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'GET' && parsedUrl.searchParams.get('user_id') === 'eq.auth-athlete-1') {
        return json([
          {
            id: 'athlete-1',
            user_id: 'auth-athlete-1',
            coach_id: 'coach-1',
            first_name: 'Thomas',
            last_name: 'Thibault',
            date_of_birth: null,
            gender: null,
            position: null,
            height_cm: null,
            weight_kg: null,
            avatar_url: '',
            status: 'inactive',
            created_at: '2026-05-11T16:30:01.000Z',
          },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'PATCH' && parsedUrl.searchParams.get('id') === 'eq.athlete-1') {
        return json([
          {
            id: 'athlete-1',
            user_id: 'auth-athlete-1',
            coach_id: body.coach_id,
            first_name: body.first_name,
            last_name: body.last_name,
            date_of_birth: body.date_of_birth,
            gender: body.gender,
            position: body.position,
            height_cm: body.height_cm,
            weight_kg: body.weight_kg,
            avatar_url: body.avatar_url,
            status: body.status,
            created_at: '2026-05-11T16:30:01.000Z',
          },
        ])
      }

      throw new Error(`Unexpected admin athlete request: ${method} ${parsedUrl.toString()}`)
    },
  })

  const createdAthlete = await repo.createAthlete({
    firstName: 'Thomas',
    lastName: 'Thibault',
    dateOfBirth: '2008-04-21',
    gender: 'male',
    position: 'forward',
    heightCm: 180,
    weightKg: 84,
    avatarUrl: '',
    sendInvite: true,
    inviteeEmail: ' Athlete@Example.com ',
  })

  assert.equal(createdAthlete.id, 'athlete-1')
  assert.equal(createdAthlete.firstName, 'Thomas')
  assert.equal(createdAthlete.lastName, 'Thibault')
  assert.equal(createdAthlete.name, 'Thomas Thibault')
  assert.equal(createdAthlete.inviteeEmail, 'athlete@example.com')
  assert.equal(createdAthlete.invitation.id, 'invite-1')

  const authCreateCall = calls.find((call) => call.type === 'fetch' && call.url.includes('/auth/v1/admin/users') && call.method === 'POST')
  assert.ok(authCreateCall)
  assert.equal(authCreateCall.headers.apikey, 'service-role-key')
  assert.equal(authCreateCall.headers.Authorization, 'Bearer service-role-key')
  assert.deepEqual(authCreateCall.body, {
    email: 'athlete@example.com',
    password: 'TempPassword123!',
    email_confirm: true,
    user_metadata: {
      role: 'athlete',
      first_name: 'Thomas',
      last_name: 'Thibault',
    },
  })

  const patchCall = calls.find((call) => call.type === 'fetch' && call.url.includes('/rest/v1/athlete_profiles') && call.method === 'PATCH')
  assert.ok(patchCall)
  assert.deepEqual(patchCall.body, {
    coach_id: 'coach-1',
    first_name: 'Thomas',
    last_name: 'Thibault',
    date_of_birth: '2008-04-21',
    gender: 'male',
    position: 'forward',
    height_cm: 180,
    weight_kg: 84,
    avatar_url: null,
    status: 'inactive',
    updated_at: '2026-05-11T16:30:00.000Z',
  })

  const invitationSendCall = calls.find((call) => call.type === 'sendAthleteInvitation')
  assert.ok(invitationSendCall)
  assert.deepEqual(invitationSendCall.payload, {
    coachId: 'coach-1',
    athleteProfileId: 'athlete-1',
    inviteeEmail: 'athlete@example.com',
    coachFirstName: 'Anthony',
    coachLastName: 'Fortugno',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    expiresAt: '2026-05-18T16:30:00.000Z',
    createdByUserId: 'coach-user-1',
  })
})

test('createAdminAthleteRepository still requires a real invite email when sending an invitation immediately', async () => {
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    fetchImpl: async () => json([]),
  })

  await assert.rejects(
    () => repo.createAthlete({
      firstName: 'Thomas',
      lastName: 'Thibault',
      sendInvite: true,
      inviteeEmail: '   ',
    }),
    /Invite email is required when sending an athlete invitation\./,
  )
})





test('createAdminAthleteRepository creates an inactive athlete account with a placeholder auth email when sendInvite is false and no email is provided', async () => {
  const calls = []
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    createTemporaryPassword: () => 'TempPassword123!',
    createPlaceholderEmail: ({ firstName, lastName }) => `placeholder+${firstName.toLowerCase()}-${lastName.toLowerCase()}@pplushockey.local`,
    invitationServiceFactory() {
      return {
        async sendAthleteInvitation() {
          calls.push({ type: 'sendAthleteInvitation' })
          return { invitation: { id: 'invite-should-not-send' } }
        },
      }
    },
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ type: 'fetch', url: parsedUrl.toString(), method, body, headers: options.headers || {} })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && method === 'GET') {
        return json([{ id: 'coach-1', user_id: 'coach-user-1', first_name: 'Anthony', last_name: 'Fortugno' }])
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users' && method === 'POST') {
        return json({ id: 'auth-athlete-placeholder', email: body.email, user_metadata: body.user_metadata })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'GET' && parsedUrl.searchParams.get('user_id') === 'eq.auth-athlete-placeholder') {
        return json([{ id: 'athlete-placeholder', user_id: 'auth-athlete-placeholder', coach_id: 'coach-1', first_name: 'Later', last_name: 'Invite', date_of_birth: null, gender: null, position: null, height_cm: null, weight_kg: null, avatar_url: '', status: 'inactive', created_at: '2026-05-11T16:30:01.000Z' }])
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'PATCH' && parsedUrl.searchParams.get('id') === 'eq.athlete-placeholder') {
        return json([{ id: 'athlete-placeholder', user_id: 'auth-athlete-placeholder', coach_id: body.coach_id, first_name: body.first_name, last_name: body.last_name, date_of_birth: body.date_of_birth, gender: body.gender, position: body.position, height_cm: body.height_cm, weight_kg: body.weight_kg, avatar_url: body.avatar_url, status: body.status, created_at: '2026-05-11T16:30:01.000Z' }])
      }

      throw new Error(`Unexpected placeholder-create request: ${method} ${parsedUrl.toString()}`)
    },
  })

  const createdAthlete = await repo.createAthlete({
    firstName: 'Later',
    lastName: 'Invite',
    dateOfBirth: '2009-08-12',
    gender: 'male',
    position: 'defense',
    heightCm: 176,
    weightKg: 72,
    avatarUrl: '',
    sendInvite: false,
    inviteeEmail: '',
  })

  assert.equal(createdAthlete.id, 'athlete-placeholder')
  assert.equal(createdAthlete.status, 'Inactive')
  assert.equal(createdAthlete.hasInvite, false)
  assert.equal(createdAthlete.inviteeEmail, 'placeholder+later-invite@pplushockey.local')
  const authCreateCall = calls.find((call) => call.type === 'fetch' && call.url.includes('/auth/v1/admin/users') && call.method === 'POST')
  assert.equal(authCreateCall.body.email, 'placeholder+later-invite@pplushockey.local')
  assert.equal(calls.some((call) => call.type === 'sendAthleteInvitation'), false)
})

test('createAdminAthleteRepository creates an inactive athlete account without sending an invite when sendInvite is false', async () => {
  const calls = []
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    createTemporaryPassword: () => 'TempPassword123!',
    invitationServiceFactory() {
      return {
        async sendAthleteInvitation() {
          calls.push({ type: 'sendAthleteInvitation' })
          return { invitation: { id: 'invite-should-not-send' } }
        },
      }
    },
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ type: 'fetch', url: parsedUrl.toString(), method, body, headers: options.headers || {} })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && method === 'GET') {
        return json([
          {
            id: 'coach-1',
            user_id: 'coach-user-1',
            first_name: 'Anthony',
            last_name: 'Fortugno',
          },
        ])
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users' && method === 'POST') {
        return json({
          id: 'auth-athlete-2',
          email: body.email,
          user_metadata: body.user_metadata,
        })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'GET' && parsedUrl.searchParams.get('user_id') === 'eq.auth-athlete-2') {
        return json([
          {
            id: 'athlete-2',
            user_id: 'auth-athlete-2',
            coach_id: 'coach-1',
            first_name: 'Later',
            last_name: 'Invite',
            date_of_birth: null,
            gender: null,
            position: null,
            height_cm: null,
            weight_kg: null,
            avatar_url: '',
            status: 'inactive',
            created_at: '2026-05-11T16:30:01.000Z',
          },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'PATCH' && parsedUrl.searchParams.get('id') === 'eq.athlete-2') {
        return json([
          {
            id: 'athlete-2',
            user_id: 'auth-athlete-2',
            coach_id: body.coach_id,
            first_name: body.first_name,
            last_name: body.last_name,
            date_of_birth: body.date_of_birth,
            gender: body.gender,
            position: body.position,
            height_cm: body.height_cm,
            weight_kg: body.weight_kg,
            avatar_url: body.avatar_url,
            status: body.status,
            created_at: '2026-05-11T16:30:01.000Z',
          },
        ])
      }

      throw new Error(`Unexpected inactive-create request: ${method} ${parsedUrl.toString()}`)
    },
  })

  const createdAthlete = await repo.createAthlete({
    firstName: 'Later',
    lastName: 'Invite',
    dateOfBirth: '2009-08-12',
    gender: 'male',
    position: 'defense',
    heightCm: 176,
    weightKg: 72,
    avatarUrl: '',
    sendInvite: false,
    inviteeEmail: ' later@example.com ',
  })

  assert.equal(createdAthlete.id, 'athlete-2')
  assert.equal(createdAthlete.status, 'Inactive')
  assert.equal(createdAthlete.inviteeEmail, 'later@example.com')
  assert.equal(createdAthlete.hasInvite, false)
  assert.equal(createdAthlete.invitation ?? null, null)
  assert.equal(calls.some((call) => call.type === 'sendAthleteInvitation'), false)
  assert.equal(calls.some((call) => String(call.url || '').includes('/rest/v1/athlete_invitations')), false)
})

test('createAdminAthleteRepository sends a later invite for an existing inactive athlete account', async () => {
  const calls = []
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    loopsTransactionalId: 'cmp2cx45l1r470iylhx75mg84',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsedUrl.toString(), method, body, headers: options.headers || {} })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && method === 'GET') {
        return json([{ id: 'coach-1', user_id: 'coach-user-1', first_name: 'Anthony', last_name: 'Fortugno' }])
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'GET' && parsedUrl.searchParams.get('id') === 'eq.athlete-2') {
        return json([
          {
            id: 'athlete-2',
            user_id: 'auth-athlete-2',
            coach_id: 'coach-1',
            first_name: 'Later',
            last_name: 'Invite',
            date_of_birth: '2009-08-12',
            gender: 'male',
            position: 'defense',
            height_cm: 176,
            weight_kg: 72,
            avatar_url: '',
            status: 'inactive',
            created_at: '2026-05-11T16:30:01.000Z',
          },
        ])
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users/auth-athlete-2' && method === 'GET') {
        return json({
          id: 'auth-athlete-2',
          email: 'later@example.com',
          user_metadata: { role: 'athlete' },
        })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_invitations' && method === 'PATCH') {
        return json([])
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_invitations' && method === 'POST') {
        return json([
          {
            id: 'invite-3',
            coach_id: body.coach_id,
            athlete_profile_id: body.athlete_profile_id,
            invitee_email: body.invitee_email,
            code_hash: body.code_hash,
            expires_at: body.expires_at,
            used_at: null,
            revoked_at: null,
            sent_at: body.sent_at,
            created_by_user_id: body.created_by_user_id,
            created_at: '2026-05-11T16:30:00.000Z',
          },
        ])
      }

      if (parsedUrl.origin === 'https://app.loops.so' && parsedUrl.pathname === '/api/v1/transactional' && method === 'POST') {
        return json({ success: true })
      }

      throw new Error(`Unexpected send-later request: ${method} ${parsedUrl.toString()}`)
    },
  })

  const invitedAthlete = await repo.sendAthleteInvite({ athleteId: 'athlete-2' })

  assert.equal(invitedAthlete.id, 'athlete-2')
  assert.equal(invitedAthlete.inviteeEmail, 'later@example.com')
  assert.equal(invitedAthlete.hasInvite, true)
  assert.equal(invitedAthlete.invitation.id, 'invite-3')

  const authLookupCall = calls.find((call) => call.url.includes('/auth/v1/admin/users/auth-athlete-2'))
  assert.ok(authLookupCall)
  assert.equal(authLookupCall.headers.Authorization, 'Bearer service-role-key')

  const loopsCall = calls.find((call) => call.url === 'https://app.loops.so/api/v1/transactional')
  assert.ok(loopsCall)
  assert.equal(loopsCall.body.email, 'later@example.com')
  assert.equal(loopsCall.body.dataVariables.coachDisplayName, 'Anthony Fortugno')
})

test('createAdminAthleteRepository reuses an existing pending invited athlete account, revokes stale invites, and sends a fresh invite', async () => {
  const calls = []
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    loopsTransactionalId: 'cmp2cx45l1r470iylhx75mg84',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    createTemporaryPassword: () => 'TempPassword123!',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsedUrl.toString(), method, body, headers: options.headers || {} })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && method === 'GET') {
        return json([{ id: 'coach-1', user_id: 'coach-user-1', first_name: 'Anthony', last_name: 'Fortugno' }])
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users' && method === 'POST') {
        return json({ error: 'User already registered', msg: 'A user with this email address has already been registered' }, 422)
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users' && method === 'GET') {
        return json({
          users: [
            {
              id: 'auth-athlete-existing',
              email: 'athlete@example.com',
              user_metadata: { role: 'athlete' },
            },
          ],
        })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'GET' && parsedUrl.searchParams.get('user_id') === 'eq.auth-athlete-existing') {
        return json([
          {
            id: 'athlete-1',
            user_id: 'auth-athlete-existing',
            coach_id: 'coach-1',
            first_name: 'Old',
            last_name: 'Name',
            date_of_birth: null,
            gender: null,
            position: null,
            height_cm: null,
            weight_kg: null,
            avatar_url: '',
            status: 'inactive',
            created_at: '2026-05-10T16:30:00.000Z',
          },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'PATCH' && parsedUrl.searchParams.get('id') === 'eq.athlete-1') {
        return json([
          {
            id: 'athlete-1',
            user_id: 'auth-athlete-existing',
            coach_id: body.coach_id,
            first_name: body.first_name,
            last_name: body.last_name,
            date_of_birth: body.date_of_birth,
            gender: body.gender,
            position: body.position,
            height_cm: body.height_cm,
            weight_kg: body.weight_kg,
            avatar_url: body.avatar_url,
            status: body.status,
            created_at: '2026-05-10T16:30:00.000Z',
          },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_invitations' && method === 'PATCH') {
        return json([])
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_invitations' && method === 'POST') {
        return json([
          {
            id: 'invite-2',
            coach_id: body.coach_id,
            athlete_profile_id: body.athlete_profile_id,
            invitee_email: body.invitee_email,
            code_hash: body.code_hash,
            expires_at: body.expires_at,
            used_at: null,
            revoked_at: null,
            sent_at: body.sent_at,
            created_by_user_id: body.created_by_user_id,
            created_at: '2026-05-11T16:30:00.000Z',
          },
        ])
      }

      if (parsedUrl.origin === 'https://app.loops.so' && parsedUrl.pathname === '/api/v1/transactional' && method === 'POST') {
        return json({ success: true })
      }

      throw new Error(`Unexpected duplicate-invite request: ${method} ${parsedUrl.toString()}`)
    },
  })

  const createdAthlete = await repo.createAthlete({
    firstName: 'Thomas',
    lastName: 'Thibault',
    dateOfBirth: '2008-04-21',
    gender: 'male',
    position: 'forward',
    heightCm: 180,
    weightKg: 84,
    avatarUrl: '',
    sendInvite: true,
    inviteeEmail: ' Athlete@Example.com ',
  })

  assert.equal(createdAthlete.id, 'athlete-1')
  assert.equal(createdAthlete.inviteeEmail, 'athlete@example.com')
  assert.equal(createdAthlete.invitation.id, 'invite-2')

  assert.equal(calls.some((call) => call.url.includes('/auth/v1/admin/users?email=athlete%40example.com') && call.method === 'GET'), true)

  const revokeCall = calls.find((call) => call.url.includes('/rest/v1/athlete_invitations') && call.method === 'PATCH')
  assert.ok(revokeCall)
  assert.equal(revokeCall.url.includes('invitee_email=eq.athlete%40example.com'), true)
  assert.equal(revokeCall.url.includes('used_at=is.null'), true)
  assert.equal(revokeCall.url.includes('revoked_at=is.null'), true)
  assert.deepEqual(revokeCall.body, {
    revoked_at: '2026-05-11T16:30:00.000Z',
    updated_at: '2026-05-11T16:30:00.000Z',
  })

  const loopsCall = calls.find((call) => call.url === 'https://app.loops.so/api/v1/transactional')
  assert.ok(loopsCall)
  assert.equal(loopsCall.body.email, 'athlete@example.com')
  assert.equal(loopsCall.body.dataVariables.coachDisplayName, 'Anthony Fortugno')
})



test('createAdminAthleteRepository sendAthleteInvite updates a placeholder auth email to the provided real email before sending', async () => {
  const calls = []
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    loopsTransactionalId: 'cmp2cx45l1r470iylhx75mg84',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsedUrl.toString(), method, body, headers: options.headers || {} })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && method === 'GET') {
        return json([{ id: 'coach-1', user_id: 'coach-user-1', first_name: 'Anthony', last_name: 'Fortugno' }])
      }
      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'GET' && parsedUrl.searchParams.get('id') === 'eq.athlete-2') {
        return json([{ id: 'athlete-2', user_id: 'auth-athlete-2', coach_id: 'coach-1', first_name: 'Later', last_name: 'Invite', date_of_birth: '2009-08-12', gender: 'male', position: 'defense', height_cm: 176, weight_kg: 72, avatar_url: '', status: 'inactive', created_at: '2026-05-11T16:30:01.000Z' }])
      }
      if (parsedUrl.pathname === '/auth/v1/admin/users/auth-athlete-2' && method === 'GET') {
        return json({ id: 'auth-athlete-2', email: 'placeholder+later-invite@pplushockey.local', user_metadata: { role: 'athlete' } })
      }
      if (parsedUrl.pathname === '/auth/v1/admin/users/auth-athlete-2' && method === 'PUT') {
        return json({ id: 'auth-athlete-2', email: body.email, user_metadata: body.user_metadata })
      }
      if (parsedUrl.pathname === '/rest/v1/athlete_invitations' && method === 'PATCH') {
        return json([])
      }
      if (parsedUrl.pathname === '/rest/v1/athlete_invitations' && method === 'POST') {
        return json([{ id: 'invite-3', coach_id: body.coach_id, athlete_profile_id: body.athlete_profile_id, invitee_email: body.invitee_email, code_hash: body.code_hash, expires_at: body.expires_at, used_at: null, revoked_at: null, sent_at: body.sent_at, created_by_user_id: body.created_by_user_id, created_at: '2026-05-11T16:30:00.000Z' }])
      }
      if (parsedUrl.origin === 'https://app.loops.so' && parsedUrl.pathname === '/api/v1/transactional' && method === 'POST') {
        return json({ success: true })
      }
      throw new Error(`Unexpected send-later-email-update request: ${method} ${parsedUrl.toString()}`)
    },
  })

  const invitedAthlete = await repo.sendAthleteInvite({ athleteId: 'athlete-2', inviteeEmail: ' real@example.com ' })
  assert.equal(invitedAthlete.inviteeEmail, 'real@example.com')
  const authUpdateCall = calls.find((call) => call.url.includes('/auth/v1/admin/users/auth-athlete-2') && call.method === 'PUT')
  assert.ok(authUpdateCall)
  assert.equal(authUpdateCall.body.email, 'real@example.com')
  assert.equal(authUpdateCall.body.email_confirm, true)
})

test('createAdminAthleteRepository uploads athlete avatar assets and patches the profile with the public URL', async () => {
  const calls = []
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    createTemporaryPassword: () => 'TempPassword123!',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const method = options.method || 'GET'
      const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : null
      calls.push({ url: parsedUrl.toString(), method, body, headers: options.headers || {}, contentType: options.headers?.['Content-Type'] || options.headers?.['content-type'] || null })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && method === 'GET') {
        return json([{ id: 'coach-1', user_id: 'coach-user-1', first_name: 'Anthony', last_name: 'Fortugno' }])
      }
      if (parsedUrl.pathname === '/auth/v1/admin/users' && method === 'POST') {
        return json({ id: 'auth-athlete-upload', email: body.email, user_metadata: body.user_metadata })
      }
      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'GET' && parsedUrl.searchParams.get('user_id') === 'eq.auth-athlete-upload') {
        return json([{ id: 'athlete-upload', user_id: 'auth-athlete-upload', coach_id: 'coach-1', first_name: 'Photo', last_name: 'Upload', date_of_birth: null, gender: null, position: null, height_cm: null, weight_kg: null, avatar_url: '', status: 'inactive', created_at: '2026-05-11T16:30:01.000Z' }])
      }
      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'PATCH' && parsedUrl.searchParams.get('id') === 'eq.athlete-upload') {
        return json([{ id: 'athlete-upload', user_id: 'auth-athlete-upload', coach_id: body.coach_id ?? 'coach-1', first_name: body.first_name ?? 'Photo', last_name: body.last_name ?? 'Upload', date_of_birth: body.date_of_birth ?? null, gender: body.gender ?? null, position: body.position ?? null, height_cm: body.height_cm ?? null, weight_kg: body.weight_kg ?? null, avatar_url: body.avatar_url ?? '', status: body.status ?? 'inactive', created_at: '2026-05-11T16:30:01.000Z' }])
      }
      if (parsedUrl.pathname === '/storage/v1/object/athlete-avatars/athlete-upload/profile.png' && method === 'POST') {
        return json({ Key: 'athlete-upload/profile.png' })
      }
      throw new Error(`Unexpected athlete-avatar-upload request: ${method} ${parsedUrl.toString()}`)
    },
  })

  const createdAthlete = await repo.createAthlete({
    firstName: 'Photo',
    lastName: 'Upload',
    dateOfBirth: '',
    gender: 'male',
    position: 'forward',
    heightCm: null,
    weightKg: null,
    avatarUrl: '',
    avatarUpload: {
      fileName: 'profile.png',
      contentType: 'image/png',
      dataUrl: 'data:image/png;base64,AQIDBA=='
    },
    sendInvite: false,
    inviteeEmail: '',
  })

  const uploadCall = calls.find((call) => call.url.includes('/storage/v1/object/athlete-avatars/athlete-upload/profile.png') && call.method === 'POST')
  assert.ok(uploadCall)
  const avatarPatchCall = calls.filter((call) => call.url.includes('/rest/v1/athlete_profiles') && call.method === 'PATCH').at(-1)
  assert.equal(avatarPatchCall.body.avatar_url, 'https://example.supabase.co/storage/v1/object/public/athlete-avatars/athlete-upload/profile.png')
  assert.equal(createdAthlete.avatarUrl, 'https://example.supabase.co/storage/v1/object/public/athlete-avatars/athlete-upload/profile.png')
})


test('createAdminAthleteRepository rejects duplicate email when the existing athlete account is already active', async () => {
  const calls = []
  const repo = createAdminAthleteRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    loopsApiKey: 'loops-key',
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    createTemporaryPassword: () => 'TempPassword123!',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const method = options.method || 'GET'
      calls.push({ url: parsedUrl.toString(), method })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && method === 'GET') {
        return json([{ id: 'coach-1', user_id: 'coach-user-1', first_name: 'Anthony', last_name: 'Fortugno' }])
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users' && method === 'POST') {
        return json({ error: 'User already registered', msg: 'A user with this email address has already been registered' }, 422)
      }

      if (parsedUrl.pathname === '/auth/v1/admin/users' && method === 'GET') {
        return json({
          users: [
            {
              id: 'auth-athlete-existing',
              email: 'athlete@example.com',
              user_metadata: { role: 'athlete' },
            },
          ],
        })
      }

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && method === 'GET' && parsedUrl.searchParams.get('user_id') === 'eq.auth-athlete-existing') {
        return json([
          {
            id: 'athlete-1',
            user_id: 'auth-athlete-existing',
            coach_id: 'coach-1',
            first_name: 'Thomas',
            last_name: 'Thibault',
            date_of_birth: '2008-04-21',
            gender: 'male',
            position: 'forward',
            height_cm: 180,
            weight_kg: 84,
            avatar_url: '',
            status: 'active',
            created_at: '2026-05-10T16:30:00.000Z',
          },
        ])
      }

      throw new Error(`Unexpected active-duplicate request: ${method} ${parsedUrl.toString()}`)
    },
  })

  await assert.rejects(
    () => repo.createAthlete({
      firstName: 'Thomas',
      lastName: 'Thibault',
      dateOfBirth: '2008-04-21',
      gender: 'male',
      position: 'forward',
      heightCm: 180,
      weightKg: 84,
      avatarUrl: '',
      sendInvite: true,
      inviteeEmail: ' Athlete@Example.com ',
    }),
    /An athlete account already exists for athlete@example\.com\./,
  )

  assert.equal(calls.some((call) => call.url === 'https://app.loops.so/api/v1/transactional'), false)
})
