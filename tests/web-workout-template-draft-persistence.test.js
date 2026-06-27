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


test('listWorkoutTemplates rehydrates saved template sections for the editor sheet', async () => {
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').pop()

    if (table === 'workout_templates' && (options.method ?? 'GET') === 'GET') {
      return createJsonResponse([
        {
          id: 'template-edge-a',
          name: 'Edge Work A',
          description: 'Reviewed edge work draft.',
          training_type: 'Edge Work',
          estimated_duration_minutes: 60,
          thumbnail_url: null,
          status: 'active',
        },
      ])
    }

    if (table === 'workout_template_exercises' && (options.method ?? 'GET') === 'GET') {
      return createJsonResponse([
        {
          id: 'template-exercise-1',
          workout_template_id: 'template-edge-a',
          workout_template_block_id: null,
          exercise_id: '00000000-0000-4000-8000-000000000001',
          name_snapshot: 'Mohawk Edge Hold',
          sort_order: 0,
          notes: 'Stay low.',
          default_rest_seconds: null,
        },
      ])
    }

    if (table === 'workout_template_sets' && (options.method ?? 'GET') === 'GET') {
      return createJsonResponse([
        {
          id: 'template-set-1',
          workout_template_exercise_id: 'template-exercise-1',
          sort_order: 0,
          set_type: 'straight',
          target_reps: 3,
          target_load: null,
          target_load_unit: null,
          target_duration_seconds: 20,
          target_distance: null,
          target_distance_unit: null,
          target_rpe: 8,
          target_rir: null,
          target_rest_seconds: 45,
          notes: 'Controlled',
        },
      ])
    }

    if (table === 'workout_template_blocks' && (options.method ?? 'GET') === 'GET') {
      return createJsonResponse([
        {
          id: 'block-1',
          workout_template_id: 'template-edge-a',
          block_code: 'A1',
          title: 'A1',
          instructions: 'Edge block.',
          sort_order: 0,
        },
      ])
    }

    return createJsonResponse({ message: `Unexpected ${options.method ?? 'GET'} ${table}` }, { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl,
  })

  const templates = await repository.listWorkoutTemplates()
  const edgeWorkout = templates[0]

  assert.equal(edgeWorkout.name, 'Edge Work A')
  assert.equal(edgeWorkout.section_count, 1)
  assert.equal(edgeWorkout.exercise_count, 1)
  assert.equal(edgeWorkout.set_count, 1)
  assert.deepEqual(edgeWorkout.trainingSections.map((section) => [section.label, section.instruction, section.exercises.length]), [
    ['A1', 'Edge block.', 1],
  ])
  assert.deepEqual(edgeWorkout.trainingSections[0].exercises.map((exercise) => [exercise.title, exercise.instruction, exercise.sets.length]), [
    ['Mohawk Edge Hold', 'Stay low.', 1],
  ])
})
