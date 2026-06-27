import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const settingsViewPath = resolve(repoRoot, 'apps/web/components/admin/settings-view.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`)
  assert.notEqual(start, -1, `expected ${name} function to exist`)
  const nextFunction = source.indexOf('\nfunction ', start + 1)
  const exportDefault = source.indexOf('\nexport default function ', start + 1)
  const candidates = [nextFunction, exportDefault].filter((index) => index !== -1)
  const end = candidates.length ? Math.min(...candidates) : source.length
  return source.slice(start, end)
}

test('admin settings profile exposes editable approved coach profile fields with real save state', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const profileSource = extractFunction(settingsSource, 'AdminSettingsProfileView')
  const uploaderSource = extractFunction(settingsSource, 'ProfilePhotoUploader')

  assert.match(settingsSource, /useEffect/)
  assert.match(settingsSource, /useState/)
  assert.match(settingsSource, /fetch\('\/admin\/api\/settings\/profile'/)
  assert.match(settingsSource, /setProfileDraft/)
  assert.match(settingsSource, /handleSaveProfile/)
  assert.match(settingsSource, /Profile updated\./)
  assert.doesNotMatch(settingsSource, /organizationName|bio|themePreference|unitsPreference|weightUnitPreference|distanceUnitPreference/)

  assert.match(profileSource, /htmlFor="admin-profile-first-name" label="First name"/)
  assert.match(profileSource, /htmlFor="admin-profile-last-name" label="Last name"/)
  assert.match(profileSource, /htmlFor="admin-profile-phone" label="Phone number" className="md:col-span-2"/)
  assert.match(profileSource, /type="tel"/)
  assert.match(uploaderSource, /Change avatar/)
  assert.match(uploaderSource, /type="file"/)
  assert.match(profileSource, /onSubmit=\{handleSaveProfile\}/)
  assert.match(profileSource, /onChange=\{\(event\) => handleDraftChange\('firstName', event\.target\.value\)\}/)
  assert.match(profileSource, /onChange=\{\(event\) => handleDraftChange\('lastName', event\.target\.value\)\}/)
  assert.match(profileSource, /onChange=\{\(event\) => handleDraftChange\('phone', event\.target\.value\)\}/)
  assert.match(profileSource, /firstName: profileDraft\.firstName/)
  assert.match(profileSource, /lastName: profileDraft\.lastName/)
  assert.match(profileSource, /phone: profileDraft\.phone/)
  assert.match(profileSource, /type="submit"/)
  assert.match(profileSource, /Save changes/)
  assert.doesNotMatch(profileSource, /Profile editing is unavailable|Save changes unavailable|readOnly|disabled\s*\n/)
})

