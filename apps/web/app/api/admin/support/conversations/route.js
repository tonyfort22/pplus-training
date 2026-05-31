import { createSupportInboxRepository } from '@/lib/support-inbox-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown support inbox route error' },
    { status: error?.status || 500 },
  )
}

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const repository = createSupportInboxRepository()
    const conversations = await repository.listConversations({ search: searchParams.get('search') || '' })
    return json({ conversations })
  } catch (error) {
    return handleRouteError(error)
  }
}
