import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWorkoutSet, finishWorkoutSession } from '../packages/core/src/index.js'
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

test('getTrainSurfaceModel routes Today directly to session when a workout is already in progress', () => {
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
    calendarModel: getCalendarSurfaceModel({ ...trainState, session: startedSession }),
    workoutModel: getWorkoutSurfaceModel({ ...trainState, session: startedSession }),
    activeSessionModel: getActiveSessionSurfaceModel(startedSession, 35, null),
  })

  assert.equal(model.surface.cards[0].actionLabel, 'Resume session')
  assert.equal(model.surface.cards[0].targetKey, 'session')
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
    calendarModel: getCalendarSurfaceModel(trainState, 'thu'),
    workoutModel: getWorkoutSurfaceModel(trainState, 'thu'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
  })

  assert.equal(model.surface.type, 'calendar')
  assert.equal(model.surface.detailCard.title, 'Weekly schedule')
  assert.equal(model.surface.detailCard.targetKey, 'workout')
  assert.equal(model.surface.detailCard.actionPayload.selectedDayId, 'thu')
  assert.equal(model.surface.days[3].title, 'Thu • Upper B')
  assert.equal(model.surface.days[3].isSelected, true)
  assert.equal(model.surface.days[3].actionPayload.selectedDayId, 'thu')
})

test('getTrainSurfaceModel routes selected today directly to session when it is already in progress', () => {
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
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel({ ...trainState, session: startedSession }),
    calendarModel: getCalendarSurfaceModel({ ...trainState, session: startedSession }, 'tue'),
    workoutModel: getWorkoutSurfaceModel({ ...trainState, session: startedSession }, 'tue'),
    activeSessionModel: getActiveSessionSurfaceModel(startedSession, 35, null),
  })

  assert.equal(model.surface.detailCard.actionLabel, 'Resume Tue session')
  assert.equal(model.surface.detailCard.targetKey, 'session')
  assert.equal(model.surface.days[1].targetKey, 'session')
})

test('getTrainSurfaceModel routes completed today to the completed session summary', () => {
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

  assert.equal(model.surface.detailCard.actionLabel, 'View Tue summary')
  assert.equal(model.surface.detailCard.targetKey, 'session')
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
