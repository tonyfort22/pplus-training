import { createRequesterReplyNotificationSender, createSupportReplyEmailSender } from './support-request-notifications.js'

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
  const now = config.now || (() => new Date().toISOString())

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRepositoryError('Support inbox persistence unavailable until web Supabase env is configured.', 503)
  }

  return {
    baseRestUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
    fetchImpl,
    now,
  }
}

function mapConversationRow(row = {}) {
  return {
    id: row.id,
    supportRequestId: row.support_request_id,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterRole: row.requester_role,
    requesterAvatarUrl: row.requester_avatar_url,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMessageRow(row = {}) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderType: row.sender_type,
    senderName: row.sender_name,
    senderAvatarUrl: row.sender_avatar_url,
    body: row.body,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    deliveredAt: row.delivered_at,
    deliveryStatus: row.delivery_status,
    deliveryError: row.delivery_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SUPPORT_CONVERSATION_STATUSES = new Set(['open', 'pending', 'closed', 'archived'])

function normalizeSearchTerm(search) {
  return typeof search === 'string' ? search.trim() : ''
}

function buildConversationListPath({ search } = {}) {
  const select = [
    'id',
    'support_request_id',
    'subject',
    'status',
    'priority',
    'requester_name',
    'requester_email',
    'requester_role',
    'requester_avatar_url',
    'last_message_preview',
    'last_message_at',
    'created_at',
    'updated_at',
  ].join(',')
  const params = new URLSearchParams({ select })
  const searchTerm = normalizeSearchTerm(search)

  if (searchTerm) {
    const escapedTerm = searchTerm.replace(/[,*()]/g, ' ')
    params.set('or', `(requester_name.ilike.*${escapedTerm}*,requester_email.ilike.*${escapedTerm}*,subject.ilike.*${escapedTerm}*)`)
  }

  return `?${params.toString()}&order=last_message_at.desc.nullslast,created_at.desc`
}

function buildMessageSelect({ includeDeliveryFields = true } = {}) {
  return [
    'id',
    'conversation_id',
    'sender_type',
    'sender_name',
    'sender_avatar_url',
    'body',
    'attachments',
    ...(includeDeliveryFields ? ['delivered_at', 'delivery_status', 'delivery_error'] : []),
    'created_at',
    'updated_at',
  ].join(',')
}

function isMissingDeliveryColumnError(error) {
  return error?.status === 400 && /(support_messages.*(delivered_at|delivery_status|delivery_error))|((delivered_at|delivery_status|delivery_error).*support_messages)|column .*delivery/i.test(error?.message || '')
}

export function createSupportInboxRepository(config = {}) {
  async function requestTable(tableName, path = '', init = {}) {
    const { baseRestUrl, serviceRoleKey, fetchImpl } = getRepositoryConfig(config)
    const response = await fetchImpl(`${baseRestUrl}/${tableName}${path}`, {
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
      throw createRepositoryError(`${tableName} request failed (${response.status}): ${message}`, response.status)
    }

    return parsed
  }

  return {
    async listConversations(options = {}) {
      const rows = await requestTable(
        'support_conversations',
        buildConversationListPath(options),
      )

      return Array.isArray(rows) ? rows.map(mapConversationRow) : []
    },

    async listConversationMessages(conversationId) {
      if (!conversationId) {
        throw createRepositoryError('Conversation ID is required.', 400)
      }

      const select = buildMessageSelect({ includeDeliveryFields: true })
      try {
        const rows = await requestTable(
          'support_messages',
          `?select=${select}&conversation_id=eq.${encodeURIComponent(conversationId)}&order=created_at.asc`,
        )

        return Array.isArray(rows) ? rows.map(mapMessageRow) : []
      } catch (error) {
        if (!isMissingDeliveryColumnError(error)) throw error

        const legacyRows = await requestTable(
          'support_messages',
          `?select=${buildMessageSelect({ includeDeliveryFields: false })}&conversation_id=eq.${encodeURIComponent(conversationId)}&order=created_at.asc`,
        )

        return Array.isArray(legacyRows) ? legacyRows.map(mapMessageRow) : []
      }
    },

    async createAdminReply(conversationId, body) {
      if (!conversationId) {
        throw createRepositoryError('Conversation ID is required.', 400)
      }

      const trimmedBody = typeof body === 'string' ? body.trim() : ''
      if (!trimmedBody) {
        throw createRepositoryError('Reply body is required.', 400)
      }

      const { now } = getRepositoryConfig(config)
      const timestamp = now()
      const baseMessageInsert = {
        conversation_id: conversationId,
        sender_type: 'admin',
        sender_name: 'PPLUS Support',
        sender_avatar_url: null,
        body: trimmedBody,
        attachments: [],
        created_at: timestamp,
      }
      let hasDeliveryColumns = true
      let messageRows
      try {
        messageRows = await requestTable('support_messages', '?select=*', {
          method: 'POST',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            ...baseMessageInsert,
            delivery_status: 'pending',
            delivery_error: null,
            delivered_at: null,
          }),
        })
      } catch (error) {
        if (!isMissingDeliveryColumnError(error)) throw error
        hasDeliveryColumns = false
        messageRows = await requestTable('support_messages', '?select=*', {
          method: 'POST',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify(baseMessageInsert),
        })
      }
      let message = Array.isArray(messageRows) ? messageRows[0] : messageRows
      if (!message?.id) {
        throw createRepositoryError('Failed to create support reply.', 500)
      }

      await requestTable(`support_conversations`, `?id=eq.${encodeURIComponent(conversationId)}&select=*`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          last_message_preview: trimmedBody.slice(0, 240),
          last_message_at: timestamp,
          updated_at: timestamp,
        }),
      })

      const shouldAttemptEmailDelivery = Boolean(
        config.replyEmailSender
        || (process.env.LOOPS_API_KEY && (process.env.LOOPS_SUPPORT_REPLY_TRANSACTIONAL_ID || process.env.LOOPS_SUPPORT_TRANSACTIONAL_ID)),
      )

      if (!shouldAttemptEmailDelivery) {
        return mapMessageRow(message)
      }

      const conversationRows = await requestTable(`support_conversations`, `?id=eq.${encodeURIComponent(conversationId)}&select=*`)
      const conversation = Array.isArray(conversationRows) ? conversationRows[0] : conversationRows
      const sender = config.replyEmailSender || createSupportReplyEmailSender(config)
      let deliveryPatch = {
        delivery_status: 'sent',
        delivery_error: null,
        delivered_at: timestamp,
        updated_at: timestamp,
      }

      try {
        const deliveryResult = await sender.sendSupportReplyEmail({
          conversation: mapConversationRow(conversation),
          message: mapMessageRow(message),
        })
        if (deliveryResult?.skipped) {
          deliveryPatch = {
            delivery_status: 'skipped',
            delivery_error: deliveryResult.reason || 'missing_email_config',
            delivered_at: null,
            updated_at: timestamp,
          }
        }
      } catch (error) {
        deliveryPatch = {
          delivery_status: 'failed',
          delivery_error: String(error?.message || 'Support reply email failed').slice(0, 2000),
          delivered_at: null,
          updated_at: timestamp,
        }
      }

      if (!hasDeliveryColumns) {
        return mapMessageRow({
          ...message,
          delivery_status: deliveryPatch.delivery_status,
          delivery_error: deliveryPatch.delivery_error,
          delivered_at: deliveryPatch.delivered_at,
        })
      }

      const deliveredRows = await requestTable('support_messages', `?id=eq.${encodeURIComponent(message.id)}&select=*`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(deliveryPatch),
      })
      message = Array.isArray(deliveredRows) ? deliveredRows[0] : deliveredRows

      return mapMessageRow(message)
    },

    async createRequesterReply(conversationId, body) {
      if (!conversationId) {
        throw createRepositoryError('Conversation ID is required.', 400)
      }

      const trimmedBody = typeof body === 'string' ? body.trim() : ''
      if (!trimmedBody) {
        throw createRepositoryError('Reply body is required.', 400)
      }

      const { now } = getRepositoryConfig(config)
      const timestamp = now()
      const conversationRows = await requestTable(`support_conversations`, `?id=eq.${encodeURIComponent(conversationId)}&select=*`)
      const conversation = Array.isArray(conversationRows) ? conversationRows[0] : conversationRows
      if (!conversation?.id) {
        throw createRepositoryError('Support conversation not found.', 404)
      }

      const requesterName = conversation.requester_name || conversation.requester_email || 'Support requester'
      const messageRows = await requestTable('support_messages', '?select=*', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_type: 'requester',
          sender_name: requesterName,
          sender_avatar_url: conversation.requester_avatar_url || null,
          body: trimmedBody,
          attachments: [],
          created_at: timestamp,
        }),
      })
      const message = Array.isArray(messageRows) ? messageRows[0] : messageRows
      if (!message?.id) {
        throw createRepositoryError('Failed to create requester support reply.', 500)
      }

      await requestTable(`support_conversations`, `?id=eq.${encodeURIComponent(conversationId)}&select=*`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          last_message_preview: trimmedBody.slice(0, 240),
          last_message_at: timestamp,
          updated_at: timestamp,
        }),
      })

      const shouldNotifyAdmin = Boolean(
        config.requesterReplyNotificationSender
        || (process.env.LOOPS_API_KEY && process.env.LOOPS_SUPPORT_REQUESTER_REPLY_TRANSACTIONAL_ID && process.env.SUPPORT_NOTIFICATION_TO_EMAIL),
      )

      if (shouldNotifyAdmin) {
        const sender = config.requesterReplyNotificationSender || createRequesterReplyNotificationSender(config)
        await sender.sendRequesterReplyNotification({
          conversation: mapConversationRow(conversation),
          message: mapMessageRow(message),
        })
      }

      return mapMessageRow(message)
    },

    async updateConversationStatus(conversationId, status) {
      if (!conversationId) {
        throw createRepositoryError('Conversation ID is required.', 400)
      }
      if (!SUPPORT_CONVERSATION_STATUSES.has(status)) {
        throw createRepositoryError('Unsupported support conversation status.', 400)
      }

      const { now } = getRepositoryConfig(config)
      const rows = await requestTable(`support_conversations`, `?id=eq.${encodeURIComponent(conversationId)}&select=*`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          status,
          updated_at: now(),
        }),
      })
      const conversation = Array.isArray(rows) ? rows[0] : rows
      if (!conversation?.id) {
        throw createRepositoryError('Failed to update support conversation status.', 500)
      }

      return mapConversationRow(conversation)
    },
  }
}
