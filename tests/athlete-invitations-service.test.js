import test from 'node:test'
import assert from 'node:assert/strict'

import { createAthleteInvitationService } from '../packages/data/src/invitations/index.js'

test('createAthleteInvitationService creates the invite record first, then sends the Loops transactional email with the raw code', async () => {
  const steps = []
  const service = createAthleteInvitationService({
    invitationRepository: {
      async createAthleteInvitation(payload) {
        steps.push({ type: 'repository', payload })
        return {
          id: 'invite-1',
          coachId: payload.coachId,
          inviteeEmail: payload.inviteeEmail,
          codeHash: 'hashed-code',
          expiresAt: payload.expiresAt,
          usedAt: null,
          revokedAt: null,
          sentAt: null,
          athleteProfileId: null,
          createdByUserId: payload.createdByUserId,
        }
      },
    },
    loopsClient: {
      async sendTransactionalEmail(payload) {
        steps.push({ type: 'loops', payload })
        return { success: true }
      },
    },
    createCode: () => '7K9M2Q',
  })

  const result = await service.sendAthleteInvitation({
    coachId: 'coach-1',
    inviteeEmail: ' Athlete@Example.com ',
    coachFirstName: 'Anthony',
    coachLastName: 'Fortugno',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    expiresAt: '2026-05-18T16:30:00.000Z',
    createdByUserId: 'user-1',
  })

  assert.equal(result.invitation.id, 'invite-1')
  assert.equal(result.invitation.inviteeEmail, 'athlete@example.com')
  assert.equal(result.inviteCode, '7K9M2Q')
  assert.deepEqual(result.loopsResponse, { success: true })
  assert.deepEqual(steps, [
    {
      type: 'repository',
      payload: {
        coachId: 'coach-1',
        inviteeEmail: 'athlete@example.com',
        inviteCode: '7K9M2Q',
        expiresAt: '2026-05-18T16:30:00.000Z',
        createdByUserId: 'user-1',
      },
    },
    {
      type: 'loops',
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
