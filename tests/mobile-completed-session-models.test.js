import test from 'node:test'
import assert from 'node:assert/strict'
import { completeWorkoutSet, finishWorkoutSession } from '../packages/core/src/index.js'
import { createDemoCompletedSessions, createDemoProgramWorkout, createTrainDemoState, getTodaySurfaceModel, getWorkoutSurfaceModel, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getCompletedSessionSurfaceModel } from '../apps/mobile/src/train/completed-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'
import { getTrainRenderModel } from '../apps/mobile/src/train/train-render-models.js'

function buildCompletedSession({ squatLoad = 120, rdlLoad = 95 } = {}) {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
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

  return {
    trainState,
    session: finishWorkoutSession({
      session,
      completedAt: '2026-04-21T20:30:00.000Z',
      elapsedSeconds: 1800,
      perceivedDifficulty: 7,
      notes: 'Felt strong today and kept the pace up.',
    }),
  }
}

test('getCompletedSessionSurfaceModel builds a workout-completed recap from actual completed work', () => {
  const { session } = buildCompletedSession()
  const priorSessions = createDemoCompletedSessions(createDemoProgramWorkout())

  const model = getCompletedSessionSurfaceModel(session, { completedSessions: priorSessions })

  assert.equal(model.header.title, 'Workout Completed')
  assert.match(model.header.body, /Lower A wrapped up in 00:30:00/)
  assert.equal(model.metrics[0].label, 'Duration')
  assert.equal(model.metrics[0].value, '00:30:00')
  assert.equal(model.metrics[2].label, 'Adherence')
  assert.equal(model.metrics[2].value, '100%')
  assert.equal(model.metrics[3].label, 'Difficulty')
  assert.equal(model.metrics[3].value, '7/10')
  assert.equal(model.highlights.title, 'Workout recap')
  assert.equal(model.highlights.rows[0].title, 'Outcome')
  assert.match(model.highlights.rows[0].body, /saved and ready to feed progress/)
  assert.equal(model.highlights.rows[1].title, 'Session difficulty')
  assert.match(model.highlights.rows[1].body, /7\/10/)
  assert.equal(model.highlights.rows[2].title, 'Workout notes')
  assert.match(model.highlights.rows[2].body, /Felt strong today/)
  assert.equal(model.highlights.rows[3].title, 'Work completed')
  assert.match(model.highlights.rows[3].body, /7\/7 sets/)
  assert.equal(model.highlights.rows[4].title, 'Strongest set')
  assert.match(model.highlights.rows[4].body, /Barbell Back Squat/)
  assert.match(model.highlights.rows[4].body, /120 lb x 8/)
  assert.equal(model.exerciseResults.title, 'Exercise breakdown')
  assert.match(model.exerciseResults.rows[0].body, /4\/4 sets completed\./)
  assert.match(model.exerciseResults.rows[0].body, /Best set: 120 lb x 8 reps \(Set 4\)\./)
  assert.doesNotMatch(model.exerciseResults.rows[0].body, /New PR/)
  assert.equal(model.nextAction.title, 'Keep moving')
  assert.equal(model.nextAction.actionLabel, 'Continue')
  assert.equal(model.nextAction.targetKey, 'today')
})

