import { createAdminGroupRepository } from './admin-group-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin groups route error' },
    { status: error?.status || 500 },
  )
}

export function createAdminGroupRouteHandlers({ createRepository = createAdminGroupRepository } = {}) {
  return {
    async GET() {
      try {
        const repository = createRepository()
        const [groups, athleteOptions, programOptions] = await Promise.all([
          repository.listGroups(),
          repository.listAthleteOptions(),
          repository.listProgramOptions(),
        ])
        return json({ groups, athleteOptions, programOptions })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async POST(request) {
      try {
        const repository = createRepository()
        const body = await request.json()
        const group = await repository.createGroup(body ?? {})
        return json({ group }, { status: 201 })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async PATCH(request) {
      try {
        const repository = createRepository()
        const body = await request.json()

        if (body?.action === 'archive') {
          if (Array.isArray(body?.groupIds)) {
            const result = await repository.archiveGroups(body ?? {})
            return json({ result })
          }
          const group = await repository.archiveGroup(body ?? {})
          return json({ group })
        }

        if (body?.action === 'unarchive') {
          const group = await repository.unarchiveGroup(body ?? {})
          return json({ group })
        }

        if (body?.action === 'restore') {
          const result = await repository.restoreGroups(body ?? {})
          return json({ result })
        }

        if (body?.action === 'delete') {
          const result = await repository.deleteGroup(body ?? {})
          return json({ result })
        }

        if (body?.action === 'assign-program') {
          const result = await repository.assignProgramToGroups(body ?? {})
          return json({ result })
        }

        if (body?.action === 'add-athletes') {
          const result = await repository.addAthletesToGroups(body ?? {})
          return json({ result })
        }

        const group = await repository.updateGroup(body ?? {})
        return json({ group })
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}
