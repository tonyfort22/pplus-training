import test from 'node:test'
import assert from 'node:assert/strict'
import { getTabButtonModels } from '../apps/mobile/src/ui/tab-models.js'
import { getAppScreenViewModel, getBottomTabViewItems } from '../apps/mobile/src/screens/shell-view-models.js'

test('getAppScreenViewModel normalizes train and generic screens for shell rendering', () => {
  const trainScreen = getAppScreenViewModel({
    screen: {
      type: 'train',
      content: { type: 'sections', sections: [{ type: 'action-card', title: 'Today' }] },
      tabs: [{ key: 'today', label: 'Today', isActive: true }],
    },
  })

  const progressScreen = getAppScreenViewModel({
    screen: {
      type: 'progress',
      sections: [{ type: 'header-card', title: 'Performance & recovery' }],
    },
  })

  assert.equal(trainScreen.type, 'train-surface')
  assert.equal(trainScreen.tabs[0].key, 'today')
  assert.equal(progressScreen.type, 'generic-surface')
  assert.equal(progressScreen.sections[0].title, 'Performance & recovery')
})

test('getBottomTabViewItems keeps stable grouped shell tabs', () => {
  const tabs = getTabButtonModels({
    tabs: [
      { key: 'train', label: 'Train' },
      { key: 'progress', label: 'Progress' },
      { key: 'team', label: 'Team' },
      { key: 'inbox', label: 'Inbox' },
    ],
    activeKey: 'progress',
  })

  const viewItems = getBottomTabViewItems(tabs)

  assert.deepEqual(
    viewItems.primaryTabs.map((tab) => ({ key: tab.key, isActive: tab.isActive })),
    [
      { key: 'train', isActive: false },
      { key: 'progress', isActive: true },
      { key: 'team', isActive: false },
    ]
  )
  assert.equal(viewItems.primaryTabs[1].icon, '📊')
  assert.equal(viewItems.utilityTab.key, 'inbox')
  assert.equal(viewItems.utilityTab.isActive, false)
})
