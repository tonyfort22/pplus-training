import {
  createAthleteInvitationService,
  createLoopsTransactionalEmailClient,
  hashAthleteInvitationCode,
  normalizeAthleteInvitationEmail,
} from '../../../packages/data/src/invitations/index.js'
import { createSupabaseRestIdentityRepository } from '../../../packages/data/src/identity/index.js'

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000

function createRepositoryError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  error.cause = cause
  return error
}

function requireFetch(fetchImpl, message) {
  if (typeof fetchImpl !== 'function') {
    throw createRepositoryError(message, 500)
  }
  return fetchImpl
}

function getRepositoryConfig(overrides = {}) {
  const supabaseUrl = overrides.supabaseUrl ?? process.env.SUPABASE_URL
  const serviceRoleKey = overrides.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  const loopsApiKey = overrides.loopsApiKey ?? process.env.LOOPS_API_KEY ?? ''
  const loopsTransactionalId = overrides.loopsTransactionalId ?? process.env.LOOPS_TRANSACTIONAL_ID ?? ''
  const appStoreUrl = overrides.appStoreUrl ?? process.env.PPLUS_APP_STORE_URL ?? ''
  const fetchImpl = requireFetch(overrides.fetchImpl ?? globalThis.fetch, 'Fetch support is required for admin athlete persistence.')

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRepositoryError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return {
    baseUrl: supabaseUrl.replace(/\/$/, ''),
    baseRestUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
    loopsApiKey: String(loopsApiKey || '').trim(),
    loopsTransactionalId: String(loopsTransactionalId || '').trim(),
    appStoreUrl: String(appStoreUrl || '').trim(),
    fetchImpl,
  }
}

function createRepositoryClient(overrides = {}) {
  const config = getRepositoryConfig(overrides)

  async function requestJson(url, options = {}, errorLabel = 'Supabase request') {
    const response = await config.fetchImpl(url, {
      cache: 'no-store',
      ...options,
    })

    const text = await response.text()
    let parsed = null
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }
    }

    if (!response.ok) {
      const message = parsed?.message || parsed?.error || parsed?.msg || parsed?.error_description || (typeof parsed === 'string' ? parsed : '') || response.statusText || `Unknown ${errorLabel} error`
      throw createRepositoryError(`${errorLabel} failed: ${response.status} ${message}`, response.status)
    }

    return parsed
  }

  async function requestTable(table, query = '') {
    return requestJson(`${config.baseRestUrl}/${table}${query}`, {
      method: 'GET',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }, `${table} request`)
  }

  async function insertTable(table, payload) {
    return requestJson(`${config.baseRestUrl}/${table}`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    }, `${table} insert`)
  }

  async function patchTable(table, query = '', payload = {}) {
    return requestJson(`${config.baseRestUrl}/${table}${query}`, {
      method: 'PATCH',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    }, `${table} patch`)
  }

  async function deleteTable(table, query = '') {
    return requestJson(`${config.baseRestUrl}/${table}${query}`, {
      method: 'DELETE',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
    }, `${table} delete`)
  }

  async function authAdminRequest(path, { method = 'GET', body } = {}) {
    return requestJson(`${config.baseUrl}${path}`, {
      method,
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body == null ? undefined : JSON.stringify(body),
    }, 'Supabase auth admin request')
  }

  return {
    config,
    requestTable,
    insertTable,
    patchTable,
    deleteTable,
    authAdminRequest,
  }
}

