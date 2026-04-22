import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState, getCalendarSurfaceModel, getTodaySurfaceModel, getWorkoutSurfaceModel, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'
import { getSessionSections } from '../apps/mobile/src/screens/session-sections.js'
import { getTrainRenderModel } from '../apps/mobile/src/train/train-render-models.js'

test('getTrainRenderModel builds the stacked train-home sections for the barbell view', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, 'wed'),
    workoutModel: getWorkoutSurfaceModel(trainState, 'wed'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(getActiveSessionSurfaceModel(trainState.session, 35, null)),
  })

  assert.equal(renderModel.tabs.length, 5)
  assert.equal(renderModel.showTabs, false)
  assert.equal(renderModel.content.type, 'sections')
  assert.equal(renderModel.content.sections.length, 7)
  assert.equal(renderModel.content.sections[0].type, 'calendar-strip')
  assert.equal(renderModel.content.sections[0].title, undefined)
  assert.equal(renderModel.content.sections[0].days[3].weekdayLabel, 'WED')
  assert.equal(renderModel.content.sections[0].days[3].isSelected, true)
  assert.equal(renderModel.content.sections[1].type, 'section-heading')
  assert.equal(renderModel.content.sections[1].title, 'Wed • Apr 22')
  assert.equal(renderModel.content.sections[2].type, 'action-card')
  assert.equal(renderModel.content.sections[2].variant, 'today-summary')
  assert.equal(renderModel.content.sections[2].title, undefined)
  assert.equal(renderModel.content.sections[2].workoutName, 'Recovery + mobility')
  assert.equal(renderModel.content.sections[2].scheduledLabel, 'Upcoming')
  assert.equal(renderModel.content.sections[3].type, 'section-heading')
  assert.equal(renderModel.content.sections[3].title, 'My Programs')
  assert.equal(renderModel.content.sections[4].type, 'action-card')
  assert.equal(renderModel.content.sections[4].variant, 'program-summary')
  assert.equal(renderModel.content.sections[4].title, undefined)
  assert.equal(renderModel.content.sections[5].type, 'section-heading')
  assert.equal(renderModel.content.sections[5].title, 'My Workouts')
  assert.equal(renderModel.content.sections[6].type, 'body-list')
  assert.equal(renderModel.content.sections[6].title, undefined)
  assert.equal(renderModel.content.sections[6].rows[0].title, 'Upper A')
})

test('getTrainRenderModel keeps the selected-date workout card in sync with the active session state', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const activeSessionModel = getActiveSessionSurfaceModel(trainState.session, 35, null)
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'today',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, 'tue'),
    workoutModel: getWorkoutSurfaceModel(trainState, 'tue'),
    activeSessionModel,
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(activeSessionModel),
  })

  assert.equal(renderModel.content.sections[1].type, 'section-heading')
  assert.equal(renderModel.content.sections[1].title, 'Tue • Apr 21')
  assert.equal(renderModel.content.sections[2].type, 'action-card')
  assert.equal(renderModel.content.sections[2].variant, 'today-summary')
  assert.equal(renderModel.content.sections[2].workoutName, 'Lower A')
  assert.equal(renderModel.content.sections[2].targetKey, 'workout')
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

  assert.equal(renderModel.showTabs, true)
  assert.equal(renderModel.content.type, 'session-sections')
  assert.equal(renderModel.content.sections, sessionSections)
})
