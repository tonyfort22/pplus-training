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
].join(',')

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
    restUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1/program_workouts`,
    serviceRoleKey,
  }
}

async function requestProgramWorkouts({ method = 'GET', query = '', body, prefer = 'return=representation' }) {
  const { restUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${restUrl}${query}`, {
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

export function createWorkoutCalendarRepository() {
  return {
    async listAssignments({ athleteId = null } = {}) {
      const filters = [`select=${encodeURIComponent(PROGRAM_WORKOUT_SELECT)}`]

      if (athleteId) {
        filters.push(`athlete_id=eq.${encodeURIComponent(athleteId)}`)
      }

      filters.push('order=created_at.asc')

      return requestProgramWorkouts({
        query: `?${filters.join('&')}`,
      })
    },

    async createAssignment(payload) {
      const [row] = await requestProgramWorkouts({
        method: 'POST',
        body: payload,
      })
      return row
    },

    async updateAssignment(id, payload) {
      const [row] = await requestProgramWorkouts({
        method: 'PATCH',
        query: `?id=eq.${id}&select=${encodeURIComponent(PROGRAM_WORKOUT_SELECT)}`,
        body: payload,
      })
      return row
    },

    async deleteAssignment(id) {
      await requestProgramWorkouts({
        method: 'DELETE',
        query: `?id=eq.${id}`,
        prefer: 'return=minimal',
      })
      return { id }
    },
  }
}
