import { createSupportInboxRepository } from '@/lib/support-inbox-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown support conversation messages route error' },
    { status: error?.status || 500 },
  )
}

export async function GET(request, { params }) {
  try {
    const { conversationId } = await params
    const repository = createSupportInboxRepository()
    const messages = await repository.listConversationMessages(conversationId)

    return json({ messages })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request, { params }) {
  try {
    const { conversationId } = await params
    const body = await request.json()
    const requestOrigin = new URL(request.url).origin
    const repository = createSupportInboxRepository({ appBaseUrl: requestOrigin })
    const message = await repository.createAdminReply(conversationId, body?.body)

    return json({ message }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
