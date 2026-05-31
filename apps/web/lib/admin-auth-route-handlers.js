import { clearAdminAuthCookies, setAdminAuthCookies } from './admin-auth-cookies.js'
import { getAdminAuthRedirectUrl } from './admin-auth-config.js'
import { createAdminAuthRepository } from './admin-auth-repository.js'

const SAFE_FORGOT_PASSWORD_MESSAGE = 'If an account exists for that email, a reset link has been sent.'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    const error = new Error('Invalid JSON request body.')
    error.status = 400
    throw error
  }
}

function routeErrorResponse(error, fallbackMessage = 'Unknown admin auth route error') {
  return json(
    { error: error?.message || fallbackMessage },
    { status: error?.status || 500 },
  )
}

function requireLoginPayload(body) {
  if (!String(body?.email || '').trim() || !String(body?.password || '').trim()) {
    const error = new Error('Email and password are required.')
    error.status = 400
    throw error
  }
}

function requireEmailPayload(body) {
  if (!String(body?.email || '').trim()) {
    const error = new Error('Email is required.')
    error.status = 400
    throw error
  }
}

function requireResetPayload(body) {
  if (!String(body?.accessToken || '').trim() || !String(body?.password || '').trim()) {
    const error = new Error('Recovery token and password are required.')
    error.status = 400
    throw error
  }
}

export function createAdminAuthRouteHandlers(options = {}) {
  const createRepository = options.createRepository ?? (() => createAdminAuthRepository())
  const cookieOptions = { nodeEnv: options.nodeEnv }

  return {
    async login(request) {
      try {
        const body = await readJsonBody(request)
        requireLoginPayload(body)
        const repository = createRepository()
        const session = await repository.signInAdminWithPassword({
          email: body?.email,
          password: body?.password,
        })
        const response = json({ success: true, redirectTo: '/admin' })
        setAdminAuthCookies(response, session, cookieOptions)
        return response
      } catch (error) {
        return routeErrorResponse(error, 'Unknown admin login route error')
      }
    },

    async logout() {
      const response = json({ success: true })
      clearAdminAuthCookies(response, cookieOptions)
      return response
    },

    async forgotPassword(request) {
      try {
        const body = await readJsonBody(request)
        requireEmailPayload(body)
        const repository = createRepository()
        await repository.requestPasswordReset({
          email: body?.email,
          redirectTo: getAdminAuthRedirectUrl(request, '/admin/reset-password'),
        })
        return json({ success: true, message: SAFE_FORGOT_PASSWORD_MESSAGE })
      } catch (error) {
        return routeErrorResponse(error, 'Unknown admin forgot password route error')
      }
    },

    async resetPassword(request) {
      try {
        const body = await readJsonBody(request)
        requireResetPayload(body)
        const repository = createRepository()
        await repository.updatePasswordWithRecoveryToken({
          accessToken: body.accessToken,
          password: body.password,
        })
        return json({ success: true, redirectTo: '/admin/login?passwordReset=1' })
      } catch (error) {
        return routeErrorResponse(error, 'Unknown admin reset password route error')
      }
    },
  }
}
