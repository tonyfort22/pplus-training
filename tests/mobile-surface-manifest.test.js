import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import * as mobileManifestModule from '../apps/mobile/testing/mobile-surface-manifest.js'
import {
  FULL_MOBILE_SOURCE_TESTS,
  MOBILE_RUNNABLE_TEST_GROUPS,
  MOBILE_AUTH_TESTS,
  MOBILE_SHELL_TESTS,
  MOBILE_TRAIN_TESTS,
  MOBILE_SESSION_TESTS,
  MOBILE_PROGRAM_WORKOUT_TESTS,
  MOBILE_EXERCISE_PROGRESS_TESTS,
  MOBILE_PROFILE_GROUP_TESTS,
  MOBILE_ACCESS_STATE_AUTHENTICATED_ATHLETE,
  MOBILE_ACCESS_STATE_AUTHENTICATED_COACH,
  MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED,
  MOBILE_ACCESS_STATE_CONSTANTS,
  MOBILE_ACCESS_STATE_SESSION_BOOTSTRAP,
  MOBILE_ACCESS_STATE_SIGNED_OUT,
  MOBILE_DATA_SOURCES,
  MOBILE_LAYER_CONSTANTS,
  MOBILE_LAYER_L0,
  MOBILE_LAYER_L1,
  MOBILE_LAYER_L2,
  MOBILE_LAYER_L3,
  MOBILE_LAYER_L4,
  MOBILE_LAYER_L5,
  MOBILE_LAYER_L6,
  MOBILE_LAYER_L7,
  MOBILE_ROLE_ATHLETE,
  MOBILE_ROLE_COACH,
  MOBILE_ROLE_CONSTANTS,
  MOBILE_ROLE_SHARED,
  MOBILE_ROLE_SIGNED_OUT,
  MOBILE_SOURCE_TEST_GROUPS,
  MOBILE_SURFACE_ENTRY_POINTS,
  MOBILE_SURFACE_EXISTING_TEST_FILES,
  MOBILE_SURFACE_ID_CONSTANTS,
  MOBILE_SURFACE_IDS,
  MOBILE_SURFACE_MANIFEST,
  MOBILE_SURFACE_MISSING_LAYERS,
  MOBILE_SURFACE_REQUIRED_LAYERS,
  MOBILE_SURFACE_SOURCE_PATHS,
  MOBILE_SURFACE_TYPE_CONSTANTS,
  MOBILE_SURFACE_TYPE_MODAL,
  MOBILE_SURFACE_TYPE_SCREEN,
  MOBILE_SURFACE_TYPE_SHEET,
  MOBILE_SURFACE_TYPE_TAB,
  MOBILE_SURFACE_TYPE_WORKFLOW,
  MOBILE_SURFACE_TYPES,
  MOBILE_SURFACE_ROLES,
  MOBILE_TEST_LAYERS,
  getMobileSurfaceById,
  getMobileSurfaceCoverageSummary,
  getMobileSurfaceManifest,
} from '../apps/mobile/testing/mobile-surface-manifest.js'

const expectedSurfaceIds = [
  'auth-gate',
  'invitation-code-entry',
  'invite-athlete',
  'athlete-invite-onboarding',
  'loading-surface',
  'app-shell-render-model',
  'top-header',
  'bottom-nav',
  'coach-athlete-selector',
  'coach-athlete-workspace',
  'train-home',
  'train-today-tab',
  'train-program-tab',
  'train-calendar-tab',
  'train-workout-tab',
  'train-session-tab',
  'program-sheet',
  'program-edit-view',
  'training-calendar-sheet',
  'workout-sheet',
  'workout-edit-view',
  'active-workout',
  'workout-finish-flow',
  'workout-discard-flow',
  'add-exercise-flow',
  'exercise-reorder-flow',
  'swipe-delete-set-row-flow',
  'exercise-multi-select',
  'exercise-library',
  'exercise-detail',
  'exercise-video-preview',
  'progress-analytics',
  'team-groups',
  'coach-inbox-placeholder',
  'profile-settings',
  'groups-edit',
  'athlete-multi-select',
  'invitation-success',
]

const expectedSourceGroupIds = [
  'MOBILE_AUTH_TESTS',
  'MOBILE_SHELL_TESTS',
  'MOBILE_TRAIN_TESTS',
  'MOBILE_SESSION_TESTS',
  'MOBILE_PROGRAM_WORKOUT_TESTS',
  'MOBILE_EXERCISE_PROGRESS_TESTS',
  'MOBILE_PROFILE_GROUP_TESTS',
  'MOBILE_TESTING_INFRASTRUCTURE_TESTS',
]

const expectedRunnableGroupIds = [
  ...expectedSourceGroupIds,
  'FULL_MOBILE_SOURCE_TESTS',
]

const expectedSourceGroupLabels = Object.freeze({
  MOBILE_AUTH_TESTS: 'Auth/bootstrap/session provider',
  MOBILE_SHELL_TESTS: 'App shell, header, bottom nav, loading state, theme, and shared primitives',
  MOBILE_TRAIN_TESTS: 'Coach athlete context and Train/Home render models',
  MOBILE_SESSION_TESTS: 'Active workout/session runtime/actions/persistence',
  MOBILE_PROGRAM_WORKOUT_TESTS: 'Workout sheet/edit/program sheet/edit models',
  MOBILE_EXERCISE_PROGRESS_TESTS: 'Exercise library/detail/video/metric profiles and Progress analytics',
  MOBILE_PROFILE_GROUP_TESTS: 'Profile/groups/invitation surfaces',
  MOBILE_TESTING_INFRASTRUCTURE_TESTS: 'Mobile layered testing manifest and runner infrastructure',
})

const expectedSurfaceAccessStates = Object.freeze({
  'auth-gate': 'signed-out',
  'invitation-code-entry': 'signed-out',
  'invite-athlete': 'authenticated-coach',
  'athlete-invite-onboarding': 'authenticated-athlete',
  'loading-surface': 'session-bootstrap',
  'app-shell-render-model': 'authenticated-shared',
  'top-header': 'authenticated-shared',
  'bottom-nav': 'authenticated-shared',
  'coach-athlete-selector': 'authenticated-coach',
  'coach-athlete-workspace': 'authenticated-coach',
  'train-home': 'authenticated-shared',
  'train-today-tab': 'authenticated-shared',
  'train-program-tab': 'authenticated-shared',
  'train-calendar-tab': 'authenticated-shared',
  'train-workout-tab': 'authenticated-shared',
  'train-session-tab': 'authenticated-shared',
  'program-sheet': 'authenticated-shared',
  'program-edit-view': 'authenticated-coach',
  'training-calendar-sheet': 'authenticated-shared',
  'workout-sheet': 'authenticated-shared',
  'workout-edit-view': 'authenticated-coach',
  'active-workout': 'authenticated-shared',
  'workout-finish-flow': 'authenticated-shared',
  'workout-discard-flow': 'authenticated-shared',
  'add-exercise-flow': 'authenticated-shared',
  'exercise-reorder-flow': 'authenticated-shared',
  'swipe-delete-set-row-flow': 'authenticated-shared',
  'exercise-multi-select': 'authenticated-shared',
  'exercise-library': 'authenticated-shared',
  'exercise-detail': 'authenticated-shared',
  'exercise-video-preview': 'authenticated-shared',
  'progress-analytics': 'authenticated-shared',
  'team-groups': 'authenticated-coach',
  'coach-inbox-placeholder': 'authenticated-coach',
  'profile-settings': 'authenticated-shared',
  'groups-edit': 'authenticated-coach',
  'athlete-multi-select': 'authenticated-coach',
  'invitation-success': 'authenticated-coach',
})

function assertRepoFileExists(repoRelativePath) {
  assert.equal(
    existsSync(resolve(process.cwd(), repoRelativePath)),
    true,
    `Expected manifest reference to exist: ${repoRelativePath}`,
  )
}

test('mobile manifest exports explicit layer constants from L0 through L7', () => {
  assert.equal(MOBILE_LAYER_L0, 'L0_SURFACE_INVENTORY')
  assert.equal(MOBILE_LAYER_L1, 'L1_SOURCE_MODEL')
  assert.equal(MOBILE_LAYER_L2, 'L2_DATA_PERSISTENCE')
  assert.equal(MOBILE_LAYER_L3, 'L3_EXPO_RUNTIME')
  assert.equal(MOBILE_LAYER_L4, 'L4_SIMULATOR_SMOKE')
  assert.equal(MOBILE_LAYER_L5, 'L5_VISUAL_DEVICE')
  assert.equal(MOBILE_LAYER_L6, 'L6_SAFE_WORKFLOW')
  assert.equal(MOBILE_LAYER_L7, 'L7_MOBILE_GATE')
  assert.deepEqual(MOBILE_LAYER_CONSTANTS, Object.freeze([
    MOBILE_LAYER_L0,
    MOBILE_LAYER_L1,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
    MOBILE_LAYER_L7,
  ]))
})

test('mobile manifest exports explicit access state constants', () => {
  assert.equal(MOBILE_ACCESS_STATE_SIGNED_OUT, 'signed-out')
  assert.equal(MOBILE_ACCESS_STATE_SESSION_BOOTSTRAP, 'session-bootstrap')
  assert.equal(MOBILE_ACCESS_STATE_AUTHENTICATED_COACH, 'authenticated-coach')
  assert.equal(MOBILE_ACCESS_STATE_AUTHENTICATED_ATHLETE, 'authenticated-athlete')
  assert.equal(MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED, 'authenticated-shared')
  assert.deepEqual(MOBILE_ACCESS_STATE_CONSTANTS, Object.freeze([
    MOBILE_ACCESS_STATE_SIGNED_OUT,
    MOBILE_ACCESS_STATE_SESSION_BOOTSTRAP,
    MOBILE_ACCESS_STATE_AUTHENTICATED_COACH,
    MOBILE_ACCESS_STATE_AUTHENTICATED_ATHLETE,
    MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED,
  ]))
})

test('mobile manifest exports explicit role constants', () => {
  assert.equal(MOBILE_ROLE_SIGNED_OUT, 'signed-out')
  assert.equal(MOBILE_ROLE_COACH, 'coach')
  assert.equal(MOBILE_ROLE_ATHLETE, 'athlete')
  assert.equal(MOBILE_ROLE_SHARED, 'shared')
  assert.deepEqual(MOBILE_ROLE_CONSTANTS, Object.freeze([
    MOBILE_ROLE_SIGNED_OUT,
    MOBILE_ROLE_COACH,
    MOBILE_ROLE_ATHLETE,
    MOBILE_ROLE_SHARED,
  ]))
  assert.deepEqual(MOBILE_SURFACE_ROLES, Object.freeze({
    SIGNED_OUT: MOBILE_ROLE_SIGNED_OUT,
    COACH: MOBILE_ROLE_COACH,
    ATHLETE: MOBILE_ROLE_ATHLETE,
    SHARED: MOBILE_ROLE_SHARED,
  }))
})

test('mobile manifest exports explicit surface type constants', () => {
  assert.equal(MOBILE_SURFACE_TYPE_SCREEN, 'screen')
  assert.equal(MOBILE_SURFACE_TYPE_SHEET, 'sheet')
  assert.equal(MOBILE_SURFACE_TYPE_MODAL, 'modal')
  assert.equal(MOBILE_SURFACE_TYPE_TAB, 'tab')
  assert.equal(MOBILE_SURFACE_TYPE_WORKFLOW, 'workflow')
  assert.deepEqual(MOBILE_SURFACE_TYPE_CONSTANTS, Object.freeze([
    MOBILE_SURFACE_TYPE_SCREEN,
    MOBILE_SURFACE_TYPE_SHEET,
    MOBILE_SURFACE_TYPE_MODAL,
    MOBILE_SURFACE_TYPE_TAB,
    MOBILE_SURFACE_TYPE_WORKFLOW,
  ]))
  assert.deepEqual(MOBILE_SURFACE_TYPES, Object.freeze({
    SCREEN: MOBILE_SURFACE_TYPE_SCREEN,
    SHEET: MOBILE_SURFACE_TYPE_SHEET,
    MODAL: MOBILE_SURFACE_TYPE_MODAL,
    TAB: MOBILE_SURFACE_TYPE_TAB,
    WORKFLOW: MOBILE_SURFACE_TYPE_WORKFLOW,
  }))
})

