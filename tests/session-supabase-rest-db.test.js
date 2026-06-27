import test from 'node:test'
import assert from 'node:assert/strict'

import { createSupabaseRestSessionDb } from '../packages/data/src/sessions/index.js'

function createSupabaseFetchStub() {
  const calls = []
  const rows = {
    programWorkout: {
      id: 'pw-1',
      athlete_id: 'ath-1',
      coach_id: 'coach-1',
      program_id: 'prog-1',
      program_day_id: 'day-1',
      workout_template_id: 'tpl-1',
      name_snapshot: 'Lower B',
      status: 'planned',
      sort_order: 1,
      default_rest_seconds: 180,
      auto_progress_enabled: true,
      adjust_effort_after_set: false,
    },
    exercises: [
      {
        id: 'ex-1',
        body_region: 'lower',
      },
    ],
    exerciseMuscleMaps: [
      {
        id: 'emm-1',
        exercise_id: 'ex-1',
        muscle_id: 'quads',
        contribution_percent: 0.6,
        sort_order: 1,
      },
      {
        id: 'emm-2',
        exercise_id: 'ex-1',
        muscle_id: 'glutes',
        contribution_percent: 0.4,
        sort_order: 2,
      },
    ],
    exerciseSubMuscleMaps: [],
    programWorkoutExercises: [
      {
        id: 'pwe-1',
        program_workout_id: 'pw-1',
        exercise_id: 'ex-1',
        name_snapshot: 'Front Squat',
        sort_order: 1,
        notes: 'Stay tall',
        default_rest_seconds: 120,
      },
    ],
    programWorkoutSets: [
      {
        id: 'pws-1',
        program_workout_exercise_id: 'pwe-1',
        sort_order: 1,
        set_type: 'straight',
        target_reps: 8,
        target_load: 135,
        target_load_unit: 'lb',
        target_duration_seconds: null,
        target_distance: null,
        target_distance_unit: null,
        target_rpe: 7,
        target_rir: 3,
        target_rest_seconds: 120,
        notes: 'Smooth reps',
      },
    ],
    workoutSession: {
      id: 'ws-1',
      athlete_id: 'ath-1',
      coach_id: 'coach-1',
      program_id: 'prog-1',
      program_day_id: 'day-1',
      program_workout_id: 'pw-1',
      workout_template_id: 'tpl-1',
      name_snapshot: 'Lower B',
      status: 'in_progress',
      started_at: '2026-04-21T20:00:00.000Z',
      completed_at: null,
      elapsed_seconds: 0,
      notes: '',
      perceived_difficulty: null,
      default_rest_seconds: 180,
      auto_progress_enabled: true,
      keep_awake: true,
      adjust_effort_after_set: false,
      total_exercises_count: 1,
      completed_exercises_count: 0,
      total_sets_count: 1,
      completed_sets_count: 0,
    },
    workoutSessionExercises: [
      {
        id: 'wse-1',
        workout_session_id: 'ws-1',
        program_workout_exercise_id: 'pwe-1',
        exercise_id: 'ex-1',
        name_snapshot: 'Front Squat',
        sort_order: 1,
        status: 'not_started',
        notes: 'Stay tall',
        default_rest_seconds: 120,
      },
    ],
    workoutSessionSets: [
      {
        id: 'wss-1',
        workout_session_exercise_id: 'wse-1',
        program_workout_set_id: 'pws-1',
        sort_order: 1,
        set_type: 'straight',
        prescribed_reps: 8,
        prescribed_load: 135,
        prescribed_load_unit: 'lb',
        prescribed_duration_seconds: null,
        prescribed_distance: null,
        prescribed_distance_unit: null,
        prescribed_rpe: 7,
        prescribed_rir: 3,
        prescribed_rest_seconds: 120,
        actual_reps: null,
        actual_load: null,
        actual_load_unit: null,
        actual_duration_seconds: null,
        actual_distance: null,
        actual_distance_unit: null,
        actual_rpe: null,
        actual_rir: null,
        actual_rest_seconds: null,
        completed_at: null,
        is_completed: false,
        notes: 'Smooth reps',
      },
    ],
    sessionLoadSummaries: [],
    exercisePerformanceSnapshots: [],
    muscleLoadEvents: [],
  }

  const fetchImpl = async (url, options = {}) => {
    const method = options.method || 'GET'
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ method, table, url: parsedUrl.toString(), body, headers: options.headers || {} })

    if (table === 'program_workouts' && method === 'GET') {
      return createJsonResponse([rows.programWorkout])
    }

    if (table === 'program_workout_exercises' && method === 'GET') {
      return createJsonResponse(rows.programWorkoutExercises)
    }

    if (table === 'program_workout_sets' && method === 'GET') {
      return createJsonResponse(rows.programWorkoutSets)
    }

    if (table === 'exercises' && method === 'GET') {
      return createJsonResponse(rows.exercises)
    }

    if (table === 'exercise_muscle_maps' && method === 'GET') {
      return createJsonResponse(rows.exerciseMuscleMaps)
    }

    if (table === 'exercise_sub_muscle_maps' && method === 'GET') {
      return createJsonResponse(rows.exerciseSubMuscleMaps)
    }

    if (table === 'workout_sessions' && method === 'POST') {
      rows.workoutSession = { ...rows.workoutSession, ...body, id: rows.workoutSession.id }
      return createJsonResponse([rows.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'POST') {
      rows.workoutSessionExercises = [{ id: 'wse-1', ...body }]
      return createJsonResponse(rows.workoutSessionExercises)
    }

    if (table === 'workout_session_sets' && method === 'POST') {
      rows.workoutSessionSets = [{ id: 'wss-1', ...body }]
      return createJsonResponse(rows.workoutSessionSets)
    }

    if (table === 'workout_sessions' && method === 'PATCH') {
      rows.workoutSession = { ...rows.workoutSession, ...body }
      return createJsonResponse([rows.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'PATCH') {
      rows.workoutSessionExercises = rows.workoutSessionExercises.map((row) => ({ ...row, ...body }))
      return createJsonResponse(rows.workoutSessionExercises)
    }

    if (table === 'workout_session_sets' && method === 'PATCH') {
      rows.workoutSessionSets = rows.workoutSessionSets.map((row) => ({ ...row, ...body }))
      return createJsonResponse(rows.workoutSessionSets)
    }

    if (table === 'workout_sessions' && method === 'GET') {
      return createJsonResponse([rows.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'GET') {
      return createJsonResponse(rows.workoutSessionExercises)
    }

    if (table === 'workout_session_sets' && method === 'GET') {
      return createJsonResponse(rows.workoutSessionSets)
    }

    if (table === 'session_load_summaries' && method === 'POST') {
      rows.sessionLoadSummaries.push({ id: `sls-${rows.sessionLoadSummaries.length + 1}`, ...body })
      return createJsonResponse([rows.sessionLoadSummaries.at(-1)])
    }

    if (table === 'exercise_performance_snapshots' && method === 'POST') {
      rows.exercisePerformanceSnapshots.push(...body.map((row, index) => ({ id: `eps-${rows.exercisePerformanceSnapshots.length + index + 1}`, ...row })))
      return createJsonResponse(rows.exercisePerformanceSnapshots)
    }

    if (table === 'muscle_load_events' && method === 'POST') {
      rows.muscleLoadEvents.push(...body.map((row, index) => ({ id: `mle-${rows.muscleLoadEvents.length + index + 1}`, ...row })))
      return createJsonResponse(rows.muscleLoadEvents)
    }

    throw new Error(`Unexpected Supabase REST call: ${method} ${table}`)
  }

  return { fetchImpl, calls, rows }
}

function createJsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return JSON.stringify(payload)
    },
  }
}

test('createSupabaseRestSessionDb uses the signed-in access token for REST auth when provided', async () => {
  const { fetchImpl, calls } = createSupabaseFetchStub()
  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl,
  })

  await db.getProgramWorkoutById('pw-1')

  assert.equal(calls[0].headers.Authorization, 'Bearer user-token')
})

