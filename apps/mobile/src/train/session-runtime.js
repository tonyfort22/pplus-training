import * as data from '../../../../packages/data/src/index.js'
import { createWorkoutSession } from '../../../../packages/core/src/index.js'

const SESSION_SETTINGS_STORAGE_KEY = 'pplus-session-settings-cache'
let inMemorySessionSettingsStorageState = null

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

export function createMemorySessionSettingsStorage(initialValue = null) {
  let storedValue = initialValue

  return {
    async getItem() {
      return storedValue
    },
    async setItem(value) {
      storedValue = value
      return storedValue
    },
    async removeItem() {
      storedValue = null
    },
  }
}

function createBrowserSessionSettingsStorage(key = SESSION_SETTINGS_STORAGE_KEY) {
  return {
    async getItem() {
      return globalThis.localStorage.getItem(key)
    },
    async setItem(value) {
      globalThis.localStorage.setItem(key, value)
      return value
    },
    async removeItem() {
      globalThis.localStorage.removeItem(key)
    },
  }
}

function createSecureStoreSessionSettingsStorage(secureStore, key = SESSION_SETTINGS_STORAGE_KEY) {
  return {
    async getItem() {
      return secureStore.getItemAsync(key)
    },
    async setItem(value) {
      await secureStore.setItemAsync(key, value)
      return value
    },
    async removeItem() {
      await secureStore.deleteItemAsync(key)
    },
  }
}

async function loadExpoSecureStore() {
  try {
    return await import('expo-secure-store')
  } catch {
    return null
  }
}

export async function resolveSessionSettingsStorage({ storage = null, key = SESSION_SETTINGS_STORAGE_KEY } = {}) {
  if (storage) return storage

  if (typeof globalThis.localStorage !== 'undefined') {
    return createBrowserSessionSettingsStorage(key)
  }

  const secureStore = await loadExpoSecureStore()
  if (secureStore?.getItemAsync && secureStore?.setItemAsync && secureStore?.deleteItemAsync) {
    return createSecureStoreSessionSettingsStorage(secureStore, key)
  }

  if (!inMemorySessionSettingsStorageState) {
    inMemorySessionSettingsStorageState = createMemorySessionSettingsStorage()
  }

  return inMemorySessionSettingsStorageState
}

function buildSeededSessionId(session) {
  const baseId = session?.programWorkoutId || session?.id || 'session-demo'
  return `session-${baseId}`
}

function hasRichWorkoutStructure(workout) {
  return Array.isArray(workout?.exercises) && workout.exercises.length > 0
}

function hasRichSessionStructure(session) {
  return Array.isArray(session?.exercises) && session.exercises.length > 0
}

function rehydrateEmptySessionFromWorkout(session, programWorkout) {
  if (!session || !hasRichWorkoutStructure(programWorkout) || hasRichSessionStructure(session)) {
    return session
  }

  const rebuiltSession = data.sessions.db ? session : createWorkoutSession({
    programWorkout,
    startedAt: session.startedAt || new Date().toISOString(),
  })

  return {
    ...rebuiltSession,
    ...session,
    exercises: rebuiltSession.exercises,
    totalExercisesCount: rebuiltSession.totalExercisesCount,
    completedExercisesCount: session.completedExercisesCount ?? rebuiltSession.completedExercisesCount,
    totalSetsCount: rebuiltSession.totalSetsCount,
    completedSetsCount: session.completedSetsCount ?? rebuiltSession.completedSetsCount,
    activeRestTimer: session.activeRestTimer ?? rebuiltSession.activeRestTimer ?? null,
    settings: session.settings ?? rebuiltSession.settings,
  }
}

function shouldSeedExistingSession(initialSession, { allowSynthetic = true } = {}) {
  if (!initialSession) return false
  if (initialSession.id) return true
  if (!allowSynthetic) return false
  if (initialSession.status && initialSession.status !== 'in_progress') return true
  return Number(initialSession.completedSetsCount || 0) > 0
}

