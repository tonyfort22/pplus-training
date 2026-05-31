import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const resetPagePath = resolve(repoRoot, 'apps/web/app/admin/reset-password/page.jsx')
const resetFormPath = resolve(repoRoot, 'apps/web/components/admin/admin-reset-password-form.jsx')
const copyPath = resolve(repoRoot, 'apps/web/lib/i18n/public-page-copy.js')

test('admin reset-password page handles Supabase recovery hash tokens in a client form', () => {
  assert.ok(existsSync(resetPagePath), 'expected /admin/reset-password page')
  assert.ok(existsSync(resetFormPath), 'expected AdminResetPasswordForm component')

  const pageSource = readFileSync(resetPagePath, 'utf8')
  const formSource = readFileSync(resetFormPath, 'utf8')
  const copySource = readFileSync(copyPath, 'utf8')

  assert.match(copySource, /reset:\s*\{[\s\S]*title:[\s\S]*password:[\s\S]*confirmPassword:[\s\S]*submit:[\s\S]*missingToken:[\s\S]*mismatch:[\s\S]*tooShort:/)
  assert.match(copySource, /Create a new password/)
  assert.match(copySource, /Créer un nouveau mot de passe/)

  assert.match(pageSource, /const resetCopy = copy\.login\.form\.reset/)
  assert.match(pageSource, /className="admin-login-pattern"/)
  assert.match(pageSource, /className="admin-auth-frame"/)
  assert.match(pageSource, /<AdminResetPasswordForm resetCopy=\{resetCopy\} language=\{language\}/)

  assert.match(formSource, /^'use client'/)
  assert.match(formSource, /window\.location\.hash\.replace\(\/\^#\//)
  assert.match(formSource, /new URLSearchParams/)
  assert.match(formSource, /hashParams\.get\('access_token'\)/)
  assert.match(formSource, /hashParams\.get\('type'\) !== 'recovery'/)
  assert.match(formSource, /password\.length < 6/)
  assert.match(formSource, /password !== confirmPassword/)
  assert.match(formSource, /fetch\('\/api\/admin\/auth\/reset-password'/)
  assert.match(formSource, /JSON\.stringify\(\{ accessToken, password \}\)/)
  assert.match(formSource, /window\.history\.replaceState\(null, '', window\.location\.pathname \+ window\.location\.search\)/)
  assert.match(formSource, /window\.location\.assign\(payload\.redirectTo \|\| '\/admin\/login\?passwordReset=1'\)/)
  assert.match(formSource, /href=\{getLocalizedHref\('\/admin\/forgot-password', language\)\}/)
})
