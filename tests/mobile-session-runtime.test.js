import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createDemoProgramWorkout,
  createTrainDemoState,
  createTrainSessionStore,
} from '../apps/mobile/src/train/index.js'
import {
  appendSessionExercises,
  advanceSessionAfterRestTimerExpiry,
  completeWorkoutSet,
  finishWorkoutSession,
  discardWorkoutSession,
  moveSessionExercise,
  removeSessionExercise,
  createSessionSuperset,
  removeSessionSuperset,
} from '../packages/core/src/index.js'
import {
  createSupabaseMobileDataClient,
  createSupabaseMobileIdentityClient,
  createMemorySessionSettingsStorage,
  resolveCurrentAthleteProfile,
  resolveTrainSessionDb,
} from '../apps/mobile/src/train/session-runtime.js'
import { createSupabaseRestSessionDb } from '../packages/data/src/sessions/index.js'

function createRemoteFetchStub() {
  const calls = []
  const state = {
    athleteProfile: {
      id: 'ath-1',
      user_id: 'user-1',
      coach_id: 'coach-1',
      first_name: 'Tony',
      last_name: 'F',
      status: 'active',
      units_preference: 'imperial',
    },
    todayDay: { id: 'program-day-21', date: '2026-04-21' },
    programWorkout: {
      id: 'pw-lower-a',
      athlete_id: 'ath-1',
      coach_id: 'coach-1',
      program_id: 'program-spring-26',
      program_day_id: 'program-day-21',
      workout_template_id: 'template-lower-a',
      name_snapshot: 'Lower A',
      status: 'planned',
      sort_order: 1,
    },
    programWorkoutExercises: [
      {
        id: 'pwe-squat',
        program_workout_id: 'pw-lower-a',
        exercise_id: 'exercise-squat',
        name_snapshot: 'Barbell Back Squat',
        sort_order: 1,
        notes: 'Brace and move fast',
        default_rest_seconds: 180,
      },
    ],
    programWorkoutSets: [
      {
        id: 'pws-squat-1',
        program_workout_exercise_id: 'pwe-squat',
        sort_order: 1,
        set_type: 'straight',
        target_reps: 8,
        target_load: 120,
        target_load_unit: 'lb',
        target_duration_seconds: null,
        target_distance: null,
        target_distance_unit: null,
        target_rpe: 6,
        target_rir: null,
        target_rest_seconds: 180,
        notes: '',
      },
    ],
    workoutSession: null,
    workoutSessionExercises: [],
    workoutSessionSets: [],
  }

  const fetchImpl = async (url, options = {}) => {
    const method = options.method || 'GET'
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ method, table, path: parsedUrl.pathname, query: parsedUrl.search, body })

    if (parsedUrl.pathname === '/auth/v1/user') {
      return json({ id: 'user-1', email: 'athlete@example.com', user_metadata: { role: 'athlete' } })
    }

    if (table === 'athlete_profiles') {
      return json([state.athleteProfile])
    }

    if (table === 'program_days') {
      return json([state.todayDay])
    }

    if (table === 'program_workouts' && method === 'GET') {
      return json([state.programWorkout])
    }
    if (table === 'program_workout_exercises' && method === 'GET') return json(state.programWorkoutExercises)
    if (table === 'program_workout_sets' && method === 'GET') return json(state.programWorkoutSets)

    if (table === 'workout_sessions' && method === 'POST') {
      state.workoutSession = { id: 'ws-remote-1', ...body }
      return json([state.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'POST') {
      const nextRow = { id: `wse-remote-${state.workoutSessionExercises.length + 1}`, ...body }
      state.workoutSessionExercises = [...state.workoutSessionExercises, nextRow]
      return json([nextRow])
    }

    if (table === 'workout_session_sets' && method === 'POST') {
      const nextRow = { id: `wss-remote-${state.workoutSessionSets.length + 1}`, ...body }
      state.workoutSessionSets = [...state.workoutSessionSets, nextRow]
      return json([nextRow])
    }

    if (table === 'workout_sessions' && method === 'PATCH') {
      state.workoutSession = { ...state.workoutSession, ...body }
      return json([state.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'PATCH') {
      state.workoutSessionExercises = state.workoutSessionExercises.map((row) => ({ ...row, ...body }))
      return json(state.workoutSessionExercises)
    }

    if (table === 'workout_session_sets' && method === 'PATCH') {
      state.workoutSessionSets = state.workoutSessionSets.map((row) => ({ ...row, ...body }))
      return json(state.workoutSessionSets)
    }

    if (table === 'workout_session_exercises' && method === 'DELETE') {
      const targetId = parsedUrl.searchParams.get('id')?.replace(/^eq\./, '') || null
      state.workoutSessionExercises = state.workoutSessionExercises.filter((row) => row.id !== targetId)
      state.workoutSessionSets = state.workoutSessionSets.filter((row) => row.workout_session_exercise_id !== targetId)
      return json([])
    }

    if (table === 'workout_session_sets' && method === 'DELETE') {
      const targetId = parsedUrl.searchParams.get('id')?.replace(/^eq\./, '') || null
      state.workoutSessionSets = state.workoutSessionSets.filter((row) => row.id !== targetId)
      return json([])
    }

    if (table === 'workout_sessions' && method === 'GET') return json(state.workoutSession ? [state.workoutSession] : [])
    if (table === 'workout_session_exercises' && method === 'GET') return json(state.workoutSessionExercises)
    if (table === 'workout_session_sets' && method === 'GET') return json(state.workoutSessionSets)

    throw new Error(`Unexpected remote call: ${method} ${table}`)
  }

  return { fetchImpl, calls, state }
}

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

test('appendSessionExercises appends selected exercises with linked default sets and inherited rest fallbacks', () => {
  const session = createDemoProgramWorkout()
  const nextSession = appendSessionExercises({
    ...session,
    settings: { defaultRestSeconds: 90 },
    exercises: session.exercises,
  }, [
    {
      id: 'exercise-new-1',
      name: 'Cable Rear Delt Fly',
      thumbnailUrl: null,
      defaultRestSeconds: 75,
      sets: [
        { sortOrder: 1, setType: 'straight', targetReps: 12, targetLoad: 20, targetLoadUnit: 'lb', targetRpe: 7, targetRestSeconds: 75 },
        { sortOrder: 2, setType: 'straight', targetReps: 12, targetLoad: 20, targetLoadUnit: 'lb', targetRpe: 8, targetRestSeconds: 75 },
      ],
    },
    {
      id: 'exercise-new-2',
      name: 'Barbell Bent-Over Row',
      thumbnailUrl: null,
      sets: [
        { sortOrder: 1, setType: 'straight', targetReps: 8, targetLoad: 135, targetLoadUnit: 'lb', targetRpe: 8 },
      ],
    },
  ], { defaultRestSeconds: 90 })

  assert.equal(nextSession.exercises.length, session.exercises.length + 2)
  assert.equal(nextSession.exercises.at(-2).nameSnapshot, 'Cable Rear Delt Fly')
  assert.equal(nextSession.exercises.at(-2).thumbnailUrl, null)
  assert.equal(nextSession.exercises.at(-2).defaultRestSeconds, 75)
  assert.equal(nextSession.exercises.at(-2).sets.length, 2)
  assert.equal(nextSession.exercises.at(-2).sets[0].prescribedReps, 12)
  assert.equal(nextSession.exercises.at(-2).sets[0].prescribedLoad, 20)
  assert.equal(nextSession.exercises.at(-2).sets[0].prescribedRestSeconds, 75)
  assert.match(nextSession.exercises.at(-2).sets[0].id, /^local-session-set-/)
  assert.equal(nextSession.exercises.at(-1).nameSnapshot, 'Barbell Bent-Over Row')
  assert.equal(nextSession.exercises.at(-1).defaultRestSeconds, 90)
  assert.equal(nextSession.exercises.at(-1).sets.length, 1)
  assert.equal(nextSession.exercises.at(-1).sets[0].prescribedReps, 8)
  assert.equal(nextSession.exercises.at(-1).sets[0].prescribedRestSeconds, 90)
})

test('moveSessionExercise reorders live session exercises and resequences sort order', () => {
  const session = createDemoProgramWorkout()
  const movedSession = moveSessionExercise(session, session.exercises[1].id, 'up')

  assert.equal(movedSession.exercises[0].id, session.exercises[1].id)
  assert.equal(movedSession.exercises[1].id, session.exercises[0].id)
  assert.equal(movedSession.exercises[0].sortOrder, 1)
  assert.equal(movedSession.exercises[1].sortOrder, 2)
  assert.equal(moveSessionExercise(session, session.exercises[0].id, 'up'), session)
})

test('removeSessionSuperset clears the selected live superset group', () => {
  const session = createDemoProgramWorkout()
  const linkedSession = createSessionSuperset(session, session.exercises[0].id, session.exercises[1].id)
  const nextSession = removeSessionSuperset(linkedSession, session.exercises[0].id)

  assert.equal(nextSession.exercises[0].supersetGroupId, null)
  assert.equal(nextSession.exercises[0].supersetOrder, null)
  assert.equal(nextSession.exercises[1].supersetGroupId, null)
  assert.equal(nextSession.exercises[1].supersetOrder, null)
  assert.equal(removeSessionSuperset(session, session.exercises[0].id), session)
  assert.equal(removeSessionSuperset(linkedSession, 'missing-exercise'), linkedSession)
})

test('createSessionSuperset links two live session exercises without changing exercise order', () => {
  const session = createDemoProgramWorkout()
  const sourceExerciseId = session.exercises[0].id
  const targetExerciseId = session.exercises[1].id

  const nextSession = createSessionSuperset(session, sourceExerciseId, targetExerciseId)

  assert.equal(nextSession.exercises[0].id, sourceExerciseId)
  assert.equal(nextSession.exercises[1].id, targetExerciseId)
  assert.equal(nextSession.exercises[0].sortOrder, session.exercises[0].sortOrder)
  assert.equal(nextSession.exercises[1].sortOrder, session.exercises[1].sortOrder)
  assert.match(nextSession.exercises[0].supersetGroupId, /^local-superset-/)
  assert.equal(nextSession.exercises[1].supersetGroupId, nextSession.exercises[0].supersetGroupId)
  assert.equal(nextSession.exercises[0].supersetOrder, 1)
  assert.equal(nextSession.exercises[1].supersetOrder, 2)
  assert.equal(createSessionSuperset(session, sourceExerciseId, 'missing-exercise'), session)
  assert.equal(createSessionSuperset(session, sourceExerciseId, sourceExerciseId), session)
})

test('createTrainSessionStore persists appended local exercises with seeded default sets through the remote mobile data client', async () => {
  const { fetchImpl, calls } = createRemoteFetchStub()
  const store = createTrainSessionStore({
    programWorkout: createDemoProgramWorkout(),
    dataClient: createSupabaseMobileDataClient({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
      fetchImpl,
    }),
  })

  const { session } = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })
  const nextSession = appendSessionExercises(session, [
    {
      id: 'exercise-new-1',
      name: '1-Arm DB Row',
      defaultRestSeconds: 60,
      sets: [
        { sortOrder: 1, setType: 'straight', targetReps: 4, targetRestSeconds: 60 },
        { sortOrder: 2, setType: 'straight', targetReps: 4, targetRestSeconds: 60 },
      ],
    },
  ], { defaultRestSeconds: 90 })

  const savedSession = await store.saveSession(nextSession)
  const appendedExercise = savedSession.exercises.at(-1)
  const resumedSession = await store.resumeSession(savedSession.id)
  const resumedExercise = resumedSession.exercises.find((exercise) => exercise.exerciseId === 'exercise-new-1')

  assert.ok(appendedExercise)
  assert.equal(appendedExercise.id.startsWith('wse-remote-'), true)
  assert.equal(appendedExercise.defaultRestSeconds, 60)
  assert.equal(appendedExercise.sets.length, 2)
  assert.equal(appendedExercise.sets[0].id.startsWith('wss-remote-'), true)
  assert.equal(appendedExercise.sets[0].prescribedReps, 4)
  assert.equal(appendedExercise.sets[1].id.startsWith('wss-remote-'), true)
  assert.equal(resumedExercise?.id.startsWith('wse-remote-'), true)
  assert.equal(resumedExercise?.sets.length, 2)
  assert.equal(resumedExercise?.sets[0].prescribedReps, 4)
  assert.equal(calls.some((call) => call.method === 'POST' && call.table === 'workout_session_exercises' && call.body?.exercise_id === 'exercise-new-1'), true)
  assert.equal(calls.filter((call) => call.method === 'POST' && call.table === 'workout_session_sets' && String(call.body?.workout_session_exercise_id || '').startsWith('wse-remote-')).length >= 2, true)
})

