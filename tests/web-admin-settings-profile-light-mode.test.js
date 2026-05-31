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

test('admin settings profile only exposes approved coach profile fields and honest read-only state', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const profileSource = extractFunction(settingsSource, 'AdminSettingsProfileView')
  const uploaderSource = extractFunction(settingsSource, 'ProfilePhotoUploader')

  assert.match(settingsSource, /name:\s*''/)
  assert.match(settingsSource, /phone:\s*''/)
  assert.doesNotMatch(settingsSource, /firstName|lastName|setProfileDraft|handleSaveProfile|setNotice\('Profile updated\.'\)/)
  assert.doesNotMatch(settingsSource, /organizationName|bio|themePreference|unitsPreference|weightUnitPreference|distanceUnitPreference/)

  assert.match(profileSource, /htmlFor="admin-profile-name" label="Name"/)
  assert.match(profileSource, /htmlFor="admin-profile-phone" label="Phone"/)
  assert.match(profileSource, /type="tel"/)
  assert.match(uploaderSource, /Coach avatar/)
  assert.match(profileSource, /Profile editing is unavailable[\s\S]*read-only to avoid fake saves\./)
  assert.match(profileSource, /Save changes unavailable/)
  assert.doesNotMatch(profileSource, /onSubmit|type="submit"|onChange=|type="file"|Upload avatar|PNG, JPG/)
})

test('admin settings profile uses light-mode admin tokens instead of dark-coded field colors', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const profileSource = extractFunction(settingsSource, 'AdminSettingsProfileView')
  const uploaderSource = extractFunction(settingsSource, 'ProfilePhotoUploader')

  assert.match(settingsSource, /settingsProfileFieldInputClassName = 'h-11 rounded-\[12px\] border-\[var\(--admin-shell-control-border\)\] bg-\[var\(--admin-shell-control-bg\)\]/)
  assert.match(settingsSource, /function SettingsProfileField/)
  assert.match(settingsSource, /text-\[var\(--admin-shell-text\)\]/)
  assert.match(uploaderSource, /bg-\[var\(--admin-shell-avatar-bg\)\]/)
  assert.match(profileSource, /text-\[var\(--admin-shell-text\)\]/)
  assert.doesNotMatch(profileSource, /border-\[#24334A\]|bg-\[#111D30\]|bg-\[#0F1728\]|bg-\[#0D1625\]|text-\[#DCE6F8\]|text-\[#EEF4FF\]|text-\[#8EA0BC\]|placeholder:text-\[#70809E\]/)
})

test('admin settings profile and account layouts fill the content width without parent card shells', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const profileSource = extractFunction(settingsSource, 'AdminSettingsProfileView')
  const accountSource = extractFunction(settingsSource, 'AdminSettingsAccountView')
  const uploaderSource = extractFunction(settingsSource, 'ProfilePhotoUploader')

  assert.match(profileSource, /<form className="grid w-full gap-6"/)
  assert.match(accountSource, /<form className="grid w-full gap-6"/)
  assert.doesNotMatch(profileSource, /max-w-3xl/)
  assert.doesNotMatch(accountSource, /max-w-3xl/)

  assert.match(profileSource, /<div className="grid w-full gap-4 md:grid-cols-2">/)
  assert.match(profileSource, /id="admin-profile-disabled-notice" className="flex w-full items-start/)
  assert.match(accountSource, /<div className="grid w-full gap-4">[\s\S]*htmlFor="admin-account-email" label="Email"/)
  assert.match(accountSource, /id="admin-account-disabled-notice" className="flex w-full items-start/)

  assert.doesNotMatch(uploaderSource, /<div className="relative[^"]*rounded-\[20px\]|<div className="relative[^"]*border border-dashed|<div className="relative[^"]*bg-\[var\(--admin-shell-surface\)\]/)
})

test('admin settings account keeps password fields visible as disabled honest placeholders', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const accountSource = extractFunction(settingsSource, 'AdminSettingsAccountView')

  assert.match(accountSource, /htmlFor="admin-account-current-password" label="Current password"/)
  assert.match(accountSource, /id="admin-account-current-password"[\s\S]*type="password"[\s\S]*placeholder="Current password"[\s\S]*disabled/)
  assert.match(accountSource, /htmlFor="admin-account-confirm-password" label="Confirm password"/)
  assert.match(accountSource, /id="admin-account-confirm-password"[\s\S]*type="password"[\s\S]*placeholder="Confirm password"[\s\S]*disabled/)
})
