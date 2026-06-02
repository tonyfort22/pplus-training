import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { normalizeAdminNextPath } from '../apps/web/lib/admin-next-path.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const loginPagePath = resolve(repoRoot, 'apps/web/app/admin/login/page.jsx')
const loginFormPath = resolve(repoRoot, 'apps/web/components/admin/admin-login-form.jsx')

test('normalizeAdminNextPath only accepts internal admin paths', () => {
  assert.equal(normalizeAdminNextPath('/admin/settings/account?athleteId=123'), '/admin/settings/account?athleteId=123')
  assert.equal(normalizeAdminNextPath('/admin'), '/admin')
  assert.equal(normalizeAdminNextPath('https://evil.test/admin'), '/admin')
  assert.equal(normalizeAdminNextPath('//evil.test/admin'), '/admin')
  assert.equal(normalizeAdminNextPath('/support'), '/admin')
  assert.equal(normalizeAdminNextPath(''), '/admin')
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