function normalizeAthleteIds(athleteIds = []) {
  return Array.from(new Set((Array.isArray(athleteIds) ? athleteIds : [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)))
}

function formatShortcutCode(index) {
  return `A${String(index + 1).padStart(2, '0')}`
}

function getFullName(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unnamed athlete'
}

function formatRelativeTimestamp(value) {
  if (!value) return 'Never'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function formatStatus(status) {
  if (status === 'active') return 'Active'
  if (status === 'inactive') return 'Inactive'
  if (!status) return 'Inactive'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function createLatestProgramMap(programRows) {
  return (Array.isArray(programRows) ? programRows : []).reduce((accumulator, row) => {
    const athleteId = row?.athlete_id
    if (!athleteId) return accumulator

    const current = accumulator.get(athleteId)
    const currentCreated = current?.created_at ? new Date(current.created_at).getTime() : -Infinity
    const nextCreated = row?.created_at ? new Date(row.created_at).getTime() : -Infinity

    if (!current || nextCreated >= currentCreated) {
      accumulator.set(athleteId, row)
    }

    return accumulator
  }, new Map())
}

function createCountMap(rows, key) {
  return (Array.isArray(rows) ? rows : []).reduce((accumulator, row) => {
    const value = row?.[key]
    if (!value) return accumulator
    accumulator.set(value, (accumulator.get(value) ?? 0) + 1)
    return accumulator
  }, new Map())
}

function createLatestActivityMap(sessionRows) {
  return (Array.isArray(sessionRows) ? sessionRows : []).reduce((accumulator, row) => {
    const athleteId = row?.athlete_id
    if (!athleteId) return accumulator

    const candidate = row.completed_at ?? row.updated_at ?? null
    if (!candidate) return accumulator

    const current = accumulator.get(athleteId)
    const currentTime = current ? new Date(current).getTime() : -Infinity
    const nextTime = new Date(candidate).getTime()

    if (nextTime >= currentTime) {
      accumulator.set(athleteId, candidate)
    }

    return accumulator
  }, new Map())
}

function createInviteStatusMap(inviteRows) {
  return (Array.isArray(inviteRows) ? inviteRows : []).reduce((accumulator, row) => {
    const athleteId = row?.athlete_profile_id
    if (!athleteId) return accumulator
    accumulator.set(athleteId, true)
    return accumulator
  }, new Map())
}

function sanitizeTextField(value) {
  const normalizedValue = String(value ?? '').trim()
  return normalizedValue || null
}

function sanitizeNullableNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback
  const normalizedValue = Number(value)
  return Number.isFinite(normalizedValue) ? normalizedValue : fallback
}

function mapAthleteRow(row, index, context) {
  const name = getFullName(row)
  const latestProgram = context.latestProgramByAthleteId.get(row.id)
  const workoutsTarget = context.assignedWorkoutCountByAthleteId.get(row.id) ?? 0
  const workoutsCompleted = context.completedWorkoutCountByAthleteId.get(row.id) ?? 0
  const workoutsPercentage = workoutsTarget > 0 ? Math.min(100, Math.round((workoutsCompleted / workoutsTarget) * 100)) : 0
  const latestActivity = context.latestActivityByAthleteId.get(row.id) ?? null

  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    fullName: name,
    name,
    shortcutCode: formatShortcutCode(index),
    createdAt: row.created_at ?? null,
    status: formatStatus(row.status),
    avatarUrl: row.avatar_url ?? '',
    dateOfBirth: row.date_of_birth ?? null,
    gender: row.gender ?? null,
    position: row.position ?? null,
    heightCm: row.height_cm ?? null,
    weightKg: row.weight_kg ?? null,
    hasInvite: context.inviteStatusByAthleteId.get(row.id) ?? false,
    program: latestProgram?.name ?? '-',
    workoutsCompleted,
    workoutsTarget,
    workoutsPercentage,
    lastActive: formatRelativeTimestamp(latestActivity),
  }
}

function mapPatchedAthleteRow(row, { inviteeEmail = null, invitation = null } = {}) {
  const name = getFullName(row)
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    fullName: name,
    name,
    status: formatStatus(row.status),
    avatarUrl: row.avatar_url ?? '',
    dateOfBirth: row.date_of_birth ?? null,
    gender: row.gender ?? null,
    position: row.position ?? null,
    heightCm: row.height_cm ?? null,
    weightKg: row.weight_kg ?? null,
    hasInvite: Boolean(invitation),
    program: '-',
    workoutsCompleted: 0,
    workoutsTarget: 0,
    workoutsPercentage: 0,
    lastActive: 'Never',
    inviteeEmail,
    invitation,
  }
}

async function resolveCoachContext(client) {
  const coachRows = await client.requestTable('coach_profiles', '?select=id,user_id,first_name,last_name&order=created_at.asc&limit=1')
  const coachRow = Array.isArray(coachRows) ? coachRows[0] : coachRows
  if (!coachRow?.id) {
    throw createRepositoryError('No coach profile exists yet for athlete invitation ownership.', 400)
  }

  return {
    id: coachRow.id,
    userId: coachRow.user_id ?? null,
    firstName: coachRow.first_name ?? '',
    lastName: coachRow.last_name ?? '',
  }
}

