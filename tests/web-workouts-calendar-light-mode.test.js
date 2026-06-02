import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const calendarViewPath = resolve(repoRoot, 'apps/web/components/admin/workouts-calendar-view.jsx')
const calendarRepositoryPath = resolve(repoRoot, 'apps/web/lib/workout-calendar-repository.js')
const calendarRoutePath = resolve(repoRoot, 'apps/web/app/api/admin/workout-calendar/route.js')

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`)
  assert.notEqual(start, -1, `expected ${name} function to exist`)
  const nextFunction = source.indexOf('\nfunction ', start + 1)
  return source.slice(start, nextFunction === -1 ? source.length : nextFunction)
}

test('workout calendar reads program_workouts joined to program_days.date and labels cards from workout rows', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')
  const repositorySource = readFileSync(calendarRepositoryPath, 'utf8')
  const routeSource = readFileSync(calendarRoutePath, 'utf8')
  const mapperSource = extractFunction(calendarSource, 'mapAssignmentRowToCalendarEvent')

  assert.match(repositorySource, /restUrl: `\$\{supabaseUrl\.replace\(\/\\\/\$\/, ''\)\}\/rest\/v1\/program_workouts`/)
  assert.match(repositorySource, /'program_days\(date\)'/)
  assert.match(mapperSource, /const resolvedScheduledDate = row\.program_days\?\.date \?\? row\.scheduled_date \?\? null/)
  assert.match(mapperSource, /title: row\.name_snapshot \|\| row\.workout_templates\?\.name \|\| 'Workout'/)
  assert.match(routeSource, /athlete_id: body\.athlete_id \?\? null/)
})

test('workout calendar admin chrome uses light-mode foundation tokens instead of hard-coded dark shell colors', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')

  assert.match(calendarSource, /admin-shell-workouts-calendar-view grid gap-5 text-\[var\(--admin-dashboard-card-text\)\]/)
  assert.match(calendarSource, /border-\[var\(--admin-dashboard-card-border\)\]/)
  assert.match(calendarSource, /bg-\[var\(--admin-dashboard-card-bg\)\]/)
  assert.match(calendarSource, /bg-\[var\(--admin-dashboard-control-bg\)\]/)
  assert.match(calendarSource, /text-\[var\(--admin-dashboard-card-muted\)\]/)
  assert.match(calendarSource, /focus-visible:ring-\[#3BE0AF\]/)
  assert.match(calendarSource, /bg-\[var\(--admin-shell-primary-button-bg\)\] text-\[#0B1120\]/)

  const weekGridSource = extractFunction(calendarSource, 'renderWeekGrid')
  const dayGridSource = extractFunction(calendarSource, 'renderDayGrid')
  assert.match(weekGridSource, /overflow-x-auto rounded-\[24px\] border border-\[var\(--admin-dashboard-card-border\)\] bg-\[var\(--admin-dashboard-card-bg\)\]"/)
  assert.match(dayGridSource, /return renderWeekGrid\(/)
  assert.doesNotMatch(calendarSource, /shadow-\[0_8px_18px_rgba\(0,0,0,0\.14\)\]/)
  assert.doesNotMatch(calendarSource, /shadow-\[0_14px_28px_rgba\(0,0,0,0\.28\)\]/)
  assert.doesNotMatch(calendarSource, /shadow-\[0_18px_40px_rgba\(0,0,0,0\.26\)\]/)
  assert.doesNotMatch(calendarSource, /className="grid h-full w-full[^"]*shadow-\[/)

  assert.doesNotMatch(calendarSource, /border-\[#24334A\]|bg-\[#111827\]|bg-\[#0F1728\]|bg-\[#111D30\]|bg-\[#15233A\]|text-\[#EEF4FF\]|text-\[#DCE6F8\]|text-\[#8EA0BC\]|text-\[#6F84A6\]/)
})

test('workout calendar does not introduce the removed LM plus-two all program filter dropdown', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')

  assert.doesNotMatch(calendarSource, /\bLM\b/)
  assert.doesNotMatch(calendarSource, /\+2/)
  assert.doesNotMatch(calendarSource, /program\s*filter|filter\s*program/i)
})

test('workout calendar can load unassigned program workouts without forcing an athlete selection', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')
  const loaderSource = extractFunction(calendarSource, 'loadPersistedCalendarAssignments')

  assert.doesNotMatch(loaderSource, /if \(!selectedAthleteId\) \{[\s\S]*setScheduledEvents\(\[\]\)[\s\S]*return[\s\S]*\}/)
  assert.match(loaderSource, /const calendarAssignmentsPath = selectedAthleteId\s*\? `\?athleteId=\$\{encodeURIComponent\(selectedAthleteId\)\}`\s*: ''/)
  assert.match(loaderSource, /requestCalendarApi\(calendarAssignmentsPath\)/)
})

test('workout calendar keeps create, edit, and drag behavior wired to persisted program workouts', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')
  const createSource = extractFunction(calendarSource, 'createPersistedAssignment')
  const updateSource = extractFunction(calendarSource, 'updatePersistedAssignment')
  const moveSource = extractFunction(calendarSource, 'moveEventToSlot')
  const weekDragSource = extractFunction(calendarSource, 'handleWeekEventDragEnd')
  const monthDragSource = extractFunction(calendarSource, 'handleMonthEventDragEnd')

  assert.match(createSource, /requestCalendarApi\('', \{[\s\S]*method: 'POST'/)
  assert.match(updateSource, /requestCalendarApi\('', \{[\s\S]*method: 'PATCH'/)
  assert.match(moveSource, /await updatePersistedAssignment\(\{[\s\S]*startDate: date,[\s\S]*startHour: hour,/)
  assert.match(weekDragSource, /await moveEventToSlot\(eventId, targetSlot\.date, targetSlot\.hour\)/)
  assert.match(monthDragSource, /await moveMonthEventToDate\(eventId, targetSlot\.date\)/)
})
