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
  assert.equal(renderModel.content.sections.length, 8)
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
  assert.equal(renderModel.content.sections[7].type, 'create-workout-card')
  assert.equal(renderModel.content.sections[7].title, 'Create workout')
  assert.equal(renderModel.content.sections[7].subtitle, 'Repeatable workout template')
  assert.equal(renderModel.content.sections[7].targetKey, 'create-workout')
  assert.deepEqual(renderModel.floatingStartWorkoutButton, {
    kind: 'start-workout',
    label: 'Start Workout',
    targetKey: 'start-workout',
    actionPayload: undefined,
  })
})

test('getTrainRenderModel can replace the idle Start Workout CTA with a compact in-progress bottom bar model', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
    previewState: 'active',
  })
  const activeSessionModel = getActiveSessionSurfaceModel(trainState.session, 14, null)
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

  assert.deepEqual(renderModel.floatingStartWorkoutButton, {
    kind: 'start-workout',
    label: 'Start Workout',
    targetKey: 'start-workout',
    actionPayload: undefined,
  })
})

test('getTrainRenderModel uses one shared EmptyCard for the My Workouts section when workouts data is empty', () => {
  const trainState = {
    today: {
      title: 'Today',
      workoutName: 'No workout scheduled',
      scheduledLabel: 'No workout scheduled',
      quickSummary: 'No workout is scheduled for this athlete yet.',
    },
    program: {
      name: 'No program assigned',
      dateRangeLabel: '',
      currentWeek: 0,
      totalWeeks: 0,
      weekLabel: 'No active program',
      completedWorkouts: 0,
      totalWorkouts: 0,
      completionLabel: 'No workouts assigned yet',
      selectedCalendarDayId: '2026-04-21',
      calendarWeek: [
        { id: '2026-04-19', dayLabel: 'SUN', dateLabel: 'Apr 19', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-20', dayLabel: 'MON', dateLabel: 'Apr 20', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-21', dayLabel: 'TUE', dateLabel: 'Apr 21', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-22', dayLabel: 'WED', dateLabel: 'Apr 22', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-23', dayLabel: 'THU', dateLabel: 'Apr 23', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-24', dayLabel: 'FRI', dateLabel: 'Apr 24', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-25', dayLabel: 'SAT', dateLabel: 'Apr 25', workoutName: 'Off', status: 'off', workoutPreview: null },
      ],
    },
    session: {
      id: null,
      programWorkoutId: null,
      status: 'planned',
      nameSnapshot: 'No workout scheduled',
      totalSetsCount: 0,
      completedSetsCount: 0,
      exercises: [],
    },
  }

  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, '2026-04-21'),
    workoutModel: getWorkoutSurfaceModel(trainState, '2026-04-21'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 0, null),
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(getActiveSessionSurfaceModel(trainState.session, 0, null)),
  })

  assert.equal(renderModel.content.sections[5].title, 'My Workouts')
  assert.equal(renderModel.content.sections[6].type, 'empty-state-card')
  assert.equal(renderModel.content.sections[6].title, 'No workout available')
  assert.equal(renderModel.content.sections[6].body, undefined)
  assert.equal(renderModel.content.sections[6].variant, 'empty-card')
  assert.equal(renderModel.content.sections[6].actionLabel, undefined)
  assert.equal(renderModel.content.sections[6].targetKey, undefined)
  assert.equal(renderModel.content.sections[6].rows, undefined)
  assert.equal(renderModel.content.sections[7].type, 'create-workout-card')
  assert.equal(renderModel.content.sections[7].title, 'Create workout')
  assert.equal(renderModel.content.sections[7].subtitle, 'Repeatable workout template')
  assert.equal(renderModel.content.sections[7].targetKey, 'create-workout')
  assert.equal(renderModel.floatingStartWorkoutButton, null)
  assert.doesNotMatch(JSON.stringify(renderModel.content.sections[6]), /Upper A/)
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

