import { cookies } from 'next/headers'

import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/admin-auth-cookies'
import { createAdminAccountRepository } from '@/lib/admin-account-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin settings account route error' },
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
    const repository = createAdminAccountRepository({ accessToken })
    const account = await repository.getCurrentAccount()
    return json({ account })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request) {
  try {
    const accessToken = await getAccessToken()
    const repository = createAdminAccountRepository({ accessToken })
    const body = await request.json()
    const account = await repository.updateCurrentAccount(body ?? {})
    return json({ account })
  } catch (error) {
    return handleRouteError(error)
  }
}
