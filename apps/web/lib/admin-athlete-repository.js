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

function formatShortcutCode(index) {
  return `A${String(index + 1).padStart(2, '0')}`
}

function getFullName(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unnamed athlete'
}

function formatRelativeTimestamp(value) {
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

function formatStatus(status) {
  if (status === 'active') return 'Active'
  if (status === 'inactive') return 'Inactive'
  if (!status) return 'Inactive'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function createLatestProgramMap(programRows) {
  return (Array.isArray(programRows) ? programRows : []).reduce((accumulator, row) => {
    const athleteId = row?.athlete_id
    if (!athleteId) return accumulator

    const current = accumulator.get(athleteId)
    const currentCreated = current?.created_at ? new Date(current.created_at).getTime() : -Infinity
    const nextCreated = row?.created_at ? new Date(row.created_at).getTime() : -Infinity

    if (!current || nextCreated >= currentCreated) {
      accumulator.set(athleteId, row)
    }

    return accumulator
  }, new Map())
}

function createCountMap(rows, key) {
  return (Array.isArray(rows) ? rows : []).reduce((accumulator, row) => {
    const value = row?.[key]
    if (!value) return accumulator
    accumulator.set(value, (accumulator.get(value) ?? 0) + 1)
    return accumulator
  }, new Map())
}

function createLatestActivityMap(sessionRows) {
  return (Array.isArray(sessionRows) ? sessionRows : []).reduce((accumulator, row) => {
    const athleteId = row?.athlete_id
    if (!athleteId) return accumulator

    const candidate = row.completed_at ?? row.updated_at ?? null
    if (!candidate) return accumulator

    const current = accumulator.get(athleteId)
    const currentTime = current ? new Date(current).getTime() : -Infinity
    const nextTime = new Date(candidate).getTime()

    if (nextTime >= currentTime) {
      accumulator.set(athleteId, candidate)
    }

    return accumulator
  }, new Map())
}

function mapAthleteRow(row, index, context) {
  const name = getFullName(row)
  const latestProgram = context.latestProgramByAthleteId.get(row.id)
  const workoutsTarget = context.assignedWorkoutCountByAthleteId.get(row.id) ?? 0
  const workoutsCompleted = context.completedWorkoutCountByAthleteId.get(row.id) ?? 0
  const workoutsPercentage = workoutsTarget > 0 ? Math.min(100, Math.round((workoutsCompleted / workoutsTarget) * 100)) : 0
  const latestActivity = context.latestActivityByAthleteId.get(row.id) ?? null

  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    fullName: name,
    name,
    shortcutCode: formatShortcutCode(index),
    createdAt: row.created_at ?? null,
    status: formatStatus(row.status),
    avatarUrl: row.avatar_url ?? '',
    dateOfBirth: row.date_of_birth ?? null,
    program: latestProgram?.name ?? '-',
    workoutsCompleted,
    workoutsTarget,
    workoutsPercentage,
    lastActive: formatRelativeTimestamp(latestActivity),
  }
}

export function createAdminAthleteRepository() {
  return {
    async listAthletes() {
      const [athleteRows, programRows, assignedWorkoutRows, workoutSessionRows] = await Promise.all([
        requestTable('athlete_profiles', '?select=id,first_name,last_name,date_of_birth,avatar_url,status,created_at&order=created_at.asc'),
        requestTable('programs', '?select=id,athlete_id,name,status,created_at'),
        requestTable('program_workouts', '?select=id,athlete_id,status'),
        requestTable('workout_sessions', '?select=id,athlete_id,status,completed_at,updated_at'),
      ])

      const latestProgramByAthleteId = createLatestProgramMap(programRows)
      const assignedWorkoutCountByAthleteId = createCountMap(assignedWorkoutRows, 'athlete_id')
      const completedWorkoutCountByAthleteId = (Array.isArray(workoutSessionRows) ? workoutSessionRows : []).reduce((accumulator, row) => {
        if (row?.status !== 'completed' || !row?.athlete_id) return accumulator
        accumulator.set(row.athlete_id, (accumulator.get(row.athlete_id) ?? 0) + 1)
        return accumulator
      }, new Map())
      const latestActivityByAthleteId = createLatestActivityMap(workoutSessionRows)

      const context = {
        latestProgramByAthleteId,
        assignedWorkoutCountByAthleteId,
        completedWorkoutCountByAthleteId,
        latestActivityByAthleteId,
      }

      return Array.isArray(athleteRows) ? athleteRows.map((row, index) => mapAthleteRow(row, index, context)) : []
    },
  }
}
