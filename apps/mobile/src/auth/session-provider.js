import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createMobileAppBootstrap } from './bootstrap.js'
import { createSupabaseMobileIdentityClient } from '../train/session-runtime.js'

const MobileAuthSessionContext = createContext(null)
const AUTH_SESSION_STORAGE_KEY = 'pplus.mobile.auth-session'
let inMemoryStorageState = null

export function getBootstrapFailureState(error) {
  return {
    status: 'bootstrap_error',
    athleteProfile: null,
    coachProfile: null,
    coachAthletes: [],
    trainState: null,
    sessionStore: null,
    errorMessage: error?.message || 'Something went sideways while connecting the app shell.',
  }
}

export function getInitialAuthSessionState() {
  return {
    accessToken: null,
    refreshToken: null,
    currentUserId: null,
    currentAthleteId: null,
  }
}

export function createAuthSessionController(initialState = getInitialAuthSessionState()) {
  let authSession = { ...getInitialAuthSessionState(), ...initialState }

  return {
    getState() {
      return { ...authSession }
    },
    updateAuthSession(nextSession = {}) {
      authSession = { ...authSession, ...nextSession }
      return { ...authSession }
    },
    clearAuthSession() {
      authSession = getInitialAuthSessionState()
      return { ...authSession }
    },
    isAuthenticated() {
      return Boolean(authSession.accessToken || authSession.currentUserId || authSession.currentAthleteId)
    },
  }
}

