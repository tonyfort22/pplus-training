import { createAdminProgramRepository } from './admin-program-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin programs route error' },
    { status: error?.status || 500 },
  )
}

export function createAdminProgramRouteHandlers({ createRepository = createAdminProgramRepository } = {}) {
  return {
    async GET() {
      try {
        const repository = createRepository()
        const [programs, athleteOptions] = await Promise.all([
          repository.listPrograms(),
          repository.listAthleteOptions(),
        ])
        return json({ programs, athleteOptions })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async POST(request) {
      try {
        const repository = createRepository()
        const payload = await request.json()
        if (payload?.action === 'duplicate') {
          const program = await repository.duplicateProgram({
            sourceProgramId: payload?.sourceProgramId,
            athleteIds: payload?.athleteIds,
            name: payload?.name,
            startDate: payload?.startDate,
            endDate: payload?.endDate,
            description: payload?.description,
            copyOptions: payload?.copyOptions,
          })
          return json({ program }, { status: 201 })
        }
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
    },

    async PATCH(request) {
      try {
        const repository = createRepository()
        const payload = await request.json()
        if (payload?.action === 'archive-programs') {
          const { archivedPrograms, skippedPrograms } = await repository.archivePrograms({ programIds: payload?.programIds })
          return json({ archivedPrograms, skippedPrograms })
        }
        if (payload?.action === 'archive') {
          const program = await repository.archiveProgram(payload?.id)
          return json({ program })
        }
        if (payload?.action === 'assign-athletes') {
          const program = await repository.assignProgramToAthletes({
            programId: payload?.id,
            athleteIds: payload?.athleteIds,
          })
          return json({ program })
        }
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
    },

    async DELETE(request) {
      try {
        const repository = createRepository()
        const payload = await request.json()
        if (payload?.action === 'delete-programs') {
          const { deletedPrograms } = await repository.deletePrograms({ programIds: payload?.programIds })
          return json({ deletedPrograms })
        }
        const deletedProgram = await repository.deleteProgram(payload?.id)
        return json({ program: deletedProgram })
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}
