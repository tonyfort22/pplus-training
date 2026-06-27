import { existsSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import {
  MOBILE_SMOKE_ARTIFACT_ROOT,
} from './mobile-simulator-smoke-setup.js'
import {
  MOBILE_SAFE_WORKFLOW_CHECKS,
  MOBILE_SAFE_WORKFLOW_CHECK_STATUSES,
} from './mobile-safe-workflow-checks.js'
import {
  MOBILE_VISUAL_DEVICE_CHECKS,
  MOBILE_VISUAL_DEVICE_CHECK_STATUSES,
} from './mobile-visual-device-checks.js'

export const MOBILE_TEST_ARTIFACT_RETENTION_STATUSES = Object.freeze({
  CLEANED: 'cleaned',
  LISTED_RETAINED_PROOF: 'listed_retained_proof',
  MISSING_ARTIFACT_ROOT: 'missing_artifact_root',
})

export const MOBILE_TEST_ARTIFACT_ALLOWED_FILES = Object.freeze([
  'apps/mobile/testing/pnpm-test-mobile-output.txt',
])

function uniqueSorted(items) {
  return Object.freeze([...new Set(items)].sort())
}

function normalizeRelativePath(path) {
  return path.replaceAll('\\', '/')
}

function collectFiles(rootPath, cwd) {
  const absoluteRoot = resolve(cwd, rootPath)

  if (!existsSync(absoluteRoot)) {
    return Object.freeze([])
  }

  const stack = [absoluteRoot]
  const files = []

  while (stack.length > 0) {
    const currentPath = stack.pop()
    const entries = readdirSync(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = resolve(currentPath, entry.name)

      if (entry.isDirectory()) {
        stack.push(entryPath)
        continue
      }

      if (entry.isFile()) {
        files.push(normalizeRelativePath(relative(cwd, entryPath)))
      }
    }
  }

  return uniqueSorted(files)
}

function listedRetainedArtifactPaths({
  visualChecks = MOBILE_VISUAL_DEVICE_CHECKS,
  safeWorkflowChecks = MOBILE_SAFE_WORKFLOW_CHECKS,
} = {}) {
  const visualArtifacts = visualChecks
    .filter((check) => check.status === MOBILE_VISUAL_DEVICE_CHECK_STATUSES.PASSED)
    .flatMap((check) => check.artifacts)

  const safeWorkflowArtifacts = safeWorkflowChecks
    .filter((check) => check.status === MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.PASSED)
    .flatMap((check) => check.artifacts)

  return uniqueSorted([...visualArtifacts, ...safeWorkflowArtifacts])
}

export function getMobileTestArtifactInventory({
  cwd = process.cwd(),
  artifactRoot = MOBILE_SMOKE_ARTIFACT_ROOT,
  allowedFiles = MOBILE_TEST_ARTIFACT_ALLOWED_FILES,
  visualChecks = MOBILE_VISUAL_DEVICE_CHECKS,
  safeWorkflowChecks = MOBILE_SAFE_WORKFLOW_CHECKS,
} = {}) {
  const existingArtifactFiles = collectFiles(artifactRoot, cwd)
  const retainedProofFiles = listedRetainedArtifactPaths({ visualChecks, safeWorkflowChecks })
  const retainedProofFileSet = new Set(retainedProofFiles)
  const allowedFileSet = new Set(allowedFiles)
  const unlistedArtifactFiles = existingArtifactFiles.filter(
    (artifactPath) => !retainedProofFileSet.has(artifactPath) && !allowedFileSet.has(artifactPath),
  )
  const listedButMissingArtifactFiles = retainedProofFiles.filter(
    (artifactPath) => !existsSync(resolve(cwd, artifactPath)),
  )
  const retainedScenarioDirs = uniqueSorted(retainedProofFiles.map((artifactPath) => artifactPath.split('/').slice(0, 5).join('/')))

  return Object.freeze({
    artifactRoot,
    status: existingArtifactFiles.length === 0
      ? MOBILE_TEST_ARTIFACT_RETENTION_STATUSES.CLEANED
      : MOBILE_TEST_ARTIFACT_RETENTION_STATUSES.LISTED_RETAINED_PROOF,
    existingArtifactFiles: Object.freeze(existingArtifactFiles),
    retainedProofFiles,
    retainedScenarioDirs,
    listedButMissingArtifactFiles: Object.freeze(listedButMissingArtifactFiles),
    unlistedArtifactFiles: Object.freeze(unlistedArtifactFiles),
    allowedFiles: Object.freeze([...allowedFiles]),
  })
}

export function assertMobileTestArtifactsCleanedOrListed(options = {}) {
  const inventory = getMobileTestArtifactInventory(options)

  if (inventory.listedButMissingArtifactFiles.length > 0) {
    throw new Error([
      'Listed mobile test artifacts are missing.',
      ...inventory.listedButMissingArtifactFiles.map((artifactPath) => `- ${artifactPath}`),
    ].join('\n'))
  }

  if (inventory.unlistedArtifactFiles.length > 0) {
    throw new Error([
      'Unlisted mobile test artifacts remain after mobile test run.',
      ...inventory.unlistedArtifactFiles.map((artifactPath) => `- ${artifactPath}`),
    ].join('\n'))
  }

  return inventory
}

export function formatMobileTestArtifactInventory(inventory) {
  if (inventory.existingArtifactFiles.length === 0) {
    return `Artifacts: cleaned (${inventory.artifactRoot})`
  }

  return [
    `Artifacts: listed retained proof under ${inventory.artifactRoot}`,
    ...inventory.retainedScenarioDirs.map((scenarioDir) => `- ${scenarioDir}`),
  ].join('\n')
}

export function getMobileTestArtifactRootSummary({ cwd = process.cwd(), artifactRoot = MOBILE_SMOKE_ARTIFACT_ROOT } = {}) {
  const absoluteRoot = resolve(cwd, artifactRoot)

  if (!existsSync(absoluteRoot)) {
    return Object.freeze({ exists: false, files: Object.freeze([]), directories: Object.freeze([]) })
  }

  const entries = readdirSync(absoluteRoot, { withFileTypes: true })
  return Object.freeze({
    exists: true,
    files: Object.freeze(entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort()),
    directories: Object.freeze(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()),
    mtimeMs: statSync(absoluteRoot).mtimeMs,
  })
}
