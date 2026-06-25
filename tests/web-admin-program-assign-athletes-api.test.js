import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminProgramRouteHandlers } from '../apps/web/lib/admin-program-route-handlers.js'
import { createAdminProgramRepository } from '../apps/web/lib/admin-program-repository.js'

async function readJson(response) {
  return response.json()
}

function withProgramAssignFetch(callback) {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const requests = []
  let primaryProgramReadCount = 0

  const beforeProgram = {
    id: 'program-assign-1',
    athlete_id: null,
    coach_id: 'coach-1',
    name: 'Assign Source Block',
    description: 'Keep these details unchanged.',
    start_date: '2026-09-01',
    end_date: '2026-09-28',
    status: 'active',
    created_at: '2026-06-01T14:00:00.000Z',
    athlete_profiles: null,
  }
  const afterProgram = {
    ...beforeProgram,
    athlete_id: 'athlete-1',
    athlete_profiles: { first_name: 'Avery', last_name: 'Adams' },
  }
  const sourceWeeks = [
    { id: 'source-week-1', program_id: 'program-assign-1', week_index: 1, name: 'Week 1', start_date: '2026-09-01', end_date: '2026-09-07' },
  ]

  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    requests.push({ url: requestUrl, method, body })

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id,coach_id&id=eq.program-sibling-2&limit=1')) {
      return Response.json([{ id: 'program-sibling-2', athlete_id: 'athlete-2', coach_id: 'coach-1' }])
    }

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles')) {
      primaryProgramReadCount += 1
      return Response.json([primaryProgramReadCount >= 3 ? afterProgram : beforeProgram])
    }

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id&name=eq.')) {
      return Response.json([{ id: 'program-assign-1', athlete_id: null }])
    }

    if (method === 'GET' && requestUrl.includes('/program_weeks?')) {
      return Response.json(sourceWeeks)
    }

    if (method === 'GET' && requestUrl.includes('/program_days?')) {
      return Response.json([])
    }

    if (method === 'GET' && requestUrl.includes('/program_workouts?')) {
      return Response.json([])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_blocks?')) {
      return Response.json([])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_exercises?')) {
      return Response.json([])
    }

    if (method === 'PATCH' && requestUrl.includes('/programs?id=eq.program-assign-1')) {
      return Response.json([{ id: 'program-assign-1', ...body }])
    }

    if (method === 'PATCH' && requestUrl.includes('/program_workouts?program_id=eq.program-assign-1')) {
      return Response.json([])
    }

    if (method === 'POST' && requestUrl.endsWith('/programs')) {
      return Response.json([{ id: 'program-sibling-2', ...body }])
    }

    if (method === 'POST' && requestUrl.endsWith('/program_weeks')) {
      return Response.json([{ id: 'cloned-week-1', ...body[0] }])
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

test('admin programs PATCH route sends assign-athletes action to the dedicated repository method', async () => {
  const calls = []
  const assignedProgram = { id: 'program-assign-1', assignedAthleteIds: ['athlete-1', 'athlete-2'] }
  const handlers = createAdminProgramRouteHandlers({
    createRepository: () => ({
      assignProgramToAthletes: async (payload) => {
        calls.push(payload)
        return assignedProgram
      },
      updateProgram: async () => {
        throw new Error('assign action should not use generic update')
      },
    }),
  })

  const response = await handlers.PATCH(new Request('http://pplus.test/api/admin/programs', {
    method: 'PATCH',
    body: JSON.stringify({ action: 'assign-athletes', id: 'program-assign-1', athleteIds: ['athlete-1', 'athlete-2'] }),
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), { program: assignedProgram })
  assert.deepEqual(calls, [{ programId: 'program-assign-1', athleteIds: ['athlete-1', 'athlete-2'] }])
})

test('admin program repository assign action preserves details, creates sibling assignments, and clones the planning shell', async () => {
  await withProgramAssignFetch(async ({ requests }) => {
    const repository = createAdminProgramRepository()

    const program = await repository.assignProgramToAthletes({
      programId: 'program-assign-1',
      athleteIds: ['athlete-1', 'athlete-2'],
    })

    const primaryPatch = requests.find((request) => request.method === 'PATCH' && request.url.includes('/programs?id=eq.program-assign-1'))
    const workoutPatch = requests.find((request) => request.method === 'PATCH' && request.url.includes('/program_workouts?program_id=eq.program-assign-1'))
    const siblingInsert = requests.find((request) => request.method === 'POST' && request.url.endsWith('/programs'))
    const clonedWeekInsert = requests.find((request) => request.method === 'POST' && request.url.endsWith('/program_weeks'))

    assert.deepEqual(primaryPatch.body, {
      athlete_id: 'athlete-1',
      coach_id: 'coach-1',
      name: 'Assign Source Block',
      description: 'Keep these details unchanged.',
      start_date: '2026-09-01',
      end_date: '2026-09-28',
      status: 'active',
      updated_at: primaryPatch.body.updated_at,
    })
    assert.match(primaryPatch.body.updated_at, /^\d{4}-\d{2}-\d{2}T/)
    assert.deepEqual({
      athlete_id: workoutPatch.body.athlete_id,
      coach_id: workoutPatch.body.coach_id,
      updated_at: /^\d{4}-\d{2}-\d{2}T/.test(workoutPatch.body.updated_at),
    }, {
      athlete_id: 'athlete-1',
      coach_id: 'coach-1',
      updated_at: true,
    })
    assert.deepEqual(siblingInsert.body, {
      athlete_id: 'athlete-2',
      coach_id: 'coach-1',
      name: 'Assign Source Block',
      description: 'Keep these details unchanged.',
      start_date: '2026-09-01',
      end_date: '2026-09-28',
      status: 'active',
      updated_at: siblingInsert.body.updated_at,
    })
    assert.match(siblingInsert.body.updated_at, /^\d{4}-\d{2}-\d{2}T/)
    assert.deepEqual(clonedWeekInsert.body, [{
      program_id: 'program-sibling-2',
      week_index: 1,
      name: 'Week 1',
      start_date: '2026-09-01',
      end_date: '2026-09-07',
    }])
    assert.deepEqual({
      id: program.id,
      athleteId: program.athleteId,
      athleteIds: program.athleteIds,
      assignedAthleteIds: program.assignedAthleteIds,
      programType: program.programType,
      athletesLabel: program.athletesLabel,
      name: program.name,
      startDate: program.startDate,
      endDate: program.endDate,
      description: program.description,
    }, {
      id: 'program-assign-1',
      athleteId: 'athlete-1',
      athleteIds: ['athlete-1'],
      assignedAthleteIds: ['athlete-1'],
      programType: 'Assigned',
      athletesLabel: 'Avery Adams',
      name: 'Assign Source Block',
      startDate: '2026-09-01',
      endDate: '2026-09-28',
      description: 'Keep these details unchanged.',
    })
  })
})
