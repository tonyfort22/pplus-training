import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile shell renders a branded top header before the content controls', () => {
  const shellSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'),
    'utf8'
  )
  const rendererSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/renderers.js'),
    'utf8'
  )
  const logoSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/assets/logo-ppht-green.js'),
    'utf8'
  )

  assert.match(shellSource, /from 'react-native-svg'/)
  assert.match(shellSource, /from '..\/assets\/logo-ppht-green\.js'/)
  assert.match(shellSource, /<SvgXml xml=\{logoPphtGreenSvg\}/)
  assert.match(shellSource, /renderProfileHeaderIcon\(styles\)/)
  assert.match(shellSource, /renderUtilityHeaderIcon\(styles\)/)
  assert.match(shellSource, /style=\{styles\.brandHeader\}/)
  assert.match(shellSource, /style=\{styles\.topHeader\}/)
  assert.match(shellSource, /style=\{styles\.previewHeaderTopRow\}/)
  assert.match(rendererSource, /style=\{styles\.trainTabsPill\}/)
  assert.match(rendererSource, /styles\.trainTabButton[\s\S]*styles\.trainTabButtonActive/)
  assert.match(logoSource, /<svg width="92" height="30"/)
  assert.match(logoSource, /#06D6A0/)
})
