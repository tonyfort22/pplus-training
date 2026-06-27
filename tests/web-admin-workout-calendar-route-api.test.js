import test from 'node:test'
import assert from 'node:assert/strict'

import { createWorkoutCalendarRouteHandlers } from '../apps/web/lib/workout-calendar-route-handlers.js'
import { createWorkoutCalendarRepository } from '../apps/web/lib/workout-calendar-repository.js'

function jsonRequest(method, body, url = 'http://localhost/api/admin/workout-calendar') {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  })
}

async function readJson(response) {
  return response.json()
}

function makeAssignment(overrides = {}) {
  return {
    id: 'calendar-workout-1',
    athlete_id: 'athlete-1',
    coach_id: 'coach-1',
    program_id: 'program-1',
    program_day_id: 'program-day-1',
    workout_template_id: 'template-1',
    name_snapshot: 'Acceleration mechanics',
    notes: 'Keep rests honest.',
    status: 'scheduled',
    sort_order: 2,
    scheduled_date: null,
    scheduled_start_time: '07:00',
    scheduled_end_time: '08:00',
    created_at: '2026-06-20T10:00:00.000Z',
    updated_at: '2026-06-20T10:10:00.000Z',
    program_days: { date: '2026-06-21' },
    workout_templates: { name: 'Acceleration mechanics', training_type: 'Speed' },
    ...overrides,
  }
}

test('workout calendar GET route returns assignment shape from athlete-scoped repository query', async () => {
  const calls = []
  const handlers = createWorkoutCalendarRouteHandlers({
    repositoryFactory: () => ({
      async listAssignments(payload) {
        calls.push(['listAssignments', payload])
        return [makeAssignment()]
      },
    }),
  })

  const response = await handlers.GET(new Request('http://localhost/api/admin/workout-calendar?athleteId=athlete-1'))
  const payload = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['listAssignments', { athleteId: 'athlete-1' }]])
  assert.deepEqual(payload, { assignments: [makeAssignment()] })
})

test('workout calendar mutation routes preserve request and response shapes', async () => {
  const calls = []
  const handlers = createWorkoutCalendarRouteHandlers({
    repositoryFactory: () => ({
      async createAssignment(payload) {
        calls.push(['createAssignment', payload])
        return makeAssignment({ id: 'calendar-created', ...payload })
      },
      async updateAssignment(id, payload) {
        calls.push(['updateAssignment', id, payload])
        return makeAssignment({ id, ...payload })
      },
      async deleteAssignment(id) {
        calls.push(['deleteAssignment', id])
        return { id }
      },
    }),
  })

  const createBody = {
    athlete_id: 'athlete-1',
    coach_id: 'coach-1',
    program_id: 'program-1',
    program_day_id: 'program-day-1',
    workout_template_id: 'template-1',
    name_snapshot: 'Acceleration mechanics',
    notes: 'Create notes',
    scheduled_date: '2026-06-21',
    scheduled_start_time: '07:00',
    scheduled_end_time: '08:00',
  }
  const createResponse = await handlers.POST(jsonRequest('POST', createBody))
  const createPayload = await readJson(createResponse)

  assert.equal(createResponse.status, 201)
  assert.deepEqual(calls[0], ['createAssignment', { ...createBody, status: 'scheduled', sort_order: null }])
  assert.equal(createPayload.assignment.id, 'calendar-created')

  const updateBody = {
    id: 'calendar-workout-1',
    workout_template_id: 'template-2',
    name_snapshot: 'Updated mechanics',
    notes: '',
    status: 'completed',
    scheduled_date: '2026-06-22',
    scheduled_start_time: '08:00',
    scheduled_end_time: '09:00',
  }
  const updateResponse = await handlers.PATCH(jsonRequest('PATCH', updateBody))
  const updatePayload = await readJson(updateResponse)

  assert.equal(updateResponse.status, 200)
  assert.deepEqual(calls[1], ['updateAssignment', 'calendar-workout-1', {
    workout_template_id: 'template-2',
    name_snapshot: 'Updated mechanics',
    notes: '',
    status: 'completed',
    scheduled_date: '2026-06-22',
    scheduled_start_time: '08:00',
    scheduled_end_time: '09:00',
  }])
  assert.equal(updatePayload.assignment.name_snapshot, 'Updated mechanics')

  const deleteResponse = await handlers.DELETE(new Request('http://localhost/api/admin/workout-calendar?id=calendar-workout-1', { method: 'DELETE' }))
  const deletePayload = await readJson(deleteResponse)

  assert.equal(deleteResponse.status, 200)
  assert.deepEqual(calls[2], ['deleteAssignment', 'calendar-workout-1'])
  assert.deepEqual(deletePayload, { id: 'calendar-workout-1' })
})

test('workout calendar route preserves repository error status and message', async () => {
  const handlers = createWorkoutCalendarRouteHandlers({
    repositoryFactory: () => ({
      async listAssignments() {
        const error = new Error('Calendar store is unavailable.')
        error.status = 503
        throw error
      },
    }),
  })

  const response = await handlers.GET(new Request('http://localhost/api/admin/workout-calendar'))
  const payload = await readJson(response)

  assert.equal(response.status, 503)
  assert.deepEqual(payload, { error: 'Calendar store is unavailable.' })
})

test('workout calendar repository list shape keeps copied planned workouts visible without unsafe color columns', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    calls.push({ method: options.method || 'GET', url: String(url), body: options.body ? JSON.parse(options.body) : null })
    const requestUrl = String(url)

    assert.match(requestUrl, /\/rest\/v1\/program_workouts\?/)
    assert.match(requestUrl, /athlete_id=eq\.athlete-1/)
    assert.match(decodeURIComponent(requestUrl), /program_days\(date\)/)
    assert.match(decodeURIComponent(requestUrl), /workout_templates\(name,training_type\)/)
    assert.doesNotMatch(decodeURIComponent(requestUrl), /bg_color|text_color/)
    assert.doesNotMatch(requestUrl, /scheduled_date=not\.is\.null/)

    return Response.json([makeAssignment()])
  }

  const repository = createWorkoutCalendarRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl,
  })

  const assignments = await repository.listAssignments({ athleteId: 'athlete-1' })

  assert.equal(calls.length, 1)
  assert.deepEqual(assignments, [makeAssignment()])
})
