import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminProgramRouteHandlers } from '../apps/web/lib/admin-program-route-handlers.js'
import { createAdminProgramRepository } from '../apps/web/lib/admin-program-repository.js'

async function readJson(response) {
  return response.json()
}

function withProgramDuplicateFetch(callback) {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const requests = []
  let programInsertCount = 0

  const sourceProgram = {
    id: 'program-source-1',
    athlete_id: 'athlete-source-1',
    coach_id: 'coach-1',
    name: 'Original Offseason Block',
    description: 'Original coach notes should not leak when notes are disabled.',
    start_date: '2026-07-01',
    end_date: '2026-07-28',
    status: 'active',
    created_at: '2026-06-01T14:00:00.000Z',
    athlete_profiles: { first_name: 'Source', last_name: 'Athlete' },
  }
  const duplicatedProgram = {
    id: 'program-copy-1',
    athlete_id: null,
    coach_id: 'coach-1',
    name: 'Original Offseason Block copy',
    description: null,
    start_date: null,
    end_date: null,
    status: 'active',
    created_at: '2026-06-20T14:00:00.000Z',
    athlete_profiles: null,
  }
  const sourceWeeks = [
    { id: 'source-week-1', program_id: 'program-source-1', week_index: 1, name: 'Week 1', start_date: '2026-07-01', end_date: '2026-07-07' },
  ]
  const sourceWorkouts = [
    {
      id: 'source-workout-1',
      athlete_id: 'athlete-source-1',
      coach_id: 'coach-1',
      program_id: 'program-source-1',
      program_day_id: null,
      workout_template_id: 'template-1',
      name_snapshot: 'Acceleration Day',
      notes: 'Do not copy these workout notes.',
      bg_color: '#102030',
      text_color: '#ffffff',
      status: 'scheduled',
      sort_order: 1,
      scheduled_date: '2026-07-02',
      scheduled_start_time: null,
      scheduled_end_time: null,
      created_at: '2026-06-01T14:00:00.000Z',
      updated_at: '2026-06-01T14:00:00.000Z',
      import_source: 'manual',
      import_source_file_name: null,
      workout_templates: null,
    },
  ]

  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    requests.push({ url: requestUrl, method, body })

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id,coach_id&id=eq.program-copy-1&limit=1')) {
      return Response.json([{ id: 'program-copy-1', athlete_id: null, coach_id: 'coach-1' }])
    }

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles')) {
      if (requestUrl.includes('id=eq.program-source-1')) return Response.json([sourceProgram])
      if (requestUrl.includes('id=eq.program-copy-1')) return Response.json([duplicatedProgram])
    }

    if (method === 'GET' && requestUrl.includes('/program_weeks?') && requestUrl.includes('program_id=eq.program-source-1')) {
      return Response.json(sourceWeeks)
    }

    if (method === 'GET' && requestUrl.includes('/program_weeks?') && requestUrl.includes('program_id=eq.program-copy-1')) {
      return Response.json([{ id: 'copy-week-1', program_id: 'program-copy-1', week_index: 1, name: 'Week 1', start_date: '2026-07-01', end_date: '2026-07-07' }])
    }

    if (method === 'GET' && requestUrl.includes('/program_days?')) {
      return Response.json([])
    }

    if (method === 'GET' && requestUrl.includes('/program_workouts?') && requestUrl.includes('program_id=eq.program-source-1')) {
      return Response.json(sourceWorkouts)
    }

    if (method === 'GET' && requestUrl.includes('/program_workouts?') && requestUrl.includes('program_id=eq.program-copy-1')) {
      return Response.json([{ ...sourceWorkouts[0], id: 'copy-workout-1', athlete_id: null, program_id: 'program-copy-1', notes: null }])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_blocks?')) {
      return Response.json([])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_exercises?')) {
      return Response.json([])
    }

    if (method === 'POST' && requestUrl.endsWith('/programs')) {
      programInsertCount += 1
      return Response.json([{ id: `program-copy-${programInsertCount}`, ...body }])
    }

    if (method === 'POST' && requestUrl.endsWith('/program_weeks')) {
      return Response.json([{ id: 'copy-week-1', ...body[0] }])
    }

    if (method === 'POST' && requestUrl.endsWith('/program_workouts')) {
      return Response.json([{ id: 'copy-workout-1', ...body[0] }])
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

test('admin programs POST route sends duplicate action to the dedicated repository method', async () => {
  const calls = []
  const duplicatedProgram = { id: 'program-copy-1', name: 'Copied program' }
  const handlers = createAdminProgramRouteHandlers({
    createRepository: () => ({
      duplicateProgram: async (payload) => {
        calls.push(payload)
        return duplicatedProgram
      },
      createProgram: async () => {
        throw new Error('duplicate action should not use generic create')
      },
    }),
  })

  const response = await handlers.POST(new Request('http://pplus.test/api/admin/programs', {
    method: 'POST',
    body: JSON.stringify({
      action: 'duplicate',
      sourceProgramId: 'program-source-1',
      athleteIds: [],
      name: 'Original Offseason Block copy',
      startDate: '',
      endDate: '',
      description: 'Copied description draft',
      copyOptions: { athletes: false, schedule: true, exercises: true, notes: false },
    }),
  }))

  assert.equal(response.status, 201)
  assert.deepEqual(await readJson(response), { program: duplicatedProgram })
  assert.deepEqual(calls, [{
    sourceProgramId: 'program-source-1',
    athleteIds: [],
    name: 'Original Offseason Block copy',
    startDate: '',
    endDate: '',
    description: 'Copied description draft',
    copyOptions: { athletes: false, schedule: true, exercises: true, notes: false },
  }])
})

test('admin program repository duplicate action creates a fresh unassigned copy and clones the planning shell without history', async () => {
  await withProgramDuplicateFetch(async ({ requests }) => {
    const repository = createAdminProgramRepository()

    const program = await repository.duplicateProgram({
      sourceProgramId: 'program-source-1',
      athleteIds: [],
      name: 'Original Offseason Block copy',
      startDate: '',
      endDate: '',
      description: 'Copied description draft',
      copyOptions: { athletes: false, schedule: true, exercises: true, notes: false },
    })

    const programInsert = requests.find((request) => request.method === 'POST' && request.url.endsWith('/programs'))
    const weekInsert = requests.find((request) => request.method === 'POST' && request.url.endsWith('/program_weeks'))
    const workoutInsert = requests.find((request) => request.method === 'POST' && request.url.endsWith('/program_workouts'))
    const sessionTableRequests = requests.filter((request) => /session|completed|history/i.test(request.url))

    assert.deepEqual(programInsert.body, {
      athlete_id: null,
      coach_id: 'coach-1',
      name: 'Original Offseason Block copy',
      description: null,
      start_date: null,
      end_date: null,
      status: 'active',
      updated_at: programInsert.body.updated_at,
    })
    assert.match(programInsert.body.updated_at, /^\d{4}-\d{2}-\d{2}T/)
    assert.deepEqual(weekInsert.body, [{
      program_id: 'program-copy-1',
      week_index: 1,
      name: 'Week 1',
      start_date: '2026-07-01',
      end_date: '2026-07-07',
    }])
    assert.deepEqual(workoutInsert.body, [{
      athlete_id: null,
      coach_id: 'coach-1',
      program_id: 'program-copy-1',
      program_day_id: null,
      workout_template_id: 'template-1',
      name_snapshot: 'Acceleration Day',
      notes: null,
      bg_color: '#102030',
      text_color: '#ffffff',
      status: 'scheduled',
      sort_order: 1,
      scheduled_date: '2026-07-02',
      scheduled_start_time: null,
      scheduled_end_time: null,
      import_source: 'manual',
      import_source_file_name: null,
    }])
    assert.deepEqual(sessionTableRequests, [])
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
      weekCount: program.weekCount,
      workouts: program.workouts,
    }, {
      id: 'program-copy-1',
      athleteId: null,
      athleteIds: [],
      assignedAthleteIds: [],
      programType: 'Unassigned',
      athletesLabel: 'Unassigned',
      name: 'Original Offseason Block copy',
      startDate: '',
      endDate: '',
      description: '',
      weekCount: 1,
      workouts: '1',
    })
  })
})
