import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  orchestrateAuthSubmit,
  orchestrateProfileSignOut,
  orchestrateThemePreferenceChange,
  orchestrateUnitsPreferenceChange,
  orchestrateSaveProfile,
  orchestrateSaveCoachReadinessMetric,
} from '../apps/mobile/src/auth/auth-profile-actions.js'

function createSetterLog() {
  const calls = []
  return {
    calls,
    setter(name) {
      return (value) => {
        calls.push([name, value])
      }
    },
  }
}

test('mobile auth/profile actions sign up with the selected role metadata and return the auth shell to sign in', async () => {
  const setterLog = createSetterLog()
  let receivedPayload = null

  await orchestrateAuthSubmit({
    mode: 'sign_up',
    values: {
      firstName: 'Anthony',
      lastName: 'Fortugno',
      email: ' anthony@example.com ',
      password: 'secret123',
      confirmPassword: 'secret123',
      role: 'coach',
    },
    signUpWithPassword: async (payload) => {
      receivedPayload = payload
    },
    signInWithPassword: async () => {
      throw new Error('signInWithPassword should not run for sign up')
    },
    resetPasswordForEmail: async () => {
      throw new Error('resetPasswordForEmail should not run for sign up')
    },
    setAuthErrorMessage: setterLog.setter('error'),
    setAuthNoticeMessage: setterLog.setter('notice'),
    setIsAuthSubmitting: setterLog.setter('submitting'),
    setAuthMode: setterLog.setter('mode'),
  })

  assert.deepEqual(receivedPayload, {
    email: 'anthony@example.com',
    password: 'secret123',
    metadata: {
      first_name: 'Anthony',
      last_name: 'Fortugno',
      role: 'coach',
      coach_email: null,
    },
  })
  assert.deepEqual(setterLog.calls, [
    ['error', ''],
    ['notice', ''],
    ['submitting', true],
    ['notice', 'Account created. If your workspace requires email confirmation, confirm the email first, then sign in.'],
    ['mode', 'sign_in'],
    ['submitting', false],
  ])
})

test('mobile auth/profile actions sign in with the current email and password values instead of routing through sign up', async () => {
  const setterLog = createSetterLog()
  let signInPayload = null

  await orchestrateAuthSubmit({
    mode: 'sign_in',
    values: {
      email: ' anthony@example.com ',
      password: 'secret123',
      role: 'coach',
    },
    signUpWithPassword: async () => {
      throw new Error('signUpWithPassword should not run for sign in')
    },
    signInWithPassword: async (payload) => {
      signInPayload = payload
    },
    resetPasswordForEmail: async () => {
      throw new Error('resetPasswordForEmail should not run for sign in')
    },
    setAuthErrorMessage: setterLog.setter('error'),
    setAuthNoticeMessage: setterLog.setter('notice'),
    setIsAuthSubmitting: setterLog.setter('submitting'),
    setAuthMode: setterLog.setter('mode'),
  })

  assert.deepEqual(signInPayload, {
    email: 'anthony@example.com',
    password: 'secret123',
  })
  assert.deepEqual(setterLog.calls, [
    ['error', ''],
    ['notice', ''],
    ['submitting', true],
    ['submitting', false],
  ])
})

test('mobile auth/profile actions sign out and close the profile surface after success', async () => {
  const setterLog = createSetterLog()
  let signOutCalls = 0

  await orchestrateProfileSignOut({
    signOut: async () => {
      signOutCalls += 1
    },
    setAuthErrorMessage: setterLog.setter('error'),
    setAuthNoticeMessage: setterLog.setter('notice'),
    setProfileSaveNotice: setterLog.setter('profileNotice'),
    setAuthMode: setterLog.setter('mode'),
    setIsProfileViewOpen: setterLog.setter('profileOpen'),
  })

  assert.equal(signOutCalls, 1)
  assert.deepEqual(setterLog.calls, [
    ['error', ''],
    ['notice', ''],
    ['profileNotice', ''],
    ['mode', 'sign_in'],
    ['notice', 'Signed out. Sign back in when you are ready.'],
    ['profileOpen', false],
  ])
})

test('mobile auth/profile actions persist coach theme preferences through the coach updater', async () => {
  const setterLog = createSetterLog()
  let coachUpdates = null

  await orchestrateThemePreferenceChange({
    nextThemePreference: 'light',
    isCoachBootstrapState: true,
    updateCoachProfile: async (updates) => {
      coachUpdates = updates
    },
    updateAthleteProfile: async () => {
      throw new Error('updateAthleteProfile should not run for coach theme updates')
    },
    setAuthErrorMessage: setterLog.setter('error'),
    setAuthNoticeMessage: setterLog.setter('notice'),
    setProfileSaveNotice: setterLog.setter('profileNotice'),
    logger: { warn() {} },
  })

  assert.deepEqual(coachUpdates, { themePreference: 'light' })
  assert.deepEqual(setterLog.calls, [
    ['error', ''],
    ['notice', ''],
    ['profileNotice', ''],
  ])
})

