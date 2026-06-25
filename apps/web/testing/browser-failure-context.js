import { dirname, relative } from 'node:path'

import { WEB_BROWSER_SMOKE_HARNESS } from './page-test-manifest.js'

const ROUTE_SMOKE_LAYER = 'L4_BROWSER_SMOKE'

function normalizeRepoPath(file) {
  if (!file) return ''
  const normalized = String(file).replaceAll('\\', '/')
  const appsWebIndex = normalized.indexOf('apps/web/')
  if (appsWebIndex >= 0) {
    return normalized.slice(appsWebIndex)
  }
  const e2eIndex = normalized.indexOf('e2e/')
  if (e2eIndex >= 0) {
    return `apps/web/${normalized.slice(e2eIndex)}`
  }
  if (/^[^/]+\.spec\.js$/.test(normalized)) {
    return `apps/web/e2e/${normalized}`
  }
  return normalized.replace(/^\.\//, '')
}

function makeRouteSmokeContexts(specFile, routes) {
  return routes.map((route) => ({
    id: `${specFile}:${route}`,
    route,
    layer: ROUTE_SMOKE_LAYER,
  }))
}

function pickFields(check) {
  return {
    id: check.id,
    route: check.route,
    layer: check.layer,
  }
}

function getSpecContextCandidates() {
  return new Map([
    [WEB_BROWSER_SMOKE_HARNESS.publicRouteSmokeSpecFile, makeRouteSmokeContexts(WEB_BROWSER_SMOKE_HARNESS.publicRouteSmokeSpecFile, WEB_BROWSER_SMOKE_HARNESS.publicRouteSmokePaths)],
    [WEB_BROWSER_SMOKE_HARNESS.adminAuthRouteSmokeSpecFile, makeRouteSmokeContexts(WEB_BROWSER_SMOKE_HARNESS.adminAuthRouteSmokeSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminAuthRouteSmokePaths)],
    [WEB_BROWSER_SMOKE_HARNESS.adminShellProtectedRouteSmokeSpecFile, makeRouteSmokeContexts(WEB_BROWSER_SMOKE_HARNESS.adminShellProtectedRouteSmokeSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminShellProtectedRouteSmokePaths)],
    [WEB_BROWSER_SMOKE_HARNESS.adminProductRouteSmokeSpecFile, makeRouteSmokeContexts(WEB_BROWSER_SMOKE_HARNESS.adminProductRouteSmokeSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminProductRouteSmokePaths)],
    [WEB_BROWSER_SMOKE_HARNESS.qaInternalRouteClassificationSmokeSpecFile, makeRouteSmokeContexts(WEB_BROWSER_SMOKE_HARNESS.qaInternalRouteClassificationSmokeSpecFile, WEB_BROWSER_SMOKE_HARNESS.qaInternalRouteClassificationSmokePaths)],
    [WEB_BROWSER_SMOKE_HARNESS.publicVisualThemeSpecFile, WEB_BROWSER_SMOKE_HARNESS.publicVisualThemeChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.publicSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.publicSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminAuthSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminAuthSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminDashboardSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminDashboardSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminSupportSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminSupportSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminSettingsSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminSettingsSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminAthletesSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminAthletesSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminInvitesSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminInvitesSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminGroupsSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminGroupsSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminProgramsSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminProgramsSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminWorkoutsSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminWorkoutsSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminExercisesSafeWorkflowSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminExercisesSafeWorkflowChecks.map(pickFields)],
    [WEB_BROWSER_SMOKE_HARNESS.adminVisualThemeSpecFile, WEB_BROWSER_SMOKE_HARNESS.adminVisualThemeChecks.map(pickFields)],
  ])
}

function routeAppearsInTitle(route, title) {
  if (!route || !title) return false
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|\\s|›)${escaped}(\\s|$)`).test(title)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

export function resolveBrowserFailureContext({ file, title } = {}) {
  const normalizedFile = normalizeRepoPath(file)
  const candidates = getSpecContextCandidates().get(normalizedFile) ?? []
  const titleMatch = candidates.find((candidate) => routeAppearsInTitle(candidate.route, title))
  const routes = unique(candidates.map((candidate) => candidate.route))
  const layers = unique(candidates.map((candidate) => candidate.layer))
  const fallbackCandidate = candidates[0]

  return {
    file: normalizedFile,
    route: titleMatch?.route ?? (routes.length === 1 ? routes[0] : fallbackCandidate?.route ?? 'unknown'),
    layer: titleMatch?.layer ?? (layers.length === 1 ? layers[0] : fallbackCandidate?.layer ?? 'unknown'),
    candidates,
  }
}

export function formatBrowserFailureContextSummary(failures = []) {
  if (!failures.length) return ''

  const lines = ['', '## Browser failure context']

  for (const failure of failures) {
    const context = resolveBrowserFailureContext(failure)
    lines.push(`- test: ${failure.title ?? 'unknown'}`)
    lines.push(`  file: ${context.file || normalizeRepoPath(failure.file) || 'unknown'}`)
    lines.push(`  route: ${context.route}`)
    lines.push(`  layer: ${context.layer}`)
    if (failure.error) lines.push(`  error: ${failure.error}`)
    if (failure.artifactDir) lines.push(`  artifacts: ${normalizeRepoPath(failure.artifactDir)}`)
    if (context.candidates.length > 1) {
      lines.push(`  candidate routes: ${unique(context.candidates.map((candidate) => candidate.route)).join(', ')}`)
      lines.push(`  candidate layers: ${unique(context.candidates.map((candidate) => candidate.layer)).join(', ')}`)
    }
  }

  return `${lines.join('\n')}\n`
}

export function extractBrowserFailuresFromPlaywrightJson(report, { repoRoot = process.cwd() } = {}) {
  const failures = []

  function walkSuite(suite, titleParts = []) {
    for (const childSuite of suite.suites ?? []) {
      walkSuite(childSuite, [...titleParts, childSuite.title].filter(Boolean))
    }

    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        for (const result of test.results ?? []) {
          if (result.status !== 'failed' && result.status !== 'timedOut' && result.status !== 'interrupted') continue
          const attachmentPath = result.attachments?.find((attachment) => attachment.path)?.path
          const locationFile = test.location?.file ?? spec.file ?? suite.file
          failures.push({
            file: normalizeRepoPath(locationFile),
            title: [...titleParts, spec.title].filter(Boolean).join(' › '),
            error: result.error?.message?.split('\n')[0] ?? result.errors?.[0]?.message?.split('\n')[0],
            artifactDir: attachmentPath ? normalizeRepoPath(dirname(relative(repoRoot, attachmentPath))) : undefined,
          })
        }
      }
    }
  }

  for (const suite of report.suites ?? []) {
    walkSuite(suite, [suite.title].filter(Boolean))
  }

  return failures
}
