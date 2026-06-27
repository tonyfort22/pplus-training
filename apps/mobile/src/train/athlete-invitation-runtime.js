import * as data from '../../../../packages/data/src/index.js'

export const MOBILE_INVITATION_COMPLETION_SAFE_FIXTURE_ID = 'invited_athlete_completion_safe'

export const MOBILE_INVITATION_COMPLETION_SAFE_FIXTURE_RESULT = Object.freeze({
  accessToken: 'safe-invited-athlete-access-token',
  refreshToken: 'safe-invited-athlete-refresh-token',
  currentUserId: 'auth-safe-invited-athlete',
  currentAthleteId: 'ath-safe-invited-athlete',
  assignedProgramId: 'program-safe-invited-athlete',
})

function createSafeInvitationCompletionFixtureClient() {
  return Object.freeze({
    async completeAthleteInvitation() {
      return { ...MOBILE_INVITATION_COMPLETION_SAFE_FIXTURE_RESULT }
    },
  })
}

export function createMobileInvitationClient({
  supabaseUrl = process.env?.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey = process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  accessToken = null,
  fetchImpl = globalThis.fetch,
  invitationCompletionRequestTimeoutMs = 60000,
  invitationCompletionFixture = process.env?.EXPO_PUBLIC_PPLUS_INVITATION_COMPLETION_FIXTURE || null,
} = {}) {
  if (invitationCompletionFixture === MOBILE_INVITATION_COMPLETION_SAFE_FIXTURE_ID) {
    return createSafeInvitationCompletionFixtureClient()
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const invitationClient = data.invitations.createSupabaseEdgeInvitationClient({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    accessToken,
    fetchImpl,
  })
  const invitationCompletionClient = data.invitations.createSupabaseEdgeInvitationCompletionClient({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    accessToken,
    fetchImpl,
    requestTimeoutMs: invitationCompletionRequestTimeoutMs,
  })

  return {
    ...invitationClient,
    ...invitationCompletionClient,
  }
}

export async function sendCoachAthleteInvitation({
  invitationClient,
  inviteeEmail,
  coachProfile = null,
  appStoreUrl = '',
} = {}) {
  if (!invitationClient || typeof invitationClient.sendAthleteInvitation !== 'function') {
    throw new Error('Athlete invitation sending is not available right now.')
  }

  const normalizedEmail = data.invitations.normalizeAthleteInvitationEmail(inviteeEmail)
  if (!normalizedEmail) {
    throw new Error('Enter a valid athlete email before sending the invitation.')
  }

  return invitationClient.sendAthleteInvitation({
    inviteeEmail: normalizedEmail,
    coachFirstName: coachProfile?.firstName || '',
    coachLastName: coachProfile?.lastName || '',
    appStoreUrl,
  })
}