function createLocalTrainSessionDb({ programWorkout, initialSession }) {
  let storedSession = shouldSeedExistingSession(initialSession)
    ? {
        ...cloneValue(initialSession),
        id: initialSession.id || buildSeededSessionId(initialSession),
      }
    : null

  return {
    async getProgramWorkoutById(programWorkoutId) {
      if (!programWorkout?.id || programWorkoutId !== programWorkout.id) return null
      return cloneValue(programWorkout)
    },
    async getTodaysProgramWorkoutForAthlete(athleteId) {
      if (!programWorkout?.id || !athleteId || athleteId !== programWorkout.athleteId) return null
      return cloneValue(programWorkout)
    },
    async insertWorkoutSession(session) {
      storedSession = {
        ...cloneValue(session),
        id: session.id || buildSeededSessionId(session),
      }
      return cloneValue(storedSession)
    },
    async saveWorkoutSession(session) {
      storedSession = {
        ...cloneValue(session),
        id: session?.id || storedSession?.id || buildSeededSessionId(session),
      }
      return cloneValue(storedSession)
    },
    async deleteWorkoutSessionSet({ workoutSessionSetId } = {}) {
      return { success: true, workoutSessionSetId: workoutSessionSetId || null }
    },
    async getWorkoutSessionById(sessionId) {
      if (!storedSession || storedSession.id !== sessionId) {
        return null
      }
      return cloneValue(storedSession)
    },
    getCurrentSession() {
      return cloneValue(storedSession)
    },
    clearSession() {
      storedSession = null
    },
  }
}

export function createSupabaseMobileIdentityClient({
  supabaseUrl,
  supabaseAnonKey,
  accessToken,
  fetchImpl,
} = {}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return data.identity.createSupabaseRestIdentityRepository({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    accessToken,
    fetchImpl,
  })
}

export function createSupabaseMobileDataClient({
  supabaseUrl,
  supabaseAnonKey,
  accessToken,
  refreshAccessToken = null,
  fetchImpl,
} = {}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return data.sessions.createSupabaseRestSessionDb({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    accessToken,
    refreshAccessToken,
    fetchImpl,
  })
}

export async function resolveCurrentAthleteProfile({
  currentAthleteId = null,
  currentUserId = null,
  identityClient = null,
} = {}) {
  if (currentAthleteId) {
    if (typeof identityClient?.getAthleteProfileById === 'function') {
      return identityClient.getAthleteProfileById(currentAthleteId)
    }
    return { id: currentAthleteId, userId: currentUserId ?? null }
  }

  if (currentUserId && typeof identityClient?.getAthleteProfileByUserId === 'function') {
    return identityClient.getAthleteProfileByUserId(currentUserId)
  }

  if (typeof identityClient?.getCurrentUser === 'function' && typeof identityClient?.getAthleteProfileByUserId === 'function') {
    const currentUser = await identityClient.getCurrentUser()
    if (currentUser?.id) {
      return identityClient.getAthleteProfileByUserId(currentUser.id)
    }
  }

  return null
}

export function resolveTrainSessionDb({
  programWorkout = null,
  initialSession = null,
  dataClient = null,
  env = process.env,
  fetchImpl,
  accessToken = null,
  refreshAccessToken = null,
} = {}) {
  if (dataClient) {
    return dataClient
  }

  const remoteClient = createSupabaseMobileDataClient({
    supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    accessToken,
    refreshAccessToken,
    fetchImpl,
  })

  if (remoteClient) {
    return remoteClient
  }

  if (!programWorkout?.id) {
    throw new Error('Train session store requires a programWorkout with an id when no remote data client is available')
  }

  return createLocalTrainSessionDb({ programWorkout, initialSession })
}

async function resolveProgramWorkoutForStore({
  db,
  athleteProfile,
  seededProgramWorkout,
  programWorkoutId = null,
  onDate = null,
}) {
  if (programWorkoutId && typeof db?.getProgramWorkoutById === 'function') {
    return db.getProgramWorkoutById(programWorkoutId)
  }

  if (seededProgramWorkout?.id) {
    if (!athleteProfile?.id || !seededProgramWorkout.athleteId || seededProgramWorkout.athleteId === athleteProfile.id) {
      return cloneValue(seededProgramWorkout)
    }
  }

  if (athleteProfile?.id && typeof db?.getTodaysProgramWorkoutForAthlete === 'function') {
    return db.getTodaysProgramWorkoutForAthlete(athleteProfile.id, { onDate })
  }

  return cloneValue(seededProgramWorkout)
}

