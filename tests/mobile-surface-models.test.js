import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState, getCalendarSurfaceModel, getTodaySurfaceModel, getWorkoutSurfaceModel } from '../apps/mobile/src/train/index.js'
import { getCalendarDetailCardModel, getProgramSurfaceModel, getTodayCardsModel, getWorkoutDetailCardModel } from '../apps/mobile/src/train/surface-models.js'

test('getTodayCardsModel creates the two top-level Today cards', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const todayModel = getTodaySurfaceModel(trainState)
  const cards = getTodayCardsModel(todayModel)

  assert.equal(cards.todayCard.title, 'Today')
  assert.equal(cards.todayCard.actionLabel, 'Open workout')
  assert.match(cards.todayCard.body, /Lower A/)
  assert.equal(cards.programCard.title, 'Program snapshot')
  assert.match(cards.programCard.body, /Spring Hypertrophy/)
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
  assert.equal(model.actionLabel, 'Go to session')
  assert.match(model.body, /2 exercises/)
  assert.match(model.body, /planned rest/)
})

test('getCalendarDetailCardModel creates the weekly schedule copy and rows', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const calendarModel = getCalendarSurfaceModel(trainState)
  const model = getCalendarDetailCardModel(calendarModel)

  assert.equal(model.title, 'Weekly schedule')
  assert.equal(model.actionLabel, 'Open today')
  assert.equal(model.rows.length, 7)
  assert.equal(model.rows[1].title, 'Tue • Lower A')
  assert.match(model.rows[1].body, /Today/) 
})
