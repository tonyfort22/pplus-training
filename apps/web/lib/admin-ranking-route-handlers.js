import { createAdminRankingRepository } from './admin-ranking-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin rankings route error' },
    { status: error?.status || 500 },
  )
}

export function createAdminRankingRouteHandlers(overrides = {}) {
  const createRepository = overrides.createRepository ?? (() => overrides.repository ?? createAdminRankingRepository(overrides))

  return {
    async GET() {
      try {
        const repository = createRepository()
        const rankingPayload = await repository.listRankings()
        return json(rankingPayload)
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}