test('createSupabaseRestSessionDb can load completed sessions for an athlete through Supabase REST', async () => {
  const { fetchImpl, calls, rows } = createSupabaseFetchStub()
  rows.workoutSession = {
    ...rows.workoutSession,
    athlete_id: 'ath-1',
    status: 'completed',
    completed_at: '2026-04-21T21:00:00.000Z',
    completed_sets_count: 1,
  }

  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const sessions = await db.getCompletedSessionsByAthleteId('ath-1')

  assert.equal(sessions.length, 1)
  assert.equal(sessions[0].id, 'ws-1')
  const completedSessionsCall = calls.find((call) => call.table === 'workout_sessions' && call.url.includes('status=eq.completed'))
  assert.equal(Boolean(completedSessionsCall), true)
  assert.match(completedSessionsCall.url, /athlete_id=eq\.ath-1/)
})

test('createSupabaseRestSessionDb strips coach-athlete UI ids before athlete-scoped REST filters', async () => {
  const { fetchImpl, calls, rows } = createSupabaseFetchStub()
  rows.workoutSession = {
    ...rows.workoutSession,
    athlete_id: 'f8a72b19-c5c6-4da1-8793-27d80635a444',
    status: 'completed',
    completed_at: '2026-04-21T21:00:00.000Z',
  }
  rows.programWorkout = {
    ...rows.programWorkout,
    athlete_id: 'f8a72b19-c5c6-4da1-8793-27d80635a444',
  }
  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  await db.getCompletedSessionsByAthleteId('coach-athlete-f8a72b19-c5c6-4da1-8793-27d80635a444')
  await db.listProgramWorkoutsForAthlete('coach-athlete-f8a72b19-c5c6-4da1-8793-27d80635a444')

  const athleteScopedCalls = calls.filter((call) => call.url.includes('athlete_id='))
  assert.equal(athleteScopedCalls.length >= 2, true)
  for (const call of athleteScopedCalls) {
    assert.equal(new URL(call.url).searchParams.get('athlete_id'), 'eq.f8a72b19-c5c6-4da1-8793-27d80635a444')
    assert.doesNotMatch(call.url, /coach-athlete-/)
  }
})

