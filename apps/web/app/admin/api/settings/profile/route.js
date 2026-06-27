import { cookies } from 'next/headers'

import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/admin-auth-cookies'
import { createAdminCoachProfileRepository } from '@/lib/admin-coach-profile-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin settings profile route error' },
    { status: error?.status || 500 },
  )
}

async function getAccessToken() {
  const cookieStore = await cookies()
  return cookieStore.get(PPLUS_ADMIN_ACCESS_TOKEN_COOKIE)?.value || ''
}

export async function GET() {
  try {
    const accessToken = await getAccessToken()
    const repository = createAdminCoachProfileRepository({ accessToken })
    const profile = await repository.getCurrentCoachProfile()
    return json({ profile })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request) {
  try {
    const accessToken = await getAccessToken()
    const repository = createAdminCoachProfileRepository({ accessToken })
    const body = await request.json()
    const profile = await repository.updateCurrentCoachProfile(body ?? {})
    return json({ profile })
  } catch (error) {
    return handleRouteError(error)
  }
}