export function createMemoryAuthStorage(initialValue = null) {
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

function normalizeStoredAuthSession(authSession = {}) {
  const initialAuthSession = getInitialAuthSessionState()

  return {
    accessToken: authSession.accessToken || initialAuthSession.accessToken,
    refreshToken: authSession.refreshToken || initialAuthSession.refreshToken,
    currentUserId: authSession.currentUserId || initialAuthSession.currentUserId,
    currentAthleteId: authSession.currentAthleteId || initialAuthSession.currentAthleteId,
  }
}

function createBrowserAuthStorage(key = AUTH_SESSION_STORAGE_KEY) {
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

function createSecureStoreAuthStorage(secureStore, key = AUTH_SESSION_STORAGE_KEY) {
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

async function readAvatarAssetBuffer({ uri, fetchImpl }) {
  if (!uri) {
    throw new Error('Avatar upload requires an asset uri')
  }

  const activeFetch = fetchImpl ?? globalThis.fetch
  if (typeof activeFetch !== 'function') {
    throw new Error('Avatar upload requires fetch support')
  }

  const response = await activeFetch(uri)
  if (!response?.ok) {
    throw new Error('Could not read avatar asset for upload')
  }

  return new Uint8Array(await response.arrayBuffer())
}

export async function resolveAuthStorage({ storage = null, key = AUTH_SESSION_STORAGE_KEY } = {}) {
  if (storage) return storage

  if (typeof globalThis.localStorage !== 'undefined') {
    return createBrowserAuthStorage(key)
  }

  const secureStore = await loadExpoSecureStore()
  if (secureStore?.getItemAsync && secureStore?.setItemAsync && secureStore?.deleteItemAsync) {
    return createSecureStoreAuthStorage(secureStore, key)
  }

  if (!inMemoryStorageState) {
    inMemoryStorageState = createMemoryAuthStorage()
  }
  return inMemoryStorageState
}

export async function readStoredAuthSession(storage) {
  const raw = await storage.getItem()
  if (!raw) return getInitialAuthSessionState()

  try {
    return normalizeStoredAuthSession(JSON.parse(raw))
  } catch {
    return getInitialAuthSessionState()
  }
}

export async function writeStoredAuthSession(storage, authSession) {
  const nextSession = normalizeStoredAuthSession(authSession)
  await storage.setItem(JSON.stringify(nextSession))
  return nextSession
}

export async function clearStoredAuthSession(storage) {
  await storage.removeItem()
}

function mergeBootstrapAthleteProfile(currentBootstrapState, nextBootstrapState) {
  const currentAthleteProfile = currentBootstrapState?.athleteProfile || null
  const nextAthleteProfile = nextBootstrapState?.athleteProfile || null

  if (!currentAthleteProfile?.id || !nextAthleteProfile?.id || currentAthleteProfile.id !== nextAthleteProfile.id) {
    return nextBootstrapState
  }

  if (!currentAthleteProfile.avatarUrl || nextAthleteProfile.avatarUrl) {
    return nextBootstrapState
  }

  return {
    ...nextBootstrapState,
    athleteProfile: {
      ...nextAthleteProfile,
      avatarUrl: currentAthleteProfile.avatarUrl,
    },
  }
}

export function MobileAuthSessionProvider({
  children,
  previewState = 'planned',
  env = process.env,
  fetchImpl,
  initialAuthSession = null,
  storage = null,
}) {
  const [authSession, setAuthSession] = useState(() => ({
    ...getInitialAuthSessionState(),
    ...(initialAuthSession || {}),
  }))
  const [bootstrapState, setBootstrapState] = useState({
    status: 'loading',
    athleteProfile: null,
    trainState: null,
    sessionStore: null,
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const [resolvedStorage, setResolvedStorage] = useState(null)
  const resolvedStorageRef = useRef(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const authSessionRef = useRef(authSession)
  const refreshSessionPromiseRef = useRef(null)
  const valueRef = useRef(null)

  useEffect(() => {
    authSessionRef.current = authSession
  }, [authSession])

  useEffect(() => {
    resolvedStorageRef.current = resolvedStorage
  }, [resolvedStorage])

  const refreshAuthSession = useCallback(async () => {
    if (refreshSessionPromiseRef.current) {
      return refreshSessionPromiseRef.current
    }

    const currentSession = authSessionRef.current
    if (!currentSession?.refreshToken) {
      throw new Error('Refresh session requires an authenticated refresh token')
    }

    const refreshPromise = (async () => {
      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        fetchImpl,
      })

      if (!identityClient?.refreshSession) {
        throw new Error('Session refresh requires Supabase auth configuration')
      }

      const result = await identityClient.refreshSession({ refreshToken: currentSession.refreshToken })
      const nextAuthSession = {
        ...currentSession,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || currentSession.refreshToken,
        currentUserId: result.user?.id ?? currentSession.currentUserId ?? null,
      }
      authSessionRef.current = nextAuthSession
      setAuthSession(nextAuthSession)
      if (resolvedStorageRef.current) {
        await writeStoredAuthSession(resolvedStorageRef.current, nextAuthSession)
      }
      return nextAuthSession.accessToken
    })()

    refreshSessionPromiseRef.current = refreshPromise
    try {
      return await refreshPromise
    } finally {
      refreshSessionPromiseRef.current = null
    }
  }, [env, fetchImpl])

  useEffect(() => {
    let isMounted = true

    async function hydrateAuthSession() {
      const nextStorage = await resolveAuthStorage({ storage })
      if (!isMounted) return
      setResolvedStorage(nextStorage)

      const hasInjectedInitialSession = initialAuthSession != null
      if (hasInjectedInitialSession) {
        setAuthSession({
          ...getInitialAuthSessionState(),
          ...initialAuthSession,
        })
        setIsHydrated(true)
        return
      }

      const storedAuthSession = await readStoredAuthSession(nextStorage)
      if (!isMounted) return
      setAuthSession(storedAuthSession)
      setIsHydrated(true)
    }

    hydrateAuthSession()

    return () => {
      isMounted = false
    }
  }, [initialAuthSession, storage])

  useEffect(() => {
    if (!isHydrated) return undefined
    let isMounted = true

    async function bootstrapApp() {
      setIsBootstrapping(true)

      try {
        const nextBootstrapState = await createMobileAppBootstrap({
          env,
          fetchImpl,
          accessToken: authSession.accessToken,
          accessTokenProvider: () => authSessionRef.current.accessToken,
          refreshAccessToken: refreshAuthSession,
          currentUserId: authSession.currentUserId,
          currentAthleteId: authSession.currentAthleteId,
          previewState,
        })

        if (!isMounted) return
        setBootstrapState((current) => mergeBootstrapAthleteProfile(current, nextBootstrapState))
      } catch (error) {
        if (!isMounted) return
        setBootstrapState(getBootstrapFailureState(error))
      } finally {
        if (!isMounted) return
        setIsBootstrapping(false)
      }
    }

    bootstrapApp()

    return () => {
      isMounted = false
    }
  }, [authSession.accessToken, authSession.currentAthleteId, authSession.currentUserId, env, fetchImpl, isHydrated, previewState])

  const value = useMemo(() => ({
    authSession,
    setAuthSession,
    async updateAuthSession(nextSession = {}) {
      const mergedSession = { ...authSession, ...nextSession }
      authSessionRef.current = mergedSession
      setAuthSession(mergedSession)
      if (resolvedStorage) {
        await writeStoredAuthSession(resolvedStorage, mergedSession)
      }
      return mergedSession
    },
    async clearAuthSession() {
      const clearedSession = getInitialAuthSessionState()
      setAuthSession(clearedSession)
      if (resolvedStorage) {
        await clearStoredAuthSession(resolvedStorage)
      }
      return clearedSession
    },
    async refreshAuthSession() {
      return refreshAuthSession()
    },
    async signInWithPassword({ email, password }) {
      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        fetchImpl,
      })

      if (!identityClient?.signInWithPassword) {
        throw new Error('Sign-in requires Supabase auth configuration')
      }

      const result = await identityClient.signInWithPassword({ email, password })
      const nextAuthSession = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        currentUserId: result.user?.id ?? null,
        currentAthleteId: null,
      }
      setAuthSession(nextAuthSession)
      if (resolvedStorage) {
        await writeStoredAuthSession(resolvedStorage, nextAuthSession)
      }
      return result
    },
    async signUpWithPassword({ email, password, metadata = {} }) {
      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        fetchImpl,
      })

      if (!identityClient?.signUpWithPassword) {
        throw new Error('Sign-up requires Supabase auth configuration')
      }

      const result = await identityClient.signUpWithPassword({ email, password, metadata })
      const nextAuthSession = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        currentUserId: result.user?.id ?? null,
        currentAthleteId: null,
      }
      setAuthSession(nextAuthSession)
      if (resolvedStorage) {
        await writeStoredAuthSession(resolvedStorage, nextAuthSession)
      }
      return result
    },
    async resetPasswordForEmail({ email, redirectTo = null }) {
      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        fetchImpl,
      })

      if (!identityClient?.resetPasswordForEmail) {
        throw new Error('Password reset requires Supabase auth configuration')
      }

      return identityClient.resetPasswordForEmail({ email, redirectTo })
    },
    async updateCoachProfile(updates = {}) {
      const coachId = bootstrapState.coachProfile?.id
      if (!coachId) {
        throw new Error('Profile update requires an authenticated coach profile')
      }

      const isProfileGroupUpdateSafeFixture = env?.EXPO_PUBLIC_PPLUS_PROFILE_GROUP_UPDATE_FIXTURE === 'profile_group_update_safe'
      if (isProfileGroupUpdateSafeFixture) {
        const nextUpdates = { ...updates }
        delete nextUpdates.avatarAsset
        const updatedCoachProfile = {
          ...bootstrapState.coachProfile,
          ...nextUpdates,
        }
        setBootstrapState((current) => ({
          ...current,
          coachProfile: updatedCoachProfile,
        }))
        return updatedCoachProfile
      }

      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        accessToken: authSession.accessToken,
        fetchImpl,
      })

      if (!identityClient?.updateCoachProfile) {
        throw new Error('Profile update requires Supabase auth configuration')
      }

      const nextUpdates = {
        ...updates,
      }

      if (updates.avatarAsset && identityClient?.uploadCoachAvatar) {
        const avatarBuffer = await readAvatarAssetBuffer({ uri: updates.avatarAsset.uri, fetchImpl })
        const uploadedAvatar = await identityClient.uploadCoachAvatar({
          coachId,
          fileBuffer: avatarBuffer,
          contentType: updates.avatarAsset.mimeType || 'image/jpeg',
          fileName: updates.avatarAsset.fileName || `coach-avatar-${coachId}.jpg`,
        })
        nextUpdates.avatarUrl = uploadedAvatar.publicUrl
      }

      delete nextUpdates.avatarAsset

      const updatedCoachProfile = await identityClient.updateCoachProfile({ coachId, updates: nextUpdates })
      setBootstrapState((current) => ({
        ...current,
        coachProfile: updatedCoachProfile,
      }))
      return updatedCoachProfile
    },
    async updateAthleteProfile(updates = {}) {
      const currentAuthSession = authSessionRef.current
      const athleteId = bootstrapState.athleteProfile?.id || currentAuthSession.currentAthleteId
      if (!athleteId) {
        throw new Error('Profile update requires an authenticated athlete profile')
      }

      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        accessToken: currentAuthSession.accessToken,
        fetchImpl,
      })

      if (!identityClient?.updateAthleteProfile) {
        throw new Error('Profile update requires Supabase auth configuration')
      }

      const nextUpdates = {
        ...updates,
      }

      if (updates.avatarAsset && identityClient?.uploadAthleteAvatar) {
        const avatarBuffer = await readAvatarAssetBuffer({ uri: updates.avatarAsset.uri, fetchImpl })
        const uploadedAvatar = await identityClient.uploadAthleteAvatar({
          athleteId,
          fileBuffer: avatarBuffer,
          contentType: updates.avatarAsset.mimeType || 'image/jpeg',
          fileName: updates.avatarAsset.fileName || `athlete-avatar-${athleteId}.jpg`,
        })
        nextUpdates.avatarUrl = uploadedAvatar.publicUrl
      }

      delete nextUpdates.avatarAsset

      const updatedAthleteProfile = await identityClient.updateAthleteProfile({ athleteId, updates: nextUpdates })
      setBootstrapState((current) => ({
        ...current,
        athleteProfile: updatedAthleteProfile,
      }))
      return updatedAthleteProfile
    },
    async createCoachBodyMetricLog({ athleteId, metricType, value, unit = null, recordedAt = null, source = 'coach_workspace', notes = '', progressPhotoUrl = null } = {}) {
      const coachId = bootstrapState.coachProfile?.id
      if (!coachId) {
        throw new Error('Coach metric writes require an authenticated coach profile')
      }
      if (!athleteId) {
        throw new Error('Coach metric writes require a linked athlete profile')
      }

      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        accessToken: authSession.accessToken,
        fetchImpl,
      })

      if (!identityClient?.createBodyMetricLog) {
        throw new Error('Coach metric writes require Supabase auth configuration')
      }

      return identityClient.createBodyMetricLog({
        athleteId,
        coachId,
        metricType,
        value,
        unit,
        recordedAt,
        source,
        notes,
        progressPhotoUrl,
      })
    },
    async getLatestCoachBodyMetricLog({ athleteId, metricType = 'readiness', source = 'coach_workspace' } = {}) {
      if (!athleteId) {
        throw new Error('Coach metric reads require a linked athlete profile')
      }

      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        accessToken: authSession.accessToken,
        fetchImpl,
      })

      if (!identityClient?.getLatestBodyMetricLog) {
        throw new Error('Coach metric reads require Supabase auth configuration')
      }

      return identityClient.getLatestBodyMetricLog({
        athleteId,
        metricType,
        source,
      })
    },
    async signOut() {
      const identityClient = createSupabaseMobileIdentityClient({
        supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        accessToken: authSession.accessToken,
        fetchImpl,
      })

      if (identityClient?.signOut) {
        await identityClient.signOut()
      }

      const clearedSession = getInitialAuthSessionState()
      setAuthSession(clearedSession)
      if (resolvedStorage) {
        await clearStoredAuthSession(resolvedStorage)
      }
      return { success: true }
    },
    bootstrapState,
    isHydrated,
    isBootstrapping,
    sessionStore: bootstrapState.sessionStore,
    athleteProfile: bootstrapState.athleteProfile,
    isAuthenticated: Boolean(authSession.accessToken || authSession.currentUserId || authSession.currentAthleteId),
  }), [authSession, bootstrapState, env, fetchImpl, isBootstrapping, isHydrated, refreshAuthSession, resolvedStorage])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  return createElement(MobileAuthSessionContext.Provider, { value }, children)
}

export function useMobileAuthSession() {
  const value = useContext(MobileAuthSessionContext)
  if (!value) {
    throw new Error('useMobileAuthSession must be used inside MobileAuthSessionProvider')
  }
  return value
}
