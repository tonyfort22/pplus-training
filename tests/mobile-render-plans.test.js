import test from 'node:test'
import assert from 'node:assert/strict'
import { getProgressSurfaceModel, getPlaceholderSurfaceModel } from '../apps/mobile/src/progress/index.js'
import { getProgressSections, getPlaceholderSections } from '../apps/mobile/src/screens/surface-sections.js'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getSessionSections } from '../apps/mobile/src/screens/session-sections.js'
import { getGenericSectionRenderPlan, getSessionSectionRenderPlan } from '../apps/mobile/src/screens/render-plans.js'

test('getGenericSectionRenderPlan normalizes progress and placeholder sections into render items', () => {
  const progressPlan = getGenericSectionRenderPlan(getProgressSections(getProgressSurfaceModel()))
  const placeholderPlan = getGenericSectionRenderPlan(
    getPlaceholderSections(getPlaceholderSurfaceModel('Inbox', 'Messages and reminders later.'))
  )

  assert.equal(progressPlan[0].type, 'header-card')
  assert.equal(progressPlan[1].type, 'metrics-grid')
  assert.equal(progressPlan[2].type, 'body-card')
  assert.equal(progressPlan[3].type, 'body-card')
  assert.equal(placeholderPlan[0].title, 'Inbox')
})

test('getSessionSectionRenderPlan normalizes active session sections into render items', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const sessionSections = getSessionSections(getActiveSessionSurfaceModel(trainState.session, 35, null))
  const plan = getSessionSectionRenderPlan(sessionSections)

  assert.equal(plan[0].type, 'session-header')
  assert.equal(plan[1].type, 'session-exercise-list')
  assert.equal(plan[1].exercises[0].title, 'Barbell Back Squat')
  assert.equal(plan[1].exercises[0].sets[0].loadControl.value, 120)
})
