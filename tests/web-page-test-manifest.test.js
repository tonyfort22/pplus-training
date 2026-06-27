import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  WEB_BROWSER_SMOKE_PRIORITIES,
  WEB_ROUTE_AREAS,
  WEB_ROUTE_AUTH_STATES,
  WEB_BROWSER_SMOKE_HARNESS,
  WEB_TEST_COMMAND_GROUPS,
  WEB_TEST_LAYERS,
  getWebBrowserSmokeHarness,
  getWebPageCoverageSummary,
  getWebPageTestManifest,
  getWebTestCommandGroups,
  webPageTestManifest,
} from '../apps/web/testing/page-test-manifest.js'

const expectedLayers = [
  'L0_ROUTE_INVENTORY',
  'L1_SOURCE_CONTRACTS',
  'L2_API_REPOSITORY',
  'L3_BUILD_STATIC',
  'L4_BROWSER_SMOKE',
  'L5_VISUAL_THEME',
  'L6_SAFE_WORKFLOW',
  'L7_CI_GATE',
]

const expectedAreas = [
  'public',
  'admin-auth',
  'admin-shell',
  'admin-product',
  'support',
  'settings',
  'qa-internal',
]

const expectedAuthStates = [
  'public',
  'redirect-if-authenticated',
  'protected',
  'internal-test-only',
]

const expectedSmokePriorities = ['required', 'important', 'optional', 'internal']

const expectedRouteAreas = {
  '/': 'public',
  '/faq': 'public',
  '/support': 'support',
  '/admin': 'admin-shell',
  '/admin/[section]': 'admin-shell',
  '/admin/[section]/[subsection]': 'admin-shell',
  '/admin/login': 'admin-auth',
  '/admin/forgot-password': 'admin-auth',
  '/admin/reset-password': 'admin-auth',
  '/admin/programs/[programId]': 'admin-product',
  '/admin/support': 'support',
  '/admin/support/reference': 'support',
  '/admin/ui': 'admin-shell',
  '/qa/planner-ai-import': 'qa-internal',
}

const expectedRouteAuthStates = {
  '/': 'public',
  '/faq': 'public',
  '/support': 'public',
  '/admin': 'protected',
  '/admin/[section]': 'protected',
  '/admin/[section]/[subsection]': 'protected',
  '/admin/login': 'redirect-if-authenticated',
  '/admin/forgot-password': 'redirect-if-authenticated',
  '/admin/reset-password': 'redirect-if-authenticated',
  '/admin/programs/[programId]': 'protected',
  '/admin/support': 'protected',
  '/admin/support/reference': 'protected',
  '/admin/ui': 'protected',
  '/qa/planner-ai-import': 'internal-test-only',
}

const expectedRouteBehaviors = {
  '/': { type: 'status', status: 200 },
  '/faq': { type: 'status', status: 200 },
  '/support': { type: 'status', status: 200 },
  '/admin': { type: 'redirect', destination: '/admin/dashboard' },
  '/admin/[section]': { type: 'status', status: 200, samplePath: '/admin/dashboard' },
  '/admin/[section]/[subsection]': { type: 'status', status: 200, samplePath: '/admin/athletes/invites' },
  '/admin/login': { type: 'status', status: 200 },
  '/admin/forgot-password': { type: 'status', status: 200 },
  '/admin/reset-password': { type: 'status', status: 200 },
  '/admin/programs/[programId]': { type: 'status', status: 200, samplePath: '/admin/programs/program-1' },
  '/admin/support': { type: 'status', status: 200 },
  '/admin/support/reference': { type: 'status', status: 200 },
  '/admin/ui': { type: 'redirect', destination: '/admin/dashboard' },
  '/qa/planner-ai-import': { type: 'status', status: 200 },
}

const expectedRouteBrowserSmokePriorities = {
  '/': 'required',
  '/faq': 'important',
  '/support': 'important',
  '/admin': 'important',
  '/admin/[section]': 'required',
  '/admin/[section]/[subsection]': 'required',
  '/admin/login': 'required',
  '/admin/forgot-password': 'important',
  '/admin/reset-password': 'important',
  '/admin/programs/[programId]': 'important',
  '/admin/support': 'important',
  '/admin/support/reference': 'optional',
  '/admin/ui': 'optional',
  '/qa/planner-ai-import': 'internal',
}

const expectedRouteLayerLists = {
  '/': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
  ],
  '/faq': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
  ],
  '/support': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
    'L6_SAFE_WORKFLOW',
  ],
  '/admin': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
  ],
  '/admin/[section]': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
    'L6_SAFE_WORKFLOW',
  ],
  '/admin/[section]/[subsection]': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
  ],
  '/admin/login': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
    'L6_SAFE_WORKFLOW',
  ],
  '/admin/forgot-password': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
    'L6_SAFE_WORKFLOW',
  ],
  '/admin/reset-password': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
    'L6_SAFE_WORKFLOW',
  ],
  '/admin/programs/[programId]': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L2_API_REPOSITORY',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L6_SAFE_WORKFLOW',
  ],
  '/admin/support': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L2_API_REPOSITORY',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L6_SAFE_WORKFLOW',
  ],
  '/admin/support/reference': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
  ],
  '/admin/ui': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
    'L5_VISUAL_THEME',
  ],
  '/qa/planner-ai-import': [
    'L0_ROUTE_INVENTORY',
    'L1_SOURCE_CONTRACTS',
    'L3_BUILD_STATIC',
    'L4_BROWSER_SMOKE',
  ],
}

const expectedRouteExistingTestFiles = {
  '/': [
    'tests/web-landing-page.test.js',
    'tests/web-home-i18n.test.js',
    'tests/web-public-header-route-links.test.js',
    'tests/web-public-header-mobile.test.js',
    'tests/web-public-footer-links.test.js',
    'tests/web-public-admin-link-isolation.test.js',
    'tests/web-public-light-theme.test.js',
    'tests/web-public-language-switcher.test.js',
    'tests/web-public-theme-toggle.test.js',
  ],
  '/faq': [
    'tests/web-faq-page.test.js',
    'tests/web-public-i18n-copy.test.js',
    'tests/web-public-language-switcher.test.js',
    'tests/web-public-theme-toggle.test.js',
  ],
  '/support': [
    'tests/web-support-page.test.js',
    'tests/support-requests-intake.test.js',
    'tests/web-public-language-switcher.test.js',
    'tests/web-public-theme-toggle.test.js',
    'tests/web-public-support-workflows.test.js',
  ],
  '/admin': [
    'tests/web-admin-dashboard-route.test.js',
    'tests/web-admin-index-redirect.test.js',
    'tests/web-admin-sidebar-route-config.test.js',
    'tests/web-admin-active-route-selection.test.js',
    'tests/web-admin-sidebar-one-open-group.test.js',
    'tests/web-admin-sidebar-bullet-reset.test.js',
    'tests/web-admin-control-reset.test.js',
    'tests/web-admin-topbar-layout.test.js',
    'tests/web-admin-account-menu-seam.test.js',
    'tests/web-admin-auth-middleware.test.js',
    'tests/web-admin-protected-route-redirect.test.js',
    'tests/web-admin-ui-reference.test.js',
  ],
  '/admin/[section]': [
    'tests/web-admin-ui-reference.test.js',
    'tests/web-admin-sidebar-route-config.test.js',
    'tests/web-admin-active-route-selection.test.js',
    'tests/web-admin-sidebar-one-open-group.test.js',
    'tests/web-admin-sidebar-bullet-reset.test.js',
    'tests/web-admin-control-reset.test.js',
    'tests/web-admin-topbar-layout.test.js',
    'tests/web-admin-account-menu-seam.test.js',
    'tests/web-admin-data-table-filter-controls.test.js',
    'tests/web-admin-data-table-columns-dropdown.test.js',
    'tests/web-admin-bulk-actions-zero-selection.test.js',
    'tests/web-admin-bulk-actions-confirmation-surfaces.test.js',
    'tests/web-admin-export-review-download-sheets.test.js',
    'tests/web-admin-row-action-menu-handoff.test.js',
    'tests/web-admin-table-empty-states.test.js',
    'tests/web-admin-protected-route-redirect.test.js',
    'tests/web-admin-dashboard-route.test.js',
    'tests/web-admin-shell-light-mode.test.js',
    'tests/web-admin-theme-toggle.test.js',
    'tests/web-admin-settings-workflows.test.js',
  ],
  '/admin/[section]/[subsection]': [
    'tests/web-admin-ui-reference.test.js',
    'tests/web-admin-sidebar-route-config.test.js',
    'tests/web-admin-active-route-selection.test.js',
    'tests/web-admin-sidebar-one-open-group.test.js',
    'tests/web-admin-sidebar-bullet-reset.test.js',
    'tests/web-admin-control-reset.test.js',
    'tests/web-admin-topbar-layout.test.js',
    'tests/web-admin-account-menu-seam.test.js',
    'tests/web-admin-data-table-filter-controls.test.js',
    'tests/web-admin-data-table-columns-dropdown.test.js',
    'tests/web-admin-bulk-actions-zero-selection.test.js',
    'tests/web-admin-bulk-actions-confirmation-surfaces.test.js',
    'tests/web-admin-export-review-download-sheets.test.js',
    'tests/web-admin-row-action-menu-handoff.test.js',
    'tests/web-admin-table-empty-states.test.js',
    'tests/web-admin-protected-route-redirect.test.js',
    'tests/web-admin-settings-account-route.test.js',
    'tests/web-admin-account-repository.test.js',
    'tests/web-admin-settings-profile-route.test.js',
    'tests/web-admin-coach-profile-repository.test.js',
    'tests/web-workout-calendar-ui-polish.test.js',
    'tests/web-admin-workout-calendar-state-transitions.test.js',
  ],
  '/admin/login': [
    'tests/web-admin-login.test.js',
    'tests/web-admin-login-workflow.test.js',
    'tests/web-admin-login-next-redirect.test.js',
    'tests/web-admin-login-i18n.test.js',
    'tests/web-admin-auth-routes.test.js',
    'tests/web-admin-auth-workflows.test.js',
  ],
  '/admin/forgot-password': [
    'tests/web-admin-forgot-password-workflow.test.js',
    'tests/web-admin-auth-routes.test.js',
    'tests/web-admin-auth-workflows.test.js',
  ],
  '/admin/reset-password': [
    'tests/web-admin-reset-password-workflow.test.js',
    'tests/web-admin-auth-routes.test.js',
    'tests/web-admin-auth-workflows.test.js',
  ],
  '/admin/programs/[programId]': [
    'tests/web-program-planner-ai-import-entry.test.js',
    'tests/web-admin-active-route-selection.test.js',
    'tests/web-admin-sidebar-one-open-group.test.js',
    'tests/web-admin-sidebar-bullet-reset.test.js',
    'tests/web-admin-control-reset.test.js',
    'tests/web-admin-topbar-layout.test.js',
    'tests/web-admin-account-menu-seam.test.js',
    'tests/web-admin-protected-route-redirect.test.js',
    'tests/web-ai-workout-draft-review.test.js',
    'tests/web-ai-workout-draft-program-plan-persistence.test.js',
    'tests/program-workout-repository.test.js',
  ],
  '/admin/support': [
    'tests/admin-support-sidebar-shell.test.js',
    'tests/admin-support-external-nav.test.js',
    'tests/web-admin-sidebar-route-config.test.js',
    'tests/web-admin-active-route-selection.test.js',
    'tests/web-admin-sidebar-one-open-group.test.js',
    'tests/web-admin-sidebar-bullet-reset.test.js',
    'tests/web-admin-control-reset.test.js',
    'tests/web-admin-topbar-layout.test.js',
    'tests/web-admin-account-menu-seam.test.js',
    'tests/web-admin-protected-route-redirect.test.js',
    'tests/support-inbox-real-data.test.js',
    'tests/web-admin-support-workflows.test.js',
  ],
  '/admin/support/reference': [
    'tests/admin-support-chat-reference.test.js',
    'tests/admin-support-sidebar-shell.test.js',
  ],
  '/admin/ui': [
    'tests/web-admin-ui-reference.test.js',
    'tests/web-admin-index-redirect.test.js',
    'tests/web-ui-structural.test.js',
    'tests/web-ui-primitives.test.js',
    'tests/web-ui-layouts.test.js',
    'tests/web-ui-foundations.test.js',
    'tests/web-admin-protected-route-redirect.test.js',
  ],
  '/qa/planner-ai-import': [
    'tests/web-program-planner-ai-import-entry.test.js',
    'tests/web-ai-workout-draft-review.test.js',
    'tests/web-ai-workout-draft-pdf-route.test.js',
  ],
}

const expectedPublicWebSourceTestFiles = [
  'tests/web-landing-page.test.js',
  'tests/web-home-i18n.test.js',
  'tests/web-public-header-route-links.test.js',
  'tests/web-public-header-mobile.test.js',
  'tests/web-public-footer-links.test.js',
  'tests/web-public-admin-link-isolation.test.js',
  'tests/web-public-light-theme.test.js',
  'tests/web-public-language-switcher.test.js',
  'tests/web-public-theme-toggle.test.js',
  'tests/web-faq-page.test.js',
  'tests/web-public-i18n-copy.test.js',
  'tests/web-support-page.test.js',
  'tests/web-public-support-workflows.test.js',
]

const expectedAdminAuthSourceTestFiles = [
  'tests/web-admin-login.test.js',
  'tests/web-admin-login-route-api.test.js',
  'tests/web-admin-logout-route-api.test.js',
  'tests/web-admin-login-workflow.test.js',
  'tests/web-admin-login-next-redirect.test.js',
  'tests/web-admin-login-i18n.test.js',
  'tests/web-admin-auth-routes.test.js',
  'tests/web-admin-auth-workflows.test.js',
  'tests/web-admin-forgot-password-route-api.test.js',
  'tests/web-admin-forgot-password-workflow.test.js',
  'tests/web-admin-reset-password-route-api.test.js',
  'tests/web-admin-reset-password-workflow.test.js',
]

const expectedAdminShellSourceTestFiles = [
  'tests/web-admin-ui-reference.test.js',
  'tests/web-admin-dashboard-route.test.js',
  'tests/web-admin-index-redirect.test.js',
  'tests/web-admin-sidebar-route-config.test.js',
  'tests/web-admin-active-route-selection.test.js',
  'tests/web-admin-sidebar-one-open-group.test.js',
  'tests/web-admin-sidebar-bullet-reset.test.js',
  'tests/web-admin-control-reset.test.js',
  'tests/web-admin-topbar-layout.test.js',
  'tests/web-admin-account-menu-seam.test.js',
  'tests/web-admin-data-table-filter-controls.test.js',
  'tests/web-admin-data-table-columns-dropdown.test.js',
  'tests/web-admin-bulk-actions-zero-selection.test.js',
  'tests/web-admin-bulk-actions-confirmation-surfaces.test.js',
  'tests/web-admin-export-review-download-sheets.test.js',
  'tests/web-admin-row-action-menu-handoff.test.js',
  'tests/web-admin-table-empty-states.test.js',
  'tests/web-admin-auth-middleware.test.js',
  'tests/web-admin-destructive-workflow-safety.test.js',
  'tests/web-local-gate-docs.test.js',
  'tests/web-admin-protected-route-redirect.test.js',
  'tests/web-admin-shell-light-mode.test.js',
  'tests/web-admin-theme-toggle.test.js',
  'tests/web-admin-settings-account-route.test.js',
  'tests/web-admin-settings-profile-route.test.js',
  'tests/web-workout-calendar-ui-polish.test.js',
  'tests/web-ui-structural.test.js',
  'tests/web-ui-primitives.test.js',
  'tests/web-ui-layouts.test.js',
  'tests/web-ui-foundations.test.js',
]

