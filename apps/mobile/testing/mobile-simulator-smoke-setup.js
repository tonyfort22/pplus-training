export const MOBILE_SMOKE_METRO_PORT = 8084
export const MOBILE_SMOKE_APP_URL = `exp://127.0.0.1:${MOBILE_SMOKE_METRO_PORT}`
export const MOBILE_SMOKE_METRO_COMMAND = `pnpm --dir apps/mobile exec expo start --lan --port ${MOBILE_SMOKE_METRO_PORT} --clear`
export const MOBILE_SMOKE_DEFAULT_SIMULATOR_NAME = 'iPhone 17 Pro'
export const MOBILE_SMOKE_ARTIFACT_ROOT = 'apps/mobile/testing/artifacts'
export const MOBILE_SMOKE_ARTIFACT_RETENTION_POLICY = 'clean-passed-retain-failed'

function freezeScenario(scenario) {
  return Object.freeze({
    ...scenario,
    env: Object.freeze({ ...scenario.env }),
    workflowSafety: Object.freeze({
      ...scenario.workflowSafety,
      liveRecordSafety: Object.freeze({
        ...scenario.workflowSafety.liveRecordSafety,
        tables: Object.freeze([...(scenario.workflowSafety.liveRecordSafety?.tables || [])]),
        recordIdMarkers: Object.freeze([...(scenario.workflowSafety.liveRecordSafety?.recordIdMarkers || [])]),
      }),
    }),
    expectedVisibleText: Object.freeze([...scenario.expectedVisibleText]),
    expectedHiddenText: Object.freeze([...(scenario.expectedHiddenText || [])]),
    maestroSetupSteps: Object.freeze([...scenario.maestroSetupSteps]),
  })
}

function noLiveRecords(proof) {
  return Object.freeze({
    mode: 'no_live_records',
    proof,
    tables: Object.freeze([]),
    recordIdMarkers: Object.freeze([]),
    cleanupCommand: null,
  })
}

function fullyMocked(proof) {
  return Object.freeze({
    mode: 'fully_mocked',
    proof,
    cleanupCommand: null,
    liveRecordSafety: noLiveRecords(proof),
  })
}

