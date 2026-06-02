import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dropdownMenuPath = resolve(repoRoot, 'apps/web/components/ui/dropdown-menu.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

test('admin dropdown menus use requested divider and selected-tab green hover treatment', () => {
  const source = readFileSync(dropdownMenuPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(source, /function DropdownMenuItem/)
  assert.match(source, /data-\[highlighted\]:bg-\[var\(--admin-shell-nav-active-bg\)\]/)
  assert.match(source, /data-\[highlighted\]:text-\[var\(--admin-shell-nav-active-text\)\]/)
  assert.match(source, /focus:bg-\[var\(--admin-shell-nav-active-bg\)\]/)
  assert.match(source, /focus:text-\[var\(--admin-shell-nav-active-text\)\]/)
  assert.match(source, /hover:bg-\[var\(--admin-shell-nav-active-bg\)\]/)
  assert.match(source, /hover:text-\[var\(--admin-shell-nav-active-text\)\]/)

  assert.match(source, /function DropdownMenuSeparator/)
  assert.match(source, /bg-\[var\(--admin-shell-border\)\]/)
  assert.doesNotMatch(source, /DropdownMenuSeparator[\s\S]*bg-\[#24334A\]/)

  assert.match(cssSource, /\.admin-dashboard-dropdown-content \[role='menuitem'\]\[data-highlighted\][^}]*background:\s*var\(--admin-shell-nav-active-bg\);/)
  assert.match(cssSource, /\.admin-dashboard-dropdown-content \[role='menuitem'\]\[data-highlighted\][^}]*color:\s*var\(--admin-shell-nav-active-text\) !important;/)
})
