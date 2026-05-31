import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const adminShellSource = readFileSync(resolve('apps/web/components/admin/admin-shell.jsx'), 'utf8')

test('admin shell loads the authenticated coach profile for account avatars', () => {
  assert.match(adminShellSource, /async function requestAdminCoachProfile\(\)/)
  assert.match(adminShellSource, /fetch\('\/admin\/api\/settings\/profile', \{\s*method: 'GET',[\s\S]*cache: 'no-store'/)
  assert.match(adminShellSource, /const \[accountProfile, setAccountProfile\] = useState\(accountSwitcher\)/)
  assert.match(adminShellSource, /setAccountProfile\(\{[\s\S]*avatarUrl: profile\.avatarUrl \|\| ''[\s\S]*\}\)/)
})

test('admin shell renders real coach avatar images in the sidebar account switcher and top nav', () => {
  assert.match(adminShellSource, /function AccountAvatar\(\{ profile, className = '', fallbackClassName = '' \}\)/)
  assert.match(adminShellSource, /profile\?\.avatarUrl \? \([\s\S]*<img[\s\S]*src=\{profile\.avatarUrl\}[\s\S]*alt=\{profile\.name \? `\$\{profile\.name\} profile image` : 'Admin profile image'\}/)
  assert.match(adminShellSource, /<DashboardShellHeader[\s\S]*accountProfile=\{accountProfile\}/)
  assert.match(adminShellSource, /function DashboardShellHeader\(\{[\s\S]*accountProfile = accountSwitcher[\s\S]*\}\)/)
  assert.match(adminShellSource, /<AccountAvatar[\s\S]*profile=\{accountProfile\}[\s\S]*className="admin-dashboard-topbar-avatar h-8 w-8[\s\S]*fallbackClassName="admin-dashboard-topbar-avatar flex h-8 w-8/)
  assert.match(adminShellSource, /function SidebarAccountSwitcher\(\{ accountProfile = accountSwitcher \}\)/)
  assert.match(adminShellSource, /<AccountAvatar[\s\S]*profile=\{accountProfile\}[\s\S]*className="admin-dashboard-sidebar-account-avatar h-8 w-8[\s\S]*fallbackClassName="admin-dashboard-sidebar-account-avatar flex h-8 w-8/)
  assert.doesNotMatch(adminShellSource, /<span className="admin-dashboard-sidebar-account-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-\[12px\] font-bold leading-none">\s*AF\s*<\/span>/)
})

test('admin shell refreshes account avatars after the settings profile saves', () => {
  assert.match(adminShellSource, /window\.addEventListener\('pplus-admin-profile-updated', loadCoachProfile\)/)
  assert.match(adminShellSource, /window\.removeEventListener\('pplus-admin-profile-updated', loadCoachProfile\)/)

  const settingsViewSource = readFileSync(resolve('apps/web/components/admin/settings-view.jsx'), 'utf8')
  assert.match(settingsViewSource, /window\.dispatchEvent\(new CustomEvent\('pplus-admin-profile-updated', \{ detail: payload\.profile \}\)\)/)
})
