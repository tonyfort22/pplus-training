import test from 'node:test'
import assert from 'node:assert/strict'

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createMobileAppBootstrap } from '../apps/mobile/src/auth/bootstrap.js'
import { orchestrateCompleteSet } from '../apps/mobile/src/train/active-workout-mutations.js'
import { orchestrateStartWorkoutFromSheet } from '../apps/mobile/src/train/start-workout-selection.js'
import {
  MOBILE_SMOKE_ARTIFACT_ROOT,
  MOBILE_SMOKE_ARTIFACT_RETENTION_POLICY,
  MOBILE_SMOKE_DEFAULT_SIMULATOR_NAME,
  MOBILE_SMOKE_APP_URL,
  MOBILE_SMOKE_METRO_PORT,
  MOBILE_SMOKE_SETUP_SCENARIOS,
  assertNoUnsafeLiveMobileTestRecords,
  buildMobileSmokeArtifactCleanupCommand,
  buildMobileSmokeArtifactPaths,
  buildMobileSmokeMaestroCommand,
  buildMobileSmokeMetroCommand,
  getMobileSmokeSetupScenario,
  getUnsafeLiveMobileTestRecordScenarios,
} from '../apps/mobile/testing/mobile-simulator-smoke-setup.js'

test('mobile simulator smoke setup registry owns deterministic app setup per scenario', () => {
  assert.equal(MOBILE_SMOKE_METRO_PORT, 8084)
  assert.equal(MOBILE_SMOKE_APP_URL, 'exp://127.0.0.1:8084')

  assert.deepEqual(Object.keys(MOBILE_SMOKE_SETUP_SCENARIOS), [
    'auth_invitation_signed_out',
    'auth_keyboard_primary_action',
    'invited_athlete_completion_safe_fixture',
    'coach_shell_seeded',
    'coach_athlete_switching_safe_fixture',
    'profile_group_update_safe_fixture',
    'athlete_train_home_seeded',
    'safe_workout_seeded',
    'start_workout_safe_fixture',
    'log_set_safe_fixture',
    'active_workout_seeded',
    'bottom_tab_navigation_seeded',
    'assigned_program_seeded',
  ])

  const authInvitation = getMobileSmokeSetupScenario('auth_invitation_signed_out')
  assert.equal(authInvitation.bootstrapOverride, 'signed_out')
  assert.equal(authInvitation.maestroFlowPath, 'maestro/login-invite-entry-smoke.yaml')
  assert.deepEqual(authInvitation.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'signed_out',
  })
  assert.deepEqual(authInvitation.expectedVisibleText, [
    'Sign in',
    'Email',
    'Password',
    'Sign up with invitation code',
    'Invitation code',
    'Continue',
  ])
  assert.equal(existsSync(resolve(process.cwd(), authInvitation.maestroFlowPath)), true)

  const authKeyboard = getMobileSmokeSetupScenario('auth_keyboard_primary_action')
  assert.equal(authKeyboard.bootstrapOverride, 'signed_out')
  assert.equal(authKeyboard.maestroFlowPath, 'maestro/auth-keyboard-primary-action-smoke.yaml')
  assert.deepEqual(authKeyboard.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'signed_out',
  })
  assert.deepEqual(authKeyboard.expectedVisibleText, [
    'Invitation code',
    'ABC123',
    'Continue',
  ])
  assert.deepEqual(authKeyboard.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
    'tapOn: Sign up with invitation code',
    'tapOn: athlete-invitation-code-input',
    'inputText: ABC123',
  ])
  assert.equal(existsSync(resolve(process.cwd(), authKeyboard.maestroFlowPath)), true)

  const safeCompletion = getMobileSmokeSetupScenario('invited_athlete_completion_safe_fixture')
  assert.equal(safeCompletion.bootstrapOverride, 'signed_out')
  assert.equal(safeCompletion.maestroFlowPath, 'maestro/invitation-completion-safe-fixture-smoke.yaml')
  assert.deepEqual(safeCompletion.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'signed_out',
    EXPO_PUBLIC_PPLUS_INVITATION_COMPLETION_FIXTURE: 'invited_athlete_completion_safe',
  })
  assert.deepEqual(safeCompletion.expectedVisibleText, [
    'Invitation code',
    'SAFE11',
    'Athlete onboarding',
    'Get started',
    'Welcome to PPLUS.',
  ])
  assert.deepEqual(safeCompletion.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
    'tapOn: Sign up with invitation code',
    'tapOn: athlete-invitation-code-input',
    'inputText: SAFE11',
    'tapOn: Continue',
  ])
  assert.equal(existsSync(resolve(process.cwd(), safeCompletion.maestroFlowPath)), true)

  const coachShell = getMobileSmokeSetupScenario('coach_shell_seeded')
  assert.equal(coachShell.bootstrapOverride, 'authenticated_coach_shell_seeded')
  assert.equal(coachShell.maestroFlowPath, 'maestro/coach-shell-seeded-context-smoke.yaml')
  assert.deepEqual(coachShell.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_shell_seeded',
  })
  assert.deepEqual(coachShell.expectedVisibleText, [
    'Viewing athlete',
    'Thomas Thibault',
    'No workout scheduled',
    'My Programs',
    'My Workouts',
  ])
  assert.equal(existsSync(resolve(process.cwd(), coachShell.maestroFlowPath)), true)

  const coachSwitching = getMobileSmokeSetupScenario('coach_athlete_switching_safe_fixture')
  assert.equal(coachSwitching.bootstrapOverride, 'authenticated_coach_athlete_switching_safe')
  assert.equal(coachSwitching.maestroFlowPath, 'maestro/coach-athlete-switching-safe-fixture-smoke.yaml')
  assert.deepEqual(coachSwitching.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_athlete_switching_safe',
    EXPO_PUBLIC_PPLUS_COACH_ATHLETE_SWITCHING_FIXTURE: 'coach_athlete_switching_safe',
  })
  assert.deepEqual(coachSwitching.expectedVisibleText, [
    'Viewing athlete',
    'Thomas Thibault',
    'Open Athletes',
    'Mia Chen',
    'No workout scheduled',
  ])
  assert.deepEqual(coachSwitching.expectedHiddenText, [
    'Coach athlete workspace',
  ])
  assert.deepEqual(coachSwitching.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
    'tapOn: Open Athletes',
    'tapOn: Mia Chen',
  ])
  assert.equal(existsSync(resolve(process.cwd(), coachSwitching.maestroFlowPath)), true)

  const profileGroupUpdate = getMobileSmokeSetupScenario('profile_group_update_safe_fixture')
  assert.equal(profileGroupUpdate.bootstrapOverride, 'authenticated_coach_profile_group_update_safe')
  assert.equal(profileGroupUpdate.maestroFlowPath, 'maestro/profile-group-update-safe-fixture-smoke.yaml')
  assert.deepEqual(profileGroupUpdate.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_profile_group_update_safe',
    EXPO_PUBLIC_PPLUS_PROFILE_GROUP_UPDATE_FIXTURE: 'profile_group_update_safe',
  })
  assert.deepEqual(profileGroupUpdate.expectedVisibleText, [
    'Coach Tony',
    'Speed Group',
    'Profile updated.',
  ])
  assert.deepEqual(profileGroupUpdate.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
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
  ])
  assert.equal(existsSync(resolve(process.cwd(), profileGroupUpdate.maestroFlowPath)), true)

  const athleteTrainHome = getMobileSmokeSetupScenario('athlete_train_home_seeded')
  assert.equal(athleteTrainHome.bootstrapOverride, 'authenticated_athlete_train_home_seeded')
  assert.equal(athleteTrainHome.maestroFlowPath, 'maestro/athlete-train-home-smoke.yaml')
  assert.deepEqual(athleteTrainHome.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_athlete_train_home_seeded',
  })
  assert.deepEqual(athleteTrainHome.expectedVisibleText, [
    'Safe Simulator Workout, Off day',
    'My Programs',
    'Safe Simulator Program, Safe Simulator Program, Week 1 of 1. 0 of 1 workouts completed., Week 1 of 1, 0 of 1 workouts',
    'My Workouts',
    'No workout available',
    'Start workout',
  ])
  assert.deepEqual(athleteTrainHome.expectedHiddenText, [
    'Viewing athlete',
    'Create workout',
  ])
  assert.equal(existsSync(resolve(process.cwd(), athleteTrainHome.maestroFlowPath)), true)

  const safeWorkout = getMobileSmokeSetupScenario('safe_workout_seeded')
  assert.equal(safeWorkout.bootstrapOverride, 'authenticated_coach_safe_workout_seeded')
  assert.deepEqual(safeWorkout.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_safe_workout_seeded',
  })
  assert.deepEqual(safeWorkout.expectedVisibleText, [
    'Viewing athlete',
    'Mia Chen',
    'Safe Simulator Workout',
    'Barbell Back Squat',
  ])
  assert.deepEqual(safeWorkout.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
  ])

  const startWorkout = getMobileSmokeSetupScenario('start_workout_safe_fixture')
  assert.equal(startWorkout.bootstrapOverride, 'authenticated_coach_start_workout_safe')
  assert.equal(startWorkout.maestroFlowPath, 'maestro/start-workout-safe-fixture-smoke.yaml')
  assert.deepEqual(startWorkout.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_start_workout_safe',
    EXPO_PUBLIC_PPLUS_START_WORKOUT_FIXTURE: 'start_workout_safe',
  })
  assert.deepEqual(startWorkout.expectedVisibleText, [
    'Viewing athlete',
    'Mia Chen',
    'Safe Simulator Workout',
    'Start Workout',
    '1 Exercises',
    '0/2 Sets',
    'Barbell Back Squat',
  ])
  assert.deepEqual(startWorkout.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
    'tapOn: floating-start-workout-button',
  ])
  assert.equal(existsSync(resolve(process.cwd(), startWorkout.maestroFlowPath)), true)

  const logSet = getMobileSmokeSetupScenario('log_set_safe_fixture')
  assert.equal(logSet.bootstrapOverride, 'authenticated_coach_log_set_safe')
  assert.equal(logSet.maestroFlowPath, 'maestro/log-set-safe-fixture-smoke.yaml')
  assert.deepEqual(logSet.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_log_set_safe',
    EXPO_PUBLIC_PPLUS_LOG_SET_FIXTURE: 'log_set_safe',
  })
  assert.deepEqual(logSet.expectedVisibleText, [
    'Viewing athlete',
    'Mia Chen',
    'Safe Simulator Workout',
    '1 Exercises',
    '1/2 Sets',
    'Barbell Back Squat',
    'DONE',
  ])
  assert.deepEqual(logSet.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
    'tapOn: floating-start-workout-button',
    'tapOn: active-workout-set-1-done-button',
  ])
  assert.equal(existsSync(resolve(process.cwd(), logSet.maestroFlowPath)), true)

  const activeWorkout = getMobileSmokeSetupScenario('active_workout_seeded')
  assert.equal(activeWorkout.bootstrapOverride, 'authenticated_coach_safe_workout_seeded')
  assert.equal(activeWorkout.maestroFlowPath, 'maestro/active-workout-open-smoke.yaml')
  assert.deepEqual(activeWorkout.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_safe_workout_seeded',
  })
  assert.deepEqual(activeWorkout.expectedVisibleText, [
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
  ])
  assert.deepEqual(activeWorkout.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
    'tapOn: floating-start-workout-button',
  ])
  assert.equal(existsSync(resolve(process.cwd(), activeWorkout.maestroFlowPath)), true)


  const bottomTabs = getMobileSmokeSetupScenario('bottom_tab_navigation_seeded')
  assert.equal(bottomTabs.bootstrapOverride, 'authenticated_coach_shell_seeded')
  assert.equal(bottomTabs.maestroFlowPath, 'maestro/bottom-tab-navigation-smoke.yaml')
  assert.deepEqual(bottomTabs.env, {
    EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_coach_shell_seeded',
  })
  assert.deepEqual(bottomTabs.expectedVisibleText, [
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
  ])
  assert.deepEqual(bottomTabs.maestroSetupSteps, [
    'stopApp',
    'openLink: exp://127.0.0.1:8084',
    'tapOn: bottom-tab-progress',
    'tapOn: bottom-tab-team',
    'tapOn: bottom-tab-inbox',
  ])
  assert.equal(existsSync(resolve(process.cwd(), bottomTabs.maestroFlowPath)), true)

  assert.throws(() => getMobileSmokeSetupScenario('missing'), /Unknown mobile smoke setup scenario: missing/)
})

