import test from 'node:test'
import assert from 'node:assert/strict'
import { getTabButtonModels } from '../apps/mobile/src/ui/tab-models.js'

test('getTabButtonModels marks the active tab while preserving tab metadata', () => {
  const tabs = [
    { key: 'train', label: 'Train' },
    { key: 'progress', label: 'Progress' },
    { key: 'team', label: 'Team' },
  ]

  const models = getTabButtonModels({ tabs, activeKey: 'progress' })

  assert.equal(models.length, 3)
  assert.equal(models[0].key, 'train')
  assert.equal(models[1].label, 'Progress')
  assert.equal(models[1].isActive, true)
  assert.equal(models[0].isActive, false)
  assert.equal(models[2].isActive, false)
})

test('getTabButtonModels leaves all tabs inactive when active key is unknown', () => {
  const models = getTabButtonModels({
    tabs: [
      { key: 'today', label: 'Today' },
      { key: 'program', label: 'Program' },
    ],
    activeKey: 'session',
  })

  assert.equal(models.every((tab) => tab.isActive === false), true)
})
