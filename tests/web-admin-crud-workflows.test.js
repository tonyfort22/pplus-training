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

function routeHasMethod(routeSource, method) {
  return routeSource.includes(`export async function ${method}(`) || routeSource.includes(`export const ${method} = handlers.${method}`)
}

function assertRouteHasMethod(routeSource, method, label) {
  assert.equal(routeHasMethod(routeSource, method), true, `${label} should export ${method}`)
}

test('admin dashboard CRUD workflow matrix has no fake row actions for requested surfaces', () => {
  const athletesTable = source('apps/web/components/admin/athletes-data-table.jsx')
  const athletesRoute = source('apps/web/app/api/admin/athletes/route.js')
  const athleteRouteHandlers = source('apps/web/lib/admin-athlete-route-handlers.js')
  const athleteRepository = source('apps/web/lib/admin-athlete-repository.js')

  assertRouteHasMethod(athletesRoute, 'GET', 'athletes route')
  assertRouteHasMethod(athletesRoute, 'POST', 'athletes route')
  assertRouteHasMethod(athletesRoute, 'PATCH', 'athletes route')
  assertRouteHasMethod(athletesRoute, 'DELETE', 'athletes route')
  assert.match(athleteRouteHandlers, /createAdminAthleteRouteHandlers/)
  assert.match(athleteRepository, /async deleteAthlete\(\{ athleteId \}\)/)
  assert.match(athletesTable, /method: athleteDialogMode === 'edit' \? 'PATCH' : 'POST'/)
  assert.match(athletesTable, /method: 'DELETE'/)
  assert.match(athletesTable, /onClick=\{handleDeleteAthlete\}/)

  const invitesTable = source('apps/web/components/admin/invites-data-table.jsx')
  const invitesRoute = source('apps/web/app/api/admin/invites/route.js')
  const inviteRouteHandlers = source('apps/web/lib/admin-invite-route-handlers.js')
  const inviteRepository = source('apps/web/lib/admin-invite-repository.js')

  assertRouteHasMethod(invitesRoute, 'GET', 'invites route')
  assertRouteHasMethod(invitesRoute, 'POST', 'invites route')
  assert.match(inviteRouteHandlers, /if \(body\?\.action === 'resend'\)/)
  assert.match(inviteRouteHandlers, /const inviteRows = await inviteRepository\.listInvitesByIds\(\{ inviteIds: body\.inviteIds \}\)/)
  assert.match(inviteRouteHandlers, /athleteRepository\.sendAthleteInvite\(\{[\s\S]*athleteId: invite\.athleteProfileId,[\s\S]*inviteeEmail: invite\.email/)
  assert.match(inviteRouteHandlers, /return json\(\{ result: \{ resentInvites, skippedInvites \} \}\)/)
  assert.match(inviteRepository, /async listInvitesByIds\(\{ inviteIds = \[\] \}\)/)
  assertRouteHasMethod(invitesRoute, 'PATCH', 'invites route')
  assert.match(inviteRepository, /async cancelInvite\(\{ inviteId \}\)/)
  assert.match(invitesTable, /<DropdownMenuItem[\s\S]*disabled=\{!canCancel\}[\s\S]*onCancelInvite\(\)[\s\S]*Cancel invite[\s\S]*<\/DropdownMenuItem>/)
  assert.doesNotMatch(invitesTable, /Cancel unavailable/)

  const groupsTable = source('apps/web/components/admin/groups-data-table.jsx')
  const groupsRoute = source('apps/web/app/api/admin/groups/route.js')
  const groupRepository = source('apps/web/lib/admin-group-repository.js')

  assertRouteHasMethod(groupsRoute, 'GET', 'groups route')
  assertRouteHasMethod(groupsRoute, 'POST', 'groups route')
  assertRouteHasMethod(groupsRoute, 'PATCH', 'groups route')
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

  assertRouteHasMethod(rankingsRoute, 'GET', 'rankings route')
  assert.match(rankingRepository, /source: 'athlete_workout_progress'/)
  assert.match(rankingsTable, /navigateTo\(`\/admin\/athletes\?athlete=\$\{encodeURIComponent\(athleteId\)\}`\)/)
  assert.match(rankingsTable, /navigateTo\('\/admin\/programs'\)/)
  assert.match(rankingsTable, /navigateTo\('\/admin\/workouts\/calendar'\)/)
})

test('admin programs workouts exercises settings surfaces expose persisted create update delete or honest read-only derivation', () => {
  const programsTable = source('apps/web/components/admin/programs-data-table.jsx')
  const programsRoute = source('apps/web/app/api/admin/programs/route.js')
  const programRepository = source('apps/web/lib/admin-program-repository.js')

  assertRouteHasMethod(programsRoute, 'GET', 'programs route')
  assertRouteHasMethod(programsRoute, 'POST', 'programs route')
  assertRouteHasMethod(programsRoute, 'PATCH', 'programs route')
  assert.match(programRepository, /async createProgram\(\{/)
  assert.match(programRepository, /async updateProgram\(\{/)
  assert.match(programsTable, /method: isEditingProgram \|\| isAssigningProgram \? 'PATCH' : 'POST'/)
  assert.match(programsTable, /isDuplicatingProgram[\s\S]*\? \{ action: 'duplicate'/)
  assert.match(programsTable, /isAssigningProgram[\s\S]*\? \{ action: 'assign-athletes'/)

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

  assertRouteHasMethod(workoutCalendarRoute, 'GET', 'workout calendar route')
  assertRouteHasMethod(workoutCalendarRoute, 'POST', 'workout calendar route')
  assertRouteHasMethod(workoutCalendarRoute, 'PATCH', 'workout calendar route')
  assertRouteHasMethod(workoutCalendarRoute, 'DELETE', 'workout calendar route')
  assert.match(workoutsCalendar, /method: 'POST'/)
  assert.match(workoutsCalendar, /method: 'PATCH'/)
  assert.match(workoutsCalendar, /method: 'DELETE'/)

  const exercisesTable = source('apps/web/components/admin/exercises-data-table.jsx')
  const exercisesRoute = source('apps/web/app/api/admin/exercises/route.js')
  const exerciseDetailRoute = source('apps/web/app/api/admin/exercises/[exerciseId]/route.js')
  const exerciseRepository = source('apps/web/lib/admin-exercise-repository.js')

  assertRouteHasMethod(exercisesRoute, 'GET', 'exercises route')
  assertRouteHasMethod(exercisesRoute, 'POST', 'exercises route')
  assertRouteHasMethod(exerciseDetailRoute, 'GET', 'exercise detail route')
  assertRouteHasMethod(exerciseDetailRoute, 'PATCH', 'exercise detail route')
  assertRouteHasMethod(exerciseDetailRoute, 'DELETE', 'exercise detail route')
  assert.match(exerciseRepository, /async createExercise\(input = \{\}\)/)
  assert.match(exerciseRepository, /async updateExercise\(exerciseId, input = \{\}\)/)
  assert.match(exerciseRepository, /normalizeDirectExerciseVideoUrl\(input, client\.config\.baseUrl\)/)
  assert.match(exerciseRepository, /const directThumbnailUrl = normalizeOptionalString\(input\?\.thumbnailUrl\)/)
  assert.match(exerciseRepository, /payload\.thumbnail_url = directThumbnailUrl/)
  assert.match(exerciseRepository, /payload\.video_url = directVideoUrl/)
  assert.match(exerciseRepository, /thumbnailUrl = normalizeOptionalString\(row\?\.thumbnail_url\)/)
  assert.match(exerciseRepository, /videoUrl = normalizeOptionalString\(row\?\.video_url\)/)
  assert.match(exerciseRepository, /thumbnailUrl,/)
  assert.match(exerciseRepository, /videoUrl,/)
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
