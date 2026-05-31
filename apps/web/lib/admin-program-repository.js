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

async function resolveCoachId() {
  const coachRows = await requestTable('coach_profiles', '?select=id&order=created_at.asc&limit=1')
  const coachId = Array.isArray(coachRows) ? coachRows[0]?.id : null
  if (!coachId) throw createRepositoryError('No coach profile exists yet for program ownership.', 400)
  return coachId
}

function formatAthleteLabel(row) {
  const firstName = row?.athlete_profiles?.first_name ?? ''
  const lastName = row?.athlete_profiles?.last_name ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return fullName || 'Unassigned'
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

function formatProgramTypeLabel(row) {
  return row?.athlete_id ? 'Assigned' : 'Unassigned'
}

function createCounter(rows, key) {
  return rows.reduce((accumulator, row) => {
    const value = row?.[key]
    if (!value) return accumulator
    accumulator.set(value, (accumulator.get(value) ?? 0) + 1)
    return accumulator
  }, new Map())
}

function mapAthleteOption(row) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unnamed athlete'
  return { id: row.id, name }
}

function normalizeAthleteIds(athleteIds = []) {
  return Array.from(new Set((Array.isArray(athleteIds) ? athleteIds : []).map((value) => String(value ?? '').trim()).filter(Boolean)))
}

