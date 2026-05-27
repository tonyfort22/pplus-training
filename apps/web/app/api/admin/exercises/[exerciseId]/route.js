import { createAdminExerciseRepository } from '@/lib/admin-exercise-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin exercise route error' },
    { status: error?.status || 500 },
  )
}

async function getExerciseIdFromContext(context) {
  const params = await context?.params
  return params?.exerciseId
}

export async function GET(request, context) {
  try {
    const repository = createAdminExerciseRepository()
    const exerciseId = await getExerciseIdFromContext(context)
    const exercise = await repository.getExercise(exerciseId)
    return json({ exercise })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request, context) {
  try {
    const repository = createAdminExerciseRepository()
    const payload = await request.json()
    const exerciseId = await getExerciseIdFromContext(context)
    const exercise = await repository.updateExercise(exerciseId, payload)
    return json({ exercise })
  } catch (error) {
    return handleRouteError(error)
  }
}
