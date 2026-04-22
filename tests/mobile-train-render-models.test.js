import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState, getCalendarSurfaceModel, getTodaySurfaceModel, getWorkoutSurfaceModel, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'
import { getSessionSections } from '../apps/mobile/src/screens/session-sections.js'
import { getTrainRenderModel } from '../apps/mobile/src/train/train-render-models.js'

test('getTrainRenderModel builds action-card sections for Today', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'today',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(getActiveSessionSurfaceModel(trainState.session, 35, null)),
  })

  assert.equal(renderModel.tabs.length, 5)
  assert.equal(renderModel.content.type, 'sections')
  assert.equal(renderModel.content.sections.length, 2)
  assert.equal(renderModel.content.sections[0].type, 'action-card')
  assert.equal(renderModel.content.sections[0].targetKey, 'workout')
})

test('getTrainRenderModel builds a list section for the weekly calendar', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, 'thu'),
    workoutModel: getWorkoutSurfaceModel(trainState, 'thu'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(getActiveSessionSurfaceModel(trainState.session, 35, null)),
  })

  assert.equal(renderModel.content.sections[0].type, 'action-card')
  assert.equal(renderModel.content.sections[0].actionPayload.selectedDayId, 'thu')
  assert.equal(renderModel.content.sections[1].type, 'body-list')
  assert.equal(renderModel.content.sections[1].title, 'This week')
  assert.equal(renderModel.content.sections[1].rows[3].title, 'Thu • Upper B')
  assert.equal(renderModel.content.sections[1].rows[3].isSelected, true)
  assert.equal(renderModel.content.sections[1].rows[3].actionPayload.selectedDayId, 'thu')
})

test('getTrainRenderModel includes a list section for Workout', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'workout',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(getActiveSessionSurfaceModel(trainState.session, 35, null)),
  })

  assert.equal(renderModel.content.sections[0].type, 'action-card')
  assert.equal(renderModel.content.sections[1].type, 'body-list')
  assert.equal(renderModel.content.sections[1].title, 'Planned exercises')
  assert.equal(renderModel.content.sections[1].rows[0].title, 'Barbell Back Squat')
})

test('getTrainRenderModel passes through session sections for the session tab', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const activeSessionModel = getActiveSessionSurfaceModel(trainState.session, 35, null)
  const sessionSections = getSessionSections(activeSessionModel)
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel,
  })

  const renderModel = getTrainRenderModel({ trainSurfaceModel, sessionSections })

  assert.equal(renderModel.content.type, 'session-sections')
  assert.equal(renderModel.content.sections, sessionSections)
})
