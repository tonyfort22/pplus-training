import { createAdminGroupRepository } from '@/lib/admin-group-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin groups route error' },
    { status: error?.status || 500 },
  )
}

export async function GET() {
  try {
    const repository = createAdminGroupRepository()
    const [groups, athleteOptions, programOptions] = await Promise.all([
      repository.listGroups(),
      repository.listAthleteOptions(),
      repository.listProgramOptions(),
    ])
    return json({ groups, athleteOptions, programOptions })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request) {
  try {
    const repository = createAdminGroupRepository()
    const body = await request.json()
    const group = await repository.createGroup(body ?? {})
    return json({ group }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request) {
  try {
    const repository = createAdminGroupRepository()
    const body = await request.json()

    if (body?.action === 'archive') {
      const group = await repository.archiveGroup(body ?? {})
      return json({ group })
    }

    if (body?.action === 'unarchive') {
      const group = await repository.unarchiveGroup(body ?? {})
      return json({ group })
    }

    if (body?.action === 'delete') {
      const result = await repository.deleteGroup(body ?? {})
      return json({ result })
    }

    if (body?.action === 'assign-program') {
      const result = await repository.assignProgramToGroup(body ?? {})
      return json({ result })
    }

    const group = await repository.updateGroup(body ?? {})
    return json({ group })
  } catch (error) {
    return handleRouteError(error)
  }
}
