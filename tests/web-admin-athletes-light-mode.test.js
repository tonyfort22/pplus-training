import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')
const athletesDataTablePath = resolve(repoRoot, 'apps/web/components/admin/athletes-data-table.jsx')

test('all athletes table surface uses admin light-mode tokens instead of dark-coded colors', () => {
  const cssSource = readFileSync(cssPath, 'utf8')
  const athletesSource = readFileSync(athletesDataTablePath, 'utf8')

  assert.match(cssSource, /html\[data-theme='light'\]\s*\{[^}]*--admin-athletes-table-shell-bg:\s*#ffffff;[^}]*--admin-athletes-row-even-bg:\s*#ffffff;[^}]*--admin-athletes-row-odd-bg:\s*#f8fafc;[^}]*--admin-athletes-row-border:\s*#eef2f7;/)
  assert.match(cssSource, /html\[data-theme='dark'\]\s*\{[^}]*--admin-athletes-table-shell-bg:\s*rgba\(9, 16, 29, 0\.65\);[^}]*--admin-athletes-row-even-bg:\s*rgba\(15, 23, 38, 0\.94\);[^}]*--admin-athletes-row-odd-bg:\s*rgba\(12, 19, 32, 0\.96\);[^}]*--admin-athletes-row-border:\s*rgba\(24, 35, 56, 0\.7\);/)

  assert.match(cssSource, /\.admin-shell-athletes-page-title\s*\{[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-table-shell\s*\{[^}]*border:\s*1px solid var\(--admin-dashboard-card-border\);[^}]*background:\s*var\(--admin-athletes-table-shell-bg\);/)
  assert.match(cssSource, /\.admin-shell-athletes-table thead th\s*\{[^}]*border-bottom:\s*1px solid var\(--admin-athletes-row-border\);[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-athletes-table tbody td\s*\{[^}]*border-bottom:\s*1px solid var\(--admin-athletes-row-border\);[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-row-even\s*\{[^}]*background:\s*var\(--admin-athletes-row-even-bg\);/)
  assert.match(cssSource, /\.admin-shell-athletes-row-odd\s*\{[^}]*background:\s*var\(--admin-athletes-row-odd-bg\);/)
  assert.match(cssSource, /\.admin-shell-athletes-name-text,[\s\S]*?\.admin-shell-athletes-last-active-cell\s*\{[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-name-meta\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-athletes-workouts-label\s*\{[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-workouts-percent\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-athletes-workouts-progress\s*\{[^}]*background:\s*var\(--admin-athletes-progress-track\);/)
  assert.match(cssSource, /\.admin-shell-athletes-row-menu\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-athletes-row-menu:hover\s*\{[^}]*background:\s*var\(--admin-shell-nav-active-bg\);[^}]*color:\s*var\(--admin-shell-nav-active-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-example-columns-button\s*\{[^}]*border:\s*1px solid var\(--admin-dashboard-card-border\);[^}]*background:\s*var\(--admin-dashboard-control-bg\);[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-filter-trigger\s*\{[^}]*border:\s*1px solid var\(--admin-dashboard-card-border\);[^}]*background:\s*var\(--admin-dashboard-control-bg\);[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-pagination-bar\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-athletes-example-pagination-button\s*\{[^}]*border:\s*1px solid var\(--admin-dashboard-card-border\);[^}]*background:\s*var\(--admin-dashboard-control-bg\);[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-example-pagination-button-active\s*\{[^}]*background:\s*var\(--admin-shell-accent\);[^}]*color:\s*#0B1120;/)

  assert.match(athletesSource, /admin-shell-athletes-filter-trigger/)
  assert.match(athletesSource, /admin-shell-athletes-pagination-bar/)
  assert.match(athletesSource, /admin-shell-athletes-empty-state/)
  assert.match(athletesSource, /admin-shell-athletes-status-badge admin-shell-athletes-status-badge-active/)
  assert.match(athletesSource, /admin-shell-athletes-status-badge admin-shell-athletes-status-badge-inactive/)
  assert.match(athletesSource, /admin-shell-athletes-example-pagination-button-active/)
  assert.doesNotMatch(athletesSource, /className="rounded-\[12px\] min-h-\[40px\] !border !border-\[#24334A\] bg-transparent text-\[#DCE6F8\]/)
  assert.doesNotMatch(athletesSource, /className="h-9 w-\[76px\] rounded-\[10px\] !border-\[#24334A\] bg-\[#111D30\]/)
  assert.doesNotMatch(athletesSource, /className="py-10 text-center text-\[#8EA0BC\]"/)
})

test('create and edit athlete dialog avatar uploader and tabs use theme-aware light-mode classes', () => {
  const cssSource = readFileSync(cssPath, 'utf8')
  const athletesSource = readFileSync(athletesDataTablePath, 'utf8')

  assert.match(athletesSource, /admin-shell-athletes-create-uploader-empty/)
  assert.match(athletesSource, /admin-shell-athletes-create-tabs/)
  assert.doesNotMatch(athletesSource, /border-\[#2B3D57\]|bg-\[#0D1625\]|bg-\[#111D30\]|border-\[#24334A\]|text-\[#8EA0BC\]/)
  assert.doesNotMatch(athletesSource, /shadow-\[0_28px_80px_rgba\(0,0,0,0\.55\)\]/)

  assert.match(cssSource, /\.admin-shell-athletes-create-uploader-empty\s*\{[^}]*border:\s*1px dashed var\(--admin-dashboard-card-border\);[^}]*background:\s*var\(--admin-shell-avatar-bg\);[^}]*color:\s*var\(--admin-shell-avatar-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-create-tabs \[data-slot='tabs-list'\],[\s\S]*?\{[^}]*border:\s*1px solid var\(--admin-dashboard-card-border\);[^}]*background:\s*var\(--admin-dashboard-control-bg\);[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-athletes-create-tabs \[data-slot='tabs-trigger'\]\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
  assert.match(cssSource, /\.admin-shell-athletes-create-tabs \[data-slot='tabs-trigger'\]\[data-state='active'\]\s*\{[^}]*background:\s*var\(--admin-shell-accent\);[^}]*color:\s*#0B1120;/)
})