test('getCompletedSessionSurfaceModel tags a new PR when the finished session beats prior completed history for the same exercise', () => {
  const { session } = buildCompletedSession({ squatLoad: 140, rdlLoad: 110 })
  const priorSessions = createDemoCompletedSessions(createDemoProgramWorkout())

  const model = getCompletedSessionSurfaceModel(session, { completedSessions: priorSessions })

  assert.equal(model.highlights.rows[3].title, 'New PRs')
  assert.match(model.highlights.rows[3].body, /2 new PRs today/)
  assert.match(model.highlights.rows[3].body, /Barbell Back Squat/)
  assert.match(model.highlights.rows[3].body, /Barbell Romanian Deadlift/)
  assert.equal(model.exerciseResults.rows[0].title, 'Barbell Back Squat')
  assert.equal(model.exerciseResults.rows[0].badgeLabel, 'NEW PR')
  assert.equal(model.exerciseResults.rows[0].actionLabel, 'View history')
  assert.equal(model.exerciseResults.rows[0].targetKey, 'exercise-detail')
  assert.equal(model.exerciseResults.rows[0].actionPayload?.sourceSurface, 'completed-session')
  assert.equal(model.exerciseResults.rows[0].actionPayload?.exercise?.exerciseId, 'exercise-squat')
  assert.equal(model.exerciseResults.rows[0].actionPayload?.exercise?.entryContext?.type, 'completed-session-pr')
  assert.equal(model.exerciseResults.rows[0].actionPayload?.exercise?.entryContext?.historyMode, 'best')
  assert.match(model.exerciseResults.rows[0].actionPayload?.exercise?.entryContext?.previousBestLabel || '', /135 lb x 8 reps/)
  assert.match(model.exerciseResults.rows[0].body, /Best set: 140 lb x 8 reps \(Set 4\)\./)
  assert.match(model.exerciseResults.rows[0].body, /New PR/)
  assert.match(model.exerciseResults.rows[0].body, /Previous best: 135 lb x 8 reps/)
  assert.equal(model.exerciseResults.rows[1].title, 'Barbell Romanian Deadlift')
  assert.equal(model.exerciseResults.rows[1].badgeLabel, 'NEW PR')
  assert.equal(model.exerciseResults.rows[1].actionLabel, 'View history')
  assert.equal(model.exerciseResults.rows[1].targetKey, 'exercise-detail')
  assert.equal(model.exerciseResults.rows[1].actionPayload?.sourceSurface, 'completed-session')
  assert.equal(model.exerciseResults.rows[1].actionPayload?.exercise?.exerciseId, 'exercise-rdl')
  assert.equal(model.exerciseResults.rows[1].actionPayload?.exercise?.entryContext?.type, 'completed-session-pr')
  assert.equal(model.exerciseResults.rows[1].actionPayload?.exercise?.entryContext?.historyMode, 'best')
  assert.match(model.exerciseResults.rows[1].actionPayload?.exercise?.entryContext?.previousBestLabel || '', /105 lb x 8 reps/)
  assert.match(model.exerciseResults.rows[1].body, /Best set: 110 lb x 8 reps \(Set 3\)\./)
  assert.match(model.exerciseResults.rows[1].body, /New PR/)
})

test('getTrainSurfaceModel switches the session tab to a completed-session surface once the workout is finished', () => {
  const { trainState, session } = buildCompletedSession()
  const completedSessionModel = getCompletedSessionSurfaceModel(session)

  const model = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(session, 1800, null),
    completedSessionModel,
  })

  assert.equal(model.surface.type, 'completed-session')
  assert.equal(model.surface.summary.header.title, 'Workout Completed')
})

test('getTrainRenderModel converts a completed-session surface into summary sections', () => {
  const { trainState, session } = buildCompletedSession()
  const completedSessionModel = getCompletedSessionSurfaceModel(session)
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(session, 1800, null),
    completedSessionModel,
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: [],
  })

  assert.equal(renderModel.content.type, 'sections')
  assert.equal(renderModel.content.sections[0].type, 'header-card')
  assert.equal(renderModel.content.sections[1].type, 'metrics-grid')
  assert.equal(renderModel.content.sections[2].type, 'body-list')
  assert.equal(renderModel.content.sections[2].title, 'Workout recap')
  assert.equal(renderModel.content.sections[3].type, 'body-list')
  assert.equal(renderModel.content.sections[3].title, 'Exercise breakdown')
  assert.equal(renderModel.content.sections[3].rows[0].badgeLabel, undefined)
  assert.equal(renderModel.content.sections[4].type, 'action-card')
  assert.equal(renderModel.content.sections[4].targetKey, 'today')
})

test('getTrainRenderModel carries PR badge labels through completed-session exercise rows', () => {
  const { trainState, session } = buildCompletedSession({ squatLoad: 140, rdlLoad: 110 })
  const completedSessionModel = getCompletedSessionSurfaceModel(session, {
    completedSessions: createDemoCompletedSessions(createDemoProgramWorkout()),
  })
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'session',
    todayModel: getTodaySurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel: getActiveSessionSurfaceModel(session, 1800, null),
    completedSessionModel,
  })

  const renderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: [],
  })

  assert.equal(renderModel.content.sections[3].type, 'body-list')
  assert.equal(renderModel.content.sections[3].rows[0].badgeLabel, 'NEW PR')
  assert.equal(renderModel.content.sections[3].rows[1].badgeLabel, 'NEW PR')
})
