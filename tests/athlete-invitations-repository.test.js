import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAthleteInvitationLoopsPayload,
  createLoopsTransactionalEmailClient,
  createSupabaseEdgeInvitationClient,
  createSupabaseRestInvitationRepository,
  hashAthleteInvitationCode,
  createSupabaseEdgeInvitationCompletionClient,
} from '../packages/data/src/invitations/index.js'

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

test('createSupabaseRestInvitationRepository stores only the hashed 6-character code in athlete_invitations', async () => {
  const calls = []
  const repo = createSupabaseRestInvitationRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body, headers: options.headers || {} })

      if (parsed.pathname.endsWith('/athlete_invitations') && (options.method || 'GET') === 'POST') {
        return json([
          {
            id: 'invite-1',
            coach_id: body.coach_id,
            invitee_email: body.invitee_email,
            code_hash: body.code_hash,
            expires_at: body.expires_at,
            used_at: null,
            revoked_at: null,
            sent_at: null,
            athlete_profile_id: null,
            created_by_user_id: body.created_by_user_id,
            created_at: '2026-05-11T12:00:00.000Z',
            updated_at: '2026-05-11T12:00:00.000Z',
          },
        ])
      }

      throw new Error(`Unexpected invitation request: ${parsed.toString()}`)
    },
  })

  const invitation = await repo.createAthleteInvitation({
    coachId: 'coach-1',
    inviteeEmail: ' Athlete@Example.com ',
    inviteCode: '7K9M2Q',
    expiresAt: '2026-05-18T16:30:00.000Z',
    createdByUserId: 'user-1',
  })

  assert.equal(invitation.id, 'invite-1')
  assert.equal(invitation.coachId, 'coach-1')
  assert.equal(invitation.inviteeEmail, 'athlete@example.com')
  assert.equal(invitation.codeHash, await hashAthleteInvitationCode('7K9M2Q'))
  assert.equal(invitation.expiresAt, '2026-05-18T16:30:00.000Z')
  assert.equal(invitation.createdByUserId, 'user-1')

  const createCall = calls.find((call) => call.method === 'POST')
  assert.ok(createCall)
  assert.equal(createCall.url.includes('/rest/v1/athlete_invitations'), true)
  assert.deepEqual(createCall.body, {
    coach_id: 'coach-1',
    invitee_email: 'athlete@example.com',
    code_hash: await hashAthleteInvitationCode('7K9M2Q'),
    expires_at: '2026-05-18T16:30:00.000Z',
    created_by_user_id: 'user-1',
  })
  assert.equal(JSON.stringify(createCall.body).includes('7K9M2Q'), false)
})

test('createLoopsTransactionalEmailClient posts the transactional payload to Loops with bearer auth', async () => {
  const calls = []
  const client = createLoopsTransactionalEmailClient({
    apiKey: 'loops-key',
    fetchImpl: async (url, options = {}) => {
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url, method: options.method || 'GET', body, headers: options.headers || {} })
      return json({ success: true })
    },
  })

  const payload = buildAthleteInvitationLoopsPayload({
    inviteeEmail: 'athlete@example.com',
    inviteCode: '7K9M2Q',
    coachFirstName: 'Anthony',
    coachLastName: 'Fortugno',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    expiresAt: '2026-05-18T16:30:00.000Z',
  })

  const response = await client.sendTransactionalEmail(payload)

  assert.deepEqual(response, { success: true })
  assert.deepEqual(calls, [
    {
      url: 'https://app.loops.so/api/v1/transactional',
      method: 'POST',
      body: payload,
      headers: {
        Authorization: 'Bearer loops-key',
        'Content-Type': 'application/json',
      },
    },
  ])
})

