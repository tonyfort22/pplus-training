import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getQuickActualUpdatePayload } from '../apps/mobile/src/train/session-actions.js'
import { updateSessionSetActuals } from '../packages/core/src/index.js'

test('getQuickActualUpdatePayload starts from prescribed values when actuals are blank', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const payload = getQuickActualUpdatePayload({
    session: trainState.session,
    exerciseId: 'pwe-squat',
    setId: 'pws-squat-1',
    field: 'actualLoad',
    delta: 5,
  })

  assert.deepEqual(payload, { actualLoad: 125 })
})

test('getQuickActualUpdatePayload uses current actual values once they exist', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const updatedSession = updateSessionSetActuals(trainState.session, 'pwe-squat', 'pws-squat-1', {
    actualReps: 10,
  })

  const payload = getQuickActualUpdatePayload({
    session: updatedSession,
    exerciseId: 'pwe-squat',
    setId: 'pws-squat-1',
    field: 'actualReps',
    delta: -2,
  })

  assert.deepEqual(payload, { actualReps: 8 })
})

test('getQuickActualUpdatePayload clamps values at zero and returns null for missing sets', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const clampedPayload = getQuickActualUpdatePayload({
    session: trainState.session,
    exerciseId: 'pwe-squat',
    setId: 'pws-squat-1',
    field: 'actualReps',
    delta: -99,
  })
  const missingPayload = getQuickActualUpdatePayload({
    session: trainState.session,
    exerciseId: 'missing',
    setId: 'missing',
    field: 'actualLoad',
    delta: 5,
  })

  assert.deepEqual(clampedPayload, { actualReps: 0 })
  assert.equal(missingPayload, null)
})