test('createSupabaseRestSessionDb loads a nested planned workout through Supabase REST', async () => {
  const { fetchImpl, calls } = createSupabaseFetchStub()
  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const workout = await db.getProgramWorkoutById('pw-1')

  assert.equal(workout.id, 'pw-1')
  assert.equal(workout.exercises.length, 1)
  assert.equal(workout.exercises[0].sets[0].targetLoadUnit, 'lb')
  assert.equal(workout.exercises[0].bodyRegion, 'lower')
  assert.deepEqual(workout.exercises[0].muscleTargets, [
    { muscleId: 'quads', subMuscleId: null, percent: 0.6 },
    { muscleId: 'glutes', subMuscleId: null, percent: 0.4 },
  ])
  assert.equal(calls.length, 6)
  assert.equal(calls[0].table, 'program_workouts')
})

test('createSupabaseRestSessionDb persists structured analytics rows through Supabase REST', async () => {
  const { fetchImpl, calls } = createSupabaseFetchStub()
  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const sessionLoadSummary = await db.saveSessionLoadSummary({
    athleteId: 'ath-1',
    workoutSessionId: 'ws-1',
    completedSets: 1,
    completedReps: 8,
    volumeLoad: 1160,
    effortAdjustedLoad: 1276,
    sessionDifficulty: 7,
    logDate: '2026-04-21',
  })

  const exercisePerformanceSnapshots = await db.saveExercisePerformanceSnapshots([
    {
      athleteId: 'ath-1',
      exerciseId: 'ex-1',
      workoutSessionId: 'ws-1',
      workoutSessionExerciseId: 'wse-1',
      metricType: 'strength',
      load: 145,
      reps: 8,
      sets: 1,
      durationSeconds: null,
      distance: null,
      unit: 'lb',
      bodyRegion: 'lower',
      logDate: '2026-04-21',
      estimatedOneRepMax: 183.7,
      notes: '',
    },
  ])

  const muscleLoadEvents = await db.saveMuscleLoadEvents([
    {
      athleteId: 'ath-1',
      workoutSessionId: 'ws-1',
      workoutSessionExerciseId: 'wse-1',
      workoutSessionSetId: 'wss-1',
      exerciseId: 'ex-1',
      muscleId: 'quads',
      subMuscleId: null,
      isSubMuscle: false,
      eventDate: '2026-04-21',
      percent: 0.5,
      score: 765.6,
    },
  ])

  assert.equal(sessionLoadSummary.workoutSessionId, 'ws-1')
  assert.equal(sessionLoadSummary.completedSets, 1)
  assert.equal(exercisePerformanceSnapshots.length, 1)
  assert.equal(exercisePerformanceSnapshots[0].exerciseId, 'ex-1')
  assert.equal(muscleLoadEvents.length, 1)
  assert.equal(muscleLoadEvents[0].muscleId, 'quads')
  assert.equal(calls.some((call) => call.method === 'POST' && call.table === 'session_load_summaries'), true)
  assert.equal(calls.some((call) => call.method === 'POST' && call.table === 'exercise_performance_snapshots'), true)
  assert.equal(calls.some((call) => call.method === 'POST' && call.table === 'muscle_load_events'), true)
})

