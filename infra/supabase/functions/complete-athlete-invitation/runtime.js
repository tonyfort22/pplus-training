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

function mapAthleteProfileRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id ?? null,
    coachId: row.coach_id ?? null,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    dateOfBirth: row.date_of_birth ?? null,
    gender: row.gender ?? null,
    position: row.position ?? null,
    heightCm: row.height_cm ?? null,
    weightKg: row.weight_kg ?? null,
    avatarUrl: row.avatar_url ?? null,
    status: row.status ?? null,
  }
}

function mapProgramRow(row) {
  if (!row) return null
  return {
    id: row.id,
    athleteId: row.athlete_id ?? null,
    coachId: row.coach_id ?? null,
    name: row.name ?? '',
    description: row.description ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    status: row.status ?? null,
  }
}

function getWebCrypto() {
  const cryptoImpl = globalThis.crypto
  if (!cryptoImpl?.subtle) {
    throw new Error('Web Crypto support is required for athlete invitation completion')
  }
  return cryptoImpl
}

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
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

function createSupabaseRequest(config = {}) {
  const baseUrl = config.url
  const anonKey = config.anonKey
  const bearerToken = config.bearerToken || null
  const apiKey = config.apiKey || anonKey
  const schema = config.schema || 'public'
  const fetchImpl = requireFetch(config.fetchImpl ?? globalThis.fetch, 'Supabase service client requires fetch support')
  const omitAuthorization = config.omitAuthorization === true

  if (!baseUrl) throw new Error('Supabase service client requires a url')
  if (!apiKey) throw new Error('Supabase service client requires an anonKey')
  if (!omitAuthorization && !bearerToken) throw new Error('Supabase service client requires a bearer token')

  return async function request({ method = 'GET', table = null, path = null, query = {}, body = undefined, prefer = 'return=representation' } = {}) {
    const url = path ? new URL(path, baseUrl) : new URL(`/rest/v1/${table}`, baseUrl)
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue
      url.searchParams.set(key, value)
    }

    const headers = {
      apikey: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: prefer,
      'Accept-Profile': schema,
      'Content-Profile': schema,
    }

    if (!omitAuthorization && bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`
    }

    const response = await fetchImpl(url.toString(), {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null
    if (!response.ok) {
      const message = payload?.message || payload?.msg || payload?.error_description || payload?.error || (typeof payload === 'string' && payload) || response.statusText || 'Unknown Supabase service error'
      throw new Error(`Supabase service request failed (${response.status}): ${message}`)
    }

    return payload
  }
}

export function createSupabaseServiceInvitationRepository(config = {}) {
  const request = createSupabaseRequest({
    url: config.url,
    anonKey: config.anonKey,
    apiKey: config.serviceRoleKey,
    omitAuthorization: true,
    fetchImpl: config.fetchImpl,
  })

  return {
    async getActiveInvitationByCode(inviteCode) {
      const codeHash = await hashAthleteInvitationCode(inviteCode)
      const rows = await request({
        table: 'athlete_invitations',
        query: {
          select: 'id,coach_id,invitee_email,code_hash,expires_at,used_at,revoked_at,sent_at,athlete_profile_id,created_by_user_id,created_at,updated_at',
          code_hash: `eq.${codeHash}`,
          used_at: 'is.null',
          revoked_at: 'is.null',
          order: 'created_at.desc',
          limit: '1',
        },
      })
      return mapAthleteInvitationRow(Array.isArray(rows) ? rows[0] : rows)
    },
    async markAthleteInvitationAccepted({ invitationId, athleteProfileId, usedAt }) {
      const rows = await request({
        method: 'PATCH',
        table: 'athlete_invitations',
        query: {
          id: `eq.${invitationId}`,
          select: 'id,coach_id,invitee_email,code_hash,expires_at,used_at,revoked_at,sent_at,athlete_profile_id,created_by_user_id,created_at,updated_at',
        },
        body: {
          athlete_profile_id: athleteProfileId,
          used_at: usedAt,
        },
      })
      return mapAthleteInvitationRow(Array.isArray(rows) ? rows[0] : rows)
    },
  }
}

export function createSupabaseServiceIdentityRepository(config = {}) {
  const serviceRequest = createSupabaseRequest({
    url: config.url,
    anonKey: config.anonKey,
    apiKey: config.serviceRoleKey,
    omitAuthorization: true,
    fetchImpl: config.fetchImpl,
  })
  const anonRequest = createSupabaseRequest({
    url: config.url,
    anonKey: config.anonKey,
    omitAuthorization: true,
    fetchImpl: config.fetchImpl,
  })

  async function signInExistingAthleteAccount({ email, password }) {
    let sessionPayload = null
    try {
      sessionPayload = await anonRequest({
        method: 'POST',
        path: '/auth/v1/token?grant_type=password',
        body: {
          email,
          password,
        },
      })
    } catch (error) {
      const signInMessage = String(error?.message || '')
      if (!signInMessage.includes('Invalid login credentials')) {
        throw new Error(`Invitation completion failed during existing_account_sign_in: ${error?.message || 'Unknown existing-account sign-in error'}`)
      }

      let existingUser = null
      try {
        const userLookupPayload = await serviceRequest({
          method: 'GET',
          path: `/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        })
        existingUser = Array.isArray(userLookupPayload?.users)
          ? userLookupPayload.users.find((user) => String(user?.email || '').toLowerCase() === String(email || '').toLowerCase())
          : null
      } catch (lookupError) {
        throw new Error(`Invitation completion failed during existing_account_user_lookup: ${lookupError?.message || 'Unknown existing-account user lookup error'}`)
      }

      if (!existingUser?.id) {
        throw new Error(`Invitation completion failed during existing_account_user_lookup: Could not find an existing auth user for ${email}`)
      }

      try {
        await serviceRequest({
          method: 'PUT',
          path: `/auth/v1/admin/users/${existingUser.id}`,
          body: {
            password,
            email_confirm: true,
            user_metadata: {
              role: 'athlete',
            },
          },
        })
      } catch (resetError) {
        throw new Error(`Invitation completion failed during existing_account_password_reset: ${resetError?.message || 'Unknown existing-account password reset error'}`)
      }

      try {
        sessionPayload = await anonRequest({
          method: 'POST',
          path: '/auth/v1/token?grant_type=password',
          body: {
            email,
            password,
          },
        })
      } catch (retryError) {
        throw new Error(`Invitation completion failed during existing_account_sign_in_retry: ${retryError?.message || 'Unknown existing-account sign-in retry error'}`)
      }
    }

    const authUserRequest = createSupabaseRequest({
      url: config.url,
      anonKey: config.anonKey,
      bearerToken: sessionPayload?.access_token ?? null,
      fetchImpl: config.fetchImpl,
    })

    let currentUser = null
    try {
      currentUser = await authUserRequest({ method: 'GET', path: '/auth/v1/user' })
    } catch (error) {
      throw new Error(`Invitation completion failed during existing_account_identity_lookup: ${error?.message || 'Unknown existing-account identity lookup error'}`)
    }

    let athleteRows = null
    try {
      athleteRows = await serviceRequest({
        table: 'athlete_profiles',
        query: {
          user_id: `eq.${currentUser.id}`,
          select: 'id,user_id,coach_id,first_name,last_name,date_of_birth,gender,position,height_cm,weight_kg,avatar_url,status',
          limit: '1',
        },
      })
    } catch (error) {
      throw new Error(`Invitation completion failed during existing_account_profile_fetch: ${error?.message || 'Unknown existing-account profile fetch error'}`)
    }

    const athleteProfile = mapAthleteProfileRow(Array.isArray(athleteRows) ? athleteRows[0] : athleteRows)
    if (!athleteProfile?.id) {
      throw new Error('Athlete profile provisioning did not complete for the invited signup.')
    }

    return {
      user: {
        id: currentUser.id,
        email: currentUser.email ?? email,
      },
      athleteProfile,
      session: {
        accessToken: sessionPayload?.access_token ?? null,
        refreshToken: sessionPayload?.refresh_token ?? null,
      },
    }
  }

  return {
    async signUpAthleteWithInvitation({ email, password, firstName, lastName }) {
      let createdUser = null
      try {
        createdUser = await serviceRequest({
          method: 'POST',
          path: '/auth/v1/admin/users',
          body: {
            email,
            password,
            email_confirm: true,
            user_metadata: {
              role: 'athlete',
              first_name: firstName,
              last_name: lastName,
            },
          },
        })
      } catch (error) {
        const message = String(error?.message || '')
        if (!message.includes('(422)') && !message.includes('(400)')) {
          throw error
        }
        return signInExistingAthleteAccount({ email, password })
      }

      const athleteRows = await serviceRequest({
        table: 'athlete_profiles',
        query: {
          user_id: `eq.${createdUser.id}`,
          select: 'id,user_id,coach_id,first_name,last_name,date_of_birth,gender,position,height_cm,weight_kg,avatar_url,status',
          limit: '1',
        },
      })
      const athleteProfile = mapAthleteProfileRow(Array.isArray(athleteRows) ? athleteRows[0] : athleteRows)
      if (!athleteProfile?.id) {
        throw new Error('Athlete profile provisioning did not complete for the invited signup.')
      }

      const sessionPayload = await anonRequest({
        method: 'POST',
        path: '/auth/v1/token?grant_type=password',
        body: {
          email,
          password,
        },
      })

      return {
        user: {
          id: createdUser.id,
          email: createdUser.email ?? email,
        },
        athleteProfile,
        session: {
          accessToken: sessionPayload?.access_token ?? null,
          refreshToken: sessionPayload?.refresh_token ?? null,
        },
      }
    },
    async updateAthleteProfileFromInvitation({ athleteId, coachId, firstName, lastName, dateOfBirth, gender, position, heightCm, weightKg }) {
      const rows = await serviceRequest({
        method: 'PATCH',
        table: 'athlete_profiles',
        query: {
          id: `eq.${athleteId}`,
          select: 'id,user_id,coach_id,first_name,last_name,date_of_birth,gender,position,height_cm,weight_kg,avatar_url,status',
        },
        body: {
          coach_id: coachId,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          gender,
          position,
          height_cm: heightCm,
          weight_kg: weightKg,
          status: 'active',
        },
      })
      return mapAthleteProfileRow(Array.isArray(rows) ? rows[0] : rows)
    },
  }
}

