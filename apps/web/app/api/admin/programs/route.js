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
    const programs = await repository.listPrograms()
    return json({ programs })
  } catch (error) {
    return handleRouteError(error)
  }
}
