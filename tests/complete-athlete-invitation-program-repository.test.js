import test from 'node:test'
import assert from 'node:assert/strict'

import { createSupabaseServiceProgramRepository } from '../infra/supabase/functions/complete-athlete-invitation/runtime.js'

function jsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    async text() {
      return JSON.stringify(payload)
    },
  }
}

test('createSupabaseServiceProgramRepository reuses the athlete\'s existing assigned program instead of cloning a duplicate', async () => {
  const calls = []
  const repository = createSupabaseServiceProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'
      calls.push({ table, method, url: parsedUrl.toString() })

      if (method === 'GET' && table === 'programs' && parsedUrl.searchParams.get('athlete_id') === 'eq.athlete-1') {
        return jsonResponse([
          {
            id: 'existing-program-1',
            athlete_id: 'athlete-1',
            coach_id: 'coach-1',
            name: 'Existing Assigned Program',
            description: 'Already linked',
            start_date: '2026-05-01',
            end_date: '2026-06-30',
            status: 'active',
          },
        ])
      }

      if (method === 'GET') {
        return jsonResponse([])
      }

      throw new Error(`Unexpected ${method} ${table} request in reuse-path test stub`)
    },
  })

  const assignedProgram = await repository.assignFirstProgramToAthlete({ athleteId: 'athlete-1', coachId: 'coach-1' })

  assert.equal(assignedProgram.id, 'existing-program-1')
  assert.equal(calls.some((call) => call.method === 'POST'), false)
})

test('createSupabaseServiceProgramRepository clones the first program with bulk inserts for dependent rows', async () => {
  const calls = []
  const idCounters = new Map()
  const fixtures = {
    programs: [
      {
        id: 'source-program-1',
        athlete_id: null,
        coach_id: 'coach-1',
        name: 'Offseason Strength',
        description: 'Base block',
        start_date: '2026-05-01',
        end_date: '2026-06-30',
        status: 'active',
      },
    ],
    program_weeks: [
      { id: 'week-1', program_id: 'source-program-1', week_index: 1, name: 'Week 1', start_date: '2026-05-01', end_date: '2026-05-07' },
      { id: 'week-2', program_id: 'source-program-1', week_index: 2, name: 'Week 2', start_date: '2026-05-08', end_date: '2026-05-14' },
    ],
    program_days: [
      { id: 'day-1', program_week_id: 'week-1', day_index: 1, date: '2026-05-01', name: 'Day 1', notes: '', status: 'planned' },
      { id: 'day-2', program_week_id: 'week-2', day_index: 1, date: '2026-05-08', name: 'Day 8', notes: '', status: 'planned' },
    ],
    program_workouts: [
      { id: 'workout-1', athlete_id: null, coach_id: 'coach-1', program_id: 'source-program-1', program_day_id: 'day-1', workout_template_id: null, name_snapshot: 'Lower A', notes: '', status: 'planned', sort_order: 0 },
      { id: 'workout-2', athlete_id: null, coach_id: 'coach-1', program_id: 'source-program-1', program_day_id: 'day-2', workout_template_id: null, name_snapshot: 'Upper A', notes: '', status: 'planned', sort_order: 0 },
    ],
    program_workout_exercises: [
      { id: 'exercise-1', program_workout_id: 'workout-1', exercise_id: 'ex-1', name_snapshot: 'Squat', sort_order: 0, notes: '', default_rest_seconds: 90 },
      { id: 'exercise-2', program_workout_id: 'workout-2', exercise_id: 'ex-2', name_snapshot: 'Bench', sort_order: 0, notes: '', default_rest_seconds: 90 },
    ],
    program_workout_sets: [
      { id: 'set-1', program_workout_exercise_id: 'exercise-1', sort_order: 0, set_type: 'working', target_reps: '5', target_load: null, target_load_unit: 'lb', target_rpe: null, target_rest_seconds: 90, notes: '' },
      { id: 'set-2', program_workout_exercise_id: 'exercise-2', sort_order: 0, set_type: 'working', target_reps: '8', target_load: null, target_load_unit: 'lb', target_rpe: null, target_rest_seconds: 90, notes: '' },
    ],
  }

  const repository = createSupabaseServiceProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ table, method, body })

      if (method === 'GET') {
        if (table === 'programs' && parsedUrl.searchParams.get('athlete_id') === 'eq.athlete-1') {
          return jsonResponse([])
        }
        return jsonResponse(fixtures[table] || [])
      }

      if (method === 'POST') {
        const nextId = () => {
          const current = idCounters.get(table) || 0
          const next = current + 1
          idCounters.set(table, next)
          return `${table}-created-${next}`
        }

        if (Array.isArray(body)) {
          return jsonResponse(body.map((row) => ({ ...row, id: nextId() })))
        }

        return jsonResponse([{ ...body, id: nextId() }])
      }

      throw new Error(`Unexpected ${method} ${table} request in test stub`)
    },
  })

  const createdProgram = await repository.assignFirstProgramToAthlete({
    athleteId: 'athlete-1',
    coachId: 'coach-1',
  })

  assert.equal(createdProgram.id, 'programs-created-1')
  assert.equal(createdProgram.weeksCount, 2)
  assert.equal(createdProgram.workoutsCount, 2)

  const postCallsByTable = calls.filter((call) => call.method === 'POST').reduce((accumulator, call) => {
    accumulator[call.table] ||= []
    accumulator[call.table].push(call)
    return accumulator
  }, {})

  assert.equal(postCallsByTable.programs?.length, 1)
  assert.equal(postCallsByTable.program_weeks?.length, 1)
  assert.equal(postCallsByTable.program_days?.length, 1)
  assert.equal(postCallsByTable.program_workouts?.length, 1)
  assert.equal(postCallsByTable.program_workout_exercises?.length, 1)
  assert.equal(postCallsByTable.program_workout_sets?.length, 1)

  assert.equal(Array.isArray(postCallsByTable.program_weeks?.[0]?.body), true)
  assert.equal(postCallsByTable.program_weeks?.[0]?.body?.length, 2)
  assert.equal(Array.isArray(postCallsByTable.program_days?.[0]?.body), true)
  assert.equal(postCallsByTable.program_days?.[0]?.body?.length, 2)
  assert.equal(Array.isArray(postCallsByTable.program_workouts?.[0]?.body), true)
  assert.equal(postCallsByTable.program_workouts?.[0]?.body?.length, 2)
  assert.equal(Array.isArray(postCallsByTable.program_workout_exercises?.[0]?.body), true)
  assert.equal(postCallsByTable.program_workout_exercises?.[0]?.body?.length, 2)
  assert.equal(Array.isArray(postCallsByTable.program_workout_sets?.[0]?.body), true)
  assert.equal(postCallsByTable.program_workout_sets?.[0]?.body?.length, 2)
})
