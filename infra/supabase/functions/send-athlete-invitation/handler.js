import {
  createAthleteInvitationCode,
  createAthleteInvitationService,
  createLoopsTransactionalEmailClient,
  createSupabaseRestIdentityRepository,
  createSupabaseRestInvitationRepository,
  normalizeAthleteInvitationEmail,
} from './runtime.js'

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function getBearerToken(request) {
  const authorization = request.headers.get('Authorization') || request.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

function getEnvValue(env, key) {
  const value = env?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function createSendAthleteInvitationHandler({
  env = {},
  now = () => new Date(),
  identityClientFactory = (config) => createSupabaseRestIdentityRepository(config),
  invitationRepositoryFactory = (config) => createSupabaseRestInvitationRepository(config),
  loopsClientFactory = (config) => createLoopsTransactionalEmailClient(config),
  createCode = createAthleteInvitationCode,
} = {}) {
  return async function handleSendAthleteInvitation(request) {
    if ((request.method || 'GET').toUpperCase() !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed.' })
    }

    const accessToken = getBearerToken(request)
    if (!accessToken) {
      return jsonResponse(401, { error: 'Missing Authorization bearer token.' })
    }

    const supabaseUrl = getEnvValue(env, 'SUPABASE_URL')
    const supabaseAnonKey = getEnvValue(env, 'SUPABASE_ANON_KEY')
    const loopsApiKey = getEnvValue(env, 'LOOPS_API_KEY')
    const defaultAppStoreUrl = getEnvValue(env, 'PPLUS_APP_STORE_URL')
    const loopsTransactionalId = getEnvValue(env, 'LOOPS_TRANSACTIONAL_ID') || undefined

    if (!supabaseUrl || !supabaseAnonKey || !loopsApiKey) {
      return jsonResponse(500, { error: 'Athlete invitation backend is not configured yet.' })
    }

    let body = null
    try {
      body = await request.json()
    } catch {
      return jsonResponse(400, { error: 'Request body must be valid JSON.' })
    }

    const inviteeEmail = normalizeAthleteInvitationEmail(body?.inviteeEmail)
    if (!inviteeEmail) {
      return jsonResponse(400, { error: 'Invitee email is required.' })
    }

    const identityClient = identityClientFactory({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      accessToken,
    })

    const currentUser = await identityClient.getCurrentUser()
    const coachProfile = currentUser?.id
      ? await identityClient.getCoachProfileByUserId(currentUser.id)
      : null

    if (!currentUser?.id || !coachProfile?.id) {
      return jsonResponse(403, { error: 'Only coaches can send athlete invitations.' })
    }

    const invitationRepository = invitationRepositoryFactory({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      accessToken,
    })

    const loopsClient = loopsClientFactory({
      apiKey: loopsApiKey,
    })

    const invitationService = createAthleteInvitationService({
      invitationRepository,
      loopsClient,
      createCode,
      loopsTransactionalId,
    })

    const expiresAt = new Date(now().getTime() + SEVEN_DAYS_IN_MS).toISOString()

    try {
      const result = await invitationService.sendAthleteInvitation({
        coachId: coachProfile.id,
        inviteeEmail,
        coachFirstName: coachProfile.firstName || '',
        coachLastName: coachProfile.lastName || '',
        appStoreUrl: String(body?.appStoreUrl || defaultAppStoreUrl || '').trim(),
        expiresAt,
        createdByUserId: currentUser.id,
      })

      return jsonResponse(200, {
        success: true,
        invitationId: result.invitation?.id || null,
        inviteeEmail,
        expiresAt,
      })
    } catch (error) {
      return jsonResponse(500, {
        error: error?.message || 'Something went sideways while sending the athlete invitation.',
      })
    }
  }
}
