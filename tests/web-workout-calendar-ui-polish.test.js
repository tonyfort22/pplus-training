import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const calendarViewPath = resolve(repoRoot, 'apps/web/components/admin/workouts-calendar-view.jsx')
const calendarRoutePath = resolve(repoRoot, 'apps/web/app/api/admin/workout-calendar/route.js')

test('workout calendar keeps the real add-workout and edit-workout dialog seams wired', () => {
  for (const path of [calendarViewPath, calendarRoutePath]) {
    assert.ok(existsSync(path), `expected workout calendar file to exist: ${path}`)
  }

  const calendarSource = readFileSync(calendarViewPath, 'utf8')
  const routeSource = readFileSync(calendarRoutePath, 'utf8')

  assert.match(calendarSource, /export default function WorkoutsCalendarView/)
  assert.match(calendarSource, /Workout calendar admin view/)
  assert.match(calendarSource, /renderWeekGrid/)
  assert.match(calendarSource, /renderMonthGrid/)
  assert.match(calendarSource, /Open event editor/)
  assert.match(calendarSource, /getWorkoutTypeColors/)
  assert.match(calendarSource, /Ends \{event\.endHour\}/)
  assert.doesNotMatch(calendarSource, /Move earlier/)
  assert.doesNotMatch(calendarSource, /Move later/)
  assert.doesNotMatch(calendarSource, /Drag workout/)

  assert.match(calendarSource, /const \[isMonthOverflowDialogOpen, setIsMonthOverflowDialogOpen\] = useState\(false\)/)
  assert.match(calendarSource, /function renderMonthGrid[\s\S]*visibleEvents = events\.slice\(0, 3\)/)
  assert.match(calendarSource, /function renderMonthGrid[\s\S]*Open workout overflow for day/)
  assert.match(calendarSource, /Dialog open=\{isMonthOverflowDialogOpen\}/)

  assert.match(calendarSource, /requestWorkoutTemplatesApi\(\)/)
  assert.match(calendarSource, /\/api\/admin\/workout-templates/)
  assert.match(calendarSource, /const \[workoutTemplatePagination, setWorkoutTemplatePagination\] = useState\(\{[\s\S]*pageSize:\s*5/)
  assert.match(calendarSource, /const workoutTemplatePageSizeOptions = \[5, 10, 20, 30\]/)
  assert.match(calendarSource, /workoutTemplateHydrationState === 'loading'[\s\S]*workoutTemplateSkeletonRows\.map/)
  assert.match(calendarSource, /Go to previous workout template page/)
  assert.match(calendarSource, /Go to next workout template page/)
  assert.doesNotMatch(calendarSource, /Workout templates[\s\S]*ASSIGNABLE_WORKOUTS\.map/)

  assert.match(calendarSource, /Dialog open=\{isAssignmentDialogOpen\} onOpenChange=\{\(open\) => \{/)
  assert.match(calendarSource, /DialogTitle>Add Workout<\/DialogTitle>/)
  assert.match(calendarSource, /Pick a workout template, start date\/time, and end date\/time before handing the new assignment to the shared program workout flow\./)
  assert.match(calendarSource, /End date must match the start date for calendar workout scheduling\./)
  assert.match(calendarSource, /Create workout/)
  assert.match(calendarSource, /min-h-\[40px\]/)

  assert.match(calendarSource, /WorkoutEditorDialog/)
  assert.match(calendarSource, /title="Edit workout"/)
  assert.match(calendarSource, /primaryActionLabel=\{programWorkoutEditorLoadState === 'saving' \? 'Saving\.\.\.' : 'Save changes'\}/)
  assert.match(calendarSource, /onPrimaryAction=\{programWorkoutEditorLoadState === 'loading' \? undefined : saveProgramWorkoutEditor\}/)
  assert.match(calendarSource, /showTrainingTab/)

  assert.match(routeSource, /export async function GET\(request\)/)
  assert.match(routeSource, /export async function POST\(request\)/)
  assert.match(routeSource, /export async function PATCH\(request\)/)
  assert.match(routeSource, /export async function DELETE\(request\)/)
})