test('mobile manifest exports explicit stable surface id constants', () => {
  assert.deepEqual(MOBILE_SURFACE_ID_CONSTANTS, Object.freeze(expectedSurfaceIds))
  assert.deepEqual(MOBILE_SURFACE_IDS, Object.freeze({
    AUTH_GATE: 'auth-gate',
    INVITATION_CODE_ENTRY: 'invitation-code-entry',
    INVITE_ATHLETE: 'invite-athlete',
    ATHLETE_INVITE_ONBOARDING: 'athlete-invite-onboarding',
    LOADING_SURFACE: 'loading-surface',
    APP_SHELL_RENDER_MODEL: 'app-shell-render-model',
    TOP_HEADER: 'top-header',
    BOTTOM_NAV: 'bottom-nav',
    COACH_ATHLETE_SELECTOR: 'coach-athlete-selector',
    COACH_ATHLETE_WORKSPACE: 'coach-athlete-workspace',
    TRAIN_HOME: 'train-home',
    TRAIN_TODAY_TAB: 'train-today-tab',
    TRAIN_PROGRAM_TAB: 'train-program-tab',
    TRAIN_CALENDAR_TAB: 'train-calendar-tab',
    TRAIN_WORKOUT_TAB: 'train-workout-tab',
    TRAIN_SESSION_TAB: 'train-session-tab',
    PROGRAM_SHEET: 'program-sheet',
    PROGRAM_EDIT_VIEW: 'program-edit-view',
    TRAINING_CALENDAR_SHEET: 'training-calendar-sheet',
    WORKOUT_SHEET: 'workout-sheet',
    WORKOUT_EDIT_VIEW: 'workout-edit-view',
    ACTIVE_WORKOUT: 'active-workout',
    WORKOUT_FINISH_FLOW: 'workout-finish-flow',
    WORKOUT_DISCARD_FLOW: 'workout-discard-flow',
    ADD_EXERCISE_FLOW: 'add-exercise-flow',
    EXERCISE_REORDER_FLOW: 'exercise-reorder-flow',
    SWIPE_DELETE_SET_ROW_FLOW: 'swipe-delete-set-row-flow',
    EXERCISE_MULTI_SELECT: 'exercise-multi-select',
    EXERCISE_LIBRARY: 'exercise-library',
    EXERCISE_DETAIL: 'exercise-detail',
    EXERCISE_VIDEO_PREVIEW: 'exercise-video-preview',
    PROGRESS_ANALYTICS: 'progress-analytics',
    TEAM_GROUPS: 'team-groups',
    COACH_INBOX_PLACEHOLDER: 'coach-inbox-placeholder',
    PROFILE_SETTINGS: 'profile-settings',
    GROUPS_EDIT: 'groups-edit',
    ATHLETE_MULTI_SELECT: 'athlete-multi-select',
    INVITATION_SUCCESS: 'invitation-success',
  }))
})

test('mobile manifest exports named source file paths for every stable surface id', () => {
  assert.deepEqual(Object.keys(MOBILE_SURFACE_SOURCE_PATHS), Object.keys(MOBILE_SURFACE_IDS))
  assert.deepEqual(Object.values(MOBILE_SURFACE_SOURCE_PATHS), [
    'apps/mobile/src/screens/auth-view.js',
    'apps/mobile/src/screens/invitation-code-entry-view.js',
    'apps/mobile/src/screens/invite-athlete-view.js',
    'apps/mobile/src/screens/athlete-invite-onboarding-view.js',
    'apps/mobile/src/screens/loading-view.js',
    'apps/mobile/src/screens/app-render-models.js',
    'apps/mobile/src/screens/shell-renderers.js',
    'apps/mobile/src/screens/shell-renderers.js',
    'apps/mobile/src/screens/coach-athletes-sheet.js',
    'apps/mobile/src/screens/coach-athlete-workspace-sheet.js',
    'apps/mobile/src/train/train-render-models.js',
    'apps/mobile/src/train/index.js',
    'apps/mobile/src/train/index.js',
    'apps/mobile/src/train/index.js',
    'apps/mobile/src/train/index.js',
    'apps/mobile/src/screens/session-sections.js',
    'apps/mobile/src/screens/program-sheet.js',
    'apps/mobile/src/screens/program-edit-view.js',
    'apps/mobile/src/screens/training-calendar-sheet.js',
    'apps/mobile/src/screens/workout-sheet.js',
    'apps/mobile/src/screens/workout-edit-view.js',
    'apps/mobile/src/screens/active-workout-view.js',
    'apps/mobile/src/train/active-workout-mutations.js',
    'apps/mobile/src/train/active-workout-mutations.js',
    'apps/mobile/src/train/active-workout-mutations.js',
    'apps/mobile/src/train/active-workout-mutations.js',
    'apps/mobile/src/screens/active-workout-view.js',
    'apps/mobile/src/screens/exercise-multi-select-view.js',
    'apps/mobile/src/screens/exercise-library-view.js',
    'apps/mobile/src/screens/exercise-detail-view.js',
    'apps/mobile/src/screens/exercise-detail-view.js',
    'apps/mobile/src/screens/analytics-view.js',
    'apps/mobile/src/screens/surface-sections.js',
    'apps/mobile/src/screens/app-render-models.js',
    'apps/mobile/src/screens/profile-view.js',
    'apps/mobile/src/screens/group-edit-view.js',
    'apps/mobile/src/screens/athlete-multi-select-view.js',
    'apps/mobile/src/screens/invitation-success-view.js',
  ])

  for (const [surfaceKey, sourcePath] of Object.entries(MOBILE_SURFACE_SOURCE_PATHS)) {
    assert.equal(typeof sourcePath, 'string', `${surfaceKey} source path must be a string`)
    assert.ok(sourcePath.startsWith('apps/mobile/src/'), `${surfaceKey} source path must point at mobile source`)
    assertRepoFileExists(sourcePath)
  }

  for (const surface of MOBILE_SURFACE_MANIFEST) {
    assert.equal(typeof surface.sourceFilePath, 'string', `${surface.id} must name its source file path`)
    assert.equal(surface.sourceFilePath, surface.sourcePath, `${surface.id} sourceFilePath must match sourcePath`)
    assertRepoFileExists(surface.sourceFilePath)
  }
})

test('Phase 3 auth and invitation coverage includes the signed-out auth view source surface', () => {
  const authGateSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.AUTH_GATE)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.AUTH_GATE, 'apps/mobile/src/screens/auth-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.AUTH_GATE)
  assert.equal(authGateSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.AUTH_GATE)
  assert.equal(authGateSurface.id, MOBILE_SURFACE_IDS.AUTH_GATE)
  assert.equal(authGateSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.equal(authGateSurface.role, MOBILE_SURFACE_ROLES.SIGNED_OUT)
  assert.equal(authGateSurface.accessState, MOBILE_ACCESS_STATE_SIGNED_OUT)
  assert.deepEqual(authGateSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.AUTH_GATE)
  assert.ok(authGateSurface.existingTestFiles.includes('tests/mobile-auth-gate.test.js'))
  assert.ok(authGateSurface.existingTestFiles.includes('tests/mobile-auth-screen-models.test.js'))
})

