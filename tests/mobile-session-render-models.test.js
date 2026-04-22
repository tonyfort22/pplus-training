import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getSessionSections } from '../apps/mobile/src/screens/session-sections.js'
import { getSessionSectionRenderPlan } from '../apps/mobile/src/screens/render-plans.js'
import { getSessionRenderModel } from '../apps/mobile/src/screens/session-render-models.js'

test('getSessionRenderModel normalizes session header and exercise list rendering data', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const sessionRenderPlan = getSessionSectionRenderPlan(
    getSessionSections(getActiveSessionSurfaceModel(trainState.session, 35, null))
  )

  const model = getSessionRenderModel({
    sessionRenderPlan,
    sessionStatus: trainState.session.status,
  })

  assert.equal(model[0].type, 'session-header-card')
  assert.equal(model[0].isCompleted, false)
  assert.equal(model[0].nextUpLabel, 'Next up: Barbell Back Squat Set 1 • 120 lb x 8')
  assert.equal(model[1].type, 'session-exercise-card')
  assert.equal(model[1].exercises[0].sets[0].completionTone, 'ready')
  assert.equal(model[1].exercises[0].sets[1].completionTone, 'todo')
})

test('getSessionRenderModel marks completed set rows and includes rest timer cards', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const session = {
    ...trainState.session,
    activeRestTimer: {
      exerciseId: 'pwe-squat',
      setId: 'pws-squat-1',
      remainingSeconds: 180,
    },
    exercises: trainState.session.exercises.map((exercise) =>
      exercise.id === 'pwe-squat'
        ? {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === 'pws-squat-1' ? { ...set, isCompleted: true } : set
            ),
          }
        : exercise
    ),
  }

  const sessionRenderPlan = getSessionSectionRenderPlan(
    getSessionSections(getActiveSessionSurfaceModel(session, 35, trainState.session.exercises[0].sets[0]))
  )
  const model = getSessionRenderModel({
    sessionRenderPlan,
    sessionStatus: 'completed',
  })

  assert.equal(model[0].isCompleted, true)
  assert.equal(model[1].type, 'rest-timer-card')
  assert.equal(model[2].exercises[0].sets[0].completionTone, 'done')
})
