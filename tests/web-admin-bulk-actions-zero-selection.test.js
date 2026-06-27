import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const repoRoot = dirname(fileURLToPath(import.meta.url)).replace(`${sep}tests`, '')
const adminComponentsDir = join(repoRoot, 'apps/web/components/admin')

function readAdminComponent(fileName) {
  return readFileSync(join(adminComponentsDir, fileName), 'utf8')
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const bulkActionContracts = [
  {
    label: 'All Athletes',
    fileName: 'athletes-data-table.jsx',
    countName: 'selectedAthleteCount',
    menuStateName: 'isBulkActionsMenuOpen',
    setterName: 'setIsBulkActionsMenuOpen',
    handlerName: 'handleBulkActionsMenuOpenChange',
    ariaLabel: 'Bulk actions',
  },
  {
    label: 'Invites',
    fileName: 'invites-data-table.jsx',
    countName: 'selectedInviteCount',
    menuStateName: 'isBulkActionsMenuOpen',
    setterName: 'setIsBulkActionsMenuOpen',
    handlerName: 'handleBulkActionsMenuOpenChange',
    ariaLabel: 'Invite bulk actions',
  },
  {
    label: 'Groups',
    fileName: 'groups-data-table.jsx',
    countName: 'selectedGroupCount',
    menuStateName: 'isBulkActionsMenuOpen',
    setterName: 'setIsBulkActionsMenuOpen',
    handlerName: 'handleBulkActionsMenuOpenChange',
    ariaLabel: 'Group bulk actions',
  },
  {
    label: 'Programs',
    fileName: 'programs-data-table.jsx',
    countName: 'selectedProgramCount',
    menuStateName: 'isBulkActionsMenuOpen',
    setterName: 'setIsBulkActionsMenuOpen',
    handlerName: 'handleBulkActionsMenuOpenChange',
    ariaLabel: 'Program bulk actions',
  },
  {
    label: 'Workouts',
    fileName: 'workouts-data-table.jsx',
    countName: 'selectedWorkoutCount',
    menuStateName: 'isBulkWorkoutMenuOpen',
    setterName: 'setIsBulkWorkoutMenuOpen',
    handlerName: 'handleBulkWorkoutMenuOpenChange',
    ariaLabel: 'Workout bulk actions',
  },
  {
    label: 'Exercises',
    fileName: 'exercises-data-table.jsx',
    countName: 'selectedExerciseCount',
    menuStateName: 'isBulkExerciseMenuOpen',
    setterName: 'setIsBulkExerciseMenuOpen',
    handlerName: 'handleBulkExerciseMenuOpenChange',
    ariaLabel: 'Exercise bulk actions',
  },
]

function assertBulkActionZeroSelectionGuard(source, contract) {
  const countPattern = new RegExp(`const ${contract.countName} = (?:table\\.getSelectedRowModel\\(\\)\\.rows\\.length|(?:selected\\w+|selected\\w+Rows)\\.length)`)
  assert.match(source, countPattern, `${contract.label} should derive selected count from TanStack selected rows`)

  const handlerPattern = new RegExp(
    `function ${contract.handlerName}\\((?:open|isOpen)\\) \\{[\\s\\S]*if \\((?:open|isOpen) && ${contract.countName} === 0\\) \\{[\\s\\S]*${contract.setterName}\\(false\\)[\\s\\S]*return[\\s\\S]*\\}[\\s\\S]*${contract.setterName}\\((?:open|isOpen)\\)`,
  )
  assert.match(source, handlerPattern, `${contract.label} should hard-block opening the bulk menu at zero selection`)

  const closeOnZeroPattern = new RegExp(
    `useEffect\\(\\(\\) => \\{[\\s\\S]*if \\(${contract.countName} === 0\\) \\{[\\s\\S]*${contract.setterName}\\(false\\)[\\s\\S]*\\}[\\s\\S]*\\}, \\[${contract.countName}\\]\\)`,
  )
  assert.match(source, closeOnZeroPattern, `${contract.label} should close the bulk menu when selection drops to zero`)

  assert.match(
    source,
    new RegExp(`<DropdownMenu[\\s\\S]{0,160}open=\\{${contract.menuStateName}(?: && ${contract.countName} > 0)?\\}[\\s\\S]{0,160}onOpenChange=\\{${contract.handlerName}\\}[\\s\\S]{0,80}>`),
    `${contract.label} should use a controlled bulk DropdownMenu`,
  )

  const triggerIndex = source.indexOf(`aria-label="${contract.ariaLabel}"`)
  assert.notEqual(triggerIndex, -1, `${contract.label} should expose a labeled bulk action trigger`)

  const triggerStart = source.lastIndexOf('<button', triggerIndex)
  const triggerEnd = source.indexOf('</button>', triggerIndex)
  assert.notEqual(triggerStart, -1, `${contract.label} bulk action trigger should be a button`)
  assert.notEqual(triggerEnd, -1, `${contract.label} bulk action trigger should close its button tag`)
  const triggerBlock = source.slice(triggerStart, triggerEnd)

  assert.match(triggerBlock, new RegExp(`disabled=\\{${contract.countName} === 0\\}`), `${contract.label} trigger should be disabled at zero selection`)
  assert.match(triggerBlock, new RegExp(`aria-disabled=\\{${contract.countName} === 0\\}`), `${contract.label} trigger should expose aria-disabled at zero selection`)
  assert.match(triggerBlock, /disabled:pointer-events-none/, `${contract.label} disabled trigger should not receive pointer events`)
  assert.match(triggerBlock, /disabled:cursor-not-allowed/, `${contract.label} disabled trigger should communicate non-interactive state`)
  assert.match(triggerBlock, /disabled:opacity-50/, `${contract.label} disabled trigger should look disabled`)
  assert.match(triggerBlock, new RegExp(`${contract.countName} > 0 \\? `), `${contract.label} trigger should show selected count when selected`)
}

describe('admin bulk actions zero-selection source contract', () => {
  for (const contract of bulkActionContracts) {
    it(`${contract.label} disables or guards bulk actions at zero selection`, () => {
      assertBulkActionZeroSelectionGuard(readAdminComponent(contract.fileName), contract)
    })
  }

  it('Rankings does not expose a fake bulk actions trigger', () => {
    const source = readAdminComponent('rankings-data-table.jsx')
    assert.doesNotMatch(source, /Bulk actions/, 'rankings-data-table.jsx should not expose a fake bulk actions trigger')
    assert.doesNotMatch(source, /bulk actions/i, 'rankings-data-table.jsx should not expose fake bulk action copy')
  })
})
