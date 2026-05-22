import { createWorkoutCalendarRepository } from '@/lib/workout-calendar-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown workout calendar route error' },
    { status: error?.status || 500 },
  )
}

export async function GET(request) {
  try {
    const repository = createWorkoutCalendarRepository()
    const url = new URL(request.url)
    const athleteId = url.searchParams.get('athleteId') || null
    const assignments = await repository.listAssignments({ athleteId })
    return json({ assignments })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request) {
  try {
    const repository = createWorkoutCalendarRepository()
    const body = await request.json()
    const assignment = await repository.createAssignment({
      athlete_id: body.athlete_id ?? null,
      coach_id: body.coach_id ?? null,
      program_id: body.program_id ?? null,
      program_day_id: body.program_day_id ?? null,
      workout_template_id: body.workout_template_id ?? null,
      name_snapshot: body.name_snapshot,
      notes: body.notes ?? null,
      status: body.status ?? 'scheduled',
      sort_order: body.sort_order ?? null,
      scheduled_date: body.scheduled_date,
      scheduled_start_time: body.scheduled_start_time,
      scheduled_end_time: body.scheduled_end_time,
    })
    return json({ assignment })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request) {
  try {
    const repository = createWorkoutCalendarRepository()
    const body = await request.json()
    const assignment = await repository.updateAssignment(body.id, {
      workout_template_id: body.workout_template_id ?? null,
      name_snapshot: body.name_snapshot,
      notes: body.notes ?? null,
      status: body.status ?? 'scheduled',
      scheduled_date: body.scheduled_date,
      scheduled_start_time: body.scheduled_start_time,
      scheduled_end_time: body.scheduled_end_time,
    })
    return json({ assignment })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request) {
  try {
    const repository = createWorkoutCalendarRepository()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    await repository.deleteAssignment(id)
    return json({ id })
  } catch (error) {
    return handleRouteError(error)
  }
}
