import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile top header keeps the PPLUS logo but uses Lucide user and calendar icons', () => {
  const shellSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')

  assert.match(shellSource, /from 'lucide-react-native'/)
  assert.match(shellSource, /CircleUserRound/)
  assert.match(shellSource, /CalendarDays/)
  assert.match(shellSource, /logoPphtGreenSvg/)
  assert.match(shellSource, /<SvgXml xml=\{logoPphtGreenSvg\}/)
  assert.doesNotMatch(shellSource, /pphtUserSvg/)
  assert.doesNotMatch(shellSource, /pphtCalendarDotsSvg/)
})
