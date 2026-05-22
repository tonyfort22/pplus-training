import test from 'node:test'
import assert from 'node:assert/strict'
import webPackage from '../apps/web/package.json' with { type: 'json' }

test('web dev script disables Node experimental webstorage for Next dev', () => {
  assert.match(webPackage.scripts.dev, /--no-experimental-webstorage|--no-webstorage/)
})
