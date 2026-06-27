import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminWorkoutTemplateRouteHandlers } from '../apps/web/lib/admin-workout-template-route-handlers.js'
import { createProgramWorkoutRepository } from '../apps/web/lib/program-workout-repository.js'

function jsonRequest(method, body) {
  return new Request('http://localhost/api/admin/workout-templates', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  })
}

async function readJson(response) {
  return response.json()
}

function makeWorkoutTemplateRow(overrides = {}) {
  return {
    id: 'template-1',
    coach_id: 'coach-1',
    name: 'Acceleration lift',
    description: 'Speed block template',
    category: null,
    focus_area: null,
    training_type: 'Speed',
    bg_color: '#102030',
    text_color: '#F8FAFC',
    estimated_duration_minutes: 60,
    thumbnail_url: 'https://cdn.example.test/speed.png',
    status: 'active',
    created_at: '2026-06-20T12:00:00.000Z',
    updated_at: '2026-06-20T12:05:00.000Z',
    ...overrides,
  }
}

test('workout template API handlers list templates through the repository', async () => {
  const calls = []
  const handlers = createAdminWorkoutTemplateRouteHandlers({
    requireAdminAccessToken: async () => 'admin-token',
    repositoryFactory: () => ({
      async listWorkoutTemplates() {
        calls.push(['listWorkoutTemplates'])
        return [makeWorkoutTemplateRow()]
      },
    }),
  })

  const response = await handlers.GET()
  const payload = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['listWorkoutTemplates']])
  assert.equal(payload.workoutTemplates[0].id, 'template-1')
})

test('workout template API handlers create templates and return 201', async () => {
  const calls = []
  const createPayload = {
    name: 'Tempo strength',
    focusArea: 'Strength',
    duration: '45 min',
    status: 'active',
  }
  const handlers = createAdminWorkoutTemplateRouteHandlers({
    requireAdminAccessToken: async () => 'admin-token',
    repositoryFactory: () => ({
      async createWorkoutTemplate(payload) {
        calls.push(['createWorkoutTemplate', payload])
        return makeWorkoutTemplateRow({ id: 'template-created', name: payload.name })
      },
    }),
  })

  const response = await handlers.POST(jsonRequest('POST', createPayload))
  const payload = await readJson(response)

  assert.equal(response.status, 201)
  assert.deepEqual(calls, [['createWorkoutTemplate', createPayload]])
  assert.equal(payload.workoutTemplate.id, 'template-created')
})

test('workout template API handlers update generic templates without falling into bulk actions', async () => {
  const calls = []
  const updatePayload = {
    id: 'template-edit-1',
    name: 'Edited workout',
    focusArea: 'Power',
    duration: '50 min',
    status: 'active',
  }
  const handlers = createAdminWorkoutTemplateRouteHandlers({
    requireAdminAccessToken: async () => 'admin-token',
    repositoryFactory: () => ({
      async updateWorkoutTemplate(workoutTemplateId, payload) {
        calls.push(['updateWorkoutTemplate', workoutTemplateId, payload])
        return makeWorkoutTemplateRow({ id: workoutTemplateId, name: payload.name })
      },
      async assignWorkoutTemplatesToProgram() {
        calls.push(['assignWorkoutTemplatesToProgram'])
      },
      async archiveWorkoutTemplates() {
        calls.push(['archiveWorkoutTemplates'])
      },
    }),
  })

  const response = await handlers.PATCH(jsonRequest('PATCH', updatePayload))
  const payload = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['updateWorkoutTemplate', 'template-edit-1', updatePayload]])
  assert.equal(payload.workoutTemplate.name, 'Edited workout')
})

test('workout template API handlers delete one or many template ids through the repository', async () => {
  const calls = []
  const handlers = createAdminWorkoutTemplateRouteHandlers({
    requireAdminAccessToken: async () => 'admin-token',
    repositoryFactory: () => ({
      async deleteWorkoutTemplates(payload) {
        calls.push(['deleteWorkoutTemplates', payload])
        return { deletedWorkouts: [{ id: 'template-delete-1' }], skippedWorkouts: [] }
      },
    }),
  })

  const response = await handlers.DELETE(jsonRequest('DELETE', { id: 'template-delete-1' }))
  const payload = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['deleteWorkoutTemplates', { workoutTemplateIds: ['template-delete-1'] }]])
  assert.deepEqual(payload, { deletedWorkouts: [{ id: 'template-delete-1' }], skippedWorkouts: [] })
})

test('workout template API handlers preserve repository error status and message', async () => {
  const handlers = createAdminWorkoutTemplateRouteHandlers({
    requireAdminAccessToken: async () => 'admin-token',
    repositoryFactory: () => ({
      async listWorkoutTemplates() {
        const error = new Error('Workout template store is unavailable.')
        error.status = 503
        throw error
      },
    }),
  })

  const response = await handlers.GET()
  const payload = await readJson(response)

  assert.equal(response.status, 503)
  assert.deepEqual(payload, { error: 'Workout template store is unavailable.' })
})

