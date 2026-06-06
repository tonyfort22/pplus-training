import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { createProgramWorkoutRepository } from '../apps/web/lib/program-workout-repository.js'

function createJsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('createProgramPlanFromDraft creates program phase day workout and nested workout rows from accepted draft', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').pop()
    const method = options.method ?? 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ table, method, body, url: parsedUrl })

    if (table === 'coach_profiles') {
      return createJsonResponse([{ id: 'coach-1' }])
    }

    if (table === 'programs' && method === 'GET') {
      return createJsonResponse([{ id: 'program-1', athlete_id: null, coach_id: 'coach-1' }])
    }

    if (table === 'programs' && method === 'POST') {
      return createJsonResponse([{ ...body, id: 'program-1' }], { status: 201 })
    }

    if (table === 'program_phases' && method === 'POST') {
      return createJsonResponse([{ ...body, id: 'phase-1' }], { status: 201 })
    }

    if (table === 'program_weeks' && method === 'POST') {
      return createJsonResponse([{ ...body, id: 'week-1' }], { status: 201 })
    }

    if (table === 'program_days' && method === 'GET') {
      return createJsonResponse([{ id: 'day-1', date: '2026-06-08' }])
    }

    if (table === 'program_days' && method === 'POST') {
      return createJsonResponse([{ ...body, id: 'day-1' }], { status: 201 })
    }

    if (table === 'program_workouts' && method === 'POST') {
      return createJsonResponse([{ ...body, id: 'program-workout-1' }], { status: 201 })
    }

    if (table === 'program_workouts' && method === 'GET') {
      return createJsonResponse([{ id: 'program-workout-1', program_id: 'program-1', program_phase_id: 'phase-1', program_day_id: 'day-1', name_snapshot: 'Speed Accelerator A' }])
    }

    if (table === 'program_workout_blocks' && method === 'GET') {
      return createJsonResponse([])
    }

    if (table === 'program_workout_exercises' && method === 'GET') {
      return createJsonResponse([])
    }

    if (table === 'program_workout_sets' && method === 'GET') {
      return createJsonResponse([])
    }

    if (table === 'program_workout_sets' && method === 'DELETE') {
      return new Response(null, { status: 204 })
    }

    if (table === 'program_workout_exercises' && method === 'DELETE') {
      return new Response(null, { status: 204 })
    }

    if (table === 'program_workout_blocks' && method === 'DELETE') {
      return new Response(null, { status: 204 })
    }

    if (table === 'program_workout_blocks' && method === 'POST') {
      return createJsonResponse(body.map((block, index) => ({ ...block, id: `block-${index + 1}` })), { status: 201 })
    }

    if (table === 'program_workout_exercises' && method === 'POST') {
      return createJsonResponse(body.map((exercise, index) => ({ ...exercise, id: `program-exercise-${index + 1}` })), { status: 201 })
    }

    if (table === 'program_workout_sets' && method === 'POST') {
      return createJsonResponse(body.map((setRow, index) => ({ ...setRow, id: `program-set-${index + 1}` })), { status: 201 })
    }

    return createJsonResponse({ message: `Unexpected ${method} ${table}` }, { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl,
  })

  const plan = await repository.createProgramPlanFromDraft({
    workout: {
      name: 'Speed Accelerator A',
      program: 'Off-Season Domination 26',
      phase: 'Phase 1',
      phaseGoal: 'Tissue remodeling',
      trainingType: 'Speed',
      startDate: '2026-06-08',
      notes: 'Reviewed draft workout.',
    },
    trainingSections: [
      {
        label: 'A1',
        instruction: 'Block A',
        exercises: [
          {
            title: 'Depth Drop',
            exerciseId: '11111111-1111-4111-8111-111111111111',
            instruction: 'Stick the landing.',
            sets: [
              { reps: '5', tempo: 'Explosive', effort: '8/10', side: 'Bilateral', duration: '20 sec', distance: '10 m', rest: '60 sec' },
            ],
          },
        ],
      },
    ],
  })

  assert.equal(plan.program.id, 'program-1')
  assert.equal(plan.phase.id, 'phase-1')
  assert.equal(plan.day.id, 'day-1')
  assert.equal(plan.programWorkoutTree.workout.id, 'program-workout-1')

  const programCall = calls.find((call) => call.table === 'programs' && call.method === 'POST')
  assert.equal(programCall.body.name, 'Off-Season Domination 26')
  assert.equal(programCall.body.coach_id, 'coach-1')
  assert.equal(programCall.body.status, 'draft')
  assert.equal(programCall.body.start_date, '2026-06-08')

  const phaseCall = calls.find((call) => call.table === 'program_phases' && call.method === 'POST')
  assert.deepEqual([phaseCall.body.program_id, phaseCall.body.name, phaseCall.body.description, phaseCall.body.training_type, phaseCall.body.start_week, phaseCall.body.end_week], [
    'program-1',
    'Phase 1',
    'Tissue remodeling',
    'Speed',
    1,
    4,
  ])

  const workoutCall = calls.find((call) => call.table === 'program_workouts' && call.method === 'POST')
  assert.deepEqual([workoutCall.body.program_id, workoutCall.body.program_phase_id, workoutCall.body.program_day_id, workoutCall.body.name_snapshot, workoutCall.body.notes, workoutCall.body.scheduled_date], [
    'program-1',
    'phase-1',
    'day-1',
    'Speed Accelerator A',
    'Reviewed draft workout.',
    '2026-06-08',
  ])

  const exerciseCall = calls.find((call) => call.table === 'program_workout_exercises' && call.method === 'POST')
  assert.equal(exerciseCall.body[0].exercise_id, '11111111-1111-4111-8111-111111111111')

  const setCall = calls.find((call) => call.table === 'program_workout_sets' && call.method === 'POST')
  assert.deepEqual([setCall.body[0].target_reps, setCall.body[0].target_duration_seconds, setCall.body[0].target_distance, setCall.body[0].target_distance_unit, setCall.body[0].target_rpe, setCall.body[0].target_rest_seconds, setCall.body[0].notes], [
    5,
    20,
    10,
    'm',
    8,
    60,
    'Explosive',
  ])
})