test('mobile simulator smoke workflows declare cleanup or fully mocked proof', () => {
  const scenarioEntries = Object.entries(MOBILE_SMOKE_SETUP_SCENARIOS)

  assert.equal(scenarioEntries.length > 0, true)

  for (const [scenarioId, scenario] of scenarioEntries) {
    assert.equal(typeof scenario.workflowSafety, 'object', `${scenarioId} must declare workflowSafety`)
    assert.match(scenario.workflowSafety.mode, /^(fully_mocked|cleanup_required)$/, `${scenarioId} must declare a valid safety mode`)
    assert.equal(typeof scenario.workflowSafety.proof, 'string', `${scenarioId} must explain its safety proof`)
    assert.notEqual(scenario.workflowSafety.proof.trim(), '', `${scenarioId} safety proof cannot be empty`)
    assert.equal(typeof scenario.workflowSafety.liveRecordSafety, 'object', `${scenarioId} must declare liveRecordSafety`)
    assert.match(scenario.workflowSafety.liveRecordSafety.mode, /^(no_live_records|cleanup_required)$/, `${scenarioId} must declare live record residue mode`)
    assert.match(scenario.workflowSafety.liveRecordSafety.proof, /\S/, `${scenarioId} must explain why live test records are not left behind`)

    if (scenario.workflowSafety.mode === 'fully_mocked') {
      assert.equal(scenario.workflowSafety.cleanupCommand, null, `${scenarioId} should not claim cleanup for a fully mocked/local workflow`)
      assert.equal(scenario.workflowSafety.liveRecordSafety.mode, 'no_live_records', `${scenarioId} fully mocked workflows must not leave live records behind`)
      assert.deepEqual(scenario.workflowSafety.liveRecordSafety.tables, Object.freeze([]), `${scenarioId} no-live-record workflows should not name live DB tables`)
      assert.deepEqual(scenario.workflowSafety.liveRecordSafety.recordIdMarkers, Object.freeze([]), `${scenarioId} no-live-record workflows should not name live record markers`)
      assert.equal(scenario.workflowSafety.liveRecordSafety.cleanupCommand, null, `${scenarioId} no-live-record workflows should not require cleanup`)
      assert.match(
        scenario.workflowSafety.proof,
        /(signed-out local UI|fixture|seeded local bootstrap|local session store|mocked update client)/i,
        `${scenarioId} must prove why no remote cleanup is needed`,
      )
    }

    if (scenario.workflowSafety.mode === 'cleanup_required') {
      assert.equal(typeof scenario.workflowSafety.cleanupCommand, 'string', `${scenarioId} cleanup-required workflow must provide cleanupCommand`)
      assert.match(scenario.workflowSafety.cleanupCommand, /delete|cleanup|remove|reset|rm -rf/i)
    }
  }
})

