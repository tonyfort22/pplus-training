export const WEB_TEST_LAYERS = Object.freeze({
  ROUTE_INVENTORY: 'L0_ROUTE_INVENTORY',
  SOURCE_CONTRACTS: 'L1_SOURCE_CONTRACTS',
  API_REPOSITORY: 'L2_API_REPOSITORY',
  BUILD_STATIC: 'L3_BUILD_STATIC',
  BROWSER_SMOKE: 'L4_BROWSER_SMOKE',
  VISUAL_THEME: 'L5_VISUAL_THEME',
  SAFE_WORKFLOW: 'L6_SAFE_WORKFLOW',
  CI_GATE: 'L7_CI_GATE',
})

export const WEB_ROUTE_AREAS = Object.freeze({
  PUBLIC: 'public',
  ADMIN_AUTH: 'admin-auth',
  ADMIN_SHELL: 'admin-shell',
  ADMIN_PRODUCT: 'admin-product',
  SUPPORT: 'support',
  SETTINGS: 'settings',
  QA_INTERNAL: 'qa-internal',
})

export const WEB_ROUTE_AUTH_STATES = Object.freeze({
  PUBLIC: 'public',
  REDIRECT_IF_AUTHENTICATED: 'redirect-if-authenticated',
  PROTECTED: 'protected',
  INTERNAL_TEST_ONLY: 'internal-test-only',
})

export const WEB_BROWSER_SMOKE_PRIORITIES = Object.freeze({
  REQUIRED: 'required',
  IMPORTANT: 'important',
  OPTIONAL: 'optional',
  INTERNAL: 'internal',
})

export const WEB_API_ROUTE_CLASSES = Object.freeze({
  LEGACY_HELPER: 'legacy/helper',
})

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}

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

const publicSupportPageLayers = Object.freeze([
  WEB_TEST_LAYERS.ROUTE_INVENTORY,
  WEB_TEST_LAYERS.SOURCE_CONTRACTS,
  WEB_TEST_LAYERS.BUILD_STATIC,
  WEB_TEST_LAYERS.BROWSER_SMOKE,
  WEB_TEST_LAYERS.VISUAL_THEME,
  WEB_TEST_LAYERS.SAFE_WORKFLOW,
])

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
  '/support': publicSupportPageLayers,
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
  publicSafeWorkflowChecks: Object.freeze([
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
  ]),
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


export const WEB_BROWSER_SMOKE_HARNESS = deepFreeze(expectedBrowserSmokeHarness)

export const webPageTestManifest = deepFreeze(Object.keys(expectedRouteAreas).map((path) => ({
  id: path === '/' ? 'home' : path.slice(1).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, ''),
  path,
  area: expectedRouteAreas[path],
  authState: expectedRouteAuthStates[path],
  expectedBehavior: expectedRouteBehaviors[path],
  browserSmokePriority: expectedRouteBrowserSmokePriorities[path],
  layers: expectedRouteLayerLists[path],
  existingTestFiles: expectedRouteExistingTestFiles[path],
})))

const webApiRouteClassifications = deepFreeze([
  {
    path: '/api/admin/exercise-youtube-media',
    classification: WEB_API_ROUTE_CLASSES.LEGACY_HELPER,
    area: WEB_ROUTE_AREAS.ADMIN_PRODUCT,
    authState: WEB_ROUTE_AUTH_STATES.PROTECTED,
    sourceFile: 'apps/web/app/api/admin/exercise-youtube-media/route.js',
    existingTestFiles: ['tests/web-exercise-youtube-media.test.js'],
  },
])

export function getWebApiRouteClassifications() {
  return webApiRouteClassifications
}

function makeCommandGroup({ id, label, layer, testFiles, expectedOutput }) {
  return deepFreeze({
    id,
    label,
    layer,
    testFiles,
    command: `node --test ${testFiles.join(' ')}`,
    expectedOutput,
  })
}

