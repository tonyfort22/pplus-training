import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminGroupRepository } from '../apps/web/lib/admin-group-repository.js'

const originalFetch = globalThis.fetch
const originalSupabaseUrl = process.env.SUPABASE_URL
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function getRestTable(url) {
  const parsed = new URL(url)
  return parsed.pathname.split('/').pop()
}

function withMockedSupabaseFetch(handler) {
  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    return handler(String(url), options, calls)
  }
  return calls
}

function restoreGlobals() {
  globalThis.fetch = originalFetch
  if (originalSupabaseUrl === undefined) delete process.env.SUPABASE_URL
  else process.env.SUPABASE_URL = originalSupabaseUrl
  if (originalServiceRoleKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey
}

test('admin groups program options include real workout counts for assign-program dropdown', async () => {
  const calls = withMockedSupabaseFetch((url, options) => {
    const table = getRestTable(url)
    assert.equal(options.method, 'GET')

    if (table === 'programs') {
      return jsonResponse([
        { id: 'program-a', name: 'Speed Block', athlete_profiles: { first_name: 'Tony', last_name: 'Skater' } },
        { id: 'program-b', name: 'Strength Block', athlete_profiles: null },
      ])
    }

    if (table === 'program_workouts') {
      return jsonResponse([
        { id: 'workout-1', program_id: 'program-a' },
        { id: 'workout-2', program_id: 'program-a' },
        { id: 'workout-3', program_id: 'program-b' },
      ])
    }

    return jsonResponse([], { status: 404 })
  })

  try {
    const repository = createAdminGroupRepository()
    const options = await repository.listProgramOptions()

    assert.equal(calls.length, 2)
    assert.deepEqual(options.map((program) => ({ id: program.id, workouts: program.workouts, workoutCount: program.workoutCount })), [
      { id: 'program-a', workouts: '2', workoutCount: 2 },
      { id: 'program-b', workouts: '1', workoutCount: 1 },
    ])
    assert.equal(options[0].label, 'Speed Block · Tony Skater')
    assert.equal(options[1].athleteLabel, 'Unassigned')
  } finally {
    restoreGlobals()
  }
})

test('admin groups assign-program workflow dedupes group athletes and clones the source program once per athlete', async () => {
  let createdProgramIndex = 0
  const calls = withMockedSupabaseFetch((url, options) => {
    const parsed = new URL(url)
    const table = getRestTable(url)
    const method = options.method

    if (method === 'GET' && table === 'athlete_group_memberships') {
      const groupId = parsed.searchParams.get('athlete_group_id')?.replace(/^eq\./, '')
      if (groupId === 'group-a') return jsonResponse([{ athlete_id: 'athlete-1' }, { athlete_id: 'athlete-2' }])
      if (groupId === 'group-b') return jsonResponse([{ athlete_id: 'athlete-2' }, { athlete_id: 'athlete-3' }])
      return jsonResponse([])
    }

    if (method === 'GET' && table === 'programs') {
      return jsonResponse([{ id: 'source-program', coach_id: 'coach-1', name: 'Source Program', description: 'Clone me', start_date: '2026-06-01', end_date: '2026-08-01', status: 'active' }])
    }

    if (method === 'GET' && ['program_weeks', 'program_days', 'program_workouts', 'program_workout_exercises', 'program_workout_sets'].includes(table)) {
      return jsonResponse([])
    }

    if (method === 'POST' && table === 'programs') {
      createdProgramIndex += 1
      const body = JSON.parse(options.body)
      return jsonResponse([{ ...body, id: `created-program-${createdProgramIndex}` }])
    }

    return jsonResponse([], { status: 404 })
  })

  try {
    const repository = createAdminGroupRepository()
    const result = await repository.assignProgramToGroups({
      groupIds: ['group-a', 'group-b', 'group-a'],
      sourceProgramId: 'source-program',
    })

    assert.deepEqual(result.groupIds, ['group-a', 'group-b'])
    assert.equal(result.sourceProgramId, 'source-program')
    assert.equal(result.groupsUpdated, 2)
    assert.equal(result.athletesUpdated, 3)
    assert.equal(result.createdProgramsCount, 3)
    assert.deepEqual(result.createdProgramIds, ['created-program-1', 'created-program-2', 'created-program-3'])

    const programInsertCalls = calls.filter((call) => getRestTable(call.url) === 'programs' && call.options.method === 'POST')
    assert.deepEqual(programInsertCalls.map((call) => JSON.parse(call.options.body).athlete_id), ['athlete-1', 'athlete-2', 'athlete-3'])
  } finally {
    restoreGlobals()
  }
})

test('admin groups assign-program workflow rejects empty groups before cloning', async () => {
  const calls = withMockedSupabaseFetch(() => jsonResponse([], { status: 500 }))

  try {
    const repository = createAdminGroupRepository()
    await assert.rejects(
      () => repository.assignProgramToGroups({ groupIds: [], sourceProgramId: 'source-program' }),
      /At least one group is required\./,
    )
    assert.equal(calls.length, 0)
  } finally {
    restoreGlobals()
  }
})
