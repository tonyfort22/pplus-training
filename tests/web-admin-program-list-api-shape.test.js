import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminProgramRouteHandlers } from '../apps/web/lib/admin-program-route-handlers.js'
import { createAdminProgramRepository } from '../apps/web/lib/admin-program-repository.js'

async function readJson(response) {
  return response.json()
}

function withSupabaseFetch(tableRows, callback) {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const requests = []

  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url)
    requests.push({ url: requestUrl, options })
    const tableName = requestUrl.match(/\/rest\/v1\/([^?]+)/)?.[1]
    const rows = tableRows[tableName]
    if (!Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: `Unhandled table ${tableName}` }), { status: 500 })
    }
    return Response.json(rows)
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

test('admin programs GET route returns programs and athlete options from the repository', async () => {
  const calls = []
  const repository = {
    listPrograms: async () => {
      calls.push('listPrograms')
      return [{ id: 'program-a', name: 'Speed Block' }]
    },
    listAthleteOptions: async () => {
      calls.push('listAthleteOptions')
      return [{ id: 'athlete-a', name: 'Avery Adams', avatarUrl: 'https://cdn/avatar.png' }]
    },
  }
  const handlers = createAdminProgramRouteHandlers({ createRepository: () => repository })

  const response = await handlers.GET()

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), {
    programs: [{ id: 'program-a', name: 'Speed Block' }],
    athleteOptions: [{ id: 'athlete-a', name: 'Avery Adams', avatarUrl: 'https://cdn/avatar.png' }],
  })
  assert.deepEqual(calls.sort(), ['listAthleteOptions', 'listPrograms'].sort())
})

test('admin programs GET route preserves repository error status and message', async () => {
  const error = new Error('Programs unavailable.')
  error.status = 503
  const handlers = createAdminProgramRouteHandlers({
    createRepository: () => ({
      listPrograms: async () => { throw error },
      listAthleteOptions: async () => [],
    }),
  })

  const response = await handlers.GET()

  assert.equal(response.status, 503)
  assert.deepEqual(await readJson(response), { error: 'Programs unavailable.' })
})

test('admin program repository listPrograms returns the admin list row shape with counts and grouped assignments', async () => {
  await withSupabaseFetch({
    programs: [
      {
        id: 'program-1',
        athlete_id: 'athlete-1',
        coach_id: 'coach-1',
        name: 'Speed Block',
        description: 'Acceleration phase',
        start_date: '2026-06-01',
        end_date: '2026-07-13',
        status: 'active',
        created_at: '2026-05-20T15:00:00.000Z',
        athlete_profiles: { first_name: 'Avery', last_name: 'Adams' },
      },
      {
        id: 'program-2',
        athlete_id: 'athlete-2',
        coach_id: 'coach-1',
        name: 'Speed Block',
        description: 'Acceleration phase',
        start_date: '2026-06-01',
        end_date: '2026-07-13',
        status: 'active',
        created_at: '2026-05-21T15:00:00.000Z',
        athlete_profiles: { first_name: 'Blake', last_name: 'Baker' },
      },
      {
        id: 'program-3',
        athlete_id: null,
        coach_id: 'coach-1',
        name: 'Mobility Reset',
        description: null,
        start_date: null,
        end_date: null,
        status: 'draft',
        created_at: null,
        athlete_profiles: null,
      },
    ],
    program_weeks: [
      { id: 'week-1', program_id: 'program-1' },
      { id: 'week-2', program_id: 'program-1' },
      { id: 'week-3', program_id: 'program-2' },
    ],
    program_workouts: [
      { id: 'workout-1', program_id: 'program-1' },
      { id: 'workout-2', program_id: 'program-1' },
      { id: 'workout-3', program_id: 'program-2' },
    ],
    program_workout_exercises: [
      { id: 'exercise-1', program_workout_id: 'workout-1' },
      { id: 'exercise-2', program_workout_id: 'workout-1' },
      { id: 'exercise-3', program_workout_id: 'workout-2' },
      { id: 'exercise-4', program_workout_id: 'workout-3' },
    ],
  }, async ({ requests }) => {
    const repository = createAdminProgramRepository()

    const programs = await repository.listPrograms()

    assert.deepEqual(programs, [
      {
        id: 'program-1',
        athleteId: 'athlete-1',
        athleteIds: ['athlete-1'],
        assignedAthleteIds: ['athlete-1', 'athlete-2'],
        coachId: 'coach-1',
        programType: 'Assigned',
        name: 'Speed Block',
        athletesLabel: 'Avery Adams',
        weekCount: 2,
        duration: '2 weeks',
        workouts: '2',
        exercises: '3',
        createdDate: '2026-05-20',
        createdAt: '2026-05-20T15:00:00.000Z',
        startDate: '2026-06-01',
        endDate: '2026-07-13',
        description: 'Acceleration phase',
        status: 'Active',
        statusValue: 'active',
      },
      {
        id: 'program-2',
        athleteId: 'athlete-2',
        athleteIds: ['athlete-2'],
        assignedAthleteIds: ['athlete-1', 'athlete-2'],
        coachId: 'coach-1',
        programType: 'Assigned',
        name: 'Speed Block',
        athletesLabel: 'Blake Baker',
        weekCount: 1,
        duration: '1 week',
        workouts: '1',
        exercises: '1',
        createdDate: '2026-05-21',
        createdAt: '2026-05-21T15:00:00.000Z',
        startDate: '2026-06-01',
        endDate: '2026-07-13',
        description: 'Acceleration phase',
        status: 'Active',
        statusValue: 'active',
      },
      {
        id: 'program-3',
        athleteId: null,
        athleteIds: [],
        assignedAthleteIds: [],
        coachId: 'coach-1',
        programType: 'Unassigned',
        name: 'Mobility Reset',
        athletesLabel: 'Unassigned',
        weekCount: 0,
        duration: '-',
        workouts: '0',
        exercises: '0',
        createdDate: '-',
        createdAt: null,
        startDate: '',
        endDate: '',
        description: '',
        status: 'Draft',
        statusValue: 'draft',
      },
    ])
    assert.deepEqual(requests.map((request) => request.url.replace('https://pplus-test.supabase.co/rest/v1/', '')), [
      'programs?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles(first_name,last_name)&order=created_at.asc',
      'program_weeks?select=id,program_id',
      'program_workouts?select=id,program_id',
      'program_workout_exercises?select=id,program_workout_id',
    ])
  })
})

test('admin program repository listAthleteOptions returns avatar-aware select options', async () => {
  await withSupabaseFetch({
    athlete_profiles: [
      { id: 'athlete-1', first_name: 'Avery', last_name: 'Adams', avatar_url: 'https://cdn/avery.png' },
      { id: 'athlete-2', first_name: '', last_name: '', avatar_url: null },
    ],
  }, async ({ requests }) => {
    const repository = createAdminProgramRepository()

    const athleteOptions = await repository.listAthleteOptions()

    assert.deepEqual(athleteOptions, [
      { id: 'athlete-1', name: 'Avery Adams', avatarUrl: 'https://cdn/avery.png' },
      { id: 'athlete-2', name: 'Unnamed athlete', avatarUrl: '' },
    ])
    assert.deepEqual(requests.map((request) => request.url.replace('https://pplus-test.supabase.co/rest/v1/', '')), [
      'athlete_profiles?select=id,first_name,last_name,avatar_url&order=created_at.asc',
    ])
  })
})