export const WEB_TEST_COMMAND_GROUPS = deepFreeze({
  PUBLIC_WEB_SOURCE_TESTS: makeCommandGroup({ id: 'public-web-source-tests', label: 'Public web source tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedPublicWebSourceTestFiles, expectedOutput: expectedCommandOutputs.PUBLIC_WEB_SOURCE_TESTS }),
  ADMIN_AUTH_SOURCE_TESTS: makeCommandGroup({ id: 'admin-auth-source-tests', label: 'Admin auth source tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedAdminAuthSourceTestFiles, expectedOutput: expectedCommandOutputs.ADMIN_AUTH_SOURCE_TESTS }),
  ADMIN_SHELL_SOURCE_TESTS: makeCommandGroup({ id: 'admin-shell-source-tests', label: 'Admin shell source tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedAdminShellSourceTestFiles, expectedOutput: expectedCommandOutputs.ADMIN_SHELL_SOURCE_TESTS }),
  DASHBOARD_TESTS: makeCommandGroup({ id: 'dashboard-tests', label: 'Dashboard tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedDashboardTestFiles, expectedOutput: expectedCommandOutputs.DASHBOARD_TESTS }),
  ATHLETES_TESTS: makeCommandGroup({ id: 'athletes-tests', label: 'Athletes tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedAthletesTestFiles, expectedOutput: expectedCommandOutputs.ATHLETES_TESTS }),
  GROUPS_TESTS: makeCommandGroup({ id: 'groups-tests', label: 'Groups tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedGroupsTestFiles, expectedOutput: expectedCommandOutputs.GROUPS_TESTS }),
  RANKINGS_TESTS: makeCommandGroup({ id: 'rankings-tests', label: 'Rankings tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedRankingsTestFiles, expectedOutput: expectedCommandOutputs.RANKINGS_TESTS }),
  PROGRAMS_TESTS: makeCommandGroup({ id: 'programs-tests', label: 'Programs tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedProgramsTestFiles, expectedOutput: expectedCommandOutputs.PROGRAMS_TESTS }),
  WORKOUTS_TESTS: makeCommandGroup({ id: 'workouts-tests', label: 'Workouts tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedWorkoutsTestFiles, expectedOutput: expectedCommandOutputs.WORKOUTS_TESTS }),
  EXERCISES_TESTS: makeCommandGroup({ id: 'exercises-tests', label: 'Exercises tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedExercisesTestFiles, expectedOutput: expectedCommandOutputs.EXERCISES_TESTS }),
  SUPPORT_AND_SETTINGS_TESTS: makeCommandGroup({ id: 'support-and-settings-tests', label: 'Support and settings tests', layer: WEB_TEST_LAYERS.SOURCE_CONTRACTS, testFiles: expectedSupportAndSettingsTestFiles, expectedOutput: expectedCommandOutputs.SUPPORT_AND_SETTINGS_TESTS }),
  BUILD_STATIC_TESTS: makeCommandGroup({ id: 'build-static-tests', label: 'Build/static output tests', layer: WEB_TEST_LAYERS.BUILD_STATIC, testFiles: expectedBuildStaticTestFiles, expectedOutput: expectedCommandOutputs.BUILD_STATIC_TESTS }),
  FULL_WEB_SOURCE_API_TESTS: makeCommandGroup({ id: 'full-web-source-api-tests', label: 'Full web source/API tests', layer: WEB_TEST_LAYERS.CI_GATE, testFiles: [...new Set([...expectedPublicWebSourceTestFiles, ...expectedAdminAuthSourceTestFiles, ...expectedAdminShellSourceTestFiles, ...expectedDashboardTestFiles, ...expectedAthletesTestFiles, ...expectedGroupsTestFiles, ...expectedRankingsTestFiles, ...expectedProgramsTestFiles, ...expectedWorkoutsTestFiles, ...expectedExercisesTestFiles, ...expectedSupportAndSettingsTestFiles])], expectedOutput: expectedCommandOutputs.FULL_WEB_SOURCE_API_TESTS }),
})

export function getWebBrowserSmokeHarness() {
  return WEB_BROWSER_SMOKE_HARNESS
}

export function getWebPageTestManifest() {
  return webPageTestManifest
}

export function getWebPageCoverageSummary(manifest = webPageTestManifest) {
  const byRoute = manifest.map((route) => ({
    path: route.path,
    area: route.area,
    authState: route.authState,
    layers: [...route.layers],
    layerCount: route.layers.length,
    testFileCount: route.existingTestFiles.length,
    testFiles: [...route.existingTestFiles],
  }))

  const byLayer = Object.values(WEB_TEST_LAYERS).map((layer) => {
    const routes = manifest.filter((route) => route.layers.includes(layer))
    const testFiles = [...new Set(routes.flatMap((route) => route.existingTestFiles))].sort()

    return {
      layer,
      routeCount: routes.length,
      routes: routes.map((route) => route.path),
      testFileCount: testFiles.length,
      testFiles,
    }
  })

  return deepFreeze({
    routeCount: byRoute.length,
    layerCount: byLayer.length,
    totalRouteLayerMappings: byRoute.reduce((total, route) => total + route.layerCount, 0),
    uniqueTestFileCount: new Set(byRoute.flatMap((route) => route.testFiles)).size,
    byRoute,
    byLayer,
  })
}

export function getWebTestCommandGroups() {
  return WEB_TEST_COMMAND_GROUPS
}