test('draft mode posts accepted draft to program-workouts route instead of template library route', () => {
  const source = readFileSync(new URL('../apps/web/components/admin/workouts-data-table.jsx', import.meta.url), 'utf8')

  assert.match(source, /workoutDialogMode === 'draft'/)
  assert.match(source, /\/api\/admin\/program-workouts/)
  assert.match(source, /createProgramPlanFromDraft:\s*true/)
  assert.match(source, /acceptedAiWorkoutDraft\?\.workout/)
  assert.match(source, /Create program plan from draft/)
})


test('program-workouts admin API requires the admin access cookie before creating persisted planner workouts', () => {
  const source = readFileSync(new URL('../apps/web/app/api/admin/program-workouts/route.js', import.meta.url), 'utf8')

  assert.match(source, /import \{ cookies \} from 'next\/headers'/)
  assert.match(source, /PPLUS_ADMIN_ACCESS_TOKEN_COOKIE/)
  assert.match(source, /async function requireAdminAccessToken\(\)/)
  assert.match(source, /new Error\('Unauthorized admin request\.'\)/)
  assert.match(source, /error\.status = 401/)
  assert.match(source, /await requireAdminAccessToken\(\)/)
})



test('createProgramPlanFromDraft with planner day context creates workout inside the selected existing program day', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').pop()
    const method = options.method ?? 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ table, method, body, url: parsedUrl })

    if (table === 'programs' && method === 'GET') {
      return createJsonResponse([{ id: 'program-existing', athlete_id: 'athlete-1', coach_id: 'coach-1' }])
    }

    if (table === 'program_days' && method === 'GET') {
      return createJsonResponse([{ id: 'day-existing', date: '2026-06-10' }])
    }

    if (table === 'program_workouts' && method === 'POST') {
      return createJsonResponse([{ ...body, id: 'program-workout-existing' }], { status: 201 })
    }

    if (table === 'program_workouts' && method === 'GET') {
      return createJsonResponse([{ id: 'program-workout-existing', program_id: 'program-existing', program_day_id: 'day-existing', name_snapshot: 'Planner AI Day Workout' }])
    }

    if (table === 'program_workout_blocks' && method === 'GET') return createJsonResponse([])
    if (table === 'program_workout_exercises' && method === 'GET') return createJsonResponse([])
    if (table === 'program_workout_sets' && method === 'GET') return createJsonResponse([])
    if (table === 'program_workout_sets' && method === 'DELETE') return new Response(null, { status: 204 })
    if (table === 'program_workout_exercises' && method === 'DELETE') return new Response(null, { status: 204 })
    if (table === 'program_workout_blocks' && method === 'DELETE') return new Response(null, { status: 204 })
    if (table === 'program_workout_blocks' && method === 'POST') return createJsonResponse(body.map((block, index) => ({ ...block, id: `block-${index + 1}` })), { status: 201 })
    if (table === 'program_workout_exercises' && method === 'POST') return createJsonResponse(body.map((exercise, index) => ({ ...exercise, id: `program-exercise-${index + 1}` })), { status: 201 })
    if (table === 'program_workout_sets' && method === 'POST') return createJsonResponse(body.map((setRow, index) => ({ ...setRow, id: `program-set-${index + 1}` })), { status: 201 })

    return createJsonResponse({ message: `Unexpected ${method} ${table}` }, { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl,
  })

  const result = await repository.createProgramPlanFromDraft({
    programId: 'program-existing',
    programDayId: 'day-existing',
    workout: { name: 'Planner AI Day Workout', startDate: '2026-06-10', notes: 'Accepted in planner.' },
    scheduledDate: '2026-06-10',
    sortOrder: 2,
    trainingSections: [{ label: 'A1', exercises: [{ title: 'Sprint Start', exerciseId: 'Depth Drop', sets: [{ reps: '3', rest: '45 sec' }] }] }],
  })

  assert.equal(result.programWorkoutTree.workout.id, 'program-workout-existing')
  assert.equal(calls.some((call) => call.table === 'programs' && call.method === 'POST'), false)
  assert.equal(calls.some((call) => call.table === 'program_phases' && call.method === 'POST'), false)
  assert.equal(calls.some((call) => call.table === 'program_weeks' && call.method === 'POST'), false)
  assert.equal(calls.some((call) => call.table === 'program_days' && call.method === 'POST'), false)

  const workoutCall = calls.find((call) => call.table === 'program_workouts' && call.method === 'POST')
  assert.deepEqual([workoutCall.body.program_id, workoutCall.body.program_day_id, workoutCall.body.name_snapshot, workoutCall.body.scheduled_date, workoutCall.body.sort_order], [
    'program-existing',
    'day-existing',
    'Planner AI Day Workout',
    '2026-06-10',
    2,
  ])

  const exerciseCall = calls.find((call) => call.table === 'program_workout_exercises' && call.method === 'POST')
  assert.equal(exerciseCall.body[0].exercise_id, null)
})

