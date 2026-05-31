import { createProgramWorkoutRepository } from '@/lib/program-workout-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin program workout route error' },
    { status: error?.status || 500 },
  )
}

export async function GET(_request, context) {
  try {
    const repository = createProgramWorkoutRepository()
    const programWorkoutTree = await repository.getProgramWorkoutTree(context?.params?.programWorkoutId)
    return json({ programWorkoutTree })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request, context) {
  try {
    const repository = createProgramWorkoutRepository()
    const payload = await request.json()
    const programWorkoutId = context?.params?.programWorkoutId
    await repository.updateProgramWorkoutDetails(
      programWorkoutId,
      payload?.details ?? payload,
    )

    const programWorkoutTree = payload?.trainingSections
      ? await repository.replaceProgramWorkoutChildren(programWorkoutId, payload.trainingSections)
      : await repository.getProgramWorkoutTree(programWorkoutId)

    return json({ programWorkoutTree })
  } catch (error) {
    return handleRouteError(error)
  }
}