test('admin settings profile uses light-mode admin tokens instead of dark-coded field colors', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')
  const profileSource = extractFunction(settingsSource, 'AdminSettingsProfileView')
  const uploaderSource = extractFunction(settingsSource, 'ProfilePhotoUploader')

  assert.match(settingsSource, /settingsProfileFieldInputClassName = 'h-11 rounded-\[12px\] border-\[var\(--admin-shell-control-border\)\] bg-\[var\(--admin-shell-control-bg\)\]/)
  assert.match(settingsSource, /function SettingsProfileField/)
  assert.match(settingsSource, /text-\[var\(--admin-shell-text\)\]/)
  assert.match(uploaderSource, /admin-settings-profile-avatar h-48 w-48/)
  assert.match(uploaderSource, /object-cover/)
  assert.match(cssSource, /\.admin-settings-profile-avatar \{[\s\S]*width:\s*192px !important;[\s\S]*height:\s*192px !important;[\s\S]*object-fit:\s*cover;/)
  assert.match(profileSource, /text-\[var\(--admin-shell-text\)\]/)
  assert.doesNotMatch(profileSource, /border-\[#24334A\]|bg-\[#111D30\]|bg-\[#0F1728\]|bg-\[#0D1625\]|text-\[#DCE6F8\]|text-\[#EEF4FF\]|text-\[#8EA0BC\]|placeholder:text-\[#70809E\]/)
})

test('admin settings profile avatar falls back cleanly when the saved image url cannot load', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const uploaderSource = extractFunction(settingsSource, 'ProfilePhotoUploader')

  assert.match(uploaderSource, /const \[hasPreviewError, setHasPreviewError\] = useState\(false\)/)
  assert.match(uploaderSource, /useEffect\(\(\) => \{\s*setHasPreviewError\(false\)\s*\}, \[previewSrc\]\)/)
  assert.match(uploaderSource, /const canRenderPreview = Boolean\(previewSrc\) && !hasPreviewError/)
  assert.match(uploaderSource, /onError=\{\(\) => setHasPreviewError\(true\)\}/)
  assert.match(uploaderSource, /<img[\s\S]*src=\{previewSrc\}/)
  assert.doesNotMatch(uploaderSource, /<Avatar[\s\S]*src=\{previewSrc\}/)
  assert.match(uploaderSource, /canRenderPreview \? \([\s\S]*\) : \([\s\S]*aria-label=\{profileName \? `Avatar fallback for \$\{profileName\}` : 'Coach avatar fallback'\}/)
})

test('admin settings profile and account layouts fill the content width without parent card shells', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const profileSource = extractFunction(settingsSource, 'AdminSettingsProfileView')
  const accountSource = extractFunction(settingsSource, 'AdminSettingsAccountView')
  const uploaderSource = extractFunction(settingsSource, 'ProfilePhotoUploader')

  assert.match(profileSource, /<form className="admin-settings-profile-form grid w-full gap-6"/)
  assert.match(accountSource, /<form className="admin-settings-account-form grid w-full gap-6"/)
  assert.doesNotMatch(profileSource, /max-w-3xl/)
  assert.doesNotMatch(accountSource, /max-w-3xl/)

  assert.match(profileSource, /<div className="grid w-full gap-4 md:grid-cols-2">/)
  assert.match(profileSource, /id="admin-profile-status-notice" className="flex w-full items-start/)
  assert.match(profileSource, /profileStatusMessage \? \(/)
  assert.doesNotMatch(profileSource, /Edit the connected coach profile fields and save changes to Supabase\./)
  assert.match(accountSource, /<div className="grid w-full gap-4">[\s\S]*htmlFor="admin-account-email" label="Email"/)
  assert.match(accountSource, /accountStatusClassName = hasAccountError[\s\S]*flex w-full items-start/)
  assert.match(accountSource, /id="admin-account-status-notice"[\s\S]*className=\{accountStatusClassName\}/)

  assert.doesNotMatch(uploaderSource, /<div className="relative[^"]*rounded-\[20px\]|<div className="relative[^"]*border border-dashed|<div className="relative[^"]*bg-\[var\(--admin-shell-surface\)\]/)
})

test('admin settings account loads and saves real email and password changes', () => {
  const settingsSource = readFileSync(settingsViewPath, 'utf8')
  const accountSource = extractFunction(settingsSource, 'AdminSettingsAccountView')

  assert.match(settingsSource, /ADMIN_ACCOUNT_SEED = \{[\s\S]*email: ''/)
  assert.match(settingsSource, /password: ''/)
  assert.match(settingsSource, /confirmPassword: ''/)
  assert.match(accountSource, /useEffect/)
  assert.match(accountSource, /fetch\('\/admin\/api\/settings\/account'/)
  assert.match(accountSource, /handleSaveAccount/)
  assert.match(accountSource, /onSubmit=\{handleSaveAccount\}/)
  assert.match(accountSource, /Account updated\./)
  assert.match(accountSource, /htmlFor="admin-account-new-password" label="New password"/)
  assert.match(accountSource, /htmlFor="admin-account-confirm-password" label="Confirm password"/)
  assert.match(accountSource, /email: accountDraft\.email/)
  assert.match(accountSource, /password: accountDraft\.password/)
  assert.match(accountSource, /confirmPassword: accountDraft\.confirmPassword/)
  assert.match(accountSource, /type="submit"/)
  assert.match(accountSource, /Save changes/)
  assert.doesNotMatch(accountSource, /Account actions unavailable|readOnly|disabled\s*\n/)
})
