import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminAthleteRouteHandlers } from '../apps/web/lib/admin-athlete-route-handlers.js'

function jsonRequest(method, body) {
  return new Request('https://admin.pplus.test/api/admin/athletes', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createAthlete(overrides = {}) {
  return {
    id: 'athlete-1',
    name: 'Thomas Thibault',
    firstName: 'Thomas',
    lastName: 'Thibault',
    status: 'Inactive',
    ...overrides,
  }
}

test('admin athletes GET route returns the athlete list from the repository', async () => {
  const calls = []
  const athletes = [createAthlete()]
  const handlers = createAdminAthleteRouteHandlers({
    createRepository: () => ({
      async listAthletes() {
        calls.push({ method: 'listAthletes' })
        return athletes
      },
    }),
  })

  const response = await handlers.GET()
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [{ method: 'listAthletes' }])
  assert.deepEqual(payload, { athletes })
})

test('admin athletes POST route creates an athlete and returns 201', async () => {
  const calls = []
  const createdAthlete = createAthlete({ id: 'athlete-created', inviteeEmail: 'athlete@example.com' })
  const createPayload = {
    firstName: 'Thomas',
    lastName: 'Thibault',
    dateOfBirth: '2008-04-21',
    gender: 'male',
    position: 'forward',
    heightCm: 180,
    weightKg: 84,
    avatarUrl: '',
    sendInvite: true,
    inviteeEmail: 'athlete@example.com',
  }
  const handlers = createAdminAthleteRouteHandlers({
    createRepository: () => ({
      async createAthlete(payload) {
        calls.push({ method: 'createAthlete', payload })
        return createdAthlete
      },
    }),
  })

  const response = await handlers.POST(jsonRequest('POST', createPayload))
  const payload = await response.json()

  assert.equal(response.status, 201)
  assert.deepEqual(calls, [{ method: 'createAthlete', payload: createPayload }])
  assert.deepEqual(payload, { athlete: createdAthlete })
})

test('admin athletes PATCH route updates an athlete and returns the updated row', async () => {
  const calls = []
  const updatedAthlete = createAthlete({ id: 'athlete-1', position: 'defense' })
  const updatePayload = {
    athleteId: 'athlete-1',
    firstName: 'Thomas',
    lastName: 'Thibault',
    position: 'defense',
    avatarUrl: 'https://cdn.pplus.test/avatar.jpg',
  }
  const handlers = createAdminAthleteRouteHandlers({
    createRepository: () => ({
      async updateAthlete(payload) {
        calls.push({ method: 'updateAthlete', payload })
        return updatedAthlete
      },
    }),
  })

  const response = await handlers.PATCH(jsonRequest('PATCH', updatePayload))
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [{ method: 'updateAthlete', payload: updatePayload }])
  assert.deepEqual(payload, { athlete: updatedAthlete })
})

test('admin athletes route contracts preserve repository error status and message', async () => {
  const error = new Error('First name and last name are required.')
  error.status = 400
  const handlers = createAdminAthleteRouteHandlers({
    createRepository: () => ({
      async createAthlete() {
        throw error
      },
    }),
  })

  const response = await handlers.POST(jsonRequest('POST', { firstName: '', lastName: '' }))
  const payload = await response.json()

  assert.equal(response.status, 400)
  assert.deepEqual(payload, { error: 'First name and last name are required.' })
}
)
