import { createProgramWorkoutRepository } from '@/lib/program-workout-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin workout templates route error' },
    { status: error?.status || 500 },
  )
}

export async function GET() {
  try {
    const repository = createProgramWorkoutRepository()
    const workoutTemplates = await repository.listWorkoutTemplates()
    return json({ workoutTemplates })
  } catch (error) {
    return handleRouteError(error)
  }
}
