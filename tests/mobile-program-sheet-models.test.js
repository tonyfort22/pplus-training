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
  assert.equal(model.weeks[0].topDividerLabel, 'Rest Day')
  assert.equal(model.weeks[0].bottomDividerLabel, 'Rest Day')
  assert.equal(model.weeks[0].entries[0].dayLabel, 'Mon')
  assert.equal(model.weeks[0].entries[0].workoutLabel, 'Lower A')
  assert.equal(model.weeks[0].entries[0].durationLabel, '1 min')
  assert.equal(model.weeks[0].entries[0].status, 'done')
  assert.equal(model.weeks[0].entries[2].status, 'missed')
})