test('createTrainSessionStore starts a live session from the planned program workout via the repository', async () => {
  const programWorkout = createDemoProgramWorkout()
  const store = createTrainSessionStore({ programWorkout })

  assert.equal(store.getCurrentSessionId(), null)

  const result = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })

  assert.equal(result.programWorkoutId, programWorkout.id)
  assert.equal(result.session.programWorkoutId, programWorkout.id)
  assert.equal(result.session.id, 'pw-lower-a')
  assert.equal(store.getCurrentSessionId(), 'pw-lower-a')

  const resumedSession = await store.resumeSession(result.session.id)
  assert.equal(resumedSession.id, result.session.id)
  assert.equal(resumedSession.totalSetsCount, 7)
})

test('createTrainSessionStore reuses an existing in-progress remote session for the same workout', async () => {
  const programWorkout = createDemoProgramWorkout()
  const existingSession = {
    id: 'ws-existing-remote',
    athleteId: programWorkout.athleteId,
    coachId: programWorkout.coachId,
    programId: programWorkout.programId,
    programDayId: programWorkout.programDayId,
    programWorkoutId: programWorkout.id,
    workoutTemplateId: programWorkout.workoutTemplateId,
    nameSnapshot: programWorkout.nameSnapshot,
    status: 'in_progress',
    startedAt: '2026-04-21T19:55:00.000Z',
    completedAt: null,
    elapsedSeconds: 300,
    notes: '',
    perceivedDifficulty: null,
    totalExercisesCount: 1,
    completedExercisesCount: 0,
    totalSetsCount: 1,
    completedSetsCount: 0,
    exercises: [{
      id: 'wse-existing-1',
      programWorkoutExerciseId: 'pwe-squat',
      exerciseId: 'exercise-squat',
      nameSnapshot: 'Barbell Back Squat',
      sortOrder: 1,
      status: 'not_started',
      notes: '',
      defaultRestSeconds: 180,
      sets: [{
        id: 'wss-existing-1',
        programWorkoutSetId: 'pws-squat-1',
        sortOrder: 1,
        setType: 'straight',
        prescribedReps: 8,
        prescribedLoad: 120,
        prescribedLoadUnit: 'lb',
        prescribedDurationSeconds: null,
        prescribedDistance: null,
        prescribedDistanceUnit: null,
        prescribedRpe: 6,
        prescribedRir: null,
        prescribedRestSeconds: 180,
        actualReps: null,
        actualLoad: null,
        actualLoadUnit: null,
        actualDurationSeconds: null,
        actualDistance: null,
        actualDistanceUnit: null,
        actualRpe: null,
        actualRir: null,
        actualRestSeconds: null,
        completedAt: null,
        isCompleted: false,
        notes: '',
      }],
    }],
  }
  let insertCalls = 0
  const store = createTrainSessionStore({
    programWorkout,
    dataClient: {
      async getProgramWorkoutById(programWorkoutId) {
        return programWorkoutId === programWorkout.id ? programWorkout : null
      },
      async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
        return programWorkoutId === programWorkout.id ? existingSession : null
      },
      async insertWorkoutSession() {
        insertCalls += 1
        return { id: 'ws-should-not-create' }
      },
      async getWorkoutSessionById(sessionId) {
        return sessionId === existingSession.id ? existingSession : null
      },
    },
  })

  const bootHydrated = await store.syncCurrentSession({ programWorkoutId: programWorkout.id })
  assert.equal(bootHydrated.id, existingSession.id)
  assert.equal(store.getCurrentSessionId(), existingSession.id)

  const result = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })

  assert.equal(insertCalls, 0)
  assert.equal(result.session.id, existingSession.id)
  assert.equal(store.getCurrentSessionId(), existingSession.id)
})

