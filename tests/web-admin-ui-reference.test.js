import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')
const adminIndexPath = resolve(repoRoot, 'apps/web/app/admin/page.jsx')
const adminUiPath = resolve(repoRoot, 'apps/web/app/admin/ui/page.jsx')
const adminSectionPath = resolve(repoRoot, 'apps/web/app/admin/[section]/page.jsx')
const adminSubsectionPath = resolve(repoRoot, 'apps/web/app/admin/[section]/[subsection]/page.jsx')
const adminShellPath = resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx')
const adminNavigationPath = resolve(repoRoot, 'apps/web/components/admin/admin-navigation.js')
const sidebarPath = resolve(repoRoot, 'apps/web/components/ui/sidebar.jsx')
const rulesetPath = resolve(repoRoot, 'docs/admin-ui-ruleset.md')

test('admin navigation uses real nested routes driven by shared config', () => {
  for (const path of [
    adminIndexPath,
    adminUiPath,
    adminSectionPath,
    adminSubsectionPath,
    adminShellPath,
    adminNavigationPath,
    sidebarPath,
  ]) {
    assert.ok(existsSync(path), `expected admin navigation file to exist: ${path}`)
  }

  const cssSource = readFileSync(cssPath, 'utf8')
  const adminIndexSource = readFileSync(adminIndexPath, 'utf8')
  const adminUiSource = readFileSync(adminUiPath, 'utf8')
  const adminSectionSource = readFileSync(adminSectionPath, 'utf8')
  const adminSubsectionSource = readFileSync(adminSubsectionPath, 'utf8')
  const adminShellSource = readFileSync(adminShellPath, 'utf8')
  const adminNavigationSource = readFileSync(adminNavigationPath, 'utf8')
  const sidebarSource = readFileSync(sidebarPath, 'utf8')
  const rulesetSource = readFileSync(rulesetPath, 'utf8')

  assert.match(adminIndexSource, /redirect\('\/admin\/dashboard'\)/)
  assert.match(adminUiSource, /redirect\('\/admin\/dashboard'\)/)

  assert.match(adminSectionSource, /AdminShell/)
  assert.match(adminSectionSource, /params/)
  assert.match(adminSectionSource, /section/)
  assert.match(adminSubsectionSource, /AdminShell/)
  assert.match(adminSubsectionSource, /subsection/)

  assert.match(adminShellSource, /from '\.\.\/ui\/sidebar-layout'/)
  assert.match(adminShellSource, /from '\.\.\/ui\/sidebar'/)
  assert.match(adminShellSource, /from '\.\/admin-navigation'/)
  assert.match(adminShellSource, /brandLogoSrc="\/admin\/logo_pplus_training\.svg"/)
  assert.match(adminShellSource, /currentPath/)
  assert.match(adminShellSource, /pageTitle/)

  assert.match(adminNavigationSource, /href: '\/admin\/dashboard'/)
  assert.match(adminNavigationSource, /href: '\/admin\/athletes'/)
  assert.match(adminNavigationSource, /href: '\/admin\/programs'/)
  assert.match(adminNavigationSource, /href: '\/admin\/workouts'/)
  assert.match(adminNavigationSource, /href: '\/admin\/exercises'/)
  assert.match(adminNavigationSource, /href: '\/admin\/analytics'/)
  assert.match(adminNavigationSource, /href: '\/admin\/settings'/)
  assert.match(adminNavigationSource, /href: '\/admin\/athletes\/groups'/)
  assert.match(adminNavigationSource, /href: '\/admin\/programs\/templates'/)
  assert.match(adminNavigationSource, /href: '\/admin\/workouts\/sessions'/)
  assert.match(adminNavigationSource, /href: '\/admin\/analytics\/compliance'/)
  assert.match(adminNavigationSource, /href: '\/admin\/settings\/team'/)
  assert.match(adminNavigationSource, /defaultHref/)

  assert.match(sidebarSource, /from 'next\/link'/)
  assert.match(sidebarSource, /currentPath\s*=\s*''/)
  assert.match(sidebarSource, /href\s*=\s*''/)
  assert.match(sidebarSource, /<Link/)
  assert.match(sidebarSource, /ui-sidebar-group-button-current/)
  assert.match(sidebarSource, /ui-sidebar-subitem-current/)
  assert.match(sidebarSource, /const isExpanded = isActive/)
  assert.doesNotMatch(sidebarSource, /group\.expanded !== false \|\| isActive/)
  assert.match(sidebarSource, /startsWith\(/)

  assert.match(cssSource, /\.ui-sidebar\s*\{[\s\S]*max-width:\s*236px;/)
  assert.match(cssSource, /\.ui-sidebar\s*\{[\s\S]*border-radius:\s*0;/)
  assert.match(cssSource, /\.ui-sidebar\s*\{[\s\S]*box-shadow:\s*none;/)
  assert.match(cssSource, /\.ui-sidebar\s*\{[\s\S]*border-right:\s*1px solid/)
  assert.match(cssSource, /\.ui-sidebar-layout\s*\{[\s\S]*gap:\s*0;/)
  assert.match(cssSource, /\.ui-sidebar-layout\s*\{[\s\S]*padding:\s*0;/)
  assert.match(cssSource, /\.ui-sidebar-search\s*\{[\s\S]*min-height:\s*36px;/)
  assert.match(cssSource, /\.ui-sidebar-group-button\s*\{[\s\S]*grid-template-columns:\s*auto 1fr auto;/)
  assert.match(cssSource, /\.ui-sidebar-subitem-current::before\s*\{[\s\S]*width:\s*2px;/)
  assert.match(cssSource, /\.admin-shell-workspace\s*\{[\s\S]*min-height:\s*calc\(100vh - 16px\);/)
  assert.match(cssSource, /\.admin-shell-workspace-panel\s*\{[\s\S]*width:\s*min\(100%, 520px\);/)

  assert.match(rulesetSource, /reference standard UI kit/i)
  assert.match(rulesetSource, /components\/ui/i)
})
