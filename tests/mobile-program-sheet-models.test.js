import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getProgramSheetModel } from '../apps/mobile/src/train/program-sheet-models.js'

test('getProgramSheetModel builds the program detail sheet model for the program card', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  const model = getProgramSheetModel(trainState)

  assert.equal(model.title, "Spring '26 Hypertrophy")
  assert.equal(model.dateRangeLabel, 'Apr 5, 2026 - May 30, 2026')
  assert.equal(model.editLabel, 'Edit')
  assert.equal(model.progressSegments.length, 8)
  assert.equal(model.progressSegments[0].isComplete, true)
  assert.equal(model.progressSegments[2].isCurrent, true)
  assert.deepEqual(model.stats.map((stat) => stat.icon), ['calendar', 'barbell'])
  assert.deepEqual(model.stats.map((stat) => stat.label), ['Week 3 of 8', '6 of 39 Workouts'])
  assert.deepEqual(model.routines.slice(0, 5).map((routine) => routine.label), ['Upper A', 'Lower A', 'Upper B', 'Lower B', 'Shoulders & Arms'])
  assert.equal(model.weeks.length, 8)
  assert.equal(model.weeks[0].title, 'Week 1')
  assert.equal(model.weeks[0].dateRangeLabel, 'Apr 5 - Apr 11')
  assert.equal(model.weeks[0].entries.length, 7)
  assert.equal(model.weeks[0].entries[0].dayLabel, 'Sun')
  assert.equal(model.weeks[0].entries[0].workoutLabel, 'Rest Day')
  assert.equal(model.weeks[0].entries[0].durationLabel, 'Rest Day')
  assert.equal(model.weeks[0].entries[0].status, 'rest')
  assert.equal(model.weeks[0].entries[1].dayLabel, 'Mon')
  assert.equal(model.weeks[0].entries[1].workoutLabel, 'Lower A')
  assert.equal(model.weeks[0].entries[1].durationLabel, '1 min')
  assert.equal(model.weeks[0].entries[1].status, 'done')
  assert.equal(model.weeks[0].entries[3].status, 'missed')
  assert.equal(model.weeks[0].entries[6].dayLabel, 'Sat')
  assert.equal(model.weeks[0].entries[6].status, 'rest')
})

test('getProgramSheetModel builds the shared program sheet from a real nested program record', () => {
  const model = getProgramSheetModel({
    id: 'prog-1',
    name: 'Off Season Domination',
    startDate: '2026-05-18',
    endDate: '2026-07-27',
    weeksCount: 2,
    workoutsCount: 3,
    weeks: [
      {
        id: 'week-1',
        weekIndex: 1,
        name: 'Week 1',
        startDate: '2026-05-18',
        endDate: '2026-05-24',
        days: [
          {
            id: 'day-1',
            date: '2026-05-19',
            name: 'Tuesday',
            status: 'training',
            workouts: [{ id: 'pw-1', nameSnapshot: 'Speed Accelerator A', status: 'completed', elapsedSeconds: 3630 }],
          },
          {
            id: 'day-2',
            date: '2026-05-20',
            name: 'Wednesday',
            status: 'training',
            workouts: [{ id: 'pw-2', nameSnapshot: 'Edge Work A', status: 'scheduled' }],
          },
          {
            id: 'day-3',
            date: '2026-05-21',
            name: 'Thursday',
            status: 'off',
            workouts: [],
          },
        ],
      },
      {
        id: 'week-2',
        weekIndex: 2,
        name: 'Week 2',
        startDate: '2026-05-25',
        endDate: '2026-05-31',
        days: [
          {
            id: 'day-4',
            date: '2026-05-26',
            name: 'Tuesday',
            status: 'training',
            workouts: [{ id: 'pw-3', nameSnapshot: 'Phase 4 Edge Work A', status: 'scheduled', estimatedDurationMinutes: 64 }],
          },
        ],
      },
    ],
  })

  assert.equal(model.title, 'Off Season Domination')
  assert.equal(model.dateRangeLabel, 'May 18, 2026 - Jul 27, 2026')
  assert.equal(model.progressSegments.length, 2)
  assert.equal(model.progressSegments[0].isCurrent, true)
  assert.deepEqual(model.stats.map((stat) => stat.label), ['Week 1 of 2', '1 of 3 Workouts'])
  assert.deepEqual(model.routines.map((routine) => routine.label), ['Speed Accelerator A', 'Edge Work A'])
  assert.doesNotMatch(JSON.stringify(model.routines), /Phase 4 Edge Work A/)
  assert.equal(model.weeks[0].title, 'Week 1')
  assert.equal(model.weeks[0].dateRangeLabel, 'May 18 - May 24')
  assert.equal(model.weeks[0].entries.length, 7)
  assert.equal(model.weeks[0].entries[0].dayLabel, 'Mon')
  assert.equal(model.weeks[0].entries[0].workoutLabel, 'Rest Day')
  assert.equal(model.weeks[0].entries[0].status, 'rest')
  assert.equal(model.weeks[0].entries[1].dayLabel, 'Tue')
  assert.equal(model.weeks[0].entries[1].workoutLabel, 'Speed Accelerator A')
  assert.equal(model.weeks[0].entries[1].programWorkoutId, 'pw-1')
  assert.equal(model.weeks[0].entries[1].programDayId, 'day-1')
  assert.equal(model.weeks[0].entries[1].status, 'done')
  assert.equal(model.weeks[0].entries[1].durationLabel, '1h 1m')
  assert.equal(model.weeks[0].entries[2].programWorkoutId, 'pw-2')
  assert.equal(model.weeks[0].entries[2].programDayId, 'day-2')
  assert.equal(model.weeks[0].entries[2].status, 'upcoming')
  assert.equal(model.weeks[0].entries[2].durationLabel, '')
  assert.equal(model.weeks[0].entries[3].workoutLabel, 'Rest Day')
  assert.equal(model.weeks[0].entries[3].durationLabel, 'Rest Day')
  assert.equal(model.weeks[0].entries[3].status, 'rest')
  assert.equal(model.weeks[1].entries[1].programWorkoutId, 'pw-3')
  assert.equal(model.weeks[1].entries[1].durationLabel, 'Est. 1h 4m')
  assert.equal(model.weeks[1].entries[6].workoutLabel, 'Program End')
  assert.equal(model.weeks[1].entries[6].durationLabel, 'Program End')
  assert.equal(model.weeks[1].entries[6].isProgramEnd, true)
})

test('getProgramSheetModel supports a thin program preview while the full parent program is still hydrating', () => {
  const model = getProgramSheetModel({
    id: 'prog-thin',
    name: 'Spring 26 Hypertrophy',
  })

  assert.equal(model.title, 'Spring 26 Hypertrophy')
  assert.equal(model.dateRangeLabel, 'Dates not set')
  assert.equal(model.editLabel, 'Edit')
  assert.equal(model.progressSegments.length, 1)
  assert.deepEqual(model.stats.map((stat) => stat.label), ['Week 1 of 1', '0 of 0 Workouts'])
  assert.deepEqual(model.routines, [])
  assert.deepEqual(model.weeks, [])
})