test('createTrainSessionStore can force a fresh same-workout session instead of silently reusing a stale remote in-progress row', async () => {
  const programWorkout = createDemoProgramWorkout()
  const existingSession = {
    id: 'ws-existing-remote',
    athleteId: programWorkout.athleteId,
    coachId: programWorkout.coachId,
    programId: programWorkout.programId,
    programDayId: programWorkout.programDayId,
    programWorkoutId: programWorkout.id,
    workoutTemplateId: programWorkout.workoutTemplateId,
    nameSnapshot: programWorkout.nameSnapshot,
    status: 'in_progress',
    startedAt: '2026-04-17T14:00:00.000Z',
    completedAt: null,
    elapsedSeconds: 0,
    notes: '',
    perceivedDifficulty: null,
    totalExercisesCount: 1,
    completedExercisesCount: 0,
    totalSetsCount: 1,
    completedSetsCount: 0,
    exercises: [{
      id: 'wse-existing-1',
      programWorkoutExerciseId: 'pwe-squat',
      exerciseId: 'exercise-squat',
      nameSnapshot: 'Barbell Back Squat',
      sortOrder: 1,
      status: 'not_started',
      notes: '',
      defaultRestSeconds: 180,
      sets: [{ id: 'wss-existing-1', programWorkoutSetId: 'pws-squat-1', sortOrder: 1, setType: 'straight', prescribedReps: 8, prescribedLoad: 120, prescribedLoadUnit: 'lb', prescribedDurationSeconds: null, prescribedDistance: null, prescribedDistanceUnit: null, prescribedRpe: 6, prescribedRir: null, prescribedRestSeconds: 180, actualReps: null, actualLoad: null, actualLoadUnit: null, actualDurationSeconds: null, actualDistance: null, actualDistanceUnit: null, actualRpe: null, actualRir: null, actualRestSeconds: null, completedAt: null, isCompleted: false, notes: '' }],
    }],
  }
  const savedSessions = []
  let insertCalls = 0
  const store = createTrainSessionStore({
    programWorkout,
    dataClient: {
      async getProgramWorkoutById(programWorkoutId) {
        return programWorkoutId === programWorkout.id ? programWorkout : null
      },
      async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
        return programWorkoutId === programWorkout.id ? existingSession : null
      },
      async saveWorkoutSession(session) {
        savedSessions.push(session)
        return session
      },
      async insertWorkoutSession(session) {
        insertCalls += 1
        return { ...session, id: 'ws-fresh-remote' }
      },
      async getWorkoutSessionById(sessionId) {
        return sessionId === existingSession.id ? existingSession : null
      },
    },
  })

  const result = await store.startSession({
    startedAt: '2026-04-21T20:00:00.000Z',
    forceNewSession: true,
  })

  assert.equal(insertCalls, 1)
  assert.equal(savedSessions.length, 1)
  assert.equal(savedSessions[0].id, existingSession.id)
  assert.equal(savedSessions[0].status, 'discarded')
  assert.equal(result.session.id, 'ws-fresh-remote')
  assert.equal(result.session.startedAt, '2026-04-21T20:00:00.000Z')
  assert.equal(store.getCurrentSessionId(), 'ws-fresh-remote')
})

test('createTrainSessionStore syncCurrentSession can restore an athlete in-progress session when the currently resolved planned workout id is wrong', async () => {
  const seededPlannedWorkout = {
    id: 'pw-planned-today',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-today',
    workoutTemplateId: 'template-1',
    nameSnapshot: 'Workout 1',
    exercises: [],
  }
  const activeWorkout = {
    id: 'pw-active-real',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-active',
    workoutTemplateId: 'template-2',
    nameSnapshot: 'Workout Active',
    exercises: [
      {
        id: 'pwe-active-1',
        exerciseId: 'exercise-1',
        nameSnapshot: 'Split Squat',
        sortOrder: 1,
        defaultRestSeconds: 120,
        sets: [
          { id: 'pws-active-1', sortOrder: 1, setType: 'straight', targetReps: 8, targetLoad: null, targetLoadUnit: null, targetRpe: 7, targetRestSeconds: 120 },
        ],
      },
    ],
  }
  const persistedActiveSession = {
    id: 'ws-active-1',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-active',
    programWorkoutId: 'pw-active-real',
    workoutTemplateId: 'template-2',
    nameSnapshot: 'Workout Active',
    status: 'in_progress',
    startedAt: '2026-04-21T20:00:00.000Z',
    completedAt: null,
    elapsedSeconds: 95,
    notes: '',
    perceivedDifficulty: null,
    totalExercisesCount: 1,
    completedExercisesCount: 0,
    totalSetsCount: 1,
    completedSetsCount: 0,
    exercises: [],
  }

  const calls = []
  const store = createTrainSessionStore({
    programWorkout: seededPlannedWorkout,
    dataClient: {
      async getProgramWorkoutById(programWorkoutId) {
        calls.push(['getProgramWorkoutById', programWorkoutId])
        if (programWorkoutId === 'pw-planned-today') return seededPlannedWorkout
        if (programWorkoutId === 'pw-active-real') return activeWorkout
        return null
      },
      async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
        calls.push(['getInProgressSessionByProgramWorkoutId', programWorkoutId])
        return null
      },
      async getInProgressSessionByAthleteId(athleteId) {
        calls.push(['getInProgressSessionByAthleteId', athleteId])
        return athleteId === 'ath-1' ? persistedActiveSession : null
      },
      async getWorkoutSessionById(sessionId) {
        calls.push(['getWorkoutSessionById', sessionId])
        return sessionId === 'ws-active-1' ? persistedActiveSession : null
      },
    },
  })

  const hydrated = await store.syncCurrentSession({ programWorkoutId: 'pw-planned-today' })

  assert.equal(hydrated.id, 'ws-active-1')
  assert.equal(hydrated.programWorkoutId, 'pw-active-real')
  assert.equal(hydrated.status, 'in_progress')
  assert.equal(hydrated.exercises.length, 1)
  assert.deepEqual(calls, [
    ['getProgramWorkoutById', 'pw-planned-today'],
    ['getInProgressSessionByProgramWorkoutId', 'pw-planned-today'],
    ['getInProgressSessionByAthleteId', 'ath-1'],
    ['getProgramWorkoutById', 'pw-active-real'],
  ])
})

