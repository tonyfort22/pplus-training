import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const adminShellSource = readFileSync(resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx'), 'utf8')

function dashboardShellHeaderSource() {
  const start = adminShellSource.indexOf('function DashboardShellHeader(')
  const end = adminShellSource.indexOf('\nfunction SidebarBrandLogo()', start)

  assert.notEqual(start, -1, 'DashboardShellHeader should exist')
  assert.notEqual(end, -1, 'DashboardShellHeader should end before SidebarBrandLogo')

  return adminShellSource.slice(start, end)
}

const headerSource = dashboardShellHeaderSource()

test('admin topbar keeps sidebar trigger search theme toggle and account menu in the approved order', () => {
  const sidebarTriggerIndex = headerSource.indexOf('<SidebarTrigger')
  const searchIndex = headerSource.indexOf('<div className="admin-dashboard-topbar-search')
  const themeToggleIndex = headerSource.indexOf('<AdminThemeToggle />')
  const accountMenuIndex = headerSource.indexOf('<DropdownMenu>')

  assert.ok(sidebarTriggerIndex > -1, 'topbar should include the sidebar trigger')
  assert.ok(searchIndex > sidebarTriggerIndex, 'search should follow the sidebar trigger')
  assert.ok(themeToggleIndex > searchIndex, 'theme toggle should sit after search')
  assert.ok(accountMenuIndex > themeToggleIndex, 'account menu should sit after the theme toggle')
  assert.match(headerSource, /<div className="flex items-center justify-between gap-4">/)
  assert.match(headerSource, /<div className="flex min-w-0 flex-1 items-center gap-3">/)
})

test('admin topbar search is a controlled input with the approved submit button', () => {
  assert.match(headerSource, /<div className="admin-dashboard-topbar-search flex min-w-0 flex-1 items-center gap-2">/)
  assert.match(headerSource, /className="admin-dashboard-topbar-search-input h-\[35px\] max-h-\[35px\] flex-1 rounded-\[12px\] px-4 text-sm focus-visible:border-\[#3BE0AF\] focus-visible:ring-\[#3BE0AF\]\/20"/)
  assert.match(headerSource, /placeholder="Search athletes, programs, or groups"/)
  assert.match(headerSource, /value=\{searchQuery\}/)
  assert.match(headerSource, /onChange=\{\(event\) => onSearchQueryChange\(event\.target\.value\)\}/)
  assert.match(headerSource, /aria-label="Search athletes, programs, or groups"/)
  assert.match(headerSource, /aria-label="Submit search"/)
  assert.match(headerSource, /className="admin-dashboard-topbar-search-button h-\[35px\] max-h-\[35px\] rounded-\[12px\] px-4"/)
  assert.match(headerSource, /<Search className="h-4 w-4" aria-hidden="true" \/>/)
})

test('admin topbar theme toggle remains a single seam between search and account controls', () => {
  const themeToggleMatches = headerSource.match(/<AdminThemeToggle \/>/g) || []

  assert.equal(themeToggleMatches.length, 1)
  assert.match(headerSource, /<\/div>\s*<AdminThemeToggle \/>\s*<DropdownMenu>/)
  assert.doesNotMatch(headerSource, /<DropdownMenu>[\s\S]*<AdminThemeToggle \/>[\s\S]*<\/DropdownMenu>/)
})

test('admin topbar account dropdown uses the avatar trigger and stable profile account links', () => {
  assert.match(headerSource, /<DropdownMenuTrigger asChild>/)
  assert.match(headerSource, /aria-label="Open top account menu"/)
  assert.match(headerSource, /className="rounded-full transition-all hover:opacity-90"/)
  assert.match(headerSource, /<AccountAvatar\s+profile=\{accountProfile\}/)
  assert.match(headerSource, /className="admin-dashboard-topbar-avatar h-8 w-8"/)
  assert.match(headerSource, /fallbackClassName="admin-dashboard-topbar-avatar flex h-8 w-8 items-center justify-center rounded-full text-\[12px\] font-bold leading-none"/)
  assert.match(headerSource, /<DropdownMenuContent\s+side="bottom"\s+align="end"\s+sideOffset=\{12\}/)
  assert.match(headerSource, /className="admin-dashboard-dropdown-content w-\[220px\] rounded-2xl p-2"/)
  assert.match(headerSource, /<DropdownMenuLabel>My Account<\/DropdownMenuLabel>/)
  assert.match(adminShellSource, /const accountMenuItems = \[\s*\{ id: 'profile', label: 'Profile', href: '\/admin\/settings' \},\s*\{ id: 'account', label: 'Account', href: '\/admin\/settings\/account' \},\s*\]/)
  assert.match(headerSource, /\{accountMenuItems\.map\(\(item\) => \(\s*<DropdownMenuItem key=\{item\.id\} asChild>\s*<Link href=\{item\.href\}>\{item\.label\}<\/Link>/)
})
