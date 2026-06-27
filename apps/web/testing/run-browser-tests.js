#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

import {
  extractBrowserFailuresFromPlaywrightJson,
  formatBrowserFailureContextSummary,
} from './browser-failure-context.js'

const passthroughArgs = process.argv.slice(2)
const isListOnly = passthroughArgs.includes('--list')
const hasReporter = passthroughArgs.some((arg) => arg === '--reporter' || arg.startsWith('--reporter='))
const playwrightArgs = [
  '--dir',
  'apps/web',
  'exec',
  'playwright',
  'test',
  '--config',
  'playwright.config.js',
  ...passthroughArgs,
]

if (!isListOnly && !hasReporter) {
  playwrightArgs.push('--reporter=json')
}

const result = spawnSync('pnpm', playwrightArgs, {
  cwd: process.cwd(),
  encoding: 'utf8',
  env: process.env,
})

const stdout = result.stdout ?? ''
const stderr = result.stderr ?? ''
const status = result.status ?? 1

if (stdout) process.stdout.write(stdout)
if (stderr) process.stderr.write(stderr)

if (status !== 0 && !isListOnly && !hasReporter) {
  try {
    const jsonStart = stdout.indexOf('{')
    const report = JSON.parse(jsonStart >= 0 ? stdout.slice(jsonStart) : stdout)
    const failures = extractBrowserFailuresFromPlaywrightJson(report)
    const summary = formatBrowserFailureContextSummary(failures)
    if (summary) process.stderr.write(summary)
  } catch (error) {
    process.stderr.write(`\n## Browser failure context\n- unable to parse Playwright JSON report: ${error.message}\n`)
  }
}

process.exitCode = status
