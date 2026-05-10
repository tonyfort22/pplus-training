import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveMetricProfileIdFromClassification,
  resolveMetricProfileIdFromExercise,
} from '../apps/mobile/src/train/exercise-metric-profile-resolution.js'

test('exercise metric profile resolver maps explicit recognized metricProfileId values', () => {
  assert.equal(resolveMetricProfileIdFromExercise({ metricProfileId: 'strength_1rm' }), 'strength_1rm')
  assert.equal(resolveMetricProfileIdFromExercise({ metricProfileId: ' speed_time ' }), 'speed_time')
  assert.equal(resolveMetricProfileIdFromExercise({ metricProfileId: 'BODYWEIGHT-REPS' }), 'bodyweight_reps')
})

test('exercise metric profile resolver gives explicit recognized metricProfileId precedence over classification', () => {
  assert.equal(resolveMetricProfileIdFromExercise({ metricProfileId: 'duration_hold', stimulusType: 'speed', movementPattern: 'run' }), 'duration_hold')
})

test('exercise metric profile resolver maps known stimulusType classifications deterministically', () => {
  assert.equal(resolveMetricProfileIdFromClassification({ stimulusType: 'strength' }), 'strength_1rm')
  assert.equal(resolveMetricProfileIdFromClassification({ stimulusType: 'speed' }), 'speed_time')
  assert.equal(resolveMetricProfileIdFromClassification({ stimulusType: 'loaded-carry' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromClassification({ stimulusType: 'bodyweight' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromClassification({ stimulusType: 'isometric' }), 'duration_hold')
})

test('exercise metric profile resolver maps known movementPattern classifications deterministically', () => {
  assert.equal(resolveMetricProfileIdFromClassification({ movementPattern: 'run' }), 'speed_time')
  assert.equal(resolveMetricProfileIdFromClassification({ movementPattern: 'sprint' }), 'speed_time')
  assert.equal(resolveMetricProfileIdFromClassification({ movementPattern: 'carry' }), 'distance_load')
})

test('exercise metric profile resolver preserves current classification normalization behavior', () => {
  assert.equal(resolveMetricProfileIdFromClassification({ stimulusType: 'Loaded Carry' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromClassification({ stimulusType: 'core-control' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromClassification({ movementPattern: ' Sprint ' }), 'speed_time')
})

test('exercise metric profile resolver falls back to grounded exercise-name cues for obvious speed library rows when structured classification is missing', () => {
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Sprint [1/2 Kneel Start]' }), 'speed_time')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Tempo Run' }), 'speed_time')
  assert.equal(resolveMetricProfileIdFromExercise({ title: 'Sprint [2-Point Start]' }), 'speed_time')
  assert.equal(resolveMetricProfileIdFromExercise({ nameSnapshot: 'Heavy Spin Bike Sprint' }), 'speed_time')
})

test('exercise metric profile resolver falls back to grounded exercise-name cues for obvious strength library rows when structured classification is missing', () => {
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Front Squat' }), 'strength_1rm')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Trap Bar Deadlift' }), 'strength_1rm')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Barbell Bench Press' }), 'strength_1rm')
})

test('exercise metric profile resolver falls back to grounded exercise-name cues for obvious loaded-carry library rows when structured classification is missing', () => {
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Farmer Carry' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Heavy Sled Push Forward' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'DB Walking Lunge' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Linear March' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Straight Leg March' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Hurdle Walk Forward' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Hurdle Walk Backward' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Sled Sprint' }), 'speed_time')
})

test('exercise metric profile resolver returns null for unknown or missing values when no explicit recognized metricProfileId exists', () => {
  assert.equal(resolveMetricProfileIdFromExercise({ metricProfileId: 'tempo_based', stimulusType: 'coordination', movementPattern: 'rotation' }), null)
  assert.equal(resolveMetricProfileIdFromExercise({ stimulusType: 'coordination' }), null)
  assert.equal(resolveMetricProfileIdFromExercise({ movementPattern: 'rotation' }), null)
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Wall March Hold' }), 'distance_load')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Warmup Walkthrough' }), null)
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Marching A-Skip' }), null)
  assert.equal(resolveMetricProfileIdFromExercise({}), null)
  assert.equal(resolveMetricProfileIdFromExercise(), null)
})
