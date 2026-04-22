import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile train-home cards and workout rows use NativeWind and Lucide', () => {
  const cardsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/ui/cards.js'), 'utf8')
  const renderersSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/renderers.js'), 'utf8')

  assert.match(cardsSource, /from 'lucide-react-native'/)
  assert.match(cardsSource, /className=/)
  assert.match(cardsSource, /Check/)
  assert.match(cardsSource, /program-summary/)
  assert.match(cardsSource, /today-summary/)
  assert.doesNotMatch(cardsSource, /todayCardCheckIcon/)
  assert.match(renderersSource, /from 'lucide-react-native'/)
  assert.match(renderersSource, /ChevronRight/)
  assert.match(renderersSource, /className=/)
  assert.doesNotMatch(renderersSource, /style=\{styles\.workoutListCard\}/)
})
