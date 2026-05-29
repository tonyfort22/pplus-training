import { formSchema } from './form-schema.js'

function createRepositoryError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  if (cause) error.cause = cause
  return error
}

function getRepositoryConfig(config = {}) {
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL
  const serviceRoleKey = config.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  const fetchImpl = config.fetchImpl || fetch

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRepositoryError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return {
    baseRestUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
    fetchImpl,
  }
}

function parseSupportRequestPayload(payload = {}) {
  const parsed = formSchema.safeParse({
    firstName: typeof payload.firstName === 'string' ? payload.firstName.trim() : payload.firstName,
    lastName: typeof payload.lastName === 'string' ? payload.lastName.trim() : payload.lastName,
    email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : payload.email,
    category: typeof payload.category === 'string' ? payload.category.trim() : payload.category,
    description: typeof payload.description === 'string' ? payload.description.trim() : payload.description,
  })

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ')
    throw createRepositoryError(message || 'Invalid support request payload.', 400, parsed.error)
  }

  return parsed.data
}

function mapSupportRequestRow(row = {}) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    category: row.category,
    description: row.description,
    status: row.status,
    source: row.source,
    notificationSentAt: row.notification_sent_at,
    notificationError: row.notification_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createSupportRequestsRepository(config = {}) {
  async function requestSupportRequests(path = '', init = {}) {
    const { baseRestUrl, serviceRoleKey, fetchImpl } = getRepositoryConfig(config)
    const response = await fetchImpl(`${baseRestUrl}/support_requests${path}`, {
      ...init,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    })

    const text = await response.text()
    const parsed = text ? JSON.parse(text) : null

    if (!response.ok) {
      const message = parsed?.message || parsed?.error || text || response.statusText
      throw createRepositoryError(`support_requests request failed (${response.status}): ${message}`, response.status)
    }

    return parsed
  }

  return {
    async createSupportRequest(payload = {}) {
      const parsed = parseSupportRequestPayload(payload)
      const rows = await requestSupportRequests('?select=*', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          first_name: parsed.firstName,
          last_name: parsed.lastName,
          email: parsed.email,
          category: parsed.category,
          description: parsed.description,
          status: 'new',
          source: 'support_page',
        }),
      })

      const created = Array.isArray(rows) ? rows[0] : rows
      if (!created?.id) {
        throw createRepositoryError('Failed to create support request.', 500)
      }

      return mapSupportRequestRow(created)
    },

    async markNotificationSent(supportRequestId, sentAt = new Date().toISOString()) {
      if (!supportRequestId) {
        throw createRepositoryError('Support request ID is required.', 400)
      }

      const rows = await requestSupportRequests(`?id=eq.${encodeURIComponent(supportRequestId)}&select=*`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          notification_sent_at: sentAt,
          notification_error: null,
        }),
      })

      return mapSupportRequestRow(Array.isArray(rows) ? rows[0] : rows)
    },

    async markNotificationFailed(supportRequestId, message) {
      if (!supportRequestId) {
        throw createRepositoryError('Support request ID is required.', 400)
      }

      const rows = await requestSupportRequests(`?id=eq.${encodeURIComponent(supportRequestId)}&select=*`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          notification_error: String(message || 'Unknown support notification error').slice(0, 2000),
        }),
      })

      return mapSupportRequestRow(Array.isArray(rows) ? rows[0] : rows)
    },
  }
}
