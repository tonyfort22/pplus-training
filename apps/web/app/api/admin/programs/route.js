import { createAdminProgramRouteHandlers } from '@/lib/admin-program-route-handlers'

const handlers = createAdminProgramRouteHandlers()

export const GET = handlers.GET
export const POST = handlers.POST
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