const expectedDashboardTestFiles = [
  'tests/web-admin-dashboard-route.test.js',
  'tests/web-admin-dashboard-overview-route-api.test.js',
  'tests/web-admin-dashboard-kpi-empty-states.test.js',
  'tests/web-admin-dashboard-kpi-fixture-states.test.js',
  'tests/web-admin-dashboard-training-execution-calculation.test.js',
  'tests/web-admin-dashboard-ui-data-wiring.test.js',
  'tests/web-admin-dashboard-light-mode.test.js',
  'tests/web-admin-dashboard-repository.test.js',
  'tests/web-admin-dashboard-workflows.test.js',
]

const expectedAthletesTestFiles = [
  'tests/web-admin-athletes-light-mode.test.js',
  'tests/web-admin-athlete-routes-api.test.js',
  'tests/web-admin-invite-routes-api.test.js',
  'tests/web-athlete-create-dialog.test.js',
  'tests/web-admin-athlete-invite-create-repository.test.js',
  'tests/web-admin-athlete-export-fields.test.js',
  'tests/web-admin-athletes-workflows.test.js',
  'tests/web-admin-test-record-cleanup.test.js',
]

const expectedGroupsTestFiles = [
  'tests/web-admin-groups-light-mode.test.js',
  'tests/web-admin-group-routes-api.test.js',
  'tests/web-admin-groups-honesty.test.js',
  'tests/web-admin-group-repository-workflows.test.js',
  'tests/web-admin-groups-export.test.js',
]

const expectedRankingsTestFiles = [
  'tests/web-admin-rankings-light-mode.test.js',
  'tests/web-admin-ranking-route-repository.test.js',
]

const expectedProgramsTestFiles = [
  'tests/web-admin-programs-light-mode.test.js',
  'tests/web-admin-program-list-api-shape.test.js',
  'tests/web-admin-program-create-unassigned-api.test.js',
  'tests/web-admin-programs-workflows.test.js',
  'tests/web-admin-program-edit-api.test.js',
  'tests/web-admin-program-assign-athletes-api.test.js',
  'tests/web-admin-program-duplicate-api.test.js',
  'tests/web-admin-program-archive-api.test.js',
  'tests/web-admin-program-delete-api.test.js',
  'tests/web-admin-program-detail-planner-shape.test.js',
  'tests/web-admin-programs-export.test.js',
  'tests/web-workout-template-program-assignment.test.js',
  'tests/web-program-planner-ai-import-entry.test.js',
  'tests/web-ai-workout-draft-program-plan-persistence.test.js',
  'tests/program-workout-repository.test.js',
  'tests/program-supabase-rest.test.js',
]

const expectedWorkoutsTestFiles = [
  'tests/web-admin-workouts-library-light-mode.test.js',
  'tests/web-admin-workout-calendar-route-api.test.js',
  'tests/web-admin-workout-calendar-state-transitions.test.js',
  'tests/web-admin-workout-template-api-contracts.test.js',
  'tests/web-workouts-upload-control.test.js',
  'tests/web-admin-workouts-export.test.js',
  'tests/web-admin-workouts-workflows.test.js',
  'tests/web-ai-workout-draft-pdf-route.test.js',
  'tests/web-ai-workout-draft-review.test.js',
  'tests/web-workout-template-draft-persistence.test.js',
  'tests/workout-training-ai.test.js',
  'tests/workout-training-ai-voice.test.js',
  'tests/workout-training-builder-expansion.test.js',
]

const expectedExercisesTestFiles = [
  'tests/admin-exercise-repository.test.js',
  'tests/web-admin-exercise-routes-api.test.js',
  'tests/web-admin-exercise-media-route.test.js',
  'tests/web-admin-exercises-library-light-mode.test.js',
  'tests/web-admin-exercises-export.test.js',
  'tests/web-admin-exercises-workflows.test.js',
  'tests/web-exercise-youtube-media.test.js',
  'tests/exercise-supabase-rest.test.js',
]

const expectedSupportAndSettingsTestFiles = [
  'tests/web-support-page.test.js',
  'tests/support-requests-intake.test.js',
  'tests/support-inbox-real-data.test.js',
  'tests/admin-support-sidebar-shell.test.js',
  'tests/admin-support-external-nav.test.js',
  'tests/admin-support-chat-reference.test.js',
  'tests/web-admin-support-workflows.test.js',
  'tests/web-admin-settings-workflows.test.js',
  'tests/web-admin-settings-profile-route.test.js',
  'tests/web-admin-coach-profile-repository.test.js',
  'tests/web-admin-settings-account-route.test.js',
  'tests/web-admin-account-repository.test.js',
  'tests/web-admin-settings-profile-light-mode.test.js',
  'tests/web-admin-settings-account-light-mode.test.js',
]

const expectedBuildStaticTestFiles = [
  'tests/web-build-output-routes.test.js',
]

