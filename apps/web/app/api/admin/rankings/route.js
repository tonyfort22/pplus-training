import { createAdminRankingRepository } from '@/lib/admin-ranking-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin rankings route error' },
    { status: error?.status || 500 },
  )
}

export async function GET() {
  try {
    const repository = createAdminRankingRepository()
    const rankingPayload = await repository.listRankings()
    return json(rankingPayload)
  } catch (error) {
    return handleRouteError(error)
  }
}
