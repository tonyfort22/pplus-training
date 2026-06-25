import { createAdminAthleteRouteHandlers } from '@/lib/admin-athlete-route-handlers'

const handlers = createAdminAthleteRouteHandlers()

export const GET = handlers.GET
export const POST = handlers.POST
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
