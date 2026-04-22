import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createTrainDemoState,
  createDemoProgramWorkout,
} from '../apps/mobile/src/train/index.js'
import {
  getRestTimerModel,
  getSessionExerciseModels,
  getSessionHeaderModel,
} from '../apps/mobile/src/train/session-models.js'
import { completeWorkoutSet, findSessionSet } from '../packages/core/src/index.js'

test('getSessionHeaderModel summarizes workout progress for the active session surface', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getSessionHeaderModel(trainState.session, 35)
  assert.equal(model.title, 'Lower A')
  assert.equal(model.finishLabel, 'Finish')
  assert.equal(model.workoutTimerLabel, '00:00:35')
  assert.equal(model.progressLabel, '0/7 sets, 0/2 exercises')
  assert.equal(model.progressPercent, 0)
})

test('getRestTimerModel returns null until a set completion starts a timer', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(getRestTimerModel(trainState.session, null), null)

  const completedSession = completeWorkoutSet({
    session: trainState.session,
    exerciseId: 'pwe-squat',
    setId: 'pws-squat-1',
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  const selectedSet = findSessionSet(completedSession, 'pwe-squat', 'pws-squat-1')
  const model = getRestTimerModel(completedSession, selectedSet)
  assert.equal(model.eyebrow, 'Rest timer')
  assert.equal(model.title, 'Between completed sets')
  assert.equal(model.clockLabel, '03:00')
})

test('getSessionExerciseModels formats exercise and set presentation cleanly', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const models = getSessionExerciseModels(trainState.session)
  assert.equal(models.length, 2)
  assert.equal(models[0].title, 'Barbell Back Squat')
  assert.equal(models[0].restLabel, '03:00')
  assert.equal(models[0].sets[0].title, 'Set 1')
  assert.match(models[0].sets[0].prescribedLabel, /120 lb x 8 reps/)
  assert.equal(models[0].sets[0].completionLabel, 'Tap left side to complete')
})
