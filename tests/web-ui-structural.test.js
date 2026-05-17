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

  assert.match(sidebarSource, /export default function Sidebar/)
  assert.match(sidebarSource, /items\s*=\s*\[\]/)
  assert.match(sidebarSource, /sections\s*=\s*\[\]/)
  assert.match(sidebarSource, /bottomSections\s*=\s*\[\]/)
  assert.match(sidebarSource, /searchPlaceholder/)
  assert.match(sidebarSource, /ui-sidebar/)
  assert.match(sidebarSource, /ui-sidebar-search/)
  assert.match(sidebarSource, /ui-sidebar-group/)
  assert.match(sidebarSource, /ui-sidebar-subitem/)

  assert.match(navbarSource, /export default function Navbar/)
  assert.match(navbarSource, /actions\s*=\s*null/)
  assert.match(navbarSource, /ui-navbar/)

  assert.match(dropdownSource, /export default function Dropdown/)
  assert.match(dropdownSource, /open\s*=\s*false/)
  assert.match(dropdownSource, /ui-dropdown/)

  assert.match(dialogSource, /export default function Dialog/)
  assert.match(dialogSource, /open\s*=\s*false/)
  assert.match(dialogSource, /ui-dialog/)
  assert.match(dialogSource, /title/)

  assert.match(fieldsetSource, /export default function Fieldset/)
  assert.match(fieldsetSource, /legend/)
  assert.match(fieldsetSource, /ui-fieldset/)

  assert.match(tableSource, /export default function Table/)
  assert.match(tableSource, /columns\s*=\s*\[\]/)
  assert.match(tableSource, /rows\s*=\s*\[\]/)
  assert.match(tableSource, /ui-table/)

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
