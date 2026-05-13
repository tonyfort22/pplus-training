import test from 'node:test'
import assert from 'node:assert/strict'
import { demoPreviewStates } from '../apps/mobile/src/train/index.js'
import { getPreviewStateButtonModels } from '../apps/mobile/src/ui/preview-state-models.js'

test('getPreviewStateButtonModels marks the active simulator preview state while preserving labels', () => {
  const models = getPreviewStateButtonModels({
    states: demoPreviewStates,
    activeKey: 'completed',
  })

  assert.deepEqual(
    models.map((model) => ({ key: model.key, label: model.label, isActive: model.isActive })),
    [
      { key: 'planned', label: 'Planned', isActive: false },
      { key: 'active', label: 'Active', isActive: false },
      { key: 'completed', label: 'Completed', isActive: true },
      { key: 'discarded', label: 'Discarded', isActive: false },
    ]
  )
})