export const MOBILE_SMOKE_SETUP_SCENARIOS = Object.freeze({
  auth_invitation_signed_out: freezeScenario({
    id: 'auth_invitation_signed_out',
    label: 'Signed-out auth and invitation entry',
    bootstrapOverride: 'signed_out',
    maestroFlowPath: 'maestro/login-invite-entry-smoke.yaml',
    workflowSafety: fullyMocked('signed-out local UI only; no authenticated mutation or remote cleanup target'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'signed_out',
    },
    expectedVisibleText: [
      'Sign in',
      'Email',
      'Password',
      'Sign up with invitation code',
      'Invitation code',
      'Continue',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
    ],
  }),
  auth_keyboard_primary_action: freezeScenario({
    id: 'auth_keyboard_primary_action',
    label: 'Signed-out invitation keyboard keeps primary action reachable',
    bootstrapOverride: 'signed_out',
    maestroFlowPath: 'maestro/auth-keyboard-primary-action-smoke.yaml',
    workflowSafety: fullyMocked('signed-out local UI keyboard fixture only; does not submit a remote mutation'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'signed_out',
    },
    expectedVisibleText: [
      'Invitation code',
      'ABC123',
      'Continue',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
      'tapOn: Sign up with invitation code',
      'tapOn: athlete-invitation-code-input',
      'inputText: ABC123',
    ],
  }),
  invited_athlete_completion_safe_fixture: freezeScenario({
    id: 'invited_athlete_completion_safe_fixture',
    label: 'Invited athlete completion safe fixture',
    bootstrapOverride: 'signed_out',
    maestroFlowPath: 'maestro/invitation-completion-safe-fixture-smoke.yaml',
    workflowSafety: fullyMocked('invitation completion fixture intercepts the workflow with mocked API data'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'signed_out',
      EXPO_PUBLIC_PPLUS_INVITATION_COMPLETION_FIXTURE: 'invited_athlete_completion_safe',
    },
    expectedVisibleText: [
      'Invitation code',
      'SAFE11',
      'Athlete onboarding',
      'Get started',
      'Welcome to PPLUS.',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
      'tapOn: Sign up with invitation code',
      'tapOn: athlete-invitation-code-input',
      'inputText: SAFE11',
      'tapOn: Continue',
    ],
  }),
  coach_shell_seeded: freezeScenario({
    id: 'coach_shell_seeded',
    label: 'Seeded coach shell',
    bootstrapOverride: 'authenticated_coach_shell_seeded',
    maestroFlowPath: 'maestro/coach-shell-seeded-context-smoke.yaml',
    workflowSafety: fullyMocked('seeded local bootstrap only; coach shell smoke does not perform writes'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_shell_seeded',
    },
    expectedVisibleText: [
      'Viewing athlete',
      'Thomas Thibault',
      'No workout scheduled',
      'My Programs',
      'My Workouts',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
    ],
  }),
  coach_athlete_switching_safe_fixture: freezeScenario({
    id: 'coach_athlete_switching_safe_fixture',
    label: 'Coach athlete switching safe fixture',
    bootstrapOverride: 'authenticated_coach_athlete_switching_safe',
    maestroFlowPath: 'maestro/coach-athlete-switching-safe-fixture-smoke.yaml',
    workflowSafety: fullyMocked('coach athlete switching fixture uses seeded local bootstrap and records zero remote fetches'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_athlete_switching_safe',
      EXPO_PUBLIC_PPLUS_COACH_ATHLETE_SWITCHING_FIXTURE: 'coach_athlete_switching_safe',
    },
    expectedVisibleText: [
      'Viewing athlete',
      'Thomas Thibault',
      'Open Athletes',
      'Mia Chen',
      'No workout scheduled',
    ],
    expectedHiddenText: [
      'Coach athlete workspace',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
      'tapOn: Open Athletes',
      'tapOn: Mia Chen',
    ],
  }),
  profile_group_update_safe_fixture: freezeScenario({
    id: 'profile_group_update_safe_fixture',
    label: 'Profile/group update safe fixture',
    bootstrapOverride: 'authenticated_coach_profile_group_update_safe',
    maestroFlowPath: 'maestro/profile-group-update-safe-fixture-smoke.yaml',
    workflowSafety: fullyMocked('profile/group update fixture uses mocked update client and local bootstrap state only'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_profile_group_update_safe',
      EXPO_PUBLIC_PPLUS_PROFILE_GROUP_UPDATE_FIXTURE: 'profile_group_update_safe',
    },
    expectedVisibleText: [
      'Coach Tony',
      'Speed Group',
      'Profile updated.',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
      'tapOn: Open Profile',
      'tapOn: Profile',
      'tapOn: profile-first-name-input',
      'inputText: Coach Safe',
      'tapOn: profile-save-button',
      'tapOn: sheet-back-button',
      'tapOn: profile-close-button',
      'tapOn: bottom-tab-team',
      'tapOn: Speed Group',
      'tapOn: group-name-input',
      'inputText: Safe Group Updated',
      'tapOn: group-save-button',
    ],
  }),
  athlete_train_home_seeded: freezeScenario({
    id: 'athlete_train_home_seeded',
    label: 'Seeded athlete Train/Home',
    bootstrapOverride: 'authenticated_athlete_train_home_seeded',
    maestroFlowPath: 'maestro/athlete-train-home-smoke.yaml',
    workflowSafety: fullyMocked('seeded local bootstrap and local session store; athlete Train/Home smoke has no remote writes'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_athlete_train_home_seeded',
    },
    expectedVisibleText: [
      'Safe Simulator Workout, Off day',
      'My Programs',
      'Safe Simulator Program, Safe Simulator Program, Week 1 of 1. 0 of 1 workouts completed., Week 1 of 1, 0 of 1 workouts',
      'My Workouts',
      'No workout available',
      'Start workout',
    ],
    expectedHiddenText: [
      'Viewing athlete',
      'Create workout',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
    ],
  }),
  safe_workout_seeded: freezeScenario({
    id: 'safe_workout_seeded',
    label: 'Seeded safe workout',
    bootstrapOverride: 'authenticated_coach_safe_workout_seeded',
    workflowSafety: fullyMocked('seeded local bootstrap and local session store; safe workout smoke has no remote writes'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_safe_workout_seeded',
    },
    expectedVisibleText: [
      'Viewing athlete',
      'Mia Chen',
      'Safe Simulator Workout',
      'Barbell Back Squat',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
    ],
  }),
  start_workout_safe_fixture: freezeScenario({
    id: 'start_workout_safe_fixture',
    label: 'Start workout safe fixture',
    bootstrapOverride: 'authenticated_coach_start_workout_safe',
    maestroFlowPath: 'maestro/start-workout-safe-fixture-smoke.yaml',
    workflowSafety: fullyMocked('start workout fixture uses local session store and records zero remote session writes'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_start_workout_safe',
      EXPO_PUBLIC_PPLUS_START_WORKOUT_FIXTURE: 'start_workout_safe',
    },
    expectedVisibleText: [
      'Viewing athlete',
      'Mia Chen',
      'Safe Simulator Workout',
      'Start Workout',
      '1 Exercises',
      '0/2 Sets',
      'Barbell Back Squat',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
      'tapOn: floating-start-workout-button',
    ],
  }),
  log_set_safe_fixture: freezeScenario({
    id: 'log_set_safe_fixture',
    label: 'Log set safe fixture',
    bootstrapOverride: 'authenticated_coach_log_set_safe',
    maestroFlowPath: 'maestro/log-set-safe-fixture-smoke.yaml',
    workflowSafety: fullyMocked('log set fixture uses local session store and mocked persistence only'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_log_set_safe',
      EXPO_PUBLIC_PPLUS_LOG_SET_FIXTURE: 'log_set_safe',
    },
    expectedVisibleText: [
      'Viewing athlete',
      'Mia Chen',
      'Safe Simulator Workout',
      '1 Exercises',
      '1/2 Sets',
      'Barbell Back Squat',
      'DONE',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
      'tapOn: floating-start-workout-button',
      'tapOn: active-workout-set-1-done-button',
    ],
  }),
  active_workout_seeded: freezeScenario({
    id: 'active_workout_seeded',
    label: 'Seeded safe active workout open',
    bootstrapOverride: 'authenticated_coach_safe_workout_seeded',
    maestroFlowPath: 'maestro/active-workout-open-smoke.yaml',
    workflowSafety: fullyMocked('seeded local bootstrap and local session store; active workout open smoke has no remote writes'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_safe_workout_seeded',
    },
    expectedVisibleText: [
      'Viewing athlete',
      'Mia Chen',
      'Safe Simulator Workout',
      '1 Exercises',
      '0/2 Sets',
      'Barbell Back Squat',
      'EFFORT',
      'LB',
      'REPS',
      'DONE',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
      'tapOn: floating-start-workout-button',
    ],
  }),
  bottom_tab_navigation_seeded: freezeScenario({
    id: 'bottom_tab_navigation_seeded',
    label: 'Seeded bottom tab navigation',
    bootstrapOverride: 'authenticated_coach_shell_seeded',
    maestroFlowPath: 'maestro/bottom-tab-navigation-smoke.yaml',
    workflowSafety: fullyMocked('seeded local bootstrap only; bottom tab navigation smoke does not perform writes'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_shell_seeded',
    },
    expectedVisibleText: [
      'Viewing athlete',
      'Thomas Thibault',
      'ANALYTICS',
      'Progress',
      'Groups',
      'Open Speed Group',
      'Create a group',
      'Athletes',
      'Mia Chen',
      'No workout scheduled',
      'My Programs',
      'My Workouts',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
      'tapOn: bottom-tab-progress',
      'tapOn: bottom-tab-team',
      'tapOn: bottom-tab-inbox',
    ],
  }),
  assigned_program_seeded: freezeScenario({
    id: 'assigned_program_seeded',
    label: 'Seeded assigned program',
    bootstrapOverride: 'authenticated_coach_assigned_program_seeded',
    workflowSafety: fullyMocked('seeded local bootstrap only; assigned program smoke does not perform writes'),
    env: {
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_assigned_program_seeded',
    },
    expectedVisibleText: [
      'Viewing athlete',
      'Safe Assigned Program',
      'Safe Assigned Workout',
      'Week 1',
    ],
    maestroSetupSteps: [
      'stopApp',
      `openLink: ${MOBILE_SMOKE_APP_URL}`,
    ],
  }),
})