test('createTrainSessionStore can start a session for a selected planned workout id instead of only the seeded today workout', async () => {
  const selectedProgramWorkout = {
    id: 'pw-upper-b',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-spring-26',
    programDayId: 'program-day-23',
    workoutTemplateId: 'template-upper-b',
    nameSnapshot: 'Upper B',
    exercises: [
      {
        id: 'pwe-bench',
        exerciseId: 'exercise-bench',
        nameSnapshot: 'Bench Press',
        sortOrder: 1,
        defaultRestSeconds: 150,
        sets: [
          { id: 'pws-bench-1', sortOrder: 1, setType: 'straight', targetReps: 5, targetLoad: 135, targetLoadUnit: 'lb', targetRpe: 7, targetRestSeconds: 150 },
        ],
      },
    ],
  }

  const store = createTrainSessionStore({
    programWorkout: createDemoProgramWorkout(),
    dataClient: {
      async getProgramWorkoutById(programWorkoutId) {
        return programWorkoutId === 'pw-upper-b' ? selectedProgramWorkout : null
      },
    },
  })

  const result = await store.startSession({ startedAt: '2026-04-23T20:00:00.000Z', programWorkoutId: 'pw-upper-b' })

  assert.equal(result.programWorkoutId, 'pw-upper-b')
  assert.equal(result.session.programWorkoutId, 'pw-upper-b')
  assert.equal(result.session.nameSnapshot, 'Upper B')
  assert.equal(result.session.exercises[0].nameSnapshot, 'Bench Press')
  assert.equal(result.session.exercises[0].sets[0].programWorkoutSetId, 'pws-bench-1')
})

test('createTrainSessionStore refetches a matching program workout when the seeded workout is thin', async () => {
  const seededThinWorkout = {
    id: 'pw-upper-b',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-spring-26',
    programDayId: 'program-day-23',
    workoutTemplateId: 'template-upper-b',
    nameSnapshot: 'Upper B',
    exercises: [],
  }
  const selectedProgramWorkout = {
    ...seededThinWorkout,
    exercises: [
      {
        id: 'pwe-bench',
        exerciseId: 'exercise-bench',
        nameSnapshot: 'Bench Press',
        sortOrder: 1,
        defaultRestSeconds: 150,
        sets: [
          { id: 'pws-bench-1', sortOrder: 1, setType: 'straight', targetReps: 5, targetLoad: 135, targetLoadUnit: 'lb', targetRpe: 7, targetRestSeconds: 150 },
        ],
      },
    ],
  }
  let fetchCalls = 0

  const store = createTrainSessionStore({
    programWorkout: seededThinWorkout,
    dataClient: {
      async getProgramWorkoutById(programWorkoutId) {
        fetchCalls += 1
        return programWorkoutId === 'pw-upper-b' ? selectedProgramWorkout : null
      },
    },
  })

  const result = await store.startSession({ startedAt: '2026-04-23T20:00:00.000Z', programWorkoutId: 'pw-upper-b' })

  assert.equal(fetchCalls >= 1, true)
  assert.equal(result.session.programWorkoutId, 'pw-upper-b')
  assert.equal(result.session.exercises.length, 1)
  assert.equal(result.session.exercises[0].nameSnapshot, 'Bench Press')
  assert.equal(result.session.exercises[0].sets.length, 1)
  assert.equal(result.session.totalExercisesCount, 1)
  assert.equal(result.session.totalSetsCount, 1)
})

test('createTrainSessionStore rehydrates an empty resumed in-progress session from the rich program workout', async () => {
  const richProgramWorkout = createDemoProgramWorkout()
  const emptyRemoteSession = {
    id: 'ws-empty-1',
    athleteId: richProgramWorkout.athleteId,
    coachId: richProgramWorkout.coachId,
    programId: richProgramWorkout.programId,
    programDayId: richProgramWorkout.programDayId,
    programWorkoutId: richProgramWorkout.id,
    workoutTemplateId: richProgramWorkout.workoutTemplateId,
    nameSnapshot: richProgramWorkout.nameSnapshot,
    status: 'in_progress',
    startedAt: '2026-04-21T20:00:00.000Z',
    completedAt: null,
    elapsedSeconds: 120,
    notes: '',
    perceivedDifficulty: null,
    totalExercisesCount: 0,
    completedExercisesCount: 0,
    totalSetsCount: 0,
    completedSetsCount: 0,
    exercises: [],
  }

  const store = createTrainSessionStore({
    programWorkout: richProgramWorkout,
    dataClient: {
      async getProgramWorkoutById(programWorkoutId) {
        return programWorkoutId === richProgramWorkout.id ? richProgramWorkout : null
      },
      async getWorkoutSessionById(sessionId) {
        return sessionId === 'ws-empty-1' ? emptyRemoteSession : null
      },
    },
  })

  const resumedSession = await store.resumeSession('ws-empty-1')

  assert.equal(resumedSession.id, 'ws-empty-1')
  assert.equal(resumedSession.programWorkoutId, richProgramWorkout.id)
  assert.equal(resumedSession.exercises.length, richProgramWorkout.exercises.length)
  assert.equal(resumedSession.totalExercisesCount, richProgramWorkout.exercises.length)
  assert.equal(resumedSession.totalSetsCount > 0, true)
})

test('createTrainSessionStore seeds resumable preview sessions for active simulator states', async () => {
  const trainState = createTrainDemoState({ previewState: 'active' })
  const store = createTrainSessionStore({
    programWorkout: trainState.programWorkout,
    initialSession: trainState.session,
  })

  const seededSession = store.getCurrentSession()
  assert.equal(seededSession.id, 'pw-lower-a')
  assert.equal(seededSession.completedSetsCount, 1)

  const resumedSession = await store.resumeSession(seededSession.id)
  assert.equal(resumedSession.completedSetsCount, 1)
  assert.equal(resumedSession.id, seededSession.id)
})

test('createTrainSessionStore persists in-app session mutations for later resume', async () => {
  const programWorkout = createDemoProgramWorkout()
  const store = createTrainSessionStore({ programWorkout })
  const { session } = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })

  const updatedSession = completeWorkoutSet({
    session,
    exerciseId: session.exercises[0].id,
    setId: session.exercises[0].sets[0].id,
  })

  const savedSession = await store.saveSession(updatedSession)
  const resumedSession = await store.resumeSession(savedSession.id)

  assert.equal(savedSession.completedSetsCount, 1)
  assert.equal(resumedSession.completedSetsCount, 1)
  assert.equal(resumedSession.activeRestTimer.exerciseId, session.exercises[0].id)
})

test('createTrainSessionStore triggers completed-session analytics only for completed workout saves', async () => {
  const analyticsCalls = []
  const programWorkout = createDemoProgramWorkout()
  const dataClient = {
    async getProgramWorkoutById(programWorkoutId) {
      return programWorkoutId === programWorkout.id ? programWorkout : null
    },
    async insertWorkoutSession(session) {
      return { ...session, id: session.id || 'ws-analytics-1' }
    },
    async saveWorkoutSession(session) {
      return { ...session, id: session.id || 'ws-analytics-1' }
    },
    async getWorkoutSessionById(sessionId) {
      return sessionId ? { ...(this.lastSavedSession || {}), id: sessionId } : null
    },
    async saveCompletedSessionAnalytics(payload) {
      analyticsCalls.push(payload)
      return { success: true, payload }
    },
    lastSavedSession: null,
  }
  dataClient.saveWorkoutSession = async (session) => {
    dataClient.lastSavedSession = { ...session, id: session.id || 'ws-analytics-1' }
    return dataClient.lastSavedSession
  }

  const store = createTrainSessionStore({ programWorkout, dataClient })
  const { session } = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })

  const inProgressSession = completeWorkoutSet({
    session,
    exerciseId: session.exercises[0].id,
    setId: session.exercises[0].sets[0].id,
    actuals: { actualLoad: 145, actualReps: 8 },
  })

  await store.saveSession(inProgressSession)
  assert.equal(analyticsCalls.length, 0)

  const completedSession = finishWorkoutSession({
    session: inProgressSession,
    completedAt: '2026-04-21T20:30:00.000Z',
    elapsedSeconds: 1800,
  })

  await store.saveSession(completedSession)
  assert.equal(analyticsCalls.length, 1)
  assert.equal(analyticsCalls[0].sessionId, completedSession.id)

  const discardedSession = discardWorkoutSession({
    session: inProgressSession,
    discardedAt: '2026-04-21T20:40:00.000Z',
    elapsedSeconds: 2400,
  })

  await store.saveSession(discardedSession)
  assert.equal(analyticsCalls.length, 1)
})

