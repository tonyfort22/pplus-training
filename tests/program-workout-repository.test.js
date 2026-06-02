import test from 'node:test'
import assert from 'node:assert/strict'

import { createProgramWorkoutRepository } from '../apps/web/lib/program-workout-repository.js'

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return payload == null ? '' : JSON.stringify(payload)
    },
  }
}

test('createProgramWorkoutRepository fetches one workout tree with ordered exercises and sets', async () => {
  const calls = []
  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'
      calls.push({ table, method, url: parsedUrl.toString() })

      if (method === 'GET' && table === 'program_workouts') {
        return jsonResponse([
          {
            id: 'pw-1',
            name_snapshot: 'Skate Lift',
            scheduled_date: '2026-05-26',
            scheduled_start_time: '09:00:00',
            scheduled_end_time: '10:00:00',
            program_days: { date: '2026-05-26', name: 'Tuesday' },
            workout_templates: { name: 'Skate Lift Template', training_type: 'Strength' },
          },
        ])
      }

      if (method === 'GET' && table === 'program_workout_blocks') {
        return jsonResponse([
          { id: 'block-1', program_workout_id: 'pw-1', block_code: 'A1', title: 'A1', instructions: 'Primary strength block', sort_order: 0 },
          { id: 'block-2', program_workout_id: 'pw-1', block_code: 'A2', title: 'A2', instructions: 'Secondary block', sort_order: 1 },
        ])
      }

      if (method === 'GET' && table === 'program_workout_exercises') {
        return jsonResponse([
          { id: 'exercise-1', program_workout_id: 'pw-1', program_workout_block_id: 'block-1', exercise_id: 'ex-1', name_snapshot: 'Squat', sort_order: 0, notes: '', default_rest_seconds: 90 },
          { id: 'exercise-2', program_workout_id: 'pw-1', program_workout_block_id: 'block-2', exercise_id: 'ex-2', name_snapshot: 'Bench', sort_order: 1, notes: '', default_rest_seconds: 75 },
        ])
      }

      if (method === 'GET' && table === 'program_workout_sets') {
        assert.equal(parsedUrl.searchParams.get('program_workout_exercise_id'), 'in.(exercise-1,exercise-2)')
        return jsonResponse([
          { id: 'set-1', program_workout_exercise_id: 'exercise-1', sort_order: 0, set_type: 'straight', target_reps: 5, target_rest_seconds: 90, notes: '' },
          { id: 'set-2', program_workout_exercise_id: 'exercise-2', sort_order: 0, set_type: 'straight', target_reps: 8, target_rest_seconds: 75, notes: '' },
        ])
      }

      throw new Error(`Unexpected request in tree test: ${method} ${parsedUrl.toString()}`)
    },
  })

  const programWorkoutTree = await repository.getProgramWorkoutTree('pw-1')

  assert.equal(programWorkoutTree.workout.id, 'pw-1')
  assert.equal(programWorkoutTree.blocks.length, 2)
  assert.equal(programWorkoutTree.exercises.length, 2)
  assert.equal(programWorkoutTree.sets.length, 2)
  assert.equal(calls.length, 4)
})

test('createProgramWorkoutRepository updates parent workout details and preserves v1 single-day validation', async () => {
  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null

      assert.equal(table, 'program_workouts')
      assert.equal(method, 'PATCH')
      assert.equal(parsedUrl.searchParams.get('id'), 'eq.pw-1')
      assert.equal(body.scheduled_date, '2026-05-26')
      assert.equal(body.scheduled_start_time, '09:00:00')
      assert.equal(body.scheduled_end_time, '10:00:00')
      assert.equal(body.name_snapshot, 'Updated Workout')
      assert.equal(typeof body.updated_at, 'string')

      return jsonResponse([{ id: 'pw-1', ...body }])
    },
  })

  const updatedWorkout = await repository.updateProgramWorkoutDetails('pw-1', {
    name_snapshot: 'Updated Workout',
    scheduled_date: '2026-05-26',
    scheduled_start_time: '09:00:00',
    end_date: '2026-05-26',
    scheduled_end_time: '10:00:00',
  })

  assert.equal(updatedWorkout.id, 'pw-1')
  assert.equal(updatedWorkout.name_snapshot, 'Updated Workout')

  await assert.rejects(
    () => repository.updateProgramWorkoutDetails('pw-1', {
      scheduled_date: '2026-05-26',
      end_date: '2026-05-27',
    }),
    /End date must equal start date/,
  )
})