test('Phase 4 coach shell and athlete context coverage includes the app shell render model source surface', () => {
  const appShellRenderSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.APP_SHELL_RENDER_MODEL)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.APP_SHELL_RENDER_MODEL, 'apps/mobile/src/screens/app-render-models.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.APP_SHELL_RENDER_MODEL)
  assert.equal(appShellRenderSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.APP_SHELL_RENDER_MODEL)
  assert.equal(appShellRenderSurface.id, MOBILE_SURFACE_IDS.APP_SHELL_RENDER_MODEL)
  assert.equal(appShellRenderSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.equal(appShellRenderSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(appShellRenderSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(appShellRenderSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.APP_SHELL_RENDER_MODEL)
  assert.deepEqual(appShellRenderSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.APP_SHELL_RENDER_MODEL)
  assert.ok(appShellRenderSurface.existingTestFiles.includes('tests/mobile-app-render-models.test.js'))
  assert.ok(appShellRenderSurface.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
})

test('Phase 4 coach shell and athlete context coverage includes the top header source surface', () => {
  const topHeaderSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.TOP_HEADER)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.TOP_HEADER, 'apps/mobile/src/screens/shell-renderers.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.TOP_HEADER)
  assert.equal(topHeaderSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.TOP_HEADER)
  assert.equal(topHeaderSurface.id, MOBILE_SURFACE_IDS.TOP_HEADER)
  assert.equal(topHeaderSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.equal(topHeaderSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(topHeaderSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(topHeaderSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.TOP_HEADER)
  assert.deepEqual(topHeaderSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.TOP_HEADER)
  assert.ok(topHeaderSurface.existingTestFiles.includes('tests/mobile-header-shell.test.js'))
  assert.ok(topHeaderSurface.existingTestFiles.includes('tests/mobile-top-header-lucide.test.js'))
})

test('Phase 4 coach shell and athlete context coverage includes the bottom nav source surface', () => {
  const bottomNavSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.BOTTOM_NAV)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.BOTTOM_NAV, 'apps/mobile/src/screens/shell-renderers.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.BOTTOM_NAV)
  assert.equal(bottomNavSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.BOTTOM_NAV)
  assert.equal(bottomNavSurface.id, MOBILE_SURFACE_IDS.BOTTOM_NAV)
  assert.equal(bottomNavSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.equal(bottomNavSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(bottomNavSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(bottomNavSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.BOTTOM_NAV)
  assert.deepEqual(bottomNavSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.BOTTOM_NAV)
  assert.ok(bottomNavSurface.existingTestFiles.includes('tests/mobile-bottom-nav-lucide.test.js'))
  assert.ok(bottomNavSurface.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
})

test('Phase 4 coach shell and athlete context coverage includes the coach athlete selector sheet source surface', () => {
  const coachAthleteSelectorSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.COACH_ATHLETE_SELECTOR)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.COACH_ATHLETE_SELECTOR, 'apps/mobile/src/screens/coach-athletes-sheet.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.COACH_ATHLETE_SELECTOR)
  assert.equal(coachAthleteSelectorSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.COACH_ATHLETE_SELECTOR)
  assert.equal(coachAthleteSelectorSurface.id, MOBILE_SURFACE_IDS.COACH_ATHLETE_SELECTOR)
  assert.equal(coachAthleteSelectorSurface.label, 'Coach athlete selector sheet')
  assert.equal(coachAthleteSelectorSurface.kind, MOBILE_SURFACE_TYPES.SHEET)
  assert.equal(coachAthleteSelectorSurface.role, MOBILE_SURFACE_ROLES.COACH)
  assert.equal(coachAthleteSelectorSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_COACH)
  assert.equal(coachAthleteSelectorSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.COACH_ATHLETE_SELECTOR)
  assert.deepEqual(coachAthleteSelectorSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.COACH_ATHLETE_SELECTOR)
  assert.ok(coachAthleteSelectorSurface.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
  assert.ok(coachAthleteSelectorSurface.existingTestFiles.includes('tests/mobile-profile-view.test.js'))
  assert.ok(coachAthleteSelectorSurface.existingTestFiles.includes('tests/mobile-theme-surface-pass.test.js'))
})

test('Phase 4 coach shell and athlete context coverage includes the coach athlete workspace sheet source surface', () => {
  const coachAthleteWorkspaceSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.COACH_ATHLETE_WORKSPACE)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.COACH_ATHLETE_WORKSPACE, 'apps/mobile/src/screens/coach-athlete-workspace-sheet.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.COACH_ATHLETE_WORKSPACE)
  assert.equal(coachAthleteWorkspaceSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.COACH_ATHLETE_WORKSPACE)
  assert.equal(coachAthleteWorkspaceSurface.id, MOBILE_SURFACE_IDS.COACH_ATHLETE_WORKSPACE)
  assert.equal(coachAthleteWorkspaceSurface.label, 'Coach athlete workspace sheet')
  assert.equal(coachAthleteWorkspaceSurface.kind, MOBILE_SURFACE_TYPES.SHEET)
  assert.equal(coachAthleteWorkspaceSurface.role, MOBILE_SURFACE_ROLES.COACH)
  assert.equal(coachAthleteWorkspaceSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_COACH)
  assert.equal(coachAthleteWorkspaceSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.COACH_ATHLETE_WORKSPACE)
  assert.deepEqual(coachAthleteWorkspaceSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.COACH_ATHLETE_WORKSPACE)
  assert.ok(coachAthleteWorkspaceSurface.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
  assert.ok(coachAthleteWorkspaceSurface.existingTestFiles.includes('tests/mobile-auth-profile-actions.test.js'))
  assert.ok(coachAthleteWorkspaceSurface.existingTestFiles.includes('tests/mobile-session-orchestration.test.js'))
  assert.ok(coachAthleteWorkspaceSurface.existingTestFiles.includes('tests/mobile-theme-surface-pass.test.js'))
})

test('Phase 5 Train/Home and active workout coverage includes the Train/Home shared surface', () => {
  const trainHomeSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.TRAIN_HOME)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.TRAIN_HOME, 'apps/mobile/src/train/train-render-models.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.TRAIN_HOME)
  assert.equal(trainHomeSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.TRAIN_HOME)
  assert.equal(trainHomeSurface.id, MOBILE_SURFACE_IDS.TRAIN_HOME)
  assert.equal(trainHomeSurface.label, 'Train/Home shared surface')
  assert.equal(trainHomeSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.equal(trainHomeSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(trainHomeSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(trainHomeSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.TRAIN_HOME)
  assert.deepEqual(trainHomeSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.TRAIN_HOME)
  assert.ok(trainHomeSurface.existingTestFiles.includes('tests/mobile-app-render-models.test.js'))
  assert.ok(trainHomeSurface.existingTestFiles.includes('tests/mobile-train-screen-models.test.js'))
  assert.ok(trainHomeSurface.existingTestFiles.includes('tests/mobile-train-render-models.test.js'))
  assert.ok(trainHomeSurface.existingTestFiles.includes('tests/mobile-train-home-nativewind.test.js'))
  assert.ok(trainHomeSurface.existingTestFiles.includes('tests/mobile-coach-train-bridge.test.js'))
})

test('Phase 5 Train/Home and active workout coverage includes the Workout Sheet surface', () => {
  const workoutSheetSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.WORKOUT_SHEET)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_SHEET, 'apps/mobile/src/screens/workout-sheet.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_SHEET)
  assert.equal(workoutSheetSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_SHEET)
  assert.equal(workoutSheetSurface.id, MOBILE_SURFACE_IDS.WORKOUT_SHEET)
  assert.equal(workoutSheetSurface.label, 'Workout sheet')
  assert.equal(workoutSheetSurface.kind, MOBILE_SURFACE_TYPES.SHEET)
  assert.equal(workoutSheetSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(workoutSheetSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(workoutSheetSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.WORKOUT_SHEET)
  assert.deepEqual(workoutSheetSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.WORKOUT_SHEET)
  assert.ok(workoutSheetSurface.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
  assert.ok(workoutSheetSurface.existingTestFiles.includes('tests/mobile-workout-sheet.test.js'))
  assert.ok(workoutSheetSurface.existingTestFiles.includes('tests/mobile-workout-sheet-models.test.js'))
  assert.ok(workoutSheetSurface.existingTestFiles.includes('tests/mobile-workout-open-request-context.test.js'))
  assert.ok(workoutSheetSurface.existingTestFiles.includes('tests/mobile-session-orchestration.test.js'))
})

test('Phase 5 Train/Home and active workout coverage includes the Active Workout View surface', () => {
  const activeWorkoutSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.ACTIVE_WORKOUT)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.ACTIVE_WORKOUT, 'apps/mobile/src/screens/active-workout-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.ACTIVE_WORKOUT)
  assert.equal(activeWorkoutSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.ACTIVE_WORKOUT)
  assert.equal(activeWorkoutSurface.id, MOBILE_SURFACE_IDS.ACTIVE_WORKOUT)
  assert.equal(activeWorkoutSurface.label, 'Active workout view')
  assert.equal(activeWorkoutSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.equal(activeWorkoutSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(activeWorkoutSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(activeWorkoutSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.ACTIVE_WORKOUT)
  assert.deepEqual(activeWorkoutSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.ACTIVE_WORKOUT)
  assert.ok(activeWorkoutSurface.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
  assert.ok(activeWorkoutSurface.existingTestFiles.includes('tests/mobile-active-workout-view.test.js'))
  assert.ok(activeWorkoutSurface.existingTestFiles.includes('tests/mobile-active-workout-view-models.test.js'))
  assert.ok(activeWorkoutSurface.existingTestFiles.includes('tests/mobile-active-session-models.test.js'))
  assert.ok(activeWorkoutSurface.existingTestFiles.includes('tests/mobile-session-runtime.test.js'))
  assert.ok(activeWorkoutSurface.existingTestFiles.includes('tests/mobile-session-orchestration.test.js'))
  assert.ok(activeWorkoutSurface.existingTestFiles.includes('tests/mobile-session-actions.test.js'))
})

test('Phase 5 Train/Home and active workout coverage includes the Finish Workout flow surface', () => {
  const finishWorkoutFlow = getMobileSurfaceById(MOBILE_SURFACE_IDS.WORKOUT_FINISH_FLOW)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_FINISH_FLOW, 'apps/mobile/src/train/active-workout-mutations.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_FINISH_FLOW)
  assert.equal(finishWorkoutFlow.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_FINISH_FLOW)
  assert.equal(finishWorkoutFlow.id, MOBILE_SURFACE_IDS.WORKOUT_FINISH_FLOW)
  assert.equal(finishWorkoutFlow.label, 'Finish workout flow')
  assert.equal(finishWorkoutFlow.kind, MOBILE_SURFACE_TYPES.WORKFLOW)
  assert.equal(finishWorkoutFlow.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(finishWorkoutFlow.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(finishWorkoutFlow.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.WORKOUT_FINISH_FLOW)
  assert.deepEqual(finishWorkoutFlow.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.WORKOUT_FINISH_FLOW)
  assert.ok(finishWorkoutFlow.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
  assert.ok(finishWorkoutFlow.existingTestFiles.includes('tests/mobile-active-workout-view.test.js'))
  assert.ok(finishWorkoutFlow.existingTestFiles.includes('tests/mobile-session-orchestration.test.js'))
  assert.ok(finishWorkoutFlow.existingTestFiles.includes('tests/mobile-session-runtime.test.js'))
  assert.ok(finishWorkoutFlow.existingTestFiles.includes('tests/mobile-completed-session-models.test.js'))
  assert.ok(finishWorkoutFlow.existingTestFiles.includes('tests/mobile-completed-recap-renderers.test.js'))
})

test('Phase 5 Train/Home and active workout coverage includes the Discard Workout flow surface', () => {
  const discardWorkoutFlow = getMobileSurfaceById(MOBILE_SURFACE_IDS.WORKOUT_DISCARD_FLOW)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_DISCARD_FLOW, 'apps/mobile/src/train/active-workout-mutations.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_DISCARD_FLOW)
  assert.equal(discardWorkoutFlow.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_DISCARD_FLOW)
  assert.equal(discardWorkoutFlow.id, MOBILE_SURFACE_IDS.WORKOUT_DISCARD_FLOW)
  assert.equal(discardWorkoutFlow.label, 'Discard workout flow')
  assert.equal(discardWorkoutFlow.kind, MOBILE_SURFACE_TYPES.WORKFLOW)
  assert.equal(discardWorkoutFlow.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(discardWorkoutFlow.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(discardWorkoutFlow.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.WORKOUT_DISCARD_FLOW)
  assert.deepEqual(discardWorkoutFlow.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.WORKOUT_DISCARD_FLOW)
  assert.ok(discardWorkoutFlow.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
  assert.ok(discardWorkoutFlow.existingTestFiles.includes('tests/mobile-active-workout-view.test.js'))
  assert.ok(discardWorkoutFlow.existingTestFiles.includes('tests/mobile-session-orchestration.test.js'))
  assert.ok(discardWorkoutFlow.existingTestFiles.includes('tests/mobile-session-runtime.test.js'))
  assert.ok(discardWorkoutFlow.existingTestFiles.includes('tests/mobile-discarded-session-models.test.js'))
})

test('Phase 5 Train/Home and active workout coverage includes the Exercise Multi-select View surface', () => {
  const exerciseMultiSelectSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.EXERCISE_MULTI_SELECT)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_MULTI_SELECT, 'apps/mobile/src/screens/exercise-multi-select-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_MULTI_SELECT)
  assert.equal(exerciseMultiSelectSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_MULTI_SELECT)
  assert.equal(exerciseMultiSelectSurface.id, MOBILE_SURFACE_IDS.EXERCISE_MULTI_SELECT)
  assert.equal(exerciseMultiSelectSurface.label, 'Exercise multi-select view')
  assert.equal(exerciseMultiSelectSurface.kind, MOBILE_SURFACE_TYPES.MODAL)
  assert.equal(exerciseMultiSelectSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(exerciseMultiSelectSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(exerciseMultiSelectSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.EXERCISE_MULTI_SELECT)
  assert.deepEqual(exerciseMultiSelectSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.EXERCISE_MULTI_SELECT)
  assert.ok(exerciseMultiSelectSurface.existingTestFiles.includes('tests/mobile-app-shell.test.js'))
  assert.ok(exerciseMultiSelectSurface.existingTestFiles.includes('tests/mobile-active-workout-view.test.js'))
  assert.ok(exerciseMultiSelectSurface.existingTestFiles.includes('tests/mobile-workout-edit-view.test.js'))
  assert.ok(exerciseMultiSelectSurface.existingTestFiles.includes('tests/mobile-program-edit-view.test.js'))
  assert.ok(exerciseMultiSelectSurface.existingTestFiles.includes('tests/mobile-exercise-multi-select-view.test.js'))
  assert.ok(exerciseMultiSelectSurface.existingTestFiles.includes('tests/mobile-session-runtime.test.js'))
})

test('Phase 5 Train/Home and active workout coverage includes the Add Exercise flow surface', () => {
  const addExerciseFlow = getMobileSurfaceById(MOBILE_SURFACE_IDS.ADD_EXERCISE_FLOW)

  assert.equal(MOBILE_SURFACE_IDS.ADD_EXERCISE_FLOW, 'add-exercise-flow')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.ADD_EXERCISE_FLOW, 'apps/mobile/src/train/active-workout-mutations.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.ADD_EXERCISE_FLOW)
  assert.equal(addExerciseFlow.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.ADD_EXERCISE_FLOW)
  assert.equal(addExerciseFlow.sourceFilePath, MOBILE_SURFACE_SOURCE_PATHS.ADD_EXERCISE_FLOW)
  assert.equal(addExerciseFlow.id, MOBILE_SURFACE_IDS.ADD_EXERCISE_FLOW)
  assert.equal(addExerciseFlow.label, 'Add exercise flow')
  assert.equal(addExerciseFlow.kind, MOBILE_SURFACE_TYPE_WORKFLOW)
  assert.equal(addExerciseFlow.role, MOBILE_ROLE_SHARED)
  assert.equal(addExerciseFlow.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(addExerciseFlow.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.ADD_EXERCISE_FLOW)
  assert.equal(addExerciseFlow.entryPoint, 'active workout Add Exercise action')
  assert.deepEqual(addExerciseFlow.dataSources, Object.freeze([
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.LOCAL_STATE,
  ]))
  assert.deepEqual(addExerciseFlow.requiredLayers, Object.freeze([
    MOBILE_LAYER_L0,
    MOBILE_LAYER_L1,
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(addExerciseFlow.missingLayers, Object.freeze([
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(addExerciseFlow.existingTestFiles, Object.freeze([
    'tests/mobile-app-shell.test.js',
    'tests/mobile-active-workout-view.test.js',
    'tests/mobile-exercise-multi-select-view.test.js',
    'tests/mobile-session-runtime.test.js',
    'tests/mobile-session-orchestration.test.js',
  ]))
  assert.equal(addExerciseFlow.simulatorSmokePriority, 'p0')

  for (const testFile of addExerciseFlow.existingTestFiles) {
    assertRepoFileExists(testFile)
  }
})

test('Phase 5 Train/Home and active workout coverage includes the Exercise Reorder flow surface', () => {
  const exerciseReorderFlow = getMobileSurfaceById(MOBILE_SURFACE_IDS.EXERCISE_REORDER_FLOW)

  assert.equal(MOBILE_SURFACE_IDS.EXERCISE_REORDER_FLOW, 'exercise-reorder-flow')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_REORDER_FLOW, 'apps/mobile/src/train/active-workout-mutations.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_REORDER_FLOW)
  assert.equal(exerciseReorderFlow.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_REORDER_FLOW)
  assert.equal(exerciseReorderFlow.sourceFilePath, MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_REORDER_FLOW)
  assert.equal(exerciseReorderFlow.id, MOBILE_SURFACE_IDS.EXERCISE_REORDER_FLOW)
  assert.equal(exerciseReorderFlow.label, 'Exercise reorder flow')
  assert.equal(exerciseReorderFlow.kind, MOBILE_SURFACE_TYPE_WORKFLOW)
  assert.equal(exerciseReorderFlow.role, MOBILE_ROLE_SHARED)
  assert.equal(exerciseReorderFlow.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(exerciseReorderFlow.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.EXERCISE_REORDER_FLOW)
  assert.equal(exerciseReorderFlow.entryPoint, 'active workout or workout edit exercise reorder action')
  assert.deepEqual(exerciseReorderFlow.dataSources, Object.freeze([
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.LOCAL_STATE,
  ]))
  assert.deepEqual(exerciseReorderFlow.requiredLayers, Object.freeze([
    MOBILE_LAYER_L0,
    MOBILE_LAYER_L1,
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(exerciseReorderFlow.missingLayers, Object.freeze([
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(exerciseReorderFlow.existingTestFiles, Object.freeze([
    'tests/mobile-app-shell.test.js',
    'tests/mobile-active-workout-view.test.js',
    'tests/mobile-workout-edit-view.test.js',
    'tests/mobile-session-runtime.test.js',
    'tests/mobile-session-orchestration.test.js',
  ]))
  assert.equal(exerciseReorderFlow.simulatorSmokePriority, 'p0')

  for (const testFile of exerciseReorderFlow.existingTestFiles) {
    assertRepoFileExists(testFile)
  }
})

test('Phase 5 Train/Home and active workout coverage includes the Swipe-delete Set Row flow surface', () => {
  const swipeDeleteSetRowFlow = getMobileSurfaceById(MOBILE_SURFACE_IDS.SWIPE_DELETE_SET_ROW_FLOW)

  assert.equal(MOBILE_SURFACE_IDS.SWIPE_DELETE_SET_ROW_FLOW, 'swipe-delete-set-row-flow')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.SWIPE_DELETE_SET_ROW_FLOW, 'apps/mobile/src/screens/active-workout-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.SWIPE_DELETE_SET_ROW_FLOW)
  assert.equal(swipeDeleteSetRowFlow.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.SWIPE_DELETE_SET_ROW_FLOW)
  assert.equal(swipeDeleteSetRowFlow.sourceFilePath, MOBILE_SURFACE_SOURCE_PATHS.SWIPE_DELETE_SET_ROW_FLOW)
  assert.equal(swipeDeleteSetRowFlow.id, MOBILE_SURFACE_IDS.SWIPE_DELETE_SET_ROW_FLOW)
  assert.equal(swipeDeleteSetRowFlow.label, 'Swipe-delete set row flow')
  assert.equal(swipeDeleteSetRowFlow.kind, MOBILE_SURFACE_TYPE_WORKFLOW)
  assert.equal(swipeDeleteSetRowFlow.role, MOBILE_ROLE_SHARED)
  assert.equal(swipeDeleteSetRowFlow.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(swipeDeleteSetRowFlow.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.SWIPE_DELETE_SET_ROW_FLOW)
  assert.equal(swipeDeleteSetRowFlow.entryPoint, 'active workout or workout edit set-row swipe delete action')
  assert.deepEqual(swipeDeleteSetRowFlow.dataSources, Object.freeze([
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.LOCAL_STATE,
  ]))
  assert.deepEqual(swipeDeleteSetRowFlow.requiredLayers, Object.freeze([
    MOBILE_LAYER_L0,
    MOBILE_LAYER_L1,
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(swipeDeleteSetRowFlow.missingLayers, Object.freeze([
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(swipeDeleteSetRowFlow.existingTestFiles, Object.freeze([
    'tests/mobile-app-shell.test.js',
    'tests/mobile-active-workout-view.test.js',
    'tests/mobile-workout-edit-view.test.js',
    'tests/mobile-session-runtime.test.js',
    'tests/mobile-session-orchestration.test.js',
  ]))
  assert.equal(swipeDeleteSetRowFlow.simulatorSmokePriority, 'p0')

  for (const testFile of swipeDeleteSetRowFlow.existingTestFiles) {
    assertRepoFileExists(testFile)
  }
})

test('Phase 3 auth and invitation coverage includes the signed-out invitation code entry source surface', () => {
  const invitationCodeSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.INVITATION_CODE_ENTRY)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.INVITATION_CODE_ENTRY, 'apps/mobile/src/screens/invitation-code-entry-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.INVITATION_CODE_ENTRY)
  assert.equal(invitationCodeSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.INVITATION_CODE_ENTRY)
  assert.equal(invitationCodeSurface.id, MOBILE_SURFACE_IDS.INVITATION_CODE_ENTRY)
  assert.equal(invitationCodeSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.equal(invitationCodeSurface.role, MOBILE_SURFACE_ROLES.SIGNED_OUT)
  assert.equal(invitationCodeSurface.accessState, MOBILE_ACCESS_STATE_SIGNED_OUT)
  assert.equal(invitationCodeSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.INVITATION_CODE_ENTRY)
  assert.deepEqual(invitationCodeSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.INVITATION_CODE_ENTRY)
  assert.ok(invitationCodeSurface.existingTestFiles.includes('tests/mobile-auth-invitation-code-flow.test.js'))
  assert.ok(invitationCodeSurface.existingTestFiles.includes('tests/mobile-athlete-invitation-runtime.test.js'))
})

test('Phase 3 auth and invitation coverage includes the athlete invite onboarding source surface', () => {
  const onboardingSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.ATHLETE_INVITE_ONBOARDING)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.ATHLETE_INVITE_ONBOARDING, 'apps/mobile/src/screens/athlete-invite-onboarding-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.ATHLETE_INVITE_ONBOARDING)
  assert.equal(onboardingSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.ATHLETE_INVITE_ONBOARDING)
  assert.equal(onboardingSurface.id, MOBILE_SURFACE_IDS.ATHLETE_INVITE_ONBOARDING)
  assert.equal(onboardingSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.equal(onboardingSurface.role, MOBILE_SURFACE_ROLES.ATHLETE)
  assert.equal(onboardingSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_ATHLETE)
  assert.equal(onboardingSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.ATHLETE_INVITE_ONBOARDING)
  assert.deepEqual(onboardingSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.ATHLETE_INVITE_ONBOARDING)
  assert.ok(onboardingSurface.existingTestFiles.includes('tests/mobile-auth-invitation-code-flow.test.js'))
  assert.ok(onboardingSurface.existingTestFiles.includes('tests/mobile-athlete-invitation-runtime.test.js'))
})

test('Phase 3 auth and invitation coverage includes the coach invitation success source modal', () => {
  const invitationSuccessSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.INVITATION_SUCCESS)

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.INVITATION_SUCCESS, 'apps/mobile/src/screens/invitation-success-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.INVITATION_SUCCESS)
  assert.equal(invitationSuccessSurface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.INVITATION_SUCCESS)
  assert.equal(invitationSuccessSurface.id, MOBILE_SURFACE_IDS.INVITATION_SUCCESS)
  assert.equal(invitationSuccessSurface.kind, MOBILE_SURFACE_TYPES.MODAL)
  assert.equal(invitationSuccessSurface.role, MOBILE_SURFACE_ROLES.COACH)
  assert.equal(invitationSuccessSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_COACH)
  assert.equal(invitationSuccessSurface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.INVITATION_SUCCESS)
  assert.deepEqual(invitationSuccessSurface.existingTestFiles, MOBILE_SURFACE_EXISTING_TEST_FILES.INVITATION_SUCCESS)
  assert.ok(invitationSuccessSurface.existingTestFiles.includes('tests/mobile-athlete-invitation.test.js'))
})

test('mobile manifest exports named entry points for every stable surface id', () => {
  assert.deepEqual(Object.keys(MOBILE_SURFACE_ENTRY_POINTS), Object.keys(MOBILE_SURFACE_IDS))
  assert.deepEqual(Object.values(MOBILE_SURFACE_ENTRY_POINTS), [
    'cold start when no authenticated session exists',
    'auth gate invitation code action',
    'coach profile/groups invite action',
    'valid invitation code completion',
    'auth/session bootstrap while state is loading',
    'authenticated app shell render model selection before shell rendering',
    'authenticated app shell top header profile and utility actions',
    'authenticated app shell bottom navigation tab actions',
    'coach shell athlete switcher',
    'coach selected athlete workspace action',
    'bottom tab Train/Home',
    'Train/Home segmented tab: Today',
    'Train/Home segmented tab: Program',
    'Train/Home segmented tab: Calendar',
    'Train/Home segmented tab: Workout',
    'Train/Home segmented tab: Session',
    'Train/Home assigned program card',
    'coach program edit action',
    'Train/Home calendar action',
    'Train/Home workout card or program workout row',
    'coach workout edit action or create workout draft',
    'Start workout from workout sheet or resume active session',
    'active workout Finish action',
    'active workout Discard Workout action',
    'active workout Add Exercise action',
    'active workout or workout edit exercise reorder action',
    'active workout or workout edit set-row swipe delete action',
    'active workout, workout edit, or program edit Add Exercise action',
    'bottom tab Exercises',
    'exercise library row or workout exercise detail action',
    'exercise detail media header video preview',
    'bottom tab Progress',
    'bottom tab Groups',
    'bottom tab Athletes/InBox while communication hub is placeholder-backed',
    'profile/account action from shell',
    'coach group create/edit action',
    'group edit Add Athletes action',
    'successful coach athlete invite send',
  ])

  for (const [surfaceKey, entryPoint] of Object.entries(MOBILE_SURFACE_ENTRY_POINTS)) {
    assert.equal(typeof entryPoint, 'string', `${surfaceKey} entry point must be a string`)
    assert.ok(entryPoint.length > 0, `${surfaceKey} entry point must be non-empty`)
  }
})

test('mobile manifest exports existing test file lists for every stable surface id', () => {
  assert.deepEqual(Object.keys(MOBILE_SURFACE_EXISTING_TEST_FILES), Object.keys(MOBILE_SURFACE_IDS))

  for (const [surfaceKey, testFiles] of Object.entries(MOBILE_SURFACE_EXISTING_TEST_FILES)) {
    assert.ok(Array.isArray(testFiles), `${surfaceKey} existing test files must be an array`)
    assert.ok(testFiles.length > 0, `${surfaceKey} must list at least one existing test file`)

    for (const testFile of testFiles) {
      assert.equal(typeof testFile, 'string', `${surfaceKey} existing test file must be a string`)
      assert.ok(testFile.startsWith('tests/mobile-'), `${surfaceKey} existing test file must be a mobile test`)
      assertRepoFileExists(testFile)
    }
  }
})

test('mobile manifest exports data source lists for every stable surface id', () => {
  const { MOBILE_SURFACE_DATA_SOURCES } = mobileManifestModule
  assert.ok(MOBILE_SURFACE_DATA_SOURCES, 'MOBILE_SURFACE_DATA_SOURCES must be exported before surface entries can use it')
  assert.deepEqual(Object.keys(MOBILE_SURFACE_DATA_SOURCES), Object.keys(MOBILE_SURFACE_IDS))

  const knownDataSources = new Set(Object.values(MOBILE_DATA_SOURCES))

  for (const [surfaceKey, dataSources] of Object.entries(MOBILE_SURFACE_DATA_SOURCES)) {
    assert.ok(Array.isArray(dataSources), `${surfaceKey} dataSources must be an array`)
    assert.ok(dataSources.length > 0, `${surfaceKey} must list at least one data source`)
    assert.equal(new Set(dataSources).size, dataSources.length, `${surfaceKey} dataSources must be de-duped`)

    for (const dataSource of dataSources) {
      assert.ok(knownDataSources.has(dataSource), `${surfaceKey} has unknown data source ${dataSource}`)
    }
  }
})

test('mobile manifest exports required layer lists for every stable surface id', () => {
  assert.deepEqual(Object.keys(MOBILE_SURFACE_REQUIRED_LAYERS), Object.keys(MOBILE_SURFACE_IDS))

  const knownLayers = new Set(Object.values(MOBILE_TEST_LAYERS))

  for (const [surfaceKey, requiredLayers] of Object.entries(MOBILE_SURFACE_REQUIRED_LAYERS)) {
    assert.ok(Array.isArray(requiredLayers), `${surfaceKey} required layers must be an array`)
    assert.ok(requiredLayers.length >= 2, `${surfaceKey} must list at least L0 and L1`)
    assert.equal(new Set(requiredLayers).size, requiredLayers.length, `${surfaceKey} required layers must be de-duped`)
    assert.ok(requiredLayers.includes(MOBILE_TEST_LAYERS.SURFACE_INVENTORY), `${surfaceKey} required layers must include L0`)
    assert.ok(requiredLayers.includes(MOBILE_TEST_LAYERS.SOURCE_MODEL), `${surfaceKey} required layers must include L1`)

    for (const layer of requiredLayers) {
      assert.ok(knownLayers.has(layer), `${surfaceKey} has unknown required layer ${layer}`)
    }
  }

  assert.deepEqual(MOBILE_SURFACE_REQUIRED_LAYERS.PROFILE_SETTINGS, Object.freeze([
    MOBILE_TEST_LAYERS.SURFACE_INVENTORY,
    MOBILE_TEST_LAYERS.SOURCE_MODEL,
    MOBILE_TEST_LAYERS.EXPO_RUNTIME,
    MOBILE_TEST_LAYERS.SIMULATOR_SMOKE,
    MOBILE_TEST_LAYERS.DATA_PERSISTENCE,
    MOBILE_TEST_LAYERS.VISUAL_DEVICE,
    MOBILE_TEST_LAYERS.SAFE_WORKFLOW,
    MOBILE_TEST_LAYERS.APP_STORE_READINESS,
  ]))
})

test('mobile manifest exports honest missing layer lists for every stable surface id', () => {
  assert.deepEqual(Object.keys(MOBILE_SURFACE_MISSING_LAYERS), Object.keys(MOBILE_SURFACE_IDS))

  const layersCoveredByThisManifestPass = new Set([
    MOBILE_TEST_LAYERS.SURFACE_INVENTORY,
    MOBILE_TEST_LAYERS.SOURCE_MODEL,
  ])

  for (const [surfaceKey, missingLayers] of Object.entries(MOBILE_SURFACE_MISSING_LAYERS)) {
    assert.ok(Array.isArray(missingLayers), `${surfaceKey} missing layers must be an array`)
    assert.equal(new Set(missingLayers).size, missingLayers.length, `${surfaceKey} missing layers must be de-duped`)

    const requiredLayers = MOBILE_SURFACE_REQUIRED_LAYERS[surfaceKey]
    const expectedMissingLayers = requiredLayers.filter((layer) => !layersCoveredByThisManifestPass.has(layer))
    assert.deepEqual(missingLayers, expectedMissingLayers, `${surfaceKey} missing layers must be required layers not yet proven by L0/L1 source checks`)

    for (const layer of missingLayers) {
      assert.ok(requiredLayers.includes(layer), `${surfaceKey} cannot list non-required missing layer ${layer}`)
      assert.notEqual(layer, MOBILE_TEST_LAYERS.SURFACE_INVENTORY, `${surfaceKey} L0 is covered by the manifest`)
      assert.notEqual(layer, MOBILE_TEST_LAYERS.SOURCE_MODEL, `${surfaceKey} L1 is covered by existing source tests`)
    }
  }

  assert.deepEqual(MOBILE_SURFACE_MISSING_LAYERS.ACTIVE_WORKOUT, Object.freeze([
    MOBILE_TEST_LAYERS.EXPO_RUNTIME,
    MOBILE_TEST_LAYERS.SIMULATOR_SMOKE,
    MOBILE_TEST_LAYERS.DATA_PERSISTENCE,
    MOBILE_TEST_LAYERS.VISUAL_DEVICE,
    MOBILE_TEST_LAYERS.SAFE_WORKFLOW,
  ]))
})

test('mobile surface manifest exports the full Phase 1 surface inventory', () => {
  assert.equal(getMobileSurfaceManifest(), MOBILE_SURFACE_MANIFEST)
  assert.deepEqual(
    MOBILE_SURFACE_MANIFEST.map((surface) => surface.id),
    MOBILE_SURFACE_ID_CONSTANTS,
  )
  assert.deepEqual(
    Object.fromEntries(MOBILE_SURFACE_MANIFEST.map((surface) => [surface.id, surface.accessState])),
    expectedSurfaceAccessStates,
  )
  assert.deepEqual(Object.keys(MOBILE_TEST_LAYERS), [
    'SURFACE_INVENTORY',
    'SOURCE_MODEL',
    'DATA_PERSISTENCE',
    'EXPO_RUNTIME',
    'SIMULATOR_SMOKE',
    'VISUAL_DEVICE',
    'SAFE_WORKFLOW',
    'MOBILE_GATE',
    'APP_STORE_READINESS',
  ])
})

test('mobile surface manifest entries use known roles, access states, layers, data sources, surface types, and smoke priorities', () => {
  const knownRoles = new Set(Object.values(MOBILE_SURFACE_ROLES))
  const knownAccessStates = new Set(MOBILE_ACCESS_STATE_CONSTANTS)
  const knownSurfaceTypes = new Set(Object.values(MOBILE_SURFACE_TYPES))
  const knownLayers = new Set(Object.values(MOBILE_TEST_LAYERS))
  const knownDataSources = new Set(Object.values(MOBILE_DATA_SOURCES))
  const knownSmokePriorities = new Set(['p0', 'p1', 'p2'])
  const seenIds = new Set()

  for (const surface of MOBILE_SURFACE_MANIFEST) {
    assert.equal(typeof surface.id, 'string')
    assert.equal(seenIds.has(surface.id), false, `Duplicate mobile surface id: ${surface.id}`)
    seenIds.add(surface.id)

    assert.equal(typeof surface.label, 'string', `${surface.id} needs a label`)
    assert.ok(surface.label.length > 0, `${surface.id} needs a non-empty label`)
    assert.ok(knownRoles.has(surface.role), `${surface.id} has unknown role ${surface.role}`)
    assert.ok(knownAccessStates.has(surface.accessState), `${surface.id} has unknown access state ${surface.accessState}`)
    assert.equal(surface.accessState, expectedSurfaceAccessStates[surface.id], `${surface.id} access state is not explicitly classified`)
    assert.ok(knownSurfaceTypes.has(surface.kind), `${surface.id} has unknown surface type ${surface.kind}`)
    assert.equal(typeof surface.sourcePath, 'string', `${surface.id} needs a sourcePath`)
    assert.equal(
      surface.sourcePath,
      MOBILE_SURFACE_SOURCE_PATHS[Object.entries(MOBILE_SURFACE_IDS).find(([, id]) => id === surface.id)?.[0]],
      `${surface.id} sourcePath must come from MOBILE_SURFACE_SOURCE_PATHS`,
    )
    assert.equal(typeof surface.entryPoint, 'string', `${surface.id} needs an entryPoint`)
    assert.equal(
      surface.entryPoint,
      MOBILE_SURFACE_ENTRY_POINTS[Object.entries(MOBILE_SURFACE_IDS).find(([, id]) => id === surface.id)?.[0]],
      `${surface.id} entryPoint must come from MOBILE_SURFACE_ENTRY_POINTS`,
    )
    assert.ok(surface.entryPoint.length > 0, `${surface.id} needs a non-empty entryPoint`)
    assert.ok(Array.isArray(surface.dataSources), `${surface.id} dataSources must be an array`)
    assert.ok(surface.dataSources.length > 0, `${surface.id} needs at least one data source`)
    assert.ok(Array.isArray(surface.requiredLayers), `${surface.id} requiredLayers must be an array`)
    assert.ok(Array.isArray(surface.missingLayers), `${surface.id} missingLayers must be an array`)
    assert.equal(
      surface.missingLayers,
      MOBILE_SURFACE_MISSING_LAYERS[Object.entries(MOBILE_SURFACE_IDS).find(([, id]) => id === surface.id)?.[0]],
      `${surface.id} missingLayers must come from MOBILE_SURFACE_MISSING_LAYERS`,
    )
    assert.equal(
      surface.requiredLayers,
      MOBILE_SURFACE_REQUIRED_LAYERS[Object.entries(MOBILE_SURFACE_IDS).find(([, id]) => id === surface.id)?.[0]],
      `${surface.id} requiredLayers must come from MOBILE_SURFACE_REQUIRED_LAYERS`,
    )
    assert.ok(surface.requiredLayers.includes(MOBILE_TEST_LAYERS.SURFACE_INVENTORY), `${surface.id} must include L0`)
    assert.ok(surface.requiredLayers.includes(MOBILE_TEST_LAYERS.SOURCE_MODEL), `${surface.id} must include L1`)
    assert.ok(Array.isArray(surface.existingTestFiles), `${surface.id} existingTestFiles must be an array`)
    assert.equal(
      surface.existingTestFiles,
      MOBILE_SURFACE_EXISTING_TEST_FILES[Object.entries(MOBILE_SURFACE_IDS).find(([, id]) => id === surface.id)?.[0]],
      `${surface.id} existingTestFiles must come from MOBILE_SURFACE_EXISTING_TEST_FILES`,
    )
    assert.ok(surface.existingTestFiles.length > 0, `${surface.id} needs at least one existing source test`)
    assert.ok(knownSmokePriorities.has(surface.simulatorSmokePriority), `${surface.id} has unknown smoke priority`)
    assert.equal(typeof surface.notes, 'string', `${surface.id} needs notes`)

    for (const dataSource of surface.dataSources) {
      assert.ok(knownDataSources.has(dataSource), `${surface.id} has unknown data source ${dataSource}`)
    }

    for (const layer of surface.requiredLayers) {
      assert.ok(knownLayers.has(layer), `${surface.id} has unknown layer ${layer}`)
    }
  }
})

test('mobile surface manifest points only at source and test files that exist today', () => {
  for (const surface of MOBILE_SURFACE_MANIFEST) {
    assertRepoFileExists(surface.sourcePath)

    for (const testFile of surface.existingTestFiles) {
      assertRepoFileExists(testFile)
    }
  }
})

test('mobile auth source test group is exported as a standalone runnable group', () => {
  assert.equal(MOBILE_AUTH_TESTS.id, 'MOBILE_AUTH_TESTS')
  assert.equal(MOBILE_AUTH_TESTS.label, 'Auth/bootstrap/session provider')
  assert.equal(MOBILE_AUTH_TESTS.layer, MOBILE_TEST_LAYERS.SOURCE_MODEL)
  assert.deepEqual(MOBILE_AUTH_TESTS.testFiles, [
    'tests/mobile-auth-gate.test.js',
    'tests/mobile-auth-bootstrap.test.js',
    'tests/mobile-auth-screen-models.test.js',
    'tests/mobile-auth-role-flow.test.js',
    'tests/mobile-auth-session-provider.test.js',
    'tests/mobile-auth-profile-actions.test.js',
    'tests/mobile-auth-invitation-code-flow.test.js',
    'tests/mobile-athlete-invitation-runtime.test.js',
    'tests/mobile-supabase-config.test.js',
  ])
  assert.equal(MOBILE_SOURCE_TEST_GROUPS.MOBILE_AUTH_TESTS, MOBILE_AUTH_TESTS)

  for (const testFile of MOBILE_AUTH_TESTS.testFiles) {
    assertRepoFileExists(testFile)
  }
})

test('mobile shell source test group is exported as a standalone runnable group', () => {
  assert.equal(MOBILE_SHELL_TESTS.id, 'MOBILE_SHELL_TESTS')
  assert.equal(MOBILE_SHELL_TESTS.label, 'App shell, header, bottom nav, loading state, theme, and shared primitives')
  assert.equal(MOBILE_SHELL_TESTS.layer, MOBILE_TEST_LAYERS.SOURCE_MODEL)
  assert.deepEqual(MOBILE_SHELL_TESTS.testFiles, [
    'tests/mobile-app-shell.test.js',
    'tests/mobile-app-render-models.test.js',
    'tests/mobile-shell-view-models.test.js',
    'tests/mobile-loading-view.test.js',
    'tests/mobile-header-shell.test.js',
    'tests/mobile-bottom-nav-lucide.test.js',
    'tests/mobile-top-header-lucide.test.js',
    'tests/mobile-theme-surface-pass.test.js',
    'tests/mobile-light-theme-polish.test.js',
    'tests/mobile-nativewind-setup.test.js',
    'tests/mobile-card-models.test.js',
    'tests/mobile-preview-state-models.test.js',
    'tests/mobile-render-plans.test.js',
    'tests/mobile-styles.test.js',
    'tests/mobile-tab-models.test.js',
    'tests/mobile-text-nativewind.test.js',
  ])
  assert.equal(MOBILE_SOURCE_TEST_GROUPS.MOBILE_SHELL_TESTS, MOBILE_SHELL_TESTS)

  for (const testFile of MOBILE_SHELL_TESTS.testFiles) {
    assertRepoFileExists(testFile)
  }
})

test('mobile train source test group is exported as a standalone runnable group', () => {
  assert.equal(MOBILE_TRAIN_TESTS.id, 'MOBILE_TRAIN_TESTS')
  assert.equal(MOBILE_TRAIN_TESTS.label, 'Coach athlete context and Train/Home render models')
  assert.equal(MOBILE_TRAIN_TESTS.layer, MOBILE_TEST_LAYERS.SOURCE_MODEL)
  assert.deepEqual(MOBILE_TRAIN_TESTS.testFiles, [
    'tests/mobile-train-foundation.test.js',
    'tests/mobile-train-screen-models.test.js',
    'tests/mobile-train-render-models.test.js',
    'tests/mobile-train-home-nativewind.test.js',
    'tests/mobile-assigned-program-train-state.test.js',
    'tests/mobile-coach-train-bridge.test.js',
    'tests/mobile-coach-landing.test.js',
    'tests/mobile-view-items.test.js',
    'tests/mobile-surface-sections.test.js',
    'tests/mobile-surface-models.test.js',
  ])
  assert.equal(MOBILE_SOURCE_TEST_GROUPS.MOBILE_TRAIN_TESTS, MOBILE_TRAIN_TESTS)

  for (const testFile of MOBILE_TRAIN_TESTS.testFiles) {
    assertRepoFileExists(testFile)
  }
})

test('mobile session source test group is exported as a standalone runnable group', () => {
  assert.equal(MOBILE_SESSION_TESTS.id, 'MOBILE_SESSION_TESTS')
  assert.equal(MOBILE_SESSION_TESTS.label, 'Active workout/session runtime/actions/persistence')
  assert.equal(MOBILE_SESSION_TESTS.layer, MOBILE_TEST_LAYERS.SOURCE_MODEL)
  assert.deepEqual(MOBILE_SESSION_TESTS.testFiles, [
    'tests/mobile-workout-sheet.test.js',
    'tests/mobile-workout-sheet-models.test.js',
    'tests/mobile-workout-open-request-context.test.js',
    'tests/mobile-active-workout-view.test.js',
    'tests/mobile-active-workout-view-models.test.js',
    'tests/mobile-active-session-models.test.js',
    'tests/mobile-session-runtime.test.js',
    'tests/mobile-session-orchestration.test.js',
    'tests/mobile-session-actions.test.js',
    'tests/mobile-session-models.test.js',
    'tests/mobile-session-render-models.test.js',
    'tests/mobile-session-sections.test.js',
    'tests/mobile-completed-session-models.test.js',
    'tests/mobile-discarded-session-models.test.js',
    'tests/mobile-completed-recap-renderers.test.js',
  ])
  assert.equal(MOBILE_SOURCE_TEST_GROUPS.MOBILE_SESSION_TESTS, MOBILE_SESSION_TESTS)

  for (const testFile of MOBILE_SESSION_TESTS.testFiles) {
    assertRepoFileExists(testFile)
  }
})

test('mobile Program Sheet model source tests are explicitly covered by the program/workout group and surface row', () => {
  const programSheetSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.PROGRAM_SHEET)
  const programSheetModelSourceTests = Object.freeze([
    'tests/mobile-program-sheet-models.test.js',
    'tests/mobile-program-sheet-card-backgrounds.test.js',
    'tests/mobile-program-sheet-day-label-layout.test.js',
    'tests/mobile-program-sheet-small-checkbox.test.js',
    'tests/mobile-program-sheet-workouts-heading.test.js',
  ])

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.PROGRAM_SHEET, 'apps/mobile/src/screens/program-sheet.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.PROGRAM_SHEET)
  assert.ok(programSheetSurface.existingTestFiles.includes('tests/mobile-program-sheet-models.test.js'))

  for (const testFile of programSheetModelSourceTests) {
    assert.ok(MOBILE_PROGRAM_WORKOUT_TESTS.testFiles.includes(testFile), `${testFile} must stay in the Program/Workout source group`)
    assert.ok(programSheetSurface.existingTestFiles.includes(testFile), `${testFile} must stay attached to the Program Sheet surface`)
    assertRepoFileExists(testFile)
  }
})

test('mobile Program Edit model source tests are explicitly covered by the program/workout group and surface row', () => {
  const programEditSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.PROGRAM_EDIT_VIEW)
  const programEditModelSource = 'apps/mobile/src/train/program-edit-view-models.js'
  const programEditSelectionSource = 'apps/mobile/src/train/program-edit-selection.js'
  const programEditSourceTest = 'tests/mobile-program-edit-view.test.js'
  const programEditTestSource = readFileSync(resolve(process.cwd(), programEditSourceTest), 'utf8')

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.PROGRAM_EDIT_VIEW, 'apps/mobile/src/screens/program-edit-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.PROGRAM_EDIT_VIEW)
  assertRepoFileExists(programEditModelSource)
  assertRepoFileExists(programEditSelectionSource)
  assert.ok(MOBILE_PROGRAM_WORKOUT_TESTS.testFiles.includes(programEditSourceTest))
  assert.ok(programEditSurface.existingTestFiles.includes(programEditSourceTest))
  assert.match(programEditTestSource, /getProgramEditViewModel/)
  assert.match(programEditTestSource, /\.\.\/apps\/mobile\/src\/train\/program-edit-view-models\.js/)
  assert.match(programEditTestSource, /program-edit-selection/)
})

test('mobile Workout Edit model source tests are explicitly covered by the program/workout group and surface row', () => {
  const workoutEditSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.WORKOUT_EDIT_VIEW)
  const workoutEditModelSource = 'apps/mobile/src/train/workout-edit-view-models.js'
  const workoutEditSelectionSource = 'apps/mobile/src/train/workout-edit-selection.js'
  const workoutEditSourceTest = 'tests/mobile-workout-edit-view.test.js'
  const workoutEditTestSource = readFileSync(resolve(process.cwd(), workoutEditSourceTest), 'utf8')

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_EDIT_VIEW, 'apps/mobile/src/screens/workout-edit-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_EDIT_VIEW)
  assertRepoFileExists(workoutEditModelSource)
  assertRepoFileExists(workoutEditSelectionSource)
  assert.ok(MOBILE_PROGRAM_WORKOUT_TESTS.testFiles.includes(workoutEditSourceTest))
  assert.ok(workoutEditSurface.existingTestFiles.includes(workoutEditSourceTest))
  assert.match(workoutEditTestSource, /readFileSync\(resolve\(process\.cwd\(\), 'apps\/mobile\/src\/train\/workout-edit-view-models\.js'\)/)
  assert.match(workoutEditTestSource, /createEmptyWorkoutEditDraftModel/)
  assert.match(workoutEditTestSource, /getWorkoutEditViewModel/)
  assert.match(workoutEditTestSource, /workout-edit-selection/)
})

test('mobile Training Calendar model source tests are explicitly covered by the program/workout group and surface row', () => {
  const trainingCalendarSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.TRAINING_CALENDAR_SHEET)
  const trainingCalendarModelSource = 'apps/mobile/src/train/training-calendar-models.js'
  const trainingCalendarSourceTest = 'tests/mobile-training-calendar-sheet.test.js'
  const trainingCalendarTestSource = readFileSync(resolve(process.cwd(), trainingCalendarSourceTest), 'utf8')

  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.TRAINING_CALENDAR_SHEET, 'apps/mobile/src/screens/training-calendar-sheet.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.TRAINING_CALENDAR_SHEET)
  assertRepoFileExists(trainingCalendarModelSource)
  assert.ok(MOBILE_PROGRAM_WORKOUT_TESTS.testFiles.includes(trainingCalendarSourceTest))
  assert.ok(trainingCalendarSurface.existingTestFiles.includes(trainingCalendarSourceTest))
  assert.match(trainingCalendarTestSource, /getTrainingCalendarModel/)
  assert.match(trainingCalendarTestSource, /\.\.\/apps\/mobile\/src\/train\/training-calendar-models\.js/)
  assert.match(trainingCalendarTestSource, /readFileSync\(resolve\(process\.cwd\(\), 'apps\/mobile\/src\/train\/training-calendar-models\.js'\)/)
  assert.match(trainingCalendarTestSource, /mapWorkoutStatusToCalendarStatus/)
  assert.match(trainingCalendarTestSource, /formatWeekRangeLabel/)
})

test('mobile program/workout source test group is exported as a standalone runnable group', () => {
  assert.equal(MOBILE_PROGRAM_WORKOUT_TESTS.id, 'MOBILE_PROGRAM_WORKOUT_TESTS')
  assert.equal(MOBILE_PROGRAM_WORKOUT_TESTS.label, 'Workout sheet/edit/program sheet/edit models')
  assert.equal(MOBILE_PROGRAM_WORKOUT_TESTS.layer, MOBILE_TEST_LAYERS.SOURCE_MODEL)
  assert.deepEqual(MOBILE_PROGRAM_WORKOUT_TESTS.testFiles, [
    'tests/mobile-program-sheet-models.test.js',
    'tests/mobile-program-sheet-card-backgrounds.test.js',
    'tests/mobile-program-sheet-day-label-layout.test.js',
    'tests/mobile-program-sheet-small-checkbox.test.js',
    'tests/mobile-program-sheet-workouts-heading.test.js',
    'tests/mobile-program-edit-view.test.js',
    'tests/mobile-program-accent-colors.test.js',
    'tests/mobile-training-calendar-sheet.test.js',
    'tests/mobile-workout-edit-view.test.js',
    'tests/mobile-exercise-multi-select-view.test.js',
    'tests/mobile-calendar-strip-nativewind.test.js',
  ])
  assert.equal(MOBILE_SOURCE_TEST_GROUPS.MOBILE_PROGRAM_WORKOUT_TESTS, MOBILE_PROGRAM_WORKOUT_TESTS)

  for (const testFile of MOBILE_PROGRAM_WORKOUT_TESTS.testFiles) {
    assertRepoFileExists(testFile)
  }
})

test('Phase 7 Exercises, progress, and profile coverage includes the Exercise Library View surface', () => {
  const exerciseLibrarySurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.EXERCISE_LIBRARY)
  const exerciseLibrarySource = readFileSync(resolve(process.cwd(), MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_LIBRARY), 'utf8')
  const exerciseLibraryTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-exercise-library-view.test.js'), 'utf8')

  assert.equal(MOBILE_SURFACE_IDS.EXERCISE_LIBRARY, 'exercise-library')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_LIBRARY, 'apps/mobile/src/screens/exercise-library-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_LIBRARY)
  assert.equal(MOBILE_SURFACE_ENTRY_POINTS.EXERCISE_LIBRARY, 'bottom tab Exercises')

  assert.equal(exerciseLibrarySurface.label, 'Exercise library view')
  assert.equal(exerciseLibrarySurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(exerciseLibrarySurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(exerciseLibrarySurface.kind, MOBILE_SURFACE_TYPES.TAB)
  assert.deepEqual(exerciseLibrarySurface.dataSources, [
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.AUTH_SESSION,
  ])
  assert.deepEqual(exerciseLibrarySurface.existingTestFiles, [
    'tests/mobile-exercise-library-view.test.js',
    'tests/mobile-exercise-metric-profile-resolution.test.js',
  ])
  assert.ok(exerciseLibrarySurface.requiredLayers.includes(MOBILE_TEST_LAYERS.DATA_PERSISTENCE))
  assert.ok(exerciseLibrarySurface.requiredLayers.includes(MOBILE_TEST_LAYERS.VISUAL_DEVICE))
  assert.ok(exerciseLibrarySurface.missingLayers.includes(MOBILE_TEST_LAYERS.EXPO_RUNTIME))
  assert.ok(exerciseLibrarySurface.missingLayers.includes(MOBILE_TEST_LAYERS.SIMULATOR_SMOKE))

  assert.ok(MOBILE_EXERCISE_PROGRESS_TESTS.testFiles.includes('tests/mobile-exercise-library-view.test.js'))
  assert.match(exerciseLibrarySource, /export function ExerciseLibraryView\(/)
  assert.match(exerciseLibrarySource, /AppSheetHeader/)
  assert.match(exerciseLibrarySource, /AppSearchInput/)
  assert.match(exerciseLibrarySource, /AppSurfaceCard/)
  assert.match(exerciseLibrarySource, /return onPressExercise\?\.\(exercise\)/)
  assert.match(exerciseLibraryTestSource, /shared exercise library view reuses the app exercise screen shell/)
})

test('Phase 7 Exercises, progress, and profile coverage includes the Exercise Detail View surface', () => {
  const exerciseDetailSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.EXERCISE_DETAIL)
  const exerciseDetailSource = readFileSync(resolve(process.cwd(), MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_DETAIL), 'utf8')
  const exerciseDetailModelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/exercise-detail-view-models.js'), 'utf8')
  const exerciseDetailTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-exercise-detail-view.test.js'), 'utf8')

  assert.equal(MOBILE_SURFACE_IDS.EXERCISE_DETAIL, 'exercise-detail')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_DETAIL, 'apps/mobile/src/screens/exercise-detail-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_DETAIL)
  assert.equal(MOBILE_SURFACE_ENTRY_POINTS.EXERCISE_DETAIL, 'exercise library row or workout exercise detail action')

  assert.equal(exerciseDetailSurface.label, 'Exercise detail view')
  assert.equal(exerciseDetailSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(exerciseDetailSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(exerciseDetailSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.deepEqual(exerciseDetailSurface.dataSources, [
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.PURE_MODEL,
  ])
  assert.deepEqual(exerciseDetailSurface.existingTestFiles, [
    'tests/mobile-exercise-detail-view.test.js',
    'tests/mobile-exercise-metric-profile-resolution.test.js',
  ])
  assert.ok(exerciseDetailSurface.requiredLayers.includes(MOBILE_TEST_LAYERS.DATA_PERSISTENCE))
  assert.ok(exerciseDetailSurface.requiredLayers.includes(MOBILE_TEST_LAYERS.VISUAL_DEVICE))
  assert.ok(exerciseDetailSurface.missingLayers.includes(MOBILE_TEST_LAYERS.EXPO_RUNTIME))
  assert.ok(exerciseDetailSurface.missingLayers.includes(MOBILE_TEST_LAYERS.SIMULATOR_SMOKE))

  assert.ok(MOBILE_EXERCISE_PROGRESS_TESTS.testFiles.includes('tests/mobile-exercise-detail-view.test.js'))
  assert.match(exerciseDetailSource, /function ExerciseProgressChart\(/)
  assert.match(exerciseDetailSource, /function ExerciseHistoryTable\(/)
  assert.match(exerciseDetailSource, /VideoView/)
  assert.match(exerciseDetailSource, /model\?\.videoUrl/)
  assert.match(exerciseDetailSource, /model\.progressYAxisLabel/)
  assert.match(exerciseDetailSource, /model\.historyHeaders\.map/)
  assert.match(exerciseDetailModelSource, /export function getExerciseDetailViewModel\(/)
  assert.match(exerciseDetailModelSource, /resolveMetricProfileIdFromExercise/)
  assert.match(exerciseDetailTestSource, /mobile app shell owns a dedicated exercise detail view state and selected exercise model/)
  assert.match(exerciseDetailTestSource, /mobile workout sheet, edit view, active workout, and completed recap hand exercise detail off through the app shell via the extracted orchestration seam/)
})

test('Phase 7 Exercises, progress, and profile coverage includes the Exercise Video Preview surface', () => {
  const exerciseVideoPreviewSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.EXERCISE_VIDEO_PREVIEW)
  const exerciseVideoPreviewSource = readFileSync(resolve(process.cwd(), MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_VIDEO_PREVIEW), 'utf8')
  const exerciseDetailModelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/exercise-detail-view-models.js'), 'utf8')
  const exerciseDetailTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-exercise-detail-view.test.js'), 'utf8')

  assert.equal(MOBILE_SURFACE_IDS.EXERCISE_VIDEO_PREVIEW, 'exercise-video-preview')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_VIDEO_PREVIEW, 'apps/mobile/src/screens/exercise-detail-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.EXERCISE_VIDEO_PREVIEW)
  assert.equal(MOBILE_SURFACE_ENTRY_POINTS.EXERCISE_VIDEO_PREVIEW, 'exercise detail media header video preview')

  assert.equal(exerciseVideoPreviewSurface.label, 'Exercise video preview')
  assert.equal(exerciseVideoPreviewSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(exerciseVideoPreviewSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(exerciseVideoPreviewSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.deepEqual(exerciseVideoPreviewSurface.dataSources, [
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.PURE_MODEL,
  ])
  assert.deepEqual(exerciseVideoPreviewSurface.existingTestFiles, [
    'tests/mobile-app-shell.test.js',
    'tests/mobile-exercise-detail-view.test.js',
  ])
  assert.ok(exerciseVideoPreviewSurface.requiredLayers.includes(MOBILE_TEST_LAYERS.DATA_PERSISTENCE))
  assert.ok(exerciseVideoPreviewSurface.requiredLayers.includes(MOBILE_TEST_LAYERS.VISUAL_DEVICE))
  assert.ok(exerciseVideoPreviewSurface.missingLayers.includes(MOBILE_TEST_LAYERS.EXPO_RUNTIME))
  assert.ok(exerciseVideoPreviewSurface.missingLayers.includes(MOBILE_TEST_LAYERS.SIMULATOR_SMOKE))

  assert.ok(MOBILE_EXERCISE_PROGRESS_TESTS.testFiles.includes('tests/mobile-exercise-detail-view.test.js'))
  assert.match(exerciseVideoPreviewSource, /from 'expo-video'/)
  assert.match(exerciseVideoPreviewSource, /useVideoPlayer\(model\?\.videoUrl \|\| null/)
  assert.match(exerciseVideoPreviewSource, /<VideoView/)
  assert.match(exerciseVideoPreviewSource, /nativeControls/)
  assert.match(exerciseVideoPreviewSource, /testID="exercise-detail-video-preview"/)
  assert.match(exerciseVideoPreviewSource, /testID="exercise-detail-progress-chart"/)
  assert.match(exerciseDetailModelSource, /videoUrl: normalizeDirectSupabaseMp4Url\(exercise\?\.videoUrl\) \|\| normalizeDirectSupabaseMp4Url\(libraryDetail\.videoUrl\) \|\| DEFAULT_VIDEO_URL/)
  assert.match(exerciseDetailModelSource, /const DEFAULT_VIDEO_URL = null/)
  assert.match(exerciseDetailModelSource, /parsedUrl\.hostname\.endsWith\('\.supabase\.co'\)/)
  assert.match(exerciseDetailModelSource, /parsedUrl\.pathname\.includes\('\/storage\/v1\/object\/public\/exercise-videos\/'\)/)
  assert.match(exerciseDetailModelSource, /parsedUrl\.pathname\.toLowerCase\(\)\.endsWith\('\.mp4'\)/)
  assert.match(exerciseDetailTestSource, /mobile exercise detail view is video-ready and keeps one shared shell/)
  assert.match(exerciseDetailTestSource, /mobile exercise detail view prefers the imported exercise video URL even for known library exercise ids/)
})

test('Phase 7 Exercises, progress, and profile coverage includes the Analytics/Progress View surface', () => {
  const progressAnalyticsSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.PROGRESS_ANALYTICS)
  const progressAnalyticsSource = readFileSync(resolve(process.cwd(), MOBILE_SURFACE_SOURCE_PATHS.PROGRESS_ANALYTICS), 'utf8')
  const progressModelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')
  const analyticsViewTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-analytics-view.test.js'), 'utf8')
  const progressModelTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-progress-models.test.js'), 'utf8')

  assert.equal(MOBILE_SURFACE_IDS.PROGRESS_ANALYTICS, 'progress-analytics')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.PROGRESS_ANALYTICS, 'apps/mobile/src/screens/analytics-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.PROGRESS_ANALYTICS)
  assert.equal(MOBILE_SURFACE_ENTRY_POINTS.PROGRESS_ANALYTICS, 'bottom tab Progress')

  assert.equal(progressAnalyticsSurface.label, 'Analytics/progress view')
  assert.equal(progressAnalyticsSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(progressAnalyticsSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(progressAnalyticsSurface.kind, MOBILE_SURFACE_TYPES.TAB)
  assert.deepEqual(progressAnalyticsSurface.dataSources, [
    MOBILE_DATA_SOURCES.PURE_MODEL,
    MOBILE_DATA_SOURCES.SUPABASE,
  ])
  assert.deepEqual(progressAnalyticsSurface.existingTestFiles, [
    'tests/mobile-app-shell.test.js',
    'tests/mobile-analytics-view.test.js',
    'tests/mobile-progress-models.test.js',
    'tests/mobile-analytics-strength-classification.test.js',
  ])
  assert.ok(progressAnalyticsSurface.requiredLayers.includes(MOBILE_TEST_LAYERS.DATA_PERSISTENCE))
  assert.ok(progressAnalyticsSurface.requiredLayers.includes(MOBILE_TEST_LAYERS.VISUAL_DEVICE))
  assert.ok(progressAnalyticsSurface.requiredLayers.includes(MOBILE_TEST_LAYERS.SIMULATOR_SMOKE))
  assert.ok(progressAnalyticsSurface.missingLayers.includes(MOBILE_TEST_LAYERS.EXPO_RUNTIME))
  assert.ok(progressAnalyticsSurface.missingLayers.includes(MOBILE_TEST_LAYERS.SIMULATOR_SMOKE))

  assert.ok(MOBILE_EXERCISE_PROGRESS_TESTS.testFiles.includes('tests/mobile-analytics-view.test.js'))
  assert.ok(MOBILE_EXERCISE_PROGRESS_TESTS.testFiles.includes('tests/mobile-progress-models.test.js'))
  assert.match(progressAnalyticsSource, /export function AnalyticsView\(/)
  assert.match(progressAnalyticsSource, /getAnalyticsViewModel/)
  assert.match(progressAnalyticsSource, /StrengthMetricsCard/)
  assert.match(progressAnalyticsSource, /ConsistencyBarChart/)
  assert.match(progressAnalyticsSource, /RecoveryOverview/)
  assert.match(progressAnalyticsSource, /ActivityOverview/)
  assert.match(progressAnalyticsSource, /testID="analytics-consistency-chart"/)
  assert.match(progressAnalyticsSource, /testID="analytics-body-map-surface"/)
  assert.match(progressAnalyticsSource, /testID="analytics-body-map-figure"/)
  assert.match(progressAnalyticsSource, /activeProgressOptionId/)
  assert.match(progressAnalyticsSource, /activeTrainingLoadOptionId/)
  assert.match(progressAnalyticsSource, /ExerciseLibraryView/)
  assert.match(progressModelSource, /export function getAnalyticsViewModel\(/)
  assert.match(progressModelSource, /buildAnalyticsStrengthCards/)
  assert.match(progressModelSource, /buildAnalyticsRecoveryMuscleGroups/)
  assert.match(analyticsViewTestSource, /mobile analytics view maps the first-pass Progress and Training Load structure from the reference/)
  assert.match(analyticsViewTestSource, /mobile analytics recovery view supports borderless figure art and muscle drilldown with a primary green back button/)
  assert.match(progressModelTestSource, /getProgressSurfaceModel derives athlete metrics from completed sessions/)
})

test('mobile exercise/progress source test group is exported as a standalone runnable group', () => {
  assert.equal(MOBILE_EXERCISE_PROGRESS_TESTS.id, 'MOBILE_EXERCISE_PROGRESS_TESTS')
  assert.equal(MOBILE_EXERCISE_PROGRESS_TESTS.label, 'Exercise library/detail/video/metric profiles and Progress analytics')
  assert.equal(MOBILE_EXERCISE_PROGRESS_TESTS.layer, MOBILE_TEST_LAYERS.SOURCE_MODEL)
  assert.deepEqual(MOBILE_EXERCISE_PROGRESS_TESTS.testFiles, [
    'tests/mobile-exercise-library-view.test.js',
    'tests/mobile-exercise-detail-view.test.js',
    'tests/mobile-exercise-metric-profile-resolution.test.js',
    'tests/mobile-analytics-view.test.js',
    'tests/mobile-progress-models.test.js',
    'tests/mobile-analytics-strength-classification.test.js',
  ])
  assert.equal(MOBILE_SOURCE_TEST_GROUPS.MOBILE_EXERCISE_PROGRESS_TESTS, MOBILE_EXERCISE_PROGRESS_TESTS)

  for (const testFile of MOBILE_EXERCISE_PROGRESS_TESTS.testFiles) {
    assertRepoFileExists(testFile)
  }
})

test('mobile profile/group source test group is exported as a standalone runnable group', () => {
  assert.equal(MOBILE_PROFILE_GROUP_TESTS.id, 'MOBILE_PROFILE_GROUP_TESTS')
  assert.equal(MOBILE_PROFILE_GROUP_TESTS.label, 'Profile/groups/invitation surfaces')
  assert.equal(MOBILE_PROFILE_GROUP_TESTS.layer, MOBILE_TEST_LAYERS.SOURCE_MODEL)
  assert.deepEqual(MOBILE_PROFILE_GROUP_TESTS.testFiles, [
    'tests/mobile-profile-view.test.js',
    'tests/mobile-group-edit-view.test.js',
    'tests/mobile-groups-repository.test.js',
    'tests/mobile-athlete-invitation.test.js',
  ])
  assert.equal(MOBILE_SOURCE_TEST_GROUPS.MOBILE_PROFILE_GROUP_TESTS, MOBILE_PROFILE_GROUP_TESTS)

  for (const testFile of MOBILE_PROFILE_GROUP_TESTS.testFiles) {
    assertRepoFileExists(testFile)
  }
})

test('Phase 7 Exercises, progress, and profile coverage includes the Profile View surface', () => {
  const profileViewSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.PROFILE_SETTINGS)
  const profileViewSource = readFileSync(resolve(process.cwd(), MOBILE_SURFACE_SOURCE_PATHS.PROFILE_SETTINGS), 'utf8')
  const profileViewTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-profile-view.test.js'), 'utf8')
  const authProfileActionsTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-auth-profile-actions.test.js'), 'utf8')

  assert.equal(MOBILE_SURFACE_IDS.PROFILE_SETTINGS, 'profile-settings')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.PROFILE_SETTINGS, 'apps/mobile/src/screens/profile-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.PROFILE_SETTINGS)
  assert.equal(MOBILE_SURFACE_ENTRY_POINTS.PROFILE_SETTINGS, 'profile/account action from shell')

  assert.equal(profileViewSurface.label, 'Profile and settings')
  assert.equal(profileViewSurface.role, MOBILE_SURFACE_ROLES.SHARED)
  assert.equal(profileViewSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(profileViewSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.deepEqual(profileViewSurface.dataSources, [
    MOBILE_DATA_SOURCES.AUTH_SESSION,
    MOBILE_DATA_SOURCES.SUPABASE,
  ])
  assert.deepEqual(profileViewSurface.requiredLayers, [
    MOBILE_TEST_LAYERS.SURFACE_INVENTORY,
    MOBILE_TEST_LAYERS.SOURCE_MODEL,
    MOBILE_TEST_LAYERS.EXPO_RUNTIME,
    MOBILE_TEST_LAYERS.SIMULATOR_SMOKE,
    MOBILE_TEST_LAYERS.DATA_PERSISTENCE,
    MOBILE_TEST_LAYERS.VISUAL_DEVICE,
    MOBILE_TEST_LAYERS.SAFE_WORKFLOW,
    MOBILE_TEST_LAYERS.APP_STORE_READINESS,
  ])
  assert.deepEqual(profileViewSurface.existingTestFiles, [
    'tests/mobile-app-shell.test.js',
    'tests/mobile-profile-view.test.js',
    'tests/mobile-auth-profile-actions.test.js',
    'tests/mobile-auth-session-provider.test.js',
  ])
  assert.equal(profileViewSurface.simulatorSmokePriority, 'p0')

  assert.ok(MOBILE_PROFILE_GROUP_TESTS.testFiles.includes('tests/mobile-profile-view.test.js'))
  assert.ok(MOBILE_AUTH_TESTS.testFiles.includes('tests/mobile-auth-profile-actions.test.js'))
  assert.ok(MOBILE_AUTH_TESTS.testFiles.includes('tests/mobile-auth-session-provider.test.js'))
  assert.match(profileViewSource, /export function ProfileView\(/)
  assert.match(profileViewSource, /function ProfileViewContent\(/)
  assert.match(profileViewSource, /PROFILE_SECTIONS/)
  assert.match(profileViewSource, /function ProfileDetailsView\(/)
  assert.match(profileViewSource, /ProfileSignOutButton/)
  assert.match(profileViewSource, /onSignOut/)
  assert.match(profileViewTestSource, /mobile app shell owns a dedicated profile view opened from the top header user icon/)
  assert.match(profileViewTestSource, /mobile profile view uses the requested simple section structure and related icons/)
  assert.match(authProfileActionsTestSource, /profile action|profile/i)
})

test('Phase 7 Exercises, progress, profile, and groups coverage includes the Group Edit View surface', () => {
  const groupEditSurface = getMobileSurfaceById(MOBILE_SURFACE_IDS.GROUPS_EDIT)
  const groupEditSource = readFileSync(resolve(process.cwd(), MOBILE_SURFACE_SOURCE_PATHS.GROUPS_EDIT), 'utf8')
  const groupEditTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-group-edit-view.test.js'), 'utf8')
  const groupsRepositoryTestSource = readFileSync(resolve(process.cwd(), 'tests/mobile-groups-repository.test.js'), 'utf8')

  assert.equal(MOBILE_SURFACE_IDS.GROUPS_EDIT, 'groups-edit')
  assert.equal(MOBILE_SURFACE_SOURCE_PATHS.GROUPS_EDIT, 'apps/mobile/src/screens/group-edit-view.js')
  assertRepoFileExists(MOBILE_SURFACE_SOURCE_PATHS.GROUPS_EDIT)
  assert.equal(MOBILE_SURFACE_ENTRY_POINTS.GROUPS_EDIT, 'coach group create/edit action')

  assert.equal(groupEditSurface.label, 'Group edit view')
  assert.equal(groupEditSurface.role, MOBILE_SURFACE_ROLES.COACH)
  assert.equal(groupEditSurface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_COACH)
  assert.equal(groupEditSurface.kind, MOBILE_SURFACE_TYPES.SCREEN)
  assert.deepEqual(groupEditSurface.dataSources, [
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.LOCAL_STATE,
  ])
  assert.deepEqual(groupEditSurface.requiredLayers, [
    MOBILE_TEST_LAYERS.SURFACE_INVENTORY,
    MOBILE_TEST_LAYERS.SOURCE_MODEL,
    MOBILE_TEST_LAYERS.EXPO_RUNTIME,
    MOBILE_TEST_LAYERS.SIMULATOR_SMOKE,
    MOBILE_TEST_LAYERS.DATA_PERSISTENCE,
    MOBILE_TEST_LAYERS.SAFE_WORKFLOW,
  ])
  assert.deepEqual(groupEditSurface.existingTestFiles, [
    'tests/mobile-group-edit-view.test.js',
    'tests/mobile-groups-repository.test.js',
  ])
  assert.equal(groupEditSurface.simulatorSmokePriority, 'p2')

  assert.ok(MOBILE_PROFILE_GROUP_TESTS.testFiles.includes('tests/mobile-group-edit-view.test.js'))
  assert.ok(MOBILE_PROFILE_GROUP_TESTS.testFiles.includes('tests/mobile-groups-repository.test.js'))
  assert.match(groupEditSource, /export function GroupEditView\(/)
  assert.match(groupEditSource, /function GroupEditViewContent\(/)
  assert.match(groupEditSource, /createDraftFromModel/)
  assert.match(groupEditSource, /AthleteMultiSelectView/)
  assert.match(groupEditSource, /AppDangerPillButton/)
  assert.match(groupEditSource, /onDeleteGroup/)
  assert.match(groupEditTestSource, /GroupEditView reuses the workout edit visual shell without rendering notes/)
  assert.match(groupEditTestSource, /mobile app passes coach athletes into the Create\/Edit Group view model/)
  assert.match(groupsRepositoryTestSource, /createMobileGroupsClient|athlete_groups|group_memberships/)
})

test('mobile source test groups are stable, grouped by product area, and reference existing tests', () => {
  assert.deepEqual(Object.keys(MOBILE_SOURCE_TEST_GROUPS), expectedSourceGroupIds)

  const allExistingMobileTests = readdirSync(resolve(process.cwd(), 'tests'))
    .filter((fileName) => /^mobile-.*\.test\.js$/.test(fileName))
    .map((fileName) => `tests/${fileName}`)
    .sort()
  const groupedTestFiles = Object.values(MOBILE_SOURCE_TEST_GROUPS).flatMap((group) => group.testFiles)

  assert.deepEqual(
    Object.fromEntries(Object.entries(MOBILE_SOURCE_TEST_GROUPS).map(([groupId, group]) => [groupId, group.label])),
    expectedSourceGroupLabels,
  )
  assert.deepEqual(
    Array.from(new Set(groupedTestFiles)).sort(),
    allExistingMobileTests,
    'Every existing tests/mobile-*.test.js file must belong to exactly one mobile product-area group',
  )
  assert.equal(new Set(groupedTestFiles).size, groupedTestFiles.length, 'Mobile product-area groups must not duplicate test files')

  for (const [groupId, group] of Object.entries(MOBILE_SOURCE_TEST_GROUPS)) {
    assert.equal(group.id, groupId)
    assert.equal(group.layer, MOBILE_TEST_LAYERS.SOURCE_MODEL)
    assert.equal(typeof group.label, 'string')
    assert.ok(group.label.length > 0, `${groupId} needs a label`)
    assert.ok(Array.isArray(group.testFiles), `${groupId} testFiles must be an array`)
    assert.ok(group.testFiles.length > 0, `${groupId} needs test files`)

    for (const testFile of group.testFiles) {
      assertRepoFileExists(testFile)
    }
  }
})

test('full mobile source test group is the de-duped union of every mobile source group', () => {
  const groupedTestFiles = Array.from(
    new Set(Object.values(MOBILE_SOURCE_TEST_GROUPS).flatMap((group) => group.testFiles)),
  )

  assert.equal(FULL_MOBILE_SOURCE_TESTS.id, 'FULL_MOBILE_SOURCE_TESTS')
  assert.equal(FULL_MOBILE_SOURCE_TESTS.label, 'Full mobile source/model tests')
  assert.equal(FULL_MOBILE_SOURCE_TESTS.layer, MOBILE_TEST_LAYERS.MOBILE_GATE)
  assert.deepEqual(FULL_MOBILE_SOURCE_TESTS.testFiles, groupedTestFiles)

  for (const testFile of FULL_MOBILE_SOURCE_TESTS.testFiles) {
    assertRepoFileExists(testFile)
  }
})

test('mobile runnable test groups include the full mobile source group by id', () => {
  assert.deepEqual(Object.keys(MOBILE_RUNNABLE_TEST_GROUPS), expectedRunnableGroupIds)
  assert.equal(MOBILE_RUNNABLE_TEST_GROUPS.FULL_MOBILE_SOURCE_TESTS, FULL_MOBILE_SOURCE_TESTS)

  for (const [groupId, group] of Object.entries(MOBILE_SOURCE_TEST_GROUPS)) {
    assert.equal(MOBILE_RUNNABLE_TEST_GROUPS[groupId], group)
  }
})

test('mobile surface lookup and coverage summary expose useful manifest proof', () => {
  assert.equal(getMobileSurfaceById('active-workout')?.label, 'Active workout view')
  assert.equal(getMobileSurfaceById('missing-surface'), null)

  const summary = getMobileSurfaceCoverageSummary()
  assert.equal(summary.surfaceCount, expectedSurfaceIds.length)
  assert.equal(summary.layerCount, Object.keys(MOBILE_TEST_LAYERS).length)
  assert.equal(summary.sourceTestGroupCount, expectedSourceGroupIds.length)
  assert.equal(summary.fullSourceTestFileCount, FULL_MOBILE_SOURCE_TESTS.testFiles.length)
  assert.deepEqual(
    summary.byLayer.map((layerSummary) => layerSummary.layer),
    Object.values(MOBILE_TEST_LAYERS),
  )

  const l0Summary = summary.byLayer.find((layerSummary) => layerSummary.layer === MOBILE_TEST_LAYERS.SURFACE_INVENTORY)
  assert.deepEqual(l0Summary.surfaceIds, expectedSurfaceIds)
  assert.equal(l0Summary.surfaceCount, expectedSurfaceIds.length)

  const appStoreSummary = summary.byLayer.find((layerSummary) => layerSummary.layer === MOBILE_TEST_LAYERS.APP_STORE_READINESS)
  assert.deepEqual(appStoreSummary.surfaceIds, ['profile-settings'])
})

test('Phase 6 Programs coverage includes the Program Sheet surface', () => {
  const surface = getMobileSurfaceById(MOBILE_SURFACE_IDS.PROGRAM_SHEET)

  assert.equal(surface.id, MOBILE_SURFACE_IDS.PROGRAM_SHEET)
  assert.equal(surface.label, 'Program sheet')
  assert.equal(surface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.PROGRAM_SHEET)
  assert.equal(surface.sourceFilePath, MOBILE_SURFACE_SOURCE_PATHS.PROGRAM_SHEET)
  assert.equal(surface.sourcePath, 'apps/mobile/src/screens/program-sheet.js')
  assert.equal(surface.role, MOBILE_ROLE_SHARED)
  assert.equal(surface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(surface.kind, MOBILE_SURFACE_TYPE_SHEET)
  assert.equal(surface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.PROGRAM_SHEET)
  assert.equal(surface.entryPoint, 'Train/Home assigned program card')
  assert.deepEqual(surface.dataSources, Object.freeze([
    MOBILE_DATA_SOURCES.PURE_MODEL,
    MOBILE_DATA_SOURCES.SUPABASE,
  ]))
  assert.deepEqual(surface.requiredLayers, Object.freeze([
    MOBILE_LAYER_L0,
    MOBILE_LAYER_L1,
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(surface.missingLayers, Object.freeze([
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(surface.existingTestFiles, Object.freeze([
    'tests/mobile-app-shell.test.js',
    'tests/mobile-program-sheet-models.test.js',
    'tests/mobile-program-sheet-card-backgrounds.test.js',
    'tests/mobile-program-sheet-day-label-layout.test.js',
    'tests/mobile-program-sheet-small-checkbox.test.js',
    'tests/mobile-program-sheet-workouts-heading.test.js',
    'tests/mobile-training-calendar-sheet.test.js',
  ]))
  assert.equal(surface.simulatorSmokePriority, 'p1')

  for (const testFile of surface.existingTestFiles) {
    assertRepoFileExists(testFile)
  }
})

test('Phase 6 Programs coverage includes the Program Edit View surface', () => {
  const surface = getMobileSurfaceById(MOBILE_SURFACE_IDS.PROGRAM_EDIT_VIEW)

  assert.equal(surface.id, MOBILE_SURFACE_IDS.PROGRAM_EDIT_VIEW)
  assert.equal(surface.label, 'Program edit view')
  assert.equal(surface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.PROGRAM_EDIT_VIEW)
  assert.equal(surface.sourceFilePath, MOBILE_SURFACE_SOURCE_PATHS.PROGRAM_EDIT_VIEW)
  assert.equal(surface.sourcePath, 'apps/mobile/src/screens/program-edit-view.js')
  assert.equal(surface.role, MOBILE_ROLE_COACH)
  assert.equal(surface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_COACH)
  assert.equal(surface.kind, MOBILE_SURFACE_TYPE_SCREEN)
  assert.equal(surface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.PROGRAM_EDIT_VIEW)
  assert.equal(surface.entryPoint, 'coach program edit action')
  assert.deepEqual(surface.dataSources, Object.freeze([
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.LOCAL_STATE,
  ]))
  assert.deepEqual(surface.requiredLayers, Object.freeze([
    MOBILE_LAYER_L0,
    MOBILE_LAYER_L1,
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(surface.missingLayers, Object.freeze([
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(surface.existingTestFiles, Object.freeze([
    'tests/mobile-app-shell.test.js',
    'tests/mobile-program-edit-view.test.js',
    'tests/mobile-program-accent-colors.test.js',
    'tests/mobile-program-sheet-models.test.js',
    'tests/mobile-exercise-multi-select-view.test.js',
    'tests/mobile-session-orchestration.test.js',
  ]))
  assert.equal(surface.simulatorSmokePriority, 'p2')

  assertRepoFileExists(surface.sourcePath)
  for (const testFile of surface.existingTestFiles) {
    assertRepoFileExists(testFile)
  }
})

test('Phase 6 Programs coverage includes the Training Calendar Sheet surface', () => {
  const surface = getMobileSurfaceById(MOBILE_SURFACE_IDS.TRAINING_CALENDAR_SHEET)

  assert.equal(surface.id, MOBILE_SURFACE_IDS.TRAINING_CALENDAR_SHEET)
  assert.equal(surface.label, 'Training calendar sheet')
  assert.equal(surface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.TRAINING_CALENDAR_SHEET)
  assert.equal(surface.sourceFilePath, MOBILE_SURFACE_SOURCE_PATHS.TRAINING_CALENDAR_SHEET)
  assert.equal(surface.sourcePath, 'apps/mobile/src/screens/training-calendar-sheet.js')
  assert.equal(surface.role, MOBILE_ROLE_SHARED)
  assert.equal(surface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_SHARED)
  assert.equal(surface.kind, MOBILE_SURFACE_TYPE_SHEET)
  assert.equal(surface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.TRAINING_CALENDAR_SHEET)
  assert.equal(surface.entryPoint, 'Train/Home calendar action')
  assert.deepEqual(surface.dataSources, Object.freeze([
    MOBILE_DATA_SOURCES.PURE_MODEL,
    MOBILE_DATA_SOURCES.SUPABASE,
  ]))
  assert.deepEqual(surface.requiredLayers, Object.freeze([
    MOBILE_LAYER_L0,
    MOBILE_LAYER_L1,
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(surface.missingLayers, Object.freeze([
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(surface.existingTestFiles, Object.freeze([
    'tests/mobile-app-shell.test.js',
    'tests/mobile-train-screen-models.test.js',
    'tests/mobile-program-sheet-models.test.js',
    'tests/mobile-training-calendar-sheet.test.js',
    'tests/mobile-calendar-strip-nativewind.test.js',
  ]))
  assert.equal(surface.simulatorSmokePriority, 'p2')

  assertRepoFileExists(surface.sourcePath)
  for (const testFile of surface.existingTestFiles) {
    assertRepoFileExists(testFile)
  }
})

test('Phase 6 Programs coverage includes the Workout Edit View surface', () => {
  const surface = getMobileSurfaceById(MOBILE_SURFACE_IDS.WORKOUT_EDIT_VIEW)

  assert.equal(surface.id, MOBILE_SURFACE_IDS.WORKOUT_EDIT_VIEW)
  assert.equal(surface.label, 'Workout edit view')
  assert.equal(surface.sourcePath, MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_EDIT_VIEW)
  assert.equal(surface.sourceFilePath, MOBILE_SURFACE_SOURCE_PATHS.WORKOUT_EDIT_VIEW)
  assert.equal(surface.sourcePath, 'apps/mobile/src/screens/workout-edit-view.js')
  assert.equal(surface.role, MOBILE_ROLE_COACH)
  assert.equal(surface.accessState, MOBILE_ACCESS_STATE_AUTHENTICATED_COACH)
  assert.equal(surface.kind, MOBILE_SURFACE_TYPE_SCREEN)
  assert.equal(surface.entryPoint, MOBILE_SURFACE_ENTRY_POINTS.WORKOUT_EDIT_VIEW)
  assert.equal(surface.entryPoint, 'coach workout edit action or create workout draft')
  assert.deepEqual(surface.dataSources, Object.freeze([
    MOBILE_DATA_SOURCES.SUPABASE,
    MOBILE_DATA_SOURCES.LOCAL_STATE,
  ]))
  assert.deepEqual(surface.requiredLayers, Object.freeze([
    MOBILE_LAYER_L0,
    MOBILE_LAYER_L1,
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(surface.missingLayers, Object.freeze([
    MOBILE_LAYER_L3,
    MOBILE_LAYER_L4,
    MOBILE_LAYER_L2,
    MOBILE_LAYER_L5,
    MOBILE_LAYER_L6,
  ]))
  assert.deepEqual(surface.existingTestFiles, Object.freeze([
    'tests/mobile-app-shell.test.js',
    'tests/mobile-workout-sheet.test.js',
    'tests/mobile-workout-edit-view.test.js',
    'tests/mobile-exercise-multi-select-view.test.js',
    'tests/mobile-session-orchestration.test.js',
  ]))
  assert.equal(surface.simulatorSmokePriority, 'p1')

  assertRepoFileExists(surface.sourcePath)
  for (const testFile of surface.existingTestFiles) {
    assertRepoFileExists(testFile)
  }
})
