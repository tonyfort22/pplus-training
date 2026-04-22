import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoProgramWorkout, createTrainDemoState, getTodaySurfaceModel, getWorkoutSurfaceModel, mobileTabs, trainTabs } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getTrainSurfaceModel } from '../apps/mobile/src/train/train-screen-models.js'
import { getTrainRenderModel } from '../apps/mobile/src/train/train-render-models.js'
import { getSessionSections } from '../apps/mobile/src/screens/session-sections.js'
import { getProgressSurfaceModel, getPlaceholderSurfaceModel } from '../apps/mobile/src/progress/index.js'
import { getProgressSections, getPlaceholderSections } from '../apps/mobile/src/screens/surface-sections.js'
import { getTabButtonModels } from '../apps/mobile/src/ui/tab-models.js'
import { getAppRenderModel } from '../apps/mobile/src/screens/app-render-models.js'

test('getAppRenderModel returns the active train screen and grouped bottom tabs', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const activeSessionModel = getActiveSessionSurfaceModel(trainState.session, 35, null)
  const trainSurfaceModel = getTrainSurfaceModel({
    trainTabs,
    activeTrainTab: 'today',
    todayModel: getTodaySurfaceModel(trainState),
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
  assert.equal(model.bottomTabs.primaryTabs.length, 3)
  assert.equal(model.bottomTabs.utilityTab.key, 'inbox')
  assert.equal(model.bottomTabs.primaryTabs[0].isActive, true)
})

test('getAppRenderModel switches to progress and placeholder surfaces by active tab', () => {
  const model = getAppRenderModel({
    activeTab: 'inbox',
    bottomTabModels: getTabButtonModels({ tabs: mobileTabs, activeKey: 'inbox' }),
    trainRenderModel: { content: { type: 'sections', sections: [] } },
    progressSections: [{ type: 'header', title: 'Progress' }],
    teamSections: [{ type: 'body', title: 'Team' }],
    inboxSections: [{ type: 'body', title: 'Inbox' }],
  })

  assert.equal(model.screen.type, 'inbox')
  assert.equal(model.screen.sections[0].title, 'Inbox')
  assert.equal(model.bottomTabs.utilityTab.isActive, true)
})
