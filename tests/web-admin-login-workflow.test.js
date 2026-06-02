import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const loginPagePath = resolve(repoRoot, 'apps/web/app/admin/login/page.jsx')
const loginFormPath = resolve(repoRoot, 'apps/web/components/admin/admin-login-form.jsx')

test('admin login page delegates real login workflow to the client form', () => {
  assert.ok(existsSync(loginPagePath), 'expected /admin/login page')
  assert.ok(existsSync(loginFormPath), 'expected AdminLoginForm component')

  const pageSource = readFileSync(loginPagePath, 'utf8')
  const formSource = readFileSync(loginFormPath, 'utf8')

  assert.match(pageSource, /import AdminLoginForm from '\.\.\/\.\.\/\.\.\/components\/admin\/admin-login-form'/)
  assert.match(pageSource, /const nextPath = normalizeAdminNextPath\(resolvedSearchParams\?\.next\)/)
  assert.match(pageSource, /<AdminLoginForm\s+loginCopy=\{loginCopy\.form\}\s+language=\{language\}\s+nextPath=\{nextPath\}/)
  assert.doesNotMatch(pageSource, /<form className="admin-login-form"/)
  assert.doesNotMatch(pageSource, /href="#" className="admin-login-forgot"/)

  assert.match(formSource, /^'use client'/)
  assert.match(formSource, /fetch\('\/api\/admin\/auth\/login'/)
  assert.match(formSource, /method:\s*'POST'/)
  assert.match(formSource, /JSON\.stringify\(\{ email, password \}\)/)
  assert.match(formSource, /window\.location\.assign\(normalizeAdminNextPath\(nextPath \|\| payload\.redirectTo\)\)/)
  assert.match(formSource, /type=\{showPassword \? 'text' : 'password'\}/)
  assert.match(formSource, /setShowPassword\(\(current\) => !current\)/)
  assert.match(formSource, /disabled=\{submitting\}/)
  assert.match(formSource, /\{submitting \? loginCopy\.submitting : loginCopy\.submit\}/)
  assert.match(formSource, /role="alert"/)
  assert.match(formSource, /href=\{getLocalizedHref\('\/admin\/forgot-password', language\)\}/)
})
