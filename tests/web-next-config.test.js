import test from 'node:test'
import assert from 'node:assert/strict'

import nextConfig from '../apps/web/next.config.mjs'

test('web next config disables Next dev indicators to avoid dev overlay crashes', () => {
  assert.equal(nextConfig.devIndicators, false)
})
