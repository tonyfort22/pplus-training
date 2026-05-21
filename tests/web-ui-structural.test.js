import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sharedUiDir = resolve(repoRoot, 'apps/web/components/ui')

const componentPaths = {
  sidebar: resolve(sharedUiDir, 'sidebar.jsx'),
  navbar: resolve(sharedUiDir, 'navbar.jsx'),
  dropdown: resolve(sharedUiDir, 'dropdown.jsx'),
  dialog: resolve(sharedUiDir, 'dialog.jsx'),
  fieldset: resolve(sharedUiDir, 'fieldset.jsx'),
  table: resolve(sharedUiDir, 'table.jsx'),
  pagination: resolve(sharedUiDir, 'pagination.jsx'),
  descriptionList: resolve(sharedUiDir, 'description-list.jsx'),
  alert: resolve(sharedUiDir, 'alert.jsx'),
}

test('phase 3 shared ui structural kit exists with simple api seams', () => {
  for (const path of Object.values(componentPaths)) {
    assert.ok(existsSync(path), `expected shared structural component to exist: ${path}`)
  }

  const sidebarSource = readFileSync(componentPaths.sidebar, 'utf8')
  const navbarSource = readFileSync(componentPaths.navbar, 'utf8')
  const dropdownSource = readFileSync(componentPaths.dropdown, 'utf8')
  const dialogSource = readFileSync(componentPaths.dialog, 'utf8')
  const fieldsetSource = readFileSync(componentPaths.fieldset, 'utf8')
  const tableSource = readFileSync(componentPaths.table, 'utf8')
  const paginationSource = readFileSync(componentPaths.pagination, 'utf8')
  const descriptionListSource = readFileSync(componentPaths.descriptionList, 'utf8')
  const alertSource = readFileSync(componentPaths.alert, 'utf8')

  assert.match(sidebarSource, /function SidebarProvider\(/)
  assert.match(sidebarSource, /function Sidebar\(/)
  assert.match(sidebarSource, /function SidebarTrigger\(/)
  assert.match(sidebarSource, /function SidebarRail\(/)
  assert.match(sidebarSource, /export \{[\s\S]*Sidebar,[\s\S]*SidebarProvider,[\s\S]*SidebarRail,[\s\S]*SidebarTrigger,[\s\S]*useSidebar,[\s\S]*\}/)
  assert.match(sidebarSource, /SIDEBAR_COOKIE_NAME/)
  assert.match(sidebarSource, /data-slot="sidebar"/)
  assert.match(sidebarSource, /data-slot="sidebar-trigger"/)
  assert.match(sidebarSource, /data-slot="sidebar-rail"/)

  assert.match(navbarSource, /export default function Navbar/)
  assert.match(navbarSource, /actions\s*=\s*null/)
  assert.match(navbarSource, /ui-navbar/)

  assert.match(dropdownSource, /export default function Dropdown/)
  assert.match(dropdownSource, /open\s*=\s*false/)
  assert.match(dropdownSource, /ui-dropdown/)

  assert.match(dialogSource, /function Dialog\(/)
  assert.match(dialogSource, /function DialogContent\(/)
  assert.match(dialogSource, /export \{[\s\S]*Dialog[\s\S]*DialogContent[\s\S]*DialogTitle/)
  assert.match(dialogSource, /data-slot="dialog"/)
  assert.match(dialogSource, /data-slot="dialog-content"/)
  assert.match(dialogSource, /data-slot="dialog-title"/)

  assert.match(fieldsetSource, /export default function Fieldset/)
  assert.match(fieldsetSource, /legend/)
  assert.match(fieldsetSource, /ui-fieldset/)

  assert.match(tableSource, /function Table\(/)
  assert.match(tableSource, /function TableHead\(/)
  assert.match(tableSource, /function TableCell\(/)
  assert.match(tableSource, /export \{ Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption \}/)
  assert.match(tableSource, /export default Table/)
  assert.match(tableSource, /overflow-auto/)

  assert.match(paginationSource, /export default function Pagination/)
  assert.match(paginationSource, /page\s*=\s*1/)
  assert.match(paginationSource, /totalPages\s*=\s*1/)
  assert.match(paginationSource, /ui-pagination/)

  assert.match(descriptionListSource, /export default function DescriptionList/)
  assert.match(descriptionListSource, /items\s*=\s*\[\]/)
  assert.match(descriptionListSource, /ui-description-list/)

  assert.match(alertSource, /export default function Alert/)
  assert.match(alertSource, /tone\s*=\s*'info'/)
  assert.match(alertSource, /info/)
  assert.match(alertSource, /success/)
  assert.match(alertSource, /warning/)
  assert.match(alertSource, /danger/)
  assert.match(alertSource, /ui-alert/)
})
