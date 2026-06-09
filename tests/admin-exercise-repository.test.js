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
            default_sets: body.default_sets,
            default_reps: body.default_reps,
            default_distance: body.default_distance,
            default_weight: body.default_weight,
            default_duration: body.default_duration,
            default_rest: body.default_rest,
            default_tempo: body.default_tempo,
            status: body.status,
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

      if (table === 'exercise_sets' && method === 'POST') {
        return jsonResponse(body.map((row, index) => ({ id: `set-${index + 1}`, ...row })))
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
    distance: '20 m',
    weights: '40 lb',
    duration: '30 sec',
    rest: '60 sec',
    tempo: '3-1-1-0',
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
  assert.equal(exerciseInsertCall.body.default_equipment, 'dumbbell, bench')
  assert.equal(exerciseInsertCall.body.thumbnail_url.endsWith('/thumb.png'), true)
  assert.equal(exerciseInsertCall.body.thumbnail_url.includes('/storage/v1/object/public/exercise-media/'), true)
  assert.equal(exerciseInsertCall.body.video_url.endsWith('/demo.mp4'), true)
  assert.equal(exerciseInsertCall.body.video_url.includes('/storage/v1/object/public/exercise-videos/'), true)
  assert.equal(typeof exerciseInsertCall.body.slug, 'string')
  assert.equal(typeof exerciseInsertCall.body.updated_at, 'string')
  assert.equal(exerciseInsertCall.body.default_sets, '4')
  assert.equal(exerciseInsertCall.body.default_reps, '8')
  assert.equal(exerciseInsertCall.body.default_distance, '20 m')
  assert.equal(exerciseInsertCall.body.default_weight, '40 lb')
  assert.equal(exerciseInsertCall.body.default_duration, '30 sec')
  assert.equal(exerciseInsertCall.body.default_rest, '60 sec')
  assert.equal(exerciseInsertCall.body.default_tempo, '3-1-1-0')
  assert.equal(exerciseInsertCall.body.status, 'draft')

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
  const setInsertCall = calls.find((call) => call.table === 'exercise_sets' && call.method === 'POST')
  assert.ok(setInsertCall)
  assert.equal(setInsertCall.body.length, 4)
  assert.deepEqual(setInsertCall.body.map((row) => row.sort_order), [1, 2, 3, 4])
  assert.deepEqual(setInsertCall.body[0], {
    exercise_id: 'exercise-1',
    sort_order: 1,
    set_type: 'straight',
    target_reps: '8',
    target_load: '40 lb',
    target_load_unit: 'lb',
    target_duration: '30 sec',
    target_distance: '20 m',
    target_rest: '60 sec',
    tempo: '3-1-1-0',
    notes: null,
  })
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
            default_sets: body.default_sets,
            default_reps: body.default_reps,
            default_distance: body.default_distance,
            default_weight: body.default_weight,
            default_duration: body.default_duration,
            default_rest: body.default_rest,
            default_tempo: body.default_tempo,
            status: body.status,
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

      if (table === 'exercise_sets' && method === 'DELETE') {
        assert.equal(parsedUrl.searchParams.get('exercise_id'), 'eq.exercise-1')
        return jsonResponse(null, 204)
      }

      if (table === 'exercise_sets' && method === 'POST') {
        return jsonResponse(body.map((row, index) => ({ id: `set-${index + 1}`, ...row })))
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
    sets: '5',
    reps: '6',
    distance: '10 m',
    weights: '45 lb',
    duration: '30 sec',
    rest: '90 sec',
    tempo: '3-1-1-0',
    status: 'active',
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
  assert.equal(patchCall.body.default_sets, '5')
  assert.equal(patchCall.body.default_reps, '6')
  assert.equal(patchCall.body.default_distance, '10 m')
  assert.equal(patchCall.body.default_weight, '45 lb')
  assert.equal(patchCall.body.default_duration, '30 sec')
  assert.equal(patchCall.body.default_rest, '90 sec')
  assert.equal(patchCall.body.default_tempo, '3-1-1-0')
  assert.equal(patchCall.body.status, 'active')

  const storageCall = calls.find((call) => call.url.includes('/storage/v1/object/exercise-media/'))
  assert.ok(storageCall)

  const deleteCall = calls.find((call) => call.table === 'exercise_muscle_maps' && call.method === 'DELETE')
  assert.ok(deleteCall)

  const muscleMapInsertCall = calls.find((call) => call.table === 'exercise_muscle_maps' && call.method === 'POST')
  assert.ok(muscleMapInsertCall)
  const setDeleteCall = calls.find((call) => call.table === 'exercise_sets' && call.method === 'DELETE')
  assert.ok(setDeleteCall)

  const setInsertCall = calls.find((call) => call.table === 'exercise_sets' && call.method === 'POST')
  assert.ok(setInsertCall)
  assert.equal(setInsertCall.body.length, 5)
  assert.deepEqual(setInsertCall.body.at(-1), {
    exercise_id: 'exercise-1',
    sort_order: 5,
    set_type: 'straight',
    target_reps: '6',
    target_load: '45 lb',
    target_load_unit: 'lb',
    target_duration: '30 sec',
    target_distance: '10 m',
    target_rest: '90 sec',
    tempo: '3-1-1-0',
    notes: null,
  })
})

test('createAdminExerciseRepository accepts only direct Supabase mp4 exercise video_url values', async () => {
  const calls = []
  const repository = createAdminExerciseRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const method = options.method || 'GET'
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ table, method, body })

      if (table === 'exercises' && method === 'POST') {
        return jsonResponse([
          {
            id: body.id,
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

      throw new Error(`Unexpected request in direct video_url test: ${method} ${parsedUrl.toString()}`)
    },
  })

  const directVideoUrl = 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/demo.mp4'
  const exercise = await repository.createExercise({
    name: 'Direct Video Demo',
    video_url: directVideoUrl,
  })

  assert.equal(exercise.videoUrl, directVideoUrl)
  assert.equal(calls[0].body.video_url, directVideoUrl)

  await assert.rejects(
    () => repository.createExercise({
      name: 'YouTube Video Demo',
      videoUrl: 'https://www.youtube.com/watch?v=WepkDTJaBvw',
    }),
    /direct Supabase mp4 URL/,
  )
  await assert.rejects(
    () => repository.createExercise({
      name: 'Non-mp4 Video Demo',
      videoUrl: 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/demo.mov',
    }),
    /direct Supabase mp4 URL/,
  )
  assert.equal(calls.length, 1)
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
            default_sets: '4',
            default_reps: '8-10',
            default_distance: '20 m',
            default_weight: '40 lb',
            default_duration: '30 sec',
            default_rest: '60 sec',
            default_tempo: '3-1-1-0',
            status: 'active',
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
  assert.equal(exercise.sets, '4')
  assert.equal(exercise.reps, '8-10')
  assert.equal(exercise.distance, '20 m')
  assert.equal(exercise.weights, '40 lb')
  assert.equal(exercise.duration, '30 sec')
  assert.equal(exercise.rest, '60 sec')
  assert.equal(exercise.tempo, '3-1-1-0')
  assert.equal(exercise.status, 'active')
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
