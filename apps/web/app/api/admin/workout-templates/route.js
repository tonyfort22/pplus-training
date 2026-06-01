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

export async function GET() {
  try {
    const repository = createProgramWorkoutRepository()
    const workoutTemplates = await repository.listWorkoutTemplates()
    return json({ workoutTemplates })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request) {
  try {
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
    const repository = createProgramWorkoutRepository()
    const body = await request.json()
    const workoutTemplate = await repository.updateWorkoutTemplate(body?.id, body ?? {})
    return json({ workoutTemplate })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request) {
  try {
    const repository = createProgramWorkoutRepository()
    const body = await request.json()
    const workoutTemplate = await repository.archiveWorkoutTemplate(body?.id)
    return json({ workoutTemplate })
  } catch (error) {
    return handleRouteError(error)
  }
}