test('getTrainRenderModel keeps the same Today workout card workflow while only revealing an in-progress indicator in the shared card', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
    previewState: 'active',
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

  assert.equal(renderModel.content.sections[2].type, 'action-card')
  assert.equal(renderModel.content.sections[2].variant, 'today-summary')
  assert.equal(renderModel.content.sections[2].workoutName, 'Lower A')
  assert.equal(renderModel.content.sections[2].targetKey, 'workout')
  assert.equal(renderModel.content.sections[2].actionLabel, 'Open workout')
  assert.equal(renderModel.content.sections[2].actionPayload.selectedDayId, 'tue')
  assert.equal(renderModel.content.sections[2].actionPayload.programWorkoutId, 'pw-lower-a')
  assert.equal(renderModel.content.sections[2].summaryLabel, 'Scheduled for today')
  assert.equal(renderModel.content.sections[2].statusLabel, 'In progress')
})

test('getTrainRenderModel uses one shared EmptyCard for the selected-date workout section when the selected date has no workout data', () => {
  const trainState = {
    today: {
      title: 'Today',
      workoutName: 'No workout scheduled',
      scheduledLabel: 'No workout scheduled',
      quickSummary: 'No workout is scheduled for this athlete yet.',
    },
    program: {
      name: 'No program assigned',
      dateRangeLabel: '',
      currentWeek: 0,
      totalWeeks: 0,
      weekLabel: 'No active program',
      completedWorkouts: 0,
      totalWorkouts: 0,
      completionLabel: 'No workouts assigned yet',
      selectedCalendarDayId: '2026-04-21',
      calendarWeek: [
        { id: '2026-04-19', dayLabel: 'SUN', dateLabel: 'Apr 19', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-20', dayLabel: 'MON', dateLabel: 'Apr 20', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-21', dayLabel: 'TUE', dateLabel: 'Apr 21', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-22', dayLabel: 'WED', dateLabel: 'Apr 22', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-23', dayLabel: 'THU', dateLabel: 'Apr 23', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-24', dayLabel: 'FRI', dateLabel: 'Apr 24', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-25', dayLabel: 'SAT', dateLabel: 'Apr 25', workoutName: 'Off', status: 'off', workoutPreview: null },
      ],
    },
    session: {
      id: null,
      programWorkoutId: null,
      status: 'planned',
      nameSnapshot: 'No workout scheduled',
      totalSetsCount: 0,
      completedSetsCount: 0,
      exercises: [],
    },
  }

  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, '2026-04-21'),
    workoutModel: getWorkoutSurfaceModel(trainState, '2026-04-21'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 0, null),
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(getActiveSessionSurfaceModel(trainState.session, 0, null)),
  })

  assert.equal(renderModel.content.sections[1].title, 'TUE • Apr 21')
  assert.equal(renderModel.content.sections[2].type, 'empty-state-card')
  assert.equal(renderModel.content.sections[2].title, 'No workout scheduled')
  assert.equal(renderModel.content.sections[2].body, undefined)
  assert.equal(renderModel.content.sections[2].variant, 'empty-card')
  assert.equal(renderModel.content.sections[2].actionLabel, undefined)
  assert.equal(renderModel.content.sections[2].targetKey, undefined)
  assert.equal(renderModel.content.sections[2].rows, undefined)
  assert.doesNotMatch(JSON.stringify(renderModel.content.sections[2]), /Off day/)
  assert.doesNotMatch(JSON.stringify(renderModel.content.sections[2]), /Open workout/)
})

