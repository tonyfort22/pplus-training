import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mobileTabs,
  trainTabs,
  demoPreviewStates,
  createDemoProgramWorkout,
  createTrainDemoState,
  getTodaySurfaceModel,
  getWorkoutSurfaceModel,
} from '../apps/mobile/src/train/index.js'

test('train navigation matches the athlete app structure', () => {
  assert.deepEqual(
    mobileTabs.map((tab) => tab.key),
    ['train', 'progress', 'team', 'inbox']
  )

  assert.deepEqual(
    trainTabs.map((tab) => tab.key),
    ['today', 'program', 'calendar', 'workout', 'session']
  )
})

test('createTrainDemoState builds a Spotr-style today flow from planned workout data', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  assert.equal(trainState.program.name, 'Spring Hypertrophy')
  assert.equal(trainState.program.weekLabel, 'Week 3 of 8')
  assert.equal(trainState.program.selectedCalendarDayId, 'tue')
  assert.equal(trainState.program.calendarWeek.length, 7)
  assert.equal(trainState.today.workoutName, 'Lower A')
  assert.equal(trainState.today.scheduledLabel, 'Scheduled for today')
  assert.equal(trainState.session.programWorkoutId, 'pw-lower-a')
  assert.equal(trainState.session.totalSetsCount, 7)
})

test('getTodaySurfaceModel returns the quick-entry information the Train tab needs', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getTodaySurfaceModel(trainState)
  assert.equal(model.heroTitle, 'Today')
  assert.equal(model.primaryActionLabel, 'Open workout')
  assert.equal(model.programName, 'Spring Hypertrophy')
  assert.equal(model.workoutName, 'Lower A')
})

test('getWorkoutSurfaceModel summarizes planned exercises before the live session starts', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getWorkoutSurfaceModel(trainState)
  assert.equal(model.workoutName, 'Lower A')
  assert.equal(model.exerciseCount, 2)
  assert.equal(model.exercises[0].name, 'Barbell Back Squat')
  assert.equal(model.exercises[0].setCount, 4)
  assert.equal(model.exercises[1].defaultRestLabel, '2:30')
})

test('getWorkoutSurfaceModel can switch to the selected calendar day workout preview', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getWorkoutSurfaceModel(trainState, 'thu')

  assert.equal(model.workoutName, 'Upper B')
  assert.equal(model.dayLabel, 'Thu • Apr 23')
  assert.equal(model.exercises[0].name, 'Bench Press')
  assert.equal(model.exercises[0].setCount, 4)
})

test('createTrainDemoState can seed simulator preview states across the athlete session lifecycle', () => {
  const plannedState = createTrainDemoState({ previewState: 'planned' })
  const activeState = createTrainDemoState({ previewState: 'active' })
  const completedState = createTrainDemoState({ previewState: 'completed' })
  const discardedState = createTrainDemoState({ previewState: 'discarded' })

  assert.deepEqual(demoPreviewStates.map((state) => state.key), ['planned', 'active', 'completed', 'discarded'])
  assert.equal(plannedState.session.status, 'in_progress')
  assert.equal(plannedState.session.completedSetsCount, 0)
  assert.equal(activeState.session.status, 'in_progress')
  assert.equal(activeState.session.completedSetsCount, 1)
  assert.equal(completedState.session.status, 'completed')
  assert.equal(completedState.session.completedSetsCount, completedState.session.totalSetsCount)
  assert.equal(discardedState.session.status, 'discarded')
  assert.equal(discardedState.session.completedSetsCount, 1)
})