export function createTrainSessionStore({
  programWorkout = null,
  initialSession = null,
  dataClient = null,
  identityClient = null,
  currentAthleteId = null,
  currentUserId = null,
  env = process.env,
  fetchImpl,
  accessToken = null,
  refreshAccessToken = null,
  sessionSettingsStorage = null,
} = {}) {
  const db = resolveTrainSessionDb({
    programWorkout,
    initialSession,
    dataClient,
    env,
    fetchImpl,
    accessToken,
    refreshAccessToken,
  })

  const resolvedIdentityClient = identityClient || createSupabaseMobileIdentityClient({
    supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    accessToken,
    fetchImpl,
  })

  const allowSyntheticSeed = typeof db?.saveWorkoutSession !== 'function' || typeof db?.getWorkoutSessionById !== 'function'
  let storedSession = shouldSeedExistingSession(initialSession, { allowSynthetic: allowSyntheticSeed })
    ? {
        ...cloneValue(initialSession),
        id: initialSession.id || buildSeededSessionId(initialSession),
      }
    : (typeof db?.getCurrentSession === 'function' ? db.getCurrentSession() : null)
  let resolvedAthleteProfile = null
  let resolvedProgramWorkout = cloneValue(programWorkout)

  const repository = data.sessions.createSessionRepository(db)
  const analyticsRepository = data.analytics.createAnalyticsRepository(db)
  let lastPersistedCompletedAnalyticsKey = null
  const sessionSettingsStoragePromise = resolveSessionSettingsStorage({ storage: sessionSettingsStorage })
  let cachedSessionSettingsByKey = new Map()
  const sessionSettingsReadyPromise = sessionSettingsStoragePromise
    .then(async (storage) => {
      const rawValue = await storage?.getItem?.()
      if (!rawValue) return storage
      try {
        const parsedValue = JSON.parse(rawValue)
        if (parsedValue && typeof parsedValue === 'object') {
          cachedSessionSettingsByKey = new Map(Object.entries(parsedValue))
        }
      } catch {
        cachedSessionSettingsByKey = new Map()
      }
      return storage
    })
    .catch(() => null)

  function getSessionSettingsKey(session) {
    return session?.id || session?.programWorkoutId || null
  }

  function getNormalizedSessionSettings(settings = {}) {
    return {
      defaultRestSeconds: settings.defaultRestSeconds ?? null,
      autoProgressEnabled: settings.autoProgressEnabled ?? false,
      keepAwake: settings.keepAwake ?? false,
      adjustEffortAfterSet: settings.adjustEffortAfterSet ?? false,
    }
  }

  function getFallbackSessionSettingsFromWorkout(workout = null) {
    return getNormalizedSessionSettings({
      defaultRestSeconds: workout?.defaultRestSeconds ?? null,
      autoProgressEnabled: workout?.autoProgressEnabled ?? false,
      keepAwake: false,
      adjustEffortAfterSet: workout?.adjustEffortAfterSet ?? false,
    })
  }

  function mergeSessionSettings(session, fallbackSettings = null) {
    if (!session) return session
    const sessionKey = getSessionSettingsKey(session)
    const cachedSettings = sessionKey ? cachedSessionSettingsByKey.get(sessionKey) || null : null
    const resolvedSettings = fallbackSettings || cachedSettings || session?.settings || null
    if (!resolvedSettings) return session
    return {
      ...session,
      settings: getNormalizedSessionSettings(resolvedSettings),
    }
  }

  async function persistSessionSettings(session) {
    const sessionKey = getSessionSettingsKey(session)
    if (!sessionKey || !session?.settings) return
    cachedSessionSettingsByKey.set(sessionKey, getNormalizedSessionSettings(session.settings))
    const storage = await sessionSettingsReadyPromise
    await storage?.setItem?.(JSON.stringify(Object.fromEntries(cachedSessionSettingsByKey)))
  }

  async function removeSessionSettings(sessionId = null) {
    const sessionKey = sessionId || null
    if (!sessionKey) return
    cachedSessionSettingsByKey.delete(sessionKey)
    const storage = await sessionSettingsReadyPromise
    if (cachedSessionSettingsByKey.size === 0) {
      await storage?.removeItem?.()
      return
    }
    await storage?.setItem?.(JSON.stringify(Object.fromEntries(cachedSessionSettingsByKey)))
  }

  async function ensureAthleteProfile() {
    if (resolvedAthleteProfile?.id) return resolvedAthleteProfile
    resolvedAthleteProfile = await resolveCurrentAthleteProfile({
      currentAthleteId,
      currentUserId,
      identityClient: resolvedIdentityClient,
    })
    return resolvedAthleteProfile
  }

  async function ensureProgramWorkout({ programWorkoutId = null, onDate = null } = {}) {
    if (programWorkoutId && resolvedProgramWorkout?.id == programWorkoutId && hasRichWorkoutStructure(resolvedProgramWorkout)) {
      return resolvedProgramWorkout
    }

    const athleteProfile = await ensureAthleteProfile()
    const nextProgramWorkout = await resolveProgramWorkoutForStore({
      db,
      athleteProfile,
      seededProgramWorkout: resolvedProgramWorkout,
      programWorkoutId,
      onDate,
    })

    resolvedProgramWorkout = cloneValue(nextProgramWorkout)
    return resolvedProgramWorkout
  }

  async function syncCurrentSession({ programWorkoutId = null, onDate = null } = {}) {
    await sessionSettingsReadyPromise
    const workout = await ensureProgramWorkout({ programWorkoutId, onDate })
    if (!workout?.id || typeof repository?.getInProgressSessionByProgramWorkoutId !== 'function') {
      return cloneValue(storedSession)
    }

    let existingSession = await repository.getInProgressSessionByProgramWorkoutId(workout.id)
    if (!existingSession?.id && typeof repository?.getInProgressSessionByAthleteId === 'function' && workout?.athleteId) {
      existingSession = await repository.getInProgressSessionByAthleteId(workout.athleteId)
    }
    if (!existingSession) {
      return cloneValue(storedSession)
    }

    const hydrationWorkout = existingSession.programWorkoutId && existingSession.programWorkoutId !== workout.id
      ? await ensureProgramWorkout({ programWorkoutId: existingSession.programWorkoutId })
      : workout
    const hydratedSession = rehydrateEmptySessionFromWorkout(existingSession, hydrationWorkout)
    const mergedSession = mergeSessionSettings(hydratedSession, storedSession?.settings || getFallbackSessionSettingsFromWorkout(workout))
    storedSession = cloneValue(mergedSession)
    await persistSessionSettings(mergedSession)
    return cloneValue(mergedSession)
  }

  async function persistCompletedSessionAnalyticsIfNeeded(session) {
    if (session?.status !== 'completed' || !session?.id || !session?.completedAt) return null
    const analyticsKey = `${session.id}:${session.completedAt}`
    if (analyticsKey == lastPersistedCompletedAnalyticsKey) return null
    const result = await analyticsRepository.persistCompletedSessionAnalytics(session)
    lastPersistedCompletedAnalyticsKey = analyticsKey
    return result
  }

  return {
    db,
    repository,
    identityClient: resolvedIdentityClient,
    async getCurrentAthleteProfile() {
      const athleteProfile = await ensureAthleteProfile()
      return cloneValue(athleteProfile)
    },
    getCurrentSessionId() {
      return storedSession?.id ?? null
    },
    getCurrentSession() {
      return cloneValue(storedSession)
    },
    async getProgramWorkout(options = {}) {
      const workout = await ensureProgramWorkout(options)
      return cloneValue(workout)
    },
    async syncCurrentSession(options = {}) {
      return syncCurrentSession(options)
    },
    async startSession(options = {}) {
      await sessionSettingsReadyPromise
      const workout = await ensureProgramWorkout({
        programWorkoutId: options.programWorkoutId,
        onDate: options.onDate,
      })

      if (!workout?.id) {
        throw new Error('No program workout available to start a session')
      }

      const result = await repository.createSessionFromProgramWorkout(workout.id, options)
      const hydratedSession = rehydrateEmptySessionFromWorkout(result.session, workout)
      const mergedSession = mergeSessionSettings(hydratedSession, getFallbackSessionSettingsFromWorkout(workout))
      storedSession = cloneValue(mergedSession)
      await persistSessionSettings(mergedSession)
      resolvedProgramWorkout = cloneValue(workout)
      return {
        ...result,
        session: cloneValue(mergedSession),
      }
    },
    async resumeSession(sessionId = storedSession?.id) {
      await sessionSettingsReadyPromise
      if (!sessionId) return null
      const session = await repository.getSessionById(sessionId)
      if (!session) return null
      const workout = !hasRichSessionStructure(session) && session?.programWorkoutId && (!resolvedProgramWorkout?.id || resolvedProgramWorkout.id !== session.programWorkoutId || !hasRichWorkoutStructure(resolvedProgramWorkout))
        ? await ensureProgramWorkout({ programWorkoutId: session.programWorkoutId })
        : resolvedProgramWorkout
      const hydratedSession = rehydrateEmptySessionFromWorkout(session, workout)
      const mergedSession = mergeSessionSettings(hydratedSession, storedSession?.settings || null)
      storedSession = cloneValue(mergedSession)
      await persistSessionSettings(mergedSession)
      return cloneValue(mergedSession)
    },
    async saveSession(session) {
      await sessionSettingsReadyPromise
      const nextSession = typeof db?.saveWorkoutSession === 'function'
        ? await db.saveWorkoutSession(session)
        : {
            ...cloneValue(session),
            id: session?.id || storedSession?.id || buildSeededSessionId(session || { programWorkoutId: resolvedProgramWorkout?.id }),
          }
      const mergedSession = mergeSessionSettings(nextSession, session?.settings || storedSession?.settings || null)
      storedSession = cloneValue(mergedSession)
      await persistSessionSettings(mergedSession)
      await persistCompletedSessionAnalyticsIfNeeded(mergedSession)
      return cloneValue(storedSession)
    },
    async deleteSessionSet(session, { setId = null } = {}) {
      await sessionSettingsReadyPromise
      if (setId && typeof db?.deleteWorkoutSessionSet === 'function') {
        await db.deleteWorkoutSessionSet({ workoutSessionSetId: setId })
      }
      const nextSession = typeof db?.saveWorkoutSession === 'function'
        ? await db.saveWorkoutSession(session)
        : {
            ...cloneValue(session),
            id: session?.id || storedSession?.id || buildSeededSessionId(session || { programWorkoutId: resolvedProgramWorkout?.id }),
          }
      const mergedSession = mergeSessionSettings(nextSession, session?.settings || storedSession?.settings || null)
      storedSession = cloneValue(mergedSession)
      await persistSessionSettings(mergedSession)
      return cloneValue(storedSession)
    },
    async deleteSessionExercise(session, { exerciseId = null } = {}) {
      await sessionSettingsReadyPromise
      if (exerciseId && typeof db?.deleteWorkoutSessionExercise === 'function') {
        await db.deleteWorkoutSessionExercise({ workoutSessionExerciseId: exerciseId })
      }
      const nextSession = typeof db?.saveWorkoutSession === 'function'
        ? await db.saveWorkoutSession(session)
        : {
            ...cloneValue(session),
            id: session?.id || storedSession?.id || buildSeededSessionId(session || { programWorkoutId: resolvedProgramWorkout?.id }),
          }
      const mergedSession = mergeSessionSettings(nextSession, session?.settings || storedSession?.settings || null)
      storedSession = cloneValue(mergedSession)
      await persistSessionSettings(mergedSession)
      return cloneValue(storedSession)
    },
    clearSession() {
      const sessionId = storedSession?.id || null
      storedSession = null
      void removeSessionSettings(sessionId)
      if (typeof db?.clearSession === 'function') {
        db.clearSession()
      }
    },
  }
}
