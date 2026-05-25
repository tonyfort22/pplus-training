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

function formatAthleteLabel(row) {
  const firstName = row?.athlete_profiles?.first_name ?? ''
  const lastName = row?.athlete_profiles?.last_name ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return fullName || '1 athlete'
}

function formatDurationLabel(weekCount) {
  if (!weekCount) return '-'
  return `${weekCount} week${weekCount === 1 ? '' : 's'}`
}

function formatCreatedDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function formatStatusLabel(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function createCounter(rows, key) {
  return rows.reduce((accumulator, row) => {
    const value = row?.[key]
    if (!value) return accumulator
    accumulator.set(value, (accumulator.get(value) ?? 0) + 1)
    return accumulator
  }, new Map())
}

function formatProgramRow(row, context) {
  const weekCount = context.weekCountByProgramId.get(row.id) ?? 0
  const workoutCount = context.workoutCountByProgramId.get(row.id) ?? 0
  const exerciseCount = context.exerciseCountByProgramId.get(row.id) ?? 0

  return {
    id: row.id,
    name: row.name ?? 'Untitled program',
    athletesLabel: formatAthleteLabel(row),
    duration: formatDurationLabel(weekCount),
    workouts: String(workoutCount),
    exercises: String(exerciseCount),
    createdDate: formatCreatedDate(row.created_at),
    createdAt: row.created_at ?? null,
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    description: row.description ?? '',
    status: formatStatusLabel(row.status),
  }
}

export function createAdminProgramRepository() {
  return {
    async listPrograms() {
      const [programRows, weekRows, workoutRows, workoutExerciseRows] = await Promise.all([
        requestTable(
          'programs',
          '?select=id,name,description,start_date,end_date,status,created_at,athlete_profiles(first_name,last_name)&order=created_at.asc',
        ),
        requestTable('program_weeks', '?select=id,program_id'),
        requestTable('program_workouts', '?select=id,program_id'),
        requestTable('program_workout_exercises', '?select=id,program_workout_id'),
      ])

      const weekCountByProgramId = createCounter(Array.isArray(weekRows) ? weekRows : [], 'program_id')
      const workoutCountByProgramId = createCounter(Array.isArray(workoutRows) ? workoutRows : [], 'program_id')
      const exerciseCountByWorkoutId = createCounter(Array.isArray(workoutExerciseRows) ? workoutExerciseRows : [], 'program_workout_id')
      const exerciseCountByProgramId = (Array.isArray(workoutRows) ? workoutRows : []).reduce((accumulator, workoutRow) => {
        const programId = workoutRow?.program_id
        const workoutId = workoutRow?.id
        if (!programId || !workoutId) return accumulator
        accumulator.set(programId, (accumulator.get(programId) ?? 0) + (exerciseCountByWorkoutId.get(workoutId) ?? 0))
        return accumulator
      }, new Map())

      const context = {
        weekCountByProgramId,
        workoutCountByProgramId,
        exerciseCountByProgramId,
      }

      return Array.isArray(programRows) ? programRows.map((row) => formatProgramRow(row, context)) : []
    },
  }
}