function createTemporaryPasswordDefault() {
  const randomPart = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `PplusTemp-${randomPart}!Aa1`
}

function slugifyPlaceholderPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createPlaceholderEmailDefault({ firstName = '', lastName = '', now = new Date() } = {}) {
  const base = [slugifyPlaceholderPart(firstName), slugifyPlaceholderPart(lastName)].filter(Boolean).join('-') || 'athlete'
  const stamp = now instanceof Date && !Number.isNaN(now.getTime()) ? now.toISOString().replace(/[^0-9]/g, '').slice(0, 14) : `${Date.now()}`
  return `placeholder+${base}-${stamp}@pplushockey.local`
}

function isPlaceholderEmail(email) {
  return String(email || '').trim().toLowerCase().endsWith('@pplushockey.local')
}

function parseDataUrlToUploadPayload(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/)
  if (!match) {
    throw createRepositoryError('Athlete avatar upload payload is invalid.', 400)
  }

  return {
    contentType: match[1],
    fileBuffer: Uint8Array.from(Buffer.from(match[2], 'base64')),
  }
}

function isDuplicateAuthUserCreateError(error) {
  const message = String(error?.message || '')
  return message.includes('422') || message.includes('400') || message.includes('already registered')
}

async function lookupAuthUserByEmail(client, email) {
  const payload = await client.authAdminRequest(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  })

  const users = Array.isArray(payload?.users) ? payload.users : []
  return users.find((user) => String(user?.email || '').trim().toLowerCase() === String(email || '').trim().toLowerCase()) ?? null
}

async function fetchProvisionedAthleteProfile(client, authUserId) {
  const athleteRows = await client.requestTable(
    'athlete_profiles',
    `?select=id,user_id,coach_id,first_name,last_name,date_of_birth,gender,position,height_cm,weight_kg,avatar_url,status,created_at&user_id=eq.${encodeURIComponent(authUserId)}&limit=1`,
  )
  const athleteRow = Array.isArray(athleteRows) ? athleteRows[0] : athleteRows
  if (!athleteRow?.id) {
    throw createRepositoryError('Athlete profile provisioning did not complete after auth user creation.', 500)
  }
  return athleteRow
}

async function fetchAthleteProfileById(client, athleteId) {
  const athleteRows = await client.requestTable(
    'athlete_profiles',
    `?select=id,user_id,coach_id,first_name,last_name,date_of_birth,gender,position,height_cm,weight_kg,avatar_url,status,created_at&id=eq.${encodeURIComponent(athleteId)}&limit=1`,
  )
  const athleteRow = Array.isArray(athleteRows) ? athleteRows[0] : athleteRows
  if (!athleteRow?.id) {
    throw createRepositoryError('Athlete profile not found.', 404)
  }
  return athleteRow
}

async function fetchAuthUserById(client, authUserId) {
  const authUser = await client.authAdminRequest(`/auth/v1/admin/users/${encodeURIComponent(authUserId)}`, {
    method: 'GET',
  })

  if (!authUser?.id) {
    throw createRepositoryError('Athlete auth account could not be found for invitation delivery.', 404)
  }

  return authUser
}

