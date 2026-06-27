import test from 'node:test'
import assert from 'node:assert/strict'

import { createMobileInvitationClient, sendCoachAthleteInvitation } from '../apps/mobile/src/train/athlete-invitation-runtime.js'

test('createMobileInvitationClient returns null without required public Supabase config', () => {
  assert.equal(createMobileInvitationClient({}), null)
})

test('createMobileInvitationClient targets the send-athlete-invitation edge function with the signed-in access token', async () => {
  const calls = []
  const client = createMobileInvitationClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url, options = {}) => {
      calls.push({
        url,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : null,
        headers: options.headers || {},
      })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify({ invitationId: 'invite-1', expiresAt: '2026-05-18T16:30:00.000Z' })
        },
      }
    },
  })

  const response = await client.sendAthleteInvitation({
    inviteeEmail: 'athlete@example.com',
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

test('createMobileInvitationClient lets the completion flow use a longer timeout budget than the generic edge default', async () => {
  const client = createMobileInvitationClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    invitationCompletionRequestTimeoutMs: 10,
    fetchImpl: async (_url, options = {}) => {
      await new Promise((resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })
      })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify({ success: true })
        },
      }
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

test('createMobileInvitationClient can complete invitation onboarding through an explicit safe fixture without remote fetch', async () => {
  const fetchCalls = []
  const client = createMobileInvitationClient({
    invitationCompletionFixture: 'invited_athlete_completion_safe',
    fetchImpl: async (...args) => {
      fetchCalls.push(args)
      throw new Error('remote fetch must not run for the safe completion fixture')
    },
  })

  const result = await client.completeAthleteInvitation({
    inviteCode: 'SAFE11',
    firstName: 'Safe',
    lastName: 'Athlete',
    password: 'secret123',
    confirmPassword: 'secret123',
    gender: 'Female',
    position: 'Forward',
    weight: '170',
    weightUnit: 'lb',
    heightUnit: 'ft',
    heightFeet: '5',
    heightInches: '9',
  })

  assert.deepEqual(fetchCalls, [])
  assert.deepEqual(result, {
    accessToken: 'safe-invited-athlete-access-token',
    refreshToken: 'safe-invited-athlete-refresh-token',
    currentUserId: 'auth-safe-invited-athlete',
    currentAthleteId: 'ath-safe-invited-athlete',
    assignedProgramId: 'program-safe-invited-athlete',
  })
})

test('sendCoachAthleteInvitation normalizes the email and forwards coach profile details through the mobile invitation client', async () => {
  const calls = []
  const response = await sendCoachAthleteInvitation({
    invitationClient: {
      async sendAthleteInvitation(payload) {
        calls.push(payload)
        return { invitationId: 'invite-1', expiresAt: '2026-05-18T16:30:00.000Z' }
      },
    },
    inviteeEmail: ' Athlete@Example.com ',
    coachProfile: { firstName: 'Anthony', lastName: 'Fortugno' },
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
  })

  assert.deepEqual(response, { invitationId: 'invite-1', expiresAt: '2026-05-18T16:30:00.000Z' })
  assert.deepEqual(calls, [
    {
      inviteeEmail: 'athlete@example.com',
      coachFirstName: 'Anthony',
      coachLastName: 'Fortugno',
      appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    },
  ])
})
