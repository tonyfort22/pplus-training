import { createAdminProgramRepository } from '@/lib/admin-program-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin programs route error' },
    { status: error?.status || 500 },
  )
}

export async function GET() {
  try {
    const repository = createAdminProgramRepository()
    const [programs, athleteOptions] = await Promise.all([
      repository.listPrograms(),
      repository.listAthleteOptions(),
    ])
    return json({ programs, athleteOptions })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request) {
  try {
    const repository = createAdminProgramRepository()
    const payload = await request.json()
    const program = await repository.createProgram({
      athleteIds: payload?.athleteIds,
      name: payload?.name,
      weeks: payload?.weeks,
      startDate: payload?.startDate,
      endDate: payload?.endDate,
      description: payload?.description,
      status: payload?.status,
    })
    return json({ program }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request) {
  try {
    const repository = createAdminProgramRepository()
    const payload = await request.json()
    const program = await repository.updateProgram({
      programId: payload?.id,
      athleteIds: payload?.athleteIds,
      name: payload?.name,
      startDate: payload?.startDate,
      endDate: payload?.endDate,
      description: payload?.description,
    })
    return json({ program })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request) {
  try {
    const repository = createAdminProgramRepository()
    const payload = await request.json()
    const deletedProgram = await repository.deleteProgram(payload?.id)
    return json({ program: deletedProgram })
  } catch (error) {
    return handleRouteError(error)
  }
}
