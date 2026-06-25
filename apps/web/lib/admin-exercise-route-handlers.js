import { createAdminExerciseRepository } from './admin-exercise-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin exercises route error' },
    { status: error?.status || 500 },
  )
}

async function getExerciseIdFromContext(context) {
  const params = await context?.params
  return params?.exerciseId
}

export function createAdminExerciseRouteHandlers({ createRepository = createAdminExerciseRepository } = {}) {
  return {
    async GET(request, context) {
      try {
        const repository = createRepository()
        const exerciseId = await getExerciseIdFromContext(context)
        if (exerciseId) {
          const exercise = await repository.getExercise(exerciseId)
          return json({ exercise })
        }
        const [exercises, muscleOptions] = await Promise.all([
          repository.listExercises(),
          repository.listMuscles(),
        ])
        return json({ exercises, muscleOptions })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async POST(request) {
      try {
        const repository = createRepository()
        const payload = await request.json()
        const exercise = await repository.createExercise(payload ?? {})
        return json({ exercise }, { status: 201 })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async PATCH(request, context) {
      try {
        const repository = createRepository()
        const payload = await request.json()
        const exerciseId = await getExerciseIdFromContext(context)
        const exercise = await repository.updateExercise(exerciseId, payload ?? {})
        return json({ exercise })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async DELETE(request, context) {
      try {
        const repository = createRepository()
        const exerciseId = await getExerciseIdFromContext(context)
        const result = await repository.deleteExercise(exerciseId)
        return json({ result })
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}
