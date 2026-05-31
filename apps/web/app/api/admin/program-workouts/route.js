import { createProgramWorkoutRepository } from '@/lib/program-workout-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin program workouts route error' },
    { status: error?.status || 500 },
  )
}

export async function POST(request) {
  try {
    const repository = createProgramWorkoutRepository()
    const payload = await request.json()
    const programWorkoutTree = await repository.createProgramWorkoutFromTemplate(payload)
    return json({ programWorkoutTree }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
