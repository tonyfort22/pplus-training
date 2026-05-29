const LOOPS_TRANSACTIONAL_ENDPOINT = 'https://app.loops.so/api/v1/transactional'

function getNotificationConfig(config = {}) {
  const loopsApiKey = config.loopsApiKey ?? process.env.LOOPS_API_KEY
  const transactionalId = config.transactionalId ?? process.env.LOOPS_SUPPORT_TRANSACTIONAL_ID
  const toEmail = config.toEmail ?? process.env.SUPPORT_NOTIFICATION_TO_EMAIL
  const appBaseUrl = config.appBaseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL ?? ''
  const fetchImpl = config.fetchImpl ?? fetch

  return {
    loopsApiKey,
    transactionalId,
    toEmail,
    appBaseUrl: appBaseUrl.replace(/\/$/, ''),
    fetchImpl,
  }
}

function formatSubmittedAt(value) {
  if (!value) return 'Unknown'

  try {
    return new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Toronto',
    }).format(new Date(value))
  } catch {
    return String(value)
  }
}

function buildSupportRequestDataVariables(supportRequest, appBaseUrl = '') {
  const firstName = supportRequest.firstName || ''
  const lastName = supportRequest.lastName || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Unknown'
  const adminUrl = appBaseUrl && supportRequest.id
    ? `${appBaseUrl}/admin/support/${supportRequest.id}`
    : 'https://pplushockey.com'

  return {
    supportRequestId: supportRequest.id || '',
    firstName,
    lastName,
    fullName,
    fullname: fullName,
    email: supportRequest.email || '',
    category: supportRequest.category || 'Support request',
    description: supportRequest.description || '',
    submittedAt: formatSubmittedAt(supportRequest.createdAt),
    source: supportRequest.source || 'support_page',
    adminUrl,
  }
}

export function createSupportRequestNotificationSender(config = {}) {
  return {
    async sendSupportRequestNotification(supportRequest = {}) {
      const { loopsApiKey, transactionalId, toEmail, appBaseUrl, fetchImpl } = getNotificationConfig(config)

      if (!loopsApiKey || !transactionalId || !toEmail) {
        return { skipped: true, reason: 'missing_email_config' }
      }

      const response = await fetchImpl(LOOPS_TRANSACTIONAL_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${loopsApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionalId,
          email: toEmail,
          dataVariables: buildSupportRequestDataVariables(supportRequest, appBaseUrl),
        }),
      })

      const text = await response.text()
      const payload = text ? JSON.parse(text) : null

      if (!response.ok) {
        const message = payload?.message || payload?.error || text || response.statusText
        throw new Error(`Support notification email failed (${response.status}): ${message}`)
      }

      return payload || { ok: true }
    },
  }
}