test('mobile auth/profile actions derive athlete units preference from weight and distance selections', async () => {
  let athleteUpdates = null

  await orchestrateUnitsPreferenceChange({
    updates: { weightUnitPreference: 'kg' },
    profileViewProfile: {
      weightUnitPreference: 'lb',
      distanceUnitPreference: 'mi',
    },
    isCoachBootstrapState: false,
    updateCoachProfile: async () => {
      throw new Error('updateCoachProfile should not run for athlete unit updates')
    },
    updateAthleteProfile: async (updates) => {
      athleteUpdates = updates
    },
    logger: { warn() {} },
  })

  assert.deepEqual(athleteUpdates, {
    unitsPreference: 'metric',
    weightUnitPreference: 'kg',
    distanceUnitPreference: 'mi',
  })
})

test('mobile auth/profile actions save athlete profile drafts and publish the success notice', async () => {
  const setterLog = createSetterLog()
  let athleteUpdates = null

  const result = await orchestrateSaveProfile({
    profileDraft: { firstName: 'Anthony' },
    isCoachBootstrapState: false,
    updateCoachProfile: async () => {
      throw new Error('updateCoachProfile should not run for athlete profile saves')
    },
    updateAthleteProfile: async (updates) => {
      athleteUpdates = updates
      return { id: 'ath-1', firstName: 'Anthony' }
    },
    setAuthErrorMessage: setterLog.setter('error'),
    setAuthNoticeMessage: setterLog.setter('notice'),
    setProfileSaveNotice: setterLog.setter('profileNotice'),
    setIsProfileSaving: setterLog.setter('saving'),
  })

  assert.deepEqual(result, { id: 'ath-1', firstName: 'Anthony' })
  assert.deepEqual(athleteUpdates, { firstName: 'Anthony' })
  assert.deepEqual(setterLog.calls, [
    ['error', ''],
    ['notice', ''],
    ['profileNotice', ''],
    ['saving', true],
    ['profileNotice', 'Profile updated.'],
    ['saving', false],
  ])
})

test('mobile auth/profile actions rethrow profile save failures so the profile screen can block fake avatar success copy', async () => {
  const setterLog = createSetterLog()
  const saveError = new Error('Avatar upload failed.')

  await assert.rejects(
    () => orchestrateSaveProfile({
      profileDraft: { avatarUrl: 'file:///avatar.jpg' },
      isCoachBootstrapState: false,
      updateCoachProfile: async () => {
        throw new Error('updateCoachProfile should not run for athlete profile saves')
      },
      updateAthleteProfile: async () => {
        throw saveError
      },
      setAuthErrorMessage: setterLog.setter('error'),
      setAuthNoticeMessage: setterLog.setter('notice'),
      setProfileSaveNotice: setterLog.setter('profileNotice'),
      setIsProfileSaving: setterLog.setter('saving'),
    }),
    /Avatar upload failed\./
  )

  assert.deepEqual(setterLog.calls, [
    ['error', ''],
    ['notice', ''],
    ['profileNotice', ''],
    ['saving', true],
    ['error', 'Avatar upload failed.'],
    ['saving', false],
  ])
})

test('mobile auth/profile actions save coach readiness snapshots with the selected athlete linkage', async () => {
  const setterLog = createSetterLog()
  let receivedPayload = null

  await orchestrateSaveCoachReadinessMetric({
    selectedCoachAthlete: {
      athleteProfileId: 'athlete-42',
      readinessPercent: 82,
      nextActionLabel: 'Recover hard today',
    },
    createCoachBodyMetricLog: async (payload) => {
      receivedPayload = payload
    },
    setCoachMetricNotice: setterLog.setter('notice'),
    setCoachMetricError: setterLog.setter('error'),
    setIsCoachMetricSaving: setterLog.setter('saving'),
  })

  assert.deepEqual(receivedPayload, {
    athleteId: 'athlete-42',
    metricType: 'readiness',
    value: 82,
    unit: 'percent',
    notes: 'Recover hard today',
  })
  assert.deepEqual(setterLog.calls, [
    ['notice', ''],
    ['error', ''],
    ['saving', true],
    ['notice', 'Readiness snapshot saved.'],
    ['saving', false],
  ])
})

