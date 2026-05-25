import { createAdminInviteRepository } from '@/lib/admin-invite-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin invites route error' },
    { status: error?.status || 500 },
  )
}

export async function GET() {
  try {
    const repository = createAdminInviteRepository()
    const invites = await repository.listInvites()
    return json({ invites })
  } catch (error) {
    return handleRouteError(error)
  }
}