test('mobile simulator smoke workflows fail if unsafe live test record residue is possible', () => {
  assert.deepEqual(getUnsafeLiveMobileTestRecordScenarios(), Object.freeze([]))
  assert.deepEqual(assertNoUnsafeLiveMobileTestRecords(), Object.freeze({ unsafeScenarios: Object.freeze([]) }))

  const unsafeScenarios = {
    unsafe_live_write: {
      workflowSafety: {
        liveRecordSafety: {
          mode: 'cleanup_required',
          proof: 'writes a live test row',
          tables: [],
          recordIdMarkers: [],
          cleanupCommand: null,
        },
      },
    },
  }

  assert.deepEqual(getUnsafeLiveMobileTestRecordScenarios({ scenarios: unsafeScenarios }), Object.freeze([
    {
      scenarioId: 'unsafe_live_write',
      reason: 'cleanup_required scenarios must declare cleanupCommand, affected tables, and test record id markers',
    },
  ]))
  assert.throws(
    () => assertNoUnsafeLiveMobileTestRecords({ scenarios: unsafeScenarios }),
    /Unsafe live mobile test record residue risk detected\./,
  )
})

test('mobile simulator smoke setup builds the canonical tracked Metro startup command', () => {
  assert.equal(MOBILE_SMOKE_DEFAULT_SIMULATOR_NAME, 'iPhone 17 Pro')
  assert.equal(MOBILE_SMOKE_ARTIFACT_ROOT, 'apps/mobile/testing/artifacts')
  assert.equal(MOBILE_SMOKE_ARTIFACT_RETENTION_POLICY, 'clean-passed-retain-failed')
  assert.equal(
    buildMobileSmokeMetroCommand('auth_invitation_signed_out'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=signed_out pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('coach_shell_seeded'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_coach_shell_seeded pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('coach_athlete_switching_safe_fixture'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_coach_athlete_switching_safe EXPO_PUBLIC_PPLUS_COACH_ATHLETE_SWITCHING_FIXTURE=coach_athlete_switching_safe pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('profile_group_update_safe_fixture'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_coach_profile_group_update_safe EXPO_PUBLIC_PPLUS_PROFILE_GROUP_UPDATE_FIXTURE=profile_group_update_safe pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('athlete_train_home_seeded'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_athlete_train_home_seeded pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('invited_athlete_completion_safe_fixture'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=signed_out EXPO_PUBLIC_PPLUS_INVITATION_COMPLETION_FIXTURE=invited_athlete_completion_safe pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('start_workout_safe_fixture'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_coach_start_workout_safe EXPO_PUBLIC_PPLUS_START_WORKOUT_FIXTURE=start_workout_safe pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('log_set_safe_fixture'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_coach_log_set_safe EXPO_PUBLIC_PPLUS_LOG_SET_FIXTURE=log_set_safe pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('active_workout_seeded'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_coach_safe_workout_seeded pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('bottom_tab_navigation_seeded'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_coach_shell_seeded pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )
  assert.equal(
    buildMobileSmokeMetroCommand('assigned_program_seeded'),
    'EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE=authenticated_coach_assigned_program_seeded pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear',
  )

  const maestroCommand = buildMobileSmokeMaestroCommand('bottom_tab_navigation_seeded')
  const artifactPaths = buildMobileSmokeArtifactPaths('bottom_tab_navigation_seeded')
  assert.deepEqual(artifactPaths, Object.freeze({
    artifactDir: 'apps/mobile/testing/artifacts/bottom_tab_navigation_seeded',
    junitPath: 'apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-junit.xml',
    consoleLogPath: 'apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-console.log',
    debugOutputDir: 'apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-debug',
    screenshotPath: 'apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/screenshot.png',
  }))
  assert.match(maestroCommand, /mkdir -p apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded/)
  assert.match(maestroCommand, /MAESTRO_DEVICE_NAME="iPhone 17 Pro"/)
  assert.match(maestroCommand, /xcrun simctl list devices booted/)
  assert.match(maestroCommand, /test -n "\$MAESTRO_DEVICE_UDID"/)
  assert.match(maestroCommand, /maestro test --device "\$MAESTRO_DEVICE_UDID" --format JUNIT/)
  assert.match(maestroCommand, /--output apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded\/maestro-junit\.xml/)
  assert.match(maestroCommand, /--debug-output apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded\/maestro-debug/)
  assert.match(maestroCommand, /maestro\/bottom-tab-navigation-smoke\.yaml 2>&1 \| tee apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded\/maestro-console\.log/)
  assert.match(maestroCommand, /xcrun simctl io "\$MAESTRO_DEVICE_UDID" screenshot apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded\/screenshot\.png/)
  assert.equal(
    buildMobileSmokeArtifactCleanupCommand('bottom_tab_navigation_seeded'),
    'rm -rf apps/mobile/testing/artifacts/bottom_tab_navigation_seeded',
  )
  assert.match(
    buildMobileSmokeMaestroCommand('bottom_tab_navigation_seeded', { simulatorName: 'iPhone 16' }),
    /MAESTRO_DEVICE_NAME="iPhone 16"/,
  )
  assert.throws(
    () => buildMobileSmokeMaestroCommand('safe_workout_seeded'),
    /Mobile smoke scenario does not define a Maestro flow: safe_workout_seeded/,
  )
})

test('athlete Train/Home smoke bootstrap creates a signed-in athlete train state without coach shell chrome', async () => {
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'remote-should-not-be-used-for-smoke',
      ...getMobileSmokeSetupScenario('athlete_train_home_seeded').env,
    },
  })

  assert.equal(bootstrap.status, 'authenticated')
  assert.equal(bootstrap.role, 'athlete')
  assert.equal(bootstrap.athleteProfile.id, 'ath-preview-1')
  assert.equal(bootstrap.athleteProfile.firstName, 'Thomas')
  assert.equal(bootstrap.trainState.programWorkout.nameSnapshot, 'Safe Simulator Workout')
  assert.equal(bootstrap.sessionStore.identityClient, null)
})

test('safe workout smoke bootstrap creates a local deterministic session despite remote env', async () => {
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'remote-should-not-be-used-for-smoke',
      ...getMobileSmokeSetupScenario('safe_workout_seeded').env,
    },
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.role, 'coach')
  assert.equal(bootstrap.coachProfile.displayName, 'Coach Tony')
  assert.equal(bootstrap.trainState.programWorkout.id, 'pw-safe-simulator-smoke')
  assert.equal(bootstrap.trainState.programWorkout.nameSnapshot, 'Safe Simulator Workout')
  assert.equal(bootstrap.sessionStore.identityClient, null)

  const started = await bootstrap.sessionStore.startSession({ programWorkoutId: 'pw-safe-simulator-smoke' })
  assert.equal(started.session.programWorkoutId, 'pw-safe-simulator-smoke')
  assert.equal(started.session.exercises[0].nameSnapshot, 'Barbell Back Squat')
})


test('start workout safe fixture uses a local session store and zero remote session writes', async () => {
  const startWorkout = getMobileSmokeSetupScenario('start_workout_safe_fixture')
  const flowSource = readFileSync(resolve(process.cwd(), startWorkout.maestroFlowPath), 'utf8')
  const remoteFetches = []
  const setSessionCalls = []
  let activeWorkoutOpened = false
  let workoutSheetOpen = true

  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'remote-should-not-be-used-for-smoke',
      ...startWorkout.env,
    },
    fetchImpl: async (...args) => {
      remoteFetches.push(args)
      throw new Error('start workout safe fixture must not fetch or write remote session data')
    },
  })

  const result = await orchestrateStartWorkoutFromSheet({
    effectiveSessionStore: bootstrap.sessionStore,
    selectedProgramWorkoutId: bootstrap.trainState.programWorkout.id,
    selectedWorkoutSessionPreview: bootstrap.trainState.session,
    startedAt: '2026-06-26T12:00:00.000Z',
    setSession: (nextSession) => setSessionCalls.push(nextSession),
    setIsWorkoutSheetOpen: (nextValue) => { workoutSheetOpen = nextValue },
    setIsStartingWorkout: () => {},
    setIsActiveWorkoutViewOpen: (nextValue) => { activeWorkoutOpened = nextValue },
    runAfterInteractions: (callback) => callback(),
    shouldApplyResolvedSession: () => true,
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.sessionStore.identityClient, null)
  assert.equal(bootstrap.trainState.programWorkout.id, 'pw-safe-simulator-smoke')
  assert.equal(remoteFetches.length, 0)
  assert.equal(result.outcome, 'optimistic-session-opened')
  assert.equal(activeWorkoutOpened, true)
  assert.equal(workoutSheetOpen, false)
  assert.equal(setSessionCalls.at(-1).programWorkoutId, 'pw-safe-simulator-smoke')
  assert.equal(setSessionCalls.at(-1).exercises[0].nameSnapshot, 'Barbell Back Squat')
  assert.match(flowSource, /openLink: exp:\/\/127\.0\.0\.1:8084/)
  assert.match(flowSource, /id: "floating-start-workout-button"/)
  assert.match(flowSource, /Safe Simulator Workout/)
  assert.match(flowSource, /1 Exercises/)
})


test('log set safe fixture completes a set through the local mocked session store only', async () => {
  const logSet = getMobileSmokeSetupScenario('log_set_safe_fixture')
  const flowSource = readFileSync(resolve(process.cwd(), logSet.maestroFlowPath), 'utf8')
  const remoteFetches = []
  const persistedSessions = []

  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'remote-should-not-be-used-for-smoke',
      ...logSet.env,
    },
    fetchImpl: async (...args) => {
      remoteFetches.push(args)
      throw new Error('log set safe fixture must not fetch or write remote session data')
    },
  })

  const started = await bootstrap.sessionStore.startSession({
    programWorkoutId: bootstrap.trainState.programWorkout.id,
    startedAt: '2026-06-26T12:00:00.000Z',
  })
  const session = started.session
  const exerciseId = session.exercises[0].id
  const setId = session.exercises[0].sets[0].id

  await orchestrateCompleteSet({
    session,
    exerciseId,
    setId,
    persistSessionUpdateOptimistic: (nextSession) => {
      persistedSessions.push(nextSession)
      bootstrap.sessionStore.saveSession(nextSession)
    },
    setPostSetEffortAdjustment: () => {},
  })

  const completedSession = persistedSessions.at(-1)
  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.sessionStore.identityClient, null)
  assert.equal(bootstrap.trainState.programWorkout.id, 'pw-safe-simulator-smoke')
  assert.equal(remoteFetches.length, 0)
  assert.equal(completedSession.programWorkoutId, 'pw-safe-simulator-smoke')
  assert.equal(completedSession.completedSetsCount, 1)
  assert.equal(completedSession.totalSetsCount, 2)
  assert.equal(completedSession.exercises[0].sets[0].isCompleted, true)
  assert.match(flowSource, /openLink: exp:\/\/127\.0\.0\.1:8084/)
  assert.match(flowSource, /id: "floating-start-workout-button"/)
  assert.match(flowSource, /id: "active-workout-set-1-done-button"/)
  assert.match(flowSource, /1\/2 Sets/)
})


