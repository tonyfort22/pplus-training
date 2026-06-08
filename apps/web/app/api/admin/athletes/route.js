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

export async function POST(request) {
  try {
    const repository = createAdminAthleteRepository()
    const body = await request.json()
    const athlete = await repository.createAthlete(body ?? {})
    return json({ athlete }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request) {
  try {
    const repository = createAdminAthleteRepository()
    const body = await request.json()
    const athlete = await repository.updateAthlete(body ?? {})
    return json({ athlete })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request) {
  try {
    const repository = createAdminAthleteRepository()
    const body = await request.json()
    const result = Array.isArray(body?.athleteIds)
      ? await repository.deleteAthletes({ athleteIds: body.athleteIds })
      : await repository.deleteAthlete(body ?? {})
    return json({ result })
  } catch (error) {
    return handleRouteError(error)
  }
}
