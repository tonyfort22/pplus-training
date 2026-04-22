import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile shell renders a branded top header without the old preview-state controls', () => {
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
  const iconsSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/assets/ppht-icons.js'),
    'utf8'
  )

  assert.match(shellSource, /from 'react-native-svg'/)
  assert.match(shellSource, /from 'lucide-react-native'/)
  assert.match(shellSource, /from '..\/assets\/logo-ppht-green\.js'/)
  assert.match(shellSource, /<SvgXml xml=\{logoPphtGreenSvg\}/)
  assert.match(shellSource, /renderProfileHeaderIcon\(styles\)/)
  assert.match(shellSource, /renderUtilityHeaderIcon\(styles\)/)
  assert.match(shellSource, /CircleUserRound/)
  assert.match(shellSource, /CalendarDays/)
  assert.match(shellSource, /style=\{styles\.brandHeader\}/)
  assert.doesNotMatch(shellSource, /pphtUserSvg/)
  assert.doesNotMatch(shellSource, /pphtCalendarDotsSvg/)
  assert.doesNotMatch(shellSource, /Preview state/)
  assert.doesNotMatch(shellSource, /previewHeaderTopRow/)
  assert.doesNotMatch(shellSource, /previewBar/)
  assert.match(logoSource, /<svg width="92" height="30"/)
  assert.match(iconsSource, /export const pphtUserSvg/)
  assert.match(iconsSource, /export const pphtUsersSvg/)
  assert.match(iconsSource, /export const pphtBarbellSvg/)
  assert.match(iconsSource, /export const pphtChartBarSvg/)
  assert.match(iconsSource, /export const pphtCalendarDotsSvg/)
  assert.match(iconsSource, /export const pphtChatTextSvg/)
})
