import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const calendarViewPath = resolve(repoRoot, 'apps/web/components/admin/workouts-calendar-view.jsx')
const calendarRoutePath = resolve(repoRoot, 'apps/web/app/api/admin/workout-calendar/route.js')
const calendarRepositoryPath = resolve(repoRoot, 'apps/web/lib/workout-calendar-repository.js')

const calendarSource = readFileSync(calendarViewPath, 'utf8')
const routeSource = readFileSync(calendarRoutePath, 'utf8')
const repositorySource = readFileSync(calendarRepositoryPath, 'utf8')

test('workout calendar repository avoids non-existent program_workouts color columns on live reads', () => {
  assert.doesNotMatch(repositorySource, /'bg_color'/)
  assert.doesNotMatch(repositorySource, /'text_color'/)
  assert.match(repositorySource, /'program_days\(date\)'/)
  assert.match(repositorySource, /'workout_templates\(name,training_type\)'/)
})

test('workout calendar route does not send unsupported color snapshot columns through assignment writes', () => {
  assert.doesNotMatch(routeSource, /bg_color:\s*body\.bg_color \?\? null/)
  assert.doesNotMatch(routeSource, /text_color:\s*body\.text_color \?\? null/)
})

test('workout calendar maps live training types from workout_templates so cards do not all fall back to warmup blue', () => {
  assert.match(calendarSource, /row\.workout_templates\?\.training_type/)
  assert.match(calendarSource, /getWorkoutTypeColors\(/)
  assert.doesNotMatch(calendarSource, /return ASSIGNABLE_WORKOUTS\.find\(\(workout\) => workout\.id === templateId\) \?\? ASSIGNABLE_WORKOUTS\[0\]/)
})

test('workout calendar live surface does not boot from dummy seeded events when not in debug preview', () => {
  const calendarSource = readFileSync(calendarViewPath, 'utf8')

  assert.match(calendarSource, /const \[scheduledEvents, setScheduledEvents\] = useState\(\[\]\)/)
  assert.doesNotMatch(calendarSource, /const \[scheduledEvents, setScheduledEvents\] = useState\(WORKOUT_EVENTS\)/)
  assert.match(calendarSource, /if \(forceDenseDayPreview\) \{[\s\S]*setScheduledEvents\(WORKOUT_EVENTS\)/)
})

test('workout calendar re-anchors the selected date to the first hydrated workout date after live load', () => {
  assert.match(calendarSource, /const firstHydratedEvent = \[\.\.\.hydratedEvents\]\.sort\(\(left, right\) => left\.startDate - right\.startDate\)\[0\]/)
  assert.match(calendarSource, /setSelectedDate\(new Date\(firstHydratedEvent\.startDate\)\)/)
})
