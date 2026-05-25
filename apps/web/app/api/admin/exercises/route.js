import { createAdminExerciseRepository } from '@/lib/admin-exercise-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin exercises route error' },
    { status: error?.status || 500 },
  )
}

export async function GET() {
  try {
    const repository = createAdminExerciseRepository()
    const exercises = await repository.listExercises()
    return json({ exercises })
  } catch (error) {
    return handleRouteError(error)
  }
}
