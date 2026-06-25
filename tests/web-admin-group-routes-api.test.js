import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminGroupRouteHandlers } from '../apps/web/lib/admin-group-route-handlers.js'

function jsonRequest(method, body = {}) {
  return new Request('http://localhost/api/admin/groups', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function readJson(response) {
  return response.json()
}

function createRepository(overrides = {}) {
  return {
    listGroups: async () => [{ id: 'group-1', name: 'Forwards' }],
    listAthleteOptions: async () => [{ id: 'athlete-1', name: 'Tony Skater' }],
    listProgramOptions: async () => [{ id: 'program-1', name: 'Speed Block' }],
    createGroup: async (payload) => ({ id: 'group-created', ...payload }),
    updateGroup: async (payload) => ({ id: payload.groupId, name: payload.name, action: payload.action ?? 'update' }),
    deleteGroup: async (payload) => ({ id: payload.groupId, deleted: true }),
    archiveGroup: async (payload) => ({ id: payload.groupId, status: 'Archived' }),
    archiveGroups: async (payload) => ({ groupIds: payload.groupIds, archivedCount: payload.groupIds.length }),
    restoreGroups: async (payload) => ({ groupIds: payload.groupIds, restoredCount: payload.groupIds.length }),
    assignProgramToGroups: async (payload) => ({ groupIds: payload.groupIds, sourceProgramId: payload.sourceProgramId }),
    addAthletesToGroups: async (payload) => ({ groupIds: payload.groupIds, athleteIds: payload.athleteIds }),
    ...overrides,
  }
}

test('admin groups GET route returns groups, athlete options, and program options from the repository', async () => {
  const calls = []
  const repository = createRepository({
    listGroups: async () => {
      calls.push('listGroups')
      return [{ id: 'group-a', name: 'Attack' }]
    },
    listAthleteOptions: async () => {
      calls.push('listAthleteOptions')
      return [{ id: 'athlete-a', name: 'Avery' }]
    },
    listProgramOptions: async () => {
      calls.push('listProgramOptions')
      return [{ id: 'program-a', name: 'Block A' }]
    },
  })
  const handlers = createAdminGroupRouteHandlers({ createRepository: () => repository })

  const response = await handlers.GET()

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), {
    groups: [{ id: 'group-a', name: 'Attack' }],
    athleteOptions: [{ id: 'athlete-a', name: 'Avery' }],
    programOptions: [{ id: 'program-a', name: 'Block A' }],
  })
  assert.deepEqual(calls.sort(), ['listAthleteOptions', 'listGroups', 'listProgramOptions'].sort())
})

test('admin groups POST route creates a group and returns 201', async () => {
  let receivedPayload = null
  const repository = createRepository({
    createGroup: async (payload) => {
      receivedPayload = payload
      return { id: 'group-created', name: payload.name, athleteIds: payload.athleteIds }
    },
  })
  const handlers = createAdminGroupRouteHandlers({ createRepository: () => repository })
  const body = { name: 'Goalies', description: 'Small group', accessLevel: 'private', athleteIds: ['athlete-1'] }

  const response = await handlers.POST(jsonRequest('POST', body))

  assert.equal(response.status, 201)
  assert.deepEqual(receivedPayload, body)
  assert.deepEqual(await readJson(response), {
    group: { id: 'group-created', name: 'Goalies', athleteIds: ['athlete-1'] },
  })
})

test('admin groups PATCH route updates a group when no action is provided', async () => {
  let receivedPayload = null
  const repository = createRepository({
    updateGroup: async (payload) => {
      receivedPayload = payload
      return { id: payload.groupId, name: payload.name, accessLevel: payload.accessLevel }
    },
  })
  const handlers = createAdminGroupRouteHandlers({ createRepository: () => repository })
  const body = { groupId: 'group-1', name: 'Defense', accessLevel: 'public', athleteIds: ['athlete-2'] }

  const response = await handlers.PATCH(jsonRequest('PATCH', body))

  assert.equal(response.status, 200)
  assert.deepEqual(receivedPayload, body)
  assert.deepEqual(await readJson(response), {
    group: { id: 'group-1', name: 'Defense', accessLevel: 'public' },
  })
})

test('admin groups PATCH route routes CRUD and workflow actions to the expected repository methods', async () => {
  const calls = []
  const repository = createRepository({
    archiveGroup: async (payload) => {
      calls.push(['archiveGroup', payload])
      return { id: payload.groupId, status: 'Archived' }
    },
    archiveGroups: async (payload) => {
      calls.push(['archiveGroups', payload])
      return { groupIds: payload.groupIds, archivedCount: payload.groupIds.length }
    },
    restoreGroups: async (payload) => {
      calls.push(['restoreGroups', payload])
      return { groupIds: payload.groupIds, restoredCount: payload.groupIds.length }
    },
    deleteGroup: async (payload) => {
      calls.push(['deleteGroup', payload])
      return { id: payload.groupId }
    },
    assignProgramToGroups: async (payload) => {
      calls.push(['assignProgramToGroups', payload])
      return { groupIds: payload.groupIds, sourceProgramId: payload.sourceProgramId }
    },
    addAthletesToGroups: async (payload) => {
      calls.push(['addAthletesToGroups', payload])
      return { groupIds: payload.groupIds, athleteIds: payload.athleteIds }
    },
  })
  const handlers = createAdminGroupRouteHandlers({ createRepository: () => repository })

  const singleArchive = await handlers.PATCH(jsonRequest('PATCH', { action: 'archive', groupId: 'group-1' }))
  const bulkArchive = await handlers.PATCH(jsonRequest('PATCH', { action: 'archive', groupIds: ['group-2', 'group-3'] }))
  const restore = await handlers.PATCH(jsonRequest('PATCH', { action: 'restore', groupIds: ['group-4'] }))
  const deleteResponse = await handlers.PATCH(jsonRequest('PATCH', { action: 'delete', groupId: 'group-5' }))
  const assign = await handlers.PATCH(jsonRequest('PATCH', { action: 'assign-program', groupIds: ['group-6'], sourceProgramId: 'program-1' }))
  const addAthletes = await handlers.PATCH(jsonRequest('PATCH', { action: 'add-athletes', groupIds: ['group-7'], athleteIds: ['athlete-1'] }))

  assert.equal(singleArchive.status, 200)
  assert.equal(bulkArchive.status, 200)
  assert.equal(restore.status, 200)
  assert.equal(deleteResponse.status, 200)
  assert.equal(assign.status, 200)
  assert.equal(addAthletes.status, 200)
  assert.deepEqual(calls.map(([method]) => method), [
    'archiveGroup',
    'archiveGroups',
    'restoreGroups',
    'deleteGroup',
    'assignProgramToGroups',
    'addAthletesToGroups',
  ])
  assert.deepEqual(await readJson(deleteResponse), { result: { id: 'group-5' } })
})

test('admin groups route contracts preserve repository error status and message', async () => {
  const error = new Error('Group name is required.')
  error.status = 400
  const repository = createRepository({ createGroup: async () => { throw error } })
  const handlers = createAdminGroupRouteHandlers({ createRepository: () => repository })

  const response = await handlers.POST(jsonRequest('POST', {}))

  assert.equal(response.status, 400)
  assert.deepEqual(await readJson(response), { error: 'Group name is required.' })
})
