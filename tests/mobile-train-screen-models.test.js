import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState, getCalendarSurfaceModel, getTodaySurfaceModel, getWorkoutSurfaceModel, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'

test('getTrainSurfaceModel builds Today surface cards and tab state', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'today',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  assert.equal(model.tabs.length, 5)
  assert.equal(model.tabs.find((tab) => tab.key === 'today').isActive, true)
  assert.equal(model.surface.type, 'today')
  assert.equal(model.surface.cards[0].title, 'Today')
  assert.equal(model.surface.cards[0].targetKey, 'workout')
  assert.equal(model.surface.cards[1].targetKey, 'program')
})

test('getTrainSurfaceModel builds the calendar preview surface', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  assert.equal(model.surface.type, 'calendar')
  assert.equal(model.surface.detailCard.title, 'Weekly schedule')
  assert.equal(model.surface.detailCard.targetKey, 'workout')
  assert.equal(model.surface.days[1].title, 'Tue • Lower A')
})

test('getTrainSurfaceModel builds the workout preview surface', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'workout',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  assert.equal(model.surface.type, 'workout')
  assert.equal(model.surface.detailCard.title, 'Workout detail')
  assert.equal(model.surface.detailCard.targetKey, 'session')
  assert.equal(model.surface.exerciseSectionTitle, 'Planned exercises')
  assert.equal(model.surface.exercises[0].restLabel, '3:00')
})

test('getTrainSurfaceModel passes through the active session surface', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const activeSessionModel = getActiveSessionSurfaceModel(trainState.session, 35, null)

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel,
  })

  assert.equal(model.surface.type, 'session')
  assert.equal(model.surface.session.header.title, activeSessionModel.header.title)
  assert.equal(model.surface.session.sectionTitle, 'Active workout session')
})
