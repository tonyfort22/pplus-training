import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWorkoutSet, discardWorkoutSession } from '../packages/core/src/index.js'
import { createDemoProgramWorkout, createTrainDemoState, getTodaySurfaceModel, getWorkoutSurfaceModel, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getDiscardedSessionSurfaceModel } from '../apps/mobile/src/train/discarded-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'
import { getTrainRenderModel } from '../apps/mobile/src/train/train-render-models.js'

function buildDiscardedSession() {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const partialSession = completeWorkoutSet({
    session: trainState.session,
    exerciseId: 'pwe-squat',
    setId: 'pws-squat-1',
    completedAt: '2026-04-21T20:10:00.000Z',
  })

  return {
    trainState,
    session: discardWorkoutSession({
      session: partialSession,
      discardedAt: '2026-04-21T20:12:00.000Z',
      elapsedSeconds: 720,
    }),
  }
}

test('getDiscardedSessionSurfaceModel builds an abandoned workout summary with reset action', () => {
  const { session } = buildDiscardedSession()

  const model = getDiscardedSessionSurfaceModel(session)

  assert.equal(model.header.title, 'Session discarded')
  assert.match(model.header.body, /Lower A/)
  assert.equal(model.metrics[0].label, 'Time invested')
  assert.equal(model.metrics[0].value, '00:12:00')
  assert.equal(model.metrics[1].label, 'Sets logged')
  assert.equal(model.metrics[1].value, '1/7')
  assert.equal(model.metrics[2].label, 'Result')
  assert.equal(model.metrics[2].value, 'Not saved')
  assert.equal(model.highlights.title, 'Discard recap')
  assert.equal(model.highlights.rows[0].title, 'Outcome')
  assert.match(model.highlights.rows[0].body, /will not feed analytics/)
  assert.equal(model.highlights.rows[1].title, 'Work logged')
  assert.match(model.highlights.rows[1].body, /1\/7 sets/)
  assert.equal(model.nextAction.actionLabel, 'Back to today')
  assert.equal(model.nextAction.targetKey, 'today')
})

test('getTrainSurfaceModel switches the session tab to a discarded-session surface once the workout is abandoned', () => {
  const { trainState, session } = buildDiscardedSession()
  const discardedSessionModel = getDiscardedSessionSurfaceModel(session)

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(session, 720, null),
    discardedSessionModel,
  })

  assert.equal(model.surface.type, 'discarded-session')
  assert.equal(model.surface.summary.header.title, 'Session discarded')
})

test('getTrainRenderModel converts a discarded-session surface into reset sections', () => {
  const { trainState, session } = buildDiscardedSession()
  const discardedSessionModel = getDiscardedSessionSurfaceModel(session)
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(session, 720, null),
    discardedSessionModel,
  })

  const renderModel = getTrainRenderModel({ trainSurfaceModel, sessionSections: [] })

  assert.equal(renderModel.content.type, 'sections')
  assert.equal(renderModel.content.sections[0].type, 'header-card')
  assert.equal(renderModel.content.sections[1].type, 'metrics-grid')
  assert.equal(renderModel.content.sections[2].type, 'body-list')
  assert.equal(renderModel.content.sections[2].title, 'Discard recap')
  assert.equal(renderModel.content.sections[3].type, 'action-card')
  assert.equal(renderModel.content.sections[3].targetKey, 'today')
})