test('createProgramWorkoutRepository lists workout templates with exercise and set counts', async () => {
  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'

      if (method === 'GET' && table === 'workout_templates') {
        return jsonResponse([
          { id: 'template-1', name: 'Workout A', training_type: 'Speed', estimated_duration_minutes: 60, status: 'active' },
          { id: 'template-2', name: 'Workout B', training_type: 'Edge Work', estimated_duration_minutes: 25, status: 'active' },
        ])
      }

      if (method === 'GET' && table === 'workout_template_exercises') {
        assert.equal(parsedUrl.searchParams.get('workout_template_id'), 'in.(template-1,template-2)')
        return jsonResponse([
          { id: 'exercise-1', workout_template_id: 'template-1' },
          { id: 'exercise-2', workout_template_id: 'template-1' },
          { id: 'exercise-3', workout_template_id: 'template-2' },
        ])
      }

      if (method === 'GET' && table === 'workout_template_sets') {
        assert.equal(parsedUrl.searchParams.get('workout_template_exercise_id'), 'in.(exercise-1,exercise-2,exercise-3)')
        return jsonResponse([
          { id: 'set-1', workout_template_exercise_id: 'exercise-1' },
          { id: 'set-2', workout_template_exercise_id: 'exercise-1' },
          { id: 'set-3', workout_template_exercise_id: 'exercise-2' },
          { id: 'set-4', workout_template_exercise_id: 'exercise-3' },
          { id: 'set-5', workout_template_exercise_id: 'exercise-3' },
        ])
      }

      if (method === 'GET' && table === 'workout_template_blocks') {
        return jsonResponse([
          { id: 'block-1', workout_template_id: 'template-1' },
          { id: 'block-2', workout_template_id: 'template-1' },
        ])
      }

      throw new Error(`Unexpected request in list templates test: ${method} ${parsedUrl.toString()}`)
    },
  })

  const templates = await repository.listWorkoutTemplates()

  assert.equal(templates.length, 2)
  assert.deepEqual(
    templates.map((template) => ({
      id: template.id,
      exercise_count: template.exercise_count,
      set_count: template.set_count,
      section_count: template.section_count,
    })),
    [
      { id: 'template-1', exercise_count: 2, set_count: 3, section_count: 2 },
      { id: 'template-2', exercise_count: 1, set_count: 2, section_count: 1 },
    ],
  )
})

