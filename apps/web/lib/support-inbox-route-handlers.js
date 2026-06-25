import { createSupportInboxRepository } from './support-inbox-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown support inbox route error' },
    { status: error?.status || 500 },
  )
}

export function createAdminSupportConversationRouteHandlers({ createRepository = createSupportInboxRepository } = {}) {
  return {
    async GET(request) {
      try {
        const searchParams = new URL(request.url).searchParams
        const repository = createRepository()
        const conversations = await repository.listConversations({ search: searchParams.get('search') || '' })
        return json({ conversations })
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}

export function createAdminSupportConversationMessageRouteHandlers({ createRepository = createSupportInboxRepository } = {}) {
  return {
    async GET(request, { params }) {
      try {
        const { conversationId } = await params
        const repository = createRepository()
        const messages = await repository.listConversationMessages(conversationId)
        return json({ messages })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async POST(request, { params }) {
      try {
        const { conversationId } = await params
        const body = await request.json()
        const requestOrigin = new URL(request.url).origin
        const repository = createRepository({ appBaseUrl: requestOrigin })
        const message = await repository.createAdminReply(conversationId, body?.body)
        return json({ message }, { status: 201 })
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}

const adminSupportConversationRouteHandlers = createAdminSupportConversationRouteHandlers()
const adminSupportConversationMessageRouteHandlers = createAdminSupportConversationMessageRouteHandlers()

export async function getAdminSupportConversations(request) {
  return adminSupportConversationRouteHandlers.GET(request)
}

export async function getAdminSupportConversationMessages(request, context) {
  return adminSupportConversationMessageRouteHandlers.GET(request, context)
}

export async function postAdminSupportConversationMessage(request, context) {
  return adminSupportConversationMessageRouteHandlers.POST(request, context)
}