test('slice 25 accepted planner AI drafts persist and rehydrate AI import provenance', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').pop()
    const method = options.method ?? 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ table, method, body, url: parsedUrl })

    if (table === 'programs' && method === 'GET') {
      return createJsonResponse([{ id: 'program-existing', athlete_id: 'athlete-1', coach_id: 'coach-1' }])
    }

    if (table === 'program_days' && method === 'GET') {
      return createJsonResponse([{ id: 'day-existing', date: '2026-06-10' }])
    }

    if (table === 'program_workouts' && method === 'POST') {
      return createJsonResponse([{ ...body, id: 'program-workout-ai-import' }], { status: 201 })
    }

    if (table === 'program_workouts' && method === 'GET') {
      assert.match(parsedUrl.searchParams.get('select'), /import_source/)
      assert.match(parsedUrl.searchParams.get('select'), /import_source_file_name/)
      return createJsonResponse([{
        id: 'program-workout-ai-import',
        program_id: 'program-existing',
        program_day_id: 'day-existing',
        name_snapshot: 'Planner AI Day Workout',
        import_source: 'ai-import',
        import_source_file_name: 'slice-25-reload.pdf',
      }])
    }

    if (table === 'program_workout_blocks' && method === 'GET') return createJsonResponse([])
    if (table === 'program_workout_exercises' && method === 'GET') return createJsonResponse([])
    if (table === 'program_workout_sets' && method === 'GET') return createJsonResponse([])
    if (table === 'program_workout_sets' && method === 'DELETE') return new Response(null, { status: 204 })
    if (table === 'program_workout_exercises' && method === 'DELETE') return new Response(null, { status: 204 })
    if (table === 'program_workout_blocks' && method === 'DELETE') return new Response(null, { status: 204 })
    if (table === 'program_workout_blocks' && method === 'POST') return createJsonResponse([], { status: 201 })

    return createJsonResponse({ message: `Unexpected ${method} ${table}` }, { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl,
  })

  const result = await repository.createProgramPlanFromDraft({
    programId: 'program-existing',
    programDayId: 'day-existing',
    workout: {
      name: 'Planner AI Day Workout',
      sourceFileName: 'slice-25-reload.pdf',
    },
    trainingSections: [],
  })

  const createdWorkoutCall = calls.find((call) => call.table === 'program_workouts' && call.method === 'POST')
  assert.equal(createdWorkoutCall.body.import_source, 'ai-import')
  assert.equal(createdWorkoutCall.body.import_source_file_name, 'slice-25-reload.pdf')
  assert.equal(result.programWorkoutTree.workout.import_source, 'ai-import')
  assert.equal(result.programWorkoutTree.workout.import_source_file_name, 'slice-25-reload.pdf')
})
