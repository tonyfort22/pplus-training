import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWorkoutSet, finishWorkoutSession } from '../packages/core/src/index.js'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getPlaceholderSurfaceModel, getProgressSurfaceModel } from '../apps/mobile/src/progress/index.js'

function buildCompletedSessionHistory() {
  const baseWorkout = createDemoProgramWorkout()

  function buildFinishedSession({ completedAt, squatLoad, rdlLoad }) {
    const trainState = createTrainDemoState({
      programWorkout: baseWorkout,
      startedAt: '2026-04-21T20:00:00.000Z',
    })

    let session = trainState.session
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        const actualLoad = exercise.id === 'pwe-squat' ? squatLoad : rdlLoad
        session = completeWorkoutSet({
          session,
          exerciseId: exercise.id,
          setId: set.id,
          actuals: {
            actualLoad,
            actualReps: set.prescribedReps,
            actualRpe: set.prescribedRpe,
            actualRestSeconds: set.prescribedRestSeconds,
          },
        })
      }
    }

    return finishWorkoutSession({ session, completedAt, elapsedSeconds: 1800 })
  }

  return [
    buildFinishedSession({ completedAt: '2026-04-18T20:30:00.000Z', squatLoad: 125, rdlLoad: 100 }),
    buildFinishedSession({ completedAt: '2026-04-20T20:30:00.000Z', squatLoad: 135, rdlLoad: 105 }),
  ]
}

test('getProgressSurfaceModel derives athlete metrics from completed sessions', () => {
  const model = getProgressSurfaceModel({ sessions: buildCompletedSessionHistory() })

  assert.equal(model.header.eyebrow, 'Progress')
  assert.equal(model.header.title, 'Performance & recovery')
  assert.equal(model.metrics.length, 3)
  assert.equal(model.metrics[0].label, 'Back Squat est. 1RM')
  assert.equal(model.metrics[0].value, '171 lb')
  assert.match(model.metrics[1].detail, /2 completed sessions/i)
  assert.equal(model.metrics[2].value, 'Moderate')
  assert.equal(model.trainingLoad.title, 'Training load')
  assert.match(model.trainingLoad.body, /2 completed sessions/i)
  assert.equal(model.muscleFatigue.rows[0].title, 'Quads')
  assert.equal(model.performanceSnapshots.title, 'Performance snapshots')
  assert.match(model.performanceSnapshots.body, /100% adherence/i)
  assert.equal(model.recentMomentum.title, 'Recent momentum')
  assert.equal(model.recentMomentum.rows.length, 2)
  assert.match(model.recentMomentum.rows[0].title, /Apr 20/)
  assert.match(model.recentMomentum.rows[0].title, /Lower A/)
  assert.match(model.recentMomentum.rows[0].body, /171 lb est\. 1RM/)
  assert.match(model.recentMomentum.rows[0].body, /Trending up/)
  assert.match(model.recentMomentum.rows[0].body, /\+13 lb vs last completed session/)
  assert.equal(model.exerciseBreakdown.title, 'Exercise breakdown')
  assert.equal(model.exerciseBreakdown.rows.length, 2)
  assert.equal(model.exerciseBreakdown.rows[0].title, 'Squat pattern')
  assert.match(model.exerciseBreakdown.rows[0].body, /171 lb best estimate/)
  assert.match(model.exerciseBreakdown.rows[0].body, /Trending up/)
  assert.equal(model.exerciseBreakdown.rows[1].title, 'Hinge pattern')
  assert.match(model.exerciseBreakdown.rows[1].body, /133 lb best estimate/)
})

test('getProgressSurfaceModel falls back cleanly when no completed sessions exist', () => {
  const model = getProgressSurfaceModel({ sessions: [] })

  assert.equal(model.metrics[0].value, '--')
  assert.equal(model.metrics[1].value, '0')
  assert.equal(model.metrics[2].value, 'Low')
  assert.match(model.performanceSnapshots.body, /No completed sessions yet/i)
  assert.equal(model.recentMomentum.title, 'Recent momentum')
  assert.equal(model.recentMomentum.rows.length, 1)
  assert.match(model.recentMomentum.rows[0].body, /Finish a workout to start building recent momentum/i)
  assert.equal(model.exerciseBreakdown.title, 'Exercise breakdown')
  assert.equal(model.exerciseBreakdown.rows.length, 2)
  assert.match(model.exerciseBreakdown.rows[0].body, /Complete squat sessions to unlock this breakdown/i)
  assert.match(model.exerciseBreakdown.rows[1].body, /Complete hinge sessions to unlock this breakdown/i)
})

test('getProgressSurfaceModel keeps first recent momentum row neutral when there is no prior session to compare', () => {
  const [singleSession] = buildCompletedSessionHistory()
  const model = getProgressSurfaceModel({ sessions: [singleSession] })

  assert.equal(model.recentMomentum.rows.length, 1)
  assert.match(model.recentMomentum.rows[0].body, /First completed session in this sample/)
})

test('getPlaceholderSurfaceModel keeps placeholder screens consistent', () => {
  const model = getPlaceholderSurfaceModel('Inbox', 'This surface will hold communication later.')

  assert.deepEqual(model, {
    title: 'Inbox',
    body: 'This surface will hold communication later.',
  })
})
