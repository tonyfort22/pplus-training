export const INVITE_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const INVITE_CODE_LENGTH = 6
export const ATHLETE_INVITATION_LOOPS_TRANSACTIONAL_ID = 'pplus-athlete-invite'

function getWebCrypto() {
  const cryptoImpl = globalThis.crypto
  if (!cryptoImpl?.getRandomValues || !cryptoImpl?.subtle) {
    throw new Error('Web Crypto support is required for athlete invitations')
  }
  return cryptoImpl
}

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function requireFetch(fetchImpl, message) {
  if (typeof fetchImpl !== 'function') {
    throw new Error(message)
  }
  return fetchImpl
}

function mapAthleteInvitationRow(row) {
  if (!row) return null
  return {
    id: row.id,
    coachId: row.coach_id ?? null,
    inviteeEmail: row.invitee_email ?? null,
    codeHash: row.code_hash ?? null,
    expiresAt: row.expires_at ?? null,
    usedAt: row.used_at ?? null,
    revokedAt: row.revoked_at ?? null,
    sentAt: row.sent_at ?? null,
    athleteProfileId: row.athlete_profile_id ?? null,
    createdByUserId: row.created_by_user_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

export function normalizeAthleteInvitationEmail(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized || null
}

export function createAthleteInvitationCode({ length = INVITE_CODE_LENGTH, charset = INVITE_CODE_CHARSET } = {}) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('Athlete invitation code length must be a positive integer')
  }

  if (!charset || typeof charset !== 'string') {
    throw new Error('Athlete invitation code charset is required')
  }

  const cryptoImpl = getWebCrypto()
  const randomBytes = new Uint32Array(length)
  cryptoImpl.getRandomValues(randomBytes)

  let result = ''
  for (let index = 0; index < length; index += 1) {
    const randomIndex = randomBytes[index] % charset.length
    result += charset[randomIndex]
  }
  return result
}

export async function hashAthleteInvitationCode(rawCode) {
  const normalizedCode = String(rawCode || '').trim().toUpperCase()
  if (!normalizedCode) {
    throw new Error('Athlete invitation code is required')
  }

  const cryptoImpl = getWebCrypto()
  const encoded = new TextEncoder().encode(normalizedCode)
  const digest = await cryptoImpl.subtle.digest('SHA-256', encoded)
  return bytesToHex(digest)
}

export function buildAthleteInvitationLoopsPayload({
  inviteeEmail,
  inviteCode,
  coachFirstName,
  coachLastName,
  appStoreUrl,
  expiresAt,
  transactionalId = ATHLETE_INVITATION_LOOPS_TRANSACTIONAL_ID,
}) {
  const normalizedEmail = normalizeAthleteInvitationEmail(inviteeEmail)
  if (!normalizedEmail) {
    throw new Error('Invitee email is required')
  }

  const normalizedCode = String(inviteCode || '').trim().toUpperCase()
  if (!normalizedCode) {
    throw new Error('Invite code is required')
  }

  const normalizedCoachFirstName = String(coachFirstName || '').trim()
  const normalizedCoachLastName = String(coachLastName || '').trim()
  const normalizedTransactionalId = String(transactionalId || '').trim()
  const coachDisplayName = [normalizedCoachFirstName, normalizedCoachLastName].filter(Boolean).join(' ').trim()

  if (!normalizedTransactionalId) {
    throw new Error('Loops transactional email ID is required')
  }

  return {
    transactionalId: normalizedTransactionalId,
    email: normalizedEmail,
    dataVariables: {
      inviteCode: normalizedCode,
      coachFirstName: normalizedCoachFirstName,
      coachLastName: normalizedCoachLastName,
      coachDisplayName,
      appStoreUrl: String(appStoreUrl || '').trim(),
      expiresAt: expiresAt ?? null,
    },
  }
}