test('getTrainRenderModel uses one shared EmptyCard for the My Programs section when programs data is empty', () => {
  const trainState = {
    today: {
      title: 'Today',
      workoutName: 'No workout scheduled',
      scheduledLabel: 'No workout scheduled',
      quickSummary: 'No workout is scheduled for this athlete yet.',
    },
    program: {
      name: 'No program assigned',
      dateRangeLabel: '',
      currentWeek: 0,
      totalWeeks: 0,
      weekLabel: 'No active program',
      completedWorkouts: 0,
      totalWorkouts: 0,
      completionLabel: 'No workouts assigned yet',
      selectedCalendarDayId: '2026-04-21',
      calendarWeek: [
        { id: '2026-04-19', dayLabel: 'SUN', dateLabel: 'Apr 19', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-20', dayLabel: 'MON', dateLabel: 'Apr 20', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-21', dayLabel: 'TUE', dateLabel: 'Apr 21', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-22', dayLabel: 'WED', dateLabel: 'Apr 22', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-23', dayLabel: 'THU', dateLabel: 'Apr 23', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-24', dayLabel: 'FRI', dateLabel: 'Apr 24', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-25', dayLabel: 'SAT', dateLabel: 'Apr 25', workoutName: 'Off', status: 'off', workoutPreview: null },
      ],
    },
    session: {
      id: null,
      programWorkoutId: null,
      status: 'planned',
      nameSnapshot: 'No workout scheduled',
      totalSetsCount: 0,
      completedSetsCount: 0,
      exercises: [],
    },
  }

  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, '2026-04-21'),
    workoutModel: getWorkoutSurfaceModel(trainState, '2026-04-21'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 0, null),
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(getActiveSessionSurfaceModel(trainState.session, 0, null)),
  })

  assert.equal(renderModel.content.sections[3].title, 'My Programs')
  assert.equal(renderModel.content.sections[4].type, 'empty-state-card')
  assert.equal(renderModel.content.sections[4].title, 'No program available')
  assert.equal(renderModel.content.sections[4].body, undefined)
  assert.equal(renderModel.content.sections[4].variant, 'empty-card')
  assert.equal(renderModel.content.sections[4].actionLabel, undefined)
  assert.equal(renderModel.content.sections[4].targetKey, undefined)
  assert.doesNotMatch(JSON.stringify(renderModel.content.sections[4]), /Program snapshot/)
})

test('getTrainRenderModel keeps the current week visible and the current date selected on empty train-home state without a fake placeholder date tile', () => {
  const trainState = {
    today: {
      title: 'Today',
      workoutName: 'No workout scheduled',
      scheduledLabel: 'No workout scheduled',
      quickSummary: 'No workout is scheduled for this athlete yet.',
    },
    program: {
      name: 'No program assigned',
      dateRangeLabel: '',
      currentWeek: 0,
      totalWeeks: 0,
      weekLabel: 'No active program',
      completedWorkouts: 0,
      totalWorkouts: 0,
      completionLabel: 'No workouts assigned yet',
      selectedCalendarDayId: '2026-04-21',
      calendarWeek: [
        { id: '2026-04-19', dayLabel: 'SUN', dateLabel: 'Apr 19', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-20', dayLabel: 'MON', dateLabel: 'Apr 20', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-21', dayLabel: 'TUE', dateLabel: 'Apr 21', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-22', dayLabel: 'WED', dateLabel: 'Apr 22', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-23', dayLabel: 'THU', dateLabel: 'Apr 23', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-24', dayLabel: 'FRI', dateLabel: 'Apr 24', workoutName: 'Off', status: 'off', workoutPreview: null },
        { id: '2026-04-25', dayLabel: 'SAT', dateLabel: 'Apr 25', workoutName: 'Off', status: 'off', workoutPreview: null },
      ],
    },
    session: {
      id: null,
      programWorkoutId: null,
      status: 'planned',
      nameSnapshot: 'No workout scheduled',
      totalSetsCount: 0,
      completedSetsCount: 0,
      exercises: [],
    },
  }

  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, '2026-04-21'),
    workoutModel: getWorkoutSurfaceModel(trainState, '2026-04-21'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 0, null),
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(getActiveSessionSurfaceModel(trainState.session, 0, null)),
  })

  assert.equal(renderModel.content.sections[0].type, 'calendar-strip')
  assert.equal(renderModel.content.sections[0].days.length, 7)
  assert.equal(renderModel.content.sections[0].days[2].weekdayLabel, 'TUE')
  assert.equal(renderModel.content.sections[0].days[2].dateNumber, '21')
  assert.equal(renderModel.content.sections[0].days[2].isSelected, true)
  assert.equal(renderModel.content.sections[0].days[2].indicatorTone, 'none')
  assert.equal(renderModel.content.sections[0].days[0].indicatorTone, 'none')
  assert.doesNotMatch(JSON.stringify(renderModel.content.sections[0].days), /empty-day/)
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
