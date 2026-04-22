import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWorkoutSet, finishWorkoutSession } from '../packages/core/src/index.js'
import { createDemoProgramWorkout, createTrainDemoState, getTodaySurfaceModel, getWorkoutSurfaceModel, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getCompletedSessionSurfaceModel } from '../apps/mobile/src/train/completed-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'
import { getTrainRenderModel } from '../apps/mobile/src/train/train-render-models.js'

function buildCompletedSession() {
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

  return {
    trainState,
    session: finishWorkoutSession({
      session,
      completedAt: '2026-04-21T20:30:00.000Z',
      elapsedSeconds: 1800,
    }),
  }
}

test('getCompletedSessionSurfaceModel builds a post-workout summary from actual completed work', () => {
  const { session } = buildCompletedSession()

  const model = getCompletedSessionSurfaceModel(session)

  assert.equal(model.header.title, 'Session complete')
  assert.match(model.header.body, /Lower A/)
  assert.equal(model.metrics[0].label, 'Duration')
  assert.equal(model.metrics[0].value, '00:30:00')
  assert.equal(model.metrics[2].label, 'Adherence')
  assert.equal(model.metrics[2].value, '100%')
  assert.equal(model.exerciseResults.title, 'Logged exercises')
  assert.match(model.exerciseResults.rows[0].body, /4\/4 sets completed/)
  assert.equal(model.nextAction.actionLabel, 'Back to today')
  assert.equal(model.nextAction.targetKey, 'today')
})

test('getTrainSurfaceModel switches the session tab to a completed-session surface once the workout is finished', () => {
  const { trainState, session } = buildCompletedSession()
  const completedSessionModel = getCompletedSessionSurfaceModel(session)

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(session, 1800, null),
    completedSessionModel,
  })

  assert.equal(model.surface.type, 'completed-session')
  assert.equal(model.surface.summary.header.title, 'Session complete')
})

test('getTrainRenderModel converts a completed-session surface into summary sections', () => {
  const { trainState, session } = buildCompletedSession()
  const completedSessionModel = getCompletedSessionSurfaceModel(session)
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(session, 1800, null),
    completedSessionModel,
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: [],
  })

  assert.equal(renderModel.content.type, 'sections')
  assert.equal(renderModel.content.sections[0].type, 'header-card')
  assert.equal(renderModel.content.sections[1].type, 'metrics-grid')
  assert.equal(renderModel.content.sections[2].type, 'body-list')
  assert.equal(renderModel.content.sections[3].type, 'action-card')
  assert.equal(renderModel.content.sections[3].targetKey, 'today')
})
