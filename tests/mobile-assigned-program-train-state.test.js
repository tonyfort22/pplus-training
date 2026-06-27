import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getAssignedProgramWorkoutIdForDate } from '../apps/mobile/src/train/assigned-program-workout-id.js'
import { createAssignedProgramTrainState } from '../apps/mobile/src/train/index.js'

test('assigned program train state source uses one shared preferred-workout helper for calendar ids and train-home state', () => {
  const trainSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/index.js'), 'utf8')
  const workoutIdSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/assigned-program-workout-id.js'), 'utf8')
  const sharedHelperSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/assigned-program-workouts.js'), 'utf8')
  const assignedStateBlock = trainSource.match(/export function createAssignedProgramTrainState\([\s\S]*?\n\}/)?.[0] || ''

  assert.match(sharedHelperSource, /export function getPreferredAssignedWorkout\(dayWorkouts = \[\]\)/)
  assert.match(sharedHelperSource, /String\(workout\?\.nameSnapshot \|\| ''\)\.trim\(\)/)
  assert.match(trainSource, /import \{ getPreferredAssignedWorkout, getPreferredAssignedWorkoutName \} from '\.\/assigned-program-workouts\.js'/)
  assert.match(workoutIdSource, /import \{ getPreferredAssignedWorkout \} from '\.\/assigned-program-workouts\.js'/)
  assert.match(assignedStateBlock, /const workoutByDayId = new Map\(\)/)
  assert.match(assignedStateBlock, /getPreferredAssignedWorkout\(dayWorkouts\)/)
  assert.match(assignedStateBlock, /workouts:\s*dayWorkouts/)
  assert.match(assignedStateBlock, /hasStructuredWorkoutExercises\(programWorkout\)/)
  assert.doesNotMatch(workoutIdSource, /day\.workouts\[0\]/)
})

test('getAssignedProgramWorkoutIdForDate uses the same preferred assigned workout as Train/Home when leading rows are blank', () => {
  const assignedProgram = {
    weeks: [
      {
        days: [
          {
            date: '2026-05-18',
            workouts: [
              { id: 'pw-blank-1', nameSnapshot: '' },
              { id: 'pw-named-1', nameSnapshot: 'Workout 1' },
            ],
          },
        ],
      },
    ],
  }

  assert.equal(getAssignedProgramWorkoutIdForDate(assignedProgram, '2026-05-18'), 'pw-named-1')
})

test('createAssignedProgramTrainState keeps multiple persisted workouts on the same day available for later train-home hydration', () => {
  const assignedProgram = {
    id: 'assigned-1',
    name: 'Speed Block',
    startDate: '2026-05-18',
    endDate: '2026-06-30',
    weeks: [
      {
        weekIndex: 1,
        days: [
          {
            id: 'day-1',
            date: '2026-05-18',
            name: 'Mon',
            workouts: [
              { id: 'pw-speed-a', athleteId: 'ath-1', coachId: 'coach-1', programId: 'program-1', programDayId: 'day-1', workoutTemplateId: 'tpl-1', nameSnapshot: 'Phase 3 Speed Accelerator A', status: 'scheduled', exercises: [] },
              { id: 'pw-created-1', athleteId: 'ath-1', coachId: 'coach-1', programId: 'program-1', programDayId: 'day-1', workoutTemplateId: null, nameSnapshot: 'Custom workout name', status: 'scheduled', exercises: [] },
            ],
          },
        ],
      },
    ],
  }

  const trainState = createAssignedProgramTrainState({ assignedProgram, programWorkout: assignedProgram.weeks[0].days[0].workouts[0], todayIsoDate: '2026-05-18' })

  assert.equal(Array.isArray(trainState.program.calendarWeek[0].workouts), true)
  assert.equal(trainState.program.calendarWeek[0].workouts.length, 2)
  assert.equal(trainState.program.calendarWeek[0].workouts[1].id, 'pw-created-1')
  assert.equal(trainState.program.calendarWeek[0].workouts[1].nameSnapshot, 'Custom workout name')
})

test('createAssignedProgramTrainState keeps workout identity and title aligned when the selected day has leading blank workout rows', () => {
  const assignedProgram = {
    id: 'assigned-blank-names',
    name: 'Training Program',
    startDate: '2026-05-18',
    endDate: '2026-07-27',
    weeks: [
      {
        weekIndex: 1,
        days: [
          {
            id: 'day-1',
            date: '2026-05-18',
            name: null,
            workouts: [
              { id: 'pw-blank-1', athleteId: 'ath-1', coachId: 'coach-1', programId: 'program-1', programDayId: 'day-1', workoutTemplateId: 'tpl-1', nameSnapshot: '', status: 'scheduled', exercises: [] },
              { id: 'pw-blank-2', athleteId: 'ath-1', coachId: 'coach-1', programId: 'program-1', programDayId: 'day-1', workoutTemplateId: 'tpl-2', nameSnapshot: '', status: 'scheduled', exercises: [] },
              { id: 'pw-named-1', athleteId: 'ath-1', coachId: 'coach-1', programId: 'program-1', programDayId: 'day-1', workoutTemplateId: 'tpl-3', nameSnapshot: 'Workout 1', status: 'scheduled', exercises: [] },
            ],
          },
        ],
      },
    ],
  }

  const trainState = createAssignedProgramTrainState({ assignedProgram, todayIsoDate: '2026-05-04' })

  assert.equal(trainState.today.workoutName, 'Workout 1')
  assert.equal(trainState.program.calendarWeek[0].workoutName, 'Workout 1')
  assert.equal(trainState.program.calendarWeek[0].workoutPreview.workoutName, 'Workout 1')
  assert.equal(trainState.program.calendarWeek[0].workoutPreview.programWorkoutId, 'pw-named-1')
  assert.equal(trainState.programWorkout.id, 'pw-named-1')
})

test('createAssignedProgramTrainState prefers the rich fetched programWorkout over a thin assigned day workout row', () => {
  const thinDayWorkout = {
    id: 'pw-speed-a',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-1',
    workoutTemplateId: 'tpl-1',
    nameSnapshot: 'Phase 3 Speed Accelerator A',
    status: 'scheduled',
  }

  const richProgramWorkout = {
    ...thinDayWorkout,
    exercises: [
      {
        id: 'pwe-1',
        exerciseId: 'exercise-1',
        nameSnapshot: 'Sprint [1/2 Kneel Start]',
        sortOrder: 1,
        defaultRestSeconds: 90,
        sets: [
          { id: 'pws-1', sortOrder: 1, setType: 'straight', targetReps: 1, targetRestSeconds: 90 },
        ],
      },
    ],
  }

  const assignedProgram = {
    id: 'assigned-1',
    name: 'Speed Block',
    startDate: '2026-05-18',
    endDate: '2026-06-30',
    weeks: [
      {
        weekIndex: 1,
        days: [
          {
            id: 'day-1',
            date: '2026-05-18',
            name: 'Mon',
            workouts: [thinDayWorkout],
          },
        ],
      },
    ],
  }

  const trainState = createAssignedProgramTrainState({
    assignedProgram,
    programWorkout: richProgramWorkout,
    todayIsoDate: '2026-05-18',
  })

  assert.equal(trainState.programWorkout.id, 'pw-speed-a')
  assert.equal(trainState.programWorkout.exercises.length, 1)
  assert.equal(trainState.session.exercises.length, 1)
  assert.equal(trainState.session.totalExercisesCount, 1)
  assert.equal(trainState.session.totalSetsCount, 1)
})
