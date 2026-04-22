import test from 'node:test'
import assert from 'node:assert/strict'
import { getPlaceholderSurfaceModel, getProgressSurfaceModel } from '../apps/mobile/src/progress/index.js'

test('getProgressSurfaceModel returns the athlete analytics surface structure', () => {
  const model = getProgressSurfaceModel()

  assert.equal(model.header.eyebrow, 'Progress')
  assert.equal(model.header.title, 'Performance & recovery')
  assert.equal(model.metrics.length, 3)
  assert.equal(model.metrics[0].label, 'Back Squat est. 1RM')
  assert.equal(model.trainingLoad.title, 'Training load')
  assert.equal(model.muscleFatigue.rows.length, 3)
  assert.equal(model.performanceSnapshots.title, 'Performance snapshots')
})

test('getPlaceholderSurfaceModel keeps placeholder screens consistent', () => {
  const model = getPlaceholderSurfaceModel('Inbox', 'This surface will hold communication later.')

  assert.deepEqual(model, {
    title: 'Inbox',
    body: 'This surface will hold communication later.',
  })
})