export function getMobileSmokeSetupScenario(scenarioId) {
  const scenario = MOBILE_SMOKE_SETUP_SCENARIOS[scenarioId]
  if (!scenario) {
    throw new Error(`Unknown mobile smoke setup scenario: ${scenarioId}`)
  }
  return scenario
}

export function buildMobileSmokeMetroCommand(scenarioId) {
  const scenario = getMobileSmokeSetupScenario(scenarioId)
  const envPrefix = Object.entries(scenario.env)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')
  return `${envPrefix} ${MOBILE_SMOKE_METRO_COMMAND}`
}

export function buildMobileSmokeMaestroCommand(
  scenarioId,
  { simulatorName = MOBILE_SMOKE_DEFAULT_SIMULATOR_NAME } = {},
) {
  const scenario = getMobileSmokeSetupScenario(scenarioId)
  const artifactPaths = buildMobileSmokeArtifactPaths(scenarioId)

  if (!scenario.maestroFlowPath) {
    throw new Error(`Mobile smoke scenario does not define a Maestro flow: ${scenarioId}`)
  }

  return [
    `mkdir -p ${artifactPaths.artifactDir}`,
    `MAESTRO_DEVICE_NAME=${JSON.stringify(simulatorName)}`,
    `MAESTRO_DEVICE_UDID="$(xcrun simctl list devices booted | awk -v name=\"$MAESTRO_DEVICE_NAME\" '$0 ~ name && $0 ~ /Booted/ { match($0, /\\([0-9A-F-]+\\)/); if (RSTART) { print substr($0, RSTART + 1, RLENGTH - 2); exit } }')"`,
    `test -n "$MAESTRO_DEVICE_UDID"`,
    `maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output ${artifactPaths.junitPath} --debug-output ${artifactPaths.debugOutputDir} ${scenario.maestroFlowPath} 2>&1 | tee ${artifactPaths.consoleLogPath}`,
    `xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot ${artifactPaths.screenshotPath}`,
  ].join(' && ')
}

