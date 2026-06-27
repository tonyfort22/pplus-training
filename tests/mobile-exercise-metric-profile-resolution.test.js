import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  resolveMetricProfileIdFromClassification,
  resolveMetricProfileIdFromExercise,
} from '../apps/mobile/src/train/exercise-metric-profile-resolution.js'

test('exercise metric profile resolution stays centralized in a source-tested helper used by detail, active-workout, analytics, and progress seams', () => {
  const resolverSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/exercise-metric-profile-resolution.js'), 'utf8')
  const detailModelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/exercise-detail-view-models.js'), 'utf8')
  const activeWorkoutModelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/active-workout-view-models.js'), 'utf8')
  const analyticsViewSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressModelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(resolverSource, /export function normalizeClassificationValue\(value\)/)
  assert.match(resolverSource, /const EXPLICIT_METRIC_PROFILE_IDS = new Set\(\[/)
  assert.match(resolverSource, /'strength_1rm'/)
  assert.match(resolverSource, /'speed_time'/)
  assert.match(resolverSource, /'distance_load'/)
  assert.match(resolverSource, /'bodyweight_reps'/)
  assert.match(resolverSource, /'duration_hold'/)
  assert.match(resolverSource, /const STIMULUS_TYPE_TO_METRIC_PROFILE_ID = \{/)
  assert.match(resolverSource, /loaded_carry: 'distance_load'/)
  assert.match(resolverSource, /core_control: 'bodyweight_reps'/)
  assert.match(resolverSource, /const MOVEMENT_PATTERN_TO_METRIC_PROFILE_ID = \{/)
  assert.match(resolverSource, /carry: 'distance_load'/)
  assert.match(resolverSource, /function resolveMetricProfileIdFromExerciseName\(exercise = \{\}\)/)
  assert.match(resolverSource, /exercise\?\.name \|\| exercise\?\.title \|\| exercise\?\.nameSnapshot/)
  assert.match(resolverSource, /export function resolveMetricProfileIdFromClassification\(\{ stimulusType, movementPattern \} = \{\}\)/)
  assert.match(resolverSource, /return resolveMetricProfileIdFromClassification\(exercise\)\n    \|\| resolveMetricProfileIdFromExerciseName\(exercise\)/)

  for (const source of [detailModelSource, activeWorkoutModelSource, analyticsViewSource, progressModelSource]) {
    assert.match(source, /resolveMetricProfileIdFromExercise/)
    assert.doesNotMatch(source, /const EXPLICIT_METRIC_PROFILE_IDS = new Set/)
    assert.doesNotMatch(source, /const STIMULUS_TYPE_TO_METRIC_PROFILE_ID = \{/)
    assert.doesNotMatch(source, /const MOVEMENT_PATTERN_TO_METRIC_PROFILE_ID = \{/)
  }
})

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

test('exercise metric profile resolver falls back to grounded exercise-name cues for obvious bodyweight library rows when structured classification is missing', () => {
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Chin Up' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Neutral Grip Pull Up' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Explosive Push Up' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Band Resisted Push Up' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Bear Crawl Forward Backward' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Banded Slideboard Mountain Climber' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Feet Elevated Hand Plank w/ Knee Drive' }), 'bodyweight_reps')
})

test('exercise metric profile resolver falls back to grounded exercise-name cues for obvious holds library rows when structured classification is missing', () => {
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Plank' }), 'duration_hold')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Short Side Plank w/ Leg Lift' }), 'duration_hold')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Split Squat Hold' }), 'duration_hold')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Stability Ball Rollout Hold' }), 'duration_hold')
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
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Crawl Stretch' }), null)
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Feet Elevated Hand Plank w/ Knee Drive' }), 'bodyweight_reps')
  assert.equal(resolveMetricProfileIdFromExercise({ name: 'Hand Plank w/ T-Rotation' }), null)
  assert.equal(resolveMetricProfileIdFromExercise({}), null)
  assert.equal(resolveMetricProfileIdFromExercise(), null)
})