test('active workout smoke flow opens the seeded safe workout with stable selectors', async () => {
  const activeWorkout = getMobileSmokeSetupScenario('active_workout_seeded')
  const flowSource = readFileSync(resolve(process.cwd(), activeWorkout.maestroFlowPath), 'utf8')
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'remote-should-not-be-used-for-smoke',
      ...activeWorkout.env,
    },
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.sessionStore.identityClient, null)
  assert.equal(bootstrap.trainState.programWorkout.id, 'pw-safe-simulator-smoke')
  assert.match(flowSource, /openLink: exp:\/\/127\.0\.0\.1:8084/)
  assert.match(flowSource, /id: "floating-start-workout-button"/)
  assert.match(flowSource, /1 Exercises/)
  assert.match(flowSource, /0\/2 Sets/)
  assert.match(flowSource, /id: "active-workout-exercise-1-card"/)
  assert.match(flowSource, /id: "active-workout-set-1-load-input"/)
  assert.match(flowSource, /id: "active-workout-set-1-reps-input"/)
  assert.match(flowSource, /id: "active-workout-set-1-done-button"/)
})


test('bottom tab navigation smoke flow visits seeded coach tabs with stable tab ids', async () => {
  const bottomTabs = getMobileSmokeSetupScenario('bottom_tab_navigation_seeded')
  const flowSource = readFileSync(resolve(process.cwd(), bottomTabs.maestroFlowPath), 'utf8')
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'remote-should-not-be-used-for-smoke',
      ...bottomTabs.env,
    },
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.coachProfile.displayName, 'Coach Tony')
  assert.equal(bootstrap.coachAthletes.length, 2)
  assert.equal(bootstrap.coachGroups[0].name, 'Speed Group')
  assert.match(flowSource, /openLink: exp:\/\/127\.0\.0\.1:8084/)
  assert.match(flowSource, /id: "bottom-tab-train"/)
  assert.match(flowSource, /id: "bottom-tab-progress"/)
  assert.match(flowSource, /id: "bottom-tab-team"/)
  assert.match(flowSource, /id: "bottom-tab-inbox"/)
  assert.match(flowSource, /id: "analytics-progress-screen"/)
  assert.match(flowSource, /Speed Group/)
  assert.match(flowSource, /Mia Chen/)
})

