const PROGRAM_WORKOUT_SELECT = [
  'id',
  'athlete_id',
  'coach_id',
  'program_id',
  'program_day_id',
  'workout_template_id',
  'name_snapshot',
  'notes',
  'status',
  'sort_order',
  'scheduled_date',
  'scheduled_start_time',
  'scheduled_end_time',
  'created_at',
  'updated_at',
  'program_days(date)',
  'workout_templates(name,training_type)',
].join(',')

function createRepositoryError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  error.cause = cause
  return error
}

function getRepositoryConfig(config = {}) {
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL
  const serviceRoleKey = config.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  const fetchImpl = config.fetchImpl || globalThis.fetch

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRepositoryError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  if (typeof fetchImpl !== 'function') {
    throw createRepositoryError('Workout calendar repository requires fetch support.', 503)
  }

  return {
    restUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1/program_workouts`,
    serviceRoleKey,
    fetchImpl,
  }
}

async function requestProgramWorkouts({ method = 'GET', query = '', body, prefer = 'return=representation', config = {} }) {
  const { restUrl, serviceRoleKey, fetchImpl } = getRepositoryConfig(config)
  const response = await fetchImpl(`${restUrl}${query}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`Program workouts request failed: ${response.status} ${text}`, response.status)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function createWorkoutCalendarRepository(config = {}) {
  return {
    async listAssignments({ athleteId = null } = {}) {
      const filters = [`select=${encodeURIComponent(PROGRAM_WORKOUT_SELECT)}`]

      if (athleteId) {
        filters.push(`athlete_id=eq.${encodeURIComponent(athleteId)}`)
      }

      filters.push('order=created_at.asc')

      return requestProgramWorkouts({
        query: `?${filters.join('&')}`,
        config,
      })
    },

    async createAssignment(payload) {
      const [row] = await requestProgramWorkouts({
        method: 'POST',
        body: payload,
        config,
      })
      return row
    },

    async updateAssignment(id, payload) {
      const [row] = await requestProgramWorkouts({
        method: 'PATCH',
        query: `?id=eq.${id}&select=${encodeURIComponent(PROGRAM_WORKOUT_SELECT)}`,
        body: payload,
        config,
      })
      return row
    },

    async deleteAssignment(id) {
      await requestProgramWorkouts({
        method: 'DELETE',
        query: `?id=eq.${id}`,
        prefer: 'return=minimal',
        config,
      })
      return { id }
    },
  }
}