test('createSupabaseRestSessionDb inserts and updates nested session rows through Supabase REST', async () => {
  const { fetchImpl, calls } = createSupabaseFetchStub()
  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const inserted = await db.insertWorkoutSession({
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'prog-1',
    programDayId: 'day-1',
    programWorkoutId: 'pw-1',
    workoutTemplateId: 'tpl-1',
    nameSnapshot: 'Lower B',
    status: 'in_progress',
    startedAt: '2026-04-21T20:00:00.000Z',
    completedAt: null,
    elapsedSeconds: 0,
    notes: '',
    perceivedDifficulty: null,
    settings: {
      defaultRestSeconds: 180,
      autoProgressEnabled: true,
      keepAwake: true,
      adjustEffortAfterSet: false,
    },
    totalExercisesCount: 1,
    completedExercisesCount: 0,
    totalSetsCount: 1,
    completedSetsCount: 0,
    exercises: [
      {
        programWorkoutExerciseId: 'pwe-1',
        exerciseId: 'ex-1',
        nameSnapshot: 'Front Squat',
        sortOrder: 1,
        status: 'not_started',
        notes: 'Stay tall',
        defaultRestSeconds: 120,
        bodyRegion: 'lower',
        muscleTargets: [
          { muscleId: 'quads', percent: 0.6 },
          { muscleId: 'glutes', percent: 0.4 },
        ],
        sets: [
          {
            programWorkoutSetId: 'pws-1',
            sortOrder: 1,
            setType: 'straight',
            prescribedReps: 8,
            prescribedLoad: 135,
            prescribedLoadUnit: 'lb',
            prescribedRpe: 7,
            prescribedRir: 3,
            prescribedRestSeconds: 120,
            isCompleted: false,
            notes: 'Smooth reps',
          },
        ],
      },
    ],
  })

  assert.equal(inserted.id, 'ws-1')
  assert.equal(inserted.exercises[0].id, 'wse-1')
  assert.equal(inserted.exercises[0].sets[0].id, 'wss-1')
  assert.equal(inserted.exercises[0].bodyRegion, 'lower')
  assert.deepEqual(inserted.exercises[0].muscleTargets, [
    { muscleId: 'quads', percent: 0.6 },
    { muscleId: 'glutes', percent: 0.4 },
  ])

  const saved = await db.saveWorkoutSession({
    ...inserted,
    completedSetsCount: 1,
    exercises: [
      {
        ...inserted.exercises[0],
        sets: [
          {
            ...inserted.exercises[0].sets[0],
            actualReps: 8,
            isCompleted: true,
          },
        ],
      },
    ],
  })

  assert.equal(saved.completedSetsCount, 1)
  assert.equal(saved.exercises[0].sets[0].actualReps, 8)
  assert.equal(saved.exercises[0].bodyRegion, 'lower')
  assert.deepEqual(saved.exercises[0].muscleTargets, [
    { muscleId: 'quads', percent: 0.6 },
    { muscleId: 'glutes', percent: 0.4 },
  ])
  assert.deepEqual(saved.settings, {
    defaultRestSeconds: 180,
    autoProgressEnabled: true,
    keepAwake: true,
    adjustEffortAfterSet: false,
  })
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.table === 'workout_sessions'), true)
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.table === 'workout_session_sets'), true)
  assert.equal(calls.some((call) => call.table === 'workout_sessions' && call.body?.default_rest_seconds === 180 && call.body?.auto_progress_enabled === true && call.body?.keep_awake === true && call.body?.adjust_effort_after_set === false), true)

  const loaded = await db.getWorkoutSessionById('ws-1')
  assert.deepEqual(loaded.settings, {
    defaultRestSeconds: 180,
    autoProgressEnabled: true,
    keepAwake: true,
    adjustEffortAfterSet: false,
  })
})