test('profile/group update safe fixture uses local bootstrap data and mocked update clients only', async () => {
  const profileGroupUpdate = getMobileSmokeSetupScenario('profile_group_update_safe_fixture')
  const flowSource = readFileSync(resolve(process.cwd(), profileGroupUpdate.maestroFlowPath), 'utf8')
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const providerSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/auth/session-provider.js'), 'utf8')
  const remoteFetches = []

  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'remote-should-not-be-used-for-profile-group-safe-fixture',
      ...profileGroupUpdate.env,
    },
    fetchImpl: async (...args) => {
      remoteFetches.push(args)
      throw new Error('profile/group update safe fixture must not fetch remote profile or group data')
    },
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.role, 'coach')
  assert.equal(bootstrap.coachProfile.displayName, 'Coach Tony')
  assert.equal(bootstrap.coachGroups[0].name, 'Speed Group')
  assert.equal(bootstrap.sessionStore, null)
  assert.equal(remoteFetches.length, 0)

  assert.match(providerSource, /const isProfileGroupUpdateSafeFixture = env\?\.EXPO_PUBLIC_PPLUS_PROFILE_GROUP_UPDATE_FIXTURE === 'profile_group_update_safe'/)
  assert.match(providerSource, /if \(isProfileGroupUpdateSafeFixture\) \{[\s\S]*const updatedCoachProfile = \{[\s\S]*\.\.\.bootstrapState\.coachProfile,[\s\S]*\.\.\.updates,[\s\S]*\}[\s\S]*setBootstrapState\(\(current\) => \(\{[\s\S]*coachProfile: updatedCoachProfile,[\s\S]*\}\)\)[\s\S]*return updatedCoachProfile[\s\S]*\}/)
  assert.match(appSource, /function createProfileGroupUpdateSafeGroupsClient\(\)/)
  assert.match(appSource, /EXPO_PUBLIC_PPLUS_PROFILE_GROUP_UPDATE_FIXTURE === 'profile_group_update_safe'[\s\S]*return createProfileGroupUpdateSafeGroupsClient\(\)/)
  assert.match(appSource, /async updateGroup\(\{ groupId, name, athleteIds = \[\] \} = \{\}\) \{[\s\S]*return \{[\s\S]*id: groupId,[\s\S]*name,[\s\S]*athleteIds,[\s\S]*athleteCount: athleteIds\.length,[\s\S]*\}/)
  assert.match(appSource, /async createGroup\(\{ coachId, name, athleteIds = \[\] \} = \{\}\) \{[\s\S]*id: 'group-profile-update-safe-created',[\s\S]*coachId,[\s\S]*name,[\s\S]*athleteIds,[\s\S]*\}/)
  assert.match(flowSource, /openLink: ["']?exp:\/\/127\.0\.0\.1:8084["']?/)
  assert.match(flowSource, /id: "profile-save-button"/)
  assert.match(flowSource, /id: "bottom-tab-team"/)
  assert.match(flowSource, /id: "group-name-input"/)
  assert.match(flowSource, /Safe Group Updated/)
})

test('coach athlete switching safe fixture uses local roster data and zero remote bootstrap fetches', async () => {
  const coachSwitching = getMobileSmokeSetupScenario('coach_athlete_switching_safe_fixture')
  const flowSource = readFileSync(resolve(process.cwd(), coachSwitching.maestroFlowPath), 'utf8')
  const remoteFetches = []
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'remote-should-not-be-used-for-smoke',
      ...coachSwitching.env,
    },
    fetchImpl: async (...args) => {
      remoteFetches.push(args)
      throw new Error('coach athlete switching safe fixture must not fetch remote data')
    },
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.role, 'coach')
  assert.equal(bootstrap.coachProfile.displayName, 'Coach Tony')
  assert.equal(bootstrap.sessionStore, null)
  assert.equal(remoteFetches.length, 0)
  assert.deepEqual(
    bootstrap.coachAthletes.map((athlete) => [athlete.firstName, athlete.lastName]),
    [
      ['Thomas', 'Thibault'],
      ['Mia', 'Chen'],
    ],
  )
  assert.match(flowSource, /openLink: exp:\/\/127\.0\.0\.1:8084/)
  assert.match(flowSource, /assertVisible: "Thomas Thibault"/)
  assert.match(flowSource, /tapOn: "Open Athletes"/)
  assert.match(flowSource, /tapOn: "Mia Chen"/)
  assert.match(flowSource, /assertVisible: "Mia Chen"/)
  assert.match(flowSource, /assertNotVisible: "Thomas Thibault"/)
})
