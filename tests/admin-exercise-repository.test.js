import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminExerciseRepository } from '../apps/web/lib/admin-exercise-repository.js'

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return payload == null ? '' : JSON.stringify(payload)
    },
    async json() {
      return payload
    },
  }
}

test('createAdminExerciseRepository creates an exercise and role-based muscle mappings without fake detail columns', async () => {
  const calls = []
  const repository = createAdminExerciseRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'
      const body = (() => {
        if (!options.body) return null
        if (typeof options.body === 'string') return JSON.parse(options.body)
        return options.body
      })()
      calls.push({ table, method, url: parsedUrl.toString(), body })

      if (parsedUrl.pathname.includes('/storage/v1/object/exercise-media/')) {
        return jsonResponse({ Key: 'exercise-media/exercise-1/thumb.png' })
      }

      if (parsedUrl.pathname.includes('/storage/v1/object/exercise-videos/')) {
        return jsonResponse({ Key: 'exercise-videos/exercise-1/demo.mp4' })
      }

      if (table === 'exercises' && method === 'POST') {
        return jsonResponse([
          {
            id: 'exercise-1',
            name: body.name,
            slug: body.slug,
            description: body.description,
            difficulty: body.difficulty,
            stimulus_type: body.stimulus_type,
            default_equipment: body.default_equipment,
            thumbnail_url: body.thumbnail_url ?? null,
            video_url: body.video_url ?? null,
            created_at: '2026-05-26T18:00:00.000Z',
            exercise_muscle_maps: [],
          },
        ])
      }

      if (table === 'exercise_muscle_maps' && method === 'POST') {
        return jsonResponse(body.map((row, index) => ({ id: `map-${index + 1}`, ...row })))
      }

      throw new Error(`Unexpected request in create test: ${method} ${parsedUrl.toString()}`)
    },
  })

  const exercise = await repository.createExercise({
    name: 'Rear Foot Elevated Split Squat',
    description: 'Loaded unilateral strength builder.',
    category: 'strength',
    difficulty: 'intermediate',
    equipmentNeeded: ['dumbbell', 'bench'],
    primaryMuscleId: 'muscle-quads',
    secondaryMuscleIds: ['muscle-glutes', 'muscle-hamstrings', 'muscle-quads'],
    thumbnailUpload: {
      dataUrl: 'data:image/png;base64,QUJD',
      contentType: 'image/png',
      fileName: 'thumb.png',
    },
    videoUpload: {
      dataUrl: 'data:video/mp4;base64,R0hJ',
      contentType: 'video/mp4',
      fileName: 'demo.mp4',
    },
    sets: '4',
    reps: '8',
    rest: '60 sec',
    status: 'draft',
  })

  assert.equal(exercise.id, 'exercise-1')
  assert.equal(exercise.name, 'Rear Foot Elevated Split Squat')
  assert.equal(exercise.primaryMuscleId, 'muscle-quads')
  assert.deepEqual(exercise.secondaryMuscleIds, ['muscle-glutes', 'muscle-hamstrings'])
  assert.equal(exercise.thumbnailUrl.endsWith('/thumb.png'), true)
  assert.equal(exercise.thumbnailUrl.includes('/storage/v1/object/public/exercise-media/'), true)
  assert.equal(exercise.videoUrl.endsWith('/demo.mp4'), true)
  assert.equal(exercise.videoUrl.includes('/storage/v1/object/public/exercise-videos/'), true)

  const storageCall = calls.find((call) => call.url.includes('/storage/v1/object/exercise-media/'))
  assert.ok(storageCall)
  const videoStorageCall = calls.find((call) => call.url.includes('/storage/v1/object/exercise-videos/'))
  assert.ok(videoStorageCall)

  const exerciseInsertCall = calls.find((call) => call.table === 'exercises' && call.method === 'POST')
  assert.ok(exerciseInsertCall)
  assert.equal(exerciseInsertCall.body.name, 'Rear Foot Elevated Split Squat')
  assert.equal(exerciseInsertCall.body.description, 'Loaded unilateral strength builder.')
  assert.equal(exerciseInsertCall.body.difficulty, 'intermediate')
  assert.equal(exerciseInsertCall.body.stimulus_type, 'strength')
  assert.equal(exerciseInsertCall.body.default_equipment, 'dumbbell')
  assert.equal(exerciseInsertCall.body.thumbnail_url.endsWith('/thumb.png'), true)
  assert.equal(exerciseInsertCall.body.thumbnail_url.includes('/storage/v1/object/public/exercise-media/'), true)
  assert.equal(exerciseInsertCall.body.video_url.endsWith('/demo.mp4'), true)
  assert.equal(exerciseInsertCall.body.video_url.includes('/storage/v1/object/public/exercise-videos/'), true)
  assert.equal(typeof exerciseInsertCall.body.slug, 'string')
  assert.equal(typeof exerciseInsertCall.body.updated_at, 'string')
  assert.equal('sets' in exerciseInsertCall.body, false)
  assert.equal('reps' in exerciseInsertCall.body, false)
  assert.equal('rest' in exerciseInsertCall.body, false)
  assert.equal('status' in exerciseInsertCall.body, false)

  const muscleMapInsertCall = calls.find((call) => call.table === 'exercise_muscle_maps' && call.method === 'POST')
  assert.ok(muscleMapInsertCall)
  assert.deepEqual(muscleMapInsertCall.body, [
    {
      exercise_id: 'exercise-1',
      muscle_id: 'muscle-quads',
      role: 'primary',
      sort_order: 0,
    },
    {
      exercise_id: 'exercise-1',
      muscle_id: 'muscle-glutes',
      role: 'secondary',
      sort_order: 1,
    },
    {
      exercise_id: 'exercise-1',
      muscle_id: 'muscle-hamstrings',
      role: 'secondary',
      sort_order: 2,
    },
  ])
})

