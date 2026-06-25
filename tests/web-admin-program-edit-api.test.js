import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminProgramRouteHandlers } from '../apps/web/lib/admin-program-route-handlers.js'
import { createAdminProgramRepository } from '../apps/web/lib/admin-program-repository.js'

async function readJson(response) {
  return response.json()
}

function withProgramEditFetch(callback) {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const requests = []
  let programReadCount = 0

  const beforeProgram = {
    id: 'program-edit-1',
    athlete_id: 'athlete-1',
    coach_id: 'coach-1',
    name: 'Original Block',
    description: 'Original description',
    start_date: '2026-07-01',
    end_date: '2026-07-28',
    status: 'active',
    created_at: '2026-06-01T14:00:00.000Z',
    athlete_profiles: { first_name: 'Avery', last_name: 'Adams' },
  }
  const afterProgram = {
    ...beforeProgram,
    athlete_id: null,
    name: 'Edited Block',
    description: 'Updated edit details.',
    start_date: '2026-08-01',
    end_date: '2026-08-28',
    athlete_profiles: null,
  }
  const weekRows = [
    { id: 'week-1', program_id: 'program-edit-1', week_index: 1, name: 'Week 1', start_date: '2026-08-01', end_date: '2026-08-07' },
  ]
  const workoutRows = [
    { id: 'workout-1', program_id: 'program-edit-1' },
  ]

  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    requests.push({ url: requestUrl, method, body })

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles')) {
      programReadCount += 1
      return Response.json([programReadCount === 1 ? beforeProgram : afterProgram])
    }

    if (method === 'GET' && requestUrl.includes('/program_weeks?')) {
      return Response.json(weekRows)
    }

    if (method === 'GET' && requestUrl.includes('/program_workouts?select=id,athlete_id')) {
      return Response.json([])
    }

    if (method === 'GET' && requestUrl.includes('/program_workouts?select=id,program_id')) {
      return Response.json(workoutRows)
    }

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id&name=eq.')) {
      return Response.json([
        { id: 'program-edit-1', athlete_id: 'athlete-1' },
        { id: 'program-sibling-1', athlete_id: 'athlete-2' },
      ])
    }

    if (method === 'GET' && (
      requestUrl.includes('/program_days?')
      || requestUrl.includes('/program_workout_blocks?')
      || requestUrl.includes('/program_workout_exercises?')
    )) {
      return Response.json([])
    }

    if (method === 'PATCH' && requestUrl.includes('/programs?id=eq.program-edit-1')) {
      return Response.json([{ id: 'program-edit-1', ...body }])
    }

    if (method === 'PATCH' && requestUrl.includes('/program_workouts?program_id=eq.program-edit-1')) {
      return Response.json([{ id: 'workout-1', ...body }])
    }

    if (method === 'DELETE' && requestUrl.includes('/programs?id=eq.program-sibling-1')) {
      return Response.json([{ id: 'program-sibling-1' }])
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

test('admin programs PATCH route updates program details through the repository', async () => {
  const calls = []
  const updatedProgram = { id: 'program-edit-1', name: 'Edited Block', athleteId: null }
  const handlers = createAdminProgramRouteHandlers({
    createRepository: () => ({
      updateProgram: async (payload) => {
        calls.push(payload)
        return updatedProgram
      },
    }),
  })

  const response = await handlers.PATCH(new Request('http://pplus.test/api/admin/programs', {
    method: 'PATCH',
    body: JSON.stringify({
      id: 'program-edit-1',
      athleteIds: [],
      name: 'Edited Block',
      startDate: '2026-08-01',
      endDate: '2026-08-28',
      description: 'Updated edit details.',
    }),
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), { program: updatedProgram })
  assert.deepEqual(calls, [{
    programId: 'program-edit-1',
    athleteIds: [],
    name: 'Edited Block',
    startDate: '2026-08-01',
    endDate: '2026-08-28',
    description: 'Updated edit details.',
  }])
})

test('admin program repository edit persists details, clears assignments, and refreshes the admin row shape', async () => {
  await withProgramEditFetch(async ({ requests }) => {
    const repository = createAdminProgramRepository()

    const program = await repository.updateProgram({
      programId: 'program-edit-1',
      athleteIds: [],
      name: 'Edited Block',
      startDate: '2026-08-01',
      endDate: '2026-08-28',
      description: 'Updated edit details.',
    })

    const programPatch = requests.find((request) => request.method === 'PATCH' && request.url.includes('/programs?id=eq.program-edit-1'))
    const workoutPatch = requests.find((request) => request.method === 'PATCH' && request.url.includes('/program_workouts?program_id=eq.program-edit-1'))
    const siblingDelete = requests.find((request) => request.method === 'DELETE' && request.url.includes('/programs?id=eq.program-sibling-1'))

    assert.deepEqual(programPatch.body, {
      athlete_id: null,
      coach_id: 'coach-1',
      name: 'Edited Block',
      description: 'Updated edit details.',
      start_date: '2026-08-01',
      end_date: '2026-08-28',
      status: 'active',
      updated_at: programPatch.body.updated_at,
    })
    assert.match(programPatch.body.updated_at, /^\d{4}-\d{2}-\d{2}T/)
    assert.deepEqual({
      athlete_id: workoutPatch.body.athlete_id,
      coach_id: workoutPatch.body.coach_id,
      updated_at: /^\d{4}-\d{2}-\d{2}T/.test(workoutPatch.body.updated_at),
    }, {
      athlete_id: null,
      coach_id: 'coach-1',
      updated_at: true,
    })
    assert.ok(siblingDelete, 'clearing assignments should remove stale sibling program rows')
    assert.deepEqual({
      id: program.id,
      name: program.name,
      athleteId: program.athleteId,
      athleteIds: program.athleteIds,
      assignedAthleteIds: program.assignedAthleteIds,
      programType: program.programType,
      athletesLabel: program.athletesLabel,
      startDate: program.startDate,
      endDate: program.endDate,
      description: program.description,
      status: program.status,
    }, {
      id: 'program-edit-1',
      name: 'Edited Block',
      athleteId: null,
      athleteIds: [],
      assignedAthleteIds: [],
      programType: 'Unassigned',
      athletesLabel: 'Unassigned',
      startDate: '2026-08-01',
      endDate: '2026-08-28',
      description: 'Updated edit details.',
      status: 'Active',
    })
  })
})
