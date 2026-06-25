import { createAdminExerciseRouteHandlers } from '@/lib/admin-exercise-route-handlers'

const handlers = createAdminExerciseRouteHandlers()

export const GET = handlers.GET
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
