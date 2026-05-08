import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWorkoutSet, discardWorkoutSession, finishWorkoutSession } from '../packages/core/src/index.js'
import * as train from '../apps/mobile/src/train/index.js'

const {
  createDemoProgramWorkout,
  createTrainDemoState,
  getCalendarSurfaceModel,
  getTodaySurfaceModel,
  getWorkoutSurfaceModel,
} = train
import { getCalendarDetailCardModel, getProgramSurfaceModel, getTodayCardsModel, getWorkoutDetailCardModel } from '../apps/mobile/src/train/surface-models.js'

test('getTodayCardsModel creates the two top-level Today cards', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const todayModel = getTodaySurfaceModel(trainState)
  const cards = getTodayCardsModel(todayModel)

  assert.equal(cards.todayCard.title, 'Today')
  assert.equal(cards.todayCard.variant, 'today-summary')
  assert.equal(cards.todayCard.workoutName, 'Lower A')
  assert.equal(cards.todayCard.scheduledLabel, 'Scheduled for today')
  assert.equal(cards.todayCard.summaryLabel, '2 exercises, 7 total sets')
  assert.match(cards.todayCard.statusLabel, /Open today/)
  assert.equal(cards.todayCard.actionLabel, 'Open workout')
  assert.equal(cards.todayCard.variant, 'today-summary')
  assert.match(cards.todayCard.body, /Lower A/)
  assert.equal(cards.programCard.title, 'Program snapshot')
  assert.equal(cards.programCard.variant, 'program-summary')
  assert.equal(cards.programCard.dateRangeLabel, 'Apr 5 - May 30')
  assert.equal(cards.programCard.weekLabel, 'Week 3 of 8')
  assert.equal(cards.programCard.completionLabel, '6 of 39 workouts')
  assert.equal(cards.programCard.progressSegments.length, 8)
  assert.equal(cards.programCard.progressSegments[0].isComplete, true)
  assert.equal(cards.programCard.progressSegments[2].isCurrent, true)
})

test('getTodayCardsModel switches to a resume action once the live session has started', () => {
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

  const cards = getTodayCardsModel(getTodaySurfaceModel({ ...trainState, session: startedSession }))

  assert.equal(cards.todayCard.actionLabel, 'Resume session')
  assert.match(cards.todayCard.body, /1 of 7 sets logged/)
})

test('getTodayCardsModel shows an in-progress tag even before any sets are logged', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const inProgressSession = {
    ...trainState.session,
    status: 'in_progress',
    startedAt: '2026-04-21T20:00:00.000Z',
  }

  const cards = getTodayCardsModel(getTodaySurfaceModel({ ...trainState, session: inProgressSession }))

  assert.equal(cards.todayCard.actionLabel, 'Resume session')
  assert.match(cards.todayCard.statusLabel, /In progress/)
  assert.match(cards.todayCard.body, /Workout in progress/)
})

test('getProgramSurfaceModel creates the program overview copy from today state', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const todayModel = getTodaySurfaceModel(trainState)
  const model = getProgramSurfaceModel(todayModel)

  assert.equal(model.title, 'Program overview')
  assert.equal(model.actionLabel, 'See today’s workout')
  assert.match(model.body, /Week 3 of 8/)
  assert.match(model.body, /6 of 39 workouts completed/)
})

test('getWorkoutDetailCardModel creates the workout preview card copy', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const workoutModel = getWorkoutSurfaceModel(trainState)
  const model = getWorkoutDetailCardModel(workoutModel)

  assert.equal(model.title, 'Workout detail')
  assert.equal(model.actionLabel, 'Open workout')
  assert.match(model.body, /2 exercises/)
  assert.match(model.body, /planned rest/)
  assert.match(model.body, /Barbell Back Squat/)
})

test('getWorkoutDetailCardModel switches to resume when today session has started', () => {
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

  const model = getWorkoutDetailCardModel(getWorkoutSurfaceModel({ ...trainState, session: startedSession }))

  assert.equal(model.actionLabel, 'Open workout')
  assert.match(model.body, /1 of 7 sets logged/)
})

test('train index exports workout preview highlight helper for runtime consumers', () => {
  assert.equal(typeof train.getWorkoutPreviewHighlights, 'function')
})

test('getWorkoutSurfaceModel builds quick preview highlights before session start', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getWorkoutSurfaceModel(trainState)

  assert.equal(model.previewHighlights.length, 3)
  assert.equal(model.previewHighlights[0].title, 'Primary focus')
  assert.match(model.previewHighlights[0].body, /Barbell Back Squat/)
  assert.equal(model.previewHighlights[1].title, 'Planned work')
  assert.match(model.previewHighlights[1].body, /7 total sets/)
  assert.equal(model.previewHighlights[2].title, 'Session cue')
  assert.match(model.previewHighlights[2].body, /Open today/)
})

test('getTodayCardsModel switches to completed summary once today session is finished', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const finishedSession = finishWorkoutSession({ session: trainState.session, completedAt: '2026-04-21T21:00:00.000Z', elapsedSeconds: 1800 })

  const cards = getTodayCardsModel(getTodaySurfaceModel({ ...trainState, session: finishedSession }))

  assert.equal(cards.todayCard.actionLabel, 'View completed session')
  assert.match(cards.todayCard.body, /Workout completed/)
})

