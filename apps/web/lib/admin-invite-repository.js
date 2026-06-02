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

function formatDateLabel(value) {
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

function titleCaseWords(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function deriveInviteName(row) {
  const firstName = row?.athlete_profiles?.first_name ?? ''
  const lastName = row?.athlete_profiles?.last_name ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  if (fullName) return fullName

  const email = String(row?.invitee_email || '').trim().toLowerCase()
  const localPart = email.split('@')[0] || ''
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()
  return normalized ? titleCaseWords(normalized) : 'Pending athlete'
}

function deriveInviteStatus(row) {
  if (row?.revoked_at) return 'Canceled'
  if (row?.used_at) return 'Accepted'

  const expiresAt = row?.expires_at ? new Date(row.expires_at).getTime() : Number.NaN
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    return 'Expired'
  }

  return 'Pending'
}

function mapInviteRow(row) {
  const status = deriveInviteStatus(row)
  return {
    id: row.id,
    name: deriveInviteName(row),
    email: row.invitee_email ?? '-',
    role: 'Athlete',
    sent: formatDateLabel(row.sent_at ?? row.created_at),
    status,
    createdAt: row.created_at ?? null,
    expiresAt: row.expires_at ?? null,
    usedAt: row.used_at ?? null,
    revokedAt: row.revoked_at ?? null,
    athleteProfileId: row.athlete_profile_id ?? null,
  }
}

export function createAdminInviteRepository() {
  return {
    async listInvites() {
      const rows = await requestTable(
        'athlete_invitations',
        '?select=id,invitee_email,expires_at,used_at,revoked_at,sent_at,athlete_profile_id,created_at,athlete_profiles(first_name,last_name)&order=created_at.asc',
      )

      return Array.isArray(rows) ? rows.map(mapInviteRow) : []
    },

    async cancelInvite({ inviteId }) {
      const normalizedInviteId = String(inviteId || '').trim()
      if (!normalizedInviteId) throw createRepositoryError('Invite ID is required.', 400)

      const rows = await patchTable(
        'athlete_invitations',
        `?id=eq.${encodeURIComponent(normalizedInviteId)}`,
        { revoked_at: new Date().toISOString() },
      )
      const invite = Array.isArray(rows) ? rows[0] : rows
      if (!invite?.id) throw createRepositoryError('Invite not found.', 404)
      return mapInviteRow(invite)
    },
  }
}
