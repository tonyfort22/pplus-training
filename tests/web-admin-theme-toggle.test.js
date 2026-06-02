import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const adminShellPath = resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx')
const adminThemeTogglePath = resolve(repoRoot, 'apps/web/components/admin/admin-theme-toggle.jsx')
const supportConversationThreadPath = resolve(repoRoot, 'apps/web/components/admin/support/support-conversation-thread.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')
const lightToggleAssetPath = resolve(repoRoot, 'apps/web/public/admin/auth_theme_toggle_light.svg')

test('admin dashboard topbar places the dark-light switcher between search and avatar menu', () => {
  assert.ok(existsSync(adminThemeTogglePath), 'expected an admin theme toggle component')

  const adminShellSource = readFileSync(adminShellPath, 'utf8')
  const toggleSource = readFileSync(adminThemeTogglePath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')
  const lightToggleAssetSource = readFileSync(lightToggleAssetPath, 'utf8')

  assert.match(adminShellSource, /import AdminThemeToggle from '\.\/admin-theme-toggle'/)
  assert.match(adminShellSource, /function DashboardShellHeader\(\{ searchQuery = '', onSearchQueryChange = \(\) => \{\}, accountProfile = accountSwitcher \}\) \{[\s\S]*<div className="admin-dashboard-topbar-search[\s\S]*<\/div>\s*<AdminThemeToggle \/>\s*<DropdownMenu>/)

  assert.match(toggleSource, /'use client'/)
  assert.match(toggleSource, /export default function AdminThemeToggle/)
  assert.match(toggleSource, /const STORAGE_KEY = 'pplus-admin-theme'/)
  assert.match(toggleSource, /document\.documentElement\.dataset\.theme = nextTheme/)
  assert.match(toggleSource, /localStorage\.setItem\(STORAGE_KEY, nextTheme\)/)
  assert.match(toggleSource, /const nextTheme = theme === 'dark' \? 'light' : 'dark'/)
  assert.match(toggleSource, /onClick=\{toggleTheme\}/)
  assert.match(toggleSource, /aria-label=\{`Switch admin dashboard to \$\{theme === 'dark' \? 'light' : 'dark'\} mode`\}/)
  assert.match(toggleSource, /src="\/admin\/auth_theme_toggle\.svg"/)
  assert.match(toggleSource, /src="\/admin\/auth_theme_toggle_light\.svg"/)
  assert.doesNotMatch(toggleSource, /publicTheme/)
  assert.doesNotMatch(toggleSource, /pplus-public-theme/)

  assert.match(cssSource, /\.admin-theme-toggle\s*\{[^}]*position:\s*relative;[^}]*width:\s*62px;[^}]*height:\s*36px;[^}]*cursor:\s*pointer;/)
  assert.match(cssSource, /\.admin-theme-toggle-image\s*\{[^}]*position:\s*absolute;[^}]*opacity:\s*0;/)
  assert.match(cssSource, /\.admin-theme-toggle-image-active\s*\{[^}]*opacity:\s*1;/)
  assert.match(lightToggleAssetSource, /stroke="#F8FAFC"/)
})

test('support conversation topbar places the same dark-light switcher to the right of the message status dropdown', () => {
  const supportThreadSource = readFileSync(supportConversationThreadPath, 'utf8')

  assert.match(supportThreadSource, /import AdminThemeToggle from "@\/components\/admin\/admin-theme-toggle"/)
  assert.match(supportThreadSource, /<ChatHeader className="support-inbox-topbar min-h-\[70px\]">/)
  assert.match(
    supportThreadSource,
    /<ChatHeaderAddon>\s*<Select value=\{status\}[\s\S]*<SelectTrigger aria-label="Conversation status"[\s\S]*<\/Select>\s*<\/ChatHeaderAddon>\s*<ChatHeaderAddon>\s*<AdminThemeToggle \/>\s*<\/ChatHeaderAddon>/,
  )
})