function createInvitationHelpers({ client, now, invitationServiceFactory, loopsClientFactory }) {
  async function sendAthleteInviteForRow({ athleteRow, coachContext, inviteeEmail }) {
    const normalizedInviteEmail = normalizeAthleteInvitationEmail(inviteeEmail)
    if (!normalizedInviteEmail) {
      throw createRepositoryError('Invite email is required when sending an athlete invitation.', 400)
    }

    if (!client.config.loopsApiKey) {
      throw createRepositoryError('Athlete invitation email sending is unavailable until Loops env is configured.', 503)
    }

    const timestamp = now().toISOString()
    const invitationRepository = {
      createAthleteInvitation: async ({ coachId, inviteeEmail: serviceInviteeEmail, inviteCode, expiresAt, createdByUserId = null }) => {
        const normalizedServiceInviteEmail = normalizeAthleteInvitationEmail(serviceInviteeEmail)
        const codeHash = await hashAthleteInvitationCode(inviteCode)

        await client.patchTable(
          'athlete_invitations',
          `?invitee_email=eq.${encodeURIComponent(normalizedServiceInviteEmail)}&used_at=is.null&revoked_at=is.null`,
          {
            revoked_at: timestamp,
            updated_at: timestamp,
          },
        )

        const invitationRows = await client.insertTable('athlete_invitations', {
          coach_id: coachId,
          athlete_profile_id: athleteRow.id,
          invitee_email: normalizedServiceInviteEmail,
          code_hash: codeHash,
          expires_at: expiresAt,
          sent_at: timestamp,
          created_by_user_id: createdByUserId,
        })
        return Array.isArray(invitationRows) ? invitationRows[0] : invitationRows
      },
    }

    const loopsClient = loopsClientFactory({
      apiKey: client.config.loopsApiKey,
      fetchImpl: client.config.fetchImpl,
    })
    const invitationService = invitationServiceFactory({
      invitationRepository,
      loopsClient,
      loopsTransactionalId: client.config.loopsTransactionalId,
    })
    const expiresAt = new Date(now().getTime() + SEVEN_DAYS_IN_MS).toISOString()
    const invitationResult = await invitationService.sendAthleteInvitation({
      coachId: coachContext.id,
      athleteProfileId: athleteRow.id,
      inviteeEmail: normalizedInviteEmail,
      coachFirstName: coachContext.firstName,
      coachLastName: coachContext.lastName,
      appStoreUrl: client.config.appStoreUrl,
      expiresAt,
      createdByUserId: coachContext.userId,
    })

    return {
      inviteeEmail: normalizedInviteEmail,
      invitation: invitationResult?.invitation ?? null,
    }
  }

  return {
    sendAthleteInviteForRow,
  }
}

