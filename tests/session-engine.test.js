import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createWorkoutSession,
  completeWorkoutSet,
  canFinishWorkoutSession,
  finishWorkoutSession,
  discardWorkoutSession,
} from '../packages/core/src/index.js'

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
          {
            id: 'pws-2',
            sortOrder: 2,
            setType: 'straight',
            targetReps: 8,
            targetLoad: 145,
            targetLoadUnit: 'lb',
            targetRpe: 8,
            targetRir: 2,
            targetRestSeconds: 150,
            notes: '',
          },
        ],
      },
    ],
  }
}

test('createWorkoutSession snapshots a planned workout into execution rows', () => {
  const startedAt = '2026-04-21T20:00:00.000Z'
  const session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt,
  })

  assert.equal(session.status, 'in_progress')
  assert.equal(session.startedAt, startedAt)
  assert.equal(session.programWorkoutId, 'pw-1')
  assert.equal(session.totalExercisesCount, 1)
  assert.equal(session.totalSetsCount, 2)
  assert.equal(session.completedSetsCount, 0)
  assert.equal(session.exercises[0].programWorkoutExerciseId, 'pwe-1')
  assert.equal(session.exercises[0].sets[0].programWorkoutSetId, 'pws-1')
  assert.equal(session.exercises[0].sets[0].prescribedReps, 8)
  assert.equal(session.exercises[0].sets[0].actualReps, null)
  assert.equal(session.exercises[0].sets[0].isCompleted, false)
})

test('createWorkoutSession seeds session-level workout settings from planned workout defaults with sane fallbacks', () => {
  const session = createWorkoutSession({
    programWorkout: {
      ...buildProgramWorkout(),
      defaultRestSeconds: 180,
      autoProgressEnabled: true,
      adjustEffortAfterSet: true,
      keepAwake: null,
    },
      startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.deepEqual(session.settings, {
    defaultRestSeconds: 180,
    autoProgressEnabled: true,
    keepAwake: false,
    adjustEffortAfterSet: true,
  })
})

test('completeWorkoutSet keeps prescribed values intact and defaults actuals from plan when blank', () => {
  const session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const updated = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  const set = updated.exercises[0].sets[0]
  assert.equal(set.prescribedReps, 8)
  assert.equal(set.prescribedLoad, 135)
  assert.equal(set.actualReps, 8)
  assert.equal(set.actualLoad, 135)
  assert.equal(set.actualRpe, 7)
  assert.equal(set.actualRestSeconds, 120)
  assert.equal(set.isCompleted, true)
  assert.equal(set.completedAt, '2026-04-21T20:10:00.000Z')
  assert.equal(updated.exercises[0].status, 'active')
  assert.equal(updated.completedSetsCount, 1)
  assert.equal(updated.activeRestTimer.remainingSeconds, 120)
})

test('completeWorkoutSet respects provided actual values instead of overwriting them', () => {
  const session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const updated = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-2',
    actuals: {
      actualReps: 6,
      actualLoad: 155,
      actualRpe: 9,
      actualRestSeconds: 180,
    },
    completedAt: '2026-04-21T20:14:00.000Z',
  })

  const set = updated.exercises[0].sets[1]
  assert.equal(set.actualReps, 6)
  assert.equal(set.actualLoad, 155)
  assert.equal(set.actualRpe, 9)
  assert.equal(set.actualRestSeconds, 180)
  assert.equal(set.prescribedLoad, 145)
  assert.equal(updated.activeRestTimer.remainingSeconds, 180)
})

test('completeWorkoutSet falls back to exercise and session default rest when set rest is blank', () => {
  const baseWorkout = buildProgramWorkout()
  const sessionWithExerciseFallback = createWorkoutSession({
    programWorkout: {
      ...baseWorkout,
      exercises: [
        {
          ...baseWorkout.exercises[0],
          defaultRestSeconds: 75,
          sets: [
            {
              ...baseWorkout.exercises[0].sets[0],
              targetRestSeconds: null,
            },
          ],
        },
      ],
    },
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const exerciseFallbackSession = completeWorkoutSet({
    session: sessionWithExerciseFallback,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
  })

  assert.equal(exerciseFallbackSession.activeRestTimer.remainingSeconds, 75)

  const sessionWithWorkoutFallback = createWorkoutSession({
    programWorkout: {
      ...baseWorkout,
      defaultRestSeconds: 45,
      exercises: [
        {
          ...baseWorkout.exercises[0],
          defaultRestSeconds: null,
          sets: [
            {
              ...baseWorkout.exercises[0].sets[0],
              targetRestSeconds: null,
            },
          ],
        },
      ],
    },
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const workoutFallbackSession = completeWorkoutSet({
    session: sessionWithWorkoutFallback,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
  })

  assert.equal(workoutFallbackSession.activeRestTimer.remainingSeconds, 45)
})

test('canFinishWorkoutSession returns false for an empty session', () => {
  const session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(canFinishWorkoutSession(session), false)
})

test('completeWorkoutSet toggles a completed set back to not completed and clears the active rest timer for that set', () => {
  let session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  session = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  const toggledSession = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
  })

  assert.equal(toggledSession.completedSetsCount, 0)
  assert.equal(toggledSession.completedExercisesCount, 0)
  assert.equal(toggledSession.exercises[0].sets[0].isCompleted, false)
  assert.equal(toggledSession.exercises[0].sets[0].completedAt, null)
  assert.equal(toggledSession.activeRestTimer, null)
})

test('canFinishWorkoutSession returns true once at least one set is completed', () => {
  let session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  session = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  assert.equal(canFinishWorkoutSession(session), true)
})

test('discardWorkoutSession abandons the in-progress session and clears active timer state', () => {
  let session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  session = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  const discarded = discardWorkoutSession({
    session,
    discardedAt: '2026-04-21T20:12:00.000Z',
    elapsedSeconds: 720,
  })

  assert.equal(discarded.status, 'discarded')
  assert.equal(discarded.completedAt, '2026-04-21T20:12:00.000Z')
  assert.equal(discarded.elapsedSeconds, 720)
  assert.equal(discarded.activeRestTimer, null)
  assert.equal(discarded.completedSetsCount, 1)
  assert.equal(discarded.exercises[0].sets[0].isCompleted, true)
})

test('finishWorkoutSession finalizes counts, clears active timer, and accepts completion payload fields', () => {
  let session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  session = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  session = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-2',
    completedAt: '2026-04-21T20:15:00.000Z',
  })

  const finished = finishWorkoutSession({
    session,
    completedAt: '2026-04-21T20:30:00.000Z',
    elapsedSeconds: 1800,
    perceivedDifficulty: 7,
    notes: 'Great session',
  })

  assert.equal(finished.status, 'completed')
  assert.equal(finished.completedAt, '2026-04-21T20:30:00.000Z')
  assert.equal(finished.elapsedSeconds, 1800)
  assert.equal(finished.perceivedDifficulty, 7)
  assert.equal(finished.notes, 'Great session')
  assert.equal(finished.completedSetsCount, 2)
  assert.equal(finished.completedExercisesCount, 1)
  assert.equal(finished.activeRestTimer, null)
  assert.equal(finished.exercises[0].status, 'completed')
})
