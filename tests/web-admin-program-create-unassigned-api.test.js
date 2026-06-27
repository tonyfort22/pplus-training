import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminProgramRouteHandlers } from '../apps/web/lib/admin-program-route-handlers.js'
import { createAdminProgramRepository } from '../apps/web/lib/admin-program-repository.js'

async function readJson(response) {
  return response.json()
}

function withProgramCreateFetch(callback) {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const requests = []
  const createdWeeks = [
    { id: 'week-1', program_id: 'program-unassigned-1', week_index: 1, name: 'Week 1', start_date: '2026-07-01', end_date: '2026-07-07' },
    { id: 'week-2', program_id: 'program-unassigned-1', week_index: 2, name: 'Week 2', start_date: '2026-07-08', end_date: '2026-07-14' },
  ]

  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    requests.push({ url: requestUrl, method, body })

    if (method === 'GET' && requestUrl.includes('/coach_profiles?')) {
      return Response.json([{ id: 'coach-1' }])
    }

    if (method === 'POST' && requestUrl.endsWith('/programs')) {
      return Response.json([{
        id: 'program-unassigned-1',
        athlete_profiles: null,
        created_at: '2026-06-20T16:00:00.000Z',
        ...body,
      }])
    }

    if (method === 'POST' && requestUrl.endsWith('/program_weeks')) {
      return Response.json(createdWeeks)
    }

    if (method === 'GET' && requestUrl.includes('/programs?select=')) {
      return Response.json([{
        id: 'program-unassigned-1',
        athlete_id: null,
        coach_id: 'coach-1',
        name: 'Summer Skills Shell',
        description: 'Create first, assign athletes later.',
        start_date: '2026-07-01',
        end_date: '2026-07-14',
        status: 'active',
        created_at: '2026-06-20T16:00:00.000Z',
        athlete_profiles: null,
      }])
    }

    if (method === 'GET' && requestUrl.includes('/program_weeks?')) {
      return Response.json(createdWeeks)
    }

    if (method === 'GET' && (
      requestUrl.includes('/program_days?')
      || requestUrl.includes('/program_workouts?')
      || requestUrl.includes('/program_workout_blocks?')
      || requestUrl.includes('/program_workout_exercises?')
    )) {
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

test('admin programs POST route creates an unassigned program when athleteIds is empty', async () => {
  const calls = []
  const createdProgram = { id: 'program-unassigned-1', athleteId: null, athletesLabel: 'Unassigned' }
  const handlers = createAdminProgramRouteHandlers({
    createRepository: () => ({
      createProgram: async (payload) => {
        calls.push(payload)
        return createdProgram
      },
    }),
  })

  const response = await handlers.POST(new Request('http://pplus.test/api/admin/programs', {
    method: 'POST',
    body: JSON.stringify({
      athleteIds: [],
      name: 'Summer Skills Shell',
      weeks: 2,
      startDate: '2026-07-01',
      endDate: '2026-07-14',
      description: 'Create first, assign athletes later.',
      status: 'active',
    }),
  }))

  assert.equal(response.status, 201)
  assert.deepEqual(await readJson(response), { program: createdProgram })
  assert.deepEqual(calls, [{
    athleteIds: [],
    name: 'Summer Skills Shell',
    weeks: 2,
    startDate: '2026-07-01',
    endDate: '2026-07-14',
    description: 'Create first, assign athletes later.',
    status: 'active',
  }])
})

test('admin program repository persists unassigned create with nullable athlete_id and generated weeks', async () => {
  await withProgramCreateFetch(async ({ requests }) => {
    const repository = createAdminProgramRepository()

    const program = await repository.createProgram({
      athleteIds: [],
      name: 'Summer Skills Shell',
      weeks: 2,
      startDate: '2026-07-01',
      endDate: '2026-07-14',
      description: 'Create first, assign athletes later.',
      status: 'active',
    })

    const programInsert = requests.find((request) => request.method === 'POST' && request.url.endsWith('/programs'))
    const weekInsert = requests.find((request) => request.method === 'POST' && request.url.endsWith('/program_weeks'))

    assert.deepEqual(programInsert.body, {
      athlete_id: null,
      coach_id: 'coach-1',
      name: 'Summer Skills Shell',
      description: 'Create first, assign athletes later.',
      start_date: '2026-07-01',
      end_date: '2026-07-14',
      status: 'active',
      updated_at: programInsert.body.updated_at,
    })
    assert.match(programInsert.body.updated_at, /^\d{4}-\d{2}-\d{2}T/)
    assert.deepEqual(weekInsert.body.map((week) => ({
      program_id: week.program_id,
      week_index: week.week_index,
      name: week.name,
      start_date: week.start_date,
      end_date: week.end_date,
    })), [
      { program_id: 'program-unassigned-1', week_index: 1, name: 'Week 1', start_date: '2026-07-01', end_date: '2026-07-07' },
      { program_id: 'program-unassigned-1', week_index: 2, name: 'Week 2', start_date: '2026-07-08', end_date: '2026-07-14' },
    ])
    assert.deepEqual({
      id: program.id,
      athleteId: program.athleteId,
      athleteIds: program.athleteIds,
      assignedAthleteIds: program.assignedAthleteIds,
      programType: program.programType,
      athletesLabel: program.athletesLabel,
      weekCount: program.weekCount,
      duration: program.duration,
      status: program.status,
      statusValue: program.statusValue,
    }, {
      id: 'program-unassigned-1',
      athleteId: null,
      athleteIds: [],
      assignedAthleteIds: [],
      programType: 'Unassigned',
      athletesLabel: 'Unassigned',
      weekCount: 2,
      duration: '2 weeks',
      status: 'Active',
      statusValue: 'active',
    })
  })
})