const expectedBrowserSmokeHarness = {
  runner: 'playwright',
  packageName: '@playwright/test',
  configFile: 'apps/web/playwright.config.js',
  testDir: 'apps/web/e2e',
  specPattern: '**/*.spec.js',
  command: 'node apps/web/testing/run-browser-tests.js --list',
  fixtureSetupCommand: 'node apps/web/testing/browser-workflow-fixtures.js setup',
  fixtureTeardownCommand: 'node apps/web/testing/browser-workflow-fixtures.js teardown',
  fixtureLifecycleScriptFile: 'apps/web/testing/browser-workflow-fixtures.js',
  defaultProject: 'chromium',
  baseUrlConfigFile: 'apps/web/e2e/base-url.js',
  routeSmokeHelperFile: 'apps/web/e2e/route-smoke.js',
  cssLoadedHelperFile: 'apps/web/e2e/css-loaded.js',
  unauthenticatedRedirectHelperFile: 'apps/web/e2e/unauthenticated-redirect.js',
  authenticatedSessionHelperFile: 'apps/web/e2e/authenticated-session.js',
  fixtureIdConfigFile: 'apps/web/e2e/safe-record-fixtures.js',
  publicRouteSmokeSpecFile: 'apps/web/e2e/public-routes-smoke.spec.js',
  publicRouteSmokePaths: ['/', '/faq', '/support'],
  adminAuthRouteSmokeSpecFile: 'apps/web/e2e/admin-auth-routes-smoke.spec.js',
  adminAuthRouteSmokePaths: ['/admin/login', '/admin/forgot-password', '/admin/reset-password'],
  adminShellProtectedRouteSmokeSpecFile: 'apps/web/e2e/admin-shell-protected-routes-smoke.spec.js',
  adminShellProtectedRouteSmokePaths: ['/admin', '/admin/dashboard', '/admin/athletes/invites', '/admin/ui'],
  adminProductRouteSmokeSpecFile: 'apps/web/e2e/admin-product-routes-smoke.spec.js',
  adminProductRouteSmokePaths: [
    '/admin/athletes',
    '/admin/athletes/invites',
    '/admin/athletes/groups',
    '/admin/athletes/rankings',
    '/admin/programs',
    '/admin/programs/:programId',
    '/admin/workouts',
    '/admin/workouts/calendar',
    '/admin/exercises',
  ],
  qaInternalRouteClassificationSmokeSpecFile: 'apps/web/e2e/qa-internal-route-classification-smoke.spec.js',
  qaInternalRouteClassificationSmokePaths: ['/qa/planner-ai-import'],
  publicVisualThemeSpecFile: 'apps/web/e2e/public-home-dark-mode.visual.spec.js',
  publicVisualThemeChecks: [
    {
      id: 'public-home-dark-mode',
      route: '/',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'public-home-light-mode',
      route: '/',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'public-home-mobile-header-drawer',
      route: '/',
      viewport: 'mobile',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'public-faq-dark-mode',
      route: '/faq',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'public-faq-light-mode',
      route: '/faq',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'public-support-dark-mode',
      route: '/support',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'public-support-light-mode',
      route: '/support',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'public-footer-link-layout',
      route: '/',
      viewport: 'responsive',
      layer: 'L5_VISUAL_THEME',
    },
  ],
  publicSafeWorkflowSpecFile: 'apps/web/e2e/public-support-workflows.spec.js',
  publicSafeWorkflowChecks: [
    {
      id: 'public-support-form-validation',
      route: '/support',
      interaction: 'support-form-validation',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'public-support-form-safe-create',
      route: '/support',
      interaction: 'support-form-safe-test-request-create',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'public-language-route-navigation',
      route: '/',
      interaction: 'language-switch-persists-across-public-navigation',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'public-theme-route-navigation',
      route: '/',
      interaction: 'theme-switch-persists-across-public-navigation',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminAuthSafeWorkflowSpecFile: 'apps/web/e2e/admin-auth-workflows.spec.js',
  adminAuthSafeWorkflowChecks: [
    {
      id: 'admin-login-seeded-account',
      route: '/admin/login',
      interaction: 'seeded-admin-account-login',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-login-invalid-visible-error',
      route: '/admin/login',
      interaction: 'invalid-login-visible-error',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-forgot-password-success-non-enumerating',
      route: '/admin/forgot-password',
      interaction: 'forgot-password-success-visible-without-user-enumeration',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-reset-password-invalid-token-visible-error',
      route: '/admin/reset-password',
      interaction: 'reset-password-invalid-token-visible-error',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-logout-returns-to-login',
      route: '/admin/dashboard',
      interaction: 'logout-returns-user-to-login',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminDashboardSafeWorkflowSpecFile: 'apps/web/e2e/admin-dashboard-workflows.spec.js',
  adminDashboardSafeWorkflowChecks: [
    {
      id: 'admin-dashboard-seeded-data-loads',
      route: '/admin/dashboard',
      interaction: 'dashboard-loads-with-seeded-data',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-dashboard-kpi-cards-reflect-fixture-changes',
      route: '/admin/dashboard',
      interaction: 'kpi-cards-reflect-fixture-changes-honestly',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminSupportSafeWorkflowSpecFile: 'apps/web/e2e/admin-support-workflows.spec.js',
  adminSupportSafeWorkflowChecks: [
    {
      id: 'admin-support-open-inbox-seeded-conversation',
      route: '/admin/support',
      interaction: 'open-support-inbox-loads-seeded-conversation-and-messages',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-support-select-conversation-view-messages',
      route: '/admin/support',
      interaction: 'select-conversation-loads-its-message-thread',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-support-draft-reply-without-send',
      route: '/admin/support',
      interaction: 'draft-reply-does-not-post-unless-explicit-test-send-mode',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminSettingsSafeWorkflowSpecFile: 'apps/web/e2e/admin-settings-workflows.spec.js',
  adminSettingsSafeWorkflowChecks: [
    {
      id: 'admin-settings-profile-update-saves-visible-name-avatar',
      route: '/admin/settings',
      interaction: 'profile-update-saves-visible-name-avatar',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-settings-account-validation-errors-visible',
      route: '/admin/settings/account',
      interaction: 'account-validation-errors-appear-visibly',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-settings-account-save-renders-toast',
      route: '/admin/settings/account',
      interaction: 'account-save-renders-success-toast',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminAthletesSafeWorkflowSpecFile: 'apps/web/e2e/admin-athletes-workflows.spec.js',
  adminAthletesSafeWorkflowChecks: [
    {
      id: 'admin-athletes-row-detail-path',
      route: '/admin/athletes',
      interaction: 'all-athletes-row-opens-selected-athlete-detail-path',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-athletes-create-test-athlete',
      route: '/admin/athletes',
      interaction: 'create-athlete-submits-mocked-post-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-athletes-edit-test-athlete',
      route: '/admin/athletes',
      interaction: 'edit-athlete-submits-mocked-patch-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-athletes-invite-test-athlete-safe-email',
      route: '/admin/athletes',
      interaction: 'invite-athlete-submits-mocked-invite-post-with-safe-email',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-athletes-export-csv-review-download',
      route: '/admin/athletes',
      interaction: 'export-athletes-opens-review-sheet-and-downloads-csv',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-athletes-bulk-action-zero-selection-guard',
      route: '/admin/athletes',
      interaction: 'bulk-actions-stays-disabled-and-closed-with-zero-selected-athletes',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminInvitesSafeWorkflowSpecFile: 'apps/web/e2e/admin-invites-workflows.spec.js',
  adminInvitesSafeWorkflowChecks: [
    {
      id: 'admin-invites-revoke-test-invite-through-confirmation',
      route: '/admin/athletes/invites',
      interaction: 'revoke-test-invite-submits-mocked-patch-through-confirmation',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminGroupsSafeWorkflowSpecFile: 'apps/web/e2e/admin-groups-workflows.spec.js',
  adminGroupsSafeWorkflowChecks: [
    {
      id: 'admin-groups-create-edit-delete-test-group',
      route: '/admin/athletes/groups',
      interaction: 'create-edit-delete-test-group-through-mocked-crud',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminProgramsSafeWorkflowSpecFile: 'apps/web/e2e/admin-programs-workflows.spec.js',
  adminProgramsSafeWorkflowChecks: [
    {
      id: 'admin-programs-create-unassigned-test-program',
      route: '/admin/programs',
      interaction: 'create-unassigned-program-submits-mocked-post-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-programs-edit-test-program',
      route: '/admin/programs',
      interaction: 'edit-test-program-submits-mocked-patch-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-programs-assign-test-program-to-test-athlete',
      route: '/admin/programs',
      interaction: 'assign-test-program-submits-mocked-assign-athletes-patch-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-programs-duplicate-test-program',
      route: '/admin/programs',
      interaction: 'duplicate-test-program-submits-mocked-duplicate-post-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-programs-export-selected-programs-csv',
      route: '/admin/programs',
      interaction: 'export-selected-programs-reviews-and-downloads-csv',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-programs-archive-test-program-through-confirmation',
      route: '/admin/programs',
      interaction: 'archive-test-program-confirms-mocked-patch-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-programs-delete-test-program-through-confirmation',
      route: '/admin/programs',
      interaction: 'delete-test-program-confirms-mocked-delete-and-removes-row',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-programs-open-detail-planner-route',
      route: '/admin/programs',
      interaction: 'open-program-detail-planner-route-from-program-name',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminWorkoutsSafeWorkflowSpecFile: 'apps/web/e2e/admin-workouts-workflows.spec.js',
  adminExercisesSafeWorkflowSpecFile: 'apps/web/e2e/admin-exercises-workflows.spec.js',
  adminExercisesSafeWorkflowChecks: [
    {
      id: 'admin-exercises-create-test-exercise',
      route: '/admin/exercises',
      interaction: 'create-exercise-submits-mocked-post-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-exercises-edit-test-exercise',
      route: '/admin/exercises',
      interaction: 'edit-exercise-submits-mocked-patch-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-exercises-attach-direct-mp4-media-url',
      route: '/admin/exercises',
      interaction: 'attach-direct-mp4-url-displays-media-preview-and-saves-patch',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-exercises-export-exercises-csv-review-download',
      route: '/admin/exercises',
      interaction: 'export-exercises-opens-review-sheet-and-downloads-csv',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-exercises-delete-archive-test-exercise-through-confirmation',
      route: '/admin/exercises',
      interaction: 'archive-and-delete-exercises-through-confirmation-dialogs',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminWorkoutsSafeWorkflowChecks: [
    {
      id: 'admin-workouts-create-test-workout-template',
      route: '/admin/workouts',
      interaction: 'create-workout-template-submits-mocked-post-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-workouts-edit-test-workout-template',
      route: '/admin/workouts',
      interaction: 'edit-workout-template-submits-mocked-patch-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-workouts-assign-workout-template-to-test-program',
      route: '/admin/workouts',
      interaction: 'assign-workout-template-submits-mocked-program-assignment-patch-and-refreshes-table',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-workouts-export-workouts-csv-review-download',
      route: '/admin/workouts',
      interaction: 'export-workouts-opens-review-sheet-and-downloads-csv',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-workouts-delete-archive-test-workout-through-confirmation',
      route: '/admin/workouts',
      interaction: 'archive-and-delete-workouts-through-confirmation-dialogs',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-workouts-open-workout-calendar-route',
      route: '/admin/workouts',
      interaction: 'open-workout-calendar-route-from-workouts-sidebar-nav',
      layer: 'L6_SAFE_WORKFLOW',
    },
    {
      id: 'admin-workouts-calendar-fixture-appears-on-expected-date',
      route: '/admin/workouts/calendar',
      interaction: 'calendar-fixture-renders-in-scheduled-date-cell',
      layer: 'L6_SAFE_WORKFLOW',
    },
  ],
  adminVisualThemeSpecFile: 'apps/web/e2e/admin-shell-visual-theme.spec.js',
  adminVisualThemeChecks: [
    {
      id: 'admin-sidebar-dark-mode',
      route: '/admin/dashboard',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-sidebar-light-mode',
      route: '/admin/dashboard',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-topbar-dark-mode',
      route: '/admin/dashboard',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-topbar-light-mode',
      route: '/admin/dashboard',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-account-dropdown-dark-mode',
      route: '/admin/dashboard',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-account-dropdown-light-mode',
      route: '/admin/dashboard',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-route-active-state',
      route: '/admin/programs/program-1',
      interaction: 'active-route-state',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-no-default-controls',
      route: '/admin/dashboard',
      interaction: 'control-appearance-reset',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-mobile-tablet-width',
      route: '/admin/dashboard',
      viewport: 'responsive',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-support-inbox-dark-mode',
      route: '/admin/support/reference',
      theme: 'dark',
      interaction: 'support-inbox-shell',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-support-inbox-light-mode',
      route: '/admin/support/reference',
      theme: 'light',
      interaction: 'support-inbox-shell',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-settings-profile-account-dark-mode',
      route: '/admin/settings',
      theme: 'dark',
      interaction: 'profile-account-forms',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-settings-profile-account-light-mode',
      route: '/admin/settings',
      theme: 'light',
      interaction: 'profile-account-forms',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-dashboard-kpi-card-table-dark-mode',
      route: '/admin/dashboard',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-dashboard-kpi-card-table-light-mode',
      route: '/admin/dashboard',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-athletes-table-filter-dialog-dark-mode',
      route: '/admin/athletes',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-athletes-table-filter-dialog-light-mode',
      route: '/admin/athletes',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-invites-table-dialog-dark-mode',
      route: '/admin/athletes/invites',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-invites-table-dialog-light-mode',
      route: '/admin/athletes/invites',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-groups-table-dialog-dark-mode',
      route: '/admin/athletes/groups',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-groups-table-dialog-light-mode',
      route: '/admin/athletes/groups',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-rankings-table-dark-mode',
      route: '/admin/athletes/rankings',
      theme: 'dark',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-rankings-table-light-mode',
      route: '/admin/athletes/rankings',
      theme: 'light',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-programs-table-sheets-dropdowns-dark-mode',
      route: '/admin/programs',
      theme: 'dark',
      interaction: 'table-sheets-dropdowns',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-programs-table-sheets-dropdowns-light-mode',
      route: '/admin/programs',
      theme: 'light',
      interaction: 'table-sheets-dropdowns',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-workouts-table-sheets-dropdowns-dark-mode',
      route: '/admin/workouts',
      theme: 'dark',
      interaction: 'table-sheets-dropdowns',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-workouts-table-sheets-dropdowns-light-mode',
      route: '/admin/workouts',
      theme: 'light',
      interaction: 'table-sheets-dropdowns',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-workouts-calendar-dark-mode',
      route: '/admin/workouts/calendar',
      theme: 'dark',
      interaction: 'calendar-add-dialog',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-workouts-calendar-light-mode',
      route: '/admin/workouts/calendar',
      theme: 'light',
      interaction: 'calendar-add-dialog',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-exercises-table-sheets-media-dark-mode',
      route: '/admin/exercises',
      theme: 'dark',
      interaction: 'table-sheets-media',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-exercises-table-sheets-media-light-mode',
      route: '/admin/exercises',
      theme: 'light',
      interaction: 'table-sheets-media',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-program-detail-planner-dark-mode',
      route: '/admin/programs/program-1',
      theme: 'dark',
      interaction: 'detail-planner',
      layer: 'L5_VISUAL_THEME',
    },
    {
      id: 'admin-program-detail-planner-light-mode',
      route: '/admin/programs/program-1',
      theme: 'light',
      interaction: 'detail-planner',
      layer: 'L5_VISUAL_THEME',
    },
  ],
  failureArtifacts: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    outputDir: 'apps/web/test-results',
    ciArtifactName: 'pplus-web-browser-test-results',
    ciArtifactRetentionDays: 7,
    ciArtifactIfNoFilesFound: 'ignore',
  },
  baseUrlEnv: 'PPLUS_WEB_PREVIEW_ORIGIN',
  defaultBaseUrl: 'http://127.0.0.1:3000',
}

const expectedFullWebSourceApiTestFiles = [
  ...new Set([
    ...expectedPublicWebSourceTestFiles,
    ...expectedAdminAuthSourceTestFiles,
    ...expectedAdminShellSourceTestFiles,
    ...expectedDashboardTestFiles,
    ...expectedAthletesTestFiles,
    ...expectedGroupsTestFiles,
    ...expectedRankingsTestFiles,
    ...expectedProgramsTestFiles,
    ...expectedWorkoutsTestFiles,
    ...expectedExercisesTestFiles,
    ...expectedSupportAndSettingsTestFiles,
  ]),
]

const expectedCommandOutputWarning = 'MODULE_TYPELESS_PACKAGE_JSON may appear until apps/web/package.json declares a module type'

const expectedCommandOutputs = {
  PUBLIC_WEB_SOURCE_TESTS: { testFiles: 13, suites: 0, tests: 44, pass: 44, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  ADMIN_AUTH_SOURCE_TESTS: { testFiles: 12, suites: 0, tests: 40, pass: 40, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  ADMIN_SHELL_SOURCE_TESTS: { testFiles: 30, suites: 0, tests: 108, pass: 108, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  DASHBOARD_TESTS: { testFiles: 9, suites: 0, tests: 17, pass: 17, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  ATHLETES_TESTS: { testFiles: 8, suites: 0, tests: 32, pass: 32, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  GROUPS_TESTS: { testFiles: 5, suites: 0, tests: 12, pass: 12, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  RANKINGS_TESTS: { testFiles: 2, suites: 0, tests: 6, pass: 6, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  PROGRAMS_TESTS: { testFiles: 16, suites: 0, tests: 94, pass: 94, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  WORKOUTS_TESTS: { testFiles: 13, suites: 0, tests: 98, pass: 98, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  EXERCISES_TESTS: { testFiles: 8, suites: 0, tests: 32, pass: 32, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  SUPPORT_AND_SETTINGS_TESTS: { testFiles: 14, suites: 0, tests: 81, pass: 81, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  BUILD_STATIC_TESTS: { testFiles: 1, suites: 0, tests: 8, pass: 8, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
  FULL_WEB_SOURCE_API_TESTS: { testFiles: 126, suites: 0, tests: 554, pass: 554, fail: 0, cancelled: 0, skipped: 0, todo: 0, warning: expectedCommandOutputWarning },
}

const repoRoot = resolveRepoRoot()
const appDir = join(repoRoot, 'apps/web/app')

function resolveRepoRoot() {
  return dirname(fileURLToPath(import.meta.url)).replace(`${sep}tests`, '')
}

function collectPageRoutes(dir = appDir) {
  const routes = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      routes.push(...collectPageRoutes(fullPath))
      continue
    }

    if (entry.isFile() && entry.name === 'page.jsx') {
      const relativePagePath = relative(appDir, fullPath).split(sep).join('/')
      const routePath = relativePagePath === 'page.jsx' ? '' : relativePagePath.replace(/\/page\.jsx$/, '')
      routes.push(routePath === '' ? '/' : `/${routePath}`)
    }
  }

  return routes.sort()
}

function valuesOf(record) {
  return Object.values(record)
}

test('web page test manifest exposes the shared route testing vocabulary', () => {
  assert.deepEqual(valuesOf(WEB_TEST_LAYERS), expectedLayers)
  assert.deepEqual(valuesOf(WEB_ROUTE_AREAS), expectedAreas)
  assert.deepEqual(valuesOf(WEB_ROUTE_AUTH_STATES), expectedAuthStates)
  assert.deepEqual(valuesOf(WEB_BROWSER_SMOKE_PRIORITIES), expectedSmokePriorities)

  assert.equal(Object.isFrozen(WEB_TEST_LAYERS), true)
  assert.equal(Object.isFrozen(WEB_ROUTE_AREAS), true)
  assert.equal(Object.isFrozen(WEB_ROUTE_AUTH_STATES), true)
  assert.equal(Object.isFrozen(WEB_BROWSER_SMOKE_PRIORITIES), true)
})

test('web page test manifest is exported through a stable getter', () => {
  assert.equal(Array.isArray(webPageTestManifest), true)
  assert.equal(getWebPageTestManifest(), webPageTestManifest)
})

test('web page coverage summary is generated by route and layer', () => {
  const summary = getWebPageCoverageSummary()

  const expectedManifestRoutePaths = Object.keys(expectedRouteAreas)

  assert.equal(summary.routeCount, expectedManifestRoutePaths.length)
  assert.equal(summary.layerCount, expectedLayers.length)
  assert.equal(summary.byRoute.length, expectedManifestRoutePaths.length)
  assert.equal(summary.byLayer.length, expectedLayers.length)
  assert.equal(summary.totalRouteLayerMappings, getWebPageTestManifest().reduce((total, route) => total + route.layers.length, 0))
  assert.equal(summary.uniqueTestFileCount, new Set(getWebPageTestManifest().flatMap((route) => route.existingTestFiles)).size)

  assert.deepEqual(
    summary.byRoute.map((route) => route.path),
    expectedManifestRoutePaths,
  )
  assert.deepEqual(
    summary.byLayer.map((layer) => layer.layer),
    expectedLayers,
  )

  assert.deepEqual(summary.byRoute.find((route) => route.path === '/support'), {
    path: '/support',
    area: 'support',
    authState: 'public',
    layers: expectedRouteLayerLists['/support'],
    layerCount: expectedRouteLayerLists['/support'].length,
    testFileCount: expectedRouteExistingTestFiles['/support'].length,
    testFiles: expectedRouteExistingTestFiles['/support'],
  })

  const safeWorkflowLayer = summary.byLayer.find((layer) => layer.layer === WEB_TEST_LAYERS.SAFE_WORKFLOW)
  assert.deepEqual(safeWorkflowLayer.routes, [
    '/support',
    '/admin/[section]',
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/admin/programs/[programId]',
    '/admin/support',
  ])
  assert.equal(safeWorkflowLayer.routeCount, safeWorkflowLayer.routes.length)
  assert.equal(safeWorkflowLayer.testFileCount, new Set(safeWorkflowLayer.testFiles).size)
})

test('web browser smoke harness chooses Playwright and keeps specs under apps/web/e2e', () => {
  const harness = getWebBrowserSmokeHarness()
  const rootPackageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
  const webPackageJson = JSON.parse(readFileSync(join(repoRoot, 'apps/web/package.json'), 'utf8'))
  const configFullPath = join(repoRoot, harness.configFile)
  const fixtureLifecycleScriptFullPath = join(repoRoot, harness.fixtureLifecycleScriptFile)
  const webEnvExampleFullPath = join(repoRoot, 'apps/web/.env.example')
  const testDirFullPath = join(repoRoot, harness.testDir)
  const baseUrlConfigFullPath = join(repoRoot, harness.baseUrlConfigFile)
  const routeSmokeHelperFullPath = join(repoRoot, harness.routeSmokeHelperFile)
  const cssLoadedHelperFullPath = join(repoRoot, harness.cssLoadedHelperFile)
  const unauthenticatedRedirectHelperFullPath = join(repoRoot, harness.unauthenticatedRedirectHelperFile)
  const authenticatedSessionHelperFullPath = join(repoRoot, harness.authenticatedSessionHelperFile)
  const fixtureIdConfigFullPath = join(repoRoot, harness.fixtureIdConfigFile)
  const publicRouteSmokeSpecFullPath = join(repoRoot, harness.publicRouteSmokeSpecFile)
  const adminAuthRouteSmokeSpecFullPath = join(repoRoot, harness.adminAuthRouteSmokeSpecFile)
  const adminShellProtectedRouteSmokeSpecFullPath = join(repoRoot, harness.adminShellProtectedRouteSmokeSpecFile)
  const adminProductRouteSmokeSpecFullPath = join(repoRoot, harness.adminProductRouteSmokeSpecFile)
  const qaInternalRouteClassificationSmokeSpecFullPath = join(repoRoot, harness.qaInternalRouteClassificationSmokeSpecFile)
  const publicVisualThemeSpecFullPath = join(repoRoot, harness.publicVisualThemeSpecFile)
  const publicSafeWorkflowSpecFullPath = join(repoRoot, harness.publicSafeWorkflowSpecFile)
  const adminAuthSafeWorkflowSpecFullPath = join(repoRoot, harness.adminAuthSafeWorkflowSpecFile)
  const adminDashboardSafeWorkflowSpecFullPath = join(repoRoot, harness.adminDashboardSafeWorkflowSpecFile)
  const adminSupportSafeWorkflowSpecFullPath = join(repoRoot, harness.adminSupportSafeWorkflowSpecFile)
  const adminSettingsSafeWorkflowSpecFullPath = join(repoRoot, harness.adminSettingsSafeWorkflowSpecFile)
  const adminInvitesSafeWorkflowSpecFullPath = join(repoRoot, harness.adminInvitesSafeWorkflowSpecFile)
  const adminGroupsSafeWorkflowSpecFullPath = join(repoRoot, harness.adminGroupsSafeWorkflowSpecFile)
  const adminProgramsSafeWorkflowSpecFullPath = join(repoRoot, harness.adminProgramsSafeWorkflowSpecFile)
  const adminWorkoutsSafeWorkflowSpecFullPath = join(repoRoot, harness.adminWorkoutsSafeWorkflowSpecFile)
  const adminExercisesSafeWorkflowSpecFullPath = join(repoRoot, harness.adminExercisesSafeWorkflowSpecFile)
  const adminVisualThemeSpecFullPath = join(repoRoot, harness.adminVisualThemeSpecFile)

  assert.equal(harness, WEB_BROWSER_SMOKE_HARNESS)
  assert.equal(Object.isFrozen(WEB_BROWSER_SMOKE_HARNESS), true)
  assert.deepEqual(harness, expectedBrowserSmokeHarness)
  assert.equal(rootPackageJson.scripts['test:web:browser'], harness.command)
  assert.equal(rootPackageJson.scripts['test:web:browser:fixtures:setup'], harness.fixtureSetupCommand)
  assert.equal(rootPackageJson.scripts['test:web:browser:fixtures:teardown'], harness.fixtureTeardownCommand)
  assert.equal(webPackageJson.devDependencies[harness.packageName], '^1.57.0')
  assert.equal(existsSync(configFullPath), true, `browser smoke config does not exist: ${harness.configFile}`)
  assert.equal(existsSync(fixtureLifecycleScriptFullPath), true, `browser workflow fixture lifecycle script does not exist: ${harness.fixtureLifecycleScriptFile}`)
  assert.equal(existsSync(testDirFullPath), true, `browser smoke spec directory does not exist: ${harness.testDir}`)
  assert.equal(existsSync(baseUrlConfigFullPath), true, `browser smoke base URL config does not exist: ${harness.baseUrlConfigFile}`)
  assert.equal(existsSync(routeSmokeHelperFullPath), true, `browser smoke route helper does not exist: ${harness.routeSmokeHelperFile}`)
  assert.equal(existsSync(cssLoadedHelperFullPath), true, `browser smoke CSS loaded helper does not exist: ${harness.cssLoadedHelperFile}`)
  assert.equal(existsSync(unauthenticatedRedirectHelperFullPath), true, `browser smoke unauthenticated redirect helper does not exist: ${harness.unauthenticatedRedirectHelperFile}`)
  assert.equal(existsSync(authenticatedSessionHelperFullPath), true, `browser smoke authenticated session helper does not exist: ${harness.authenticatedSessionHelperFile}`)
  assert.equal(existsSync(fixtureIdConfigFullPath), true, `browser smoke fixture ID config does not exist: ${harness.fixtureIdConfigFile}`)
  assert.equal(existsSync(publicRouteSmokeSpecFullPath), true, `public route smoke spec does not exist: ${harness.publicRouteSmokeSpecFile}`)
  assert.equal(existsSync(adminAuthRouteSmokeSpecFullPath), true, `admin auth route smoke spec does not exist: ${harness.adminAuthRouteSmokeSpecFile}`)
  assert.equal(existsSync(adminShellProtectedRouteSmokeSpecFullPath), true, `admin shell protected route smoke spec does not exist: ${harness.adminShellProtectedRouteSmokeSpecFile}`)
  assert.equal(existsSync(adminProductRouteSmokeSpecFullPath), true, `admin product route smoke spec does not exist: ${harness.adminProductRouteSmokeSpecFile}`)
  assert.equal(existsSync(qaInternalRouteClassificationSmokeSpecFullPath), true, `QA/internal route classification smoke spec does not exist: ${harness.qaInternalRouteClassificationSmokeSpecFile}`)
  assert.equal(existsSync(publicVisualThemeSpecFullPath), true, `public visual/theme spec does not exist: ${harness.publicVisualThemeSpecFile}`)
  assert.equal(existsSync(publicSafeWorkflowSpecFullPath), true, `public safe workflow spec does not exist: ${harness.publicSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminAuthSafeWorkflowSpecFullPath), true, `admin auth safe workflow spec does not exist: ${harness.adminAuthSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminDashboardSafeWorkflowSpecFullPath), true, `admin dashboard safe workflow spec does not exist: ${harness.adminDashboardSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminSupportSafeWorkflowSpecFullPath), true, `admin Support safe workflow spec does not exist: ${harness.adminSupportSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminSettingsSafeWorkflowSpecFullPath), true, `admin Settings safe workflow spec does not exist: ${harness.adminSettingsSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminInvitesSafeWorkflowSpecFullPath), true, `admin invites safe workflow spec does not exist: ${harness.adminInvitesSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminGroupsSafeWorkflowSpecFullPath), true, `admin groups safe workflow spec does not exist: ${harness.adminGroupsSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminProgramsSafeWorkflowSpecFullPath), true, `admin Programs safe workflow spec does not exist: ${harness.adminProgramsSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminWorkoutsSafeWorkflowSpecFullPath), true, `admin Workouts safe workflow spec does not exist: ${harness.adminWorkoutsSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminExercisesSafeWorkflowSpecFullPath), true, `admin Exercises safe workflow spec does not exist: ${harness.adminExercisesSafeWorkflowSpecFile}`)
  assert.equal(existsSync(adminVisualThemeSpecFullPath), true, `admin visual/theme spec does not exist: ${harness.adminVisualThemeSpecFile}`)

  const configSource = readFileSync(configFullPath, 'utf8')
  const fixtureLifecycleScriptSource = readFileSync(fixtureLifecycleScriptFullPath, 'utf8')
  const webEnvExampleSource = readFileSync(webEnvExampleFullPath, 'utf8')
  const baseUrlConfigSource = readFileSync(baseUrlConfigFullPath, 'utf8')
  const routeSmokeHelperSource = readFileSync(routeSmokeHelperFullPath, 'utf8')
  const cssLoadedHelperSource = readFileSync(cssLoadedHelperFullPath, 'utf8')
  const unauthenticatedRedirectHelperSource = readFileSync(unauthenticatedRedirectHelperFullPath, 'utf8')
  const authenticatedSessionHelperSource = readFileSync(authenticatedSessionHelperFullPath, 'utf8')
  const fixtureIdConfigSource = readFileSync(fixtureIdConfigFullPath, 'utf8')
  const publicRouteSmokeSpecSource = readFileSync(publicRouteSmokeSpecFullPath, 'utf8')
  const adminAuthRouteSmokeSpecSource = readFileSync(adminAuthRouteSmokeSpecFullPath, 'utf8')
  const adminShellProtectedRouteSmokeSpecSource = readFileSync(adminShellProtectedRouteSmokeSpecFullPath, 'utf8')
  const adminProductRouteSmokeSpecSource = readFileSync(adminProductRouteSmokeSpecFullPath, 'utf8')
  const qaInternalRouteClassificationSmokeSpecSource = readFileSync(qaInternalRouteClassificationSmokeSpecFullPath, 'utf8')
  const publicVisualThemeSpecSource = readFileSync(publicVisualThemeSpecFullPath, 'utf8')
  const publicSafeWorkflowSpecSource = readFileSync(publicSafeWorkflowSpecFullPath, 'utf8')
  const adminAuthSafeWorkflowSpecSource = readFileSync(adminAuthSafeWorkflowSpecFullPath, 'utf8')
  const adminDashboardSafeWorkflowSpecSource = readFileSync(adminDashboardSafeWorkflowSpecFullPath, 'utf8')
  const adminSupportSafeWorkflowSpecSource = readFileSync(adminSupportSafeWorkflowSpecFullPath, 'utf8')
  const adminSettingsSafeWorkflowSpecSource = readFileSync(adminSettingsSafeWorkflowSpecFullPath, 'utf8')
  const adminInvitesSafeWorkflowSpecSource = readFileSync(adminInvitesSafeWorkflowSpecFullPath, 'utf8')
  const adminGroupsSafeWorkflowSpecSource = readFileSync(adminGroupsSafeWorkflowSpecFullPath, 'utf8')
  const adminProgramsSafeWorkflowSpecSource = readFileSync(adminProgramsSafeWorkflowSpecFullPath, 'utf8')
  const adminWorkoutsSafeWorkflowSpecSource = readFileSync(adminWorkoutsSafeWorkflowSpecFullPath, 'utf8')
  const adminExercisesSafeWorkflowSpecSource = readFileSync(adminExercisesSafeWorkflowSpecFullPath, 'utf8')
  const adminVisualThemeSpecSource = readFileSync(adminVisualThemeSpecFullPath, 'utf8')
  const programsDataTableSource = readFileSync(join(repoRoot, 'apps/web/components/admin/programs-data-table.jsx'), 'utf8')
  const programPlannerSource = readFileSync(join(repoRoot, 'apps/web/components/admin/program-planner-view.jsx'), 'utf8')
  const workoutsCalendarSource = readFileSync(join(repoRoot, 'apps/web/components/admin/workouts-calendar-view.jsx'), 'utf8')
  const exercisesDataTableSource = readFileSync(join(repoRoot, 'apps/web/components/admin/exercises-data-table.jsx'), 'utf8')
  const exerciseEditorDialogSource = readFileSync(join(repoRoot, 'apps/web/components/admin/exercise-editor-dialog.jsx'), 'utf8')
  assert.match(configSource, /@playwright\/test/)
  assert.match(configSource, /testDir:\s*['"]\.\/e2e['"]/)
  assert.match(configSource, /name:\s*['"]chromium['"]/)
  assert.match(configSource, /resolveWebBaseUrl\(\)/)
  assert.match(configSource, /trace:\s*['"]retain-on-failure['"]/)
  assert.match(configSource, /screenshot:\s*['"]only-on-failure['"]/)
  assert.match(configSource, /outputDir:\s*['"]\.\/test-results['"]/)
  assert.equal(harness.failureArtifacts.trace, 'retain-on-failure')
  assert.equal(harness.failureArtifacts.screenshot, 'only-on-failure')
  assert.equal(harness.failureArtifacts.outputDir, 'apps/web/test-results')
  assert.equal(harness.failureArtifacts.ciArtifactName, 'pplus-web-browser-test-results')
  assert.equal(harness.failureArtifacts.ciArtifactRetentionDays, 7)
  assert.equal(harness.failureArtifacts.ciArtifactIfNoFilesFound, 'ignore')
  assert.match(fixtureLifecycleScriptSource, /createAdminTestRecordCleanup/)
  assert.match(fixtureLifecycleScriptSource, /runBrowserWorkflowFixtureSetup/)
  assert.match(fixtureLifecycleScriptSource, /runBrowserWorkflowFixtureTeardown/)
  assert.match(fixtureLifecycleScriptSource, /SUPABASE_URL/)
  assert.match(fixtureLifecycleScriptSource, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(fixtureLifecycleScriptSource, /cleanupKnownTestRecords/)
  assert.match(fixtureLifecycleScriptSource, /process\.argv\[2\]/)
  assert.match(fixtureLifecycleScriptSource, /browser workflow fixture setup skipped/)
  assert.match(fixtureLifecycleScriptSource, /browser workflow fixture teardown skipped/)
  assert.doesNotMatch(configSource, /process\.env\.PPLUS_WEB_PREVIEW_ORIGIN \?\? ['"]http:\/\/127\.0\.0\.1:3000['"]/)
  assert.match(baseUrlConfigSource, /WEB_BASE_URL_ENV\s*=\s*['"]PPLUS_WEB_PREVIEW_ORIGIN['"]/)
  assert.match(baseUrlConfigSource, /DEFAULT_WEB_BASE_URL\s*=\s*['"]http:\/\/127\.0\.0\.1:3000['"]/)
  assert.match(baseUrlConfigSource, /resolveWebBaseUrl/)
  assert.match(routeSmokeHelperSource, /export\s+async\s+function\s+smokeRoute/)
  assert.match(routeSmokeHelperSource, /page\.goto\(route/)
  assert.match(routeSmokeHelperSource, /response\.status\(\)/)
  assert.match(routeSmokeHelperSource, /locator\(bodySelector\)/)
  assert.match(routeSmokeHelperSource, /assertCssLoaded/)
  assert.match(routeSmokeHelperSource, /ChunkLoadError|Application error/)
  assert.match(cssLoadedHelperSource, /export\s+async\s+function\s+assertCssLoaded/)
  assert.match(cssLoadedHelperSource, /document\.styleSheets/)
  assert.match(cssLoadedHelperSource, /cssRules/)
  assert.match(cssLoadedHelperSource, /link\[rel=["']stylesheet["']\]/)
  assert.match(unauthenticatedRedirectHelperSource, /export\s+async\s+function\s+assertUnauthenticatedRedirectToLogin/)
  assert.match(unauthenticatedRedirectHelperSource, /maxRedirects:\s*0/)
  assert.match(unauthenticatedRedirectHelperSource, /response\.status\(\)/)
  assert.match(unauthenticatedRedirectHelperSource, /headers\(\)\.location/)
  assert.match(unauthenticatedRedirectHelperSource, /searchParams\.get\(['"]next['"]\)/)
  assert.match(unauthenticatedRedirectHelperSource, /locator\(loginFormSelector\)/)
  assert.match(unauthenticatedRedirectHelperSource, /assertCssLoaded/)
  assert.match(authenticatedSessionHelperSource, /export\s+function\s+readAdminLoginCredentials/)
  assert.match(authenticatedSessionHelperSource, /export\s+async\s+function\s+loginAdminThroughApi/)
  assert.match(authenticatedSessionHelperSource, /export\s+async\s+function\s+loginAdminThroughUi/)
  assert.match(authenticatedSessionHelperSource, /PPLUS_WEB_ADMIN_EMAIL/)
  assert.match(authenticatedSessionHelperSource, /PPLUS_WEB_ADMIN_PASSWORD/)
  assert.match(authenticatedSessionHelperSource, /page\.request\.post\(loginApiPath/)
  assert.match(authenticatedSessionHelperSource, /method:\s*['"]POST['"]|page\.request\.post/)
  assert.match(authenticatedSessionHelperSource, /context\(\)\.cookies/)
  assert.match(authenticatedSessionHelperSource, /pplus_admin_access_token/)
  assert.match(authenticatedSessionHelperSource, /page\.goto\(loginPath/)
  assert.match(authenticatedSessionHelperSource, /locator\(['"]#email['"]\)\.fill/)
  assert.match(authenticatedSessionHelperSource, /locator\(['"]#password['"]\)\.fill/)
  assert.match(authenticatedSessionHelperSource, /assertCssLoaded/)
  assert.match(fixtureIdConfigSource, /export\s+const\s+SAFE_RECORD_FIXTURE_ENV/)
  assert.match(fixtureIdConfigSource, /export\s+function\s+readSafeRecordFixtureIds/)
  assert.match(fixtureIdConfigSource, /export\s+function\s+requireSafeRecordFixtureId/)
  assert.match(fixtureIdConfigSource, /PPLUS_WEB_SAFE_COACH_ID/)
  assert.match(fixtureIdConfigSource, /PPLUS_WEB_SAFE_ATHLETE_ID/)
  assert.match(fixtureIdConfigSource, /PPLUS_WEB_SAFE_GROUP_ID/)
  assert.match(fixtureIdConfigSource, /PPLUS_WEB_SAFE_EXERCISE_ID/)
  assert.match(fixtureIdConfigSource, /PPLUS_WEB_SAFE_WORKOUT_TEMPLATE_ID/)
  assert.match(fixtureIdConfigSource, /PPLUS_WEB_SAFE_PROGRAM_ID/)
  assert.match(fixtureIdConfigSource, /Object\.freeze/)
  assert.match(fixtureIdConfigSource, /safe fixture record/)
  assert.match(publicRouteSmokeSpecSource, /PUBLIC_ROUTE_SMOKE_PATHS/)
  assert.match(publicRouteSmokeSpecSource, /smokeRoute\(page, route/)
  for (const publicRouteSmokePath of harness.publicRouteSmokePaths) {
    assert.match(
      publicRouteSmokeSpecSource,
      new RegExp(`['"]${publicRouteSmokePath === '/' ? '\\/' : publicRouteSmokePath}['"]`),
      `public route smoke spec should cover ${publicRouteSmokePath}`,
    )
  }
  assert.match(adminAuthRouteSmokeSpecSource, /ADMIN_AUTH_ROUTE_SMOKE_PATHS/)
  assert.match(adminAuthRouteSmokeSpecSource, /smokeRoute\(page, route/)
  assert.match(adminAuthRouteSmokeSpecSource, /locator\(['"]form['"]\)/)
  for (const adminAuthRouteSmokePath of harness.adminAuthRouteSmokePaths) {
    assert.match(
      adminAuthRouteSmokeSpecSource,
      new RegExp(`['"]${adminAuthRouteSmokePath}['"]`),
      `admin auth route smoke spec should cover ${adminAuthRouteSmokePath}`,
    )
  }
  assert.match(adminShellProtectedRouteSmokeSpecSource, /ADMIN_SHELL_PROTECTED_ROUTE_SMOKE_PATHS/)
  assert.match(adminShellProtectedRouteSmokeSpecSource, /assertUnauthenticatedRedirectToLogin\(page, route/)
  for (const adminShellProtectedRouteSmokePath of harness.adminShellProtectedRouteSmokePaths) {
    assert.match(
      adminShellProtectedRouteSmokeSpecSource,
      new RegExp(`['"]${adminShellProtectedRouteSmokePath}['"]`),
      `admin shell protected route smoke spec should cover ${adminShellProtectedRouteSmokePath}`,
    )
  }
  assert.match(adminProductRouteSmokeSpecSource, /ADMIN_PRODUCT_ROUTE_SMOKE_PATHS/)
  assert.match(adminProductRouteSmokeSpecSource, /assertUnauthenticatedRedirectToLogin\(page, route/)
  assert.match(adminProductRouteSmokeSpecSource, /resolveAdminProductRoute/)
  for (const adminProductRouteSmokePath of harness.adminProductRouteSmokePaths) {
    assert.match(
      adminProductRouteSmokeSpecSource,
      new RegExp(`['"]${adminProductRouteSmokePath}['"]`),
      `admin product route smoke spec should cover ${adminProductRouteSmokePath}`,
    )
  }
  assert.match(adminProductRouteSmokeSpecSource, /['"]\/admin\/programs\/program-1['"]/)
  assert.match(qaInternalRouteClassificationSmokeSpecSource, /QA_INTERNAL_ROUTE_CLASSIFICATION_SMOKE_PATHS/)
  assert.match(qaInternalRouteClassificationSmokeSpecSource, /getWebPageTestManifest\(\)/)
  assert.match(qaInternalRouteClassificationSmokeSpecSource, /WEB_ROUTE_AREAS\.QA_INTERNAL/)
  assert.match(qaInternalRouteClassificationSmokeSpecSource, /WEB_ROUTE_AUTH_STATES\.INTERNAL_TEST_ONLY/)
  assert.match(qaInternalRouteClassificationSmokeSpecSource, /WEB_BROWSER_SMOKE_PRIORITIES\.INTERNAL/)
  assert.match(qaInternalRouteClassificationSmokeSpecSource, /smokeRoute\(page, route/)
  for (const qaInternalRouteClassificationSmokePath of harness.qaInternalRouteClassificationSmokePaths) {
    assert.match(
      qaInternalRouteClassificationSmokeSpecSource,
      new RegExp(`['"]${qaInternalRouteClassificationSmokePath}['"]`),
      `QA/internal route classification smoke spec should cover ${qaInternalRouteClassificationSmokePath}`,
    )
  }
  assert.match(publicVisualThemeSpecSource, /PUBLIC_HOME_DARK_MODE_VISUAL_CHECK/)
  assert.match(publicVisualThemeSpecSource, /PUBLIC_HOME_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(publicVisualThemeSpecSource, /PUBLIC_HOME_MOBILE_HEADER_DRAWER_VISUAL_CHECK/)
  assert.match(publicVisualThemeSpecSource, /PUBLIC_FAQ_DARK_MODE_VISUAL_CHECK/)
  assert.match(publicVisualThemeSpecSource, /PUBLIC_FAQ_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(publicVisualThemeSpecSource, /PUBLIC_SUPPORT_DARK_MODE_VISUAL_CHECK/)
  assert.match(publicVisualThemeSpecSource, /PUBLIC_SUPPORT_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(publicVisualThemeSpecSource, /PUBLIC_FOOTER_LINK_LAYOUT_VISUAL_CHECK/)
  assert.match(publicVisualThemeSpecSource, /WEB_TEST_LAYERS\.VISUAL_THEME/)
  assert.match(publicVisualThemeSpecSource, /page\.goto\(['"]\/['"]\)/)
  assert.match(publicVisualThemeSpecSource, /page\.goto\(['"]\/faq['"]\)/)
  assert.match(publicVisualThemeSpecSource, /page\.goto\(['"]\/support['"]\)/)
  assert.match(publicVisualThemeSpecSource, /page\.setViewportSize\(\{\s*width:\s*390,\s*height:\s*844\s*\}\)/)
  assert.match(publicVisualThemeSpecSource, /expect\(htmlTheme\)\.toBe\(['"]dark['"]\)/)
  assert.match(publicVisualThemeSpecSource, /expect\(htmlTheme\)\.toBe\(['"]light['"]\)/)
  assert.match(publicVisualThemeSpecSource, /landing-page/)
  assert.match(publicVisualThemeSpecSource, /landing-hero-title/)
  assert.match(publicVisualThemeSpecSource, /landing-logo-dark/)
  assert.match(publicVisualThemeSpecSource, /landing-logo-light/)
  assert.match(publicVisualThemeSpecSource, /landing-header-mobile/)
  assert.match(publicVisualThemeSpecSource, /landing-header-desktop/)
  assert.match(publicVisualThemeSpecSource, /landing-mobile-menu-button/)
  assert.match(publicVisualThemeSpecSource, /landing-mobile-menu-sheet/)
  assert.match(publicVisualThemeSpecSource, /landing-mobile-menu-link/)
  assert.match(publicVisualThemeSpecSource, /faq-page/)
  assert.match(publicVisualThemeSpecSource, /faq-hero-title/)
  assert.match(publicVisualThemeSpecSource, /faq-item/)
  assert.match(publicVisualThemeSpecSource, /faq-accordion-list/)
  assert.match(publicVisualThemeSpecSource, /support-template-page/)
  assert.match(publicVisualThemeSpecSource, /support-template-heading-on-image/)
  assert.match(publicVisualThemeSpecSource, /support-template-card/)
  assert.match(publicVisualThemeSpecSource, /support-template-form/)
  assert.match(publicVisualThemeSpecSource, /support-dashboard-input/)
  assert.match(publicVisualThemeSpecSource, /support-dashboard-textarea/)
  assert.match(publicVisualThemeSpecSource, /landing-footer/)
  assert.match(publicVisualThemeSpecSource, /landing-footer-grid/)
  assert.match(publicVisualThemeSpecSource, /landing-footer-brand-block/)
  assert.match(publicVisualThemeSpecSource, /landing-footer-column/)
  assert.match(publicVisualThemeSpecSource, /landing-footer-contact-item/)
  assert.match(publicVisualThemeSpecSource, /landing-footer-meta/)
  assert.match(publicVisualThemeSpecSource, /landing-footer-logo-link/)
  assert.match(publicVisualThemeSpecSource, /document\.documentElement\.scrollWidth/)
  assert.deepEqual(harness.publicVisualThemeChecks, [
    {
      id: 'public-home-dark-mode',
      route: '/',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'public-home-light-mode',
      route: '/',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'public-home-mobile-header-drawer',
      route: '/',
      viewport: 'mobile',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'public-faq-dark-mode',
      route: '/faq',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'public-faq-light-mode',
      route: '/faq',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'public-support-dark-mode',
      route: '/support',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'public-support-light-mode',
      route: '/support',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'public-footer-link-layout',
      route: '/',
      viewport: 'responsive',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
  ])
  assert.match(publicSafeWorkflowSpecSource, /PUBLIC_SUPPORT_FORM_VALIDATION_WORKFLOW_CHECK/)
  assert.match(publicSafeWorkflowSpecSource, /PUBLIC_SUPPORT_FORM_SAFE_CREATE_WORKFLOW_CHECK/)
  assert.match(publicSafeWorkflowSpecSource, /PUBLIC_LANGUAGE_ROUTE_NAVIGATION_WORKFLOW_CHECK/)
  assert.match(publicSafeWorkflowSpecSource, /PUBLIC_THEME_ROUTE_NAVIGATION_WORKFLOW_CHECK/)
  assert.match(publicSafeWorkflowSpecSource, /public-support-form-validation/)
  assert.match(publicSafeWorkflowSpecSource, /public-support-form-safe-create/)
  assert.match(publicSafeWorkflowSpecSource, /public-language-route-navigation/)
  assert.match(publicSafeWorkflowSpecSource, /public-theme-route-navigation/)
  assert.match(publicSafeWorkflowSpecSource, /support-form-safe-test-request-create/)
  assert.match(publicSafeWorkflowSpecSource, /language-switch-persists-across-public-navigation/)
  assert.match(publicSafeWorkflowSpecSource, /theme-switch-persists-across-public-navigation/)
  assert.match(publicSafeWorkflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(publicSafeWorkflowSpecSource, /page\.goto\(['"]\/['"]\)/)
  assert.match(publicSafeWorkflowSpecSource, /page\.goto\(['"]\/support['"]\)/)
  assert.match(publicSafeWorkflowSpecSource, /api\/support-requests/)
  assert.match(publicSafeWorkflowSpecSource, /Please enter a valid email/)
  assert.match(publicSafeWorkflowSpecSource, /supportApiRequests/)
  assert.deepEqual(harness.publicSafeWorkflowChecks, [
    {
      id: 'public-support-form-validation',
      route: '/support',
      interaction: 'support-form-validation',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'public-support-form-safe-create',
      route: '/support',
      interaction: 'support-form-safe-test-request-create',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'public-language-route-navigation',
      route: '/',
      interaction: 'language-switch-persists-across-public-navigation',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'public-theme-route-navigation',
      route: '/',
      interaction: 'theme-switch-persists-across-public-navigation',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(adminAuthSafeWorkflowSpecSource, /ADMIN_LOGIN_SEEDED_ACCOUNT_WORKFLOW_CHECK/)
  assert.match(adminAuthSafeWorkflowSpecSource, /ADMIN_LOGIN_INVALID_VISIBLE_ERROR_WORKFLOW_CHECK/)
  assert.match(adminAuthSafeWorkflowSpecSource, /ADMIN_FORGOT_PASSWORD_SUCCESS_NON_ENUMERATING_WORKFLOW_CHECK/)
  assert.match(adminAuthSafeWorkflowSpecSource, /ADMIN_RESET_PASSWORD_INVALID_TOKEN_VISIBLE_ERROR_WORKFLOW_CHECK/)
  assert.match(adminAuthSafeWorkflowSpecSource, /admin-login-seeded-account/)
  assert.match(adminAuthSafeWorkflowSpecSource, /admin-login-invalid-visible-error/)
  assert.match(adminAuthSafeWorkflowSpecSource, /admin-forgot-password-success-non-enumerating/)
  assert.match(adminAuthSafeWorkflowSpecSource, /admin-reset-password-invalid-token-visible-error/)
  assert.match(adminAuthSafeWorkflowSpecSource, /seeded-admin-account-login/)
  assert.match(adminAuthSafeWorkflowSpecSource, /invalid-login-visible-error/)
  assert.match(adminAuthSafeWorkflowSpecSource, /forgot-password-success-visible-without-user-enumeration/)
  assert.match(adminAuthSafeWorkflowSpecSource, /reset-password-invalid-token-visible-error/)
  assert.match(adminAuthSafeWorkflowSpecSource, /loginAdminThroughUi\(page/)
  assert.match(adminAuthSafeWorkflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/auth\/login['"]/)
  assert.match(adminAuthSafeWorkflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/auth\/forgot-password['"]/)
  assert.match(adminAuthSafeWorkflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/auth\/reset-password['"]/)
  assert.match(adminAuthSafeWorkflowSpecSource, /Invalid email or password\./)
  assert.match(adminAuthSafeWorkflowSpecSource, /If an account exists for that email, a reset link has been sent\./)
  assert.match(adminAuthSafeWorkflowSpecSource, /Recovery token is invalid or expired\./)
  assert.match(adminAuthSafeWorkflowSpecSource, /admin-login-error\[role="alert"\]/)
  assert.match(adminAuthSafeWorkflowSpecSource, /admin-login-success\[role="status"\]/)
  assert.match(adminAuthSafeWorkflowSpecSource, /PPLUS_WEB_ADMIN_EMAIL/)
  assert.match(adminAuthSafeWorkflowSpecSource, /PPLUS_WEB_ADMIN_PASSWORD/)
  assert.match(adminAuthSafeWorkflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.deepEqual(harness.adminAuthSafeWorkflowChecks, [
    {
      id: 'admin-login-seeded-account',
      route: '/admin/login',
      interaction: 'seeded-admin-account-login',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-login-invalid-visible-error',
      route: '/admin/login',
      interaction: 'invalid-login-visible-error',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-forgot-password-success-non-enumerating',
      route: '/admin/forgot-password',
      interaction: 'forgot-password-success-visible-without-user-enumeration',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-reset-password-invalid-token-visible-error',
      route: '/admin/reset-password',
      interaction: 'reset-password-invalid-token-visible-error',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-logout-returns-to-login',
      route: '/admin/dashboard',
      interaction: 'logout-returns-user-to-login',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(adminDashboardSafeWorkflowSpecSource, /ADMIN_DASHBOARD_SEEDED_DATA_WORKFLOW_CHECK/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /ADMIN_DASHBOARD_KPI_FIXTURE_CHANGES_WORKFLOW_CHECK/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /admin-dashboard-seeded-data-loads/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /admin-dashboard-kpi-cards-reflect-fixture-changes/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /dashboard-loads-with-seeded-data/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /kpi-cards-reflect-fixture-changes-honestly/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /Dashboard loads with seeded data/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /KPI cards reflect fixture changes honestly/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/dashboard\/overview\?\*\*['"]/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /seededDashboardOverview/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /changedKpiDashboardOverview/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /expectKpiCards/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /Dashboard summary cards/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /50% active/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /100% assigned/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /67% completed/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /22% active/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /40% assigned/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /25% accepted/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /Showing all Speed workout results/)
  assert.match(adminDashboardSafeWorkflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.deepEqual(harness.adminDashboardSafeWorkflowChecks, [
    {
      id: 'admin-dashboard-seeded-data-loads',
      route: '/admin/dashboard',
      interaction: 'dashboard-loads-with-seeded-data',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-dashboard-kpi-cards-reflect-fixture-changes',
      route: '/admin/dashboard',
      interaction: 'kpi-cards-reflect-fixture-changes-honestly',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(adminInvitesSafeWorkflowSpecSource, /ADMIN_INVITES_REVOKE_TEST_INVITE_WORKFLOW_CHECK/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /admin-invites-revoke-test-invite-through-confirmation/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /Revoke\/cancel test invite through confirmation/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /revoke-test-invite-submits-mocked-patch-through-confirmation/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /request\.method\(\) === 'PATCH'/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /invite-cancel-fixture/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /Thomas Thibault/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /Keep invite/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /This invite link will be revoked/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /Invite canceled/)
  assert.match(adminInvitesSafeWorkflowSpecSource, /This athlete invitation was revoked\./)
  assert.match(adminInvitesSafeWorkflowSpecSource, /canceledInviteRequests/)
  assert.deepEqual(harness.adminInvitesSafeWorkflowChecks, [
    {
      id: 'admin-invites-revoke-test-invite-through-confirmation',
      route: '/admin/athletes/invites',
      interaction: 'revoke-test-invite-submits-mocked-patch-through-confirmation',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(adminGroupsSafeWorkflowSpecSource, /ADMIN_GROUPS_CREATE_EDIT_DELETE_TEST_GROUP_WORKFLOW_CHECK/)
  assert.match(adminGroupsSafeWorkflowSpecSource, /admin-groups-create-edit-delete-test-group/)
  assert.match(adminGroupsSafeWorkflowSpecSource, /Create\/edit\/delete test group/)
  assert.match(adminGroupsSafeWorkflowSpecSource, /create-edit-delete-test-group-through-mocked-crud/)
  assert.match(adminGroupsSafeWorkflowSpecSource, /Test Workflow Group/)
  assert.match(adminGroupsSafeWorkflowSpecSource, /Updated Workflow Group/)
  assert.match(adminGroupsSafeWorkflowSpecSource, /createdGroupRequests/)
  assert.match(adminGroupsSafeWorkflowSpecSource, /updatedGroupRequests/)
  assert.match(adminGroupsSafeWorkflowSpecSource, /deletedGroupRequests/)
  assert.deepEqual(harness.adminGroupsSafeWorkflowChecks, [
    {
      id: 'admin-groups-create-edit-delete-test-group',
      route: '/admin/athletes/groups',
      interaction: 'create-edit-delete-test-group-through-mocked-crud',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(adminProgramsSafeWorkflowSpecSource, /ADMIN_PROGRAMS_CREATE_UNASSIGNED_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /admin-programs-create-unassigned-test-program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Create unassigned test program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /create-unassigned-program-submits-mocked-post-and-refreshes-table/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /request\.method\(\) === 'POST'/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /createdProgramRequests/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Test Workflow Program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Created by the safe Programs workflow\./)
  assert.match(adminProgramsSafeWorkflowSpecSource, /athleteIds:\s*\[\]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /athletesLabel:\s*['"]Unassigned['"]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /ADMIN_PROGRAMS_EDIT_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /admin-programs-edit-test-program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Edit test program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /edit-test-program-submits-mocked-patch-and-refreshes-table/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /request\.method\(\) === 'PATCH'/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /updatedProgramRequests/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Test Editable Program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Updated Test Workflow Program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Edited by the safe Programs workflow\./)
  assert.match(adminProgramsSafeWorkflowSpecSource, /ADMIN_PROGRAMS_ASSIGN_TEST_PROGRAM_TO_TEST_ATHLETE_WORKFLOW_CHECK/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /admin-programs-assign-test-program-to-test-athlete/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Assign test program to test athlete/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /assign-test-program-submits-mocked-assign-athletes-patch-and-refreshes-table/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /assignedProgramRequests/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /action:\s*['"]assign-athletes['"]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Test Assignable Program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Thomas Thibault/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /ADMIN_PROGRAMS_DUPLICATE_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /admin-programs-duplicate-test-program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Duplicate test program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /duplicate-test-program-submits-mocked-duplicate-post-and-refreshes-table/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /duplicatedProgramRequests/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /action:\s*['"]duplicate['"]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /sourceProgramId:\s*['"]program-duplicate-fixture['"]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Test Duplicable Program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Test Duplicable Program copy/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /ADMIN_PROGRAMS_EXPORT_SELECTED_PROGRAMS_CSV_WORKFLOW_CHECK/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /admin-programs-export-selected-programs-csv/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Export selected programs CSV/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /export-selected-programs-reviews-and-downloads-csv/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /waitForEvent\(['"]download['"]\)/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /suggestedFilename\(\)/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /"Program ID","Athlete ID","Assigned athlete IDs","Coach ID","Program type"/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Summer strength block/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Test Editable Program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /ADMIN_PROGRAMS_ARCHIVE_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /admin-programs-archive-test-program-through-confirmation/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Archive test program through confirmation/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /archive-test-program-confirms-mocked-patch-and-refreshes-table/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /archivedProgramRequests/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /action:\s*['"]archive-programs['"]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /programIds:\s*\[\s*['"]program-archive-fixture['"]\s*\]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Test Archivable Program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /ADMIN_PROGRAMS_DELETE_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /admin-programs-delete-test-program-through-confirmation/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Delete test program through confirmation/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /delete-test-program-confirms-mocked-delete-and-removes-row/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /deletedProgramRequests/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /request\.method\(\) === 'DELETE'/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /action:\s*['"]delete-programs['"]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /programIds:\s*\[\s*['"]program-delete-fixture['"]\s*\]/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Test Deletable Program/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /ADMIN_PROGRAMS_OPEN_DETAIL_PLANNER_ROUTE_WORKFLOW_CHECK/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /admin-programs-open-detail-planner-route/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /Open program detail planner route/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /open-program-detail-planner-route-from-program-name/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /locator\(['"]a\[href=\"\/admin\/programs\/program-1\"\]['"]/)
  assert.ok(adminProgramsSafeWorkflowSpecSource.includes("toHaveURL(/\\/admin\\/programs\\?athleteId=/)"))
  assert.ok(adminProgramsSafeWorkflowSpecSource.includes("toHaveURL(/\\/admin\\/programs\\/program-1(?:\\?athleteId=.*)?$/)"))
  assert.match(adminProgramsSafeWorkflowSpecSource, /program-planner-page-header/)
  assert.match(adminProgramsSafeWorkflowSpecSource, /program-planner-week-row/)
  assert.deepEqual(harness.adminProgramsSafeWorkflowChecks, [
    {
      id: 'admin-programs-create-unassigned-test-program',
      route: '/admin/programs',
      interaction: 'create-unassigned-program-submits-mocked-post-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-edit-test-program',
      route: '/admin/programs',
      interaction: 'edit-test-program-submits-mocked-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-assign-test-program-to-test-athlete',
      route: '/admin/programs',
      interaction: 'assign-test-program-submits-mocked-assign-athletes-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-duplicate-test-program',
      route: '/admin/programs',
      interaction: 'duplicate-test-program-submits-mocked-duplicate-post-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-export-selected-programs-csv',
      route: '/admin/programs',
      interaction: 'export-selected-programs-reviews-and-downloads-csv',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-archive-test-program-through-confirmation',
      route: '/admin/programs',
      interaction: 'archive-test-program-confirms-mocked-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-delete-test-program-through-confirmation',
      route: '/admin/programs',
      interaction: 'delete-test-program-confirms-mocked-delete-and-removes-row',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-programs-open-detail-planner-route',
      route: '/admin/programs',
      interaction: 'open-program-detail-planner-route-from-program-name',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /ADMIN_WORKOUTS_CREATE_TEST_WORKOUT_TEMPLATE_WORKFLOW_CHECK/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /admin-workouts-create-test-workout-template/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Create test workout template/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /create-workout-template-submits-mocked-post-and-refreshes-table/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /request\.method\(\) === 'POST'/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /createdWorkoutTemplateRequests/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Test Workflow Workout Template/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Created by the safe Workouts workflow\./)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /estimated_duration_minutes:\s*Number\.parseInt/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /section_count:\s*0/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /exercise_count:\s*0/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /set_count:\s*0/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /ADMIN_WORKOUTS_EDIT_TEST_WORKOUT_TEMPLATE_WORKFLOW_CHECK/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /admin-workouts-edit-test-workout-template/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Edit test workout template/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /edit-workout-template-submits-mocked-patch-and-refreshes-table/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /request\.method\(\) === 'PATCH'/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /updatedWorkoutTemplateRequests/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Updated Workflow Workout Template/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Updated by the safe Workouts workflow\./)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /ADMIN_WORKOUTS_ASSIGN_WORKOUT_TEMPLATE_TO_TEST_PROGRAM_WORKFLOW_CHECK/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /admin-workouts-assign-workout-template-to-test-program/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Assign workout template to test program/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /assign-workout-template-submits-mocked-program-assignment-patch-and-refreshes-table/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /assignedWorkoutTemplateRequests/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /assign-workout-templates-to-program/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Summer strength block/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /ADMIN_WORKOUTS_EXPORT_WORKOUTS_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /admin-workouts-export-workouts-csv-review-download/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Export workouts CSV review\/download path/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /export-workouts-opens-review-sheet-and-downloads-csv/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /page\.waitForEvent\(['"]download['"]\)/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /suggestedFilename\(\)/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Workout template ID/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /ADMIN_WORKOUTS_DELETE_ARCHIVE_TEST_WORKOUT_THROUGH_CONFIRMATION_WORKFLOW_CHECK/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /admin-workouts-delete-archive-test-workout-through-confirmation/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Delete\/archive test workout through confirmation/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /archive-and-delete-workouts-through-confirmation-dialogs/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /archivedWorkoutTemplateRequests/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /deletedWorkoutTemplateRequests/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /archive-workout-templates/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /request\.method\(\) === 'DELETE'/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /ADMIN_WORKOUTS_OPEN_WORKOUT_CALENDAR_ROUTE_WORKFLOW_CHECK/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /admin-workouts-open-workout-calendar-route/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Open workout calendar route/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /open-workout-calendar-route-from-workouts-sidebar-nav/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/workout-calendar\*\*['"]/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /calendarAssignmentRequests/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /getByRole\(['"]link['"], \{ name: 'Calendar' \}\)\.click\(\)/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /getByRole\(['"]region['"], \{ name: 'Workout calendar admin view' \}\)/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Calendar route speed session/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /ADMIN_WORKOUTS_CALENDAR_FIXTURE_EXPECTED_DATE_WORKFLOW_CHECK/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /admin-workouts-calendar-fixture-appears-on-expected-date/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /Calendar fixture workout appears on expected date/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /calendar-fixture-renders-in-scheduled-date-cell/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /scheduled_date:\s*'2026-05-04'/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /data-month-slot="month-slot:2026-05-04T04:00:00\.000Z"/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /data-month-slot="month-slot:2026-05-05T04:00:00\.000Z"/)
  assert.match(adminWorkoutsSafeWorkflowSpecSource, /toHaveCount\(0\)/)
  assert.deepEqual(harness.adminWorkoutsSafeWorkflowChecks, [
    {
      id: 'admin-workouts-create-test-workout-template',
      route: '/admin/workouts',
      interaction: 'create-workout-template-submits-mocked-post-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-edit-test-workout-template',
      route: '/admin/workouts',
      interaction: 'edit-workout-template-submits-mocked-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-assign-workout-template-to-test-program',
      route: '/admin/workouts',
      interaction: 'assign-workout-template-submits-mocked-program-assignment-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-export-workouts-csv-review-download',
      route: '/admin/workouts',
      interaction: 'export-workouts-opens-review-sheet-and-downloads-csv',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-delete-archive-test-workout-through-confirmation',
      route: '/admin/workouts',
      interaction: 'archive-and-delete-workouts-through-confirmation-dialogs',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-open-workout-calendar-route',
      route: '/admin/workouts',
      interaction: 'open-workout-calendar-route-from-workouts-sidebar-nav',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-workouts-calendar-fixture-appears-on-expected-date',
      route: '/admin/workouts/calendar',
      interaction: 'calendar-fixture-renders-in-scheduled-date-cell',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(adminExercisesSafeWorkflowSpecSource, /ADMIN_EXERCISES_CREATE_TEST_EXERCISE_WORKFLOW_CHECK/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /admin-exercises-create-test-exercise/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /Create test exercise/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /create-exercise-submits-mocked-post-and-refreshes-table/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /ADMIN_EXERCISES_EDIT_TEST_EXERCISE_WORKFLOW_CHECK/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /admin-exercises-edit-test-exercise/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /Edit test exercise/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /edit-exercise-submits-mocked-patch-and-refreshes-table/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /ADMIN_EXERCISES_ATTACH_DIRECT_MP4_MEDIA_URL_WORKFLOW_CHECK/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /admin-exercises-attach-direct-mp4-media-url/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /Attach direct MP4 media URL/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /attach-direct-mp4-url-displays-media-preview-and-saves-patch/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /ADMIN_EXERCISES_EXPORT_EXERCISES_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /admin-exercises-export-exercises-csv-review-download/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /Export exercises CSV review\/download path/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /export-exercises-opens-review-sheet-and-downloads-csv/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/exercises\*\*['"]/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /request\.method\(\) === 'POST'/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /request\.method\(\) === 'PATCH'/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /createdExerciseRequests/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /updatedExerciseRequests/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /Test Workflow Exercise/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /Updated Workflow Exercise/)
  assert.match(adminExercisesSafeWorkflowSpecSource, /Created by the safe Exercises workflow\./)
  assert.match(adminExercisesSafeWorkflowSpecSource, /Updated by the safe Exercises workflow\./)
  assert.deepEqual(harness.adminExercisesSafeWorkflowChecks, [
    {
      id: 'admin-exercises-create-test-exercise',
      route: '/admin/exercises',
      interaction: 'create-exercise-submits-mocked-post-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-exercises-edit-test-exercise',
      route: '/admin/exercises',
      interaction: 'edit-exercise-submits-mocked-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-exercises-attach-direct-mp4-media-url',
      route: '/admin/exercises',
      interaction: 'attach-direct-mp4-url-displays-media-preview-and-saves-patch',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-exercises-export-exercises-csv-review-download',
      route: '/admin/exercises',
      interaction: 'export-exercises-opens-review-sheet-and-downloads-csv',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-exercises-delete-archive-test-exercise-through-confirmation',
      route: '/admin/exercises',
      interaction: 'archive-and-delete-exercises-through-confirmation-dialogs',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
  assert.match(adminVisualThemeSpecSource, /ADMIN_SIDEBAR_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_SIDEBAR_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_TOPBAR_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_TOPBAR_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_ACCOUNT_DROPDOWN_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_ACCOUNT_DROPDOWN_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_ROUTE_ACTIVE_STATE_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_NO_DEFAULT_CONTROLS_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_MOBILE_TABLET_WIDTH_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_SUPPORT_INBOX_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_SUPPORT_INBOX_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-support-inbox-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-support-inbox-light-mode/)
  assert.match(adminVisualThemeSpecSource, /readSupportInboxVisualState/)
  assert.match(adminVisualThemeSpecSource, /\/admin\/support\/reference/)
  assert.match(adminVisualThemeSpecSource, /support-inbox-shell/)
  assert.match(adminVisualThemeSpecSource, /support-inbox-sidebar/)
  assert.match(adminVisualThemeSpecSource, /support-inbox-topbar/)
  assert.match(adminVisualThemeSpecSource, /support-inbox-conversation-row-active/)
  assert.match(adminVisualThemeSpecSource, /support-inbox-composer/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_SETTINGS_PROFILE_ACCOUNT_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_SETTINGS_PROFILE_ACCOUNT_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-settings-profile-account-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-settings-profile-account-light-mode/)
  assert.match(adminVisualThemeSpecSource, /readSettingsProfileAccountVisualState/)
  assert.match(adminVisualThemeSpecSource, /mockSettingsProfileAccountApi/)
  assert.match(adminVisualThemeSpecSource, /\/admin\/settings\/account/)
  assert.match(adminVisualThemeSpecSource, /admin-settings-shell/)
  assert.match(adminVisualThemeSpecSource, /admin-settings-profile-form/)
  assert.match(adminVisualThemeSpecSource, /admin-settings-account-form/)
  assert.match(adminVisualThemeSpecSource, /admin-settings-profile-avatar/)
  assert.match(adminVisualThemeSpecSource, /admin-settings-account-email/)
  assert.match(adminVisualThemeSpecSource, /WEB_TEST_LAYERS\.VISUAL_THEME/)
  assert.match(adminVisualThemeSpecSource, /page\.goto\(['"]\/admin\/dashboard['"]\)/)
  assert.match(adminVisualThemeSpecSource, /pplus_admin_access_token/)
  assert.match(adminVisualThemeSpecSource, /forceAdminTheme\(page, ['"]dark['"]\)/)
  assert.match(adminVisualThemeSpecSource, /forceAdminTheme\(page, ['"]light['"]\)/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-sidebar/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-sidebar-logo-dark/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-sidebar-logo-light/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-sidebar-nav-button/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-sidebar-subnav-button/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-sidebar-switcher/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-sidebar-account-button/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-topbar/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-topbar-search/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-topbar-search-input/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-topbar-search-button/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-topbar-avatar/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-dropdown-content/)
  assert.match(adminVisualThemeSpecSource, /My Account/)
  assert.match(adminVisualThemeSpecSource, /Profile/)
  assert.match(adminVisualThemeSpecSource, /Account/)
  assert.match(adminVisualThemeSpecSource, /menuitem/)
  assert.match(adminVisualThemeSpecSource, /separator/)
  assert.match(adminVisualThemeSpecSource, /admin-theme-toggle/)
  assert.match(adminVisualThemeSpecSource, /Search athletes, programs, or groups/)
  assert.match(adminVisualThemeSpecSource, /admin-route-active-state/)
  assert.match(adminVisualThemeSpecSource, /data-active/)
  assert.match(adminVisualThemeSpecSource, /\/admin\/programs\/program-1/)
  assert.match(adminVisualThemeSpecSource, /\/admin\/athletes\/rankings/)
  assert.match(adminVisualThemeSpecSource, /\/admin\/workouts\/calendar\?athleteId=athlete-1/)
  assert.match(adminVisualThemeSpecSource, /admin-no-default-controls/)
  assert.match(adminVisualThemeSpecSource, /control-appearance-reset/)
  assert.match(adminVisualThemeSpecSource, /nativeSelectCount/)
  assert.match(adminVisualThemeSpecSource, /buttonAppearanceResets/)
  assert.match(adminVisualThemeSpecSource, /styledControlRadii/)
  assert.match(adminVisualThemeSpecSource, /admin-mobile-tablet-width/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_DASHBOARD_KPI_CARD_TABLE_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_DASHBOARD_KPI_CARD_TABLE_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-kpi-card-table-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-kpi-card-table-light-mode/)
  assert.match(adminVisualThemeSpecSource, /readDashboardSurfaceVisualState/)
  assert.match(adminVisualThemeSpecSource, /mockDashboardOverviewApi/)
  assert.match(adminVisualThemeSpecSource, /Dashboard summary cards/)
  assert.match(adminVisualThemeSpecSource, /Workout results/)
  assert.match(adminVisualThemeSpecSource, /Training consistency/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_ATHLETES_TABLE_FILTER_DIALOG_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_ATHLETES_TABLE_FILTER_DIALOG_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-athletes-table-filter-dialog-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-athletes-table-filter-dialog-light-mode/)
  assert.match(adminVisualThemeSpecSource, /mockAthletesApi/)
  assert.match(adminVisualThemeSpecSource, /readAthletesTableFilterDialogVisualState/)
  assert.match(adminVisualThemeSpecSource, /Create athlete profile/)
  assert.match(adminVisualThemeSpecSource, /Add filter/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-athletes-table-shell/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_INVITES_TABLE_DIALOG_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_INVITES_TABLE_DIALOG_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-invites-table-dialog-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-invites-table-dialog-light-mode/)
  assert.match(adminVisualThemeSpecSource, /mockInvitesApi/)
  assert.match(adminVisualThemeSpecSource, /readInvitesTableDialogVisualState/)
  assert.match(adminVisualThemeSpecSource, /Invite an athlete/)
  assert.match(adminVisualThemeSpecSource, /Cancel invite/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-invites-table-shell/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_GROUPS_TABLE_DIALOG_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_GROUPS_TABLE_DIALOG_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-groups-table-dialog-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-groups-table-dialog-light-mode/)
  assert.match(adminVisualThemeSpecSource, /mockGroupsApi/)
  assert.match(adminVisualThemeSpecSource, /readGroupsTableDialogVisualState/)
  assert.match(adminVisualThemeSpecSource, /Create a group/)
  assert.match(adminVisualThemeSpecSource, /Delete group/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-groups-create-sheet/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_RANKINGS_TABLE_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_RANKINGS_TABLE_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-rankings-table-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-rankings-table-light-mode/)
  assert.match(adminVisualThemeSpecSource, /mockRankingsApi/)
  assert.match(adminVisualThemeSpecSource, /readRankingsTableVisualState/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-rankings-table-shell/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-rankings-row-menu/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-rankings-name-text/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_PROGRAMS_TABLE_SHEETS_DROPDOWNS_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_PROGRAMS_TABLE_SHEETS_DROPDOWNS_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_PROGRAM_DETAIL_PLANNER_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_PROGRAM_DETAIL_PLANNER_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-programs-table-sheets-dropdowns-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-programs-table-sheets-dropdowns-light-mode/)
  assert.match(adminVisualThemeSpecSource, /mockProgramsApi/)
  assert.match(adminVisualThemeSpecSource, /readProgramsTableSheetsDropdownsVisualState/)
  assert.match(adminVisualThemeSpecSource, /Create a program/)
  assert.match(adminVisualThemeSpecSource, /Export programs/)
  assert.match(adminVisualThemeSpecSource, /Delete program/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-programs-table-shell/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-programs-row-menu/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-programs-create-sheet/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_WORKOUTS_TABLE_SHEETS_DROPDOWNS_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_WORKOUTS_TABLE_SHEETS_DROPDOWNS_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_WORKOUTS_CALENDAR_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_WORKOUTS_CALENDAR_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-workouts-table-sheets-dropdowns-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-workouts-table-sheets-dropdowns-light-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-workouts-calendar-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-workouts-calendar-light-mode/)
  assert.match(adminVisualThemeSpecSource, /mockWorkoutCalendarApi/)
  assert.match(adminVisualThemeSpecSource, /readWorkoutCalendarVisualState/)
  assert.match(adminVisualThemeSpecSource, /mockWorkoutsApi/)
  assert.match(adminVisualThemeSpecSource, /readWorkoutsTableSheetsDropdownsVisualState/)
  assert.match(adminVisualThemeSpecSource, /Create workout/)
  assert.match(adminVisualThemeSpecSource, /Export workouts/)
  assert.match(adminVisualThemeSpecSource, /Assign to program/)
  assert.match(adminVisualThemeSpecSource, /Delete workouts/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-workouts-table-shell/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-workouts-row-menu/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-workouts-create-sheet/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-workouts-assign-program-select-content/)
  assert.match(workoutsCalendarSource, /admin-shell-workouts-calendar-view/)
  assert.match(workoutsCalendarSource, /admin-shell-workouts-calendar-header/)
  assert.match(workoutsCalendarSource, /admin-shell-workouts-calendar-month-grid/)
  assert.match(workoutsCalendarSource, /admin-shell-workouts-calendar-week-grid/)
  assert.match(workoutsCalendarSource, /admin-shell-workouts-calendar-event-card/)
  assert.match(workoutsCalendarSource, /admin-shell-workouts-calendar-add-dialog/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_EXERCISES_TABLE_SHEETS_MEDIA_DARK_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /ADMIN_EXERCISES_TABLE_SHEETS_MEDIA_LIGHT_MODE_VISUAL_CHECK/)
  assert.match(adminVisualThemeSpecSource, /admin-exercises-table-sheets-media-dark-mode/)
  assert.match(adminVisualThemeSpecSource, /admin-exercises-table-sheets-media-light-mode/)
  assert.match(adminVisualThemeSpecSource, /mockExercisesApi/)
  assert.match(adminVisualThemeSpecSource, /readExercisesTableSheetsMediaVisualState/)
  assert.match(adminVisualThemeSpecSource, /Create exercise/)
  assert.match(adminVisualThemeSpecSource, /Medias preview/)
  assert.match(adminVisualThemeSpecSource, /Delete exercise/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-exercises-table-shell/)
  assert.match(adminVisualThemeSpecSource, /admin-shell-exercises-create-sheet/)
  assert.match(exercisesDataTableSource, /admin-shell-exercises-table-shell/)
  assert.match(exercisesDataTableSource, /admin-shell-exercises-table/)
  assert.match(exercisesDataTableSource, /admin-shell-exercises-row-menu/)
  assert.match(exercisesDataTableSource, /admin-shell-exercises-filter-trigger/)
  assert.match(exercisesDataTableSource, /admin-shell-exercises-columns-button/)
  assert.match(exercisesDataTableSource, /admin-shell-exercises-name-text/)
  assert.match(exerciseEditorDialogSource, /admin-shell-exercises-create-sheet/)
  assert.match(exerciseEditorDialogSource, /ExerciseGeneratedMediaPreview/)
  assert.match(adminVisualThemeSpecSource, /program-planner-page-header/)
  assert.match(adminVisualThemeSpecSource, /program-planner-week-row/)
  assert.match(adminVisualThemeSpecSource, /program-planner-day-card/)
  assert.match(adminVisualThemeSpecSource, /program-planner-empty-workout-card/)
  assert.match(adminVisualThemeSpecSource, /program-planner-workout-card/)
  assert.match(adminVisualThemeSpecSource, /Create workout/)
  assert.match(adminVisualThemeSpecSource, /Workout actions/)
  assert.match(programPlannerSource, /program-planner-page-header/)
  assert.match(programPlannerSource, /program-planner-week-row/)
  assert.match(programPlannerSource, /program-planner-day-card/)
  assert.match(programPlannerSource, /program-planner-empty-workout-card/)
  assert.match(programPlannerSource, /program-planner-workout-card/)
  assert.match(programsDataTableSource, /admin-shell-programs-table-shell/)
  assert.match(programsDataTableSource, /admin-shell-programs-table/)
  assert.match(programsDataTableSource, /admin-shell-programs-row-menu/)
  assert.match(programsDataTableSource, /admin-shell-programs-filter-trigger/)
  assert.match(programsDataTableSource, /admin-shell-programs-columns-button/)
  assert.match(programsDataTableSource, /admin-shell-programs-name-text/)
  assert.match(adminVisualThemeSpecSource, /viewport:\s*['"]responsive['"]/)
  assert.match(adminVisualThemeSpecSource, /page\.setViewportSize\(\{\s*width:\s*390,\s*height:\s*844\s*\}\)/)
  assert.match(adminVisualThemeSpecSource, /page\.setViewportSize\(\{\s*width:\s*768,\s*height:\s*1024\s*\}\)/)
  assert.match(adminVisualThemeSpecSource, /admin-dashboard-mobile-sidebar-sheet/)
  assert.match(adminVisualThemeSpecSource, /openMobileSidebar/)
  assert.deepEqual(harness.adminVisualThemeChecks, [
    {
      id: 'admin-sidebar-dark-mode',
      route: '/admin/dashboard',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-sidebar-light-mode',
      route: '/admin/dashboard',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-topbar-dark-mode',
      route: '/admin/dashboard',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-topbar-light-mode',
      route: '/admin/dashboard',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-account-dropdown-dark-mode',
      route: '/admin/dashboard',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-account-dropdown-light-mode',
      route: '/admin/dashboard',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-route-active-state',
      route: '/admin/programs/program-1',
      interaction: 'active-route-state',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-no-default-controls',
      route: '/admin/dashboard',
      interaction: 'control-appearance-reset',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-mobile-tablet-width',
      route: '/admin/dashboard',
      viewport: 'responsive',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-support-inbox-dark-mode',
      route: '/admin/support/reference',
      theme: 'dark',
      interaction: 'support-inbox-shell',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-support-inbox-light-mode',
      route: '/admin/support/reference',
      theme: 'light',
      interaction: 'support-inbox-shell',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-settings-profile-account-dark-mode',
      route: '/admin/settings',
      theme: 'dark',
      interaction: 'profile-account-forms',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-settings-profile-account-light-mode',
      route: '/admin/settings',
      theme: 'light',
      interaction: 'profile-account-forms',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-dashboard-kpi-card-table-dark-mode',
      route: '/admin/dashboard',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-dashboard-kpi-card-table-light-mode',
      route: '/admin/dashboard',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-athletes-table-filter-dialog-dark-mode',
      route: '/admin/athletes',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-athletes-table-filter-dialog-light-mode',
      route: '/admin/athletes',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-invites-table-dialog-dark-mode',
      route: '/admin/athletes/invites',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-invites-table-dialog-light-mode',
      route: '/admin/athletes/invites',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-groups-table-dialog-dark-mode',
      route: '/admin/athletes/groups',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-groups-table-dialog-light-mode',
      route: '/admin/athletes/groups',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-rankings-table-dark-mode',
      route: '/admin/athletes/rankings',
      theme: 'dark',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-rankings-table-light-mode',
      route: '/admin/athletes/rankings',
      theme: 'light',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-programs-table-sheets-dropdowns-dark-mode',
      route: '/admin/programs',
      theme: 'dark',
      interaction: 'table-sheets-dropdowns',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-programs-table-sheets-dropdowns-light-mode',
      route: '/admin/programs',
      theme: 'light',
      interaction: 'table-sheets-dropdowns',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-workouts-table-sheets-dropdowns-dark-mode',
      route: '/admin/workouts',
      theme: 'dark',
      interaction: 'table-sheets-dropdowns',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-workouts-table-sheets-dropdowns-light-mode',
      route: '/admin/workouts',
      theme: 'light',
      interaction: 'table-sheets-dropdowns',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-workouts-calendar-dark-mode',
      route: '/admin/workouts/calendar',
      theme: 'dark',
      interaction: 'calendar-add-dialog',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-workouts-calendar-light-mode',
      route: '/admin/workouts/calendar',
      theme: 'light',
      interaction: 'calendar-add-dialog',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-exercises-table-sheets-media-dark-mode',
      route: '/admin/exercises',
      theme: 'dark',
      interaction: 'table-sheets-media',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-exercises-table-sheets-media-light-mode',
      route: '/admin/exercises',
      theme: 'light',
      interaction: 'table-sheets-media',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-program-detail-planner-dark-mode',
      route: '/admin/programs/program-1',
      theme: 'dark',
      interaction: 'detail-planner',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
    {
      id: 'admin-program-detail-planner-light-mode',
      route: '/admin/programs/program-1',
      theme: 'light',
      interaction: 'detail-planner',
      layer: WEB_TEST_LAYERS.VISUAL_THEME,
    },
  ])
  assert.match(webEnvExampleSource, /PPLUS_WEB_SAFE_COACH_ID=/)
  assert.match(webEnvExampleSource, /PPLUS_WEB_SAFE_ATHLETE_ID=/)
  assert.match(webEnvExampleSource, /PPLUS_WEB_SAFE_GROUP_ID=/)
  assert.match(webEnvExampleSource, /PPLUS_WEB_SAFE_EXERCISE_ID=/)
  assert.match(webEnvExampleSource, /PPLUS_WEB_SAFE_WORKOUT_TEMPLATE_ID=/)
  assert.match(webEnvExampleSource, /PPLUS_WEB_SAFE_PROGRAM_ID=/)
})

test('web test command groups define the public web source-test command group', () => {
  const commandGroups = getWebTestCommandGroups()
  const publicWebSourceTests = commandGroups.PUBLIC_WEB_SOURCE_TESTS

  assert.equal(commandGroups, WEB_TEST_COMMAND_GROUPS)
  assert.equal(Object.isFrozen(WEB_TEST_COMMAND_GROUPS), true)
  assert.equal(Object.isFrozen(publicWebSourceTests), true)
  assert.equal(publicWebSourceTests.id, 'public-web-source-tests')
  assert.equal(publicWebSourceTests.label, 'Public web source tests')
  assert.equal(publicWebSourceTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(publicWebSourceTests.testFiles, expectedPublicWebSourceTestFiles)
  assert.equal(
    publicWebSourceTests.command,
    `node --test ${expectedPublicWebSourceTestFiles.join(' ')}`,
  )

  for (const testFile of publicWebSourceTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `public source test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the admin auth source-test command group', () => {
  const adminAuthSourceTests = getWebTestCommandGroups().ADMIN_AUTH_SOURCE_TESTS

  assert.equal(Object.isFrozen(adminAuthSourceTests), true)
  assert.equal(adminAuthSourceTests.id, 'admin-auth-source-tests')
  assert.equal(adminAuthSourceTests.label, 'Admin auth source tests')
  assert.equal(adminAuthSourceTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(adminAuthSourceTests.testFiles, expectedAdminAuthSourceTestFiles)
  assert.equal(
    adminAuthSourceTests.command,
    `node --test ${expectedAdminAuthSourceTestFiles.join(' ')}`,
  )

  for (const testFile of adminAuthSourceTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `admin auth source test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the admin shell source-test command group', () => {
  const adminShellSourceTests = getWebTestCommandGroups().ADMIN_SHELL_SOURCE_TESTS

  assert.equal(Object.isFrozen(adminShellSourceTests), true)
  assert.equal(adminShellSourceTests.id, 'admin-shell-source-tests')
  assert.equal(adminShellSourceTests.label, 'Admin shell source tests')
  assert.equal(adminShellSourceTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(adminShellSourceTests.testFiles, expectedAdminShellSourceTestFiles)
  assert.equal(
    adminShellSourceTests.command,
    `node --test ${expectedAdminShellSourceTestFiles.join(' ')}`,
  )

  for (const testFile of adminShellSourceTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `admin shell source test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the dashboard command group', () => {
  const dashboardTests = getWebTestCommandGroups().DASHBOARD_TESTS

  assert.equal(Object.isFrozen(dashboardTests), true)
  assert.equal(dashboardTests.id, 'dashboard-tests')
  assert.equal(dashboardTests.label, 'Dashboard tests')
  assert.equal(dashboardTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(dashboardTests.testFiles, expectedDashboardTestFiles)
  assert.equal(
    dashboardTests.command,
    `node --test ${expectedDashboardTestFiles.join(' ')}`,
  )

  for (const testFile of dashboardTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `dashboard test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the athletes command group', () => {
  const athletesTests = getWebTestCommandGroups().ATHLETES_TESTS

  assert.equal(Object.isFrozen(athletesTests), true)
  assert.equal(athletesTests.id, 'athletes-tests')
  assert.equal(athletesTests.label, 'Athletes tests')
  assert.equal(athletesTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(athletesTests.testFiles, expectedAthletesTestFiles)
  assert.equal(
    athletesTests.command,
    `node --test ${expectedAthletesTestFiles.join(' ')}`,
  )

  for (const testFile of athletesTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `athletes test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the groups command group', () => {
  const groupsTests = getWebTestCommandGroups().GROUPS_TESTS

  assert.equal(Object.isFrozen(groupsTests), true)
  assert.equal(groupsTests.id, 'groups-tests')
  assert.equal(groupsTests.label, 'Groups tests')
  assert.equal(groupsTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(groupsTests.testFiles, expectedGroupsTestFiles)
  assert.equal(
    groupsTests.command,
    `node --test ${expectedGroupsTestFiles.join(' ')}`,
  )

  for (const testFile of groupsTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `groups test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the rankings command group', () => {
  const rankingsTests = getWebTestCommandGroups().RANKINGS_TESTS

  assert.equal(Object.isFrozen(rankingsTests), true)
  assert.equal(rankingsTests.id, 'rankings-tests')
  assert.equal(rankingsTests.label, 'Rankings tests')
  assert.equal(rankingsTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(rankingsTests.testFiles, expectedRankingsTestFiles)
  assert.equal(
    rankingsTests.command,
    `node --test ${expectedRankingsTestFiles.join(' ')}`,
  )

  for (const testFile of rankingsTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `rankings test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the programs command group', () => {
  const programsTests = getWebTestCommandGroups().PROGRAMS_TESTS

  assert.equal(Object.isFrozen(programsTests), true)
  assert.equal(programsTests.id, 'programs-tests')
  assert.equal(programsTests.label, 'Programs tests')
  assert.equal(programsTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(programsTests.testFiles, expectedProgramsTestFiles)
  assert.equal(
    programsTests.command,
    `node --test ${expectedProgramsTestFiles.join(' ')}`,
  )

  for (const testFile of programsTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `programs test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the workouts command group', () => {
  const workoutsTests = getWebTestCommandGroups().WORKOUTS_TESTS

  assert.equal(Object.isFrozen(workoutsTests), true)
  assert.equal(workoutsTests.id, 'workouts-tests')
  assert.equal(workoutsTests.label, 'Workouts tests')
  assert.equal(workoutsTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(workoutsTests.testFiles, expectedWorkoutsTestFiles)
  assert.equal(
    workoutsTests.command,
    `node --test ${expectedWorkoutsTestFiles.join(' ')}`,
  )

  for (const testFile of workoutsTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `workouts test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the exercises command group', () => {
  const exercisesTests = getWebTestCommandGroups().EXERCISES_TESTS

  assert.equal(Object.isFrozen(exercisesTests), true)
  assert.equal(exercisesTests.id, 'exercises-tests')
  assert.equal(exercisesTests.label, 'Exercises tests')
  assert.equal(exercisesTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(exercisesTests.testFiles, expectedExercisesTestFiles)
  assert.equal(
    exercisesTests.command,
    `node --test ${expectedExercisesTestFiles.join(' ')}`,
  )

  for (const testFile of exercisesTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `exercises test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the support and settings command group', () => {
  const supportAndSettingsTests = getWebTestCommandGroups().SUPPORT_AND_SETTINGS_TESTS

  assert.equal(Object.isFrozen(supportAndSettingsTests), true)
  assert.equal(supportAndSettingsTests.id, 'support-and-settings-tests')
  assert.equal(supportAndSettingsTests.label, 'Support and settings tests')
  assert.equal(supportAndSettingsTests.layer, WEB_TEST_LAYERS.SOURCE_CONTRACTS)
  assert.deepEqual(supportAndSettingsTests.testFiles, expectedSupportAndSettingsTestFiles)
  assert.equal(
    supportAndSettingsTests.command,
    `node --test ${expectedSupportAndSettingsTestFiles.join(' ')}`,
  )

  for (const testFile of supportAndSettingsTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `support and settings test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the full web source/API command group', () => {
  const fullWebSourceApiTests = getWebTestCommandGroups().FULL_WEB_SOURCE_API_TESTS

  assert.equal(Object.isFrozen(fullWebSourceApiTests), true)
  assert.equal(fullWebSourceApiTests.id, 'full-web-source-api-tests')
  assert.equal(fullWebSourceApiTests.label, 'Full web source/API tests')
  assert.equal(fullWebSourceApiTests.layer, WEB_TEST_LAYERS.CI_GATE)
  assert.deepEqual(fullWebSourceApiTests.testFiles, expectedFullWebSourceApiTestFiles)
  assert.equal(
    fullWebSourceApiTests.command,
    `node --test ${expectedFullWebSourceApiTestFiles.join(' ')}`,
  )

  assert.equal(
    new Set(fullWebSourceApiTests.testFiles).size,
    fullWebSourceApiTests.testFiles.length,
    'full web source/API command group should not run duplicate test files',
  )

  for (const testFile of fullWebSourceApiTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `full web source/API test file does not exist: ${testFile}`)
  }
})

test('web test command groups define the L3 build/static command group', () => {
  const buildStaticTests = getWebTestCommandGroups().BUILD_STATIC_TESTS

  assert.equal(Object.isFrozen(buildStaticTests), true)
  assert.equal(buildStaticTests.id, 'build-static-tests')
  assert.equal(buildStaticTests.label, 'Build/static output tests')
  assert.equal(buildStaticTests.layer, WEB_TEST_LAYERS.BUILD_STATIC)
  assert.deepEqual(buildStaticTests.testFiles, expectedBuildStaticTestFiles)
  assert.equal(
    buildStaticTests.command,
    `node --test ${expectedBuildStaticTestFiles.join(' ')}`,
  )

  for (const testFile of buildStaticTests.testFiles) {
    assert.equal(existsSync(join(repoRoot, testFile)), true, `build/static test file does not exist: ${testFile}`)
  }
})

test('web test command groups document expected command output for every command group', () => {
  const commandGroups = getWebTestCommandGroups()

  assert.deepEqual(Object.keys(commandGroups), Object.keys(expectedCommandOutputs))

  for (const [groupName, expectedOutput] of Object.entries(expectedCommandOutputs)) {
    const commandGroup = commandGroups[groupName]

    assert.equal(Object.isFrozen(commandGroup.expectedOutput), true, `${groupName} expectedOutput should be frozen`)
    assert.deepEqual(commandGroup.expectedOutput, expectedOutput)
    assert.equal(commandGroup.expectedOutput.testFiles, commandGroup.testFiles.length)
    assert.equal(commandGroup.expectedOutput.tests, commandGroup.expectedOutput.pass)
    assert.equal(commandGroup.expectedOutput.fail, 0)
    assert.equal(commandGroup.expectedOutput.warning, expectedCommandOutputWarning)
  }
})

test('web test command groups expose one root command for running all web tests', () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
  const runnerPath = 'apps/web/testing/run-web-tests.js'
  const runnerFullPath = join(repoRoot, runnerPath)

  assert.equal(packageJson.scripts['test:web'], `node ${runnerPath}`)
  assert.equal(existsSync(runnerFullPath), true, `web test runner does not exist: ${runnerPath}`)

  const runnerSource = readFileSync(runnerFullPath, 'utf8')
  assert.match(runnerSource, /FULL_WEB_SOURCE_API_TESTS/)
  assert.match(runnerSource, /getWebTestCommandGroups/)
})

test('web page test manifest fails when any apps/web/app page route is missing', () => {
  const expectedRoutePaths = collectPageRoutes()
  const manifestRoutePaths = getWebPageTestManifest().map((route) => route.path).sort()
  const missingRoutePaths = expectedRoutePaths.filter((routePath) => !manifestRoutePaths.includes(routePath))

  assert.deepEqual(missingRoutePaths, [], `missing page routes in manifest: ${missingRoutePaths.join(', ')}`)
})

test('web page test manifest fails when a manifest route points to a deleted page', () => {
  const expectedRoutePaths = collectPageRoutes()
  const manifestRoutePaths = getWebPageTestManifest().map((route) => route.path).sort()
  const deletedPageRoutePaths = manifestRoutePaths.filter((routePath) => !expectedRoutePaths.includes(routePath))

  assert.deepEqual(deletedPageRoutePaths, [], `manifest routes without page.jsx files: ${deletedPageRoutePaths.join(', ')}`)
})

test('web page test manifest exactly matches the current page route inventory', () => {
  const expectedRoutePaths = collectPageRoutes()
  const manifestRoutePaths = getWebPageTestManifest().map((route) => route.path).sort()

  assert.deepEqual(manifestRoutePaths, expectedRoutePaths)
})

test('web page test manifest classifies each route by functional area', () => {
  const routeAreas = Object.fromEntries(
    getWebPageTestManifest().map((route) => [route.path, route.area]),
  )

  assert.deepEqual(routeAreas, expectedRouteAreas)
})

test('web page test manifest fails when any route lacks auth classification', () => {
  const manifestRoutes = getWebPageTestManifest()
  const manifestRoutePaths = manifestRoutes.map((route) => route.path).sort()
  const classifiedRoutePaths = Object.keys(expectedRouteAuthStates).sort()
  const unclassifiedRoutePaths = manifestRoutePaths.filter(
    (routePath) => !Object.hasOwn(expectedRouteAuthStates, routePath),
  )
  const routesWithoutAuthState = manifestRoutes
    .filter((route) => route.authState === undefined || route.authState === null || route.authState === '')
    .map((route) => route.path)

  assert.deepEqual(unclassifiedRoutePaths, [], `routes missing expected auth classification: ${unclassifiedRoutePaths.join(', ')}`)
  assert.deepEqual(routesWithoutAuthState, [], `manifest routes missing authState: ${routesWithoutAuthState.join(', ')}`)
  assert.deepEqual(classifiedRoutePaths, manifestRoutePaths)
})

test('web page test manifest classifies each route by auth state', () => {
  const routeAuthStates = Object.fromEntries(
    getWebPageTestManifest().map((route) => [route.path, route.authState]),
  )

  assert.deepEqual(routeAuthStates, expectedRouteAuthStates)
})

test('web page test manifest records expected status or redirect behavior for each route', () => {
  const routeBehaviors = Object.fromEntries(
    getWebPageTestManifest().map((route) => [route.path, route.expectedBehavior]),
  )

  assert.deepEqual(routeBehaviors, expectedRouteBehaviors)
})

test('web page test manifest fails when any route lacks browser smoke priority', () => {
  const manifestRoutes = getWebPageTestManifest()
  const manifestRoutePaths = manifestRoutes.map((route) => route.path).sort()
  const prioritizedRoutePaths = Object.keys(expectedRouteBrowserSmokePriorities).sort()
  const unprioritizedRoutePaths = manifestRoutePaths.filter(
    (routePath) => !Object.hasOwn(expectedRouteBrowserSmokePriorities, routePath),
  )
  const routesWithoutBrowserSmokePriority = manifestRoutes
    .filter(
      (route) =>
        route.browserSmokePriority === undefined ||
        route.browserSmokePriority === null ||
        route.browserSmokePriority === '',
    )
    .map((route) => route.path)

  assert.deepEqual(
    unprioritizedRoutePaths,
    [],
    `routes missing expected browser smoke priority: ${unprioritizedRoutePaths.join(', ')}`,
  )
  assert.deepEqual(
    routesWithoutBrowserSmokePriority,
    [],
    `manifest routes missing browserSmokePriority: ${routesWithoutBrowserSmokePriority.join(', ')}`,
  )
  assert.deepEqual(prioritizedRoutePaths, manifestRoutePaths)
})

test('web page test manifest assigns browser smoke priority to each route', () => {
  const routePriorities = Object.fromEntries(
    getWebPageTestManifest().map((route) => [route.path, route.browserSmokePriority]),
  )

  assert.deepEqual(routePriorities, expectedRouteBrowserSmokePriorities)
})

test('web page test manifest assigns the expected layer list to each route', () => {
  const routeLayerLists = Object.fromEntries(
    getWebPageTestManifest().map((route) => [route.path, route.layers]),
  )

  assert.deepEqual(routeLayerLists, expectedRouteLayerLists)
})

test('web page test manifest maps existing test files to each route', () => {
  const routeTestFiles = Object.fromEntries(
    getWebPageTestManifest().map((route) => [route.path, route.existingTestFiles]),
  )

  assert.deepEqual(routeTestFiles, expectedRouteExistingTestFiles)
})

test('web page test manifest entries use only known route testing contracts', () => {
  const manifest = getWebPageTestManifest()
  const routeIds = new Set()
  const knownLayers = new Set(expectedLayers)
  const knownAreas = new Set(expectedAreas)
  const knownAuthStates = new Set(expectedAuthStates)
  const knownSmokePriorities = new Set(expectedSmokePriorities)

  for (const route of manifest) {
    assert.equal(typeof route.id, 'string', 'route.id is required')
    assert.equal(typeof route.path, 'string', `${route.id} path is required`)
    assert.equal(route.path.startsWith('/'), true, `${route.id} path must start with /`)
    assert.equal(routeIds.has(route.id), false, `${route.id} is duplicated`)
    routeIds.add(route.id)

    assert.equal(knownAreas.has(route.area), true, `${route.id} area is unknown`)
    assert.equal(knownAuthStates.has(route.authState), true, `${route.id} authState is unknown`)
    assert.equal(
      knownSmokePriorities.has(route.browserSmokePriority),
      true,
      `${route.id} browserSmokePriority is unknown`,
    )

    assert.equal(Array.isArray(route.layers), true, `${route.id} layers must be an array`)
    assert.notEqual(route.layers.length, 0, `${route.id} must declare at least one test layer`)

    assert.equal(typeof route.expectedBehavior, 'object', `${route.id} expectedBehavior is required`)
    assert.equal(['status', 'redirect'].includes(route.expectedBehavior.type), true, `${route.id} expectedBehavior type is unknown`)
    if (route.expectedBehavior.type === 'status') {
      assert.equal(typeof route.expectedBehavior.status, 'number', `${route.id} expectedBehavior status is required`)
    }
    if (route.expectedBehavior.type === 'redirect') {
      assert.equal(typeof route.expectedBehavior.destination, 'string', `${route.id} expectedBehavior destination is required`)
      assert.equal(route.expectedBehavior.destination.startsWith('/'), true, `${route.id} redirect destination must start with /`)
    }

    assert.equal(Array.isArray(route.existingTestFiles), true, `${route.id} existingTestFiles must be an array`)
    assert.notEqual(route.existingTestFiles.length, 0, `${route.id} must map at least one existing test file`)
    for (const testFile of route.existingTestFiles) {
      assert.equal(typeof testFile, 'string', `${route.id} test file must be a string`)
      assert.equal(testFile.startsWith('tests/'), true, `${route.id} test file must be repo-relative under tests/`)
      assert.equal(existsSync(join(repoRoot, testFile)), true, `${route.id} test file does not exist: ${testFile}`)
    }

    for (const layer of route.layers) {
      assert.equal(knownLayers.has(layer), true, `${route.id} layer ${layer} is unknown`)
    }
  }
})
