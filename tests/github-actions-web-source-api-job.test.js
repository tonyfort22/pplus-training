import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const ciWorkflowSource = readFileSync('.github/workflows/ci.yml', 'utf8')
const rootPackageSource = readFileSync('package.json', 'utf8')

test('CI has a dedicated source/API web test job that runs the generated full web source/API command', () => {
  assert.match(ciWorkflowSource, /web-source-api-tests:/)
  assert.match(ciWorkflowSource, /name:\s*source\/API web tests/)
  assert.match(ciWorkflowSource, /runs-on:\s*ubuntu-latest/)
  assert.match(ciWorkflowSource, /actions\/checkout@v6/)
  assert.match(ciWorkflowSource, /pnpm\/action-setup@v4/)
  assert.match(ciWorkflowSource, /actions\/setup-node@v4[\s\S]*node-version:\s*22[\s\S]*cache:\s*pnpm/)
  assert.match(ciWorkflowSource, /pnpm install --frozen-lockfile/)
  assert.match(ciWorkflowSource, /run:\s*pnpm test:web/)
})

test('root test:web script delegates to the manifest-driven web source/API runner', () => {
  const rootPackage = JSON.parse(rootPackageSource)

  assert.equal(rootPackage.scripts['test:web'], 'node apps/web/testing/run-web-tests.js')
})

test('CI has a dedicated web build job that runs the real Next.js web build', () => {
  assert.match(ciWorkflowSource, /web-build:/)
  assert.match(ciWorkflowSource, /name:\s*web build/)
  assert.match(ciWorkflowSource, /runs-on:\s*ubuntu-latest/)
  assert.match(ciWorkflowSource, /web-build:[\s\S]*actions\/checkout@v6/)
  assert.match(ciWorkflowSource, /web-build:[\s\S]*pnpm\/action-setup@v4/)
  assert.match(ciWorkflowSource, /web-build:[\s\S]*actions\/setup-node@v4[\s\S]*node-version:\s*22[\s\S]*cache:\s*pnpm/)
  assert.match(ciWorkflowSource, /web-build:[\s\S]*pnpm install --frozen-lockfile/)
  assert.match(ciWorkflowSource, /web-build:[\s\S]*run:\s*pnpm --dir apps\/web build/)
})

test('CI has a dedicated browser smoke job that sets up, runs, and tears down browser workflow fixtures', () => {
  assert.match(ciWorkflowSource, /web-browser-smoke:/)
  assert.match(ciWorkflowSource, /name:\s*browser smoke/)
  assert.match(ciWorkflowSource, /runs-on:\s*ubuntu-latest/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*actions\/checkout@v6/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*pnpm\/action-setup@v4/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*actions\/setup-node@v4[\s\S]*node-version:\s*22[\s\S]*cache:\s*pnpm/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*pnpm install --frozen-lockfile/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*name:\s*Set up browser workflow fixtures[\s\S]*run:\s*pnpm test:web:browser:fixtures:setup/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*name:\s*Run browser smoke harness[\s\S]*run:\s*pnpm test:web:browser/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*name:\s*Tear down browser workflow fixtures[\s\S]*if:\s*always\(\)[\s\S]*run:\s*pnpm test:web:browser:fixtures:teardown/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*name:\s*Upload browser failure artifacts/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*if:\s*failure\(\)/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*uses:\s*actions\/upload-artifact@v4/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*name:\s*pplus-web-browser-test-results/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*path:\s*apps\/web\/test-results/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*if-no-files-found:\s*ignore/)
  assert.match(ciWorkflowSource, /web-browser-smoke:[\s\S]*retention-days:\s*7/)
})

test('root browser workflow scripts expose fixture setup, smoke, and teardown commands', () => {
  const rootPackage = JSON.parse(rootPackageSource)

  assert.equal(rootPackage.scripts['test:web:browser'], 'node apps/web/testing/run-browser-tests.js --list')
  assert.equal(rootPackage.scripts['test:web:browser:fixtures:setup'], 'node apps/web/testing/browser-workflow-fixtures.js setup')
  assert.equal(rootPackage.scripts['test:web:browser:fixtures:teardown'], 'node apps/web/testing/browser-workflow-fixtures.js teardown')
})

test('PR CI does not require local-only secrets for web gates', () => {
  assert.match(ciWorkflowSource, /on:\n\s*pull_request:/)
  assert.doesNotMatch(ciWorkflowSource, /\$\{\{\s*secrets\./)
  assert.doesNotMatch(ciWorkflowSource, /SUPABASE_SERVICE_ROLE_KEY:\s*\$\{\{/)
  assert.doesNotMatch(ciWorkflowSource, /PPLUS_WEB_ADMIN_EMAIL:\s*\$\{\{/)
  assert.doesNotMatch(ciWorkflowSource, /PPLUS_WEB_ADMIN_PASSWORD:\s*\$\{\{/)
  assert.match(ciWorkflowSource, /Set up browser workflow fixtures[\s\S]*run:\s*pnpm test:web:browser:fixtures:setup/)
  assert.match(ciWorkflowSource, /Run browser smoke harness[\s\S]*run:\s*pnpm test:web:browser/)
})
