export const ADMIN_TEST_RECORD_CLEANUP_TARGETS = Object.freeze({
  programNames: Object.freeze([
    'Test Workflow Program',
    'Updated Test Workflow Program',
    'Test Editable Program',
    'Test Assignable Program',
    'Test Duplicable Program',
    'Test Duplicable Program copy',
    'Test Archivable Program',
    'Test Deletable Program',
  ]),
  workoutTemplateNames: Object.freeze([
    'Test Workflow Workout Template',
    'Updated Workflow Workout Template',
  ]),
  exerciseNames: Object.freeze([
    'Test Workflow Exercise',
    'Updated Workflow Exercise',
    'Lateral bound stick',
  ]),
  athleteNames: Object.freeze([
    Object.freeze({ firstName: 'Testy', lastName: 'McAthlete' }),
  ]),
  groupNames: Object.freeze([
    'Test Workflow Group',
    'Updated Workflow Group',
  ]),
  inviteEmails: Object.freeze([
    'testy.mcathlete+workflow@example.com',
    'pplus.safe+invite.workflow@example.com',
  ]),
})

function createCleanupError(message, status = 500) {
  const error = new Error(message)
  error.status = status
  return error
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase()
}

function unique(values = []) {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)))
}

function matchesKnownAthlete(row) {
  const firstName = normalizeText(row?.first_name ?? row?.firstName)
  const lastName = normalizeText(row?.last_name ?? row?.lastName)
  return ADMIN_TEST_RECORD_CLEANUP_TARGETS.athleteNames.some((target) => (
    firstName === target.firstName && lastName === target.lastName
  ))
}

function matchesKnownProgram(row) {
  const programName = normalizeText(row?.name)
  return ADMIN_TEST_RECORD_CLEANUP_TARGETS.programNames.includes(programName)
}

function matchesKnownWorkoutTemplate(row) {
  const workoutTemplateName = normalizeText(row?.name)
  return ADMIN_TEST_RECORD_CLEANUP_TARGETS.workoutTemplateNames.includes(workoutTemplateName)
}

function matchesKnownExercise(row) {
  const exerciseName = normalizeText(row?.name)
  return ADMIN_TEST_RECORD_CLEANUP_TARGETS.exerciseNames.includes(exerciseName)
}

function matchesKnownGroup(row) {
  const groupName = normalizeText(row?.name)
  return ADMIN_TEST_RECORD_CLEANUP_TARGETS.groupNames.includes(groupName)
}

function matchesKnownInvite(row, athleteIds = []) {
  const inviteEmail = normalizeEmail(row?.invitee_email ?? row?.email)
  const athleteProfileId = normalizeText(row?.athlete_profile_id ?? row?.athleteProfileId)
  return ADMIN_TEST_RECORD_CLEANUP_TARGETS.inviteEmails.includes(inviteEmail)
    || (athleteProfileId && athleteIds.includes(athleteProfileId))
}

function inFilter(values = []) {
  const normalizedValues = unique(values)
  return normalizedValues.length ? `(${normalizedValues.map((value) => encodeURIComponent(value)).join(',')})` : null
}

function getRepositoryConfig() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw createCleanupError('Supabase cleanup requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.', 503)
  }

  return {
    baseUrl: supabaseUrl.replace(/\/$/, ''),
    baseRestUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
  }
}

async function parseJsonResponse(response) {
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text)
}

async function restRequest(path, init = {}) {
  const config = getRepositoryConfig()
  const response = await fetch(`${config.baseRestUrl}/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw createCleanupError(`Supabase cleanup request failed: ${response.status} ${text}`, response.status)
  }

  return parseJsonResponse(response)
}

async function listKnownTable(table) {
  if (table === 'programs') {
    return restRequest('programs?select=id,name')
  }
  if (table === 'workout_templates') {
    return restRequest('workout_templates?select=id,name')
  }
  if (table === 'exercises') {
    return restRequest('exercises?select=id,name')
  }
  if (table === 'athlete_profiles') {
    return restRequest('athlete_profiles?select=id,user_id,first_name,last_name')
  }
  if (table === 'athlete_groups') {
    return restRequest('athlete_groups?select=id,name')
  }
  if (table === 'athlete_invitations') {
    return restRequest('athlete_invitations?select=id,invitee_email,athlete_profile_id')
  }
  throw createCleanupError(`Unsupported cleanup table: ${table}`, 400)
}

async function deleteKnownRows(table, ids = [], key = 'id') {
  const filter = inFilter(ids)
  if (!filter) return []
  return restRequest(`${table}?${key}=in.${filter}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  })
}

