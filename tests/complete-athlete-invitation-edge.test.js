import test from 'node:test'
import assert from 'node:assert/strict'

import { createCompleteAthleteInvitationHandler } from '../infra/supabase/functions/complete-athlete-invitation/handler.js'

function makeRequest(body) {
  return new Request('https://example.supabase.co/functions/v1/complete-athlete-invitation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function readJson(response) {
  return JSON.parse(await response.text())
}

test('complete-athlete-invitation handler validates the invite, creates the athlete account, links the coach, assigns the default program, and returns authenticated session payload', async () => {
  const calls = []
  const handler = createCompleteAthleteInvitationHandler({
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    },
    now: () => new Date('2026-05-12T16:30:00.000Z'),
    invitationRepositoryFactory(config) {
      calls.push({ type: 'invitation-config', config })
      return {
        async getActiveInvitationByCode(inviteCode) {
          calls.push({ type: 'getActiveInvitationByCode', inviteCode })
          return {
            id: 'invite-1',
            coachId: 'coach-1',
            inviteeEmail: 'athlete@example.com',
            expiresAt: '2026-05-18T16:30:00.000Z',
            usedAt: null,
            revokedAt: null,
          }
        },
        async markAthleteInvitationAccepted(payload) {
          calls.push({ type: 'markAthleteInvitationAccepted', payload })
          return {
            id: 'invite-1',
            coachId: 'coach-1',
            inviteeEmail: 'athlete@example.com',
            athleteProfileId: payload.athleteProfileId,
            usedAt: '2026-05-12T16:30:00.000Z',
          }
        },
      }
    },
    identityRepositoryFactory(config) {
      calls.push({ type: 'identity-config', config })
      return {
        async signUpAthleteWithInvitation(payload) {
          calls.push({ type: 'signUpAthleteWithInvitation', payload })
          return {
            user: { id: 'user-1', email: 'athlete@example.com' },
            athleteProfile: { id: 'athlete-1', userId: 'user-1', coachId: 'coach-1' },
            session: { accessToken: 'access-token', refreshToken: 'refresh-token' },
          }
        },
        async updateAthleteProfileFromInvitation(payload) {
          calls.push({ type: 'updateAthleteProfileFromInvitation', payload })
          return {
            id: 'athlete-1',
            userId: 'user-1',
            coachId: 'coach-1',
            firstName: 'Thomas',
            lastName: 'Thibault',
            gender: 'Male',
            position: 'Forward',
            heightCm: 180,
            weightKg: 77.3,
          }
        },
      }
    },
    programRepositoryFactory(config) {
      calls.push({ type: 'program-config', config })
      return {
        async assignFirstProgramToAthlete(payload) {
          calls.push({ type: 'assignFirstProgramToAthlete', payload })
          return {
            id: 'program-2',
            athleteId: 'athlete-1',
            coachId: 'coach-1',
            weeksCount: 10,
            workoutsCount: 40,
          }
        },
      }
    },
  })

  const response = await handler(makeRequest({
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
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), {
    success: true,
    invitationId: 'invite-1',
    athleteProfileId: 'athlete-1',
    coachId: 'coach-1',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    currentUserId: 'user-1',
    currentAthleteId: 'athlete-1',
    assignedProgramId: 'program-2',
  })

  assert.deepEqual(calls, [
    {
      type: 'invitation-config',
      config: {
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
        serviceRoleKey: 'service-role-key',
      },
    },
    {
      type: 'identity-config',
      config: {
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
        serviceRoleKey: 'service-role-key',
      },
    },
    {
      type: 'program-config',
      config: {
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
        serviceRoleKey: 'service-role-key',
      },
    },
    { type: 'getActiveInvitationByCode', inviteCode: '7K9M2Q' },
    {
      type: 'signUpAthleteWithInvitation',
      payload: {
        email: 'athlete@example.com',
        password: 'secret123',
        firstName: 'Thomas',
        lastName: 'Thibault',
      },
    },
    {
      type: 'updateAthleteProfileFromInvitation',
      payload: {
        athleteId: 'athlete-1',
        coachId: 'coach-1',
        firstName: 'Thomas',
        lastName: 'Thibault',
        dateOfBirth: '2008-04-21',
        gender: 'Male',
        position: 'Forward',
        heightCm: 180,
        weightKg: 77.3,
      },
    },
    {
      type: 'assignFirstProgramToAthlete',
      payload: {
        athleteId: 'athlete-1',
        coachId: 'coach-1',
      },
    },
    {
      type: 'markAthleteInvitationAccepted',
      payload: {
        invitationId: 'invite-1',
        athleteProfileId: 'athlete-1',
        usedAt: '2026-05-12T16:30:00.000Z',
      },
    },
  ])
})


test('complete-athlete-invitation handler rejects expired or already-used invites before account creation', async () => {
  let signUpCalled = false
  const handler = createCompleteAthleteInvitationHandler({
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    },
    invitationRepositoryFactory() {
      return {
        async getActiveInvitationByCode() {
          return null
        },
      }
    },
    identityRepositoryFactory() {
      return {
        async signUpAthleteWithInvitation() {
          signUpCalled = true
          throw new Error('signUpAthleteWithInvitation should not run when invite validation fails')
        },
      }
    },
  })

  const response = await handler(makeRequest({
    inviteCode: 'BAD999',
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
  }))

  assert.equal(response.status, 404)
  assert.deepEqual(await readJson(response), {
    error: 'Invitation code is invalid or no longer available.',
  })
  assert.equal(signUpCalled, false)
})
