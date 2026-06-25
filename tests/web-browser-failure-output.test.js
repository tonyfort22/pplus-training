import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import {
  formatBrowserFailureContextSummary,
  resolveBrowserFailureContext,
} from '../apps/web/testing/browser-failure-context.js'

const repoRoot = process.cwd()
const runnerPath = 'apps/web/testing/run-browser-tests.js'
const rootPackageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const ciWorkflowSource = readFileSync('.github/workflows/ci.yml', 'utf8')

test('browser failure context resolves failing Settings workflow to its route and layer', () => {
  const context = resolveBrowserFailureContext({
    file: 'apps/web/e2e/admin-settings-workflows.spec.js',
    title: 'Admin Settings workflows › Account save renders success toast',
  })

  assert.deepEqual(context, {
    file: 'apps/web/e2e/admin-settings-workflows.spec.js',
    route: '/admin/settings',
    layer: 'L6_SAFE_WORKFLOW',
    candidates: [
      {
        id: 'admin-settings-profile-update-saves-visible-name-avatar',
        route: '/admin/settings',
        layer: 'L6_SAFE_WORKFLOW',
      },
      {
        id: 'admin-settings-account-validation-errors-visible',
        route: '/admin/settings/account',
        layer: 'L6_SAFE_WORKFLOW',
      },
      {
        id: 'admin-settings-account-save-renders-toast',
        route: '/admin/settings/account',
        layer: 'L6_SAFE_WORKFLOW',
      },
    ],
  })
})

test('browser failure context resolves route-smoke title to the exact route and L4 layer', () => {
  const context = resolveBrowserFailureContext({
    file: 'apps/web/e2e/public-routes-smoke.spec.js',
    title: 'PPLUS public route smoke › /support renders publicly with CSS',
  })

  assert.equal(context.route, '/support')
  assert.equal(context.layer, 'L4_BROWSER_SMOKE')
})

test('browser failure context resolves bare route-smoke reporter file to the exact route and L4 layer', () => {
  const context = resolveBrowserFailureContext({
    file: 'public-routes-smoke.spec.js',
    title: 'PPLUS public route smoke › /support renders publicly with CSS',
  })

  assert.equal(context.file, 'apps/web/e2e/public-routes-smoke.spec.js')
  assert.equal(context.route, '/support')
  assert.equal(context.layer, 'L4_BROWSER_SMOKE')
})

test('browser failure context summary prints test, route, layer, and artifact path for CI logs', () => {
  const summary = formatBrowserFailureContextSummary([
    {
      file: 'apps/web/e2e/public-routes-smoke.spec.js',
      title: 'PPLUS public route smoke › /support renders publicly with CSS',
      error: 'Expected status 200, received 500',
      artifactDir: 'apps/web/test-results/public-routes-smoke-support-chromium',
    },
  ])

  assert.match(summary, /Browser failure context/)
  assert.match(summary, /test: PPLUS public route smoke › \/support renders publicly with CSS/)
  assert.match(summary, /route: \/support/)
  assert.match(summary, /layer: L4_BROWSER_SMOKE/)
  assert.match(summary, /artifacts: apps\/web\/test-results\/public-routes-smoke-support-chromium/)
})

test('root browser command and CI use the route/layer failure-output wrapper', () => {
  assert.equal(existsSync(runnerPath), true, `browser test runner missing: ${runnerPath}`)
  assert.equal(rootPackageJson.scripts['test:web:browser'], `node ${runnerPath} --list`)
  assert.match(ciWorkflowSource, /Run browser smoke harness[\s\S]*run:\s*pnpm test:web:browser/)

  const runnerSource = readFileSync(runnerPath, 'utf8')
  assert.match(runnerSource, /formatBrowserFailureContextSummary/)
  assert.match(runnerSource, /--reporter=json/)
  assert.match(runnerSource, /process\.exitCode\s*=\s*status/)
})
