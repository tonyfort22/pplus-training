#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  assertNoUnsafeLiveMobileTestRecords,
} from './mobile-simulator-smoke-setup.js'
import {
  assertMobileTestArtifactsCleanedOrListed,
  formatMobileTestArtifactInventory,
} from './mobile-test-artifact-inventory.js'
import {
  FULL_MOBILE_SOURCE_TESTS,
  MOBILE_RUNNABLE_TEST_GROUPS,
} from './mobile-surface-manifest.js'

export const MOBILE_TEST_RUNNER_DEFAULT_GROUP_ID = 'FULL_MOBILE_SOURCE_TESTS'
export const MOBILE_TEST_RUNNER_RECORDED_OUTPUT_PATH = 'apps/mobile/testing/pnpm-test-mobile-output.txt'
export const MOBILE_TEST_RUNNER_METRO_PORT = 8084
export const MOBILE_TEST_RUNNER_RUNTIME_PROCESS_PATTERNS = Object.freeze([
  /expo\s+start/i,
  /@expo\/cli/i,
  /metro/i,
  /react-native/i,
])
export const MOBILE_TEST_RUNNER_IGNORED_RUNTIME_PROCESS_PATTERNS = Object.freeze([
  /Expo Go/i,
  /host\.exp\.Exponent/i,
  /Adobe Creative Cloud/i,
  /flushFetchDetached\.js/i,
])

export const MOBILE_TEST_RUNNER_EXPECTED_OUTPUT = Object.freeze({
  tests: 691,
  pass: 691,
  fail: 0,
  testFiles: FULL_MOBILE_SOURCE_TESTS.testFiles.length,
})

export function buildNodeTestArgs(testFiles = FULL_MOBILE_SOURCE_TESTS.testFiles) {
  return Object.freeze(['--test', ...testFiles])
}

export function validateMobileSourceTestFiles(
  testFiles = FULL_MOBILE_SOURCE_TESTS.testFiles,
  { cwd = process.cwd(), exists = existsSync } = {},
) {
  const missingTestFiles = testFiles.filter((testFile) => !exists(resolve(cwd, testFile)))

  if (missingTestFiles.length > 0) {
    throw new Error(`Missing mobile source test files:\n${missingTestFiles.map((testFile) => `- ${testFile}`).join('\n')}`)
  }

  return Object.freeze([])
}

export function buildMobileSourceTestRunPlan(groupId = MOBILE_TEST_RUNNER_DEFAULT_GROUP_ID) {
  const group = MOBILE_RUNNABLE_TEST_GROUPS[groupId]

  if (!group) {
    throw new Error(`Unknown mobile source test group: ${groupId}`)
  }

  const testFiles = group.testFiles

  return Object.freeze({
    groupId: group.id,
    label: group.label,
    layer: group.layer,
    command: `node --test ${testFiles.join(' ')}`,
    testFiles,
    expectedOutput: MOBILE_TEST_RUNNER_EXPECTED_OUTPUT,
  })
}

export function getMobileSourceTestRunnerSummary() {
  const plan = buildMobileSourceTestRunPlan()

  return [
    'Running Full mobile source model test suite',
    `Manifest group: ${plan.label}`,
    `Layer: ${plan.layer}`,
    `Files: ${plan.testFiles.length}`,
    `Expected: ${plan.expectedOutput.tests} tests, ${plan.expectedOutput.pass} pass, ${plan.expectedOutput.fail} fail across ${plan.expectedOutput.testFiles} files`,
    `Command: ${plan.command}`,
    `Cleanup: asserts no Expo/Metro listener remains on port ${MOBILE_TEST_RUNNER_METRO_PORT}`,
    'Cleanup: asserts no unsafe live mobile test records are left behind',
    'Artifacts: asserts test artifacts are cleaned or listed as retained proof',
  ].join('\n')
}

export function parseMobileSourceTestRunTotals(output) {
  const readTotal = (label) => {
    const match = output.match(new RegExp(`(?:ℹ|#) ${label} (\\d+)`))
    return match ? Number.parseInt(match[1], 10) : null
  }

  return Object.freeze({
    tests: readTotal('tests'),
    pass: readTotal('pass'),
    fail: readTotal('fail'),
  })
}

export function getMobileSourceTestFinalReport({
  plan = buildMobileSourceTestRunPlan(),
  result,
  cleanupLines = [],
} = {}) {
  const realTotals = parseMobileSourceTestRunTotals(`${result?.stdout ?? ''}\n${result?.stderr ?? ''}`)
  const status = result?.status ?? 1
  const passFailLine = realTotals.tests === null || realTotals.pass === null || realTotals.fail === null
    ? 'Real totals: unavailable from child test output'
    : `Real totals: ${realTotals.tests} tests, ${realTotals.pass} pass, ${realTotals.fail} fail`

  return [
    'Final report:',
    'Commands run:',
    '- pnpm test:mobile',
    '- node apps/mobile/testing/run-mobile-tests.js',
    `- ${plan.command}`,
    passFailLine,
    `Exit status: ${status}`,
    ...cleanupLines,
  ].join('\n')
}

