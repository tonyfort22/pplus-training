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

function functionBlock(source, functionName) {
  const functionStart = source.indexOf(`function ${functionName}`)
  assert.notEqual(functionStart, -1, `${functionName} should exist`)

  const paramsStart = source.indexOf('(', functionStart)
  assert.notEqual(paramsStart, -1, `${functionName} should declare parameters`)
  let paramsDepth = 0
  let paramsEnd = -1
  for (let index = paramsStart; index < source.length; index += 1) {
    const char = source[index]
    if (char === '(') paramsDepth += 1
    if (char === ')') paramsDepth -= 1
    if (paramsDepth === 0) {
      paramsEnd = index
      break
    }
  }

  assert.notEqual(paramsEnd, -1, `${functionName} parameters should close`)
  const bodyStart = source.indexOf('{', paramsEnd)
  assert.notEqual(bodyStart, -1, `${functionName} should have a body`)

  let bodyDepth = 0
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') bodyDepth += 1
    if (char === '}') bodyDepth -= 1
    if (bodyDepth === 0) return source.slice(functionStart, index + 1)
  }

  assert.fail(`${functionName} should have a complete function body`)
}

function assertRowActionMenuUsesSafeHandoff(source, config) {
  const { componentName, rowIdExpression, actionProps } = config
  const rowActionsCell = functionBlock(source, 'RowActionsCell')

  assert.match(rowActionsCell, /isOpen = false/, `${componentName} RowActionsCell should receive parent-owned open state`)
  assert.match(rowActionsCell, /onOpenChange = \(\) => \{\}/, `${componentName} RowActionsCell should receive parent-owned open setter`)
  assert.match(rowActionsCell, /<DropdownMenu open=\{isOpen\} onOpenChange=\{onOpenChange\}>/, `${componentName} row menu should be controlled by the parent table`)

  for (const actionProp of actionProps) {
    assert.match(rowActionsCell, new RegExp(`${escapeRegex(actionProp)} = `), `${componentName} RowActionsCell should accept ${actionProp}`)
    assert.match(rowActionsCell, new RegExp(`${escapeRegex(actionProp)}[\\s\\S]*onOpenChange\\(false\\)`), `${componentName} ${actionProp} should close the menu during handoff`)
  }

  assert.doesNotMatch(rowActionsCell, /preventDefault\(\)/, `${componentName} row menu actions should not keep the dropdown portal alive with preventDefault`)
  assert.doesNotMatch(rowActionsCell, /setTimeout\(/, `${componentName} row menu actions should not use timeout-based handoff`)
  assert.doesNotMatch(rowActionsCell, /setIs\w+(?:Dialog|Sheet)Open\(true\)/, `${componentName} RowActionsCell should not open dialogs or sheets from inside the dropdown component`)

  assert.match(source, /const \[openRowActionMenuId, setOpenRowActionMenuId\] = useState\(null\)/, `${componentName} parent table should own the open row menu id`)
  assert.match(source, new RegExp(`isOpen=\\{openRowActionMenuId === ${escapeRegex(rowIdExpression)}\\}`), `${componentName} RowActionsCell usage should compare openRowActionMenuId to the row id`)
  assert.match(source, new RegExp(`setOpenRowActionMenuId\\(isOpen \\? ${escapeRegex(rowIdExpression)} : null\\)`), `${componentName} RowActionsCell usage should update parent-owned menu state`)
}

describe('admin row overflow action menu handoff source contract', () => {
  it('All Athletes row overflow actions use parent-controlled safe handoff', () => {
    assertRowActionMenuUsesSafeHandoff(readAdminComponent('athletes-data-table.jsx'), {
      componentName: 'All Athletes',
      rowIdExpression: 'row.original.id',
      actionProps: ['onEditAction', 'onSendInviteAction', 'onDeleteAction'],
    })
  })

  it('Invites row overflow actions use parent-controlled safe handoff', () => {
    assertRowActionMenuUsesSafeHandoff(readAdminComponent('invites-data-table.jsx'), {
      componentName: 'Invites',
      rowIdExpression: 'row.original.id',
      actionProps: ['onResendInvite', 'onCancelInvite'],
    })
  })

  it('Groups row overflow actions use parent-controlled safe handoff', () => {
    assertRowActionMenuUsesSafeHandoff(readAdminComponent('groups-data-table.jsx'), {
      componentName: 'Groups',
      rowIdExpression: 'row.original.id',
      actionProps: ['onEditAction', 'onDeleteAction'],
    })
  })

  it('Exercises row overflow actions use parent-controlled safe handoff', () => {
    assertRowActionMenuUsesSafeHandoff(readAdminComponent('exercises-data-table.jsx'), {
      componentName: 'Exercises',
      rowIdExpression: 'row.original.id',
      actionProps: ['onEditAction', 'onDeleteAction'],
    })
  })

  it('Programs row overflow actions use parent-controlled safe handoff', () => {
    assertRowActionMenuUsesSafeHandoff(readAdminComponent('programs-data-table.jsx'), {
      componentName: 'Programs',
      rowIdExpression: 'row.original.id',
      actionProps: ['onDuplicateAction', 'onAssignAction', 'onExportAction', 'onArchiveAction', 'onDeleteAction'],
    })
  })

  it('Workouts row overflow actions use parent-controlled safe handoff', () => {
    assertRowActionMenuUsesSafeHandoff(readAdminComponent('workouts-data-table.jsx'), {
      componentName: 'Workouts',
      rowIdExpression: 'row.original.id',
      actionProps: ['onEditAction', 'onDuplicateAction', 'onDeleteAction'],
    })
  })
})
