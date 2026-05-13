import * as data from '../../../../packages/data/src/index.js'

export function createMobileInvitationClient({
  supabaseUrl = process.env?.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey = process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  accessToken = null,
  fetchImpl = globalThis.fetch,
  invitationCompletionRequestTimeoutMs = 60000,
} = {}) {
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
