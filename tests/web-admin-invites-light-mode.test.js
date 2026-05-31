import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')
const invitesDataTablePath = resolve(repoRoot, 'apps/web/components/admin/invites-data-table.jsx')
const invitesListViewPath = resolve(repoRoot, 'apps/web/components/admin/invites-list-view.jsx')

test('athlete invites admin view uses light-mode admin table tokens and safe invite actions', () => {
  const cssSource = readFileSync(cssPath, 'utf8')
  const invitesSource = readFileSync(invitesDataTablePath, 'utf8')
  const invitesListSource = readFileSync(invitesListViewPath, 'utf8')

  assert.match(invitesListSource, /admin-shell-invites-page-title/)
  assert.match(cssSource, /\.admin-shell-invites-page-title\s*\{[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-invites-table-shell\s*\{[^}]*border:\s*1px solid var\(--admin-dashboard-card-border\);[^}]*background:\s*var\(--admin-athletes-table-shell-bg\);/)
  assert.match(cssSource, /\.admin-shell-invites-table thead th\s*\{[^}]*border-bottom:\s*1px solid var\(--admin-athletes-row-border\);[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-invites-table tbody td\s*\{[^}]*border-bottom:\s*1px solid var\(--admin-athletes-row-border\);[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-invites-row-even\s*\{[^}]*background:\s*var\(--admin-athletes-row-even-bg\);/)
  assert.match(cssSource, /\.admin-shell-invites-row-odd\s*\{[^}]*background:\s*var\(--admin-athletes-row-odd-bg\);/)
  assert.match(cssSource, /\.admin-shell-invites-name-text,[\s\S]*?\.admin-shell-invites-join-date-cell\s*\{[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-invites-name-meta\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-invites-status-badge-pending\s*\{[^}]*background:\s*rgba\(245, 158, 11, 0\.14\);[^}]*color:\s*#b45309;/)
  assert.match(cssSource, /\.admin-shell-invites-row-menu\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-invites-row-menu:hover\s*\{[^}]*background:\s*var\(--admin-shell-nav-active-bg\);[^}]*color:\s*var\(--admin-shell-nav-active-text\);/)
  assert.match(cssSource, /\.admin-shell-invites-empty-state\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-invites-pagination-bar\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-invites-example-pagination-button-active\s*\{[^}]*background:\s*var\(--admin-shell-accent\);[^}]*color:\s*#0B1120;/)

  assert.match(invitesSource, /admin-shell-invites-table-shell/)
  assert.match(invitesSource, /admin-shell-invites-empty-state/)
  assert.match(invitesSource, /admin-shell-invites-pagination-bar/)
  assert.match(invitesSource, /admin-shell-invites-example-pagination-button-active/)
  assert.match(invitesSource, /inviteDialogMode === 'resend'/)
  assert.doesNotMatch(invitesSource, /Cancel invite<\/DropdownMenuItem>/)
  assert.doesNotMatch(invitesSource, /isCancelInviteDialogOpen/)
  assert.doesNotMatch(invitesSource, /className="h-24 text-center text-\[#8EA0BC\]"/)
  assert.doesNotMatch(invitesSource, /className="h-9 w-\[76px\] rounded-\[10px\] !border-\[#24334A\] bg-\[#111D30\]/)
})
