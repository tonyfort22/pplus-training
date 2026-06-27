import { createAdminGroupRouteHandlers } from '@/lib/admin-group-route-handlers'

const handlers = createAdminGroupRouteHandlers()

export const GET = handlers.GET
export const POST = handlers.POST
export const PATCH = handlers.PATCH