test('createProgramWorkoutRepository clones a template into a new program workout tree with bulk child inserts', async () => {
  const calls = []
  const idCounters = new Map()
  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ table, method, url: parsedUrl.toString(), body })

      if (method === 'GET' && table === 'workout_templates') {
        return jsonResponse([{ id: 'template-1', coach_id: 'coach-1', name: 'Lower Strength', training_type: 'Strength', bg_color: '#111111', text_color: '#ffffff', status: 'active' }])
      }

      if (method === 'GET' && table === 'workout_template_blocks') {
        return jsonResponse([
          { id: 'template-block-1', workout_template_id: 'template-1', block_code: 'A1', title: 'A1', instructions: 'Primary block', sort_order: 0 },
          { id: 'template-block-2', workout_template_id: 'template-1', block_code: 'A2', title: 'A2', instructions: 'Secondary block', sort_order: 1 },
        ])
      }

      if (method === 'GET' && table === 'workout_template_exercises') {
        return jsonResponse([
          { id: 'template-exercise-1', workout_template_id: 'template-1', workout_template_block_id: 'template-block-1', exercise_id: 'ex-1', name_snapshot: 'Squat', sort_order: 0, notes: '', default_rest_seconds: 120 },
          { id: 'template-exercise-2', workout_template_id: 'template-1', workout_template_block_id: 'template-block-2', exercise_id: 'ex-2', name_snapshot: 'Split Squat', sort_order: 1, notes: '', default_rest_seconds: 90 },
        ])
      }

      if (method === 'GET' && table === 'workout_template_sets') {
        return jsonResponse([
          { id: 'template-set-1', workout_template_exercise_id: 'template-exercise-1', sort_order: 0, set_type: 'straight', target_reps: 5, target_load: null, target_load_unit: 'lb', target_duration_seconds: null, target_distance: null, target_distance_unit: null, target_rpe: 8, target_rir: 2, target_rest_seconds: 120, notes: '' },
          { id: 'template-set-2', workout_template_exercise_id: 'template-exercise-2', sort_order: 0, set_type: 'straight', target_reps: 8, target_load: null, target_load_unit: 'lb', target_duration_seconds: null, target_distance: null, target_distance_unit: null, target_rpe: 7, target_rir: 3, target_rest_seconds: 90, notes: '' },
        ])
      }

      if (method === 'POST') {
        const nextId = () => {
          const current = idCounters.get(table) || 0
          const next = current + 1
          idCounters.set(table, next)
          return `${table}-created-${next}`
        }

        if (table === 'program_workouts') {
          return jsonResponse([{ id: 'program-workout-created-1', ...body }])
        }

        if (Array.isArray(body)) {
          return jsonResponse(body.map((row) => ({ id: nextId(), ...row })))
        }

        return jsonResponse([{ id: nextId(), ...body }])
      }

      if (method === 'GET' && table === 'program_workouts') {
        return jsonResponse([
          {
            id: 'program-workout-created-1',
            athlete_id: 'athlete-1',
            coach_id: 'coach-1',
            program_id: 'program-1',
            program_day_id: 'day-1',
            workout_template_id: 'template-1',
            name_snapshot: 'Lower Strength',
            notes: 'Bring bands',
            status: 'scheduled',
            sort_order: 2,
            scheduled_date: '2026-05-26',
            scheduled_start_time: '09:00:00',
            scheduled_end_time: '10:15:00',
            program_days: { date: '2026-05-26', name: 'Tuesday' },
            workout_templates: { name: 'Lower Strength', training_type: 'Strength' },
          },
        ])
      }

      if (method === 'GET' && table === 'program_workout_blocks') {
        return jsonResponse([
          { id: 'program_workout_blocks-created-1', program_workout_id: 'program-workout-created-1', block_code: 'A1', title: 'A1', instructions: 'Primary block', sort_order: 0 },
          { id: 'program_workout_blocks-created-2', program_workout_id: 'program-workout-created-1', block_code: 'A2', title: 'A2', instructions: 'Secondary block', sort_order: 1 },
        ])
      }

      if (method === 'GET' && table === 'program_workout_exercises') {
        return jsonResponse([
          { id: 'program_workout_exercises-created-1', program_workout_id: 'program-workout-created-1', program_workout_block_id: 'program_workout_blocks-created-1', exercise_id: 'ex-1', name_snapshot: 'Squat', sort_order: 0, notes: '', default_rest_seconds: 120 },
          { id: 'program_workout_exercises-created-2', program_workout_id: 'program-workout-created-1', program_workout_block_id: 'program_workout_blocks-created-2', exercise_id: 'ex-2', name_snapshot: 'Split Squat', sort_order: 1, notes: '', default_rest_seconds: 90 },
        ])
      }

      if (method === 'GET' && table === 'program_workout_sets') {
        return jsonResponse([
          { id: 'program_workout_sets-created-1', program_workout_exercise_id: 'program_workout_exercises-created-1', sort_order: 0, set_type: 'straight', target_reps: 5, target_rest_seconds: 120, target_rpe: 8, target_rir: 2, notes: '' },
          { id: 'program_workout_sets-created-2', program_workout_exercise_id: 'program_workout_exercises-created-2', sort_order: 0, set_type: 'straight', target_reps: 8, target_rest_seconds: 90, target_rpe: 7, target_rir: 3, notes: '' },
        ])
      }

      throw new Error(`Unexpected request in create test: ${method} ${parsedUrl.toString()}`)
    },
  })

  const programWorkoutTree = await repository.createProgramWorkoutFromTemplate({
    athlete_id: 'athlete-1',
    coach_id: 'coach-1',
    program_id: 'program-1',
    program_day_id: 'day-1',
    workout_template_id: 'template-1',
    notes: 'Bring bands',
    sort_order: 2,
    start_date: '2026-05-26',
    start_time: '09:00:00',
    end_date: '2026-05-26',
    end_time: '10:15:00',
  })

  assert.equal(programWorkoutTree.workout.id, 'program-workout-created-1')
  assert.equal(programWorkoutTree.blocks.length, 2)
  assert.equal(programWorkoutTree.exercises.length, 2)
  assert.equal(programWorkoutTree.sets.length, 2)

  const workoutInsertCall = calls.find((call) => call.table === 'program_workouts' && call.method === 'POST')
  assert.ok(workoutInsertCall)
  assert.equal(workoutInsertCall.body.scheduled_date, '2026-05-26')

  const blockInsertCall = calls.find((call) => call.table === 'program_workout_blocks' && call.method === 'POST')
  assert.ok(blockInsertCall)
  assert.equal(Array.isArray(blockInsertCall.body), true)
  assert.equal(blockInsertCall.body.length, 2)
  assert.equal(blockInsertCall.body[0].block_code, 'A1')
  assert.equal(blockInsertCall.body[1].block_code, 'A2')

  const exerciseInsertCall = calls.find((call) => call.table === 'program_workout_exercises' && call.method === 'POST')
  assert.equal(Array.isArray(exerciseInsertCall.body), true)
  assert.equal(exerciseInsertCall.body.length, 2)
  assert.equal(exerciseInsertCall.body[0].program_workout_block_id, 'program_workout_blocks-created-1')
  assert.equal(exerciseInsertCall.body[1].program_workout_block_id, 'program_workout_blocks-created-2')

  const setInsertCall = calls.find((call) => call.table === 'program_workout_sets' && call.method === 'POST')
  assert.equal(Array.isArray(setInsertCall.body), true)
  assert.equal(setInsertCall.body.length, 2)
})