test('getWorkoutDetailCardModel switches to discarded summary once today session is abandoned', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const discardedSession = discardWorkoutSession({ session: trainState.session, discardedAt: '2026-04-21T20:20:00.000Z', elapsedSeconds: 600 })

  const model = getWorkoutDetailCardModel(getWorkoutSurfaceModel({ ...trainState, session: discardedSession }))

  assert.equal(model.actionLabel, 'Open workout')
  assert.match(model.body, /Workout discarded/)
})

test('getCalendarDetailCardModel creates the weekly schedule copy and rows', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const calendarModel = getCalendarSurfaceModel(trainState)
  const model = getCalendarDetailCardModel(calendarModel)

  assert.equal(model.title, 'Weekly schedule')
  assert.equal(model.actionLabel, 'Open Tue workout')
  assert.equal(model.rows.length, 7)
  assert.equal(model.rows[2].title, 'Tue • Lower A')
  assert.match(model.rows[2].body, /Today/)
  assert.equal(model.rows[2].isSelected, true)
})

test('getCalendarSurfaceModel tracks the selected day and where it should route next', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const calendarModel = getCalendarSurfaceModel(trainState, 'thu')

  assert.equal(calendarModel.selectedDayId, 'thu')
  assert.equal(calendarModel.selectedDay.title, 'Thu • Upper B')
  assert.equal(calendarModel.actionLabel, 'Open Thu workout')
  assert.equal(calendarModel.actionTargetKey, 'calendar-day-select')
  assert.equal(calendarModel.selectedDayPlan.title, 'Selected day plan')
  assert.equal(calendarModel.selectedDayPlan.rows.length, 3)
  assert.equal(calendarModel.selectedDayPlan.rows[0].title, 'Primary focus')
  assert.match(calendarModel.selectedDayPlan.rows[0].body, /Bench Press/)
  assert.equal(calendarModel.selectedDayPlan.rows[1].title, 'Planned work')
  assert.match(calendarModel.selectedDayPlan.rows[1].body, /2 exercises, 8 total sets/)
  assert.equal(calendarModel.selectedDayPlan.rows[2].title, 'Session cue')
  assert.match(calendarModel.selectedDayPlan.rows[2].body, /Preview the plan here/)
  assert.equal(calendarModel.days[4].targetKey, 'calendar-day-select')
  assert.equal(calendarModel.days[4].actionPayload.selectedDayId, 'thu')
})

test('getCalendarSurfaceModel routes today directly to session once the workout has started', () => {
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
  const calendarModel = getCalendarSurfaceModel({ ...trainState, session: startedSession }, 'tue')

  assert.equal(calendarModel.actionLabel, 'Open Tue workout')
  assert.equal(calendarModel.actionTargetKey, 'calendar-day-select')
  assert.equal(calendarModel.days[2].targetKey, 'calendar-day-select')
})

test('getWorkoutSurfaceModel only applies in-progress session copy to the matching workout', () => {
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

  const todayWorkoutModel = getWorkoutSurfaceModel({ ...trainState, session: startedSession }, 'tue')
  const otherWorkoutModel = getWorkoutSurfaceModel({ ...trainState, session: startedSession }, 'thu')

  assert.match(todayWorkoutModel.sessionProgressSummary, /1 of 7 sets logged/)
  assert.equal(otherWorkoutModel.sessionProgressSummary, null)
  assert.equal(otherWorkoutModel.primaryActionLabel, 'Open workout')
})

test('getWorkoutSurfaceModel preserves the open-workout seam for the matching in-progress workout instead of rewriting the workflow', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
    previewState: 'active',
  })

  const todayWorkoutModel = getWorkoutSurfaceModel(trainState, 'tue')

  assert.equal(todayWorkoutModel.primaryTargetKey, 'workout')
  assert.equal(todayWorkoutModel.primaryActionLabel, 'Open workout')
  assert.equal(todayWorkoutModel.actionPayload.selectedDayId, 'tue')
  assert.equal(todayWorkoutModel.actionPayload.programWorkoutId, 'pw-lower-a')
  assert.match(todayWorkoutModel.sessionProgressSummary, /Workout in progress|sets logged/)
})

test('getCalendarSurfaceModel routes completed today to the session summary', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const finishedSession = finishWorkoutSession({ session: trainState.session, completedAt: '2026-04-21T21:00:00.000Z', elapsedSeconds: 1800 })
  const calendarModel = getCalendarSurfaceModel({ ...trainState, session: finishedSession }, 'tue')

  assert.equal(calendarModel.actionLabel, 'Open Tue workout')
  assert.equal(calendarModel.actionTargetKey, 'calendar-day-select')
  assert.equal(calendarModel.days[2].targetKey, 'calendar-day-select')
})

test('getCalendarSurfaceModel builds calendar-strip metadata with workout-only indicator visibility', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const calendarModel = getCalendarSurfaceModel(trainState, 'wed')

  assert.equal(calendarModel.days.length, 7)
  assert.equal(calendarModel.days[0].weekdayLabel, 'SUN')
  assert.equal(calendarModel.days[0].dateNumber, '19')
  assert.equal(calendarModel.days[0].indicatorTone, 'none')
  assert.equal(calendarModel.days[1].weekdayLabel, 'MON')
  assert.equal(calendarModel.days[1].indicatorTone, 'active')
  assert.equal(calendarModel.days[3].weekdayLabel, 'WED')
  assert.equal(calendarModel.days[3].dateNumber, '22')
  assert.equal(calendarModel.days[3].isSelected, true)
  assert.equal(calendarModel.days[3].indicatorTone, 'active')
  assert.equal(calendarModel.days[6].weekdayLabel, 'SAT')
  assert.equal(calendarModel.days[6].indicatorTone, 'active')
})