test('createAdminExerciseRepository patches an exercise and replaces muscle mappings', async () => {
  const calls = []
  const repository = createAdminExerciseRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'
      const body = (() => {
        if (!options.body) return null
        if (typeof options.body === 'string') return JSON.parse(options.body)
        return options.body
      })()
      calls.push({ table, method, url: parsedUrl.toString(), body })

      if (parsedUrl.pathname.includes('/storage/v1/object/exercise-media/')) {
        return jsonResponse({ Key: 'exercise-media/exercise-1/thumb-updated.png' })
      }

      if (parsedUrl.pathname.includes('/storage/v1/object/exercise-videos/')) {
        return jsonResponse({ Key: 'exercise-videos/exercise-1/demo-updated.mp4' })
      }

      if (table === 'exercises' && method === 'PATCH') {
        assert.equal(parsedUrl.searchParams.get('id'), 'eq.exercise-1')
        return jsonResponse([
          {
            id: 'exercise-1',
            name: body.name,
            description: body.description,
            difficulty: body.difficulty,
            stimulus_type: body.stimulus_type,
            default_equipment: body.default_equipment,
            thumbnail_url: body.thumbnail_url ?? null,
            video_url: body.video_url ?? null,
            created_at: '2026-05-26T18:00:00.000Z',
            exercise_muscle_maps: [],
          },
        ])
      }

      if (table === 'exercise_muscle_maps' && method === 'DELETE') {
        assert.equal(parsedUrl.searchParams.get('exercise_id'), 'eq.exercise-1')
        return jsonResponse(null, 204)
      }

      if (table === 'exercise_muscle_maps' && method === 'POST') {
        return jsonResponse(body.map((row, index) => ({ id: `map-${index + 1}`, ...row })))
      }

      throw new Error(`Unexpected request in update test: ${method} ${parsedUrl.toString()}`)
    },
  })

  const exercise = await repository.updateExercise('exercise-1', {
    name: 'Rear Foot Elevated Split Squat',
    description: 'Updated cue stack.',
    category: 'power',
    difficulty: 'advanced',
    equipmentNeeded: ['barbell'],
    primaryMuscleId: 'muscle-glutes',
    secondaryMuscleIds: ['muscle-quads'],
    thumbnailUpload: {
      dataUrl: 'data:image/png;base64,REVG',
      contentType: 'image/png',
      fileName: 'thumb-updated.png',
    },
    videoUpload: {
      dataUrl: 'data:video/mp4;base64,SktM',
      contentType: 'video/mp4',
      fileName: 'demo-updated.mp4',
    },
    duration: '30 sec',
    tempo: '3-1-1-0',
  })

  assert.equal(exercise.id, 'exercise-1')
  assert.equal(exercise.description, 'Updated cue stack.')
  assert.equal(exercise.primaryMuscleId, 'muscle-glutes')
  assert.deepEqual(exercise.secondaryMuscleIds, ['muscle-quads'])
  assert.equal(exercise.thumbnailUrl, 'https://example.supabase.co/storage/v1/object/public/exercise-media/exercise-1/thumb-updated.png')
  assert.equal(exercise.videoUrl, 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/demo-updated.mp4')

  const patchCall = calls.find((call) => call.table === 'exercises' && call.method === 'PATCH')
  assert.ok(patchCall)
  assert.equal(patchCall.body.name, 'Rear Foot Elevated Split Squat')
  assert.equal(patchCall.body.description, 'Updated cue stack.')
  assert.equal(patchCall.body.difficulty, 'advanced')
  assert.equal(patchCall.body.stimulus_type, 'power')
  assert.equal(patchCall.body.default_equipment, 'barbell')
  assert.equal(patchCall.body.thumbnail_url, 'https://example.supabase.co/storage/v1/object/public/exercise-media/exercise-1/thumb-updated.png')
  assert.equal(patchCall.body.video_url, 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/demo-updated.mp4')
  assert.equal(typeof patchCall.body.updated_at, 'string')
  assert.equal('duration' in patchCall.body, false)
  assert.equal('tempo' in patchCall.body, false)

  const storageCall = calls.find((call) => call.url.includes('/storage/v1/object/exercise-media/'))
  assert.ok(storageCall)

  const deleteCall = calls.find((call) => call.table === 'exercise_muscle_maps' && call.method === 'DELETE')
  assert.ok(deleteCall)

  const muscleMapInsertCall = calls.find((call) => call.table === 'exercise_muscle_maps' && call.method === 'POST')
  assert.ok(muscleMapInsertCall)
  assert.deepEqual(muscleMapInsertCall.body, [
    {
      exercise_id: 'exercise-1',
      muscle_id: 'muscle-glutes',
      role: 'primary',
      sort_order: 0,
    },
    {
      exercise_id: 'exercise-1',
      muscle_id: 'muscle-quads',
      role: 'secondary',
      sort_order: 1,
    },
  ])
})

