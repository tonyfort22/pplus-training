import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const calendarViewPath = resolve(repoRoot, 'apps/web/components/admin/workouts-calendar-view.jsx')
const calendarSource = readFileSync(calendarViewPath, 'utf8')

test('week and day event cards keep matching vertical inset inside slot cells', () => {
  assert.match(calendarSource, /className="pointer-events-none absolute inset-x-2\.5"/)
  assert.match(calendarSource, /top: `\$\{layout\.topOffset \+ 6\}px`/)
  assert.match(calendarSource, /height: `\$\{Math\.max\(layout\.height - 12, 32\)\}px`/)
})