test('mobile auth/profile actions reject coach readiness saves when the coach has not entered a readiness percentage yet', async () => {
  const setterLog = createSetterLog()
  let receivedPayload = null

  await orchestrateSaveCoachReadinessMetric({
    selectedCoachAthlete: {
      athleteProfileId: 'athlete-42',
      readinessPercent: null,
      nextActionLabel: 'Need a real readiness score first',
    },
    createCoachBodyMetricLog: async (payload) => {
      receivedPayload = payload
    },
    setCoachMetricNotice: setterLog.setter('notice'),
    setCoachMetricError: setterLog.setter('error'),
    setIsCoachMetricSaving: setterLog.setter('saving'),
  })

  assert.equal(receivedPayload, null)
  assert.deepEqual(setterLog.calls, [
    ['notice', ''],
    ['error', ''],
    ['saving', true],
    ['error', 'Enter a readiness percentage before saving this coach snapshot.'],
    ['saving', false],
  ])
})

test('mobile auth/profile actions are the dedicated App.js seam for auth and profile orchestration', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /import \{[\s\S]*orchestrateAuthSubmit,[\s\S]*orchestrateProfileSignOut,[\s\S]*orchestrateThemePreferenceChange,[\s\S]*orchestrateUnitsPreferenceChange,[\s\S]*orchestrateSaveProfile,[\s\S]*orchestrateSaveCoachReadinessMetric,[\s\S]*\} from '\.\/src\/auth\/auth-profile-actions\.js';/)
  assert.match(appSource, /async function handleAuthSubmit\(\{ mode, values \}\) \{[\s\S]*await orchestrateAuthSubmit\(\{[\s\S]*mode,[\s\S]*values,[\s\S]*resetPasswordForEmail,[\s\S]*signUpWithPassword,[\s\S]*signInWithPassword,[\s\S]*setAuthErrorMessage,[\s\S]*setAuthNoticeMessage,[\s\S]*setIsAuthSubmitting,[\s\S]*setAuthMode,[\s\S]*\}\);[\s\S]*\}/)
  assert.match(appSource, /async function handleProfileSignOut\(\) \{[\s\S]*await orchestrateProfileSignOut\(\{[\s\S]*signOut,[\s\S]*setAuthErrorMessage,[\s\S]*setAuthNoticeMessage,[\s\S]*setProfileSaveNotice,[\s\S]*setAuthMode,[\s\S]*setIsProfileViewOpen,[\s\S]*\}\);[\s\S]*\}/)
  assert.match(appSource, /async function handleThemePreferenceChange\(nextThemePreference\) \{[\s\S]*await orchestrateThemePreferenceChange\(\{[\s\S]*nextThemePreference,[\s\S]*isCoachBootstrapState,[\s\S]*updateCoachProfile,[\s\S]*updateAthleteProfile,[\s\S]*setAuthErrorMessage,[\s\S]*setAuthNoticeMessage,[\s\S]*setProfileSaveNotice,[\s\S]*logger: console,[\s\S]*\}\);[\s\S]*\}/)
  assert.match(appSource, /async function handleUnitsPreferenceChange\(updates = \{\}\) \{[\s\S]*await orchestrateUnitsPreferenceChange\(\{[\s\S]*updates,[\s\S]*profileViewProfile,[\s\S]*isCoachBootstrapState,[\s\S]*updateCoachProfile,[\s\S]*updateAthleteProfile,[\s\S]*logger: console,[\s\S]*\}\);[\s\S]*\}/)
  assert.match(appSource, /async function handleSaveProfile\(profileDraft\) \{[\s\S]*await orchestrateSaveProfile\(\{[\s\S]*profileDraft,[\s\S]*isCoachBootstrapState,[\s\S]*updateCoachProfile,[\s\S]*updateAthleteProfile,[\s\S]*setAuthErrorMessage,[\s\S]*setAuthNoticeMessage,[\s\S]*setProfileSaveNotice,[\s\S]*setIsProfileSaving,[\s\S]*\}\);[\s\S]*\}/)
  assert.match(appSource, /async function handleSaveCoachReadinessMetric\(\) \{[\s\S]*await orchestrateSaveCoachReadinessMetric\(\{[\s\S]*selectedCoachAthlete: coachWorkspaceAthlete,[\s\S]*createCoachBodyMetricLog,[\s\S]*setCoachMetricNotice,[\s\S]*setCoachMetricError,[\s\S]*setIsCoachMetricSaving,[\s\S]*\}\);[\s\S]*\}/)
}
)