import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile calendar strip uses NativeWind classes for day layout and state styling', () => {
  const renderersSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/renderers.js'), 'utf8')

  assert.match(renderersSource, /section\.type === 'calendar-strip'/)
  assert.match(renderersSource, /className=/)
  assert.match(renderersSource, /className=\"flex-row items-start justify-between gap-3\"/)
  assert.match(renderersSource, /columnClassName = 'flex-1 items-center'/)
  assert.match(renderersSource, /weekdayClassName = \[[\s\S]*'mb-2 text-\[10px\] font-bold uppercase tracking-\[1\.2px\]'/)
  assert.match(renderersSource, /className=\"min-h-\[44px\] min-w-\[40px\] items-center justify-between rounded-\[14px\] px-1\.5 pt-1\.5 pb-1\"/)
  assert.match(renderersSource, /className=\"text-\[14px\]\"/)
  assert.match(renderersSource, /day\.isSelected/)
  assert.match(renderersSource, /day\.indicatorTone === 'active'/)
  assert.doesNotMatch(renderersSource, /style=\{styles\.calendarStripRow\}/)
  assert.doesNotMatch(renderersSource, /style=\{styles\.calendarDayColumn\}/)
  assert.doesNotMatch(renderersSource, /style=\[styles\.calendarDayButton, day\.isSelected && styles\.calendarDaySelected\]\}/)
})
