import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getQuickActualUpdatePayload } from '../apps/mobile/src/train/session-actions.js'
import { updateSessionSetActuals } from '../packages/core/src/index.js'

test('session actions source keeps quick actual updates behind named action helpers', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/session-actions.js'), 'utf8')

  assert.match(source, /from '\.\.\/\.\.\/\.\.\/\.\.\/packages\/core\/src\/index\.js'/)
  assert.match(source, /export function resolveQuickActualCurrentValue\(\{ currentSet, field \}\) \{/)
  assert.match(source, /export function clampQuickActualValue\(value\) \{/)
  assert.match(source, /export function getQuickActualUpdatePayload\(\{ session, exerciseId, setId, field, delta \}\) \{[\s\S]*resolveQuickActualCurrentValue\(\{ currentSet, field \}\)/)
  assert.match(source, /export function getQuickActualUpdatePayload\(\{ session, exerciseId, setId, field, delta \}\) \{[\s\S]*clampQuickActualValue\(currentValue \+ delta\)/)

  const actionBlock = source.match(/export function getQuickActualUpdatePayload\(\{ session, exerciseId, setId, field, delta \}\) \{[\s\S]*?\n\}/)?.[0] ?? ''
  assert.doesNotMatch(actionBlock, /Number\(currentSet\[field\]/)
  assert.doesNotMatch(actionBlock, /Math\.max\(0, currentValue \+ delta\)/)
})

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