function isMissingProgramWorkoutNotesColumnError(error) {
  const message = String(error?.message || '')
  return message.includes("Could not find the 'notes' column of 'program_workouts' in the schema cache")
    || message.includes('program_workouts.notes does not exist')
    || message.includes('column program_workouts.notes does not exist')
}

export function createSupabaseServiceProgramRepository(config = {}) {
  const request = createSupabaseRequest({
    url: config.url,
    anonKey: config.anonKey,
    apiKey: config.serviceRoleKey,
    omitAuthorization: true,
    fetchImpl: config.fetchImpl,
  })

  return {
    async assignFirstProgramToAthlete({ athleteId, coachId }) {
      const existingProgramRows = athleteId ? await request({
        table: 'programs',
        query: {
          select: 'id,athlete_id,coach_id,name,description,start_date,end_date,status',
          athlete_id: `eq.${athleteId}`,
          order: 'start_date.asc',
          limit: '1',
        },
      }) : []
      const existingAssignedProgram = mapProgramRow(Array.isArray(existingProgramRows) ? existingProgramRows[0] : existingProgramRows)
      if (existingAssignedProgram?.id) {
        return {
          ...existingAssignedProgram,
          weeksCount: 0,
          workoutsCount: 0,
        }
      }

      const sourceProgramRows = await request({
        table: 'programs',
        query: {
          select: 'id,athlete_id,coach_id,name,description,start_date,end_date,status',
          ...(coachId ? { coach_id: `eq.${coachId}` } : {}),
          order: 'start_date.asc',
          limit: '1',
        },
      })
      let sourceProgram = mapProgramRow(Array.isArray(sourceProgramRows) ? sourceProgramRows[0] : sourceProgramRows)
      if (!sourceProgram?.id && coachId) {
        const fallbackProgramRows = await request({
          table: 'programs',
          query: {
            select: 'id,athlete_id,coach_id,name,description,start_date,end_date,status',
            order: 'start_date.asc',
            limit: '1',
          },
        })
        sourceProgram = mapProgramRow(Array.isArray(fallbackProgramRows) ? fallbackProgramRows[0] : fallbackProgramRows)
      }
      if (!sourceProgram?.id) {
        throw new Error('No source program is available to assign this invited athlete.')
      }

      const weekRows = await request({
        table: 'program_weeks',
        query: {
          select: 'id,program_id,week_index,name,start_date,end_date',
          program_id: `eq.${sourceProgram.id}`,
          order: 'week_index.asc',
        },
      })
      const sourceWeeks = Array.isArray(weekRows) ? weekRows : []
      const sourceWeekIds = sourceWeeks.map((row) => row.id).filter(Boolean)

      const dayRows = sourceWeekIds.length > 0 ? await request({
        table: 'program_days',
        query: {
          select: 'id,program_week_id,day_index,date,name,notes,status',
          program_week_id: `in.(${sourceWeekIds.join(',')})`,
          order: 'day_index.asc',
        },
      }) : []
      const sourceDays = Array.isArray(dayRows) ? dayRows : []
      const sourceDayIds = sourceDays.map((row) => row.id).filter(Boolean)

      const workoutRows = sourceDayIds.length > 0 ? await (async () => {
        try {
          return await request({
            table: 'program_workouts',
            query: {
              select: 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,notes,status,sort_order',
              program_day_id: `in.(${sourceDayIds.join(',')})`,
              order: 'sort_order.asc',
            },
          })
        } catch (error) {
          if (!isMissingProgramWorkoutNotesColumnError(error)) throw error
          return request({
            table: 'program_workouts',
            query: {
              select: 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,status,sort_order',
              program_day_id: `in.(${sourceDayIds.join(',')})`,
              order: 'sort_order.asc',
            },
          })
        }
      })() : []
      const sourceWorkouts = Array.isArray(workoutRows) ? workoutRows : []
      const sourceWorkoutIds = sourceWorkouts.map((row) => row.id).filter(Boolean)

      const exerciseRows = sourceWorkoutIds.length > 0 ? await request({
        table: 'program_workout_exercises',
        query: {
          select: 'id,program_workout_id,exercise_id,name_snapshot,sort_order,notes,default_rest_seconds',
          program_workout_id: `in.(${sourceWorkoutIds.join(',')})`,
          order: 'sort_order.asc',
        },
      }) : []
      const sourceExercises = Array.isArray(exerciseRows) ? exerciseRows : []
      const sourceExerciseIds = sourceExercises.map((row) => row.id).filter(Boolean)

      const setRows = sourceExerciseIds.length > 0 ? await request({
        table: 'program_workout_sets',
        query: {
          select: 'id,program_workout_exercise_id,sort_order,set_type,target_reps,target_load,target_load_unit,target_rpe,target_rest_seconds,notes',
          program_workout_exercise_id: `in.(${sourceExerciseIds.join(',')})`,
          order: 'sort_order.asc',
        },
      }) : []
      const sourceSets = Array.isArray(setRows) ? setRows : []

      const createdPrograms = await request({
        method: 'POST',
        table: 'programs',
        query: { select: 'id,athlete_id,coach_id,name,description,start_date,end_date,status' },
        body: {
          athlete_id: athleteId,
          coach_id: coachId,
          name: sourceProgram.name,
          description: sourceProgram.description,
          start_date: sourceProgram.startDate,
          end_date: sourceProgram.endDate,
          status: sourceProgram.status,
        },
      })
      const createdProgram = mapProgramRow(Array.isArray(createdPrograms) ? createdPrograms[0] : createdPrograms)
      const weekIdMap = new Map()
      const dayIdMap = new Map()
      const workoutIdMap = new Map()
      const exerciseIdMap = new Map()

      if (sourceWeeks.length > 0) {
        const createdWeekRows = await request({
          method: 'POST',
          table: 'program_weeks',
          query: { select: 'id,program_id,week_index,name,start_date,end_date' },
          body: sourceWeeks.map((sourceWeek) => ({
            program_id: createdProgram.id,
            week_index: sourceWeek.week_index,
            name: sourceWeek.name,
            start_date: sourceWeek.start_date,
            end_date: sourceWeek.end_date,
          })),
        })
        const createdWeeks = Array.isArray(createdWeekRows) ? createdWeekRows : [createdWeekRows]
        sourceWeeks.forEach((sourceWeek, index) => {
          weekIdMap.set(sourceWeek.id, createdWeeks[index]?.id)
        })
      }

      if (sourceDays.length > 0) {
        const createdDayRows = await request({
          method: 'POST',
          table: 'program_days',
          query: { select: 'id,program_week_id,day_index,date,name,notes,status' },
          body: sourceDays.map((sourceDay) => ({
            program_week_id: weekIdMap.get(sourceDay.program_week_id),
            day_index: sourceDay.day_index,
            date: sourceDay.date,
            name: sourceDay.name,
            notes: sourceDay.notes,
            status: sourceDay.status,
          })),
        })
        const createdDays = Array.isArray(createdDayRows) ? createdDayRows : [createdDayRows]
        sourceDays.forEach((sourceDay, index) => {
          dayIdMap.set(sourceDay.id, createdDays[index]?.id)
        })
      }

      if (sourceWorkouts.length > 0) {
        const workoutInsertRows = sourceWorkouts.map((sourceWorkout) => ({
          athlete_id: athleteId,
          coach_id: coachId,
          program_id: createdProgram.id,
          program_day_id: dayIdMap.get(sourceWorkout.program_day_id),
          workout_template_id: sourceWorkout.workout_template_id,
          name_snapshot: sourceWorkout.name_snapshot,
          notes: sourceWorkout.notes || '',
          status: sourceWorkout.status,
          sort_order: sourceWorkout.sort_order,
        }))
        let createdWorkoutRows = null
        try {
          createdWorkoutRows = await request({
            method: 'POST',
            table: 'program_workouts',
            query: { select: 'id' },
            body: workoutInsertRows,
          })
        } catch (error) {
          if (!isMissingProgramWorkoutNotesColumnError(error)) throw error
          createdWorkoutRows = await request({
            method: 'POST',
            table: 'program_workouts',
            query: { select: 'id' },
            body: workoutInsertRows.map(({ notes, ...legacyWorkoutRow }) => legacyWorkoutRow),
          })
        }
        const createdWorkouts = Array.isArray(createdWorkoutRows) ? createdWorkoutRows : [createdWorkoutRows]
        sourceWorkouts.forEach((sourceWorkout, index) => {
          workoutIdMap.set(sourceWorkout.id, createdWorkouts[index]?.id)
        })
      }

      if (sourceExercises.length > 0) {
        const createdExerciseRows = await request({
          method: 'POST',
          table: 'program_workout_exercises',
          query: { select: 'id' },
          body: sourceExercises.map((sourceExercise) => ({
            program_workout_id: workoutIdMap.get(sourceExercise.program_workout_id),
            exercise_id: sourceExercise.exercise_id,
            name_snapshot: sourceExercise.name_snapshot,
            sort_order: sourceExercise.sort_order,
            notes: sourceExercise.notes || '',
            default_rest_seconds: sourceExercise.default_rest_seconds ?? null,
          })),
        })
        const createdExercises = Array.isArray(createdExerciseRows) ? createdExerciseRows : [createdExerciseRows]
        sourceExercises.forEach((sourceExercise, index) => {
          exerciseIdMap.set(sourceExercise.id, createdExercises[index]?.id)
        })
      }

      if (sourceSets.length > 0) {
        await request({
          method: 'POST',
          table: 'program_workout_sets',
          query: { select: 'id' },
          body: sourceSets.map((sourceSet) => ({
            program_workout_exercise_id: exerciseIdMap.get(sourceSet.program_workout_exercise_id),
            sort_order: sourceSet.sort_order,
            set_type: sourceSet.set_type,
            target_reps: sourceSet.target_reps,
            target_load: sourceSet.target_load,
            target_load_unit: sourceSet.target_load_unit,
            target_rpe: sourceSet.target_rpe,
            target_rest_seconds: sourceSet.target_rest_seconds,
            notes: sourceSet.notes || '',
          })),
        })
      }

      return {
        ...createdProgram,
        weeksCount: sourceWeeks.length,
        workoutsCount: sourceWorkouts.length,
      }
    },
  }
}
