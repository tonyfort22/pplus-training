async function updateProfileByRole({
  isCoachBootstrapState,
  updateCoachProfile,
  updateAthleteProfile,
  coachUpdates,
  athleteUpdates = coachUpdates,
}) {
  if (isCoachBootstrapState) {
    return updateCoachProfile(coachUpdates)
  }

  return updateAthleteProfile(athleteUpdates)
}

export async function orchestrateAuthSubmit({
  mode,
  values = {},
  resetPasswordForEmail,
  signUpWithPassword,
  signInWithPassword,
  setAuthErrorMessage,
  setAuthNoticeMessage,
  setIsAuthSubmitting,
  setAuthMode,
}) {
  setAuthErrorMessage('')
  setAuthNoticeMessage('')
  setIsAuthSubmitting(true)

  try {
    if (mode === 'forgot_password') {
      if (!values.email?.trim()) {
        throw new Error('Enter the email tied to your athlete account first.')
      }

      await resetPasswordForEmail({ email: values.email.trim() })
      setAuthNoticeMessage('Password reset link sent. Check your email, then come back and sign in.')
      setAuthMode('sign_in')
      return
    }

    if (mode === 'sign_up') {
      if (!values.firstName?.trim() || !values.lastName?.trim()) {
        throw new Error('First name and last name are required to create the athlete profile.')
      }
      if (!values.email?.trim() || !values.password) {
        throw new Error('Email and password are required to create your account.')
      }
      if (values.password !== values.confirmPassword) {
        throw new Error('Passwords need to match before we can create the account.')
      }

      await signUpWithPassword({
        email: values.email.trim(),
        password: values.password,
        metadata: {
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          role: values.role,
          coach_email: values.role === 'athlete' ? values.coachEmail?.trim() || null : null,
        },
      })
      setAuthNoticeMessage('Account created. If your workspace requires email confirmation, confirm the email first, then sign in.')
      setAuthMode('sign_in')
      return
    }

    if (!values.email?.trim() || !values.password) {
      throw new Error('Email and password are required to sign in.')
    }

    await signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    })
  } catch (error) {
    setAuthErrorMessage(error?.message || 'Something went sideways while talking to auth.')
  } finally {
    setIsAuthSubmitting(false)
  }
}

export async function orchestrateProfileSignOut({
  signOut,
  setAuthErrorMessage,
  setAuthNoticeMessage,
  setProfileSaveNotice,
  setAuthMode,
  setIsProfileViewOpen,
}) {
  setAuthErrorMessage('')
  setAuthNoticeMessage('')
  setProfileSaveNotice('')

  try {
    await signOut()
    setAuthMode('sign_in')
    setAuthNoticeMessage('Signed out. Sign back in when you are ready.')
    setIsProfileViewOpen(false)
  } catch (error) {
    setAuthErrorMessage(error?.message || 'Something went sideways while signing out.')
  }
}

export async function orchestrateThemePreferenceChange({
  nextThemePreference,
  isCoachBootstrapState,
  updateCoachProfile,
  updateAthleteProfile,
  setAuthErrorMessage,
  setAuthNoticeMessage,
  setProfileSaveNotice,
  logger = console,
}) {
  setAuthErrorMessage('')
  setAuthNoticeMessage('')
  setProfileSaveNotice('')

  try {
    await updateProfileByRole({
      isCoachBootstrapState,
      updateCoachProfile,
      updateAthleteProfile,
      coachUpdates: { themePreference: nextThemePreference },
    })
  } catch (error) {
    logger.warn('[theme-preference-change]', error)
  }
}

export async function orchestrateUnitsPreferenceChange({
  updates = {},
  profileViewProfile,
  isCoachBootstrapState,
  updateCoachProfile,
  updateAthleteProfile,
  logger = console,
}) {
  const nextWeightUnitPreference = updates.weightUnitPreference || profileViewProfile?.weightUnitPreference || 'lb'
  const nextDistanceUnitPreference = updates.distanceUnitPreference || profileViewProfile?.distanceUnitPreference || 'km'
  const nextUnitsPreference = nextWeightUnitPreference === 'kg' ? 'metric' : 'imperial'

  try {
    await updateProfileByRole({
      isCoachBootstrapState,
      updateCoachProfile,
      updateAthleteProfile,
      coachUpdates: {
        weightUnitPreference: nextWeightUnitPreference,
        distanceUnitPreference: nextDistanceUnitPreference,
      },
      athleteUpdates: {
        unitsPreference: nextUnitsPreference,
        weightUnitPreference: nextWeightUnitPreference,
        distanceUnitPreference: nextDistanceUnitPreference,
      },
    })
  } catch (error) {
    logger.warn('[units-preference-change]', error)
  }
}

export async function orchestrateSaveProfile({
  profileDraft,
  isCoachBootstrapState,
  updateCoachProfile,
  updateAthleteProfile,
  setAuthErrorMessage,
  setAuthNoticeMessage,
  setProfileSaveNotice,
  setIsProfileSaving,
}) {
  setAuthErrorMessage('')
  setAuthNoticeMessage('')
  setProfileSaveNotice('')
  setIsProfileSaving(true)

  try {
    await updateProfileByRole({
      isCoachBootstrapState,
      updateCoachProfile,
      updateAthleteProfile,
      coachUpdates: profileDraft,
    })
    setProfileSaveNotice('Profile updated.')
  } catch (error) {
    setAuthErrorMessage(error?.message || 'Something went sideways while saving the profile.')
  } finally {
    setIsProfileSaving(false)
  }
}

export async function orchestrateSaveCoachReadinessMetric({
  selectedCoachAthlete,
  createCoachBodyMetricLog,
  setCoachMetricNotice,
  setCoachMetricError,
  setIsCoachMetricSaving,
}) {
  setCoachMetricNotice('')
  setCoachMetricError('')
  setIsCoachMetricSaving(true)

  try {
    if (!selectedCoachAthlete?.athleteProfileId) {
      throw new Error('Selected athlete is not linked to a backend athlete profile yet.')
    }

    if (!Number.isFinite(selectedCoachAthlete?.readinessPercent)) {
      throw new Error('Enter a readiness percentage before saving this coach snapshot.')
    }

    await createCoachBodyMetricLog({
      athleteId: selectedCoachAthlete.athleteProfileId,
      metricType: 'readiness',
      value: selectedCoachAthlete.readinessPercent ?? null,
      unit: 'percent',
      notes: selectedCoachAthlete.nextActionLabel ?? '',
    })
    setCoachMetricNotice('Readiness snapshot saved.')
  } catch (error) {
    setCoachMetricError(error?.message || 'Something went sideways while saving the coach metric.')
  } finally {
    setIsCoachMetricSaving(false)
  }
}
