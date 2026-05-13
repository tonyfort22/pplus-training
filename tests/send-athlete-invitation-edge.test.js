import test from 'node:test'
import assert from 'node:assert/strict'

import { createSendAthleteInvitationHandler } from '../infra/supabase/functions/send-athlete-invitation/handler.js'

function makeRequest(body, headers = {}) {
  return new Request('https://example.supabase.co/functions/v1/send-athlete-invitation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

async function readJson(response) {
  return JSON.parse(await response.text())
}

test('send-athlete-invitation handler verifies coach auth, stores the invite, sends Loops email, and returns success payload', async () => {
  const calls = []
  const handler = createSendAthleteInvitationHandler({
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      LOOPS_API_KEY: 'loops-key',
      PPLUS_APP_STORE_URL: 'https://apps.apple.com/app/pplus/id1234567890',
    },
    now: () => new Date('2026-05-11T16:30:00.000Z'),
    identityClientFactory(config) {
      calls.push({ type: 'identity-config', config })
      return {
        async getCurrentUser() {
          calls.push({ type: 'getCurrentUser' })
          return { id: 'user-1', email: 'coach@example.com', role: 'coach' }
        },
        async getCoachProfileByUserId(userId) {
          calls.push({ type: 'getCoachProfileByUserId', userId })
          return { id: 'coach-1', firstName: 'Anthony', lastName: 'Fortugno' }
        },
      }
    },
    invitationRepositoryFactory(config) {
      calls.push({ type: 'invitation-config', config })
      return {
        async createAthleteInvitation(payload) {
          calls.push({ type: 'createAthleteInvitation', payload })
          return {
            id: 'invite-1',
            coachId: payload.coachId,
            inviteeEmail: payload.inviteeEmail,
            codeHash: 'hash-1',
            expiresAt: payload.expiresAt,
            createdByUserId: payload.createdByUserId,
          }
        },
      }
    },
    loopsClientFactory(config) {
      calls.push({ type: 'loops-config', config })
      return {
        async sendTransactionalEmail(payload) {
          calls.push({ type: 'sendTransactionalEmail', payload })
          return { success: true }
        },
      }
    },
    createCode: () => '7K9M2Q',
  })

  const response = await handler(
    makeRequest(
      {
        inviteeEmail: ' Athlete@Example.com ',
        coachFirstName: 'Wrong',
        coachLastName: 'Name',
        appStoreUrl: '',
      },
      { Authorization: 'Bearer coach-token' },
    ),
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), {
    success: true,
    invitationId: 'invite-1',
    inviteeEmail: 'athlete@example.com',
    expiresAt: '2026-05-18T16:30:00.000Z',
  })

  assert.deepEqual(calls, [
    {
      type: 'identity-config',
      config: {
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
        accessToken: 'coach-token',
      },
    },
    { type: 'getCurrentUser' },
    { type: 'getCoachProfileByUserId', userId: 'user-1' },
    {
      type: 'invitation-config',
      config: {
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
        accessToken: 'coach-token',
      },
    },
    {
      type: 'loops-config',
      config: {
        apiKey: 'loops-key',
      },
    },
    {
      type: 'createAthleteInvitation',
      payload: {
        coachId: 'coach-1',
        inviteeEmail: 'athlete@example.com',
        inviteCode: '7K9M2Q',
        expiresAt: '2026-05-18T16:30:00.000Z',
        createdByUserId: 'user-1',
      },
    },
    {
      type: 'sendTransactionalEmail',
      payload: {
        transactionalId: 'pplus-athlete-invite',
        email: 'athlete@example.com',
        dataVariables: {
          inviteCode: '7K9M2Q',
          coachFirstName: 'Anthony',
          coachLastName: 'Fortugno',
          coachDisplayName: 'Anthony Fortugno',
          appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
          expiresAt: '2026-05-18T16:30:00.000Z',
        },
      },
    },
  ])
})

test('send-athlete-invitation handler rejects missing auth before touching downstream services', async () => {
  const handler = createSendAthleteInvitationHandler({
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      LOOPS_API_KEY: 'loops-key',
    },
  })

  const response = await handler(makeRequest({ inviteeEmail: 'athlete@example.com' }))

  assert.equal(response.status, 401)
  assert.deepEqual(await readJson(response), {
    error: 'Missing Authorization bearer token.',
  })
})

test('send-athlete-invitation handler rejects authenticated users who do not resolve to a coach profile', async () => {
  const handler = createSendAthleteInvitationHandler({
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      LOOPS_API_KEY: 'loops-key',
    },
    identityClientFactory() {
      return {
        async getCurrentUser() {
          return { id: 'user-2', email: 'athlete@example.com', role: 'athlete' }
        },
        async getCoachProfileByUserId() {
          return null
        },
      }
    },
  })

  const response = await handler(
    makeRequest({ inviteeEmail: 'athlete@example.com' }, { Authorization: 'Bearer athlete-token' }),
  )

  assert.equal(response.status, 403)
  assert.deepEqual(await readJson(response), {
    error: 'Only coaches can send athlete invitations.',
  })
})
