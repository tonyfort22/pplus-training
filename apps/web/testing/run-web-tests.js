#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

import { getWebTestCommandGroups } from './page-test-manifest.js'
import {
  extractSourceFailuresFromNodeTestOutput,
  formatSourceFailureContextSummary,
} from './source-failure-context.js'

const commandGroup = getWebTestCommandGroups().FULL_WEB_SOURCE_API_TESTS

console.log(`Running ${commandGroup.label}`)
console.log(commandGroup.command)
console.log(`Expected: ${commandGroup.expectedOutput.tests} tests, ${commandGroup.expectedOutput.pass} pass, ${commandGroup.expectedOutput.fail} fail across ${commandGroup.expectedOutput.testFiles} files`)

const result = spawnSync('node', ['--test', ...commandGroup.testFiles], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
})

const stdout = result.stdout ?? ''
const stderr = result.stderr ?? ''
const status = result.status ?? 1

if (stdout) process.stdout.write(stdout)
if (stderr) process.stderr.write(stderr)

if (status !== 0) {
  const failures = extractSourceFailuresFromNodeTestOutput(`${stdout}\n${stderr}`)
  const summary = formatSourceFailureContextSummary(failures)
  if (summary) process.stderr.write(summary)
}

process.exit(status)
