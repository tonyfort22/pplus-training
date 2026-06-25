import { createAdminRankingRouteHandlers } from '@/lib/admin-ranking-route-handlers'

const handlers = createAdminRankingRouteHandlers()

export const GET = handlers.GET
