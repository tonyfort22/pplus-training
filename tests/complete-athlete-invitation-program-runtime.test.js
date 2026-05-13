import test from 'node:test'
import assert from 'node:assert/strict'

import { createSupabaseServiceProgramRepository } from '../infra/supabase/functions/complete-athlete-invitation/runtime.js'

function json(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return JSON.stringify(payload)
    },
  }
}

test('createSupabaseServiceProgramRepository falls back when live program_workouts is missing notes', async () => {
  const calls = []
  const repo = createSupabaseServiceProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'sb_publishable_123',
    serviceRoleKey: 'sb_secret_456',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const select = parsedUrl.searchParams.get('select') || ''
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null,
        select,
      })

      if (parsedUrl.pathname === '/rest/v1/programs' && (options.method || 'GET') === 'GET' && parsedUrl.searchParams.get('athlete_id') === 'eq.athlete-1') {
        return json([])
      }

      if (parsedUrl.pathname === '/rest/v1/programs' && (options.method || 'GET') === 'GET') {
        return json([
          {
            id: 'program-1',
            athlete_id: 'seed-athlete',
            coach_id: 'coach-1',
            name: 'Training Program',
            description: null,
            start_date: '2026-05-18',
            end_date: '2026-07-27',
            status: 'active',
          },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/program_weeks' && (options.method || 'GET') === 'GET') {
        return json([
          { id: 'week-1', program_id: 'program-1', week_index: 1, name: 'Week 1', start_date: '2026-05-18', end_date: '2026-05-24' },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/program_days' && (options.method || 'GET') === 'GET') {
        return json([
          { id: 'day-1', program_week_id: 'week-1', day_index: 1, date: '2026-05-18', name: null, notes: null, status: 'training' },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/program_workouts' && (options.method || 'GET') === 'GET' && select.includes('notes')) {
        return json({ message: "column program_workouts.notes does not exist" }, 400)
      }

      if (parsedUrl.pathname === '/rest/v1/program_workouts' && (options.method || 'GET') === 'GET') {
        return json([
          {
            id: 'pw-1',
            athlete_id: 'seed-athlete',
            coach_id: 'coach-1',
            program_id: 'program-1',
            program_day_id: 'day-1',
            workout_template_id: 'tpl-1',
            name_snapshot: 'Workout A',
            status: 'scheduled',
            sort_order: 1,
          },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/program_workout_exercises' && (options.method || 'GET') === 'GET') {
        return json([])
      }

      if (parsedUrl.pathname === '/rest/v1/program_workout_sets' && (options.method || 'GET') === 'GET') {
        return json([])
      }

      if (parsedUrl.pathname === '/rest/v1/programs' && (options.method || 'GET') === 'POST') {
        return json([{ id: 'assigned-program', athlete_id: 'athlete-1', coach_id: 'coach-1', name: 'Training Program', description: null, start_date: '2026-05-18', end_date: '2026-07-27', status: 'active' }])
      }

      if (parsedUrl.pathname === '/rest/v1/program_weeks' && (options.method || 'GET') === 'POST') {
        return json([{ id: 'assigned-week-1', program_id: 'assigned-program', week_index: 1, name: 'Week 1', start_date: '2026-05-18', end_date: '2026-05-24' }])
      }

      if (parsedUrl.pathname === '/rest/v1/program_days' && (options.method || 'GET') === 'POST') {
        return json([{ id: 'assigned-day-1', program_week_id: 'assigned-week-1', day_index: 1, date: '2026-05-18', name: null, notes: null, status: 'training' }])
      }

      if (parsedUrl.pathname === '/rest/v1/program_workouts' && (options.method || 'GET') === 'POST' && options.body && JSON.parse(options.body).notes !== undefined) {
        return json({ message: "column program_workouts.notes does not exist" }, 400)
      }

      if (parsedUrl.pathname === '/rest/v1/program_workouts' && (options.method || 'GET') === 'POST') {
        return json([{ id: 'assigned-pw-1' }])
      }

      throw new Error(`Unexpected request: ${parsedUrl.toString()}`)
    },
  })

  const result = await repo.assignFirstProgramToAthlete({ athleteId: 'athlete-1', coachId: 'coach-1' })

  assert.equal(result.id, 'assigned-program')
  const workoutSelects = calls.filter((call) => call.url.includes('/rest/v1/program_workouts') && call.method === 'GET').map((call) => call.select)
  assert.equal(workoutSelects[0], 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,notes,status,sort_order')
  assert.equal(workoutSelects[1], 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,status,sort_order')
  const workoutCreateCalls = calls.filter((call) => call.url.includes('/rest/v1/program_workouts') && call.method === 'POST')
  assert.equal(workoutCreateCalls.length, 1)
  assert.equal(workoutCreateCalls[0].body[0].notes, '')
})

test('createSupabaseServiceProgramRepository drops workout notes and retries when the live schema is legacy', async () => {
  const calls = []
  const repo = createSupabaseServiceProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'sb_publishable_123',
    serviceRoleKey: 'sb_secret_456',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const select = parsedUrl.searchParams.get('select') || ''
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
        body,
        select,
      })

      if (parsedUrl.pathname === '/rest/v1/programs' && (options.method || 'GET') === 'GET' && parsedUrl.searchParams.get('athlete_id') === 'eq.athlete-1') {
        return json([])
      }

      if (parsedUrl.pathname === '/rest/v1/programs' && (options.method || 'GET') === 'GET') {
        return json([{ id: 'program-1', athlete_id: 'seed-athlete', coach_id: 'coach-1', name: 'Training Program', description: null, start_date: '2026-05-18', end_date: '2026-07-27', status: 'active' }])
      }
      if (parsedUrl.pathname === '/rest/v1/program_weeks' && (options.method || 'GET') === 'GET') {
        return json([{ id: 'week-1', program_id: 'program-1', week_index: 1, name: 'Week 1', start_date: '2026-05-18', end_date: '2026-05-24' }])
      }
      if (parsedUrl.pathname === '/rest/v1/program_days' && (options.method || 'GET') === 'GET') {
        return json([{ id: 'day-1', program_week_id: 'week-1', day_index: 1, date: '2026-05-18', name: null, notes: null, status: 'training' }])
      }
      if (parsedUrl.pathname === '/rest/v1/program_workouts' && (options.method || 'GET') === 'GET' && select.includes('notes')) {
        return json({ message: "column program_workouts.notes does not exist" }, 400)
      }
      if (parsedUrl.pathname === '/rest/v1/program_workouts' && (options.method || 'GET') === 'GET') {
        return json([{ id: 'pw-1', athlete_id: 'seed-athlete', coach_id: 'coach-1', program_id: 'program-1', program_day_id: 'day-1', workout_template_id: 'tpl-1', name_snapshot: 'Workout A', notes: 'Coach note', status: 'scheduled', sort_order: 1 }])
      }
      if (parsedUrl.pathname === '/rest/v1/program_workout_exercises' && (options.method || 'GET') === 'GET') {
        return json([])
      }
      if (parsedUrl.pathname === '/rest/v1/program_workout_sets' && (options.method || 'GET') === 'GET') {
        return json([])
      }
      if (parsedUrl.pathname === '/rest/v1/programs' && (options.method || 'GET') === 'POST') {
        return json([{ id: 'assigned-program', athlete_id: 'athlete-1', coach_id: 'coach-1', name: 'Training Program', description: null, start_date: '2026-05-18', end_date: '2026-07-27', status: 'active' }])
      }
      if (parsedUrl.pathname === '/rest/v1/program_weeks' && (options.method || 'GET') === 'POST') {
        return json([{ id: 'assigned-week-1', program_id: 'assigned-program', week_index: 1, name: 'Week 1', start_date: '2026-05-18', end_date: '2026-05-24' }])
      }
      if (parsedUrl.pathname === '/rest/v1/program_days' && (options.method || 'GET') === 'POST') {
        return json([{ id: 'assigned-day-1', program_week_id: 'assigned-week-1', day_index: 1, date: '2026-05-18', name: null, notes: null, status: 'training' }])
      }
      if (parsedUrl.pathname === '/rest/v1/program_workouts' && (options.method || 'GET') === 'POST' && body?.notes !== undefined) {
        return json({ message: "column program_workouts.notes does not exist" }, 400)
      }
      if (parsedUrl.pathname === '/rest/v1/program_workouts' && (options.method || 'GET') === 'POST') {
        return json([{ id: 'assigned-pw-1' }])
      }

      throw new Error(`Unexpected request: ${parsedUrl.toString()}`)
    },
  })

  const result = await repo.assignFirstProgramToAthlete({ athleteId: 'athlete-1', coachId: 'coach-1' })

  assert.equal(result.id, 'assigned-program')
  const workoutCreateCalls = calls.filter((call) => call.url.includes('/rest/v1/program_workouts') && call.method === 'POST')
  assert.equal(workoutCreateCalls.length, 1)
  assert.equal(workoutCreateCalls[0].body[0].notes, 'Coach note')
})
