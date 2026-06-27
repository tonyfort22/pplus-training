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

test('getAppRenderModel keeps signed-out override screens outside the app shell bottom tabs', () => {
  const model = getAppRenderModel({
    activeTab: 'train',
    bottomTabModels: getTabButtonModels({ tabs: mobileTabs, activeKey: 'train' }),
    trainRenderModel: { content: { type: 'sections', sections: [] } },
    progressSections: [],
    teamSections: [],
    inboxSections: [],
    overrideScreen: {
      type: 'auth',
      sections: [{ type: 'body', title: 'Sign in' }],
    },
  })

  assert.equal(model.screen.type, 'auth')
  assert.equal(model.bottomTabs, null)
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
  assert.equal(emptyAnalyticsModel.strengthCards.length, 0)
  assert.equal(loadedAnalyticsModel.strengthCards[0].metricLabel, '1RM')
  assert.equal(loadedAnalyticsModel.strengthCards[0].exerciseName, 'Barbell Back Squat')
  assert.equal(loadedAnalyticsModel.strengthCards[0].oneRepMaxValueLabel, '140 lb')
  assert.equal(loadedAnalyticsModel.strengthCards[0].sourcePerformanceTagLabel, '120 lb x 5')
  assert.equal(emptyAnalyticsModel.activityMuscleGroups[5].setCountLabel, '0 sets')
  assert.equal(loadedAnalyticsModel.activityMuscleGroups[5].setCountLabel, '2 sets')
  assert.notEqual(loadedAnalyticsModel.consistencyChart.bars.map((bar) => bar.value).join(','), emptyAnalyticsModel.consistencyChart.bars.map((bar) => bar.value).join(','))
})

test('getAnalyticsViewModel keeps empty athlete strength history honest instead of falling back to demo 1RM cards', () => {
  const analyticsModel = getAnalyticsViewModel({ sessions: [] })

  assert.deepEqual(analyticsModel.strengthCards, [])
  assert.deepEqual(analyticsModel.defaultStrengthExerciseIds, [])
})

test('getAnalyticsViewModel defaults muscles and submuscles with no recorded fatigue to 100 percent recovery instead of 0 percent', () => {
  const completedDeadliftSession = {
    status: 'completed',
    exercises: [
      {
        nameSnapshot: 'Romanian Deadlift',
        sets: [
          { isCompleted: true, actualLoad: 185, actualReps: 6 },
          { isCompleted: true, actualLoad: 185, actualReps: 6 },
        ],
      },
    ],
  }

  const analyticsViewModel = getAnalyticsViewModel({
    sessions: [completedDeadliftSession],
  })

  const legsGroup = analyticsViewModel.recoveryMuscleGroups.find((row) => row.id === 'legs')
  const armsGroup = analyticsViewModel.recoveryMuscleGroups.find((row) => row.id === 'arms')
  const quadsSubMuscle = legsGroup?.subMuscles.find((row) => row.id === 'quads')
  const hamstringsSubMuscle = legsGroup?.subMuscles.find((row) => row.id === 'hamstrings')
  const calvesSubMuscle = legsGroup?.subMuscles.find((row) => row.id === 'calves')

  assert.equal(armsGroup?.percentageLabel, '100%')
  assert.equal(armsGroup?.barWidth, '100%')
  assert.equal(legsGroup?.percentageLabel, '67%')
  assert.equal(legsGroup?.barWidth, '67%')
  assert.equal(quadsSubMuscle?.percentageLabel, '100%')
  assert.equal(quadsSubMuscle?.barWidth, '100%')
  assert.equal(calvesSubMuscle?.percentageLabel, '100%')
  assert.equal(calvesSubMuscle?.barWidth, '100%')
  assert.equal(hamstringsSubMuscle?.percentageLabel, '0%')
})

