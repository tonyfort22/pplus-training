import test from 'node:test'
import assert from 'node:assert/strict'

import {
  INVITE_CODE_CHARSET,
  INVITE_CODE_LENGTH,
  buildAthleteInvitationLoopsPayload,
  createAthleteInvitationCode,
  hashAthleteInvitationCode,
  normalizeAthleteInvitationEmail,
} from '../packages/data/src/invitations/index.js'

test('athlete invitation domain uses 6-character uppercase codes from the safe charset', () => {
  assert.equal(INVITE_CODE_LENGTH, 6)
  assert.equal(INVITE_CODE_CHARSET, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = createAthleteInvitationCode()
    assert.equal(code.length, 6)
    assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
  }
})

test('athlete invitation domain normalizes emails and hashes the raw invite code instead of storing it directly', async () => {
  assert.equal(normalizeAthleteInvitationEmail('  Athlete@Example.com '), 'athlete@example.com')
  assert.equal(normalizeAthleteInvitationEmail(''), null)
  assert.equal(normalizeAthleteInvitationEmail(null), null)

  const rawCode = '7K9M2Q'
  const codeHash = await hashAthleteInvitationCode(rawCode)

  assert.equal(typeof codeHash, 'string')
  assert.equal(codeHash.length, 64)
  assert.notEqual(codeHash, rawCode)
  assert.equal(codeHash, await hashAthleteInvitationCode(rawCode))
  assert.notEqual(codeHash, await hashAthleteInvitationCode('B4T8WZ'))
})

test('athlete invitation domain builds a Loops transactional payload with the invite code and app handoff data', () => {
  const payload = buildAthleteInvitationLoopsPayload({
    inviteeEmail: 'athlete@example.com',
    inviteCode: '7K9M2Q',
    coachFirstName: 'Anthony',
    coachLastName: 'Fortugno',
    appStoreUrl: 'https://apps.apple.com/app/pplus/id1234567890',
    expiresAt: '2026-05-18T16:30:00.000Z',
  })

  assert.deepEqual(payload, {
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
  })
})