function runCommand(spawn, command, args) {
  const result = spawn(command, args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })

  return Object.freeze({
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  })
}

export function isLingeringMobileRuntimeProcessLine(line) {
  if (!line.trim()) return false
  if (MOBILE_TEST_RUNNER_IGNORED_RUNTIME_PROCESS_PATTERNS.some((pattern) => pattern.test(line))) {
    return false
  }

  return MOBILE_TEST_RUNNER_RUNTIME_PROCESS_PATTERNS.some((pattern) => pattern.test(line))
}

export function getLingeringMobileRuntimeProcesses({
  spawn = spawnSync,
  metroPort = MOBILE_TEST_RUNNER_METRO_PORT,
} = {}) {
  const portProbe = runCommand(spawn, 'lsof', ['-nP', `-iTCP:${metroPort}`, '-sTCP:LISTEN'])
  const processProbe = runCommand(spawn, 'ps', ['aux'])
  const portListeners = portProbe.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const processLines = processProbe.stdout
    .split('\n')
    .filter(isLingeringMobileRuntimeProcessLine)

  return Object.freeze({
    metroPort,
    portListeners: Object.freeze(portListeners),
    processLines: Object.freeze(processLines),
  })
}

export function assertNoLingeringMobileRuntimeProcesses(options = {}) {
  const result = getLingeringMobileRuntimeProcesses(options)
  const hasLingeringRuntime = result.portListeners.length > 0 || result.processLines.length > 0

  if (hasLingeringRuntime) {
    throw new Error([
      `Lingering Expo/Metro runtime detected after mobile test run on port ${result.metroPort}.`,
      ...result.portListeners.map((line) => `port: ${line}`),
      ...result.processLines.map((line) => `process: ${line}`),
    ].join('\n'))
  }

  return result
}

export function writeMobileSourceTestRunnerOutput(output, outputPath = MOBILE_TEST_RUNNER_RECORDED_OUTPUT_PATH) {
  writeFileSync(resolve(process.cwd(), outputPath), output)
}

export function runMobileSourceTests({
  spawn = spawnSync,
  testFiles,
  log = console.log,
  writeStdout = (output) => process.stdout.write(output),
  writeStderr = (output) => process.stderr.write(output),
  recordOutput = writeMobileSourceTestRunnerOutput,
  assertNoLingeringRuntime = assertNoLingeringMobileRuntimeProcesses,
  assertNoUnsafeLiveRecords = assertNoUnsafeLiveMobileTestRecords,
  assertArtifactsCleanedOrListed = assertMobileTestArtifactsCleanedOrListed,
} = {}) {
  const plan = buildMobileSourceTestRunPlan()
  const resolvedTestFiles = testFiles ?? plan.testFiles
  const summary = getMobileSourceTestRunnerSummary()

  log(summary)

  try {
    validateMobileSourceTestFiles(resolvedTestFiles)
  } catch (error) {
    writeStderr(`${error.message}\n`)
    return 1
  }

  const args = buildNodeTestArgs(resolvedTestFiles)

  const result = spawn(process.execPath, args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  const cleanupLines = []
  let cleanupStatus = 0

  try {
    assertNoLingeringRuntime()
    cleanupLines.push(`Cleanup: no Expo/Metro listener remains on port ${MOBILE_TEST_RUNNER_METRO_PORT}`)
  } catch (error) {
    cleanupStatus = 1
    cleanupLines.push(error.message)
  }

  try {
    assertNoUnsafeLiveRecords()
    cleanupLines.push('Cleanup: no unsafe live mobile test records left behind')
  } catch (error) {
    cleanupStatus = 1
    cleanupLines.push(error.message)
  }

  try {
    const artifactInventory = assertArtifactsCleanedOrListed()
    cleanupLines.push(formatMobileTestArtifactInventory(artifactInventory))
  } catch (error) {
    cleanupStatus = 1
    cleanupLines.push(error.message)
  }

  const finalReport = getMobileSourceTestFinalReport({
    plan,
    result,
    cleanupLines,
  })

  const output = [
    '> pnpm test:mobile',
    '> node apps/mobile/testing/run-mobile-tests.js',
    '',
    summary,
    result.stdout ?? '',
    result.stderr ?? '',
    finalReport,
  ].join('\n')

  if (result.stdout) writeStdout(result.stdout)
  if (result.stderr) writeStderr(result.stderr)
  writeStdout(`${finalReport}\n`)
  recordOutput(output)

  return cleanupStatus === 0 ? (result.status ?? 1) : 1
}

const isCliEntrypoint = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (isCliEntrypoint) {
  process.exit(runMobileSourceTests())
}