export function createLoopsTransactionalEmailClient(config = {}) {
  const apiKey = String(config.apiKey || '').trim()
  const fetchImpl = requireFetch(config.fetchImpl ?? globalThis.fetch, 'Loops transactional email client requires fetch support')

  if (!apiKey) {
    throw new Error('Loops transactional email client requires an apiKey')
  }

  return {
    async sendTransactionalEmail(payload) {
      const response = await fetchImpl('https://app.loops.so/api/v1/transactional', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      const parsed = text ? JSON.parse(text) : null

      if (!response.ok) {
        const message = parsed?.message || (typeof parsed === 'string' && parsed) || response.statusText || 'Unknown Loops transactional email error'
        throw new Error(`Loops transactional email request failed (${response.status}): ${message}`)
      }

      return parsed
    },
  }
}

export function createSupabaseRestInvitationRepository(config = {}) {
  const baseUrl = config.url
  const anonKey = config.anonKey
  const accessToken = config.accessToken || null
  const schema = config.schema || 'public'
  const fetchImpl = requireFetch(config.fetchImpl ?? globalThis.fetch, 'Supabase REST invitation repository requires fetch support')

  function resolveAccessToken() {
    return typeof accessToken === 'function' ? accessToken() : accessToken
  }

  if (!baseUrl) {
    throw new Error('Supabase REST invitation repository requires a url')
  }

  if (!anonKey) {
    throw new Error('Supabase REST invitation repository requires an anonKey')
  }

  async function request({ method = 'GET', table, query = {}, body }) {
    const url = new URL(`/rest/v1/${table}`, baseUrl)
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue
      url.searchParams.set(key, value)
    }

    const response = await fetchImpl(url.toString(), {
      method,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${resolveAccessToken() || anonKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
        'Accept-Profile': schema,
        'Content-Profile': schema,
      },
      body: body == null ? undefined : JSON.stringify(body),
    })

    const text = await response.text()
    const parsed = text ? JSON.parse(text) : null

    if (!response.ok) {
      const message = parsed?.message || (typeof parsed === 'string' && parsed) || response.statusText || 'Unknown Supabase invitation error'
      throw new Error(`Supabase invitation request failed (${response.status}): ${message}`)
    }

    return parsed
  }

  return {
    async createAthleteInvitation({ coachId, inviteeEmail, inviteCode, expiresAt, createdByUserId = null }) {
      const normalizedEmail = normalizeAthleteInvitationEmail(inviteeEmail)
      if (!normalizedEmail) {
        throw new Error('Invitee email is required')
      }

      const codeHash = await hashAthleteInvitationCode(inviteCode)
      const rows = await request({
        method: 'POST',
        table: 'athlete_invitations',
        body: {
          coach_id: coachId,
          invitee_email: normalizedEmail,
          code_hash: codeHash,
          expires_at: expiresAt,
          created_by_user_id: createdByUserId,
        },
      })

      return mapAthleteInvitationRow(Array.isArray(rows) ? rows[0] : rows)
    },
  }
}

