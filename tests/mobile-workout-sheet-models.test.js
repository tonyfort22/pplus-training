import test from 'node:test'
import assert from 'node:assert/strict'

import { createWorkoutSession } from '../packages/core/src/index.js'
import { getWorkoutSheetModel } from '../apps/mobile/src/train/workout-sheet-models.js'

test('getWorkoutSheetModel prefers a direct program workout snapshot when the selected workout preview is thin', () => {
  const programWorkout = {
    id: 'pw-speed-a',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-1',
    workoutTemplateId: 'tpl-1',
    nameSnapshot: 'Phase 3 Speed Accelerator A',
    exercises: [
      {
        id: 'pwe-jump',
        exerciseId: 'exercise-jump',
        nameSnapshot: 'Box Jump',
        sortOrder: 1,
        defaultRestSeconds: 90,
        sets: [
          { id: 'pws-1', sortOrder: 1, setType: 'straight', targetReps: 3, targetLoad: null, targetLoadUnit: null, targetRpe: 7, targetRestSeconds: 90 },
          { id: 'pws-2', sortOrder: 2, setType: 'straight', targetReps: 3, targetLoad: null, targetLoadUnit: null, targetRpe: 7, targetRestSeconds: 90 },
        ],
      },
    ],
  }

  const model = getWorkoutSheetModel({
    workoutModel: {
      workoutName: 'Phase 3 Speed Accelerator A',
      exerciseCount: 0,
      exercises: [],
      actionPayload: { selectedDayId: 'mon', programWorkoutId: 'pw-speed-a' },
    },
    session: null,
    programWorkout,
    selectedDayId: 'mon',
  })

  assert.equal(model.title, 'Phase 3 Speed Accelerator A')
  assert.equal(model.exercises.length, 1)
  assert.equal(model.exercises[0].name, 'Box Jump')
  assert.equal(model.exercises[0].sets.length, 2)
  assert.equal(model.exercises[0].sets[0].reps, '3')
})

test('getWorkoutSheetModel preserves a created workout title even when the workout has no exercises yet', () => {
  const model = getWorkoutSheetModel({
    workoutModel: {
      workoutName: 'Phase 3 Speed Accelerator A',
      exerciseCount: 0,
      exercises: [],
      actionPayload: { selectedDayId: 'mon', programWorkoutId: 'pw-created-1' },
    },
    session: null,
    programWorkout: {
      id: 'pw-created-1',
      athleteId: 'ath-1',
      coachId: 'coach-1',
      programId: 'program-1',
      programDayId: 'day-1',
      workoutTemplateId: null,
      nameSnapshot: '',
      exercises: [],
    },
    selectedDayId: 'mon',
  })

  assert.equal(model.programWorkoutId, 'pw-created-1')
  assert.equal(model.title, '')
  assert.equal(model.exercises.length, 0)
})

test('getWorkoutSheetModel prefers the session exercise and set snapshot for the selected workout', () => {
  const session = createWorkoutSession({
    programWorkout: {
      id: 'pw-upper-b',
      athleteId: 'ath-1',
      coachId: 'coach-1',
      programId: 'program-1',
      programDayId: 'day-1',
      workoutTemplateId: 'tpl-1',
      nameSnapshot: 'Upper B',
      exercises: [
        {
          id: 'pwe-bench',
          exerciseId: 'exercise-bench',
          nameSnapshot: 'Bench Press',
          sortOrder: 1,
          defaultRestSeconds: 150,
          sets: [
            { id: 'pws-1', sortOrder: 1, setType: 'straight', targetReps: 5, targetLoad: 135, targetLoadUnit: 'lb', targetRpe: 7, targetRestSeconds: 150 },
            { id: 'pws-2', sortOrder: 2, setType: 'straight', targetReps: 5, targetLoad: 145, targetLoadUnit: 'lb', targetRpe: 8, targetRestSeconds: 150 },
          ],
        },
      ],
    },
    startedAt: '2026-04-23T20:00:00.000Z',
  })

  const model = getWorkoutSheetModel({
    workoutModel: {
      workoutName: 'Wrong preview title',
      exerciseCount: 0,
      exercises: [],
      actionPayload: { selectedDayId: 'thu', programWorkoutId: 'pw-upper-b' },
    },
    session,
    selectedDayId: 'thu',
  })

  assert.equal(model.title, 'Upper B')
  assert.equal(model.ctaLabel, 'Resume Workout')
  assert.equal(model.resumeNotice, 'Workout in progress')
  assert.equal(model.exercises.length, 1)
  assert.equal(model.exercises[0].name, 'Bench Press')
  assert.equal(model.exercises[0].sets.length, 2)
  assert.equal(model.exercises[0].sets[0].load, '135')
  assert.equal(model.exercises[0].sets[0].reps, '5')
  assert.equal(model.exercises[0].sets[0].effort, '7')
})