async function deleteKnownAuthUser(userId) {
  const normalizedUserId = normalizeText(userId)
  if (!normalizedUserId) return null
  const config = getRepositoryConfig()
  const response = await fetch(`${config.baseUrl}/auth/v1/admin/users/${encodeURIComponent(normalizedUserId)}`, {
    method: 'DELETE',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok && response.status !== 404) {
    const text = await response.text()
    throw createCleanupError(`Supabase auth cleanup failed: ${response.status} ${text}`, response.status)
  }

  if (response.status === 404) return null

  const parsedResponse = await parseJsonResponse(response)
  return parsedResponse ?? { id: normalizedUserId }
}

export function createAdminTestRecordCleanup({
  listTable = listKnownTable,
  deleteTable = deleteKnownRows,
  deleteAuthUser = deleteKnownAuthUser,
} = {}) {
  return {
    async cleanupKnownTestRecords() {
      const [programRows, workoutTemplateRows, exerciseRows, athleteRows, groupRows, inviteRows] = await Promise.all([
        listTable('programs'),
        listTable('workout_templates'),
        listTable('exercises'),
        listTable('athlete_profiles'),
        listTable('athlete_groups'),
        listTable('athlete_invitations'),
      ])

      const matchedPrograms = (Array.isArray(programRows) ? programRows : []).filter(matchesKnownProgram)
      const programIds = unique(matchedPrograms.map((row) => row.id))
      const matchedWorkoutTemplates = (Array.isArray(workoutTemplateRows) ? workoutTemplateRows : []).filter(matchesKnownWorkoutTemplate)
      const workoutTemplateIds = unique(matchedWorkoutTemplates.map((row) => row.id))
      const matchedExercises = (Array.isArray(exerciseRows) ? exerciseRows : []).filter(matchesKnownExercise)
      const exerciseIds = unique(matchedExercises.map((row) => row.id))
      const matchedAthletes = (Array.isArray(athleteRows) ? athleteRows : []).filter(matchesKnownAthlete)
      const athleteIds = unique(matchedAthletes.map((row) => row.id))
      const athleteAuthUserIds = unique(matchedAthletes.map((row) => row.user_id ?? row.userId))
      const matchedGroups = (Array.isArray(groupRows) ? groupRows : []).filter(matchesKnownGroup)
      const groupIds = unique(matchedGroups.map((row) => row.id))
      const matchedInvites = (Array.isArray(inviteRows) ? inviteRows : []).filter((row) => matchesKnownInvite(row, athleteIds))
      const inviteIds = unique(matchedInvites.map((row) => row.id))

      if (groupIds.length > 0) {
        await deleteTable('athlete_group_memberships', groupIds, 'athlete_group_id')
      }
      if (athleteIds.length > 0) {
        await deleteTable('athlete_group_memberships', athleteIds, 'athlete_id')
      }
      if (inviteIds.length > 0) {
        await deleteTable('athlete_invitations', inviteIds, 'id')
      }
      if (exerciseIds.length > 0) {
        await deleteTable('exercise_muscle_maps', exerciseIds, 'exercise_id')
        await deleteTable('exercise_sets', exerciseIds, 'exercise_id')
        await deleteTable('exercises', exerciseIds, 'id')
      }
      if (workoutTemplateIds.length > 0) {
        await deleteTable('workout_templates', workoutTemplateIds, 'id')
      }
      if (programIds.length > 0) {
        await deleteTable('programs', programIds, 'id')
      }
      if (groupIds.length > 0) {
        await deleteTable('athlete_groups', groupIds, 'id')
      }
      if (athleteIds.length > 0) {
        await deleteTable('athlete_profiles', athleteIds, 'id')
      }

      const deletedAuthUserIds = []
      for (const userId of athleteAuthUserIds) {
        const deletedAuthUser = await deleteAuthUser(userId)
        if (deletedAuthUser !== null) {
          deletedAuthUserIds.push(userId)
        }
      }

      return {
        programs: { ids: programIds, deletedCount: programIds.length },
        workoutTemplates: { ids: workoutTemplateIds, deletedCount: workoutTemplateIds.length },
        exercises: { ids: exerciseIds, deletedCount: exerciseIds.length },
        athletes: { ids: athleteIds, deletedCount: athleteIds.length },
        groups: { ids: groupIds, deletedCount: groupIds.length },
        invites: { ids: inviteIds, deletedCount: inviteIds.length },
        authUsers: { ids: deletedAuthUserIds, deletedCount: deletedAuthUserIds.length },
      }
    },
  }
}

export async function cleanupKnownAdminTestRecords() {
  return createAdminTestRecordCleanup().cleanupKnownTestRecords()
}
