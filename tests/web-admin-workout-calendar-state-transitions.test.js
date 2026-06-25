import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const calendarViewPath = resolve(repoRoot, 'apps/web/components/admin/workouts-calendar-view.jsx')

function extractFunction(source, functionName) {
  const start = source.indexOf(`function ${functionName}`)
  assert.notEqual(start, -1, `expected ${functionName} to exist`)

  const nextFunction = source.indexOf('\n  function ', start + 1)
  const nextConst = source.indexOf('\n  const ', start + 1)
  const candidates = [nextFunction, nextConst].filter((index) => index !== -1)
  const end = candidates.length ? Math.min(...candidates) : source.length
  return source.slice(start, end)
}

function extractConstFunction(source, functionName) {
  const start = source.indexOf(`const ${functionName} =`)
  assert.notEqual(start, -1, `expected ${functionName} to exist`)

  const nextConst = source.indexOf('\n  const ', start + 1)
  const nextReturn = source.indexOf('\n  return ', start + 1)
  const candidates = [nextConst, nextReturn].filter((index) => index !== -1)
  const end = candidates.length ? Math.min(...candidates) : source.length
  return source.slice(start, end)
}

test('workout calendar date arrows shift by the active calendar view without mutating event state', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')
  const shiftDateSource = extractConstFunction(calendarSource, 'shiftDate')

  assert.match(shiftDateSource, /setSelectedDate\(\(currentDate\) => \{[\s\S]*switch \(currentView\)/)
  assert.match(shiftDateSource, /case 'day':[\s\S]*return shiftDay\(currentDate, delta\)/)
  assert.match(shiftDateSource, /case 'week':[\s\S]*return shiftWeek\(currentDate, delta\)/)
  assert.match(shiftDateSource, /case 'year':[\s\S]*return shiftYear\(currentDate, delta\)/)
  assert.match(shiftDateSource, /case 'agenda':[\s\S]*return shiftMonth\(currentDate, delta\)/)
  assert.match(shiftDateSource, /default:[\s\S]*return shiftMonth\(currentDate, delta\)/)
  assert.doesNotMatch(shiftDateSource, /setScheduledEvents|requestCalendarApi|createPersistedAssignment|updatePersistedAssignment|deletePersistedAssignment/)
})

test('workout calendar view switches clear only transient non-persisted UI state', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')
  const changeViewSource = extractFunction(calendarSource, 'changeCalendarView')

  assert.match(changeViewSource, /setCurrentView\(nextView\)/)
  assert.match(changeViewSource, /setActiveDragEventId\(null\)/)
  assert.match(changeViewSource, /setEventConflictMessage\(''\)/)
  assert.match(changeViewSource, /setAssignmentConflictMessage\(''\)/)
  assert.match(changeViewSource, /setIsMonthOverflowDialogOpen\(false\)/)
  assert.match(changeViewSource, /setMonthOverflowDate\(null\)/)
  assert.doesNotMatch(changeViewSource, /setScheduledEvents|requestCalendarApi|createPersistedAssignment|updatePersistedAssignment|deletePersistedAssignment/)
  assert.doesNotMatch(changeViewSource, /setIsAssignmentDialogOpen\(false\)|setAssignmentDraft\(createAssignmentDraft\(\)\)/)
})

test('workout calendar toolbar routes safe view changes through the transition helper', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')

  for (const view of ['day', 'week', 'month', 'year', 'agenda']) {
    assert.match(calendarSource, new RegExp(`aria-label="View by ${view}"[\\s\\S]*onClick=\\{\\(\\) => changeCalendarView\\('${view}'\\)\\}`))
  }

  assert.doesNotMatch(calendarSource, /aria-label="View by (?:day|week|month|year|agenda)"[\s\S]{0,260}onClick=\{\(\) => setCurrentView\('/)
})

test('workout calendar Today badge re-anchors the date without forcing a view or touching events', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')
  const todayButtonStart = calendarSource.indexOf('onClick={() => setSelectedDate(REFERENCE_TODAY)}')
  assert.notEqual(todayButtonStart, -1, 'expected Today badge to set the selected date directly')

  const todayButtonSource = calendarSource.slice(Math.max(0, todayButtonStart - 220), todayButtonStart + 220)
  assert.doesNotMatch(todayButtonSource, /setCurrentView|setScheduledEvents|requestCalendarApi/)
})