function normalizeWeekCount(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function buildProgramWeekPayloads({ programId, weeks, startDate = '', endDate = '' }) {
  const weekCount = normalizeWeekCount(weeks)
  if (!programId || weekCount <= 0) return []

  const startSeed = startDate ? new Date(`${startDate}T12:00:00Z`) : null
  const endSeed = endDate ? new Date(`${endDate}T12:00:00Z`) : null

  return Array.from({ length: weekCount }, (_, index) => {
    const weekStart = startSeed ? addDays(startSeed, index * 7) : null
    const weekEnd = weekStart ? addDays(weekStart, 6) : null
    const isLastWeek = index === weekCount - 1

    return {
      program_id: programId,
      week_index: index + 1,
      name: `Week ${index + 1}`,
      start_date: weekStart ? formatDateOnly(weekStart) : null,
      end_date: isLastWeek && endSeed ? formatDateOnly(endSeed) : weekEnd ? formatDateOnly(weekEnd) : null,
    }
  })
}

function formatProgramRow(row, context) {
  const weekCount = context.weekCountByProgramId.get(row.id) ?? 0
  const workoutCount = context.workoutCountByProgramId.get(row.id) ?? 0
  const exerciseCount = context.exerciseCountByProgramId.get(row.id) ?? 0

  return {
    id: row.id,
    athleteId: row.athlete_id ?? null,
    athleteIds: row.athlete_id ? [row.athlete_id] : [],
    coachId: row.coach_id ?? null,
    programType: formatProgramTypeLabel(row),
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

async function getProgramById(programId) {
  const [programRows, weekRows, workoutRows, workoutExerciseRows] = await Promise.all([
    requestTable(
      'programs',
      `?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles(first_name,last_name)&id=eq.${encodeURIComponent(programId)}&limit=1`,
    ),
    requestTable('program_weeks', `?select=id,program_id&program_id=eq.${encodeURIComponent(programId)}`),
    requestTable('program_workouts', `?select=id,program_id&program_id=eq.${encodeURIComponent(programId)}`),
    requestTable('program_workout_exercises', '?select=id,program_workout_id'),
  ])

  const programRow = Array.isArray(programRows) ? programRows[0] : null
  if (!programRow) throw createRepositoryError('Program not found.', 404)

  const weekCountByProgramId = createCounter(Array.isArray(weekRows) ? weekRows : [], 'program_id')
  const workoutRowsList = Array.isArray(workoutRows) ? workoutRows : []
  const workoutCountByProgramId = createCounter(workoutRowsList, 'program_id')
  const exerciseCountByWorkoutId = createCounter(Array.isArray(workoutExerciseRows) ? workoutExerciseRows : [], 'program_workout_id')
  const exerciseCountByProgramId = workoutRowsList.reduce((accumulator, workoutRow) => {
    const nextProgramId = workoutRow?.program_id
    const workoutId = workoutRow?.id
    if (!nextProgramId || !workoutId) return accumulator
    accumulator.set(nextProgramId, (accumulator.get(nextProgramId) ?? 0) + (exerciseCountByWorkoutId.get(workoutId) ?? 0))
    return accumulator
  }, new Map())

  return formatProgramRow(programRow, {
    weekCountByProgramId,
    workoutCountByProgramId,
    exerciseCountByProgramId,
  })
}

export function createAdminProgramRepository() {
  return {
    async listAthleteOptions() {
      const athleteRows = await requestTable('athlete_profiles', '?select=id,first_name,last_name&order=created_at.asc')
      return Array.isArray(athleteRows) ? athleteRows.map(mapAthleteOption) : []
    },

    async listPrograms() {
      const [programRows, weekRows, workoutRows, workoutExerciseRows] = await Promise.all([
        requestTable(
          'programs',
          '?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles(first_name,last_name)&order=created_at.asc',
        ),
        requestTable('program_weeks', '?select=id,program_id'),
        requestTable('program_workouts', '?select=id,program_id'),
        requestTable('program_workout_exercises', '?select=id,program_workout_id'),
      ])

      const weekCountByProgramId = createCounter(Array.isArray(weekRows) ? weekRows : [], 'program_id')
      const workoutRowsList = Array.isArray(workoutRows) ? workoutRows : []
      const workoutCountByProgramId = createCounter(workoutRowsList, 'program_id')
      const exerciseCountByWorkoutId = createCounter(Array.isArray(workoutExerciseRows) ? workoutExerciseRows : [], 'program_workout_id')
      const exerciseCountByProgramId = workoutRowsList.reduce((accumulator, workoutRow) => {
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

    async createProgram({ athleteIds = [], name, weeks, startDate = '', endDate = '', description = '', status = 'active' }) {
      const normalizedAthleteIds = normalizeAthleteIds(athleteIds)
      if (!name || !String(name).trim()) throw createRepositoryError('Program name is required.', 400)

      const coachId = await resolveCoachId()
      const now = new Date().toISOString()
      const createdProgramIds = []
      const targetAthleteIds = normalizedAthleteIds.length ? normalizedAthleteIds : [null]

      for (const athleteId of targetAthleteIds) {
        const createdProgramRows = await insertTable('programs', {
          athlete_id: athleteId,
          coach_id: coachId,
          name: String(name).trim(),
          description: String(description ?? '').trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          status,
          updated_at: now,
        })

        const createdProgram = Array.isArray(createdProgramRows) ? createdProgramRows[0] : createdProgramRows
        const createdProgramId = createdProgram?.id
        if (!createdProgramId) throw createRepositoryError('Program create did not return an id.', 500)
        createdProgramIds.push(createdProgramId)

        const weekPayloads = buildProgramWeekPayloads({
          programId: createdProgramId,
          weeks,
          startDate,
          endDate,
        })

        if (weekPayloads.length > 0) {
          await insertTable('program_weeks', weekPayloads)
        }
      }

      return getProgramById(createdProgramIds[0])
    },

    async updateProgram({ programId, athleteIds = [], name, startDate = '', endDate = '', description = '' }) {
      if (!programId) throw createRepositoryError('Program id is required.', 400)
      const normalizedAthleteIds = normalizeAthleteIds(athleteIds)
      if (!name || !String(name).trim()) throw createRepositoryError('Program name is required.', 400)

      const now = new Date().toISOString()
      await patchTable(
        'programs',
        `?id=eq.${encodeURIComponent(programId)}`,
        {
          athlete_id: normalizedAthleteIds[0] ?? null,
          name: String(name).trim(),
          description: String(description ?? '').trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          updated_at: now,
        },
      )

      return getProgramById(programId)
    },
  }
}
