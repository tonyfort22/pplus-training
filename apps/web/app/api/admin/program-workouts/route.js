import { cookies } from 'next/headers'

import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/admin-auth-cookies'
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

export async function POST(request) {
  try {
    await requireAdminAccessToken()
    const repository = createProgramWorkoutRepository()
    const payload = await request.json()
    const programWorkoutTree = payload?.createProgramPlanFromDraft
      ? await repository.createProgramPlanFromDraft(payload)
      : payload?.workout_template_id || payload?.workoutTemplateId
        ? await repository.createProgramWorkoutFromTemplate(payload)
        : await repository.createProgramWorkoutFromSections(payload)
    return json({ programWorkoutTree }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