test('createSupabaseRestSessionDb falls back to POST when child PATCH targets no longer match persisted session rows', async () => {
  const calls = []
  const rows = {
    workoutSession: null,
    workoutSessionExercises: [],
    workoutSessionSets: [],
  }

  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ method, table, body, query: Object.fromEntries(parsedUrl.searchParams.entries()) })

    if (table === 'workout_sessions' && method === 'POST') {
      rows.workoutSession = { id: 'ws-1', ...body }
      return createJsonResponse([rows.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'POST') {
      rows.workoutSessionExercises = [{ id: 'wse-1', ...body }]
      return createJsonResponse(rows.workoutSessionExercises)
    }

    if (table === 'workout_session_sets' && method === 'POST') {
      rows.workoutSessionSets = [{ id: 'wss-1', ...body }]
      return createJsonResponse(rows.workoutSessionSets)
    }

    if (table === 'workout_sessions' && method === 'PATCH') {
      rows.workoutSession = { ...rows.workoutSession, ...body }
      return createJsonResponse([rows.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'PATCH') {
      return createJsonResponse([])
    }

    if (table === 'workout_session_sets' && method === 'PATCH') {
      return createJsonResponse([])
    }

    if (table === 'workout_sessions' && method === 'GET') {
      return createJsonResponse(rows.workoutSession ? [rows.workoutSession] : [])
    }

    if (table === 'workout_session_exercises' && method === 'GET') {
      return createJsonResponse(rows.workoutSessionExercises)
    }

    if (table === 'workout_session_sets' && method === 'GET') {
      return createJsonResponse(rows.workoutSessionSets)
    }

    throw new Error(`Unhandled request: ${method} ${table}`)
  }

  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const inserted = await db.insertWorkoutSession({
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'prog-1',
    programDayId: 'day-1',
    programWorkoutId: 'pw-1',
    workoutTemplateId: 'tpl-1',
    nameSnapshot: 'Lower B',
    status: 'in_progress',
    startedAt: '2026-04-21T20:00:00.000Z',
    completedAt: null,
    elapsedSeconds: 0,
    notes: '',
    perceivedDifficulty: null,
    settings: {
      defaultRestSeconds: 180,
      autoProgressEnabled: true,
      keepAwake: true,
      adjustEffortAfterSet: false,
    },
    totalExercisesCount: 1,
    completedExercisesCount: 0,
    totalSetsCount: 1,
    completedSetsCount: 0,
    exercises: [
      {
        programWorkoutExerciseId: 'pwe-1',
        exerciseId: 'ex-1',
        nameSnapshot: 'Front Squat',
        sortOrder: 1,
        status: 'not_started',
        notes: 'Stay tall',
        defaultRestSeconds: 120,
        bodyRegion: 'lower',
        muscleTargets: [
          { muscleId: 'quads', percent: 0.6 },
          { muscleId: 'glutes', percent: 0.4 },
        ],
        sets: [
          {
            programWorkoutSetId: 'pws-1',
            sortOrder: 1,
            setType: 'straight',
            prescribedReps: 8,
            prescribedLoad: 135,
            prescribedLoadUnit: 'lb',
            prescribedRpe: 7,
            prescribedRir: 3,
            prescribedRestSeconds: 120,
            isCompleted: false,
            notes: 'Smooth reps',
          },
        ],
      },
    ],
  })

  const saved = await db.saveWorkoutSession({
    ...inserted,
    exercises: [
      {
        ...inserted.exercises[0],
        id: 'wse-missing',
        sets: [
          {
            ...inserted.exercises[0].sets[0],
            id: 'wss-missing',
            actualReps: 8,
            isCompleted: true,
          },
        ],
      },
    ],
  })

  assert.equal(saved.exercises.length, 1)
  assert.equal(saved.exercises[0].id, 'wse-1')
  assert.equal(saved.exercises[0].sets[0].id, 'wss-1')
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.table === 'workout_session_exercises'), true)
  assert.equal(calls.some((call) => call.method === 'POST' && call.table === 'workout_session_exercises'), true)
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.table === 'workout_session_sets'), true)
  assert.equal(calls.some((call) => call.method === 'POST' && call.table === 'workout_session_sets'), true)
})

