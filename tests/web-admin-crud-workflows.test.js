import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function source(relativePath) {
  const path = resolve(repoRoot, relativePath)
  assert.ok(existsSync(path), `expected file to exist: ${relativePath}`)
  return readFileSync(path, 'utf8')
}

test('admin dashboard CRUD workflow matrix has no fake row actions for requested surfaces', () => {
  const athletesTable = source('apps/web/components/admin/athletes-data-table.jsx')
  const athletesRoute = source('apps/web/app/api/admin/athletes/route.js')
  const athleteRepository = source('apps/web/lib/admin-athlete-repository.js')

  assert.match(athletesRoute, /export async function GET\(\)/)
  assert.match(athletesRoute, /export async function POST\(request\)/)
  assert.match(athletesRoute, /export async function PATCH\(request\)/)
  assert.match(athletesRoute, /export async function DELETE\(request\)/)
  assert.match(athleteRepository, /async deleteAthlete\(\{ athleteId \}\)/)
  assert.match(athletesTable, /method: athleteDialogMode === 'edit' \? 'PATCH' : 'POST'/)
  assert.match(athletesTable, /method: 'DELETE'/)
  assert.match(athletesTable, /onClick=\{handleDeleteAthlete\}/)

  const invitesTable = source('apps/web/components/admin/invites-data-table.jsx')
  const invitesRoute = source('apps/web/app/api/admin/invites/route.js')
  const inviteRepository = source('apps/web/lib/admin-invite-repository.js')

  assert.match(invitesRoute, /export async function GET\(\)/)
  assert.match(invitesRoute, /export async function POST\(request\)/)
  assert.match(invitesRoute, /export async function PATCH\(request\)/)
  assert.match(inviteRepository, /async cancelInvite\(\{ inviteId \}\)/)
  assert.match(invitesTable, /<DropdownMenuItem disabled=\{!canCancel\} onSelect=\{onCancelInvite\}>Cancel invite<\/DropdownMenuItem>/)
  assert.doesNotMatch(invitesTable, /Cancel unavailable/)

  const groupsTable = source('apps/web/components/admin/groups-data-table.jsx')
  const groupsRoute = source('apps/web/app/api/admin/groups/route.js')
  const groupRepository = source('apps/web/lib/admin-group-repository.js')

  assert.match(groupsRoute, /export async function GET\(\)/)
  assert.match(groupsRoute, /export async function POST\(request\)/)
  assert.match(groupsRoute, /export async function PATCH\(request\)/)
  assert.match(groupRepository, /createGroup\(\{/)
  assert.match(groupRepository, /updateGroup\(\{/)
  assert.match(groupRepository, /archiveGroup\(\{/)
  assert.match(groupRepository, /unarchiveGroup\(\{/)
  assert.match(groupRepository, /deleteGroup\(\{/)
  assert.match(groupRepository, /assignProgramToGroup\(\{/)
  assert.match(groupsTable, /action: 'delete'/)
  assert.doesNotMatch(groupsTable, /<DropdownMenuItem>Assign<\/DropdownMenuItem>/)

  const rankingsTable = source('apps/web/components/admin/rankings-data-table.jsx')
  const rankingsRoute = source('apps/web/app/api/admin/rankings/route.js')
  const rankingRepository = source('apps/web/lib/admin-ranking-repository.js')

  assert.match(rankingsRoute, /export async function GET\(\)/)
  assert.match(rankingRepository, /source: 'athlete_workout_progress'/)
  assert.match(rankingsTable, /navigateTo\(`\/admin\/athletes\?athlete=\$\{encodeURIComponent\(athleteId\)\}`\)/)
  assert.match(rankingsTable, /navigateTo\('\/admin\/programs'\)/)
  assert.match(rankingsTable, /navigateTo\('\/admin\/workouts\/calendar'\)/)
})

test('admin programs workouts exercises settings surfaces expose persisted create update delete or honest read-only derivation', () => {
  const programsTable = source('apps/web/components/admin/programs-data-table.jsx')
  const programsRoute = source('apps/web/app/api/admin/programs/route.js')
  const programRepository = source('apps/web/lib/admin-program-repository.js')

  assert.match(programsRoute, /export async function GET\(\)/)
  assert.match(programsRoute, /export async function POST\(request\)/)
  assert.match(programsRoute, /export async function PATCH\(request\)/)
  assert.match(programRepository, /async createProgram\(\{/)
  assert.match(programRepository, /async updateProgram\(\{/)
  assert.match(programsTable, /method: isEditingProgram \? 'PATCH' : 'POST'/)

  const workoutsTable = source('apps/web/components/admin/workouts-data-table.jsx')
  const workoutRoute = source('apps/web/app/api/admin/workout-templates/route.js')
  const programWorkoutRepository = source('apps/web/lib/program-workout-repository.js')

  assert.match(workoutRoute, /export async function GET\(\)/)
  assert.match(workoutRoute, /export async function POST\(request\)/)
  assert.match(workoutRoute, /export async function PATCH\(request\)/)
  assert.match(workoutRoute, /export async function DELETE\(request\)/)
  assert.match(programWorkoutRepository, /async function createWorkoutTemplate\(payload = \{\}\)/)
  assert.match(programWorkoutRepository, /async function updateWorkoutTemplate\(workoutTemplateId, payload = \{\}\)/)
  assert.match(programWorkoutRepository, /async function archiveWorkoutTemplate\(workoutTemplateId\)/)
  assert.match(workoutsTable, /onPrimaryAction=\{isSavingWorkoutTemplate \? null : handleWorkoutTemplatePrimaryAction\}/)
  assert.match(workoutsTable, /openDeleteWorkoutDialog\(row\.original\)/)
  assert.match(workoutsTable, /method: 'DELETE'/)
  assert.doesNotMatch(workoutsTable, /No workout template save endpoint is wired yet/)
  assert.doesNotMatch(workoutsTable, /not saved yet because/)

  const workoutsCalendar = source('apps/web/components/admin/workouts-calendar-view.jsx')
  const workoutCalendarRoute = source('apps/web/app/api/admin/workout-calendar/route.js')

  assert.match(workoutCalendarRoute, /export async function GET\(request\)/)
  assert.match(workoutCalendarRoute, /export async function POST\(request\)/)
  assert.match(workoutCalendarRoute, /export async function PATCH\(request\)/)
  assert.match(workoutCalendarRoute, /export async function DELETE\(request\)/)
  assert.match(workoutsCalendar, /method: 'POST'/)
  assert.match(workoutsCalendar, /method: 'PATCH'/)
  assert.match(workoutsCalendar, /method: 'DELETE'/)

  const exercisesTable = source('apps/web/components/admin/exercises-data-table.jsx')
  const exercisesRoute = source('apps/web/app/api/admin/exercises/route.js')
  const exerciseDetailRoute = source('apps/web/app/api/admin/exercises/[exerciseId]/route.js')
  const exerciseRepository = source('apps/web/lib/admin-exercise-repository.js')

  assert.match(exercisesRoute, /export async function GET\(\)/)
  assert.match(exercisesRoute, /export async function POST\(request\)/)
  assert.match(exerciseDetailRoute, /export async function GET\(request, context\)/)
  assert.match(exerciseDetailRoute, /export async function PATCH\(request, context\)/)
  assert.match(exerciseDetailRoute, /export async function DELETE\(request, context\)/)
  assert.match(exerciseRepository, /async createExercise\(input = \{\}\)/)
  assert.match(exerciseRepository, /async updateExercise\(exerciseId, input = \{\}\)/)
  assert.match(exerciseRepository, /async deleteExercise\(exerciseId\)/)
  assert.match(exercisesTable, /method: 'POST'/)
  assert.match(exercisesTable, /method: 'PATCH'/)
  assert.match(exercisesTable, /method: 'DELETE'/)

  const settingsView = source('apps/web/components/admin/settings-view.jsx')
  const profileRoute = source('apps/web/app/admin/api/settings/profile/route.js')
  const accountRoute = source('apps/web/app/admin/api/settings/account/route.js')

  assert.match(profileRoute, /export async function GET\(\)/)
  assert.match(profileRoute, /export async function PATCH\(request\)/)
  assert.match(accountRoute, /export async function GET\(\)/)
  assert.match(accountRoute, /export async function PATCH\(request\)/)
  assert.match(settingsView, /fetch\('\/admin\/api\/settings\/profile'/)
  assert.match(settingsView, /fetch\('\/admin\/api\/settings\/account'/)
})