test('resolveTrainSessionDb builds a real Supabase-backed mobile data client when Expo public env vars are present', async () => {
  const { fetchImpl } = createRemoteFetchStub()
  const db = resolveTrainSessionDb({
    programWorkout: createDemoProgramWorkout(),
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    fetchImpl,
  })

  const workout = await db.getProgramWorkoutById('pw-lower-a')
  assert.equal(workout.id, 'pw-lower-a')
  assert.equal(workout.exercises.length, 1)
})

test('createSupabaseMobileDataClient returns null without required public env config', () => {
  assert.equal(createSupabaseMobileDataClient({}), null)
})

test('resolveCurrentAthleteProfile can resolve the signed-in athlete from current user context', async () => {
  const { fetchImpl } = createRemoteFetchStub()
  const identityClient = createSupabaseMobileIdentityClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl,
  })

  const athleteProfile = await resolveCurrentAthleteProfile({ identityClient })
  assert.equal(athleteProfile.id, 'ath-1')
  assert.equal(athleteProfile.userId, 'user-1')
})

test('createTrainSessionStore persists and resumes through the remote mobile data client when Supabase config exists', async () => {
  const { fetchImpl, calls } = createRemoteFetchStub()
  const store = createTrainSessionStore({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'user-token',
    fetchImpl,
  })

  const athleteProfile = await store.getCurrentAthleteProfile()
  const workout = await store.getProgramWorkout({ onDate: '2026-04-21' })
  const started = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z', onDate: '2026-04-21' })

  assert.equal(athleteProfile.id, 'ath-1')
  assert.equal(workout.id, 'pw-lower-a')
  assert.equal(started.session.id, 'ws-remote-1')
  assert.equal(calls.some((call) => call.table === 'athlete_profiles'), true)
  assert.equal(calls.some((call) => call.table === 'program_workouts'), true)
})

test('createSupabaseRestSessionDb falls back to legacy program_workouts select when newer workout setting columns are missing', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const select = parsedUrl.searchParams.get('select') || ''
    calls.push({ table, select })

    if (table === 'program_workouts' && select.includes('default_rest_seconds')) {
      return json({ message: 'column program_workouts.default_rest_seconds does not exist' }, 400)
    }

    if (table === 'program_workouts') {
      return json([
        {
          id: 'pw-legacy-1',
          athlete_id: 'ath-1',
          coach_id: 'coach-1',
          program_id: 'program-1',
          program_day_id: 'day-1',
          workout_template_id: 'template-1',
          name_snapshot: 'Legacy Workout',
          status: 'scheduled',
          sort_order: 1,
        },
      ])
    }

    if (table === 'program_workout_exercises') {
      return json([
        {
          id: 'pwe-1',
          program_workout_id: 'pw-legacy-1',
          exercise_id: 'exercise-1',
          name_snapshot: 'Legacy Exercise',
          sort_order: 1,
          notes: '',
          default_rest_seconds: 60,
        },
      ])
    }

    if (table === 'program_workout_sets') {
      return json([
        {
          id: 'pws-1',
          program_workout_exercise_id: 'pwe-1',
          sort_order: 1,
          set_type: 'straight',
          target_reps: 5,
          target_load: null,
          target_load_unit: null,
          target_duration_seconds: null,
          target_distance: null,
          target_distance_unit: null,
          target_rpe: null,
          target_rir: null,
          target_rest_seconds: 60,
          notes: '',
        },
      ])
    }

    throw new Error(`Unexpected call ${table}`)
  }

  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const workout = await db.getProgramWorkoutById('pw-legacy-1')

  assert.equal(workout.id, 'pw-legacy-1')
  assert.equal(workout.defaultRestSeconds, null)
  assert.equal(workout.autoProgressEnabled, false)
  assert.equal(workout.adjustEffortAfterSet, false)
  assert.equal(workout.exercises.length, 1)
  assert.equal(workout.exercises[0].sets.length, 1)
  assert.equal(calls.filter((call) => call.table === 'program_workouts').length, 2)
  assert.equal(calls.some((call) => call.table === 'program_workouts' && call.select.includes('default_rest_seconds')), true)
  assert.equal(calls.some((call) => call.table === 'program_workouts' && call.select === 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,notes,status,sort_order'), true)
})

test('createSupabaseRestSessionDb falls back to notes-safe program_workouts select when the live backend is missing program_workouts.notes', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const select = parsedUrl.searchParams.get('select') || ''
    calls.push({ table, select })

    if (table === 'program_workouts' && select.includes('notes')) {
      return json({ message: "Could not find the 'notes' column of 'program_workouts' in the schema cache" }, 400)
    }

    if (table === 'program_workouts') {
      return json([
        {
          id: 'pw-legacy-notes-1',
          athlete_id: 'ath-1',
          coach_id: 'coach-1',
          program_id: 'program-1',
          program_day_id: 'day-1',
          workout_template_id: 'template-1',
          name_snapshot: 'Legacy Notes Workout',
          status: 'scheduled',
          sort_order: 1,
        },
      ])
    }

    if (table === 'program_workout_exercises') {
      return json([
        {
          id: 'pwe-legacy-notes-1',
          program_workout_id: 'pw-legacy-notes-1',
          exercise_id: 'exercise-1',
          name_snapshot: 'Legacy Exercise',
          sort_order: 1,
          notes: '',
          default_rest_seconds: 60,
        },
      ])
    }

    if (table === 'program_workout_sets') {
      return json([
        {
          id: 'pws-legacy-notes-1',
          program_workout_exercise_id: 'pwe-legacy-notes-1',
          sort_order: 1,
          set_type: 'straight',
          target_reps: 5,
          target_load: null,
          target_load_unit: null,
          target_duration_seconds: null,
          target_distance: null,
          target_distance_unit: null,
          target_rpe: null,
          target_rir: null,
          target_rest_seconds: 60,
          notes: '',
        },
      ])
    }

    throw new Error(`Unexpected call ${table}`)
  }

  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const workout = await db.getProgramWorkoutById('pw-legacy-notes-1')

  assert.equal(workout.id, 'pw-legacy-notes-1')
  assert.equal(workout.notes, '')
  assert.equal(workout.defaultRestSeconds, null)
  assert.equal(workout.autoProgressEnabled, false)
  assert.equal(workout.adjustEffortAfterSet, false)
  assert.equal(workout.exercises.length, 1)
  assert.equal(calls.filter((call) => call.table === 'program_workouts').length, 2)
  assert.equal(calls.some((call) => call.table === 'program_workouts' && call.select.includes('notes')), true)
  assert.equal(calls.some((call) => call.table === 'program_workouts' && call.select === 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,status,sort_order'), true)
})