export function createAdminAthleteRepository(overrides = {}) {
  const client = createRepositoryClient(overrides)
  const now = typeof overrides.now === 'function' ? overrides.now : () => new Date()
  const invitationServiceFactory = overrides.invitationServiceFactory ?? createAthleteInvitationService
  const loopsClientFactory = overrides.loopsClientFactory ?? createLoopsTransactionalEmailClient
  const createTemporaryPassword = overrides.createTemporaryPassword ?? createTemporaryPasswordDefault
  const createPlaceholderEmail = overrides.createPlaceholderEmail ?? createPlaceholderEmailDefault
  const identityRepository = createSupabaseRestIdentityRepository({
    url: client.config.baseUrl,
    anonKey: client.config.serviceRoleKey,
    accessToken: client.config.serviceRoleKey,
    fetchImpl: client.config.fetchImpl,
  })
  const { sendAthleteInviteForRow } = createInvitationHelpers({ client, now, invitationServiceFactory, loopsClientFactory })

  async function uploadAthleteAvatar({ athleteId, avatarUpload }) {
    if (!avatarUpload?.dataUrl) return null
    const { fileBuffer, contentType } = parseDataUrlToUploadPayload(avatarUpload.dataUrl)
    const uploadedAvatar = await identityRepository.uploadAthleteAvatar({
      athleteId,
      fileBuffer,
      contentType: avatarUpload.contentType || contentType || 'image/jpeg',
      fileName: avatarUpload.fileName || 'profile.jpg',
    })
    return uploadedAvatar?.publicUrl || null
  }

  return {
    async listAthletes() {
      const [athleteRows, programRows, assignedWorkoutRows, workoutSessionRows, inviteRows] = await Promise.all([
        client.requestTable('athlete_profiles', '?select=id,first_name,last_name,date_of_birth,gender,position,height_cm,weight_kg,avatar_url,status,created_at&order=created_at.asc'),
        client.requestTable('programs', '?select=id,athlete_id,name,status,created_at'),
        client.requestTable('program_workouts', '?select=id,athlete_id,status'),
        client.requestTable('workout_sessions', '?select=id,athlete_id,status,completed_at,updated_at'),
        client.requestTable('athlete_invitations', '?select=id,athlete_profile_id,used_at,revoked_at,expires_at,sent_at,created_at'),
      ])

      const latestProgramByAthleteId = createLatestProgramMap(programRows)
      const assignedWorkoutCountByAthleteId = createCountMap(assignedWorkoutRows, 'athlete_id')
      const completedWorkoutCountByAthleteId = (Array.isArray(workoutSessionRows) ? workoutSessionRows : []).reduce((accumulator, row) => {
        if (row?.status !== 'completed' || !row?.athlete_id) return accumulator
        accumulator.set(row.athlete_id, (accumulator.get(row.athlete_id) ?? 0) + 1)
        return accumulator
      }, new Map())
      const latestActivityByAthleteId = createLatestActivityMap(workoutSessionRows)
      const inviteStatusByAthleteId = createInviteStatusMap(inviteRows)

      const context = {
        latestProgramByAthleteId,
        assignedWorkoutCountByAthleteId,
        completedWorkoutCountByAthleteId,
        latestActivityByAthleteId,
        inviteStatusByAthleteId,
      }

      return Array.isArray(athleteRows) ? athleteRows.map((row, index) => mapAthleteRow(row, index, context)) : []
    },

    async createAthlete({ athleteId, firstName, lastName, dateOfBirth, gender, position, heightCm, weightKg, avatarUrl, avatarUpload = null, sendInvite, inviteeEmail }) {
      void athleteId
      const trimmedFirstName = String(firstName || '').trim()
      const trimmedLastName = String(lastName || '').trim()
      const normalizedInviteEmail = normalizeAthleteInvitationEmail(inviteeEmail)
      const effectiveInviteEmail = normalizedInviteEmail || (sendInvite ? '' : createPlaceholderEmail({ firstName: trimmedFirstName, lastName: trimmedLastName, now: now() }))

      if (!trimmedFirstName || !trimmedLastName) {
        throw createRepositoryError('First name and last name are required.', 400)
      }

      if (sendInvite && !effectiveInviteEmail) {
        throw createRepositoryError('Invite email is required when sending an athlete invitation.', 400)
      }

      const coachContext = await resolveCoachContext(client)
      const timestamp = now().toISOString()
      const temporaryPassword = String(createTemporaryPassword()).trim()
      let authUser = null

      try {
        authUser = await client.authAdminRequest('/auth/v1/admin/users', {
          method: 'POST',
          body: {
            email: effectiveInviteEmail,
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: {
              role: 'athlete',
              first_name: trimmedFirstName,
              last_name: trimmedLastName,
            },
          },
        })
      } catch (error) {
        if (!isDuplicateAuthUserCreateError(error)) {
          throw error
        }

        authUser = await lookupAuthUserByEmail(client, effectiveInviteEmail)
        if (!authUser?.id) {
          throw createRepositoryError(`Could not find the existing auth user for ${effectiveInviteEmail}.`, 500)
        }
      }

      if (!authUser?.id) {
        throw createRepositoryError('Athlete auth account creation did not return a user id.', 500)
      }

      const provisionedAthleteProfile = await fetchProvisionedAthleteProfile(client, authUser.id)
      if (String(provisionedAthleteProfile.status || '').trim().toLowerCase() === 'active') {
        throw createRepositoryError(`An athlete account already exists for ${effectiveInviteEmail}.`, 409)
      }

      const patchedRows = await client.patchTable('athlete_profiles', `?id=eq.${encodeURIComponent(provisionedAthleteProfile.id)}`, {
        coach_id: coachContext.id,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        date_of_birth: sanitizeTextField(dateOfBirth),
        gender: sanitizeTextField(gender),
        position: sanitizeTextField(position),
        height_cm: sanitizeNullableNumber(heightCm),
        weight_kg: sanitizeNullableNumber(weightKg),
        avatar_url: sanitizeTextField(avatarUrl),
        status: 'inactive',
        updated_at: timestamp,
      })
      let patchedAthleteRow = Array.isArray(patchedRows) ? patchedRows[0] : patchedRows
      if (!patchedAthleteRow?.id) {
        throw createRepositoryError('Failed to finish the athlete profile after auth creation.', 500)
      }

      if (avatarUpload?.dataUrl) {
        const uploadedAvatarUrl = await uploadAthleteAvatar({ athleteId: patchedAthleteRow.id, avatarUpload })
        if (uploadedAvatarUrl) {
          const avatarPatchedRows = await client.patchTable('athlete_profiles', `?id=eq.${encodeURIComponent(patchedAthleteRow.id)}`, {
            avatar_url: uploadedAvatarUrl,
            updated_at: now().toISOString(),
          })
          patchedAthleteRow = Array.isArray(avatarPatchedRows) ? avatarPatchedRows[0] : avatarPatchedRows
        }
      }

      let invitation = null
      if (sendInvite) {
        const inviteResult = await sendAthleteInviteForRow({
          athleteRow: patchedAthleteRow,
          coachContext,
          inviteeEmail: effectiveInviteEmail,
        })
        invitation = inviteResult.invitation
      }

      return mapPatchedAthleteRow(patchedAthleteRow, {
        inviteeEmail: effectiveInviteEmail,
        invitation,
      })
    },

    async updateAthlete({ athleteId, firstName, lastName, dateOfBirth, gender, position, heightCm, weightKg, avatarUrl, avatarUpload = null }) {
      if (!athleteId) throw createRepositoryError('Athlete ID is required.', 400)

      let nextAvatarUrl = sanitizeTextField(avatarUrl)
      if (avatarUpload?.dataUrl) {
        nextAvatarUrl = await uploadAthleteAvatar({ athleteId, avatarUpload })
      }

      await client.patchTable('athlete_profiles', `?id=eq.${encodeURIComponent(athleteId)}`, {
        first_name: sanitizeTextField(firstName),
        last_name: sanitizeTextField(lastName),
        date_of_birth: sanitizeTextField(dateOfBirth),
        gender: sanitizeTextField(gender),
        position: sanitizeTextField(position),
        height_cm: sanitizeNullableNumber(heightCm),
        weight_kg: sanitizeNullableNumber(weightKg),
        avatar_url: nextAvatarUrl,
        updated_at: now().toISOString(),
      })

      const athletes = await this.listAthletes()
      return athletes.find((athlete) => athlete.id === athleteId) ?? null
    },

    async deleteAthlete({ athleteId }) {
      if (!athleteId) throw createRepositoryError('Athlete ID is required.', 400)

      const rows = await client.deleteTable('athlete_profiles', `?id=eq.${encodeURIComponent(athleteId)}`)
      const deletedAthlete = Array.isArray(rows) ? rows[0] : rows
      return { athleteId, deletedAthlete: deletedAthlete ?? null }
    },

    async deleteAthletes({ athleteIds = [] }) {
      const normalizedAthleteIds = normalizeAthleteIds(athleteIds)
      if (normalizedAthleteIds.length === 0) throw createRepositoryError('At least one athlete ID is required.', 400)

      await Promise.all(normalizedAthleteIds.map((athleteId) => this.deleteAthlete({ athleteId })))
      return { athleteIds: normalizedAthleteIds, deletedCount: normalizedAthleteIds.length }
    },

    async sendAthleteInvite({ athleteId, inviteeEmail = '' }) {
      if (!athleteId) throw createRepositoryError('Athlete ID is required.', 400)

      const coachContext = await resolveCoachContext(client)
      const athleteRow = await fetchAthleteProfileById(client, athleteId)
      if (!athleteRow?.user_id) {
        throw createRepositoryError('Athlete auth account is missing, so the invite cannot be sent yet.', 400)
      }
      if (String(athleteRow.status || '').trim().toLowerCase() === 'active') {
        throw createRepositoryError('Active athletes do not need a new invitation.', 409)
      }

      const authUser = await fetchAuthUserById(client, athleteRow.user_id)
      const normalizedProvidedInviteEmail = normalizeAthleteInvitationEmail(inviteeEmail)
      let effectiveInviteEmail = normalizeAthleteInvitationEmail(authUser?.email)

      if (normalizedProvidedInviteEmail) {
        effectiveInviteEmail = normalizedProvidedInviteEmail
        if (normalizedProvidedInviteEmail !== normalizeAthleteInvitationEmail(authUser?.email)) {
          await client.authAdminRequest(`/auth/v1/admin/users/${encodeURIComponent(athleteRow.user_id)}`, {
            method: 'PUT',
            body: {
              email: normalizedProvidedInviteEmail,
              email_confirm: true,
              user_metadata: {
                role: 'athlete',
                first_name: athleteRow.first_name ?? '',
                last_name: athleteRow.last_name ?? '',
              },
            },
          })
        }
      }

      if (!effectiveInviteEmail || isPlaceholderEmail(effectiveInviteEmail)) {
        throw createRepositoryError('Invite email is required when sending an athlete invitation.', 400)
      }

      const inviteResult = await sendAthleteInviteForRow({
        athleteRow,
        coachContext,
        inviteeEmail: effectiveInviteEmail,
      })

      return mapPatchedAthleteRow(athleteRow, {
        inviteeEmail: inviteResult.inviteeEmail,
        invitation: inviteResult.invitation,
      })
    },
  }
}