function createSupabaseEdgeFunctionClient(config = {}) {
  const baseUrl = config.url
  const anonKey = config.anonKey
  const accessToken = config.accessToken || null
  const fetchImpl = requireFetch(config.fetchImpl ?? globalThis.fetch, 'Supabase edge invitation client requires fetch support')
  const requestTimeoutMs = Number.isFinite(Number(config.requestTimeoutMs)) && Number(config.requestTimeoutMs) > 0
    ? Number(config.requestTimeoutMs)
    : 20000

  function resolveAccessToken() {
    return typeof accessToken === 'function' ? accessToken() : accessToken
  }

  if (!baseUrl) {
    throw new Error('Supabase edge invitation client requires a url')
  }

  if (!anonKey) {
    throw new Error('Supabase edge invitation client requires an anonKey')
  }

  async function invokeFunction(functionName, body) {
    const abortController = typeof AbortController === 'function' ? new AbortController() : null
    const timeoutHandle = abortController
      ? globalThis.setTimeout(() => abortController.abort(new Error(`${functionName} timed out after ${requestTimeoutMs}ms`)), requestTimeoutMs)
      : null

    try {
      const response = await fetchImpl(new URL(`/functions/v1/${functionName}`, baseUrl).toString(), {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${resolveAccessToken() || anonKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortController?.signal,
      })

      const text = await response.text()
      const parsed = text ? JSON.parse(text) : null

      if (!response.ok) {
        const message = parsed?.message || parsed?.error || (typeof parsed === 'string' && parsed) || response.statusText || `Unknown ${functionName} error`
        throw new Error(`Supabase edge invitation request failed (${response.status}): ${message}`)
      }

      return parsed
    } catch (error) {
      const message = String(error?.message || '')
      const isTimeoutAbort = Boolean(
        abortController?.signal?.aborted && (
          message.includes('timed out after')
          || message === 'Aborted'
          || error?.name === 'AbortError'
        ),
      )
      if (isTimeoutAbort) {
        throw new Error(`Supabase edge invitation request timed out while waiting for ${functionName}.`)
      }
      throw error
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }
    }
  }

  return {
    async sendAthleteInvitation({ inviteeEmail, coachFirstName = '', coachLastName = '', appStoreUrl = '' }) {
      return invokeFunction('send-athlete-invitation', {
        inviteeEmail: normalizeAthleteInvitationEmail(inviteeEmail),
        coachFirstName: String(coachFirstName || '').trim(),
        coachLastName: String(coachLastName || '').trim(),
        appStoreUrl: String(appStoreUrl || '').trim(),
      })
    },
    async completeAthleteInvitation({
      inviteCode,
      firstName,
      lastName,
      password,
      confirmPassword,
      dateOfBirth,
      gender,
      position,
      weight,
      weightUnit,
      heightUnit,
      heightFeet,
      heightInches,
      heightCm,
    }) {
      return invokeFunction('complete-athlete-invitation', {
        inviteCode: String(inviteCode || '').trim().toUpperCase(),
        firstName: String(firstName || '').trim(),
        lastName: String(lastName || '').trim(),
        password: String(password || ''),
        confirmPassword: String(confirmPassword || ''),
        dateOfBirth: String(dateOfBirth || '').trim(),
        gender: String(gender || '').trim(),
        position: String(position || '').trim(),
        weight: String(weight || '').trim(),
        weightUnit: String(weightUnit || '').trim().toLowerCase() || 'lb',
        heightUnit: String(heightUnit || '').trim().toLowerCase() || 'ft',
        heightFeet: String(heightFeet || '').trim(),
        heightInches: String(heightInches || '').trim(),
        heightCm: String(heightCm || '').trim(),
      })
    },
  }
}

export function createSupabaseEdgeInvitationClient(config = {}) {
  const client = createSupabaseEdgeFunctionClient(config)
  return {
    async sendAthleteInvitation(input) {
      return client.sendAthleteInvitation(input)
    },
  }
}

export function createSupabaseEdgeInvitationCompletionClient(config = {}) {
  const client = createSupabaseEdgeFunctionClient(config)
  return {
    async completeAthleteInvitation(input) {
      return client.completeAthleteInvitation(input)
    },
  }
}

export function createAthleteInvitationService({
  invitationRepository,
  loopsClient,
  createCode = createAthleteInvitationCode,
  loopsTransactionalId,
} = {}) {
  if (!invitationRepository || typeof invitationRepository.createAthleteInvitation !== 'function') {
    throw new Error('Athlete invitation service requires an invitationRepository.createAthleteInvitation function')
  }

  if (!loopsClient || typeof loopsClient.sendTransactionalEmail !== 'function') {
    throw new Error('Athlete invitation service requires a loopsClient.sendTransactionalEmail function')
  }

  if (typeof createCode !== 'function') {
    throw new Error('Athlete invitation service requires a createCode function')
  }

  return {
    async sendAthleteInvitation({
      coachId,
      inviteeEmail,
      coachFirstName,
      coachLastName,
      appStoreUrl,
      expiresAt,
      createdByUserId = null,
    }) {
      const normalizedEmail = normalizeAthleteInvitationEmail(inviteeEmail)
      const inviteCode = String(createCode()).trim().toUpperCase()
      const invitation = await invitationRepository.createAthleteInvitation({
        coachId,
        inviteeEmail: normalizedEmail,
        inviteCode,
        expiresAt,
        createdByUserId,
      })
      const loopsPayload = buildAthleteInvitationLoopsPayload({
        inviteeEmail: normalizedEmail,
        inviteCode,
        coachFirstName,
        coachLastName,
        appStoreUrl,
        expiresAt,
        transactionalId: loopsTransactionalId,
      })
      const loopsResponse = await loopsClient.sendTransactionalEmail(loopsPayload)

      return {
        invitation,
        inviteCode,
        loopsPayload,
        loopsResponse,
      }
    },
  }
}
