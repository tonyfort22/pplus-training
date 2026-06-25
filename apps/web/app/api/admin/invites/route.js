import { createAdminInviteRouteHandlers } from '@/lib/admin-invite-route-handlers'

const handlers = createAdminInviteRouteHandlers()

export const GET = handlers.GET
export const POST = handlers.POST
export const PATCH = handlers.PATCH
