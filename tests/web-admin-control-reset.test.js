import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const adminShellSource = readFileSync(resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx'), 'utf8')
const buttonPrimitiveSource = readFileSync(resolve(repoRoot, 'apps/web/components/ui/button.jsx'), 'utf8')
const selectPrimitiveSource = readFileSync(resolve(repoRoot, 'apps/web/components/ui/select.jsx'), 'utf8')

function functionSource(source, name, nextToken) {
  const start = source.indexOf(`function ${name}(`)
  const end = nextToken ? source.indexOf(nextToken, start) : source.length

  assert.notEqual(start, -1, `${name} should exist`)
  assert.notEqual(end, -1, `${name} should end before ${nextToken}`)

  return source.slice(start, end)
}

function jsxTagBlocks(source, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[\\s\\S]*?>`, 'g')
  return source.match(pattern) || []
}

const dashboardShellHeaderSource = functionSource(adminShellSource, 'DashboardShellHeader', 'SidebarBrandLogo')
const sidebarWorkspaceSwitcherSource = functionSource(adminShellSource, 'SidebarWorkspaceSwitcher', 'SidebarAccountSwitcher')
const adminFloatingMicButtonSource = functionSource(adminShellSource, 'AdminFloatingMicButton', 'getGroupState')
const buttonBaseClassMatch = buttonPrimitiveSource.match(/const buttonVariants = cva\(\s*"([^"]+)"/)
const selectTriggerSource = functionSource(selectPrimitiveSource, 'SelectTrigger', 'SelectContent')

test('admin button primitive strips native browser button appearance before variants apply', () => {
  assert.ok(buttonBaseClassMatch, 'button primitive should expose one base cva class string')
  const buttonBaseClassName = buttonBaseClassMatch[1]

  assert.match(buttonBaseClassName, /appearance-none/)
  assert.match(buttonBaseClassName, /inline-flex/)
  assert.match(buttonBaseClassName, /items-center/)
  assert.match(buttonBaseClassName, /justify-center/)
  assert.match(buttonBaseClassName, /border border-transparent/)
  assert.match(buttonBaseClassName, /bg-clip-padding/)
  assert.match(buttonPrimitiveSource, /data-slot="button"/)
})

test('admin select trigger strips native select appearance and uses the styled Radix trigger seam', () => {
  assert.match(selectTriggerSource, /<SelectPrimitive\.Trigger/)
  assert.match(selectTriggerSource, /data-slot="select-trigger"/)
  assert.match(selectTriggerSource, /appearance-none/)
  assert.match(selectTriggerSource, /rounded-lg border border-\[color:var\(--admin-dashboard-card-border\)\]/)
  assert.match(selectTriggerSource, /bg-\[var\(--admin-dashboard-control-bg\)\]/)
  assert.match(selectTriggerSource, /focus:border-\[var\(--admin-shell-accent\)\]/)
  assert.doesNotMatch(selectTriggerSource, /<select\b/)
})

test('admin shell topbar uses styled Button and SidebarTrigger controls where button chrome is expected', () => {
  assert.match(dashboardShellHeaderSource, /<SidebarTrigger[\s\S]*className="admin-dashboard-sidebar-trigger relative z-30 h-8 w-8 shrink-0 rounded-md"/)
  assert.match(dashboardShellHeaderSource, /<Button[\s\S]*type="button"[\s\S]*size="lg"[\s\S]*aria-label="Submit search"[\s\S]*className="admin-dashboard-topbar-search-button h-\[35px\] max-h-\[35px\] rounded-\[12px\] px-4"/)
  assert.doesNotMatch(dashboardShellHeaderSource, /<select\b/)
  assert.doesNotMatch(dashboardShellHeaderSource, /<button\b(?![\s\S]*?aria-label="Open top account menu"[\s\S]*?className="rounded-full transition-all hover:opacity-90")/)
})

test('admin shell athlete switcher and floating action controls avoid raw default select/button UI', () => {
  assert.doesNotMatch(sidebarWorkspaceSwitcherSource, /<select\b/)
  assert.match(sidebarWorkspaceSwitcherSource, /<DropdownMenuTrigger asChild>\s*<SidebarMenuButton size="lg" className="admin-dashboard-sidebar-switcher h-14 w-full rounded-2xl px-3">/)
  assert.match(sidebarWorkspaceSwitcherSource, /<Input[\s\S]*aria-label="Search athlete selector"[\s\S]*className="admin-dashboard-topbar-search-input h-\[35px\] max-h-\[35px\] flex-1 rounded-\[12px\] px-4 text-sm focus-visible:border-\[#3BE0AF\] focus-visible:ring-\[#3BE0AF\]\/20"/)

  for (const buttonTag of jsxTagBlocks(adminFloatingMicButtonSource, 'button')) {
    assert.match(buttonTag, /className=\{`admin-dashboard-floating-mic-button[^`]*\$\{ADMIN_AI_BUTTON_CLASS_NAME\}[^`]*`\}/)
  }
})