test('createSupabaseRestSessionDb falls back to legacy workout_sessions columns when newer session setting columns are missing', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const select = parsedUrl.searchParams.get('select') || ''
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ table, select, method, body })

    if (table === 'workout_sessions' && method === 'POST' && Object.prototype.hasOwnProperty.call(body || {}, 'adjust_effort_after_set')) {
      return json({ message: "Could not find the 'adjust_effort_after_set' column of 'workout_sessions' in the schema cache" }, 400)
    }

    if (table === 'workout_sessions' && method === 'GET' && select.includes('adjust_effort_after_set')) {
      return json({ message: 'column workout_sessions.adjust_effort_after_set does not exist' }, 400)
    }

    if (table === 'workout_sessions' && method === 'POST') {
      return json([
        {
          id: 'ws-legacy-1',
          athlete_id: 'ath-1',
          coach_id: 'coach-1',
          program_id: 'program-1',
          program_day_id: 'day-1',
          program_workout_id: 'pw-legacy-1',
          workout_template_id: 'template-1',
          name_snapshot: 'Legacy Workout',
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
      ])
    }

    if (table === 'workout_sessions' && method === 'GET') {
      return json([
        {
          id: 'ws-legacy-1',
          athlete_id: 'ath-1',
          coach_id: 'coach-1',
          program_id: 'program-1',
          program_day_id: 'day-1',
          program_workout_id: 'pw-legacy-1',
          workout_template_id: 'template-1',
          name_snapshot: 'Legacy Workout',
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
      ])
    }

    if (table === 'workout_session_exercises' && (method === 'POST' || method === 'PATCH') && Object.prototype.hasOwnProperty.call(body || {}, 'superset_group_id')) {
      return json({ message: "Could not find the 'superset_group_id' column of 'workout_session_exercises' in the schema cache" }, 400)
    }

    if (table === 'workout_session_exercises' && method === 'GET' && select.includes('superset_group_id')) {
      return json({ message: "Could not find the 'superset_group_id' column of 'workout_session_exercises' in the schema cache" }, 400)
    }

    if (table === 'workout_session_exercises' && (method === 'POST' || method === 'PATCH')) {
      return json([
        {
          id: 'wse-1',
          workout_session_id: 'ws-legacy-1',
          program_workout_exercise_id: 'pwe-1',
          exercise_id: 'exercise-1',
          name_snapshot: 'Legacy Exercise',
          sort_order: 1,
          status: 'not_started',
          notes: '',
          default_rest_seconds: 60,
        },
      ])
    }

    if (table === 'workout_session_sets' && (method === 'POST' || method === 'PATCH')) {
      return json([
        {
          id: 'wss-1',
          workout_session_exercise_id: 'wse-1',
          program_workout_set_id: 'pws-1',
          sort_order: 1,
          set_type: 'straight',
          prescribed_reps: 5,
          prescribed_load: null,
          prescribed_load_unit: null,
          prescribed_duration_seconds: null,
          prescribed_distance: null,
          prescribed_distance_unit: null,
          prescribed_rpe: null,
          prescribed_rir: null,
          prescribed_rest_seconds: 60,
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
          notes: '',
        },
      ])
    }

    if (table === 'workout_session_exercises' && method === 'GET') {
      return json([
        {
          id: 'wse-1',
          workout_session_id: 'ws-legacy-1',
          program_workout_exercise_id: 'pwe-1',
          exercise_id: 'exercise-1',
          name_snapshot: 'Legacy Exercise',
          sort_order: 1,
          status: 'not_started',
          notes: '',
          default_rest_seconds: 60,
        },
      ])
    }

    if (table === 'workout_session_sets' && method === 'GET') {
      return json([
        {
          id: 'wss-1',
          workout_session_exercise_id: 'wse-1',
          program_workout_set_id: 'pws-1',
          sort_order: 1,
          set_type: 'straight',
          prescribed_reps: 5,
          prescribed_load: null,
          prescribed_load_unit: null,
          prescribed_duration_seconds: null,
          prescribed_distance: null,
          prescribed_distance_unit: null,
          prescribed_rpe: null,
          prescribed_rir: null,
          prescribed_rest_seconds: 60,
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
          notes: '',
        },
      ])
    }

    throw new Error(`Unexpected call ${method} ${table}`)
  }

  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const created = await db.insertWorkoutSession({
    id: 'ws-legacy-1',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-1',
    programWorkoutId: 'pw-legacy-1',
    workoutTemplateId: 'template-1',
    nameSnapshot: 'Legacy Workout',
    status: 'in_progress',
    startedAt: '2026-04-21T20:00:00.000Z',
    completedAt: null,
    elapsedSeconds: 0,
    notes: '',
    perceivedDifficulty: null,
    settings: {
      defaultRestSeconds: 90,
      autoProgressEnabled: true,
      keepAwake: true,
      adjustEffortAfterSet: true,
    },
    totalExercisesCount: 1,
    completedExercisesCount: 0,
    totalSetsCount: 1,
    completedSetsCount: 0,
    exercises: [
      {
        id: 'pwe-1',
        programWorkoutExerciseId: 'pwe-1',
        exerciseId: 'exercise-1',
        nameSnapshot: 'Legacy Exercise',
        sortOrder: 1,
        status: 'not_started',
        notes: '',
        defaultRestSeconds: 60,
        supersetGroupId: 'local-superset-legacy-1',
        supersetOrder: 1,
        sets: [
          {
            id: 'pws-1',
            programWorkoutSetId: 'pws-1',
            sortOrder: 1,
            setType: 'straight',
            prescribedReps: 5,
            prescribedRestSeconds: 60,
            notes: '',
            isCompleted: false,
          },
        ],
      },
    ],
  })

  const resumed = await db.getWorkoutSessionById('ws-legacy-1')

  assert.equal(created.id, 'ws-legacy-1')
  assert.equal(created.exercises[0]?.supersetGroupId, 'local-superset-legacy-1')
  assert.equal(created.exercises[0]?.supersetOrder, 1)
  assert.equal(resumed.id, 'ws-legacy-1')
  assert.equal(resumed.settings.defaultRestSeconds, null)
  assert.equal(resumed.settings.autoProgressEnabled, false)
  assert.equal(resumed.settings.keepAwake, false)
  assert.equal(resumed.settings.adjustEffortAfterSet, false)
  assert.equal(calls.filter((call) => call.table === 'workout_sessions' && call.method === 'POST').length, 2)
  assert.equal(calls.some((call) => call.table === 'workout_sessions' && call.method === 'POST' && Object.prototype.hasOwnProperty.call(call.body || {}, 'adjust_effort_after_set')), true)
  assert.equal(calls.some((call) => call.table === 'workout_sessions' && call.method === 'POST' && !Object.prototype.hasOwnProperty.call(call.body || {}, 'adjust_effort_after_set')), true)
  assert.equal(calls.some((call) => call.table === 'workout_sessions' && call.method === 'GET' && call.select === 'id,athlete_id,coach_id,program_id,program_day_id,program_workout_id,workout_template_id,name_snapshot,status,started_at,completed_at,elapsed_seconds,notes,perceived_difficulty,total_exercises_count,completed_exercises_count,total_sets_count,completed_sets_count'), true)
  assert.equal(calls.some((call) => call.table === 'workout_session_exercises' && call.method === 'GET' && call.select.includes('superset_group_id')), true)
  assert.equal(calls.some((call) => call.table === 'workout_session_exercises' && call.method === 'GET' && call.select === 'id,workout_session_id,program_workout_exercise_id,exercise_id,name_snapshot,sort_order,status,notes,default_rest_seconds'), true)
  assert.equal(calls.some((call) => call.table === 'workout_session_exercises' && (call.method === 'POST' || call.method === 'PATCH') && Object.prototype.hasOwnProperty.call(call.body || {}, 'superset_group_id')), true)
  assert.equal(calls.some((call) => call.table === 'workout_session_exercises' && (call.method === 'POST' || call.method === 'PATCH') && !Object.prototype.hasOwnProperty.call(call.body || {}, 'superset_group_id')), true)
})

test('createTrainSessionStore persists and resumes through the remote mobile data client when Supabase config exists', async () => {
  const { fetchImpl, calls } = createRemoteFetchStub()
  const store = createTrainSessionStore({
    programWorkout: createDemoProgramWorkout(),
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    fetchImpl,
  })

  const started = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })
  assert.equal(started.session.id, 'ws-remote-1')

  const updatedSession = completeWorkoutSet({
    session: started.session,
    exerciseId: started.session.exercises[0].id,
    setId: started.session.exercises[0].sets[0].id,
  })

  const savedSession = await store.saveSession(updatedSession)
  const resumedSession = await store.resumeSession(savedSession.id)

  assert.equal(savedSession.completedSetsCount, 1)
  assert.equal(resumedSession.completedSetsCount, 1)
  assert.equal(calls.some((call) => call.method === 'POST' && call.table === 'workout_sessions'), true)
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.table === 'workout_session_sets'), true)
})

