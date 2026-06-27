import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminProgramRouteHandlers } from '../apps/web/lib/admin-program-route-handlers.js'
import { createAdminProgramRepository } from '../apps/web/lib/admin-program-repository.js'

async function readJson(response) {
  return response.json()
}

function withProgramArchiveFetch(callback) {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const requests = []

  const activeProgram = {
    id: 'program-active-1',
    athlete_id: 'athlete-1',
    coach_id: 'coach-1',
    name: 'Archive-ready speed block',
    description: 'Keep the row details intact after archive.',
    start_date: '2026-07-01',
    end_date: '2026-07-28',
    status: 'active',
    created_at: '2026-06-01T14:00:00.000Z',
    athlete_profiles: { first_name: 'Avery', last_name: 'Adams' },
  }
  const archivedProgram = { ...activeProgram, status: 'archived' }

  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    requests.push({ url: requestUrl, method, body })

    if (method === 'GET' && requestUrl.includes('/programs?select=id,status&id=in.(program-active-1)')) {
      return Response.json([{ id: 'program-active-1', status: 'active' }])
    }

    if (method === 'PATCH' && requestUrl.includes('/programs?id=in.(program-active-1)')) {
      return Response.json([{ id: 'program-active-1', ...body }])
    }

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles')) {
      if (requestUrl.includes('id=eq.program-active-1')) return Response.json([archivedProgram])
    }

    if (method === 'GET' && requestUrl.includes('/program_weeks?') && requestUrl.includes('program_id=eq.program-active-1')) {
      return Response.json([{ id: 'week-1', program_id: 'program-active-1', week_index: 1, name: 'Week 1', start_date: '2026-07-01', end_date: '2026-07-07' }])
    }

    if (method === 'GET' && requestUrl.includes('/program_days?')) {
      return Response.json([])
    }

    if (method === 'GET' && requestUrl.includes('/program_workouts?') && requestUrl.includes('program_id=eq.program-active-1')) {
      return Response.json([
        { id: 'workout-1', program_id: 'program-active-1' },
        { id: 'workout-2', program_id: 'program-active-1' },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_blocks?')) {
      return Response.json([])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_exercises?')) {
      return Response.json([
        { id: 'exercise-1', program_workout_id: 'workout-1' },
        { id: 'exercise-2', program_workout_id: 'workout-2' },
        { id: 'exercise-3', program_workout_id: 'workout-2' },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_sets?')) {
      return Response.json([])
    }

    return new Response(JSON.stringify({ error: `Unhandled ${method} ${requestUrl}` }), { status: 500 })
  }

  return Promise.resolve()
    .then(() => callback({ requests }))
    .finally(() => {
      if (previousUrl === undefined) delete process.env.SUPABASE_URL
      else process.env.SUPABASE_URL = previousUrl
      if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
      else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey
      globalThis.fetch = previousFetch
    })
}

test('admin programs PATCH route sends archive action to the dedicated repository method', async () => {
  const calls = []
  const archivedProgram = { id: 'program-active-1', status: 'Archived' }
  const handlers = createAdminProgramRouteHandlers({
    createRepository: () => ({
      archiveProgram: async (programId) => {
        calls.push(programId)
        return archivedProgram
      },
      updateProgram: async () => {
        throw new Error('archive action should not use generic update')
      },
      archivePrograms: async () => {
        throw new Error('single archive action should not use bulk archive')
      },
    }),
  })

  const response = await handlers.PATCH(new Request('http://pplus.test/api/admin/programs', {
    method: 'PATCH',
    body: JSON.stringify({ action: 'archive', id: 'program-active-1' }),
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), { program: archivedProgram })
  assert.deepEqual(calls, ['program-active-1'])
})

test('admin program repository archive action patches status and returns the refreshed archived row shape', async () => {
  await withProgramArchiveFetch(async ({ requests }) => {
    const repository = createAdminProgramRepository()

    const program = await repository.archiveProgram('program-active-1')

    const statusLookup = requests.find((request) => request.method === 'GET' && request.url.includes('/programs?select=id,status&id=in.(program-active-1)'))
    const statusPatch = requests.find((request) => request.method === 'PATCH' && request.url.includes('/programs?id=in.(program-active-1)'))
    const deleteRequests = requests.filter((request) => request.method === 'DELETE')

    assert.ok(statusLookup)
    assert.deepEqual(statusPatch.body, {
      status: 'archived',
      updated_at: statusPatch.body.updated_at,
    })
    assert.match(statusPatch.body.updated_at, /^\d{4}-\d{2}-\d{2}T/)
    assert.deepEqual(deleteRequests, [])
    assert.deepEqual({
      id: program.id,
      athleteId: program.athleteId,
      athleteIds: program.athleteIds,
      assignedAthleteIds: program.assignedAthleteIds,
      programType: program.programType,
      athletesLabel: program.athletesLabel,
      name: program.name,
      status: program.status,
      statusValue: program.statusValue,
      weekCount: program.weekCount,
      workouts: program.workouts,
      exercises: program.exercises,
    }, {
      id: 'program-active-1',
      athleteId: 'athlete-1',
      athleteIds: ['athlete-1'],
      assignedAthleteIds: ['athlete-1'],
      programType: 'Assigned',
      athletesLabel: 'Avery Adams',
      name: 'Archive-ready speed block',
      status: 'Archived',
      statusValue: 'archived',
      weekCount: 1,
      workouts: '2',
      exercises: '3',
    })
  })
})
