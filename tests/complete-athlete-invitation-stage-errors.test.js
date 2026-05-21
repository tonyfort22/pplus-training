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

test('complete-athlete-invitation handler labels the failing stage when athlete account creation is rejected upstream', async () => {
  const handler = createCompleteAthleteInvitationHandler({
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    },
    now: () => new Date('2026-05-12T16:30:00.000Z'),
    invitationRepositoryFactory() {
      return {
        async getActiveInvitationByCode() {
          return {
            id: 'invite-1',
            coachId: 'coach-1',
            inviteeEmail: 'athlete@example.com',
            expiresAt: '2026-05-18T16:30:00.000Z',
            usedAt: null,
            revokedAt: null,
          }
        },
      }
    },
    identityRepositoryFactory() {
      return {
        async signUpAthleteWithInvitation() {
          throw new Error('Supabase service request failed (422): User already registered')
        },
      }
    },
    programRepositoryFactory() {
      return {
        async assignFirstProgramToAthlete() {
          throw new Error('assignFirstProgramToAthlete should not run when signup fails')
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
    dateOfBirth: '2008-04-17',
    gender: 'Male',
    position: 'Forward',
    weight: '170.5',
    weightUnit: 'lb',
    heightUnit: 'ft',
    heightFeet: '5',
    heightInches: '11',
  }))

  assert.equal(response.status, 500)
  assert.deepEqual(await readJson(response), {
    error: 'Invitation completion failed during athlete_account_create: Supabase service request failed (422): User already registered',
  })
})
