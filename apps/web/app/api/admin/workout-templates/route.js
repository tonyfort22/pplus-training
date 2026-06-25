import { cookies } from 'next/headers'

import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/admin-auth-cookies'
import { createAdminWorkoutTemplateRouteHandlers } from '@/lib/admin-workout-template-route-handlers'

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

const handlers = createAdminWorkoutTemplateRouteHandlers({ requireAdminAccessToken })

export async function GET() {
  return handlers.GET()
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
