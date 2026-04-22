import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile bottom navigation uses Lucide icons while header keeps branded SVG icons', () => {
  const shellSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')

  assert.match(shellSource, /from 'lucide-react-native'/)
  assert.match(shellSource, /Dumbbell/)
  assert.match(shellSource, /BarChart3/)
  assert.match(shellSource, /Users/)
  assert.match(shellSource, /MessageCircle/)
  assert.doesNotMatch(shellSource, /pphtBarbellSvg/)
  assert.doesNotMatch(shellSource, /pphtChartBarSvg/)
  assert.doesNotMatch(shellSource, /pphtUsersSvg/)
  assert.doesNotMatch(shellSource, /pphtChatTextSvg/)
})
