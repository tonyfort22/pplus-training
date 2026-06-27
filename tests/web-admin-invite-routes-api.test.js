import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminInviteRouteHandlers } from '../apps/web/lib/admin-invite-route-handlers.js'

function jsonRequest(method, body) {
  return new Request('http://localhost/api/admin/invites', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function readJson(response) {
  return response.json()
}

test('admin invites GET route returns invite list from the repository', async () => {
  const calls = []
  const inviteRows = [{ id: 'invite-1', email: 'athlete@example.com', status: 'Pending' }]
  const handlers = createAdminInviteRouteHandlers({
    createInviteRepository: () => ({
      async listInvites() {
        calls.push('listInvites')
        return inviteRows
      },
    }),
  })

  const response = await handlers.GET()
  const payload = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, ['listInvites'])
  assert.deepEqual(payload, { invites: inviteRows })
})

test('admin invites POST route sends an athlete invite and returns 201', async () => {
  const calls = []
  const createdAthlete = { id: 'athlete-1', inviteeEmail: 'new@example.com', hasInvite: true }
  const requestBody = { athleteId: 'athlete-1', inviteeEmail: ' New@Example.com ' }
  const handlers = createAdminInviteRouteHandlers({
    createAthleteRepository: () => ({
      async sendAthleteInvite(body) {
        calls.push(['sendAthleteInvite', body])
        return createdAthlete
      },
    }),
  })

  const response = await handlers.POST(jsonRequest('POST', requestBody))
  const payload = await readJson(response)

  assert.equal(response.status, 201)
  assert.deepEqual(calls, [['sendAthleteInvite', requestBody]])
  assert.deepEqual(payload, { athlete: createdAthlete })
})

test('admin invites POST resend route resends eligible invites and skips unsafe rows', async () => {
  const inviteRows = [
    { id: 'pending-1', status: 'Pending', athleteProfileId: 'athlete-1', email: 'pending@example.com' },
    { id: 'expired-1', status: 'Expired', athleteProfileId: 'athlete-2', email: 'expired@example.com' },
    { id: 'accepted-1', status: 'Accepted', athleteProfileId: 'athlete-3', email: 'accepted@example.com' },
    { id: 'canceled-1', status: 'Canceled', athleteProfileId: 'athlete-4', email: 'canceled@example.com' },
    { id: 'missing-email', status: 'Pending', athleteProfileId: 'athlete-5', email: '-' },
    { id: 'missing-profile', status: 'Pending', athleteProfileId: null, email: 'missing-profile@example.com' },
  ]
  const calls = []
  const handlers = createAdminInviteRouteHandlers({
    createInviteRepository: () => ({
      async listInvitesByIds(body) {
        calls.push(['listInvitesByIds', body])
        return inviteRows
      },
    }),
    createAthleteRepository: () => ({
      async sendAthleteInvite(body) {
        calls.push(['sendAthleteInvite', body])
        return { id: body.athleteId, inviteeEmail: body.inviteeEmail }
      },
    }),
  })

  const response = await handlers.POST(jsonRequest('POST', { action: 'resend', inviteIds: inviteRows.map((invite) => invite.id) }))
  const payload = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [
    ['listInvitesByIds', { inviteIds: inviteRows.map((invite) => invite.id) }],
    ['sendAthleteInvite', { athleteId: 'athlete-1', inviteeEmail: 'pending@example.com' }],
    ['sendAthleteInvite', { athleteId: 'athlete-2', inviteeEmail: 'expired@example.com' }],
  ])
  assert.deepEqual(payload.result.resentInvites.map(({ invite }) => invite.id), ['pending-1', 'expired-1'])
  assert.deepEqual(
    payload.result.skippedInvites.map(({ id, reason }) => [id, reason]),
    [
      ['accepted-1', 'Already accepted'],
      ['canceled-1', 'Invite canceled'],
      ['missing-email', 'Missing email'],
      ['missing-profile', 'Missing athlete profile'],
    ],
  )
})

test('admin invites PATCH route revokes one invite or a bulk invite selection', async () => {
  const calls = []
  const handlers = createAdminInviteRouteHandlers({
    createInviteRepository: () => ({
      async cancelInvite(body) {
        calls.push(['cancelInvite', body])
        return { id: body.inviteId, status: 'Canceled' }
      },
      async cancelInvites(body) {
        calls.push(['cancelInvites', body])
        return { inviteIds: body.inviteIds, canceledCount: body.inviteIds.length }
      },
    }),
  })

  const singleResponse = await handlers.PATCH(jsonRequest('PATCH', { inviteId: 'invite-1' }))
  const singlePayload = await readJson(singleResponse)
  const bulkResponse = await handlers.PATCH(jsonRequest('PATCH', { inviteIds: ['invite-2', 'invite-3'] }))
  const bulkPayload = await readJson(bulkResponse)

  assert.equal(singleResponse.status, 200)
  assert.equal(bulkResponse.status, 200)
  assert.deepEqual(calls, [
    ['cancelInvite', { inviteId: 'invite-1' }],
    ['cancelInvites', { inviteIds: ['invite-2', 'invite-3'] }],
  ])
  assert.deepEqual(singlePayload, { invite: { id: 'invite-1', status: 'Canceled' } })
  assert.deepEqual(bulkPayload, { result: { inviteIds: ['invite-2', 'invite-3'], canceledCount: 2 } })
})

test('admin invites route contracts preserve repository error status and message', async () => {
  const error = new Error('Invite email is required when sending an athlete invitation.')
  error.status = 400
  const handlers = createAdminInviteRouteHandlers({
    createAthleteRepository: () => ({
      async sendAthleteInvite() {
        throw error
      },
    }),
  })

  const response = await handlers.POST(jsonRequest('POST', { athleteId: 'athlete-1' }))
  const payload = await readJson(response)

  assert.equal(response.status, 400)
  assert.deepEqual(payload, { error: 'Invite email is required when sending an athlete invitation.' })
})
