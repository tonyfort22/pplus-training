import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile shell groups preview state and train tabs into a dedicated header zone', () => {
  const shellSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'),
    'utf8'
  )
  const rendererSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/renderers.js'),
    'utf8'
  )

  assert.match(shellSource, /style=\{styles\.topHeader\}/)
  assert.match(shellSource, /style=\{styles\.previewHeaderTopRow\}/)
  assert.match(rendererSource, /style=\{styles\.trainTabsPill\}/)
  assert.match(rendererSource, /styles\.trainTabButton[\s\S]*styles\.trainTabButtonActive/)
})
