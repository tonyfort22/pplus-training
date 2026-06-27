import { webPageTestManifest, WEB_TEST_COMMAND_GROUPS, WEB_TEST_LAYERS } from './page-test-manifest.js'

function normalizeRepoPath(file) {
  if (!file) return ''
  const normalized = String(file).replaceAll('\\', '/').replace(/^\.\//, '')
  const testsIndex = normalized.indexOf('tests/')
  if (testsIndex >= 0) return normalized.slice(testsIndex)
  return normalized
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function getRouteCandidatesForFile(file) {
  return webPageTestManifest
    .filter((route) => route.existingTestFiles.includes(file))
    .map((route) => ({
      route: route.path,
      area: route.area,
      layers: route.layers,
    }))
}

function getCommandGroupCandidatesForFile(file) {
  return Object.values(WEB_TEST_COMMAND_GROUPS)
    .filter((group) => group.layer !== WEB_TEST_LAYERS.CI_GATE)
    .filter((group) => group.testFiles.includes(file))
    .map((group) => ({
      id: group.id,
      label: group.label,
      layer: group.layer,
    }))
}

function inferRouteFromTestFile(file) {
  if (/settings-account|account-repository/.test(file)) return '/admin/settings/account'
  if (/settings|coach-profile/.test(file)) return '/admin/settings'
  if (/support/.test(file)) return file.includes('public') ? '/support' : '/admin/support'
  if (/login/.test(file)) return '/admin/login'
  if (/forgot-password/.test(file)) return '/admin/forgot-password'
  if (/reset-password/.test(file)) return '/admin/reset-password'
  if (/program-detail|program-planner|program-workout/.test(file)) return '/admin/programs/[programId]'
  if (/program/.test(file)) return '/admin/programs'
  if (/workout/.test(file)) return '/admin/workouts'
  if (/exercise/.test(file)) return '/admin/exercises'
  if (/ranking/.test(file)) return '/admin/athletes/rankings'
  if (/group/.test(file)) return '/admin/athletes/groups'
  if (/invite/.test(file)) return '/admin/athletes/invites'
  if (/athlete/.test(file)) return '/admin/athletes'
  if (/dashboard/.test(file)) return '/admin/dashboard'
  if (/public|landing|faq|home/.test(file)) return file.includes('faq') ? '/faq' : '/'
  return 'unknown'
}

export function resolveSourceFailureContext({ file } = {}) {
  const normalizedFile = normalizeRepoPath(file)
  const routeCandidates = getRouteCandidatesForFile(normalizedFile)
  const commandGroupCandidates = getCommandGroupCandidatesForFile(normalizedFile)
  const candidateRoutes = unique(routeCandidates.map((candidate) => candidate.route))
  const candidateLayers = unique(commandGroupCandidates.map((candidate) => candidate.layer))
  const candidateGroups = unique(commandGroupCandidates.map((candidate) => candidate.label))

  return {
    file: normalizedFile,
    route: candidateRoutes.length === 1 ? candidateRoutes[0] : (candidateRoutes[0] ?? inferRouteFromTestFile(normalizedFile)),
    layer: candidateLayers.length === 1 ? candidateLayers[0] : (candidateLayers[0] ?? 'unknown'),
    group: candidateGroups.length === 1 ? candidateGroups[0] : (candidateGroups[0] ?? 'unknown'),
    candidateRoutes,
    candidateLayers,
    candidateGroups,
  }
}

export function extractSourceFailuresFromNodeTestOutput(output = '') {
  const failures = []
  const source = String(output)
  const failurePattern = /test at (tests\/[^:\n]+):\d+:\d+\n✖ ([^\n]+)/g

  for (const match of source.matchAll(failurePattern)) {
    failures.push({
      file: normalizeRepoPath(match[1]),
      title: match[2].trim(),
    })
  }

  if (failures.length) return failures

  const fallbackPattern = /✖ ([^\n]+)\n[\s\S]*?\n\s+at TestContext\.<anonymous> \(file:\/\/[^\n]*\/(tests\/[^:\n]+):\d+:\d+\)/g
  for (const match of source.matchAll(fallbackPattern)) {
    failures.push({
      file: normalizeRepoPath(match[2]),
      title: match[1].trim(),
    })
  }

  return failures
}

export function formatSourceFailureContextSummary(failures = []) {
  if (!failures.length) return ''

  const lines = ['', '## Web source/API failure context']

  for (const failure of failures) {
    const context = resolveSourceFailureContext(failure)
    lines.push(`- test: ${failure.title ?? 'unknown'}`)
    lines.push(`  file: ${context.file || normalizeRepoPath(failure.file) || 'unknown'}`)
    lines.push(`  route: ${context.route}`)
    lines.push(`  layer: ${context.layer}`)
    lines.push(`  group: ${context.group}`)
    if (context.candidateRoutes.length > 1) lines.push(`  candidate routes: ${context.candidateRoutes.join(', ')}`)
    if (context.candidateLayers.length > 1) lines.push(`  candidate layers: ${context.candidateLayers.join(', ')}`)
    if (context.candidateGroups.length > 1) lines.push(`  candidate groups: ${context.candidateGroups.join(', ')}`)
  }

  return `${lines.join('\n')}\n`
}