test('createTrainSessionStore deletes a live session set durably through the remote mobile data client so resume does not bring it back', async () => {
  const { fetchImpl, calls } = createRemoteFetchStub()
  const store = createTrainSessionStore({
    programWorkout: createDemoProgramWorkout(),
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    fetchImpl,
  })

  const started = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })
  const startedSetId = started.session.exercises[0].sets[0].id
  const nextSession = {
    ...started.session,
    exercises: started.session.exercises.map((exercise, exerciseIndex) => (
      exerciseIndex === 0
        ? {
            ...exercise,
            sets: exercise.sets.slice(1).map((set, index) => ({
              ...set,
              sortOrder: index + 1,
            })),
          }
        : exercise
    )),
    totalSetsCount: started.session.totalSetsCount - 1,
  }

  const savedSession = await store.deleteSessionSet(nextSession, { setId: startedSetId })
  const resumedSession = await store.resumeSession(savedSession.id)

  assert.equal(savedSession.totalSetsCount, started.session.totalSetsCount - 1)
  assert.equal(resumedSession.totalSetsCount, started.session.totalSetsCount - 1)
  assert.equal(resumedSession.exercises[0]?.sets?.some((set) => set.id === startedSetId) ?? false, false)
  assert.equal(calls.some((call) => call.method === 'DELETE' && call.table === 'workout_session_sets'), true)
})

test('createSupabaseRestSessionDb can delete a live workout session set row directly', async () => {
  const calls = []
  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      calls.push({
        url: parsed.toString(),
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : null,
      })

      if (parsed.pathname.endsWith('/workout_session_sets')) {
        return json([])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const result = await db.deleteWorkoutSessionSet({
    workoutSessionSetId: 'wss-1',
  })

  assert.deepEqual(result, { success: true, workoutSessionSetId: 'wss-1' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'DELETE')
  assert.equal(new URL(calls[0].url).searchParams.get('id'), 'eq.wss-1')
})

test('createTrainSessionStore deletes a full live exercise durably through the remote mobile data client so resume does not bring it back', async () => {
  const calls = []
  const state = {
    workoutSession: {
      id: 'session-delete-exercise',
      athlete_id: 'ath-1',
      coach_id: 'coach-1',
      program_id: 'program-1',
      program_day_id: 'day-1',
      program_workout_id: 'pw-1',
      workout_template_id: null,
      name_snapshot: 'Delete Exercise Workout',
      status: 'in_progress',
      started_at: '2026-04-21T20:00:00.000Z',
      completed_at: null,
      elapsed_seconds: 0,
      notes: '',
      perceived_difficulty: null,
      total_exercises_count: 2,
      completed_exercises_count: 0,
      total_sets_count: 3,
      completed_sets_count: 0,
    },
    workoutSessionExercises: [
      {
        id: 'wse-1',
        workout_session_id: 'session-delete-exercise',
        program_workout_exercise_id: 'pwe-1',
        exercise_id: 'exercise-1',
        name_snapshot: 'Cable Rear Delt Fly',
        sort_order: 1,
        status: 'not_started',
        notes: '',
        default_rest_seconds: 45,
      },
      {
        id: 'wse-2',
        workout_session_id: 'session-delete-exercise',
        program_workout_exercise_id: 'pwe-2',
        exercise_id: 'exercise-2',
        name_snapshot: 'Dumbbell Chest Fly',
        sort_order: 2,
        status: 'not_started',
        notes: '',
        default_rest_seconds: 60,
      },
    ],
    workoutSessionSets: [
      {
        id: 'wss-1',
        workout_session_exercise_id: 'wse-1',
        program_workout_set_id: 'pws-1',
        sort_order: 1,
        set_type: 'straight',
        prescribed_reps: 12,
        prescribed_load: 20,
        prescribed_load_unit: 'lb',
        prescribed_duration_seconds: null,
        prescribed_distance: null,
        prescribed_distance_unit: null,
        prescribed_rpe: 7,
        prescribed_rir: null,
        prescribed_rest_seconds: 45,
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
        notes: '',
      },
      {
        id: 'wss-2',
        workout_session_exercise_id: 'wse-1',
        program_workout_set_id: 'pws-2',
        sort_order: 2,
        set_type: 'straight',
        prescribed_reps: 12,
        prescribed_load: 20,
        prescribed_load_unit: 'lb',
        prescribed_duration_seconds: null,
        prescribed_distance: null,
        prescribed_distance_unit: null,
        prescribed_rpe: 8,
        prescribed_rir: null,
        prescribed_rest_seconds: 45,
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
        notes: '',
      },
      {
        id: 'wss-3',
        workout_session_exercise_id: 'wse-2',
        program_workout_set_id: 'pws-3',
        sort_order: 1,
        set_type: 'straight',
        prescribed_reps: 10,
        prescribed_load: 30,
        prescribed_load_unit: 'lb',
        prescribed_duration_seconds: null,
        prescribed_distance: null,
        prescribed_distance_unit: null,
        prescribed_rpe: 7,
        prescribed_rir: null,
        prescribed_rest_seconds: 60,
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
        notes: '',
      },
    ],
  }

  const fetchImpl = async (url, options = {}) => {
    const method = options.method || 'GET'
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ method, table, path: parsedUrl.pathname, query: parsedUrl.search, body })

    if (table === 'workout_sessions' && method === 'PATCH') {
      state.workoutSession = { ...state.workoutSession, ...body }
      return json([state.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'PATCH') {
      state.workoutSessionExercises = state.workoutSessionExercises.map((row) => ({ ...row, ...body }))
      return json(state.workoutSessionExercises)
    }

    if (table === 'workout_session_exercises' && method === 'DELETE') {
      const targetId = parsedUrl.searchParams.get('id')?.replace(/^eq\./, '') || null
      state.workoutSessionExercises = state.workoutSessionExercises.filter((row) => row.id !== targetId)
      state.workoutSessionSets = state.workoutSessionSets.filter((row) => row.workout_session_exercise_id !== targetId)
      return json([])
    }

    if (table === 'workout_session_sets' && (method === 'PATCH' || method === 'POST')) {
      return json(state.workoutSessionSets)
    }

    if (table === 'workout_session_sets' && method === 'GET') {
      return json(state.workoutSessionSets)
    }

    if (table === 'workout_sessions' && method === 'GET') {
      return json([state.workoutSession])
    }

    if (table === 'workout_session_exercises' && method === 'GET') {
      return json(state.workoutSessionExercises)
    }

    throw new Error(`Unexpected remote call: ${method} ${table}`)
  }

  const db = createSupabaseRestSessionDb({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl,
  })

  const store = createTrainSessionStore({
    initialSession: {
      id: 'session-delete-exercise',
      nameSnapshot: 'Delete Exercise Workout',
    },
    dataClient: db,
  })

  const resumed = await store.resumeSession('session-delete-exercise')
  const nextSession = removeSessionExercise(resumed, 'wse-1')
  const savedSession = await store.deleteSessionExercise(nextSession, { exerciseId: 'wse-1' })
  const resumedAgain = await store.resumeSession('session-delete-exercise')

  assert.equal(savedSession.exercises.length, 1)
  assert.equal(savedSession.exercises[0].id, 'wse-2')
  assert.equal(savedSession.exercises[0].sortOrder, 1)
  assert.equal(savedSession.totalExercisesCount, 1)
  assert.equal(savedSession.totalSetsCount, 1)
  assert.equal(resumedAgain.exercises.length, 1)
  assert.equal(resumedAgain.exercises[0].id, 'wse-2')
  assert.equal(resumedAgain.exercises[0].sets.length, 1)
  assert.equal(calls.some((call) => call.method === 'DELETE' && call.table === 'workout_session_exercises'), true)
})

test('createTrainSessionStore persists per-exercise rest-time changes through the remote mobile data client', async () => {
  const { fetchImpl, calls } = createRemoteFetchStub()
  const store = createTrainSessionStore({
    programWorkout: createDemoProgramWorkout(),
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    fetchImpl,
  })

  const started = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })
  const updatedSession = {
    ...started.session,
    exercises: started.session.exercises.map((exercise, index) => (
      index === 0
        ? { ...exercise, defaultRestSeconds: 120 }
        : exercise
    )),
  }

  const savedSession = await store.saveSession(updatedSession)
  const resumedSession = await store.resumeSession(savedSession.id)

  assert.equal(savedSession.exercises[0].defaultRestSeconds, 120)
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.table === 'workout_session_exercises' && call.body?.default_rest_seconds === 120), true)
  assert.equal(resumedSession.exercises[0]?.defaultRestSeconds ?? 120, 120)
})