test('getAnalyticsViewModel does not classify hurdle exercises as hamstrings just because hurdle contains the letters rdl', () => {
  const completedHurdleSession = {
    status: 'completed',
    exercises: [
      {
        nameSnapshot: 'Hurdle Walk Backward',
        sets: [
          { isCompleted: true, actualLoad: 10, actualReps: 1 },
        ],
      },
    ],
  }

  const analyticsViewModel = getAnalyticsViewModel({
    sessions: [completedHurdleSession],
  })

  const legsGroup = analyticsViewModel.recoveryMuscleGroups.find((row) => row.id === 'legs')
  const hamstringsSubMuscle = legsGroup?.subMuscles.find((row) => row.id === 'hamstrings')

  assert.equal(legsGroup?.percentageLabel, '100%')
  assert.equal(legsGroup?.barWidth, '100%')
  assert.equal(hamstringsSubMuscle?.percentageLabel, '100%')
  assert.equal(hamstringsSubMuscle?.barWidth, '100%')
})

test('getAnalyticsViewModel does not classify squat jump variations as full quad recovery fatigue', () => {
  const completedSquatJumpSession = {
    status: 'completed',
    exercises: [
      {
        nameSnapshot: 'DB Squat Jump (Pause at Bottom)',
        sets: [
          { isCompleted: true, actualLoad: 60, actualReps: 5 },
          { isCompleted: true, actualLoad: 60, actualReps: 5 },
        ],
      },
    ],
  }

  const analyticsViewModel = getAnalyticsViewModel({
    sessions: [completedSquatJumpSession],
  })

  const legsGroup = analyticsViewModel.recoveryMuscleGroups.find((row) => row.id === 'legs')
  const quadsSubMuscle = legsGroup?.subMuscles.find((row) => row.id === 'quads')

  assert.equal(legsGroup?.percentageLabel, '100%')
  assert.equal(legsGroup?.barWidth, '100%')
  assert.equal(quadsSubMuscle?.percentageLabel, '100%')
  assert.equal(quadsSubMuscle?.barWidth, '100%')
})

test('getAnalyticsViewModel does not classify trap bar deadlift as full hamstring recovery fatigue', () => {
  const completedTrapBarSession = {
    status: 'completed',
    exercises: [
      {
        nameSnapshot: 'Trap Bar Deadlift',
        sets: [
          { isCompleted: true, actualLoad: 100, actualReps: 4 },
          { isCompleted: true, actualLoad: 100, actualReps: 4 },
        ],
      },
    ],
  }

  const analyticsViewModel = getAnalyticsViewModel({
    sessions: [completedTrapBarSession],
  })

  const legsGroup = analyticsViewModel.recoveryMuscleGroups.find((row) => row.id === 'legs')
  const hamstringsSubMuscle = legsGroup?.subMuscles.find((row) => row.id === 'hamstrings')

  assert.equal(legsGroup?.percentageLabel, '100%')
  assert.equal(legsGroup?.barWidth, '100%')
  assert.equal(hamstringsSubMuscle?.percentageLabel, '100%')
  assert.equal(hamstringsSubMuscle?.barWidth, '100%')
})

test('getAnalyticsViewModel keeps 7 day activity set counts honest across mapped groups and excludes completed sets inside in-progress workouts', () => {
  const completedStrengthSession = {
    status: 'completed',
    exercises: [
      {
        nameSnapshot: 'Barbell Bench Press',
        sets: [
          { isCompleted: true, actualLoad: 135, actualReps: 5 },
          { isCompleted: true, actualLoad: 135, actualReps: 5 },
        ],
      },
      {
        nameSnapshot: 'Barbell Row',
        sets: [
          { isCompleted: true, actualLoad: 95, actualReps: 8 },
        ],
      },
      {
        nameSnapshot: 'DB Bicep Curl',
        sets: [
          { isCompleted: true, actualLoad: 25, actualReps: 10 },
        ],
      },
    ],
  }
  const inProgressSession = {
    status: 'in_progress',
    exercises: [
      {
        nameSnapshot: 'Seated Dumbbell Shoulder Press',
        sets: [
          { isCompleted: true, actualLoad: 40, actualReps: 8 },
          { isCompleted: false, actualLoad: 40, actualReps: 8 },
        ],
      },
      {
        nameSnapshot: 'Plank',
        sets: [
          { isCompleted: true, actualLoad: null, actualReps: null },
        ],
      },
    ],
  }

  const analyticsViewModel = getAnalyticsViewModel({
    sessions: [completedStrengthSession, inProgressSession],
  })

  const armsGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'arms')
  const shouldersGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'shoulders')
  const chestGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'chest')
  const backGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'back')
  const absGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'abs')

  assert.equal(armsGroup?.setCountLabel, '1 sets')
  assert.equal(armsGroup?.subMuscles.find((row) => row.id === 'biceps')?.setCountLabel, '1 sets')
  assert.equal(shouldersGroup?.setCountLabel, '0 sets')
  assert.equal(shouldersGroup?.subMuscles.find((row) => row.id === 'front-delts')?.setCountLabel, '0 sets')
  assert.equal(chestGroup?.setCountLabel, '2 sets')
  assert.equal(chestGroup?.subMuscles.find((row) => row.id === 'mid-chest')?.setCountLabel, '2 sets')
  assert.equal(backGroup?.setCountLabel, '1 sets')
  assert.equal(backGroup?.subMuscles.find((row) => row.id === 'lats')?.setCountLabel, '1 sets')
  assert.equal(absGroup?.setCountLabel, '0 sets')
  assert.equal(absGroup?.subMuscles.find((row) => row.id === 'upper-abs')?.setCountLabel, '0 sets')
})

