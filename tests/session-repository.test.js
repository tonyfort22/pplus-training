import test from 'node:test'
import assert from 'node:assert/strict'

import { createSessionRepository } from '../packages/data/src/sessions/index.js'

function buildProgramWorkout() {
  return {
    id: 'pw-1',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'prog-1',
    programDayId: 'day-1',
    workoutTemplateId: 'tpl-1',
    nameSnapshot: 'Lower B',
    exercises: [
      {
        id: 'pwe-1',
        exerciseId: 'ex-1',
        nameSnapshot: 'Front Squat',
        sortOrder: 1,
        notes: 'Stay tall',
        defaultRestSeconds: 120,
        sets: [
          {
            id: 'pws-1',
            sortOrder: 1,
            setType: 'straight',
            targetReps: 8,
            targetLoad: 135,
            targetLoadUnit: 'lb',
            targetRpe: 7,
            targetRir: 3,
            targetRestSeconds: 120,
            notes: 'Smooth reps',
          },
        ],
      },
    ],
  }
}

test('createSessionFromProgramWorkout snapshots the planned workout and persists it when db supports inserts', async () => {
  const inserted = []
  const db = {
    async getProgramWorkoutById(programWorkoutId) {
      assert.equal(programWorkoutId, 'pw-1')
      return buildProgramWorkout()
    },
    async insertWorkoutSession(session) {
      inserted.push(session)
      return {
        ...session,
        id: 'ws-1',
      }
    },
  }

  const repository = createSessionRepository(db)
  const result = await repository.createSessionFromProgramWorkout('pw-1', {
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(inserted.length, 1)
  assert.equal(inserted[0].programWorkoutId, 'pw-1')
  assert.equal(inserted[0].exercises[0].programWorkoutExerciseId, 'pwe-1')
  assert.equal(inserted[0].exercises[0].sets[0].programWorkoutSetId, 'pws-1')
  assert.equal(result.programWorkoutId, 'pw-1')
  assert.equal(result.sessionId, 'ws-1')
  assert.equal(result.session.startedAt, '2026-04-21T20:00:00.000Z')
  assert.equal(result.session.exercises[0].sets[0].prescribedReps, 8)
})

test('createSessionFromProgramWorkout returns an in-memory session when db has no insert method', async () => {
  const db = {
    async getProgramWorkoutById() {
      return buildProgramWorkout()
    },
  }

  const repository = createSessionRepository(db)
  const result = await repository.createSessionFromProgramWorkout('pw-1', {
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(result.programWorkoutId, 'pw-1')
  assert.equal(result.sessionId, 'pw-1')
  assert.equal(result.session.programWorkoutId, 'pw-1')
  assert.equal(result.session.status, 'in_progress')
})

test('createSessionFromProgramWorkout reuses an existing in-progress session for the same program workout', async () => {
  const existingSession = {
    id: 'ws-existing-1',
    programWorkoutId: 'pw-1',
    status: 'in_progress',
    exercises: [{ id: 'wse-1', sets: [] }],
  }
  let insertCalls = 0
  const db = {
    async getProgramWorkoutById() {
      return buildProgramWorkout()
    },
    async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
      assert.equal(programWorkoutId, 'pw-1')
      return existingSession
    },
    async insertWorkoutSession() {
      insertCalls += 1
      return { id: 'ws-new-1' }
    },
  }

  const repository = createSessionRepository(db)
  const result = await repository.createSessionFromProgramWorkout('pw-1', {
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(insertCalls, 0)
  assert.equal(result.sessionId, 'ws-existing-1')
  assert.equal(result.session, existingSession)
})

test('createSessionFromProgramWorkout can discard an existing same-workout in-progress session when the caller explicitly requests a fresh start', async () => {
  const existingSession = {
    id: 'ws-existing-1',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'prog-1',
    programDayId: 'day-1',
    programWorkoutId: 'pw-1',
    workoutTemplateId: 'tpl-1',
    nameSnapshot: 'Lower B',
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
    exercises: [{ id: 'wse-1', sets: [] }],
  }
  const savedSessions = []
  let insertCalls = 0
  const db = {
    async getProgramWorkoutById() {
      return buildProgramWorkout()
    },
    async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
      assert.equal(programWorkoutId, 'pw-1')
      return existingSession
    },
    async saveWorkoutSession(session) {
      savedSessions.push(session)
      return session
    },
    async insertWorkoutSession(session) {
      insertCalls += 1
      return {
        ...session,
        id: 'ws-new-1',
      }
    },
  }

  const repository = createSessionRepository(db)
  const result = await repository.createSessionFromProgramWorkout('pw-1', {
    startedAt: '2026-04-21T20:00:00.000Z',
    forceNewSession: true,
  })

  assert.equal(insertCalls, 1)
  assert.equal(savedSessions.length, 1)
  assert.equal(savedSessions[0].id, 'ws-existing-1')
  assert.equal(savedSessions[0].status, 'discarded')
  assert.equal(result.session.id, 'ws-new-1')
  assert.equal(result.session.programWorkoutId, 'pw-1')
})

test('createSessionFromProgramWorkout discards a conflicting in-progress session for the athlete before starting a new one', async () => {
  const conflictingSession = {
    id: 'ws-conflict-1',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'prog-1',
    programDayId: 'day-1',
    programWorkoutId: 'pw-old',
    workoutTemplateId: 'tpl-old',
    nameSnapshot: 'Old Workout',
    status: 'in_progress',
    startedAt: '2026-04-21T19:00:00.000Z',
    completedAt: null,
    elapsedSeconds: 300,
    notes: '',
    perceivedDifficulty: null,
    totalExercisesCount: 1,
    completedExercisesCount: 0,
    totalSetsCount: 3,
    completedSetsCount: 0,
    exercises: [{ id: 'wse-old-1', sets: [] }],
  }
  const savedSessions = []
  let insertCalls = 0
  const db = {
    async getProgramWorkoutById() {
      return buildProgramWorkout()
    },
    async getInProgressSessionByProgramWorkoutId() {
      return null
    },
    async getInProgressSessionByAthleteId(athleteId) {
      assert.equal(athleteId, 'ath-1')
      return conflictingSession
    },
    async saveWorkoutSession(session) {
      savedSessions.push(session)
      return session
    },
    async insertWorkoutSession(session) {
      insertCalls += 1
      return {
        ...session,
        id: 'ws-new-1',
      }
    },
  }

  const repository = createSessionRepository(db)
  const result = await repository.createSessionFromProgramWorkout('pw-1', {
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(insertCalls, 1)
  assert.equal(savedSessions.length, 1)
  assert.equal(savedSessions[0].id, 'ws-conflict-1')
  assert.equal(savedSessions[0].status, 'discarded')
  assert.equal(result.session.id, 'ws-new-1')
  assert.equal(result.session.programWorkoutId, 'pw-1')
})

test('createSessionRepository can fall back to the SQL adapter when db only exposes query', async () => {
  const calls = []
  const db = {
    async query(sql, params = []) {
      calls.push({ sql, params })

      if (sql.includes('from program_workouts')) {
        return [{
          id: 'pw-1',
          athlete_id: 'ath-1',
          coach_id: 'coach-1',
          program_id: 'prog-1',
          program_day_id: 'day-1',
          workout_template_id: 'tpl-1',
          name_snapshot: 'Lower B',
          status: 'scheduled',
          sort_order: 1,
        }]
      }

      if (sql.includes('from program_workout_exercises')) {
        return [{
          id: 'pwe-1',
          program_workout_id: 'pw-1',
          exercise_id: 'ex-1',
          name_snapshot: 'Front Squat',
          sort_order: 1,
          notes: 'Stay tall',
          default_rest_seconds: 120,
        }]
      }

      if (sql.includes('from program_workout_sets')) {
        return [{
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
        }]
      }

      if (sql.includes("from workout_sessions") && sql.includes("status = 'in_progress'")) {
        return []
      }

      if (sql.includes('insert into workout_sessions')) {
        return [{ id: 'ws-1' }]
      }

      if (sql.includes('insert into workout_session_exercises')) {
        return [{ id: 'wse-1' }]
      }

      if (sql.includes('insert into workout_session_sets')) {
        return [{ id: 'wss-1' }]
      }

      throw new Error(`Unexpected SQL: ${sql}`)
    },
  }

  const repository = createSessionRepository(db)
  const result = await repository.createSessionFromProgramWorkout('pw-1', {
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(result.sessionId, 'ws-1')
  assert.equal(result.session.exercises[0].sets[0].programWorkoutSetId, 'pws-1')
  assert.ok(calls.some((call) => call.sql.includes('insert into workout_sessions')))
})

test('getSessionById delegates to db.getWorkoutSessionById when available', async () => {
  const db = {
    async getWorkoutSessionById(sessionId) {
      return {
        id: sessionId,
        exercises: [{ id: 'wse-1' }],
      }
    },
  }

  const repository = createSessionRepository(db)
  const session = await repository.getSessionById('ws-1')

  assert.equal(session.id, 'ws-1')
  assert.equal(session.exercises.length, 1)
})
