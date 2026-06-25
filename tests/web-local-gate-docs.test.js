import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import {
  extractSourceFailuresFromNodeTestOutput,
  formatSourceFailureContextSummary,
  resolveSourceFailureContext,
} from '../apps/web/testing/source-failure-context.js'

const repoRoot = process.cwd()
const docsPath = join(repoRoot, 'docs/web-local-gate.md')
const readmePath = join(repoRoot, 'README.md')

test('full web gate local docs describe the same gates CI runs', () => {
  assert.equal(existsSync(docsPath), true, 'missing docs/web-local-gate.md')

  const docsSource = readFileSync(docsPath, 'utf8')

  assert.match(docsSource, /^# Running the full web gate locally/m)
  assert.match(docsSource, /pnpm install --frozen-lockfile/)
  assert.match(docsSource, /pnpm test:web/)
  assert.match(docsSource, /pnpm --dir apps\/web build/)
  assert.match(docsSource, /pnpm test:web:browser:fixtures:setup/)
  assert.match(docsSource, /pnpm test:web:browser/)
  assert.match(docsSource, /pnpm test:web:browser:fixtures:teardown/)
  assert.match(docsSource, /apps\/web\/test-results/)
  assert.match(docsSource, /MODULE_TYPELESS_PACKAGE_JSON/)
  assert.match(docsSource, /\.env\.local/)
  assert.match(docsSource, /GitHub Actions/)
  assert.match(docsSource, /web-source-api-tests/)
  assert.match(docsSource, /web-build/)
  assert.match(docsSource, /web-browser-smoke/)
})

test('README links the local full web gate docs', () => {
  const readmeSource = readFileSync(readmePath, 'utf8')

  assert.match(readmeSource, /docs\/web-local-gate\.md/)
  assert.match(readmeSource, /full web gate/i)
})

test('source/API web gate failure context resolves failing files to route and layer for CI logs', () => {
  const context = resolveSourceFailureContext({ file: 'tests/web-admin-settings-profile-light-mode.test.js' })

  assert.equal(context.file, 'tests/web-admin-settings-profile-light-mode.test.js')
  assert.equal(context.route, '/admin/settings')
  assert.equal(context.layer, 'L1_SOURCE_CONTRACTS')
  assert.equal(context.group, 'Support and settings tests')
})

test('source/API web gate failure summary prints failing test, file, route, layer, and group', () => {
  const output = `
✖ failing tests:

test at tests/web-admin-settings-profile-light-mode.test.js:94:1
✖ admin settings profile uses light-mode admin tokens instead of dark-coded field colors (0.61325ms)
`
  const failures = extractSourceFailuresFromNodeTestOutput(output)
  const summary = formatSourceFailureContextSummary(failures)

  assert.equal(failures.length, 1)
  assert.match(summary, /Web source\/API failure context/)
  assert.match(summary, /test: admin settings profile uses light-mode admin tokens instead of dark-coded field colors/)
  assert.match(summary, /file: tests\/web-admin-settings-profile-light-mode\.test\.js/)
  assert.match(summary, /route: \/admin\/settings/)
  assert.match(summary, /layer: L1_SOURCE_CONTRACTS/)
  assert.match(summary, /group: Support and settings tests/)
})

test('full web gate runner prints source/API failure context when node --test fails', () => {
  const runnerSource = readFileSync(join(repoRoot, 'apps/web/testing/run-web-tests.js'), 'utf8')

  assert.match(runnerSource, /formatSourceFailureContextSummary/)
  assert.match(runnerSource, /extractSourceFailuresFromNodeTestOutput/)
  assert.match(runnerSource, /source-failure-context\.js/)
  assert.match(runnerSource, /maxBuffer:\s*32 \* 1024 \* 1024/)
})
