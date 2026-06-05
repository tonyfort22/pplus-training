import test from 'node:test'
import assert from 'node:assert/strict'

import { createProgramWorkoutRepository } from '../apps/web/lib/program-workout-repository.js'

function createJsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('createWorkoutTemplate persists draft sections exercises and sets into workout template tables', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').pop()
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ table, method: options.method ?? 'GET', body, url: parsedUrl })

    if (table === 'coach_profiles') {
      return createJsonResponse([{ id: 'coach-1' }])
    }

    if (table === 'workout_templates' && options.method === 'POST') {
      return createJsonResponse([{ id: 'template-1', name: body.name, training_type: body.training_type, status: body.status }], { status: 201 })
    }

    if (table === 'workout_template_blocks' && options.method === 'POST') {
      return createJsonResponse(body.map((block, index) => ({ ...block, id: `block-${index + 1}` })), { status: 201 })
    }

    if (table === 'workout_template_exercises' && options.method === 'POST') {
      return createJsonResponse(body.map((exercise, index) => ({ ...exercise, id: `template-exercise-${index + 1}` })), { status: 201 })
    }

    if (table === 'workout_template_sets' && options.method === 'POST') {
      return createJsonResponse(body.map((setRow, index) => ({ ...setRow, id: `template-set-${index + 1}` })), { status: 201 })
    }

    return createJsonResponse({ message: `Unexpected ${options.method ?? 'GET'} ${table}` }, { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl,
  })

  const createdTemplate = await repository.createWorkoutTemplate({
    name: 'Speed Accelerator A',
    focusArea: 'Speed',
    description: 'Reviewed draft workout.',
    status: 'active',
    trainingSections: [
      {
        label: 'A1',
        instruction: 'Pair with A2.',
        exercises: [
          {
            title: 'Depth Drop',
            exerciseId: '00000000-0000-4000-8000-000000000001',
            instruction: 'Stick the landing.',
            sets: [
              { reps: '5', tempo: 'Explosive', effort: '8/10', side: 'Bilateral', duration: '20 sec', distance: '10 m', rest: '60 sec' },
            ],
          },
        ],
      },
      {
        label: 'A2',
        instruction: 'Second superset item.',
        exercises: [
          {
            title: 'Fan Bike or Run',
            sets: [
              { reps: '1', tempo: 'Fast', effort: '9/10', side: '', duration: '30 sec', distance: '', rest: '90 sec' },
            ],
          },
        ],
      },
    ],
  })

  assert.equal(createdTemplate.id, 'template-1')

  const blockCall = calls.find((call) => call.table === 'workout_template_blocks' && call.method === 'POST')
  assert.deepEqual(blockCall.body.map((block) => [block.workout_template_id, block.block_code, block.title, block.instructions, block.sort_order]), [
    ['template-1', 'A1', 'A1', 'Pair with A2.', 0],
    ['template-1', 'A2', 'A2', 'Second superset item.', 1],
  ])

  const exerciseCall = calls.find((call) => call.table === 'workout_template_exercises' && call.method === 'POST')
  assert.deepEqual(exerciseCall.body.map((exercise) => [exercise.workout_template_id, exercise.workout_template_block_id, exercise.exercise_id, exercise.name_snapshot, exercise.sort_order, exercise.notes]), [
    ['template-1', 'block-1', '00000000-0000-4000-8000-000000000001', 'Depth Drop', 0, 'Stick the landing.'],
    ['template-1', 'block-2', null, 'Fan Bike or Run', 1, null],
  ])

  const setCall = calls.find((call) => call.table === 'workout_template_sets' && call.method === 'POST')
  assert.deepEqual(setCall.body.map((setRow) => [setRow.workout_template_exercise_id, setRow.sort_order, setRow.set_type, setRow.target_reps, setRow.target_duration_seconds, setRow.target_distance, setRow.target_distance_unit, setRow.target_rpe, setRow.target_rest_seconds, setRow.notes]), [
    ['template-exercise-1', 0, 'straight', 5, 20, 10, 'm', 8, 60, 'Explosive · Bilateral'],
    ['template-exercise-2', 0, 'straight', 1, 30, null, null, 9, 90, 'Fast'],
  ])
})
