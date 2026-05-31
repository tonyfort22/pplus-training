import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const settingsViewPath = resolve(repoRoot, 'apps/web/components/admin/settings-view.jsx')

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`)
  assert.notEqual(start, -1, `expected ${name} function to exist`)
  const nextFunction = source.indexOf('\nfunction ', start + 1)
  const exportDefault = source.indexOf('\nexport default function ', start + 1)
  const candidates = [nextFunction, exportDefault].filter((index) => index !== -1)
  const end = candidates.length ? Math.min(...candidates) : source.length
  return source.slice(start, end)
}

test('admin settings account renders a functional light-mode account update state', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const accountSource = extractFunction(settingsSource, 'AdminSettingsAccountView')

  assert.match(settingsSource, /const ADMIN_ACCOUNT_SEED = \{\s*email: '',\s*currentPassword: '',\s*password: '',\s*confirmPassword: '',/)
  assert.match(accountSource, /htmlFor="admin-account-email" label="Email"/)
  assert.match(accountSource, /value=\{accountDraft\.email\}/)
  assert.match(accountSource, /onChange=\{\(event\) => handleAccountDraftChange\('email', event\.target\.value\)\}/)
  assert.match(accountSource, /htmlFor="admin-account-current-password" label="Current password"/)
  assert.match(accountSource, /htmlFor="admin-account-new-password" label="New password"/)
  assert.match(accountSource, /htmlFor="admin-account-confirm-password" label="Confirm password"/)
  assert.match(accountSource, /type="password"/)
  assert.match(accountSource, /fetch\('\/admin\/api\/settings\/account', \{ cache: 'no-store' \}\)/)
  assert.match(accountSource, /fetch\('\/admin\/api\/settings\/account', \{[\s\S]*method: 'PATCH'/)
  assert.match(accountSource, /body: JSON\.stringify\(\{[\s\S]*email: accountDraft\.email,[\s\S]*currentPassword: accountDraft\.currentPassword,[\s\S]*password: accountDraft\.password,[\s\S]*confirmPassword: accountDraft\.confirmPassword/)
  assert.match(accountSource, /Account updated\./)
  assert.match(accountSource, /Save changes/)

  assert.doesNotMatch(accountSource, /readOnly|Account actions unavailable|current authenticated account update API is connected/)
  assert.doesNotMatch(accountSource, /Delete account|Deactivate account|Billing|Security|Two-factor|Reset password|Change password/)
})

test('admin settings account uses light-mode admin tokens instead of dark-coded field colors', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const accountSource = extractFunction(settingsSource, 'AdminSettingsAccountView')

  assert.match(settingsSource, /settingsFieldInputClassName = 'h-11 rounded-\[12px\] border-\[var\(--admin-shell-control-border\)\] bg-\[var\(--admin-shell-control-bg\)\]/)
  assert.match(settingsSource, /function SettingsField/)
  assert.match(accountSource, /text-\[var\(--admin-shell-text\)\]/)
  assert.match(accountSource, /className=\{settingsFieldInputClassName\}/)
  assert.match(accountSource, /border border-\[#3BE0AF\]\/30 bg-\[#3BE0AF\]\/10/)
  assert.match(accountSource, /bg-\[#3BE0AF\] text-\[#0B1120\]/)
  assert.doesNotMatch(accountSource, /border-\[#24334A\]|bg-\[#111D30\]|bg-\[#0F1728\]|bg-\[#0D1625\]|text-\[#DCE6F8\]|text-\[#EEF4FF\]|text-\[#8EA0BC\]|placeholder:text-\[#70809E\]/)
})
