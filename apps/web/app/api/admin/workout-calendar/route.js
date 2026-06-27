import { createWorkoutCalendarRouteHandlers } from '@/lib/workout-calendar-route-handlers'

const handlers = createWorkoutCalendarRouteHandlers()

export async function GET(request) {
  return handlers.GET(request)
}

export async function POST(request) {
  return handlers.POST(request)
}

export async function PATCH(request) {
  return handlers.PATCH(request)
}

export async function DELETE(request) {
  return handlers.DELETE(request)
}
