import test from 'node:test'
import assert from 'node:assert/strict'

import { createProgramWorkoutRepository } from '../apps/web/lib/program-workout-repository.js'

function createJsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('assignWorkoutTemplatesToProgram copies selected workout templates into the target program without requiring schedule dates', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').pop()
    const method = options.method ?? 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ table, method, body, url: parsedUrl })

    if (table === 'programs' && method === 'GET') {
      return createJsonResponse([{ id: 'program-1', athlete_id: 'athlete-1', coach_id: 'coach-1' }])
    }

    if (table === 'workout_templates' && method === 'GET') {
      const id = parsedUrl.searchParams.get('id')?.replace('eq.', '')
      return createJsonResponse([{ id, coach_id: 'coach-1', name: id === 'template-1' ? 'Speed A' : 'Strength B', training_type: 'Speed', status: 'active', bg_color: '#101828', text_color: '#ffffff' }])
    }

    if (table === 'workout_template_blocks' && method === 'GET') {
      const templateId = parsedUrl.searchParams.get('workout_template_id')?.replace('eq.', '')
      return createJsonResponse([{ id: `${templateId}-block-1`, workout_template_id: templateId, block_code: 'A1', title: 'A1', instructions: 'Warm up.', sort_order: 0 }])
    }

    if (table === 'workout_template_exercises' && method === 'GET') {
      const templateId = parsedUrl.searchParams.get('workout_template_id')?.replace('eq.', '')
      return createJsonResponse([{ id: `${templateId}-exercise-1`, workout_template_id: templateId, workout_template_block_id: `${templateId}-block-1`, exercise_id: 'exercise-1', name_snapshot: 'Skater hop', sort_order: 0, notes: null, default_rest_seconds: 45 }])
    }

    if (table === 'workout_template_sets' && method === 'GET') {
      return createJsonResponse([{ id: 'template-set-1', workout_template_exercise_id: 'template-1-exercise-1', sort_order: 0, set_type: 'straight', target_reps: 8, target_load: null, target_load_unit: null, target_duration_seconds: null, target_distance: null, target_distance_unit: null, target_rpe: null, target_rir: null, target_rest_seconds: 45, notes: null }])
    }

    if (table === 'program_workouts' && method === 'POST') {
      assert.equal(body.program_id, 'program-1')
      assert.equal(body.athlete_id, 'athlete-1')
      assert.equal(body.coach_id, 'coach-1')
      assert.equal(body.scheduled_date, null)
      assert.equal(body.scheduled_start_time, null)
      assert.equal(body.scheduled_end_time, null)
      return createJsonResponse([{ ...body, id: `program-workout-${calls.filter((call) => call.table === 'program_workouts' && call.method === 'POST').length}` }], { status: 201 })
    }

    if (table === 'program_workout_blocks' && method === 'POST') {
      return createJsonResponse(body.map((block, index) => ({ ...block, id: `program-block-${index + 1}` })), { status: 201 })
    }

    if (table === 'program_workout_exercises' && method === 'POST') {
      return createJsonResponse(body.map((exercise, index) => ({ ...exercise, id: `program-exercise-${index + 1}` })), { status: 201 })
    }

    if (table === 'program_workout_sets' && method === 'POST') {
      return createJsonResponse(body.map((setRow, index) => ({ ...setRow, id: `program-set-${index + 1}` })), { status: 201 })
    }

    if (table === 'program_workouts' && method === 'GET') {
      const id = parsedUrl.searchParams.get('id')?.replace('eq.', '')
      return createJsonResponse([{ id, program_id: 'program-1', athlete_id: 'athlete-1', coach_id: 'coach-1', workout_template_id: 'template-1', name_snapshot: 'Speed A', status: 'scheduled', sort_order: null }])
    }

    if (table === 'program_workout_blocks' && method === 'GET') return createJsonResponse([])
    if (table === 'program_workout_exercises' && method === 'GET') return createJsonResponse([])

    return createJsonResponse({ message: `Unexpected ${method} ${table}` }, { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl,
  })

  const result = await repository.assignWorkoutTemplatesToProgram({
    programId: 'program-1',
    workoutTemplateIds: ['template-1', 'template-2', 'template-1'],
  })

  assert.equal(result.assignedWorkouts.length, 2)
  assert.deepEqual(result.skippedWorkouts, [])

  const programWorkoutPosts = calls.filter((call) => call.table === 'program_workouts' && call.method === 'POST')
  assert.equal(programWorkoutPosts.length, 2)
  assert.deepEqual(programWorkoutPosts.map((call) => call.body.workout_template_id), ['template-1', 'template-2'])
})

test('assignWorkoutTemplatesToProgram rejects an empty workout template selection', async () => {
  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async () => createJsonResponse([]),
  })

  await assert.rejects(
    () => repository.assignWorkoutTemplatesToProgram({ programId: 'program-1', workoutTemplateIds: [] }),
    /At least one workout template id is required\./,
  )
})
