import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getSessionSections } from '../apps/mobile/src/screens/session-sections.js'
import { completeWorkoutSet, findSessionSet } from '../packages/core/src/index.js'

test('getSessionSections converts an in-progress active session model into renderable sections', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const activeSessionModel = getActiveSessionSurfaceModel(trainState.session, 35, null)
  const sections = getSessionSections(activeSessionModel)

  assert.equal(sections.length, 2)
  assert.equal(sections[0].type, 'session-header')
  assert.equal(sections[0].finishLabel, 'Finish')
  assert.equal(sections[0].nextUpLabel, 'Next up: Barbell Back Squat Set 1 • 120 lb x 8')
  assert.equal(sections[1].type, 'session-exercise-list')
  assert.equal(sections[1].title, 'Active workout session')
  assert.equal(sections[1].exercises.length, 2)
  assert.equal(sections[1].exercises[0].sets[0].loadControl.value, 120)
})

test('getSessionSections includes a rest timer section when present', () => {
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
  const activeSessionModel = getActiveSessionSurfaceModel(completedSession, 90, selectedSet)
  const sections = getSessionSections(activeSessionModel)

  assert.equal(sections.length, 3)
  assert.equal(sections[1].type, 'rest-timer')
  assert.equal(sections[1].title, 'Between completed sets')
  assert.equal(sections[1].dismissLabel, 'Dismiss')
  assert.equal(sections[2].exercises[0].sets[0].completionLabel, 'Done')
})
