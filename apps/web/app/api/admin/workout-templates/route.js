import { cookies } from 'next/headers'

import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/admin-auth-cookies'
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

async function requireAdminAccessToken() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(PPLUS_ADMIN_ACCESS_TOKEN_COOKIE)?.value
  if (!accessToken) {
    const error = new Error('Unauthorized admin request.')
    error.status = 401
    throw error
  }
  return accessToken
}

export async function GET() {
  try {
    await requireAdminAccessToken()
    const repository = createProgramWorkoutRepository()
    const workoutTemplates = await repository.listWorkoutTemplates()
    return json({ workoutTemplates })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request) {
  try {
    await requireAdminAccessToken()
    const repository = createProgramWorkoutRepository()
    const body = await request.json()
    const workoutTemplate = await repository.createWorkoutTemplate(body ?? {})
    return json({ workoutTemplate }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request) {
  try {
    await requireAdminAccessToken()
    const repository = createProgramWorkoutRepository()
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
}

export async function DELETE(request) {
  try {
    await requireAdminAccessToken()
    const repository = createProgramWorkoutRepository()
    const body = await request.json()
    const deleteResult = await repository.deleteWorkoutTemplates({
      workoutTemplateIds: body?.workoutTemplateIds ?? [body?.id].filter(Boolean),
    })
    return json(deleteResult)
  } catch (error) {
    return handleRouteError(error)
  }
}
