import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState, getCalendarSurfaceModel, getTodaySurfaceModel, getWorkoutSurfaceModel, mobileTabs, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'
import { getTrainRenderModel } from '../apps/mobile/src/train/train-render-models.js'
import { getSessionSections } from '../apps/mobile/src/screens/session-sections.js'
import { getAnalyticsViewModel, getProgressSurfaceModel, getPlaceholderSurfaceModel } from '../apps/mobile/src/progress/index.js'
import { getProgressSections, getPlaceholderSections } from '../apps/mobile/src/screens/surface-sections.js'
import { getTabButtonModels } from '../apps/mobile/src/ui/tab-models.js'
import { getAppRenderModel } from '../apps/mobile/src/screens/app-render-models.js'

test('getAppRenderModel returns the active train screen and one four-option bottom bar', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const activeSessionModel = getActiveSessionSurfaceModel(trainState.session, 35, null)
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'today',
    todayModel: getTodaySurfaceModel(trainState),
    calendarModel: getCalendarSurfaceModel(trainState),
    workoutModel: getWorkoutSurfaceModel(trainState),
    activeSessionModel,
  })
  const trainRenderModel = getTrainRenderModel({
    trainSurfaceModel,
    sessionSections: getSessionSections(activeSessionModel),
  })

  const model = getAppRenderModel({
    activeTab: 'train',
    bottomTabModels: getTabButtonModels({ tabs: mobileTabs, activeKey: 'train' }),
    trainRenderModel,
    progressSections: getProgressSections(getProgressSurfaceModel()),
    teamSections: getPlaceholderSections(getPlaceholderSurfaceModel('Team', 'Later')),
    inboxSections: getPlaceholderSections(getPlaceholderSurfaceModel('Inbox', 'Later')),
  })

  assert.equal(model.screen.type, 'train')
  assert.equal(model.screen.content.type, 'sections')
  assert.equal(model.bottomTabs.tabs.length, 4)
  assert.equal(model.bottomTabs.tabs[3].key, 'inbox')
  assert.equal(model.bottomTabs.tabs[3].icon, '🪪')
  assert.equal(model.bottomTabs.tabs[0].isActive, true)
})

test('getAppRenderModel can override the train screen during auth/bootstrap states', () => {
  const model = getAppRenderModel({
    activeTab: 'train',
    bottomTabModels: getTabButtonModels({ tabs: mobileTabs, activeKey: 'train' }),
    trainRenderModel: { content: { type: 'sections', sections: [] } },
    progressSections: [],
    teamSections: [],
    inboxSections: [],
    overrideScreen: {
      type: 'train-bootstrap',
      sections: [{ type: 'body', title: 'Sign in required' }],
    },
  })

  assert.equal(model.screen.type, 'train-bootstrap')
  assert.equal(model.screen.sections[0].title, 'Sign in required')
})

test('getAppRenderModel switches to analytics and placeholder surfaces by active tab', () => {
  const model = getAppRenderModel({
    activeTab: 'progress',
    bottomTabModels: getTabButtonModels({ tabs: mobileTabs, activeKey: 'progress' }),
    trainRenderModel: { content: { type: 'sections', sections: [] } },
    analyticsScreen: getAnalyticsViewModel(),
    progressSections: [{ type: 'header', title: 'Progress' }],
    teamSections: [{ type: 'body', title: 'Team' }],
    inboxSections: [{ type: 'body', title: 'Inbox' }],
  })

  assert.equal(model.screen.type, 'analytics')
  assert.equal(model.screen.title, 'ANALYTICS')
  assert.equal(model.screen.activeProgressOptionId, 'strength')
  assert.equal(model.bottomTabs.tabs[1].isActive, true)
})

test('getAnalyticsViewModel derives coach progress analytics from the selected athlete\'s completed sessions instead of keeping stale shared defaults', () => {
  const emptyProgressModel = getProgressSurfaceModel({ sessions: [] })
  const completedSquatSession = {
    status: 'completed',
    completedAt: '2026-05-03T18:00:00.000Z',
    completedSetsCount: 2,
    totalSetsCount: 2,
    exercises: [
      {
        nameSnapshot: 'Barbell Back Squat',
        exerciseId: 'exercise-back-squat',
        sets: [
          { isCompleted: true, actualLoad: 120, actualLoadUnit: 'lb', actualReps: 5 },
          { isCompleted: true, actualLoad: 110, actualLoadUnit: 'lb', actualReps: 5 },
        ],
      },
    ],
  }
  const loadedProgressModel = getProgressSurfaceModel({ sessions: [completedSquatSession] })

  const emptyAnalyticsModel = getAnalyticsViewModel({ sessions: [], progressModel: emptyProgressModel })
  const loadedAnalyticsModel = getAnalyticsViewModel({ sessions: [completedSquatSession], progressModel: loadedProgressModel })

  assert.notDeepEqual(loadedAnalyticsModel.strengthCards, emptyAnalyticsModel.strengthCards)
  assert.equal(emptyAnalyticsModel.strengthCards[0].oneRepMaxValueLabel, '149 lb')
  assert.equal(loadedAnalyticsModel.strengthCards[0].metricLabel, '1RM')
  assert.equal(loadedAnalyticsModel.strengthCards[0].exerciseName, 'Barbell Back Squat')
  assert.equal(loadedAnalyticsModel.strengthCards[0].oneRepMaxValueLabel, '140 lb')
  assert.equal(loadedAnalyticsModel.strengthCards[0].sourcePerformanceTagLabel, '120 lb x 5')
  assert.equal(emptyAnalyticsModel.activityMuscleGroups[5].setCountLabel, '0 sets')
  assert.equal(loadedAnalyticsModel.activityMuscleGroups[5].setCountLabel, '2 sets')
  assert.notEqual(loadedAnalyticsModel.consistencyChart.bars.map((bar) => bar.value).join(','), emptyAnalyticsModel.consistencyChart.bars.map((bar) => bar.value).join(','))
})

test('getAnalyticsViewModel keeps the Strength persistence key stable for one athlete even when completed session ids change', () => {
  const firstCompletedSession = {
    id: 'session-1',
    athleteId: 'athlete-1',
    status: 'completed',
    completedAt: '2026-05-03T18:00:00.000Z',
    exercises: [
      {
        nameSnapshot: 'Barbell Back Squat',
        exerciseId: 'exercise-back-squat',
        sets: [
          { isCompleted: true, actualLoad: 120, actualLoadUnit: 'lb', actualReps: 5 },
        ],
      },
    ],
  }
  const secondCompletedSession = {
    ...firstCompletedSession,
    id: 'session-2',
    completedAt: '2026-05-04T18:00:00.000Z',
  }

  const firstModel = getAnalyticsViewModel({
    sessions: [firstCompletedSession],
    strengthSelectionContextId: 'athlete-1',
  })
  const secondModel = getAnalyticsViewModel({
    sessions: [firstCompletedSession, secondCompletedSession],
    strengthSelectionContextId: 'athlete-1',
  })

  assert.equal(firstModel.strengthSelectionPersistenceKey, 'analytics-strength:athlete-1')
  assert.equal(secondModel.strengthSelectionPersistenceKey, 'analytics-strength:athlete-1')
})
