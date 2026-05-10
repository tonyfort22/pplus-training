import test from 'node:test'
import assert from 'node:assert/strict'

import { createSessionDbAdapter } from '../packages/data/src/sessions/index.js'

function createQueryStub() {
  const calls = []
  const stub = async (sql, params = []) => {
    calls.push({ sql, params })

    if (sql.includes('from program_workouts')) {
      return [
        {
          id: 'pw-1',
          athlete_id: 'ath-1',
          coach_id: 'coach-1',
          program_id: 'prog-1',
          program_day_id: 'day-1',
          workout_template_id: 'tpl-1',
          name_snapshot: 'Lower B',
        },
      ]
    }

    if (sql.includes('from program_workout_exercises')) {
      return [
        {
          id: 'pwe-1',
          program_workout_id: 'pw-1',
          exercise_id: 'ex-1',
          name_snapshot: 'Front Squat',
          sort_order: 1,
          notes: 'Stay tall',
          default_rest_seconds: 120,
        },
      ]
    }

    if (sql.includes('from program_workout_sets')) {
      return [
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
      ]
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

    if (sql.includes('from workout_sessions')) {
      return [
        {
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
          total_exercises_count: 1,
          completed_exercises_count: 0,
          total_sets_count: 1,
          completed_sets_count: 0,
        },
      ]
    }

    if (sql.includes('from workout_session_exercises')) {
      return [
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
      ]
    }

    if (sql.includes('from workout_session_sets')) {
      return [
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
      ]
    }

    throw new Error(`Unexpected SQL: ${sql}`)
  }
  return { stub, calls }
}

test('createSessionDbAdapter.getProgramWorkoutById loads a nested planned workout from SQL rows', async () => {
  const { stub, calls } = createQueryStub()
  const adapter = createSessionDbAdapter({ query: stub })

  const workout = await adapter.getProgramWorkoutById('pw-1')

  assert.equal(workout.id, 'pw-1')
  assert.equal(workout.programDayId, 'day-1')
  assert.equal(workout.exercises.length, 1)
  assert.equal(workout.exercises[0].sets[0].targetReps, 8)
  assert.equal(workout.exercises[0].sets[0].targetLoadUnit, 'lb')
  assert.equal(calls.length, 6)
  assert.equal(calls.filter((call) => call.sql.includes('from program_workouts')).length, 1)
  assert.equal(calls.filter((call) => call.sql.includes('from program_workout_exercises')).length, 1)
  assert.equal(calls.filter((call) => call.sql.includes('from program_workout_sets')).length, 1)
  assert.equal(calls.filter((call) => call.sql.includes('from exercises')).length, 1)
  assert.equal(calls.filter((call) => call.sql.includes('from exercise_muscle_maps')).length, 1)
  assert.equal(calls.filter((call) => call.sql.includes('from exercise_sub_muscle_maps')).length, 1)
})

test('createSessionDbAdapter.insertWorkoutSession writes session, exercises, and sets', async () => {
  const { stub, calls } = createQueryStub()
  const adapter = createSessionDbAdapter({ query: stub })

  const inserted = await adapter.insertWorkoutSession({
    id: 'pw-1',
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
    totalExercisesCount: 1,
    completedExercisesCount: 0,
    totalSetsCount: 1,
    completedSetsCount: 0,
    exercises: [
      {
        id: 'pwe-1',
        programWorkoutExerciseId: 'pwe-1',
        exerciseId: 'ex-1',
        nameSnapshot: 'Front Squat',
        sortOrder: 1,
        status: 'not_started',
        notes: 'Stay tall',
        defaultRestSeconds: 120,
        sets: [
          {
            id: 'pws-1',
            programWorkoutSetId: 'pws-1',
            sortOrder: 1,
            setType: 'straight',
            prescribedReps: 8,
            prescribedLoad: 135,
            prescribedLoadUnit: 'lb',
            prescribedDurationSeconds: null,
            prescribedDistance: null,
            prescribedDistanceUnit: null,
            prescribedRpe: 7,
            prescribedRir: 3,
            prescribedRestSeconds: 120,
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
            notes: 'Smooth reps',
          },
        ],
      },
    ],
  })

  assert.equal(inserted.id, 'ws-1')
  assert.equal(inserted.exercises[0].id, 'wse-1')
  assert.equal(inserted.exercises[0].sets[0].id, 'wss-1')
  assert.equal(calls.filter((call) => call.sql.includes('insert into workout_sessions')).length, 1)
  assert.equal(calls.filter((call) => call.sql.includes('insert into workout_session_exercises')).length, 1)
  assert.equal(calls.filter((call) => call.sql.includes('insert into workout_session_sets')).length, 1)
})

test('createSessionDbAdapter.getWorkoutSessionById hydrates nested execution rows', async () => {
  const { stub } = createQueryStub()
  const adapter = createSessionDbAdapter({ query: stub })

  const session = await adapter.getWorkoutSessionById('ws-1')

  assert.equal(session.id, 'ws-1')
  assert.equal(session.programWorkoutId, 'pw-1')
  assert.equal(session.exercises.length, 1)
  assert.equal(session.exercises[0].programWorkoutExerciseId, 'pwe-1')
  assert.equal(session.exercises[0].sets[0].programWorkoutSetId, 'pws-1')
  assert.equal(session.exercises[0].sets[0].prescribedLoadUnit, 'lb')
})
