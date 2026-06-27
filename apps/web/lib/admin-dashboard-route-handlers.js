import { createAdminDashboardRepository } from './admin-dashboard-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin dashboard route error' },
    { status: error?.status || 500 },
  )
}

export function createAdminDashboardRouteHandlers({ createRepository = createAdminDashboardRepository } = {}) {
  return {
    async overview(request) {
      try {
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || 'last-month'
        const repository = createRepository()
        const overview = await repository.getOverview({ range })
        return json({ overview })
      } catch (error) {
        if (error?.message?.includes('Unsupported dashboard range')) {
          error.status = error.status || 400
        }
        return handleRouteError(error)
      }
    },
  }
}

const adminDashboardRouteHandlers = createAdminDashboardRouteHandlers()

export async function getAdminDashboardOverview(request) {
  return adminDashboardRouteHandlers.overview(request)
}
