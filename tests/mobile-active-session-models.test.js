import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { completeWorkoutSet, findSessionSet } from '../packages/core/src/index.js'

function buildAllSetsLoggedSession() {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  let session = trainState.session
  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      session = completeWorkoutSet({
        session,
        exerciseId: exercise.id,
        setId: set.id,
      })
    }
  }

  return session
}

test('getActiveSessionSurfaceModel builds the session surface for an in-progress workout', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getActiveSessionSurfaceModel(trainState.session, 35, null)

  assert.equal(model.header.title, 'Lower A')
  assert.equal(model.header.finishLabel, 'Finish')
  assert.equal(model.header.discardLabel, 'Discard session')
  assert.equal(model.header.nextUpLabel, 'Next up: Barbell Back Squat Set 1 • 120 lb x 8')
  assert.equal(model.header.progressLabel, '0/7 sets, 0/2 exercises')
  assert.equal(model.restTimer, null)
  assert.equal(model.sectionTitle, 'Active workout session')
  assert.equal(model.exercises.length, 2)
  assert.equal(model.exercises[0].sets[0].completionLabel, 'Ready now')
  assert.equal(model.exercises[0].sets[0].loadControl.label, 'Load')
  assert.equal(model.exercises[0].sets[0].loadControl.decrementLabel, '-')
  assert.equal(model.exercises[0].sets[0].repsControl.incrementLabel, '+')
})

test('getActiveSessionSurfaceModel includes the rest timer after a set is completed', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const completedSession = completeWorkoutSet({
    session: trainState.session,
    exerciseId: 'pwe-squat',
    setId: 'pws-squat-1',
    completedAt: '2026-04-21T20:10:00.000Z',
  })
  const selectedSet = findSessionSet(completedSession, 'pwe-squat', 'pws-squat-1')

  const model = getActiveSessionSurfaceModel(completedSession, 90, selectedSet)

  assert.equal(model.restTimer.title, 'Between completed sets')
  assert.equal(model.restTimer.dismissLabel, 'Dismiss')
  assert.equal(model.restTimer.minusLabel, '-15s')
  assert.equal(model.restTimer.plusLabel, '+15s')
  assert.equal(model.header.nextUpLabel, 'Next up: Barbell Back Squat Set 2 • 120 lb x 8')
  assert.equal(model.exercises[0].sets[0].completionLabel, 'Done')
  assert.equal(model.exercises[0].sets[1].completionLabel, 'Ready now')
})

test('getActiveSessionSurfaceModel shifts to a ready-to-wrap state once every set is logged', () => {
  const session = buildAllSetsLoggedSession()

  const model = getActiveSessionSurfaceModel(session, 1800, null)

  assert.equal(model.header.finishLabel, 'View summary')
  assert.equal(model.header.nextUpLabel, 'All sets logged. Finish to open the session summary.')
  assert.equal(model.header.progressLabel, '7/7 sets, 2/2 exercises')
})

