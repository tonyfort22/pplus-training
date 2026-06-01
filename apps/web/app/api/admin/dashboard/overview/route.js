import { createAdminDashboardRepository } from '@/lib/admin-dashboard-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin dashboard route error' },
    { status: error?.status || 500 },
  )
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'last-month'
    const repository = createAdminDashboardRepository()
    const overview = await repository.getOverview({ range })
    return json({ overview })
  } catch (error) {
    if (error?.message?.includes('Unsupported dashboard range')) {
      error.status = error.status || 400
    }
    return handleRouteError(error)
  }
}
