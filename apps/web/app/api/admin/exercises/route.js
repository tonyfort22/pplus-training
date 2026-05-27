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
    const [exercises, muscleOptions] = await Promise.all([
      repository.listExercises(),
      repository.listMuscles(),
    ])
    return json({ exercises, muscleOptions })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request) {
  try {
    const repository = createAdminExerciseRepository()
    const payload = await request.json()
    const exercise = await repository.createExercise(payload)
    return json({ exercise }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
