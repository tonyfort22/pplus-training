import { getAdminDashboardOverview } from '@/lib/admin-dashboard-route-handlers'

export async function GET(request) {
  return getAdminDashboardOverview(request)
}
