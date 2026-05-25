function createRepositoryError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  error.cause = cause
  return error
}

function getRepositoryConfig() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRepositoryError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return {
    baseRestUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
  }
}

async function requestTable(table, query = '') {
  const { baseRestUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${baseRestUrl}/${table}${query}`, {
    method: 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`${table} request failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

async function insertTable(table, payload) {
  const { baseRestUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${baseRestUrl}/${table}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    cache: 'no-store',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`${table} insert failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

async function patchTable(table, query = '', payload = {}) {
  const { baseRestUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${baseRestUrl}/${table}${query}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    cache: 'no-store',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`${table} patch failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

async function deleteTable(table, query = '') {
  const { baseRestUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${baseRestUrl}/${table}${query}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`${table} delete failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

function encodeInFilter(values = []) {
  const filtered = values.filter(Boolean)
  return filtered.length ? `(${filtered.map((value) => encodeURIComponent(value)).join(',')})` : null
}

function normalizeAthleteIds(athleteIds = []) {
  return Array.from(new Set((Array.isArray(athleteIds) ? athleteIds : []).filter(Boolean)))
}

function formatGroupStatus(status) {
  if (status === 'archived') return 'Archived'
  return 'Active'
}

function formatAccessLevel(accessLevel) {
  if (accessLevel === 'public') return 'Public'
  return 'Private'
}

function formatUpdatedDate(value) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function formatAthleteCountLabel(count) {
  return `${count} athlete${count === 1 ? '' : 's'}`
}

function createAthleteNameMap(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((accumulator, row) => {
    if (!row?.id) return accumulator
    const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim()
    accumulator.set(row.id, fullName || 'Unnamed athlete')
    return accumulator
  }, new Map())
}

function createMembershipsByGroupId(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((accumulator, row) => {
    const groupId = row?.athlete_group_id
    if (!groupId) return accumulator
    const list = accumulator.get(groupId) ?? []
    list.push(row)
    accumulator.set(groupId, list)
    return accumulator
  }, new Map())
}

function mapGroupRow(row, context) {
  const memberships = context.membershipsByGroupId.get(row.id) ?? []
  const athleteNames = memberships.map((membership) => context.athleteNameById.get(membership.athlete_id)).filter(Boolean)
  return {
    id: row.id,
    name: row.name ?? 'Untitled group',
    athleteCount: memberships.length,
    athleteCountLabel: formatAthleteCountLabel(memberships.length),
    athletes: formatAthleteCountLabel(memberships.length),
    athleteIds: memberships.map((membership) => membership.athlete_id).filter(Boolean),
    athleteNames,
    access: formatAccessLevel(row.access_level),
    accessLevel: row.access_level ?? 'private',
    updated: formatUpdatedDate(row.updated_at ?? row.created_at),
    updatedAt: row.updated_at ?? row.created_at ?? null,
    status: formatGroupStatus(row.status),
    statusValue: row.status ?? 'active',
    description: row.description ?? '',
  }
}

function mapAthleteOption(row) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unnamed athlete'
  return { id: row.id, name }
}

function mapProgramOption(row) {
  const athleteName = [row?.athlete_profiles?.first_name, row?.athlete_profiles?.last_name].filter(Boolean).join(' ').trim()
  return {
    id: row.id,
    name: row.name ?? 'Untitled program',
    athleteLabel: athleteName || 'Unassigned',
    label: athleteName ? `${row.name} · ${athleteName}` : row.name ?? 'Untitled program',
  }
}

async function resolveCoachId() {
  const coachRows = await requestTable('coach_profiles', '?select=id&order=created_at.asc&limit=1')
  const coachId = Array.isArray(coachRows) ? coachRows[0]?.id : null
  if (!coachId) throw createRepositoryError('No coach profile exists yet for group ownership.', 400)
  return coachId
}

async function syncMemberships(groupId, athleteIds) {
  const normalizedAthleteIds = normalizeAthleteIds(athleteIds)
  await deleteTable('athlete_group_memberships', `?athlete_group_id=eq.${encodeURIComponent(groupId)}`)
  if (!normalizedAthleteIds.length) return []
  return insertTable('athlete_group_memberships', normalizedAthleteIds.map((athleteId) => ({ athlete_group_id: groupId, athlete_id: athleteId })))
}

async function getGroupAthleteIds(groupId) {
  const memberships = await requestTable('athlete_group_memberships', `?select=athlete_id&athlete_group_id=eq.${encodeURIComponent(groupId)}`)
  return normalizeAthleteIds((Array.isArray(memberships) ? memberships : []).map((row) => row.athlete_id))
}

async function cloneProgramTreeForAthlete({ athleteId, sourceProgramId }) {
  const sourcePrograms = await requestTable('programs', `?select=*&id=eq.${encodeURIComponent(sourceProgramId)}&limit=1`)
  const sourceProgram = Array.isArray(sourcePrograms) ? sourcePrograms[0] : null
  if (!sourceProgram) throw createRepositoryError('Source program not found.', 404)

  const sourceWeeks = await requestTable('program_weeks', `?select=*&program_id=eq.${encodeURIComponent(sourceProgramId)}&order=week_index.asc`)
  const weekIds = Array.isArray(sourceWeeks) ? sourceWeeks.map((row) => row.id).filter(Boolean) : []
  const dayFilter = encodeInFilter(weekIds)
  const sourceDays = dayFilter ? await requestTable('program_days', `?select=*&program_week_id=in.${dayFilter}&order=created_at.asc`) : []
  const sourceWorkouts = await requestTable('program_workouts', `?select=*&program_id=eq.${encodeURIComponent(sourceProgramId)}&order=created_at.asc`)
  const workoutIds = Array.isArray(sourceWorkouts) ? sourceWorkouts.map((row) => row.id).filter(Boolean) : []
  const workoutExerciseFilter = encodeInFilter(workoutIds)
  const sourceWorkoutExercises = workoutExerciseFilter
    ? await requestTable('program_workout_exercises', `?select=*&program_workout_id=in.${workoutExerciseFilter}&order=created_at.asc`)
    : []
  const workoutExerciseIds = Array.isArray(sourceWorkoutExercises) ? sourceWorkoutExercises.map((row) => row.id).filter(Boolean) : []
  const setFilter = encodeInFilter(workoutExerciseIds)
  const sourceWorkoutSets = setFilter
    ? await requestTable('program_workout_sets', `?select=*&program_workout_exercise_id=in.${setFilter}&order=created_at.asc`)
    : []

  const now = new Date().toISOString()
  const createdProgramRows = await insertTable('programs', {
    athlete_id: athleteId,
    coach_id: sourceProgram.coach_id ?? (await resolveCoachId()),
    name: sourceProgram.name,
    description: sourceProgram.description,
    start_date: sourceProgram.start_date,
    end_date: sourceProgram.end_date,
    status: sourceProgram.status ?? 'active',
    updated_at: now,
  })
  const createdProgram = Array.isArray(createdProgramRows) ? createdProgramRows[0] : createdProgramRows
  const createdProgramId = createdProgram?.id
  if (!createdProgramId) throw createRepositoryError('Failed to clone program.', 500)

  const weekIdMap = new Map()
  for (const week of Array.isArray(sourceWeeks) ? sourceWeeks : []) {
    const createdWeekRows = await insertTable('program_weeks', {
      program_id: createdProgramId,
      week_index: week.week_index,
      name: week.name,
      start_date: week.start_date,
      end_date: week.end_date,
      updated_at: now,
    })
    const createdWeek = Array.isArray(createdWeekRows) ? createdWeekRows[0] : createdWeekRows
    if (createdWeek?.id) weekIdMap.set(week.id, createdWeek.id)
  }

  const dayIdMap = new Map()
  for (const day of Array.isArray(sourceDays) ? sourceDays : []) {
    const mappedWeekId = weekIdMap.get(day.program_week_id)
    if (!mappedWeekId) continue
    const createdDayRows = await insertTable('program_days', {
      program_week_id: mappedWeekId,
      day_index: day.day_index,
      date: day.date,
      name: day.name,
      notes: day.notes,
      status: day.status,
      updated_at: now,
    })
    const createdDay = Array.isArray(createdDayRows) ? createdDayRows[0] : createdDayRows
    if (createdDay?.id) dayIdMap.set(day.id, createdDay.id)
  }

  const workoutIdMap = new Map()
  for (const workout of Array.isArray(sourceWorkouts) ? sourceWorkouts : []) {
    const createdWorkoutRows = await insertTable('program_workouts', {
      athlete_id: athleteId,
      coach_id: workout.coach_id ?? sourceProgram.coach_id ?? null,
      program_id: createdProgramId,
      program_day_id: dayIdMap.get(workout.program_day_id) ?? null,
      workout_template_id: workout.workout_template_id,
      name_snapshot: workout.name_snapshot,
      notes: workout.notes,
      status: workout.status ?? 'scheduled',
      sort_order: workout.sort_order,
      scheduled_date: workout.scheduled_date,
      scheduled_start_time: workout.scheduled_start_time,
      scheduled_end_time: workout.scheduled_end_time,
      updated_at: now,
    })
    const createdWorkout = Array.isArray(createdWorkoutRows) ? createdWorkoutRows[0] : createdWorkoutRows
    if (createdWorkout?.id) workoutIdMap.set(workout.id, createdWorkout.id)
  }

  const workoutExerciseIdMap = new Map()
  for (const exercise of Array.isArray(sourceWorkoutExercises) ? sourceWorkoutExercises : []) {
    const mappedWorkoutId = workoutIdMap.get(exercise.program_workout_id)
    if (!mappedWorkoutId) continue
    const createdExerciseRows = await insertTable('program_workout_exercises', {
      program_workout_id: mappedWorkoutId,
      exercise_id: exercise.exercise_id,
      name_snapshot: exercise.name_snapshot,
      sort_order: exercise.sort_order,
      notes: exercise.notes,
      default_rest_seconds: exercise.default_rest_seconds,
      updated_at: now,
    })
    const createdExercise = Array.isArray(createdExerciseRows) ? createdExerciseRows[0] : createdExerciseRows
    if (createdExercise?.id) workoutExerciseIdMap.set(exercise.id, createdExercise.id)
  }

  for (const setRow of Array.isArray(sourceWorkoutSets) ? sourceWorkoutSets : []) {
    const mappedExerciseId = workoutExerciseIdMap.get(setRow.program_workout_exercise_id)
    if (!mappedExerciseId) continue
    await insertTable('program_workout_sets', {
      program_workout_exercise_id: mappedExerciseId,
      sort_order: setRow.sort_order,
      set_type: setRow.set_type,
      target_reps: setRow.target_reps,
      target_load: setRow.target_load,
      target_load_unit: setRow.target_load_unit,
      target_duration_seconds: setRow.target_duration_seconds,
      target_distance: setRow.target_distance,
      target_distance_unit: setRow.target_distance_unit,
      target_rpe: setRow.target_rpe,
      target_rir: setRow.target_rir,
      target_rest_seconds: setRow.target_rest_seconds,
      notes: setRow.notes,
      updated_at: now,
    })
  }

  return createdProgram
}

export function createAdminGroupRepository() {
  return {
    async listAthleteOptions() {
      const athleteRows = await requestTable('athlete_profiles', '?select=id,first_name,last_name&order=created_at.asc')
      return Array.isArray(athleteRows) ? athleteRows.map(mapAthleteOption) : []
    },

    async listProgramOptions() {
      const programRows = await requestTable('programs', '?select=id,name,created_at,athlete_profiles(first_name,last_name)&order=created_at.desc')
      return Array.isArray(programRows) ? programRows.map(mapProgramOption) : []
    },

    async listGroups() {
      const [groupRows, membershipRows, athleteRows] = await Promise.all([
        requestTable('athlete_groups', '?select=id,name,description,access_level,status,created_at,updated_at&order=created_at.asc'),
        requestTable('athlete_group_memberships', '?select=id,athlete_group_id,athlete_id,created_at'),
        requestTable('athlete_profiles', '?select=id,first_name,last_name'),
      ])
      const membershipsByGroupId = createMembershipsByGroupId(membershipRows)
      const athleteNameById = createAthleteNameMap(athleteRows)
      return Array.isArray(groupRows) ? groupRows.map((row) => mapGroupRow(row, { membershipsByGroupId, athleteNameById })) : []
    },

    async createGroup({ name, description = '', accessLevel = 'private', athleteIds = [] }) {
      const trimmedName = String(name || '').trim()
      if (!trimmedName) throw createRepositoryError('Group name is required.', 400)
      const coachId = await resolveCoachId()
      const now = new Date().toISOString()
      const createdRows = await insertTable('athlete_groups', {
        coach_id: coachId,
        name: trimmedName,
        description: String(description || '').trim(),
        access_level: accessLevel === 'public' ? 'public' : 'private',
        status: 'active',
        created_by_user_id: null,
        updated_at: now,
      })
      const groupId = (Array.isArray(createdRows) ? createdRows[0] : createdRows)?.id
      if (!groupId) throw createRepositoryError('Failed to create group.', 500)
      await syncMemberships(groupId, athleteIds)
      const groups = await this.listGroups()
      return groups.find((group) => group.id === groupId) ?? null
    },

    async updateGroup({ groupId, name, description = '', accessLevel = 'private', athleteIds = [] }) {
      if (!groupId) throw createRepositoryError('Group ID is required.', 400)
      const trimmedName = String(name || '').trim()
      if (!trimmedName) throw createRepositoryError('Group name is required.', 400)
      const now = new Date().toISOString()
      await patchTable('athlete_groups', `?id=eq.${encodeURIComponent(groupId)}`, {
        name: trimmedName,
        description: String(description || '').trim(),
        access_level: accessLevel === 'public' ? 'public' : 'private',
        updated_at: now,
      })
      await syncMemberships(groupId, athleteIds)
      const groups = await this.listGroups()
      return groups.find((group) => group.id === groupId) ?? null
    },

    async archiveGroup({ groupId }) {
      if (!groupId) throw createRepositoryError('Group ID is required.', 400)
      const now = new Date().toISOString()
      await patchTable('athlete_groups', `?id=eq.${encodeURIComponent(groupId)}`, { status: 'archived', archived_at: now, updated_at: now })
      const groups = await this.listGroups()
      return groups.find((group) => group.id === groupId) ?? null
    },

    async unarchiveGroup({ groupId }) {
      if (!groupId) throw createRepositoryError('Group ID is required.', 400)
      const now = new Date().toISOString()
      await patchTable('athlete_groups', `?id=eq.${encodeURIComponent(groupId)}`, { status: 'active', archived_at: null, updated_at: now })
      const groups = await this.listGroups()
      return groups.find((group) => group.id === groupId) ?? null
    },

    async deleteGroup({ groupId }) {
      if (!groupId) throw createRepositoryError('Group ID is required.', 400)
      await deleteTable('athlete_group_memberships', `?athlete_group_id=eq.${encodeURIComponent(groupId)}`)
      await deleteTable('athlete_groups', `?id=eq.${encodeURIComponent(groupId)}`)
      return { id: groupId }
    },

    async assignProgramToGroup({ groupId, sourceProgramId }) {
      if (!groupId) throw createRepositoryError('Group ID is required.', 400)
      if (!sourceProgramId) throw createRepositoryError('Program ID is required.', 400)
      const athleteIds = await getGroupAthleteIds(groupId)
      if (!athleteIds.length) throw createRepositoryError('Group has no athlete memberships to assign.', 400)
      const createdPrograms = []
      for (const athleteId of athleteIds) {
        createdPrograms.push(await cloneProgramTreeForAthlete({ athleteId, sourceProgramId }))
      }
      return {
        groupId,
        sourceProgramId,
        createdProgramsCount: createdPrograms.length,
        createdProgramIds: createdPrograms.map((program) => program?.id).filter(Boolean),
      }
    },
  }
}
