import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = __dirname.endsWith(`${sep}tests`) ? dirname(__dirname) : __dirname

function readRepoFile(path) {
  return readFileSync(join(repoRoot, path), 'utf8')
}

const tableContracts = [
  {
    label: 'All Athletes',
    path: 'apps/web/components/admin/athletes-data-table.jsx',
    buttonClass: 'admin-shell-athletes-example-columns-button',
    iconClass: 'admin-shell-athletes-example-columns-icon',
  },
  {
    label: 'Invites',
    path: 'apps/web/components/admin/invites-data-table.jsx',
    buttonClass: 'admin-shell-invites-example-columns-button',
    iconClass: 'admin-shell-invites-example-columns-icon',
  },
  {
    label: 'Groups',
    path: 'apps/web/components/admin/groups-data-table.jsx',
    buttonClass: 'admin-shell-athletes-example-columns-button',
    iconClass: 'admin-shell-athletes-example-columns-icon',
  },
  {
    label: 'Rankings',
    path: 'apps/web/components/admin/rankings-data-table.jsx',
    buttonClass: 'admin-shell-rankings-example-columns-button',
    iconClass: 'admin-shell-rankings-example-columns-icon',
  },
  {
    label: 'Programs',
    path: 'apps/web/components/admin/programs-data-table.jsx',
    buttonClass: 'admin-shell-athletes-example-columns-button',
    iconClass: 'admin-shell-athletes-example-columns-icon',
  },
  {
    label: 'Workouts',
    path: 'apps/web/components/admin/workouts-data-table.jsx',
    buttonClass: 'admin-shell-athletes-example-columns-button',
    iconClass: 'admin-shell-athletes-example-columns-icon',
  },
  {
    label: 'Exercises',
    path: 'apps/web/components/admin/exercises-data-table.jsx',
    buttonClass: 'admin-shell-athletes-example-columns-button',
    iconClass: 'admin-shell-athletes-example-columns-icon',
  },
]

function extractColumnsDropdownBlock(source, buttonClass) {
  const buttonIndexes = Array.from(source.matchAll(new RegExp(`className="[^"]*${buttonClass}[^"]*"`, 'g')))
    .map((match) => match.index)
  const buttonIndex = buttonIndexes.find((index) => source.slice(index, index + 500).includes('Columns')) ?? -1
  assert.notEqual(buttonIndex, -1, 'Columns trigger button should include the approved class')
  const triggerIndex = source.indexOf('Columns', buttonIndex)
  assert.notEqual(triggerIndex, -1, 'Columns trigger copy should exist')

  const menuMatches = Array.from(source.matchAll(/<DropdownMenu(?:\s[^>]*)?>/g))
    .map((match) => match.index)
    .filter((index) => index < triggerIndex)
  const menuStart = menuMatches.at(-1) ?? -1
  const menuEnd = source.indexOf('</DropdownMenu>', triggerIndex)

  assert.notEqual(menuStart, -1, 'Columns control should live inside a DropdownMenu')
  assert.notEqual(menuEnd, -1, 'Columns DropdownMenu should close')

  return source.slice(menuStart, menuEnd + '</DropdownMenu>'.length)
}

describe('admin data-table Columns dropdown source contract', () => {
  for (const contract of tableContracts) {
    it(`${contract.label} owns the shared hideable Columns dropdown control`, () => {
      const source = readRepoFile(contract.path)
      const block = extractColumnsDropdownBlock(source, contract.buttonClass)

      assert.match(source, /DropdownMenuCheckboxItem/)
      assert.match(source, /const \[columnVisibility, setColumnVisibility\] = useState\(\{\}\)/)
      assert.match(source, /onColumnVisibilityChange:\s*setColumnVisibility/)
      assert.match(source, /state:\s*\{[\s\S]*columnVisibility/)

      assert.match(block, /<DropdownMenuTrigger asChild>/)
      assert.match(block, new RegExp(`<button type="button" className="[^"]*${contract.buttonClass}[^"]*">`))
      assert.match(block, /Columns/)
      assert.match(block, new RegExp(`<ChevronDown className="${contract.iconClass}" aria-hidden="true" \/>`))
      assert.match(block, /<DropdownMenuContent align="end">/)
      assert.match(block, /\.getAllColumns\(\)/)
      assert.match(block, /\.filter\(\(column\) => column\.getCanHide\(\)\)/)
      assert.match(block, /<DropdownMenuCheckboxItem/)
      assert.match(block, /key=\{column\.id\}/)
      assert.match(block, /checked=\{column\.getIsVisible\(\)\}/)
      assert.match(block, /onCheckedChange=\{\(value\) => column\.toggleVisibility\(!!value\)\}/)
      assert.match(block, /checkIconClassName="text-\[var\(--admin-shell-primary-button-bg\)\]"/)
      assert.match(block, /\{column\.columnDef\.meta\?\.label \?\? column\.id\}/)
    })
  }

  it('column definitions provide stable user-facing labels for dropdown rows', () => {
    for (const contract of tableContracts) {
      const source = readRepoFile(contract.path)
      assert.match(
        source,
        /meta:\s*\{\s*label:\s*['"][^'"]+['"]\s*\}/,
        `${contract.label} should define columnDef.meta.label values so the Columns menu is not raw ids only`,
      )
    }
  })
})
