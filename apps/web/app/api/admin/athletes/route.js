import { createAdminAthleteRepository } from '@/lib/admin-athlete-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin athletes route error' },
    { status: error?.status || 500 },
  )
}

export async function GET() {
  try {
    const repository = createAdminAthleteRepository()
    const athletes = await repository.listAthletes()
    return json({ athletes })
  } catch (error) {
    return handleRouteError(error)
  }
}