export function buildMobileSmokeArtifactPaths(scenarioId) {
  const scenario = getMobileSmokeSetupScenario(scenarioId)
  const artifactDir = `${MOBILE_SMOKE_ARTIFACT_ROOT}/${scenario.id}`

  return Object.freeze({
    artifactDir,
    junitPath: `${artifactDir}/maestro-junit.xml`,
    consoleLogPath: `${artifactDir}/maestro-console.log`,
    debugOutputDir: `${artifactDir}/maestro-debug`,
    screenshotPath: `${artifactDir}/screenshot.png`,
  })
}

export function buildMobileSmokeArtifactCleanupCommand(scenarioId) {
  const { artifactDir } = buildMobileSmokeArtifactPaths(scenarioId)
  return `rm -rf ${artifactDir}`
}

export function getUnsafeLiveMobileTestRecordScenarios({ scenarios = MOBILE_SMOKE_SETUP_SCENARIOS } = {}) {
  return Object.freeze(Object.entries(scenarios).flatMap(([scenarioId, scenario]) => {
    const liveRecordSafety = scenario.workflowSafety?.liveRecordSafety

    if (!liveRecordSafety) {
      return [{ scenarioId, reason: 'missing liveRecordSafety declaration' }]
    }

    if (liveRecordSafety.mode === 'no_live_records') {
      const hasUnsafeResidue = liveRecordSafety.cleanupCommand !== null
        || liveRecordSafety.tables.length > 0
        || liveRecordSafety.recordIdMarkers.length > 0

      return hasUnsafeResidue
        ? [{ scenarioId, reason: 'no_live_records scenarios must not name cleanup tables, record markers, or cleanup commands' }]
        : []
    }

    if (liveRecordSafety.mode === 'cleanup_required') {
      const hasCleanupProof = typeof liveRecordSafety.cleanupCommand === 'string'
        && liveRecordSafety.cleanupCommand.trim() !== ''
        && liveRecordSafety.tables.length > 0
        && liveRecordSafety.recordIdMarkers.length > 0

      return hasCleanupProof
        ? []
        : [{ scenarioId, reason: 'cleanup_required scenarios must declare cleanupCommand, affected tables, and test record id markers' }]
    }

    return [{ scenarioId, reason: `unsupported liveRecordSafety mode: ${liveRecordSafety.mode}` }]
  }))
}

export function assertNoUnsafeLiveMobileTestRecords(options = {}) {
  const unsafeScenarios = getUnsafeLiveMobileTestRecordScenarios(options)

  if (unsafeScenarios.length > 0) {
    throw new Error([
      'Unsafe live mobile test record residue risk detected.',
      ...unsafeScenarios.map((scenario) => `- ${scenario.scenarioId}: ${scenario.reason}`),
    ].join('\n'))
  }

  return Object.freeze({ unsafeScenarios })
}
