import {
  createSupabaseServiceIdentityRepository,
  createSupabaseServiceInvitationRepository,
  createSupabaseServiceProgramRepository,
} from './runtime.js'

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function getEnvValue(env, key) {
  const value = env?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function roundToSingleDecimal(value) {
  return Math.round(value * 10) / 10
}

function parseWeightKg({ weight, weightUnit }) {
  const numericWeight = Number(weight)
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    throw new Error('Enter a valid athlete weight before continuing.')
  }

  if (String(weightUnit || 'lb').toLowerCase() === 'kg') {
    return roundToSingleDecimal(numericWeight)
  }

  return roundToSingleDecimal(numericWeight * 0.45359237)
}

function parseHeightCm({ heightUnit, heightFeet, heightInches, heightCm }) {
  if (String(heightUnit || 'ft').toLowerCase() === 'cm') {
    const numericHeightCm = Number(heightCm)
    if (!Number.isFinite(numericHeightCm) || numericHeightCm <= 0) {
      throw new Error('Enter a valid athlete height before continuing.')
    }
    return Math.round(numericHeightCm)
  }

  const feet = Number(heightFeet)
  const inches = Number(heightInches)
  if (!Number.isFinite(feet) || feet <= 0 || !Number.isFinite(inches) || inches < 0) {
    throw new Error('Enter a valid athlete height before continuing.')
  }

  return Math.round(((feet * 12) + inches) * 2.54)
}

function validateCompletionBody(body) {
  const inviteCode = String(body?.inviteCode || '').trim().toUpperCase()
  const firstName = String(body?.firstName || '').trim()
  const lastName = String(body?.lastName || '').trim()
  const password = String(body?.password || '')
  const confirmPassword = String(body?.confirmPassword || '')
  const dateOfBirth = String(body?.dateOfBirth || '').trim()
  const gender = String(body?.gender || '').trim()
  const position = String(body?.position || '').trim()
  const weight = String(body?.weight || '').trim()
  const weightUnit = String(body?.weightUnit || 'lb').trim().toLowerCase() || 'lb'
  const heightUnit = String(body?.heightUnit || 'ft').trim().toLowerCase() || 'ft'
  const heightFeet = String(body?.heightFeet || '').trim()
  const heightInches = String(body?.heightInches || '').trim()
  const heightCm = String(body?.heightCm || '').trim()

  if (inviteCode.length !== 6) {
    throw new Error('Invitation code must be 6 characters.')
  }
  if (!firstName || !lastName) {
    throw new Error('First name and last name are required before continuing.')
  }
  if (!password || !confirmPassword) {
    throw new Error('Password and confirm password are both required before continuing.')
  }
  if (password !== confirmPassword) {
    throw new Error('Passwords need to match before continuing.')
  }
  if (!dateOfBirth) {
    throw new Error('Select the athlete date of birth before continuing.')
  }
  if (!gender) {
    throw new Error('Select the athlete gender before continuing.')
  }
  if (!position) {
    throw new Error('Select the athlete position before continuing.')
  }

  return {
    inviteCode,
    firstName,
    lastName,
    password,
    dateOfBirth,
    gender,
    position,
    weight,
    weightUnit,
    heightUnit,
    heightFeet,
    heightInches,
    heightCm,
  }
}

