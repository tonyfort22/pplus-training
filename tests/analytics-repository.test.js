import test from 'node:test'
import assert from 'node:assert/strict'

import { createAnalyticsRepository } from '../packages/data/src/analytics/index.js'
import { createWorkoutSession, completeWorkoutSet, finishWorkoutSession, discardWorkoutSession } from '../packages/core/src/index.js'

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
        defaultRestSeconds: 120,
        fatigueMultiplier: 1.2,
        bodyRegion: 'lower',
        muscleTargets: [
          { muscleId: 'quads', percent: 0.5 },
          { muscleId: 'glutes', percent: 0.3 },
          { muscleId: 'core', percent: 0.2 },
        ],
        sets: [
          {
            id: 'pws-1',
            sortOrder: 1,
            setType: 'straight',
            targetReps: 8,
            targetLoad: 135,
            targetLoadUnit: 'lb',
            targetRpe: 7,
            targetRestSeconds: 120,
          },
          {
            id: 'pws-2',
            sortOrder: 2,
            setType: 'straight',
            targetReps: 6,
            targetLoad: 155,
            targetLoadUnit: 'lb',
            targetRpe: 8,
            targetRestSeconds: 150,
          },
        ],
      },
    ],
  }
}

test('createAnalyticsRepository builds completed-session analytics payloads from actual completed sets only', () => {
  let session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  session = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
    actuals: { actualLoad: 145, actualReps: 8, actualRpe: 8 },
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  const finished = finishWorkoutSession({
    session,
    completedAt: '2026-04-21T20:30:00.000Z',
    elapsedSeconds: 1800,
  })

  const repository = createAnalyticsRepository({})
  const payload = repository.buildCompletedSessionAnalyticsPayload(finished)

  assert.equal(payload.sessionId, finished.id)
  assert.equal(payload.exercisePerformanceSnapshots.length, 1)
  assert.equal(payload.exercisePerformanceSnapshots[0].exerciseId, 'ex-1')
  assert.equal(payload.exercisePerformanceSnapshots[0].sets, 1)
  assert.equal(payload.exercisePerformanceSnapshots[0].load, 145)
  assert.equal(payload.exercisePerformanceSnapshots[0].reps, 8)
  assert.equal(payload.exercisePerformanceSnapshots[0].estimatedOneRepMax, 183.7)
  assert.deepEqual(payload.sessionLoadSummary, {
    athleteId: 'ath-1',
    workoutSessionId: 'pw-1',
    completedSets: 1,
    completedReps: 8,
    volumeLoad: 1160,
    effortAdjustedLoad: 1276,
    sessionDifficulty: null,
    logDate: '2026-04-21',
  })
  assert.equal(payload.muscleLoadEvents.length, 3)
  assert.deepEqual(payload.muscleLoadEvents.map((event) => ({ muscleId: event.muscleId, score: event.score })), [
    { muscleId: 'quads', score: 765.6 },
    { muscleId: 'glutes', score: 459.4 },
    { muscleId: 'core', score: 306.2 },
  ])
})

test('createAnalyticsRepository persists completed-session analytics through a structured db contract when available', async () => {
  let session = createWorkoutSession({
    programWorkout: buildProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  session = completeWorkoutSet({
    session,
    exerciseId: 'pwe-1',
    setId: 'pws-1',
    actuals: { actualLoad: 145, actualReps: 8, actualRpe: 8 },
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  const finished = finishWorkoutSession({
    session,
    completedAt: '2026-04-21T20:30:00.000Z',
    elapsedSeconds: 1800,
    perceivedDifficulty: 7,
  })

  const persisted = {
    sessionLoadSummary: null,
    exercisePerformanceSnapshots: null,
    muscleLoadEvents: null,
  }

  const repository = createAnalyticsRepository({
    async saveSessionLoadSummary(summary) {
      persisted.sessionLoadSummary = summary
      return summary
    },
    async saveExercisePerformanceSnapshots(rows) {
      persisted.exercisePerformanceSnapshots = rows
      return rows
    },
    async saveMuscleLoadEvents(rows) {
      persisted.muscleLoadEvents = rows
      return rows
    },
  })

  const result = await repository.persistCompletedSessionAnalytics(finished)

  assert.equal(persisted.sessionLoadSummary.workoutSessionId, finished.id)
  assert.equal(persisted.sessionLoadSummary.sessionDifficulty, 7)
  assert.equal(persisted.exercisePerformanceSnapshots.length, 1)
  assert.equal(persisted.exercisePerformanceSnapshots[0].exerciseId, 'ex-1')
  assert.equal(persisted.muscleLoadEvents.length, 3)
  assert.equal(result.sessionLoadSummary.workoutSessionId, finished.id)
  assert.equal(result.exercisePerformanceSnapshots.length, 1)
  assert.equal(result.muscleLoadEvents.length, 3)
})

test('createAnalyticsRepository returns null analytics payload for discarded sessions', () => {
  const session = discardWorkoutSession({
    session: createWorkoutSession({
      programWorkout: buildProgramWorkout(),
      startedAt: '2026-04-21T20:00:00.000Z',
    }),
    discardedAt: '2026-04-21T20:12:00.000Z',
    elapsedSeconds: 720,
  })

  const repository = createAnalyticsRepository({})
  assert.equal(repository.buildCompletedSessionAnalyticsPayload(session), null)
})
