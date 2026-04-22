import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWorkoutSet, finishWorkoutSession } from '../packages/core/src/index.js'
import { createDemoProgramWorkout, createTrainDemoState, getCalendarSurfaceModel, getTodaySurfaceModel, getWorkoutSurfaceModel, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'

test('getTrainSurfaceModel builds one stacked train-home surface for the barbell view', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, 'thu'),
    workoutModel: getWorkoutSurfaceModel(trainState, 'thu'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  assert.equal(model.tabs.length, 5)
  assert.equal(model.tabs.find((tab) => tab.key === 'calendar').isActive, true)
  assert.equal(model.surface.type, 'train-home')
  assert.equal(model.surface.calendarStripTitle, undefined)
  assert.equal(model.surface.calendarStripDays[3].weekdayLabel, 'THU')
  assert.equal(model.surface.calendarStripDays[3].dateNumber, '23')
  assert.equal(model.surface.calendarStripDays[3].isSelected, true)
  assert.equal(model.surface.selectedWorkoutHeading, 'Thu • Apr 23')
  assert.equal(model.surface.selectedWorkoutCard.variant, 'today-summary')
  assert.equal(model.surface.selectedWorkoutCard.title, undefined)
  assert.equal(model.surface.selectedWorkoutCard.workoutName, 'Upper B')
  assert.equal(model.surface.selectedWorkoutCard.scheduledLabel, 'Upcoming')
  assert.equal(model.surface.selectedWorkoutCard.targetKey, 'workout')
  assert.equal(model.surface.programSectionTitle, 'My Programs')
  assert.equal(model.surface.programCard.variant, 'program-summary')
  assert.equal(model.surface.programCard.title, undefined)
  assert.equal(model.surface.programCard.programName, 'Spring Hypertrophy')
  assert.equal(model.surface.workoutListTitle, 'My Workouts')
  assert.equal(model.surface.workoutListRows[0].title, 'Upper A')
  assert.match(model.surface.workoutListRows[0].body, /Mon • Apr 20/)
})

test('getTrainSurfaceModel keeps the selected-date workout card aligned with the current session state', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const startedSession = completeWorkoutSet({
    session: trainState.session,
    exerciseId: trainState.session.exercises[0].id,
    setId: trainState.session.exercises[0].sets[0].id,
  })

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'today',
    todayModel: getTodaySurfaceModel({ ...trainState, session: startedSession }),
    calendarModel: getCalendarSurfaceModel({ ...trainState, session: startedSession }, 'tue'),
    workoutModel: getWorkoutSurfaceModel({ ...trainState, session: startedSession }, 'tue'),
    activeSessionModel: getActiveSessionSurfaceModel(startedSession, 35, null),
  })

  assert.equal(model.surface.type, 'train-home')
  assert.equal(model.surface.selectedWorkoutCard.actionLabel, 'Resume session')
  assert.equal(model.surface.selectedWorkoutCard.scheduledLabel, 'Scheduled for today')
  assert.equal(model.surface.selectedWorkoutCard.summaryLabel, 'Scheduled for today')
  assert.equal(model.surface.selectedWorkoutCard.statusLabel, undefined)
  assert.equal(model.surface.selectedWorkoutCard.targetKey, 'session')
  assert.equal(model.surface.calendarStripDays[1].targetKey, 'session')
  assert.equal(model.surface.calendarStripDays[1].indicatorTone, 'active')
})

test('getTrainSurfaceModel keeps completed today inside the train-home view while exposing the session summary action', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const finishedSession = finishWorkoutSession({ session: trainState.session, completedAt: '2026-04-21T21:00:00.000Z', elapsedSeconds: 1800 })

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel({ ...trainState, session: finishedSession }),
    calendarModel: getCalendarSurfaceModel({ ...trainState, session: finishedSession }, 'tue'),
    workoutModel: getWorkoutSurfaceModel({ ...trainState, session: finishedSession }, 'tue'),
    activeSessionModel: getActiveSessionSurfaceModel(finishedSession, 35, null),
  })

  assert.equal(model.surface.type, 'train-home')
  assert.equal(model.surface.selectedWorkoutCard.actionLabel, 'View completed session')
  assert.equal(model.surface.selectedWorkoutCard.targetKey, 'session')
})

test('getTrainSurfaceModel keeps the workout tab inside the same train-home surface', () => {
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

  assert.equal(model.surface.type, 'train-home')
  assert.equal(model.surface.selectedWorkoutCard.variant, 'today-summary')
  assert.equal(model.surface.programCard.variant, 'program-summary')
  assert.equal(model.surface.workoutListRows[0].title, 'Upper A')
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
