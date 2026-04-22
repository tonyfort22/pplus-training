import test from 'node:test'
import assert from 'node:assert/strict'
import { createActionCardModel, createMetricCardModel } from '../apps/mobile/src/ui/card-models.js'

test('createActionCardModel builds a reusable action card descriptor', () => {
  const model = createActionCardModel({
    title: 'Today',
    body: 'Open the athlete workout for today.',
    actionLabel: 'Open workout',
    targetKey: 'workout',
  })

  assert.equal(model.title, 'Today')
  assert.equal(model.body, 'Open the athlete workout for today.')
  assert.equal(model.actionLabel, 'Open workout')
  assert.equal(model.targetKey, 'workout')
})

test('createMetricCardModel keeps metric card fields stable for rendering', () => {
  const model = createMetricCardModel({
    label: 'Weekly load',
    value: '78',
    detail: 'Current training load score based on completed sessions',
  })

  assert.deepEqual(model, {
    label: 'Weekly load',
    value: '78',
    detail: 'Current training load score based on completed sessions',
  })
})
