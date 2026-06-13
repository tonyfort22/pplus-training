import test from 'node:test'
import assert from 'node:assert/strict'
import { getTabButtonModels } from '../apps/mobile/src/ui/tab-models.js'
import { getAppScreenViewModel, getBottomTabViewItems } from '../apps/mobile/src/screens/shell-view-models.js'

test('getAppScreenViewModel normalizes train, analytics, and generic screens for shell rendering', () => {
  const trainScreen = getAppScreenViewModel({
    screen: {
      type: 'train',
      content: { type: 'sections', sections: [{ type: 'action-card', title: 'Today' }] },
      tabs: [{ key: 'today', label: 'Today', isActive: true }],
    },
  })

  const analyticsScreen = getAppScreenViewModel({
    screen: {
      type: 'analytics',
      title: 'ANALYTICS',
      activeProgressOptionId: 'strength',
    },
  })

  const authScreen = getAppScreenViewModel({
    screen: {
      type: 'auth',
      title: 'Sign in required',
      tabs: [{ id: 'sign_in', label: 'Sign in', isActive: true }],
    },
  })

  const inboxScreen = getAppScreenViewModel({
    screen: {
      type: 'inbox',
      sections: [{ type: 'body', title: 'Inbox' }],
    },
  })

  assert.equal(trainScreen.type, 'train-surface')
  assert.equal(trainScreen.tabs[0].key, 'today')
  assert.equal(analyticsScreen.type, 'analytics-surface')
  assert.equal(analyticsScreen.title, 'ANALYTICS')
  assert.equal(authScreen.type, 'auth-surface')
  assert.equal(authScreen.tabs[0].id, 'sign_in')
  assert.equal(inboxScreen.type, 'generic-surface')
  assert.equal(inboxScreen.sections[0].title, 'Inbox')
})

test('getBottomTabViewItems keeps stable grouped shell tabs', () => {
  const tabs = getTabButtonModels({
    tabs: [
      { key: 'train', label: 'Train' },
      { key: 'progress', label: 'Progress' },
      { key: 'team', label: 'Groups' },
      { key: 'inbox', label: 'Inbox' },
    ],
    activeKey: 'progress',
  })

  const viewItems = getBottomTabViewItems(tabs)

  assert.deepEqual(
    viewItems.tabs.map((tab) => ({ key: tab.key, isActive: tab.isActive })),
    [
      { key: 'train', isActive: false },
      { key: 'progress', isActive: true },
      { key: 'team', isActive: false },
      { key: 'inbox', isActive: false },
    ]
  )
  assert.equal(viewItems.tabs[1].icon, '📊')
  assert.equal(viewItems.tabs[2].label, 'Groups')
  assert.equal(viewItems.tabs[3].icon, '🪪')
})
