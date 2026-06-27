import { createProgramWorkoutRepository } from './program-workout-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin workout templates route error' },
    { status: error?.status || 500 },
  )
}

export function createAdminWorkoutTemplateRouteHandlers({
  requireAdminAccessToken,
  repositoryFactory = createProgramWorkoutRepository,
} = {}) {
  async function requireAdmin() {
    if (typeof requireAdminAccessToken !== 'function') {
      const error = new Error('Admin access token verifier is not configured.')
      error.status = 500
      throw error
    }
    return requireAdminAccessToken()
  }

  return {
    async GET() {
      try {
        await requireAdmin()
        const repository = repositoryFactory()
        const workoutTemplates = await repository.listWorkoutTemplates()
        return json({ workoutTemplates })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async POST(request) {
      try {
        await requireAdmin()
        const repository = repositoryFactory()
        const body = await request.json()
        const workoutTemplate = await repository.createWorkoutTemplate(body ?? {})
        return json({ workoutTemplate }, { status: 201 })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async PATCH(request) {
      try {
        await requireAdmin()
        const repository = repositoryFactory()
        const body = await request.json()
        if (body?.action === 'assign-workout-templates-to-program') {
          const assignment = await repository.assignWorkoutTemplatesToProgram({
            programId: body?.programId,
            workoutTemplateIds: body?.workoutTemplateIds,
          })
          return json(assignment)
        }
        if (body?.action === 'archive-workout-templates') {
          const archiveResult = await repository.archiveWorkoutTemplates({
            workoutTemplateIds: body?.workoutTemplateIds,
          })
          return json(archiveResult)
        }
        const workoutTemplate = await repository.updateWorkoutTemplate(body?.id, body ?? {})
        return json({ workoutTemplate })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async DELETE(request) {
      try {
        await requireAdmin()
        const repository = repositoryFactory()
        const body = await request.json()
        const deleteResult = await repository.deleteWorkoutTemplates({
          workoutTemplateIds: body?.workoutTemplateIds ?? [body?.id].filter(Boolean),
        })
        return json(deleteResult)
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}
