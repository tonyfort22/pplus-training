import test from 'node:test'
import assert from 'node:assert/strict'

import { createSupabaseRestExerciseRepository } from '../packages/data/src/exercises/index.js'

function json(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return JSON.stringify(payload)
    },
  }
}

test('createSupabaseRestExerciseRepository lists exercises with thumbnail and video fields', async () => {
  const calls = []
  const repo = createSupabaseRestExerciseRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
      })

      assert.equal(parsedUrl.pathname, '/rest/v1/exercises')
      assert.equal(parsedUrl.searchParams.get('select'), 'id,name,thumbnail_url,video_url')
      assert.equal(parsedUrl.searchParams.get('order'), 'name.asc')

      return json([
        {
          id: 'exercise-1',
          name: 'Front Squat',
          thumbnail_url: 'data:image/jpeg;base64,abc',
          video_url: 'https://www.youtube.com/watch?v=WepkDTJaBvw',
        },
        {
          id: 'exercise-2',
          name: 'Trap Bar Deadlift',
          thumbnail_url: null,
          video_url: null,
        },
      ])
    },
  })

  const exercises = await repo.listExercises()

  assert.deepEqual(exercises, [
    {
      id: 'exercise-1',
      name: 'Front Squat',
      thumbnailUrl: 'data:image/jpeg;base64,abc',
      videoUrl: 'https://www.youtube.com/watch?v=WepkDTJaBvw',
    },
    {
      id: 'exercise-2',
      name: 'Trap Bar Deadlift',
      thumbnailUrl: null,
      videoUrl: null,
    },
  ])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'GET')
})

test('createSupabaseRestExerciseRepository fetches a single exercise with linked default rest and set structure by id', async () => {
  const calls = []
  const repo = createSupabaseRestExerciseRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
      })

      if (parsedUrl.pathname === '/rest/v1/exercises') {
        assert.equal(parsedUrl.searchParams.get('select'), 'id,name,thumbnail_url,video_url')
        assert.equal(parsedUrl.searchParams.get('id'), 'eq.exercise-1')
        assert.equal(parsedUrl.searchParams.get('limit'), '1')

        return json([
          {
            id: 'exercise-1',
            name: 'Front Squat',
            thumbnail_url: 'data:image/jpeg;base64,abc',
            video_url: 'https://cdn.example.com/front-squat.mp4',
          },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/program_workout_exercises') {
        assert.equal(parsedUrl.searchParams.get('exercise_id'), 'eq.exercise-1')
        assert.equal(parsedUrl.searchParams.get('select'), 'id,default_rest_seconds')
        assert.equal(parsedUrl.searchParams.get('order'), 'updated_at.desc,created_at.desc')
        assert.equal(parsedUrl.searchParams.get('limit'), '1')
        return json([{ id: 'pwe-1', default_rest_seconds: 150 }])
      }

      if (parsedUrl.pathname === '/rest/v1/program_workout_sets') {
        assert.equal(parsedUrl.searchParams.get('program_workout_exercise_id'), 'eq.pwe-1')
        return json([
          {
            sort_order: 1,
            set_type: 'straight',
            target_reps: 5,
            target_load: 135,
            target_load_unit: 'lb',
            target_rpe: 7,
            target_rest_seconds: 150,
            notes: 'Explode up',
          },
          {
            sort_order: 2,
            set_type: 'straight',
            target_reps: 5,
            target_load: 135,
            target_load_unit: 'lb',
            target_rpe: 8,
            target_rest_seconds: 150,
            notes: '',
          },
        ])
      }

      throw new Error(`Unexpected URL: ${parsedUrl.toString()}`)
    },
  })

  const exercise = await repo.getExerciseById('exercise-1')

  assert.deepEqual(exercise, {
    id: 'exercise-1',
    name: 'Front Squat',
    thumbnailUrl: 'data:image/jpeg;base64,abc',
    videoUrl: 'https://cdn.example.com/front-squat.mp4',
    defaultRestSeconds: 150,
    sets: [
      {
        setType: 'straight',
        targetReps: 5,
        targetLoad: 135,
        targetLoadUnit: 'lb',
        targetDurationSeconds: null,
        targetDistance: null,
        targetDistanceUnit: null,
        targetRpe: 7,
        targetRir: null,
        targetRestSeconds: 150,
        notes: 'Explode up',
        sortOrder: 1,
      },
      {
        setType: 'straight',
        targetReps: 5,
        targetLoad: 135,
        targetLoadUnit: 'lb',
        targetDurationSeconds: null,
        targetDistance: null,
        targetDistanceUnit: null,
        targetRpe: 8,
        targetRir: null,
        targetRestSeconds: 150,
        notes: '',
        sortOrder: 2,
      },
    ],
  })
  assert.equal(calls.length, 3)
  assert.equal(calls[0].method, 'GET')
})

test('createSupabaseRestExerciseRepository fetches a single exercise with thumbnail and video fields by exact name fallback', async () => {
  const calls = []
  const repo = createSupabaseRestExerciseRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      calls.push({
        url: parsedUrl.toString(),
        method: options.method || 'GET',
      })

      if (parsedUrl.pathname === '/rest/v1/exercises') {
        assert.equal(parsedUrl.searchParams.get('select'), 'id,name,thumbnail_url,video_url')
        assert.equal(parsedUrl.searchParams.get('name'), 'eq.Barbell Back Squat')
        assert.equal(parsedUrl.searchParams.get('limit'), '1')

        return json([
          {
            id: 'db-exercise-squat',
            name: 'Barbell Back Squat',
            thumbnail_url: 'data:image/jpeg;base64,xyz',
            video_url: 'https://cdn.example.com/back-squat.mp4',
          },
        ])
      }

      if (parsedUrl.pathname === '/rest/v1/program_workout_exercises') {
        return json([])
      }

      throw new Error(`Unexpected URL: ${parsedUrl.toString()}`)
    },
  })

  const exercise = await repo.getExerciseByName('Barbell Back Squat')

  assert.deepEqual(exercise, {
    id: 'db-exercise-squat',
    name: 'Barbell Back Squat',
    thumbnailUrl: 'data:image/jpeg;base64,xyz',
    videoUrl: 'https://cdn.example.com/back-squat.mp4',
  })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].method, 'GET')
})
