import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWorkoutSet, finishWorkoutSession } from '../packages/core/src/index.js'
import { createAssignedProgramTrainState, createDemoProgramWorkout, createTrainDemoState, getCalendarSurfaceModel, getTodaySurfaceModel, getWorkoutSurfaceModel, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'
import { doesSessionMatchWorkout, getComparableProgramWorkoutId } from '../apps/mobile/src/train/session-truth.js'

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
    persistedWorkoutListRows: [],
  })

  assert.equal(model.tabs.length, 5)
  assert.equal(model.tabs.find((tab) => tab.key === 'calendar').isActive, true)
  assert.equal(model.surface.type, 'train-home')
  assert.equal(model.surface.calendarStripTitle, undefined)
  assert.equal(model.surface.calendarStripDays[0].weekdayLabel, 'SUN')
  assert.equal(model.surface.calendarStripDays[0].dateNumber, '19')
  assert.equal(model.surface.calendarStripDays[0].isSelected, false)
  assert.equal(model.surface.calendarStripDays[4].weekdayLabel, 'THU')
  assert.equal(model.surface.calendarStripDays[4].dateNumber, '23')
  assert.equal(model.surface.calendarStripDays[4].isSelected, true)
  assert.equal(model.surface.selectedWorkoutHeading, 'Thu • Apr 23')
  assert.equal(model.surface.selectedWorkoutCard.variant, 'today-summary')
  assert.equal(model.surface.selectedWorkoutCard.title, undefined)
  assert.equal(model.surface.selectedWorkoutCard.workoutName, 'Upper B')
  assert.equal(model.surface.selectedWorkoutCard.scheduledLabel, 'Upcoming')
  assert.equal(model.surface.selectedWorkoutCard.actionLabel, 'Open workout')
  assert.equal(model.surface.selectedWorkoutCard.targetKey, 'workout')
  assert.equal(model.surface.selectedWorkoutCard.actionPayload.programWorkoutId, 'pw-upper-b')
  assert.equal(model.surface.programSectionTitle, 'My Programs')
  assert.equal(model.surface.programCard.variant, 'program-summary')
  assert.equal(model.surface.programCard.title, undefined)
  assert.equal(model.surface.programCard.programName, 'Spring Hypertrophy')
  assert.equal(model.surface.workoutListTitle, 'My Workouts')
  assert.equal(model.surface.workoutListRows[0].title, 'Upper A')
  assert.match(model.surface.workoutListRows[0].body, /Mon • Apr 20/)
})

test('getTrainSurfaceModel appends persisted created workouts into My Workouts so they remain visible after cancel', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, 'tue'),
    workoutModel: getWorkoutSurfaceModel(trainState, 'tue'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 35, null),
    persistedWorkoutListRows: [
      {
        id: 'created-workout-row-1',
        title: 'Untitled workout',
        body: 'Tue • Apr 21 · Scheduled',
        targetKey: 'workout',
        actionPayload: { selectedDayId: 'tue', programWorkoutId: 'pw-created-1' },
      },
    ],
  })

  const createdRow = model.surface.workoutListRows.find((row) => row.actionPayload?.programWorkoutId === 'pw-created-1')
  assert.ok(createdRow)
  assert.equal(createdRow.title, 'Untitled workout')
  assert.match(createdRow.body, /Tue • Apr 21/)
})

test('getTrainSurfaceModel lets a saved local workout row immediately refresh the visible matching calendar workout title', () => {
  const todayModel = {
    heroTitle: 'Today',
    workoutName: 'Untitled Workout 1',
    scheduledLabel: 'Scheduled for today',
    quickSummary: 'Start the session cleanly.',
    workoutSummaryLabel: '0 exercises, 0 total sets',
    workoutStatusLabel: 'Open today',
    programName: 'Spring Hypertrophy',
    programDateRangeLabel: 'Apr 5 - May 30',
    programCurrentWeek: 3,
    programTotalWeeks: 8,
    programWeekLabel: 'Week 3 of 8',
    programCompletedWorkouts: 6,
    programTotalWorkouts: 39,
    completionLabel: '6 of 39 workouts completed',
    primaryActionLabel: 'Open workout',
  }
  const calendarModel = {
    days: [
      {
        id: 'day-1',
        title: 'Tue • Untitled Workout 1',
        body: 'Apr 21 · Scheduled',
        status: 'scheduled',
        workouts: [
          { id: 'pw-created-1', nameSnapshot: 'Untitled Workout 1', status: 'scheduled' },
        ],
        weekdayLabel: 'TUE',
        dateNumber: '21',
        indicatorTone: 'default',
        isSelected: true,
        targetKey: 'calendar-day-select',
        actionPayload: { selectedDayId: 'day-1' },
      },
    ],
  }
  const workoutModel = {
    dayLabel: 'Tue • Apr 21',
    hasWorkoutData: false,
    emptyStateTitle: 'No workout available',
    exercises: [],
  }

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel,
    calendarModel,
    workoutModel,
    activeSessionModel: null,
    persistedWorkoutListRows: [
      {
        id: 'created-workout-row-1',
        title: 'Renamed Workout',
        body: 'Tue • Apr 21 · Scheduled',
        targetKey: 'workout',
        actionPayload: { selectedDayId: 'day-1', programWorkoutId: 'pw-created-1' },
      },
    ],
  })

  const matchingRow = model.surface.workoutListRows.find((row) => row.actionPayload?.programWorkoutId === 'pw-created-1')
  assert.ok(matchingRow)
  assert.equal(matchingRow.title, 'Renamed Workout')
})

