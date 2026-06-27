import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const forgotPagePath = resolve(repoRoot, 'apps/web/app/admin/forgot-password/page.jsx')
const forgotFormPath = resolve(repoRoot, 'apps/web/components/admin/admin-forgot-password-form.jsx')
const copyPath = resolve(repoRoot, 'apps/web/lib/i18n/public-page-copy.js')

test('admin forgot-password page renders the auth shell and posts to the forgot-password API', () => {
  assert.ok(existsSync(forgotPagePath), 'expected /admin/forgot-password page')
  assert.ok(existsSync(forgotFormPath), 'expected AdminForgotPasswordForm component')

  const pageSource = readFileSync(forgotPagePath, 'utf8')
  const formSource = readFileSync(forgotFormPath, 'utf8')
  const copySource = readFileSync(copyPath, 'utf8')

  assert.match(copySource, /forgot:\s*\{[\s\S]*title:[\s\S]*description:[\s\S]*email:[\s\S]*submit:[\s\S]*submitting:[\s\S]*success:[\s\S]*backToLogin:/)
  assert.match(copySource, /If an account exists for that email, a reset link has been sent\./)
  assert.match(copySource, /Retour à la connexion/)

  assert.match(pageSource, /normalizePublicLanguage\(resolvedSearchParams\?\.lang\)/)
  assert.match(pageSource, /const forgotCopy = copy\.login\.form\.forgot/)
  assert.match(pageSource, /className="admin-login-pattern"/)
  assert.match(pageSource, /className="admin-auth-frame"/)
  assert.match(pageSource, /<AdminForgotPasswordForm forgotCopy=\{forgotCopy\} language=\{language\}/)

  assert.match(formSource, /^'use client'/)
  assert.match(formSource, /fetch\('\/api\/admin\/auth\/forgot-password'/)
  assert.match(formSource, /method:\s*'POST'/)
  assert.match(formSource, /JSON\.stringify\(\{ email \}\)/)
  assert.match(formSource, /required/)
  assert.match(formSource, /type="email"/)
  assert.match(formSource, /role="status"/)
  assert.match(formSource, /forgotCopy\.success/)
  assert.match(formSource, /href=\{getLocalizedHref\('\/admin\/login', language\)\}/)
})
