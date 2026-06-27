import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const adminShellSource = readFileSync(resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx'), 'utf8')
const sidebarPrimitiveSource = readFileSync(resolve(repoRoot, 'apps/web/components/ui/sidebar.jsx'), 'utf8')

function functionSource(source, name, nextToken) {
  const start = source.indexOf(`function ${name}(`)
  const end = nextToken ? source.indexOf(nextToken, start) : source.length

  assert.notEqual(start, -1, `${name} should exist`)
  assert.notEqual(end, -1, `${name} should end before ${nextToken}`)

  return source.slice(start, end)
}

const sidebarMenuSource = functionSource(sidebarPrimitiveSource, 'SidebarMenu', 'SidebarMenuItem')
const sidebarMenuItemSource = functionSource(sidebarPrimitiveSource, 'SidebarMenuItem', '\nconst sidebarMenuButtonVariants')
const sidebarMenuSubSource = functionSource(sidebarPrimitiveSource, 'SidebarMenuSub', 'SidebarMenuSubItem')
const sidebarMenuSubItemSource = functionSource(sidebarPrimitiveSource, 'SidebarMenuSubItem', 'SidebarMenuSubButton')
const adminSidebarNavItemSource = functionSource(adminShellSource, 'AdminSidebarNavItem', 'DashboardShellHeader')

test('sidebar primitives reset browser list styling on menu containers and items', () => {
  assert.match(sidebarMenuSource, /className=\{cn\("flex w-full min-w-0 list-none flex-col gap-0 p-0 m-0"/)
  assert.match(sidebarMenuItemSource, /className=\{cn\("group\/menu-item relative list-none"/)
  assert.match(sidebarMenuSubSource, /className=\{cn\(\s*"mx-3\.5 flex min-w-0 list-none translate-x-px flex-col gap-1 border-l border-sidebar-border px-2\.5 py-0\.5 pl-3 group-data-\[collapsible=icon\]:hidden"/)
  assert.match(sidebarMenuSubItemSource, /className=\{cn\("group\/menu-sub-item relative list-none"/)
})

test('admin sidebar details summary strips native disclosure bullets before custom chevron renders', () => {
  assert.match(adminSidebarNavItemSource, /<summary className="list-none \[&::-webkit-details-marker\]:hidden">/)
  assert.match(adminSidebarNavItemSource, /<ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform group-open\/admin-sidebar-item:rotate-90" \/>/)
  assert.doesNotMatch(adminSidebarNavItemSource, /<summary(?![^>]*list-none)/)
  assert.doesNotMatch(adminSidebarNavItemSource, /list-disc|list-decimal|marker:/)
})

test('admin sidebar uses shadcn sidebar primitives instead of raw bullet lists', () => {
  assert.match(adminSidebarNavItemSource, /<SidebarMenuItem>/)
  assert.match(adminSidebarNavItemSource, /<SidebarMenuButton[\s\S]*className="admin-dashboard-sidebar-nav-button/)
  assert.match(adminSidebarNavItemSource, /<SidebarMenuSub className="admin-dashboard-sidebar-subnav ml-3 mt-1 pl-3">/)
  assert.match(adminSidebarNavItemSource, /<SidebarMenuSubItem key=\{item\.id\}>/)
  assert.match(adminSidebarNavItemSource, /<SidebarMenuSubButton[\s\S]*className="admin-dashboard-sidebar-subnav-button/)
  assert.doesNotMatch(adminSidebarNavItemSource, /<ul\b|<ol\b|<li\b/)
})
