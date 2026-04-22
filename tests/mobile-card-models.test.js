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

test('createActionCardModel preserves extra card metadata for richer variants', () => {
  const model = createActionCardModel({
    title: 'Program snapshot',
    body: 'Spring Hypertrophy, Week 3 of 8. 6 of 39 workouts completed.',
    targetKey: 'program',
    variant: 'program-summary',
    dateRangeLabel: 'Apr 5 - May 30',
    weekLabel: 'Week 3 of 8',
    completionLabel: '6 of 39 workouts',
    progressSegments: [
      { id: 'week-1', isComplete: true, isCurrent: false },
      { id: 'week-2', isComplete: true, isCurrent: false },
      { id: 'week-3', isComplete: false, isCurrent: true },
    ],
  })

  assert.equal(model.variant, 'program-summary')
  assert.equal(model.dateRangeLabel, 'Apr 5 - May 30')
  assert.equal(model.weekLabel, 'Week 3 of 8')
  assert.equal(model.completionLabel, '6 of 39 workouts')
  assert.equal(model.progressSegments[2].isCurrent, true)
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
