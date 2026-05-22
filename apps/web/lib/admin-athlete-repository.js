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
    restUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1/athlete_profiles`,
    serviceRoleKey,
  }
}

async function requestAthletes(query = '') {
  const { restUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${restUrl}${query}`, {
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
    throw createRepositoryError(`Athletes request failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

function formatShortcutCode(index) {
  return `A${String(index + 1).padStart(2, '0')}`
}

function mapAthleteRow(row, index) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unnamed athlete'

  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    fullName: name,
    shortcutCode: formatShortcutCode(index),
    createdAt: row.created_at ?? null,
    status: row.status ?? null,
    avatarUrl: row.avatar_url ?? '',
    dateOfBirth: row.date_of_birth ?? null,
  }
}

export function createAdminAthleteRepository() {
  return {
    async listAthletes() {
      const rows = await requestAthletes('?select=id,first_name,last_name,date_of_birth,avatar_url,status,created_at&order=created_at.asc')
      return rows.map(mapAthleteRow)
    },
  }
}
