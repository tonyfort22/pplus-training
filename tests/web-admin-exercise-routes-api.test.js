import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminExerciseRouteHandlers } from '../apps/web/lib/admin-exercise-route-handlers.js'

function jsonRequest(payload, method = 'POST') {
  return new Request('http://localhost/api/admin/exercises', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

async function readJson(response) {
  return response.json()
}

test('admin exercise API list route returns exercises and muscle options from the repository', async () => {
  const calls = []
  const handlers = createAdminExerciseRouteHandlers({
    createRepository: () => ({
      async listExercises() {
        calls.push(['listExercises'])
        return [
          {
            id: 'exercise-1',
            name: 'Crossover Step',
            status: 'active',
          },
        ]
      },
      async listMuscles() {
        calls.push(['listMuscles'])
        return [{ value: 'muscle-quads', label: 'Quads' }]
      },
    }),
  })

  const response = await handlers.GET()
  const body = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['listExercises'], ['listMuscles']])
  assert.deepEqual(body, {
    exercises: [
      {
        id: 'exercise-1',
        name: 'Crossover Step',
        status: 'active',
      },
    ],
    muscleOptions: [{ value: 'muscle-quads', label: 'Quads' }],
  })
})

test('admin exercise API create route passes the request payload and returns 201', async () => {
  const calls = []
  const createPayload = {
    name: 'Loaded Split Squat',
    category: 'strength',
    primaryMuscleId: 'muscle-quads',
    secondaryMuscleIds: ['muscle-glutes'],
  }
  const handlers = createAdminExerciseRouteHandlers({
    createRepository: () => ({
      async createExercise(payload) {
        calls.push(['createExercise', payload])
        return { id: 'exercise-created', ...payload, status: 'draft' }
      },
    }),
  })

  const response = await handlers.POST(jsonRequest(createPayload))
  const body = await readJson(response)

  assert.equal(response.status, 201)
  assert.deepEqual(calls, [['createExercise', createPayload]])
  assert.deepEqual(body.exercise, {
    id: 'exercise-created',
    ...createPayload,
    status: 'draft',
  })
})

test('admin exercise API update route resolves the route exercise id and passes the request payload', async () => {
  const calls = []
  const updatePayload = {
    name: 'Loaded Split Squat Updated',
    status: 'active',
    sets: '4',
  }
  const handlers = createAdminExerciseRouteHandlers({
    createRepository: () => ({
      async updateExercise(exerciseId, payload) {
        calls.push(['updateExercise', exerciseId, payload])
        return { id: exerciseId, ...payload }
      },
    }),
  })

  const response = await handlers.PATCH(
    jsonRequest(updatePayload, 'PATCH'),
    { params: Promise.resolve({ exerciseId: 'exercise-1' }) },
  )
  const body = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['updateExercise', 'exercise-1', updatePayload]])
  assert.deepEqual(body.exercise, { id: 'exercise-1', ...updatePayload })
})

test('admin exercise API delete route resolves the route exercise id and returns the delete result', async () => {
  const calls = []
  const handlers = createAdminExerciseRouteHandlers({
    createRepository: () => ({
      async deleteExercise(exerciseId) {
        calls.push(['deleteExercise', exerciseId])
        return { exerciseId, deleted: true }
      },
    }),
  })

  const response = await handlers.DELETE(
    new Request('http://localhost/api/admin/exercises/exercise-1', { method: 'DELETE' }),
    { params: Promise.resolve({ exerciseId: 'exercise-1' }) },
  )
  const body = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['deleteExercise', 'exercise-1']])
  assert.deepEqual(body.result, { exerciseId: 'exercise-1', deleted: true })
})

test('admin exercise API preserves repository error status and message', async () => {
  const error = new Error('Exercise not found.')
  error.status = 404
  const handlers = createAdminExerciseRouteHandlers({
    createRepository: () => ({
      async deleteExercise() {
        throw error
      },
    }),
  })

  const response = await handlers.DELETE(
    new Request('http://localhost/api/admin/exercises/missing-exercise', { method: 'DELETE' }),
    { params: Promise.resolve({ exerciseId: 'missing-exercise' }) },
  )
  const body = await readJson(response)

  assert.equal(response.status, 404)
  assert.deepEqual(body, { error: 'Exercise not found.' })
})