test('workout template repository list contract returns visible rows with counts and nested training sections', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    calls.push({ method, url: requestUrl, body: options.body ? JSON.parse(options.body) : null })

    if (method === 'GET' && requestUrl.includes('/workout_templates?')) {
      assert.match(requestUrl, /status=neq\.archived/)
      return Response.json([makeWorkoutTemplateRow()])
    }

    if (method === 'GET' && requestUrl.includes('/workout_template_exercises?')) {
      return Response.json([
        {
          id: 'template-exercise-1',
          workout_template_id: 'template-1',
          workout_template_block_id: 'template-block-1',
          exercise_id: 'library-exercise-1',
          name_snapshot: 'Trap bar deadlift',
          sort_order: 1,
          notes: 'Explode up.',
          default_rest_seconds: 120,
          exercises: { thumbnail_url: 'https://cdn.example.test/trap.png' },
        },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/workout_template_sets?')) {
      return Response.json([
        {
          id: 'template-set-1',
          workout_template_exercise_id: 'template-exercise-1',
          sort_order: 1,
          set_type: 'straight',
          target_reps: 4,
          target_load: null,
          target_load_unit: null,
          target_duration_seconds: null,
          target_distance: null,
          target_distance_unit: null,
          target_rpe: 8,
          target_rir: null,
          target_rest_seconds: 120,
          notes: 'tempo fast',
        },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/workout_template_blocks?')) {
      return Response.json([
        {
          id: 'template-block-1',
          workout_template_id: 'template-1',
          block_code: 'A',
          title: 'Acceleration',
          instructions: 'Sprint primer',
          sort_order: 1,
        },
      ])
    }

    return new Response(JSON.stringify({ error: `Unhandled ${method} ${requestUrl}` }), { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://pplus-test.supabase.co',
    serviceRoleKey: 'service-role-test-key',
    fetchImpl,
  })

  const templates = await repository.listWorkoutTemplates()

  assert.equal(templates.length, 1)
  assert.equal(templates[0].exercise_count, 1)
  assert.equal(templates[0].set_count, 1)
  assert.equal(templates[0].section_count, 1)
  assert.deepEqual(templates[0].trainingSections, [
    {
      id: 'template-block-1',
      label: 'A',
      instruction: 'Sprint primer',
      showInstruction: false,
      isExpanded: true,
      draftExerciseQuery: '',
      exercises: [
        {
          id: 'template-exercise-1',
          exerciseId: 'library-exercise-1',
          title: 'Trap bar deadlift',
          thumbnailUrl: 'https://cdn.example.test/trap.png',
          instruction: 'Explode up.',
          showInstruction: false,
          isExpanded: false,
          defaultRestSeconds: 120,
          sets: [
            { id: 'template-set-1', tempo: 'tempo fast', effort: '8', side: '', duration: '', distance: '', rest: '120 sec', reps: '4' },
          ],
        },
      ],
    },
  ])
})

test('workout template repository create contract writes parent template and nested blocks exercises and sets', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ method, url: requestUrl, body })

    if (method === 'GET' && requestUrl.includes('/coach_profiles?')) {
      return Response.json([{ id: 'coach-1' }])
    }

    if (method === 'POST' && requestUrl.includes('/workout_templates?')) {
      assert.equal(body.coach_id, 'coach-1')
      assert.equal(body.name, 'Create contract workout')
      assert.equal(body.training_type, 'Power')
      assert.equal(body.estimated_duration_minutes, 45)
      return Response.json([makeWorkoutTemplateRow({ id: 'template-created', name: body.name })])
    }

    if (method === 'POST' && requestUrl.includes('/workout_template_blocks?')) {
      assert.deepEqual(body.map((row) => ({ workout_template_id: row.workout_template_id, block_code: row.block_code, title: row.title, instructions: row.instructions, sort_order: row.sort_order })), [
        { workout_template_id: 'template-created', block_code: 'A', title: 'A', instructions: 'Primer', sort_order: 0 },
      ])
      return Response.json([{ id: 'template-block-created' }])
    }

    if (method === 'POST' && requestUrl.includes('/workout_template_exercises?')) {
      assert.deepEqual(body.map((row) => ({ workout_template_id: row.workout_template_id, workout_template_block_id: row.workout_template_block_id, name_snapshot: row.name_snapshot, sort_order: row.sort_order, notes: row.notes, default_rest_seconds: row.default_rest_seconds })), [
        { workout_template_id: 'template-created', workout_template_block_id: 'template-block-created', name_snapshot: 'Trap bar jump', sort_order: 0, notes: 'Jump fast', default_rest_seconds: 90 },
      ])
      return Response.json([{ id: 'template-exercise-created' }])
    }

    if (method === 'POST' && requestUrl.includes('/workout_template_sets?')) {
      assert.deepEqual(body.map((row) => ({ workout_template_exercise_id: row.workout_template_exercise_id, sort_order: row.sort_order, target_reps: row.target_reps, target_duration_seconds: row.target_duration_seconds, target_rpe: row.target_rpe, target_rest_seconds: row.target_rest_seconds, notes: row.notes })), [
        { workout_template_exercise_id: 'template-exercise-created', sort_order: 0, target_reps: 5, target_duration_seconds: null, target_rpe: 8, target_rest_seconds: 90, notes: 'fast concentric' },
      ])
      return Response.json([{ id: 'template-set-created' }])
    }

    return new Response(JSON.stringify({ error: `Unhandled ${method} ${requestUrl}` }), { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://pplus-test.supabase.co',
    serviceRoleKey: 'service-role-test-key',
    fetchImpl,
  })

  const template = await repository.createWorkoutTemplate({
    name: 'Create contract workout',
    focusArea: 'Power',
    duration: '45 min',
    status: 'active',
    trainingSections: [
      {
        label: 'A',
        instruction: 'Primer',
        exercises: [
          {
            title: 'Trap bar jump',
            instruction: 'Jump fast',
            defaultRestSeconds: 90,
            sets: [{ reps: '5', effort: '8', rest: '90', tempo: 'fast concentric' }],
          },
        ],
      },
    ],
  })

  assert.equal(template.id, 'template-created')
  assert.deepEqual(calls.map((call) => `${call.method} ${new URL(call.url).pathname}`), [
    'GET /rest/v1/coach_profiles',
    'POST /rest/v1/workout_templates',
    'POST /rest/v1/workout_template_blocks',
    'POST /rest/v1/workout_template_exercises',
    'POST /rest/v1/workout_template_sets',
  ])
})