test('getTrainSurfaceModel keeps one stacked train-home surface for the barbell view', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const startedSession = completeWorkoutSet({
    session: {
      ...trainState.session,
      status: 'in_progress',
      startedAt: '2026-04-21T20:00:00.000Z',
    },
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
  assert.equal(model.surface.selectedWorkoutCard.actionLabel, 'Open workout')
  assert.equal(model.surface.selectedWorkoutCard.scheduledLabel, 'Scheduled for today')
  assert.equal(model.surface.selectedWorkoutCard.summaryLabel, 'Scheduled for today')
  assert.equal(model.surface.selectedWorkoutCard.statusLabel, 'In progress')
  assert.equal(model.surface.selectedWorkoutCard.targetKey, 'workout')
  assert.equal(model.surface.selectedWorkoutCard.actionPayload.programWorkoutId, 'pw-lower-a')
  assert.equal(model.surface.calendarStripDays[2].targetKey, 'calendar-day-select')
  assert.equal(model.surface.calendarStripDays[2].indicatorTone, 'active')
})

test('getTrainSurfaceModel uses one shared EmptyCard contract for My Programs when program data is empty', () => {
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

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'calendar',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState, '2026-04-21'),
    workoutModel: getWorkoutSurfaceModel(trainState, '2026-04-21'),
    activeSessionModel: getActiveSessionSurfaceModel(trainState.session, 0, null),
  })

  assert.equal(model.surface.programSectionTitle, 'My Programs')
  assert.equal(model.surface.programCard, null)
  assert.equal(model.surface.programEmptyState.title, 'No program available')
  assert.equal(model.surface.programEmptyState.body, undefined)
})

test('createAssignedProgramTrainState keeps the full program weeks tree available for the training calendar view', () => {
  const assignedProgram = {
    id: 'program-1',
    name: 'Spring Hypertrophy',
    startDate: '2026-04-05',
    endDate: '2026-05-31',
    weeks: [
      {
        id: 'week-1',
        weekIndex: 1,
        startDate: '2026-04-05',
        endDate: '2026-04-11',
        days: [
          { id: 'day-1', date: '2026-04-05', name: 'Rest Day', workouts: [] },
        ],
      },
    ],
  }

  const trainState = createTrainDemoState()
  const assignedState = createAssignedProgramTrainState({ assignedProgram, programWorkout: trainState.programWorkout, todayIsoDate: '2026-04-05' })

  assert.equal(Array.isArray(assignedState.program.weeks), true)
  assert.equal(assignedState.program.weeks.length, 1)
  assert.equal(assignedState.program.weeks[0].id, 'week-1')
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
  assert.equal(model.surface.selectedWorkoutCard.statusLabel, 'Completed')
  assert.equal(model.surface.selectedWorkoutCard.targetKey, 'session')
  assert.equal(model.surface.selectedWorkoutCard.actionPayload.programWorkoutId, 'pw-lower-a')
})

test('session truth helper derives comparable workout ids across session and workout payload shapes', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const todayWorkoutModel = getWorkoutSurfaceModel(trainState, 'tue')
  const otherWorkoutModel = getWorkoutSurfaceModel(trainState, 'thu')

  assert.equal(getComparableProgramWorkoutId(trainState.session), 'pw-lower-a')
  assert.equal(getComparableProgramWorkoutId(todayWorkoutModel), 'pw-lower-a')
  assert.equal(doesSessionMatchWorkout(trainState.session, todayWorkoutModel), true)
  assert.equal(doesSessionMatchWorkout(trainState.session, otherWorkoutModel), false)
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