test('createProgramWorkoutRepository rejects cross-day create requests for v1 scheduling', async () => {
  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async () => jsonResponse([]),
  })

  await assert.rejects(
    () => repository.createProgramWorkoutFromTemplate({
      workout_template_id: 'template-1',
      start_date: '2026-05-26',
      start_time: '09:00:00',
      end_date: '2026-05-27',
      end_time: '10:00:00',
    }),
    /End date must equal start date/,
  )
})

test('createProgramWorkoutRepository delete proves the parent program_workouts row was removed', async () => {
  const calls = []
  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      calls.push({ table, method: options.method || 'GET', search: parsedUrl.search, prefer: options.headers?.Prefer })

      if (table === 'program_workouts' && options.method === 'GET') {
        return jsonResponse([{ id: 'pw-delete-1', name_snapshot: 'Delete me' }])
      }
      if (table === 'program_workout_blocks') return jsonResponse([])
      if (table === 'program_workout_exercises') return jsonResponse([])
      if (table === 'program_workout_sets') return jsonResponse([])
      if (table === 'program_workouts' && options.method === 'DELETE') {
        return jsonResponse([{ id: 'pw-delete-1' }])
      }
      return jsonResponse([])
    },
  })

  await assert.deepEqual(
    await repository.deleteProgramWorkout('pw-delete-1'),
    { id: 'pw-delete-1' },
  )

  const parentDeleteCall = calls.find((call) => call.table === 'program_workouts' && call.method === 'DELETE')
  assert.match(parentDeleteCall.search, /select=id/)
  assert.equal(parentDeleteCall.prefer, 'return=representation')
})

test('createProgramWorkoutRepository delete throws when Supabase returns success but deletes zero parent rows', async () => {
  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      if (table === 'program_workouts' && options.method === 'GET') {
        return jsonResponse([{ id: 'pw-delete-1', name_snapshot: 'Delete me' }])
      }
      if (table === 'program_workout_blocks') return jsonResponse([])
      if (table === 'program_workout_exercises') return jsonResponse([])
      if (table === 'program_workout_sets') return jsonResponse([])
      if (table === 'program_workouts' && options.method === 'DELETE') return jsonResponse([])
      return jsonResponse([])
    },
  })

  await assert.rejects(
    () => repository.deleteProgramWorkout('pw-delete-1'),
    /Program workout delete did not remove a database row/,
  )
})
