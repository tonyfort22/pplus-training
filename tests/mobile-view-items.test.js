import test from 'node:test'
import assert from 'node:assert/strict'
import { getAppScreenViewModel, getBottomTabViewItems } from '../apps/mobile/src/screens/shell-view-models.js'
import { getProgressSurfaceModel } from '../apps/mobile/src/progress/index.js'
import { getProgressSections } from '../apps/mobile/src/screens/surface-sections.js'
import { getGenericSectionRenderPlan } from '../apps/mobile/src/screens/render-plans.js'
import { createDemoProgramWorkout, createTrainDemoState } from '../apps/mobile/src/train/index.js'
import { getActiveSessionSurfaceModel } from '../apps/mobile/src/train/active-session-models.js'
import { getSessionSections } from '../apps/mobile/src/screens/session-sections.js'
import { getSessionSectionRenderPlan } from '../apps/mobile/src/screens/render-plans.js'
import { getSessionRenderModel } from '../apps/mobile/src/screens/session-render-models.js'
import { getGenericSectionViewItems, getSessionViewItems } from '../apps/mobile/src/screens/view-items.js'

const bottomTabs = [
  { key: 'train', label: 'Train', isActive: true },
  { key: 'progress', label: 'Progress', isActive: false },
  { key: 'team', label: 'Groups', isActive: false },
  { key: 'inbox', label: 'Athletes', isActive: false },
]

test('getBottomTabViewItems returns one four-option bottom bar for shell rendering', () => {
  const items = getBottomTabViewItems(bottomTabs)

  assert.equal(items.tabs.length, 4)
  assert.deepEqual(items.tabs.map((tab) => tab.key), ['train', 'progress', 'team', 'inbox'])
  assert.equal(items.tabs[0].icon, '🏋️')
  assert.equal(items.tabs[1].icon, '📊')
  assert.equal(items.tabs[2].icon, '👥')
  assert.equal(items.tabs[2].label, 'Groups')
  assert.equal(items.tabs[3].label, 'Athletes')
  assert.equal(items.tabs[3].icon, '🪪')
})

test('getGenericSectionViewItems adds stable keys to generic section items', () => {
  const sections = getGenericSectionRenderPlan(getProgressSections(getProgressSurfaceModel()))
  const viewItems = getGenericSectionViewItems(sections)

  assert.equal(viewItems[0].key, 'Performance & recovery')
  assert.equal(viewItems[1].key, 'metrics-grid')
  assert.equal(viewItems[2].key, 'Readiness interpretation')
  assert.equal(viewItems[3].key, 'Training load')
  assert.equal(viewItems[4].key, 'Muscle fatigue')
  assert.equal(viewItems[5].key, 'Performance snapshots')
  assert.equal(viewItems[6].key, 'Recent momentum')
  assert.equal(viewItems[7].key, 'Exercise breakdown')
})

test('getSessionViewItems adds stable keys to session sections, exercises, and sets', () => {
  const trainState = createTrainDemoState({
    programWorkout: createDemoProgramWorkout(),
    startedAt: '2026-04-21T20:00:00.000Z',
  })
  const sessionSections = getSessionSections(getActiveSessionSurfaceModel(trainState.session, 35, null))
  const sessionRenderModel = getSessionRenderModel({
    sessionRenderPlan: getSessionSectionRenderPlan(sessionSections),
    sessionStatus: trainState.session.status,
  })

  const viewItems = getSessionViewItems(sessionRenderModel)

  assert.equal(viewItems[0].key, 'session-header-Lower A')
  assert.equal(viewItems[1].key, 'Active workout session')
  assert.equal(viewItems[1].exercises[0].key, 'exercise-pwe-squat')
  assert.equal(viewItems[1].exercises[0].sets[0].key, 'set-pws-squat-1')
})
