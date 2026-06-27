import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { normalizeAdminNextPath } from '../apps/web/lib/admin-next-path.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const loginPagePath = resolve(repoRoot, 'apps/web/app/admin/login/page.jsx')
const loginFormPath = resolve(repoRoot, 'apps/web/components/admin/admin-login-form.jsx')

test('normalizeAdminNextPath allows internal admin destinations with query strings and hashes', () => {
  const allowedDestinations = new Map([
    ['/admin', '/admin'],
    ['/admin/settings/account?athleteId=123', '/admin/settings/account?athleteId=123'],
    ['/admin/programs/program-123?tab=training&week=2', '/admin/programs/program-123?tab=training&week=2'],
    ['/admin/support#conversation-123', '/admin/support#conversation-123'],
    [' /admin/workouts/calendar?view=week#day-2 ', '/admin/workouts/calendar?view=week#day-2'],
  ])

  for (const [input, expected] of allowedDestinations) {
    assert.equal(normalizeAdminNextPath(input), expected, `expected ${input} to normalize to ${expected}`)
  }
})

test('normalizeAdminNextPath rejects external or non-admin destinations', () => {
  const rejectedDestinations = [
    '',
    null,
    undefined,
    '/support',
    '/faq',
    '/admin.evil/path',
    '/admin/../support',
    '/admin/%2e%2e/support',
    'https://evil.test/admin',
    'http://evil.test/admin',
    '//evil.test/admin',
    'javascript:alert(1)',
    'mailto:test@example.com',
  ]

  for (const input of rejectedDestinations) {
    assert.equal(normalizeAdminNextPath(input), '/admin', `expected ${input} to fall back to /admin`)
  }
})

test('login page passes safe next redirect into AdminLoginForm', () => {
  const pageSource = readFileSync(loginPagePath, 'utf8')
  const formSource = readFileSync(loginFormPath, 'utf8')

  assert.match(pageSource, /const nextPath = normalizeAdminNextPath\(resolvedSearchParams\?\.next\)/)
  assert.match(pageSource, /<AdminLoginForm loginCopy=\{loginCopy\.form\} language=\{language\} nextPath=\{nextPath\}/)
  assert.match(formSource, /normalizeAdminNextPath/)
  assert.match(formSource, /nextPath = '\/admin'/)
  assert.match(formSource, /window\.location\.assign\(normalizeAdminNextPath\(nextPath \|\| payload\.redirectTo\)\)/)
})