test('createTrainSessionStore persists live superset groups through workout_session_exercises', async () => {
  const { fetchImpl, calls } = createRemoteFetchStub()
  const store = createTrainSessionStore({
    programWorkout: createDemoProgramWorkout(),
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    fetchImpl,
  })

  const started = await store.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })
  const twoExerciseSession = appendSessionExercises(started.session, [
    {
      id: 'exercise-row',
      name: 'Bent Over Row',
      defaultRestSeconds: 90,
      sets: [{ id: 'row-set-1', targetReps: 8, targetLoad: 80 }],
    },
  ])
  const linkedSession = createSessionSuperset(twoExerciseSession, twoExerciseSession.exercises[0].id, twoExerciseSession.exercises[1].id)
  const savedSession = await store.saveSession(linkedSession)
  const resumedSession = await store.resumeSession(savedSession.id)
  const supersetGroupId = savedSession.exercises[0].supersetGroupId

  assert.match(supersetGroupId, /^local-superset-/)
  assert.equal(savedSession.exercises[1].supersetGroupId, supersetGroupId)
  assert.equal(savedSession.exercises[0].supersetOrder, 1)
  assert.equal(savedSession.exercises[1].supersetOrder, 2)
  const persistedSupersetCalls = calls.filter((call) => call.table === 'workout_session_exercises'
    && (call.method === 'PATCH' || call.method === 'POST')
    && call.body?.superset_group_id === supersetGroupId)
  assert.equal(persistedSupersetCalls.some((call) => call.body?.superset_order === 1), true)
  assert.equal(persistedSupersetCalls.some((call) => call.body?.superset_order === 2), true)
  assert.equal(resumedSession.exercises[0]?.supersetGroupId, supersetGroupId)
  assert.equal(resumedSession.exercises[1]?.supersetOrder, 2)
})

test('createTrainSessionStore keeps workout settings stable across legacy remote save and resume using local session settings storage', async () => {
  const programWorkout = {
    id: 'pw-settings-1',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-1',
    workoutTemplateId: 'template-1',
    nameSnapshot: 'Settings Workout',
    defaultRestSeconds: 90,
    autoProgressEnabled: true,
    adjustEffortAfterSet: true,
    exercises: [
      {
        id: 'pwe-1',
        exerciseId: 'exercise-1',
        nameSnapshot: 'Exercise 1',
        sortOrder: 1,
        defaultRestSeconds: 60,
        sets: [
          { id: 'pws-1', sortOrder: 1, setType: 'straight', targetReps: 5, targetRestSeconds: 60 },
        ],
      },
    ],
  }

  let legacySessionRow = null
  const dataClient = {
    async getProgramWorkoutById(programWorkoutId) {
      return programWorkoutId === 'pw-settings-1' ? programWorkout : null
    },
    async insertWorkoutSession(session) {
      legacySessionRow = {
        ...session,
        id: 'ws-settings-1',
        settings: {
          defaultRestSeconds: null,
          autoProgressEnabled: false,
          keepAwake: false,
          adjustEffortAfterSet: false,
        },
      }
      return legacySessionRow
    },
    async saveWorkoutSession(session) {
      legacySessionRow = {
        ...session,
        settings: {
          defaultRestSeconds: null,
          autoProgressEnabled: false,
          keepAwake: false,
          adjustEffortAfterSet: false,
        },
      }
      return legacySessionRow
    },
    async getWorkoutSessionById(sessionId) {
      return sessionId === 'ws-settings-1' ? legacySessionRow : null
    },
  }

  const sessionSettingsStorage = createMemorySessionSettingsStorage()
  const firstStore = createTrainSessionStore({
    programWorkout,
    dataClient,
    sessionSettingsStorage,
  })

  const started = await firstStore.startSession({ startedAt: '2026-04-21T20:00:00.000Z' })
  assert.equal(started.session.settings.defaultRestSeconds, 90)
  assert.equal(started.session.settings.autoProgressEnabled, true)
  assert.equal(started.session.settings.adjustEffortAfterSet, true)

  const updated = {
    ...started.session,
    settings: {
      ...started.session.settings,
      defaultRestSeconds: 150,
      keepAwake: true,
      autoProgressEnabled: false,
      adjustEffortAfterSet: false,
    },
  }

  const saved = await firstStore.saveSession(updated)
  assert.equal(saved.settings.defaultRestSeconds, 150)
  assert.equal(saved.settings.keepAwake, true)
  assert.equal(saved.settings.autoProgressEnabled, false)
  assert.equal(saved.settings.adjustEffortAfterSet, false)

  const secondStore = createTrainSessionStore({
    programWorkout,
    dataClient,
    sessionSettingsStorage,
  })

  const resumed = await secondStore.resumeSession('ws-settings-1')
  assert.equal(resumed.settings.defaultRestSeconds, 150)
  assert.equal(resumed.settings.keepAwake, true)
  assert.equal(resumed.settings.autoProgressEnabled, false)
  assert.equal(resumed.settings.adjustEffortAfterSet, false)
})


test('completeWorkoutSet uses workout default rest and advanceSessionAfterRestTimerExpiry targets the next set only when auto-progress is enabled', () => {
  const session = {
    status: 'in_progress',
    settings: { defaultRestSeconds: 90, autoProgressEnabled: true },
    exercises: [
      {
        id: 'exercise-1',
        sets: [
          { id: 'set-1', isCompleted: false },
          { id: 'set-2', isCompleted: false },
        ],
      },
      {
        id: 'exercise-2',
        sets: [
          { id: 'set-3', isCompleted: false },
        ],
      },
    ],
  }

  const completed = completeWorkoutSet({ session, exerciseId: 'exercise-1', setId: 'set-1' })
  assert.equal(completed.activeRestTimer.remainingSeconds, 90)

  const advanced = advanceSessionAfterRestTimerExpiry(completed)
  assert.equal(advanced.activeRestTimer, null)
  assert.deepEqual(advanced.activeSetTarget, { exerciseId: 'exercise-1', setId: 'set-2', isCompleted: false })
})

test('advanceSessionAfterRestTimerExpiry clears the timer without target when auto-progress is disabled', () => {
  const session = {
    status: 'in_progress',
    settings: { autoProgressEnabled: false },
    activeRestTimer: { exerciseId: 'exercise-1', setId: 'set-1', remainingSeconds: 1, isRunning: true },
    activeSetTarget: { exerciseId: 'old', setId: 'old-set' },
    exercises: [
      {
        id: 'exercise-1',
        sets: [
          { id: 'set-1', isCompleted: true },
          { id: 'set-2', isCompleted: false },
        ],
      },
    ],
  }

  const advanced = advanceSessionAfterRestTimerExpiry(session)
  assert.equal(advanced.activeRestTimer, null)
  assert.equal(advanced.activeSetTarget, null)
})
