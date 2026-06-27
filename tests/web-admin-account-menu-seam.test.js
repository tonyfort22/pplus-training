import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const adminShellSource = readFileSync(resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx'), 'utf8')

function functionSource(name, nextName) {
  const start = adminShellSource.indexOf(`function ${name}(`)
  const end = nextName
    ? adminShellSource.indexOf(`\nfunction ${nextName}(`, start)
    : adminShellSource.length

  assert.notEqual(start, -1, `${name} should exist`)
  assert.notEqual(end, -1, `${name} should end before ${nextName}`)

  return adminShellSource.slice(start, end)
}

function countMatches(source, pattern) {
  return source.match(pattern)?.length || 0
}

const accountAvatarSource = functionSource('AccountAvatar', 'AdminFloatingMicButton')
const topbarHeaderSource = functionSource('DashboardShellHeader', 'SidebarBrandLogo')
const sidebarAccountSource = functionSource('SidebarAccountSwitcher', 'AdminDashboardSidebar')

test('admin account avatar helper keeps image and initials fallback on one shared seam', () => {
  assert.match(accountAvatarSource, /function AccountAvatar\(\{ profile, className = '', fallbackClassName = '' \}\)/)
  assert.match(accountAvatarSource, /return profile\?\.avatarUrl \? \(/)
  assert.match(accountAvatarSource, /src=\{profile\.avatarUrl\}/)
  assert.match(accountAvatarSource, /alt=\{profile\.name \? `\$\{profile\.name\} profile image` : 'Admin profile image'\}/)
  assert.match(accountAvatarSource, /className=\{`\$\{className\} shrink-0 rounded-full object-cover`\}/)
  assert.match(accountAvatarSource, /<span className=\{fallbackClassName\}>\{getAccountInitials\(profile\)\}<\/span>/)
  assert.match(adminShellSource, /function getAccountInitials\(profile = accountSwitcher\) \{[\s\S]*return initials \|\| 'AF'[\s\S]*\}/)
})

test('admin topbar account menu is avatar-only and owns the bottom-end account menu seam', () => {
  assert.equal(countMatches(topbarHeaderSource, /<DropdownMenu>/g), 1, 'topbar should expose exactly one account dropdown')
  assert.match(topbarHeaderSource, /<DropdownMenuTrigger asChild>\s*<button\s+type="button"\s+aria-label="Open top account menu"\s+className="rounded-full transition-all hover:opacity-90"/)
  assert.match(topbarHeaderSource, /<AccountAvatar\s+profile=\{accountProfile\}\s+className="admin-dashboard-topbar-avatar h-8 w-8"\s+fallbackClassName="admin-dashboard-topbar-avatar flex h-8 w-8 items-center justify-center rounded-full text-\[12px\] font-bold leading-none"\s+\/>/)
  assert.match(topbarHeaderSource, /<DropdownMenuContent\s+side="bottom"\s+align="end"\s+sideOffset=\{12\}\s+className="admin-dashboard-dropdown-content w-\[220px\] rounded-2xl p-2"/)
  assert.doesNotMatch(topbarHeaderSource, /<button[\s\S]*\{accountProfile\.name\}[\s\S]*<\/button>/, 'topbar trigger should stay avatar-only')
  assert.doesNotMatch(topbarHeaderSource, /<button[\s\S]*\{accountProfile\.email\}[\s\S]*<\/button>/, 'topbar trigger should not duplicate account email')
})

test('admin sidebar account switcher uses the same account menu seam with sidebar placement', () => {
  assert.equal(countMatches(sidebarAccountSource, /<DropdownMenu>/g), 1, 'sidebar footer should expose exactly one account dropdown')
  assert.match(sidebarAccountSource, /<SidebarMenuButton size="lg" className="admin-dashboard-sidebar-account-button h-14 w-full rounded-2xl px-3 group-data-\[collapsible=icon\]:hidden">/)
  assert.match(sidebarAccountSource, /<AccountAvatar\s+profile=\{accountProfile\}\s+className="admin-dashboard-sidebar-account-avatar h-8 w-8"\s+fallbackClassName="admin-dashboard-sidebar-account-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-\[12px\] font-bold leading-none"\s+\/>/)
  assert.match(sidebarAccountSource, /\{accountProfile\.name\}/)
  assert.match(sidebarAccountSource, /\{accountProfile\.email\}/)
  assert.match(sidebarAccountSource, /<BadgeCheck className="h-4 w-4 shrink-0 text-\[#3BE0AF\] group-data-\[collapsible=icon\]:hidden" \/>/)
  assert.match(sidebarAccountSource, /<ChevronsUpDown className="admin-dashboard-sidebar-secondary-text h-4 w-4 shrink-0 group-data-\[collapsible=icon\]:hidden" \/>/)
  assert.match(sidebarAccountSource, /<DropdownMenuContent\s+side="right"\s+align="start"\s+sideOffset=\{12\}\s+className="admin-dashboard-dropdown-content admin-dashboard-sidebar-dropdown-content w-\[220px\] rounded-2xl p-2"/)
})

test('admin account menus share one stable Profile and Account item contract', () => {
  assert.match(adminShellSource, /const accountMenuItems = \[\s*\{ id: 'profile', label: 'Profile', href: '\/admin\/settings' \},\s*\{ id: 'account', label: 'Account', href: '\/admin\/settings\/account' \},\s*\]/)

  for (const source of [topbarHeaderSource, sidebarAccountSource]) {
    assert.match(source, /<DropdownMenuLabel>My Account<\/DropdownMenuLabel>/)
    assert.match(source, /<DropdownMenuSeparator \/>/)
    assert.match(source, /\{accountMenuItems\.map\(\(item\) => \(\s*<DropdownMenuItem key=\{item\.id\} asChild>\s*<Link href=\{item\.href\}>\{item\.label\}<\/Link>\s*<\/DropdownMenuItem>\s*\)\)\}/)
    assert.doesNotMatch(source, /href="\/admin\/settings"/)
    assert.doesNotMatch(source, /href="\/admin\/settings\/account"/)
  }
}
)