test('createAdminExerciseRepository fetches one exercise detail with saved media urls for the editor', async () => {
  const repository = createAdminExerciseRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'

      if (table === 'exercises' && method === 'GET') {
        assert.equal(parsedUrl.searchParams.get('id'), 'eq.exercise-1')
        assert.match(parsedUrl.searchParams.get('select'), /thumbnail_url/)
        assert.match(parsedUrl.searchParams.get('select'), /video_url/)
        return jsonResponse([
          {
            id: 'exercise-1',
            name: '1-Arm DB Row',
            description: 'Pulling pattern.',
            difficulty: 'intermediate',
            movement_pattern: 'pull',
            stimulus_type: 'strength',
            default_equipment: 'dumbbell',
            thumbnail_url: 'https://example.supabase.co/storage/v1/object/public/exercise-media/exercise-1/row.png',
            video_url: 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/row.mp4',
            created_at: '2026-05-26T18:00:00.000Z',
            exercise_muscle_maps: [
              { muscle_id: 'muscle-back', role: 'primary', sort_order: 0, muscles: { id: 'muscle-back', name: 'Back' } },
            ],
          },
        ])
      }

      throw new Error(`Unexpected request in exercise detail test: ${method} ${parsedUrl.toString()}`)
    },
  })

  const exercise = await repository.getExercise('exercise-1')

  assert.equal(exercise.id, 'exercise-1')
  assert.equal(exercise.thumbnailUrl, 'https://example.supabase.co/storage/v1/object/public/exercise-media/exercise-1/row.png')
  assert.equal(exercise.videoUrl, 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/row.mp4')
  assert.equal(exercise.primaryMuscleId, 'muscle-back')
})

test('createAdminExerciseRepository lists active muscle options for the editor', async () => {
  const repository = createAdminExerciseRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'

      if (table === 'muscles' && method === 'GET') {
        return jsonResponse([
          { id: 'muscle-1', name: 'Glutes', sort_order: 2 },
          { id: 'muscle-2', name: 'Quads', sort_order: 1 },
        ])
      }

      throw new Error(`Unexpected request in muscles test: ${method} ${parsedUrl.toString()}`)
    },
  })

  const muscleOptions = await repository.listMuscles()

  assert.deepEqual(muscleOptions, [
    { value: 'muscle-2', label: 'Quads' },
    { value: 'muscle-1', label: 'Glutes' },
  ])
})
