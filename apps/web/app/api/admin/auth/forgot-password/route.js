import { createAdminAuthRouteHandlers } from '../../../../../lib/admin-auth-route-handlers.js'

const handlers = createAdminAuthRouteHandlers()

export async function POST(request) {
  return handlers.forgotPassword(request)
}