test('createSupabaseRestSessionDb hydrates nested execution rows through Supabase REST', async () => {
  const { fetchImpl } = createSupabaseFetchStub()
  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const session = await db.getWorkoutSessionById('ws-1')

  assert.equal(session.id, 'ws-1')
  assert.equal(session.exercises.length, 1)
  assert.equal(session.exercises[0].sets[0].programWorkoutSetId, 'pws-1')
  assert.equal(session.exercises[0].bodyRegion, 'lower')
  assert.deepEqual(session.exercises[0].muscleTargets, [
    { muscleId: 'quads', subMuscleId: null, percent: 0.6 },
    { muscleId: 'glutes', subMuscleId: null, percent: 0.4 },
  ])
  assert.deepEqual(session.settings, {
    defaultRestSeconds: 180,
    autoProgressEnabled: true,
    keepAwake: true,
    adjustEffortAfterSet: false,
  })
})

test('createSupabaseRestSessionDb refreshes an expired auth token and retries a completed finish save', async () => {
  const calls = []
  const rows = {
    workoutSession: {
      id: 'ws-finish-1',
      athlete_id: 'ath-1',
      coach_id: 'coach-1',
      program_id: 'prog-1',
      program_day_id: 'day-1',
      program_workout_id: 'pw-1',
      workout_template_id: 'tpl-1',
      name_snapshot: 'Workout 1',
      status: 'in_progress',
      started_at: '2026-04-21T20:00:00.000Z',
      completed_at: null,
      elapsed_seconds: 0,
      notes: '',
      perceived_difficulty: null,
      total_exercises_count: 1,
      completed_exercises_count: 0,
      total_sets_count: 1,
      completed_sets_count: 0,
    },
    workoutSessionExercises: [
      {
        id: 'wse-finish-1',
        workout_session_id: 'ws-finish-1',
        program_workout_exercise_id: 'pwe-1',
        exercise_id: 'ex-1',
        name_snapshot: 'Front Squat',
        sort_order: 1,
        status: 'completed',
        notes: '',
        default_rest_seconds: 120,
      },
    ],
    workoutSessionSets: [
      {
        id: 'wss-finish-1',
        workout_session_exercise_id: 'wse-finish-1',
        program_workout_set_id: 'pws-1',
        sort_order: 1,
        set_type: 'straight',
        prescribed_reps: 8,
        prescribed_load: 135,
        prescribed_load_unit: 'lb',
        prescribed_duration_seconds: null,
        prescribed_distance: null,
        prescribed_distance_unit: null,
        prescribed_rpe: 7,
        prescribed_rir: 3,
        prescribed_rest_seconds: 120,
        actual_reps: 8,
        actual_load: 135,
        actual_load_unit: 'lb',
        actual_duration_seconds: null,
        actual_distance: null,
        actual_distance_unit: null,
        actual_rpe: 8,
        actual_rir: 2,
        actual_rest_seconds: 120,
        completed_at: '2026-04-21T20:45:00.000Z',
        is_completed: true,
        notes: '',
      },
    ],
  }

  let currentAccessToken = 'expired-token'
  let refreshCalls = 0
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const method = options.method || 'GET'
    const authHeader = options.headers?.Authorization || ''
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ method, table, authHeader, body })

    if (authHeader === 'Bearer expired-token') {
      return new Response(JSON.stringify({ message: 'JWT expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (table === 'workout_sessions' && method === 'PATCH') {
      rows.workoutSession = { ...rows.workoutSession, ...body }
      return new Response(JSON.stringify([rows.workoutSession]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (table === 'workout_session_exercises' && method === 'PATCH') {
      rows.workoutSessionExercises = rows.workoutSessionExercises.map((row) => ({ ...row, ...body }))
      return new Response(JSON.stringify(rows.workoutSessionExercises), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (table === 'workout_session_sets' && method === 'PATCH') {
      rows.workoutSessionSets = rows.workoutSessionSets.map((row) => ({ ...row, ...body }))
      return new Response(JSON.stringify(rows.workoutSessionSets), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (table === 'exercise_details') {
      return new Response(JSON.stringify([{ id: 'ex-1', body_region: 'lower' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (table === 'exercise_muscle_maps' || table === 'exercise_sub_muscle_maps') {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unhandled request: ${method} ${table}`)
  }

  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: () => currentAccessToken,
    async refreshAccessToken() {
      refreshCalls += 1
      currentAccessToken = 'fresh-token'
      return currentAccessToken
    },
    fetchImpl,
  })

  const saved = await db.saveWorkoutSession({
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'prog-1',
    programDayId: 'day-1',
    programWorkoutId: 'pw-1',
    workoutTemplateId: 'tpl-1',
    id: 'ws-finish-1',
    nameSnapshot: 'Workout 1',
    status: 'completed',
    startedAt: '2026-04-21T20:00:00.000Z',
    completedAt: '2026-04-21T20:45:00.000Z',
    elapsedSeconds: 2700,
    notes: '',
    perceivedDifficulty: 7,
    totalExercisesCount: 1,
    completedExercisesCount: 1,
    totalSetsCount: 1,
    completedSetsCount: 1,
    exercises: [
      {
        id: 'wse-finish-1',
        programWorkoutExerciseId: 'pwe-1',
        exerciseId: 'ex-1',
        nameSnapshot: 'Front Squat',
        sortOrder: 1,
        status: 'completed',
        notes: '',
        defaultRestSeconds: 120,
        sets: [
          {
            id: 'wss-finish-1',
            programWorkoutSetId: 'pws-1',
            sortOrder: 1,
            setType: 'straight',
            prescribedReps: 8,
            prescribedLoad: 135,
            prescribedLoadUnit: 'lb',
            prescribedRestSeconds: 120,
            actualReps: 8,
            actualLoad: 135,
            actualLoadUnit: 'lb',
            actualRpe: 8,
            actualRir: 2,
            actualRestSeconds: 120,
            completedAt: '2026-04-21T20:45:00.000Z',
            isCompleted: true,
            notes: '',
          },
        ],
      },
    ],
  })

  assert.equal(refreshCalls, 1)
  assert.equal(saved.status, 'completed')
  assert.equal(saved.completedAt, '2026-04-21T20:45:00.000Z')
  assert.equal(calls.some((call) => call.authHeader === 'Bearer expired-token'), true)
  assert.equal(calls.some((call) => call.authHeader === 'Bearer fresh-token' && call.table === 'workout_sessions' && call.method === 'PATCH'), true)
})