test('getAnalyticsViewModel does not double count incline bench press across chest submuscles in 7 day activity', () => {
  const analyticsViewModel = getAnalyticsViewModel({
    sessions: [
      {
        status: 'completed',
        exercises: [
          {
            nameSnapshot: 'Incline Bench Press',
            sets: [
              { isCompleted: true, actualLoad: 135, actualReps: 8 },
              { isCompleted: true, actualLoad: 135, actualReps: 8 },
            ],
          },
        ],
      },
    ],
  })

  const chestGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'chest')

  assert.equal(chestGroup?.setCountLabel, '2 sets')
  assert.equal(chestGroup?.subMuscles.find((row) => row.id === 'upper-chest')?.setCountLabel, '2 sets')
  assert.equal(chestGroup?.subMuscles.find((row) => row.id === 'mid-chest')?.setCountLabel, '0 sets')
  assert.equal(chestGroup?.subMuscles.find((row) => row.id === 'lower-chest')?.setCountLabel, '0 sets')
})

test('getAnalyticsViewModel does not classify leg curl variations as biceps activity', () => {
  const analyticsViewModel = getAnalyticsViewModel({
    sessions: [
      {
        status: 'completed',
        exercises: [
          {
            nameSnapshot: 'Seated Leg Curl',
            sets: [
              { isCompleted: true, actualLoad: 70, actualReps: 10 },
              { isCompleted: true, actualLoad: 70, actualReps: 10 },
            ],
          },
        ],
      },
    ],
  })

  const armsGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'arms')
  const legsGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'legs')

  assert.equal(armsGroup?.setCountLabel, '0 sets')
  assert.equal(armsGroup?.subMuscles.find((row) => row.id === 'biceps')?.setCountLabel, '0 sets')
  assert.equal(legsGroup?.setCountLabel, '2 sets')
  assert.equal(legsGroup?.subMuscles.find((row) => row.id === 'hamstrings')?.setCountLabel, '2 sets')
})

test('getAnalyticsViewModel keeps wrist curl in forearms and forearm plank in abs for 7 day activity', () => {
  const analyticsViewModel = getAnalyticsViewModel({
    sessions: [
      {
        status: 'completed',
        exercises: [
          {
            nameSnapshot: 'Wrist Curl',
            sets: [
              { isCompleted: true, actualLoad: 20, actualReps: 12 },
            ],
          },
          {
            nameSnapshot: 'Forearm Plank',
            sets: [
              { isCompleted: true, actualLoad: null, actualReps: null },
            ],
          },
        ],
      },
    ],
  })

  const armsGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'arms')
  const absGroup = analyticsViewModel.activityMuscleGroups.find((row) => row.id === 'abs')

  assert.equal(armsGroup?.setCountLabel, '1 sets')
  assert.equal(armsGroup?.subMuscles.find((row) => row.id === 'biceps')?.setCountLabel, '0 sets')
  assert.equal(armsGroup?.subMuscles.find((row) => row.id === 'forearms')?.setCountLabel, '1 sets')
  assert.equal(absGroup?.setCountLabel, '1 sets')
  assert.equal(absGroup?.subMuscles.find((row) => row.id === 'upper-abs')?.setCountLabel, '1 sets')
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
