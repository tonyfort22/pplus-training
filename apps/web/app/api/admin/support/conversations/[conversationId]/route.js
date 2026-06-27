import { createSupportInboxRepository } from '@/lib/support-inbox-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown support conversation route error' },
    { status: error?.status || 500 },
  )
}

export async function PATCH(request, { params }) {
  try {
    const { conversationId } = await params
    const body = await request.json()
    const repository = createSupportInboxRepository()
    const conversation = await repository.updateConversationStatus(conversationId, body?.status)

    return json({ conversation })
  } catch (error) {
    return handleRouteError(error)
  }
}