test('workout template repository update contract patches only the selected parent template fields', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ method, url: requestUrl, body })

    if (method === 'PATCH' && requestUrl.includes('/workout_templates?')) {
      assert.match(requestUrl, /id=eq\.template-edit-1/)
      assert.equal(body.name, 'Updated template')
      assert.equal(body.training_type, 'Strength')
      assert.equal(body.estimated_duration_minutes, 50)
      assert.equal(body.status, 'active')
      assert.ok(body.updated_at)
      assert.equal(body.id, undefined)
      return Response.json([makeWorkoutTemplateRow({ id: 'template-edit-1', name: body.name })])
    }

    return new Response(JSON.stringify({ error: `Unhandled ${method} ${requestUrl}` }), { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://pplus-test.supabase.co',
    serviceRoleKey: 'service-role-test-key',
    fetchImpl,
  })

  const template = await repository.updateWorkoutTemplate('template-edit-1', {
    id: 'template-edit-1',
    name: 'Updated template',
    focusArea: 'Strength',
    duration: '50 min',
    status: 'active',
  })

  assert.equal(template.id, 'template-edit-1')
  assert.deepEqual(calls.map((call) => `${call.method} ${new URL(call.url).pathname}`), ['PATCH /rest/v1/workout_templates'])
})

test('workout template repository delete contract validates requested ids and deletes only matching parent templates', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    calls.push({ method, url: requestUrl, body: options.body ? JSON.parse(options.body) : null })

    if (method === 'GET' && requestUrl.includes('/workout_templates?')) {
      assert.match(decodeURIComponent(requestUrl), /id=in\.\(template-delete-1,template-delete-2\)/)
      return Response.json([
        makeWorkoutTemplateRow({ id: 'template-delete-1' }),
        makeWorkoutTemplateRow({ id: 'template-delete-2' }),
      ])
    }

    if (method === 'DELETE' && requestUrl.includes('/workout_templates?')) {
      assert.match(decodeURIComponent(requestUrl), /id=in\.\(template-delete-1,template-delete-2\)/)
      return Response.json([
        { id: 'template-delete-1' },
        { id: 'template-delete-2' },
      ])
    }

    return new Response(JSON.stringify({ error: `Unhandled ${method} ${requestUrl}` }), { status: 500 })
  }

  const repository = createProgramWorkoutRepository({
    supabaseUrl: 'https://pplus-test.supabase.co',
    serviceRoleKey: 'service-role-test-key',
    fetchImpl,
  })

  const result = await repository.deleteWorkoutTemplates({
    workoutTemplateIds: ['template-delete-1', 'template-delete-2', 'template-delete-1'],
  })

  assert.deepEqual(result, {
    deletedWorkouts: [{ id: 'template-delete-1' }, { id: 'template-delete-2' }],
    skippedWorkouts: [],
  })
  assert.deepEqual(calls.map((call) => `${call.method} ${new URL(call.url).pathname}`), [
    'GET /rest/v1/workout_templates',
    'DELETE /rest/v1/workout_templates',
  ])
})
