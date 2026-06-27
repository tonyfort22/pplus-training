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

function buildAdminSupportUrl(supportRequest = {}, appBaseUrl = '') {
  if (!appBaseUrl) return 'https://pplushockey.com/admin/support'

  const conversationId = supportRequest.conversationId || supportRequest.conversation_id || supportRequest.supportConversationId || supportRequest.support_conversation_id
  if (!conversationId) return `${appBaseUrl}/admin/support`

  const url = new URL('/admin/support', appBaseUrl)
  url.searchParams.set('conversationId', conversationId)
  return url.toString()
}

function buildSupportRequestDataVariables(supportRequest, appBaseUrl = '') {
  const firstName = supportRequest.firstName || ''
  const lastName = supportRequest.lastName || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Unknown'
  const adminUrl = buildAdminSupportUrl(supportRequest, appBaseUrl)

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

function buildSupportReplyDataVariables({ conversation = {}, message = {} } = {}, appBaseUrl = '') {
  const requesterName = conversation.requesterName || conversation.requester_name || conversation.requesterEmail || conversation.requester_email || 'there'
  const conversationId = conversation.id || message.conversationId || message.conversation_id || ''
  const threadUrl = appBaseUrl && conversationId ? `${appBaseUrl}/support?conversationId=${encodeURIComponent(conversationId)}` : 'https://pplushockey.com/support'

  return {
    conversationId,
    requesterName,
    requesterEmail: conversation.requesterEmail || conversation.requester_email || '',
    subject: conversation.subject || 'Support reply',
    replyBody: message.body || '',
    repliedAt: formatSubmittedAt(message.createdAt || message.created_at),
    threadUrl,
  }
}

function buildRequesterReplyDataVariables({ conversation = {}, message = {} } = {}, appBaseUrl = '') {
  const conversationId = conversation.id || message.conversationId || message.conversation_id || ''
  const requesterName = conversation.requesterName || conversation.requester_name || conversation.requesterEmail || conversation.requester_email || 'Support requester'
  const adminUrl = buildAdminSupportUrl({ conversationId }, appBaseUrl)

  return {
    conversationId,
    supportRequestId: conversation.supportRequestId || conversation.support_request_id || '',
    requesterName,
    requesterEmail: conversation.requesterEmail || conversation.requester_email || '',
    subject: conversation.subject || 'Support reply',
    replyBody: message.body || '',
    repliedAt: formatSubmittedAt(message.createdAt || message.created_at),
    adminUrl,
  }
}

async function sendLoopsTransactionalEmail({ fetchImpl, loopsApiKey, transactionalId, email, dataVariables }) {
  const response = await fetchImpl(LOOPS_TRANSACTIONAL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loopsApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactionalId,
      email,
      dataVariables,
    }),
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = payload?.message || payload?.error || text || response.statusText
    throw new Error(`Support email failed (${response.status}): ${message}`)
  }

  return payload || { ok: true }
}

export function createSupportRequestNotificationSender(config = {}) {
  return {
    async sendSupportRequestNotification(supportRequest = {}) {
      const { loopsApiKey, transactionalId, toEmail, appBaseUrl, fetchImpl } = getNotificationConfig(config)

      if (!loopsApiKey || !transactionalId || !toEmail) {
        return { skipped: true, reason: 'missing_email_config' }
      }

      const response = await sendLoopsTransactionalEmail({
        fetchImpl,
        loopsApiKey,
        transactionalId,
        email: toEmail,
        dataVariables: buildSupportRequestDataVariables(supportRequest, appBaseUrl),
      })

      return response || { ok: true }
    },
  }
}

export function createSupportReplyEmailSender(config = {}) {
  return {
    async sendSupportReplyEmail({ conversation = {}, message = {} } = {}) {
      const { loopsApiKey, appBaseUrl, fetchImpl } = getNotificationConfig(config)
      const transactionalId = config.transactionalId ?? process.env.LOOPS_SUPPORT_REPLY_TRANSACTIONAL_ID ?? process.env.LOOPS_SUPPORT_TRANSACTIONAL_ID
      const toEmail = conversation.requesterEmail || conversation.requester_email

      if (!loopsApiKey || !transactionalId || !toEmail) {
        return { skipped: true, reason: 'missing_email_config' }
      }

      return sendLoopsTransactionalEmail({
        fetchImpl,
        loopsApiKey,
        transactionalId,
        email: toEmail,
        dataVariables: buildSupportReplyDataVariables({ conversation, message }, appBaseUrl),
      })
    },
  }
}

export function createRequesterReplyNotificationSender(config = {}) {
  return {
    async sendRequesterReplyNotification({ conversation = {}, message = {} } = {}) {
      const { loopsApiKey, toEmail, appBaseUrl, fetchImpl } = getNotificationConfig(config)
      const transactionalId = config.transactionalId ?? process.env.LOOPS_SUPPORT_REQUESTER_REPLY_TRANSACTIONAL_ID

      if (!loopsApiKey || !transactionalId || !toEmail) {
        return { skipped: true, reason: 'missing_email_config' }
      }

      return sendLoopsTransactionalEmail({
        fetchImpl,
        loopsApiKey,
        transactionalId,
        email: toEmail,
        dataVariables: buildRequesterReplyDataVariables({ conversation, message }, appBaseUrl),
      })
    },
  }
}