export function createCompleteAthleteInvitationHandler({
  env = {},
  now = () => new Date(),
  invitationRepositoryFactory = (config) => createSupabaseServiceInvitationRepository(config),
  identityRepositoryFactory = (config) => createSupabaseServiceIdentityRepository(config),
  programRepositoryFactory = (config) => createSupabaseServiceProgramRepository(config),
} = {}) {
  return async function handleCompleteAthleteInvitation(request) {
    if ((request.method || 'GET').toUpperCase() !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed.' })
    }

    const supabaseUrl = getEnvValue(env, 'SUPABASE_URL')
    const supabaseAnonKey = getEnvValue(env, 'SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = getEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(500, { error: 'Athlete invitation completion backend is not configured yet.' })
    }

    let body = null
    try {
      body = await request.json()
    } catch {
      return jsonResponse(400, { error: 'Request body must be valid JSON.' })
    }

    let input = null
    try {
      input = validateCompletionBody(body)
    } catch (error) {
      return jsonResponse(400, { error: error?.message || 'Invitation completion payload is invalid.' })
    }

    const repositoryConfig = {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
    }
    const invitationRepository = invitationRepositoryFactory(repositoryConfig)
    const identityRepository = identityRepositoryFactory(repositoryConfig)
    const programRepository = programRepositoryFactory(repositoryConfig)

    try {
      const invitation = await invitationRepository.getActiveInvitationByCode(input.inviteCode)
      if (!invitation?.id) {
        return jsonResponse(404, { error: 'Invitation code is invalid or no longer available.' })
      }

      const invitationExpiryTime = invitation.expiresAt ? new Date(invitation.expiresAt).getTime() : Number.NaN
      if (!Number.isFinite(invitationExpiryTime) || invitationExpiryTime < now().getTime()) {
        return jsonResponse(410, { error: 'Invitation code is invalid or no longer available.' })
      }

      const weightKg = parseWeightKg({ weight: input.weight, weightUnit: input.weightUnit })
      const heightCm = parseHeightCm({
        heightUnit: input.heightUnit,
        heightFeet: input.heightFeet,
        heightInches: input.heightInches,
        heightCm: input.heightCm,
      })

      const signupResult = await (async () => {
        try {
          return await identityRepository.signUpAthleteWithInvitation({
            email: invitation.inviteeEmail,
            password: input.password,
            firstName: input.firstName,
            lastName: input.lastName,
          })
        } catch (error) {
          throw new Error(`Invitation completion failed during athlete_account_create: ${error?.message || 'Unknown signup error'}`)
        }
      })()

      const updatedAthleteProfile = await (async () => {
        try {
          return await identityRepository.updateAthleteProfileFromInvitation({
            athleteId: signupResult.athleteProfile.id,
            coachId: invitation.coachId,
            firstName: input.firstName,
            lastName: input.lastName,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
            position: input.position,
            heightCm,
            weightKg,
          })
        } catch (error) {
          throw new Error(`Invitation completion failed during athlete_profile_update: ${error?.message || 'Unknown athlete profile update error'}`)
        }
      })()

      const assignedProgram = await (async () => {
        try {
          return await programRepository.assignFirstProgramToAthlete({
            athleteId: updatedAthleteProfile.id,
            coachId: invitation.coachId,
          })
        } catch (error) {
          throw new Error(`Invitation completion failed during athlete_program_assign: ${error?.message || 'Unknown program assignment error'}`)
        }
      })()

      await (async () => {
        try {
          return await invitationRepository.markAthleteInvitationAccepted({
            invitationId: invitation.id,
            athleteProfileId: updatedAthleteProfile.id,
            usedAt: now().toISOString(),
          })
        } catch (error) {
          throw new Error(`Invitation completion failed during invitation_mark_used: ${error?.message || 'Unknown invitation redemption error'}`)
        }
      })()

      return jsonResponse(200, {
        success: true,
        invitationId: invitation.id,
        athleteProfileId: updatedAthleteProfile.id,
        coachId: invitation.coachId,
        accessToken: signupResult.session?.accessToken ?? null,
        refreshToken: signupResult.session?.refreshToken ?? null,
        currentUserId: signupResult.user?.id ?? null,
        currentAthleteId: updatedAthleteProfile.id,
        assignedProgramId: assignedProgram?.id ?? null,
      })
    } catch (error) {
      return jsonResponse(500, {
        error: error?.message || 'Something went sideways while completing the invited athlete signup.',
      })
    }
  }
}