test('createSupabaseEdgeInvitationClient calls the send-athlete-invitation edge function with auth context', async () => {
  const calls = []
  const client = createSupabaseEdgeInvitationClient({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url, options = {}) => {
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url, method: options.method || 'GET', body, headers: options.headers || {} })
      return json({ invitationId: 'invite-1', expiresAt: '2026-05-18T16:30:00.000Z' })
    },
  })

  const response = await client.sendAthleteInvitation({
    inviteeEmail: ' Athlete@Example.com ',
    coachFirstName: 'Anthony',
    coachLastName: 'Fortugno',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
  })

  assert.deepEqual(response, { invitationId: 'invite-1', expiresAt: '2026-05-18T16:30:00.000Z' })
  assert.deepEqual(calls, [
    {
      url: 'https://example.supabase.co/functions/v1/send-athlete-invitation',
      method: 'POST',
      body: {
        inviteeEmail: 'athlete@example.com',
        coachFirstName: 'Anthony',
        coachLastName: 'Fortugno',
        appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
      },
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer coach-token',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  ])
})

test('createSupabaseEdgeInvitationCompletionClient calls the complete-athlete-invitation edge function with onboarding payload', async () => {
  const calls = []
  const client = createSupabaseEdgeInvitationCompletionClient({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl: async (url, options = {}) => {
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url, method: options.method || 'GET', body, headers: options.headers || {}, signal: options.signal ?? null })
      return json({
        success: true,
        invitationId: 'invite-1',
        athleteProfileId: 'athlete-1',
        coachId: 'coach-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        currentUserId: 'user-1',
        currentAthleteId: 'athlete-1',
        assignedProgramId: 'program-1',
      })
    },
  })

  const response = await client.completeAthleteInvitation({
    inviteCode: '7K9M2Q',
    firstName: 'Thomas',
    lastName: 'Thibault',
    password: 'secret123',
    confirmPassword: 'secret123',
    dateOfBirth: '2008-04-21',
    gender: 'Male',
    position: 'Forward',
    weight: '170.5',
    weightUnit: 'lb',
    heightUnit: 'ft',
    heightFeet: '5',
    heightInches: '11',
  })

  assert.deepEqual(response, {
    success: true,
    invitationId: 'invite-1',
    athleteProfileId: 'athlete-1',
    coachId: 'coach-1',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    currentUserId: 'user-1',
    currentAthleteId: 'athlete-1',
    assignedProgramId: 'program-1',
  })
  assert.deepEqual(calls, [
    {
      url: 'https://example.supabase.co/functions/v1/complete-athlete-invitation',
      method: 'POST',
      body: {
        inviteCode: '7K9M2Q',
        firstName: 'Thomas',
        lastName: 'Thibault',
        password: 'secret123',
        confirmPassword: 'secret123',
        dateOfBirth: '2008-04-21',
        gender: 'Male',
        position: 'Forward',
        weight: '170.5',
        weightUnit: 'lb',
        heightUnit: 'ft',
        heightFeet: '5',
        heightInches: '11',
        heightCm: '',
      },
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer anon-key',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: calls[0]?.signal ?? null,
    },
  ])
  assert.equal(typeof calls[0]?.signal?.aborted, 'boolean')
})

test('createSupabaseEdgeInvitationCompletionClient times out hanging edge requests instead of leaving onboarding stuck forever', async () => {
  const client = createSupabaseEdgeInvitationCompletionClient({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    requestTimeoutMs: 10,
    fetchImpl: async (_url, options = {}) => {
      await new Promise((resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(options.signal.reason || new Error('aborted')), { once: true })
      })
      return json({ success: true })
    },
  })

  await assert.rejects(
    () => client.completeAthleteInvitation({
      inviteCode: '7K9M2Q',
      firstName: 'Thomas',
      lastName: 'Thibault',
      password: 'secret123',
      confirmPassword: 'secret123',
      gender: 'Male',
      position: 'Forward',
      weight: '170.5',
      weightUnit: 'lb',
      heightUnit: 'ft',
      heightFeet: '5',
      heightInches: '11',
    }),
    /Supabase edge invitation request timed out while waiting for complete-athlete-invitation\./,
  )
})

test('createSupabaseEdgeInvitationCompletionClient maps React Native abort errors to the same timeout message when its own timeout fired', async () => {
  const client = createSupabaseEdgeInvitationCompletionClient({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    requestTimeoutMs: 10,
    fetchImpl: async (_url, options = {}) => {
      await new Promise((resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })
      })
      return json({ success: true })
    },
  })

  await assert.rejects(
    () => client.completeAthleteInvitation({
      inviteCode: '7K9M2Q',
      firstName: 'Thomas',
      lastName: 'Thibault',
      password: 'secret123',
      confirmPassword: 'secret123',
      gender: 'Male',
      position: 'Forward',
      weight: '170.5',
      weightUnit: 'lb',
      heightUnit: 'ft',
      heightFeet: '5',
      heightInches: '11',
    }),
    /Supabase edge invitation request timed out while waiting for complete-athlete-invitation\./,
  )
})
