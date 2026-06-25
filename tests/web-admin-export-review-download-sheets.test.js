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

function functionBody(source, functionName) {
  const functionStart = source.indexOf(`function ${functionName}`)
  assert.notEqual(functionStart, -1, `${functionName} should exist`)
  const bodyStart = source.indexOf('{', functionStart)
  assert.notEqual(bodyStart, -1, `${functionName} should have a body`)

  let depth = 0
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth === 0) return source.slice(bodyStart + 1, index)
  }

  assert.fail(`${functionName} should have a complete function body`)
}

function blockFromIndex(source, startIndex, closingTag) {
  assert.notEqual(startIndex, -1, `${closingTag} block should exist`)
  const endIndex = source.indexOf(closingTag, startIndex)
  assert.notEqual(endIndex, -1, `${closingTag} block should close`)
  return source.slice(startIndex, endIndex + closingTag.length)
}

function sheetBlockForState(source, stateName) {
  const openIndex = source.indexOf(`open={${stateName}}`)
  assert.notEqual(openIndex, -1, `${stateName} should control an export sheet`)
  const sheetStart = source.lastIndexOf('<Sheet', openIndex)
  return blockFromIndex(source, sheetStart, '</Sheet>')
}

function dropdownItemBlockForLabel(source, label, { expectedExpression, after = 0 }) {
  let searchIndex = after
  while (searchIndex >= 0 && searchIndex < source.length) {
    const labelIndex = source.indexOf(label, searchIndex)
    assert.notEqual(labelIndex, -1, `Export menu item "${label}" should exist`)
    const itemStart = source.lastIndexOf('<DropdownMenuItem', labelIndex)
    const itemEnd = source.indexOf('</DropdownMenuItem>', labelIndex)
    assert.notEqual(itemStart, -1, `Export menu item "${label}" should start with DropdownMenuItem`)
    assert.notEqual(itemEnd, -1, `Export menu item "${label}" should close its DropdownMenuItem`)
    const block = source.slice(itemStart, itemEnd)
    if (block.includes(expectedExpression)) return block
    searchIndex = labelIndex + label.length
  }

  assert.fail(`Export menu item "${label}" should call ${expectedExpression}`)
}

function bulkMenuAnchor(source, ariaLabel) {
  const index = source.indexOf(`aria-label="${ariaLabel}"`)
  assert.notEqual(index, -1, `Bulk menu ${ariaLabel} should exist`)
  return index
}

function openerEventuallyOpensSurface(source, functionName, sheetSetter, checked = new Set()) {
  if (checked.has(functionName)) return false
  checked.add(functionName)

  const body = functionBody(source, functionName)
  if (new RegExp(`${escapeRegex(sheetSetter)}\\(true\\)`).test(body)) return true

  const delegatedCalls = [...body.matchAll(/\b((?:handle|open)[A-Z]\w+)\(/g)].map((match) => match[1])
  return delegatedCalls.some((delegatedName) => openerEventuallyOpensSurface(source, delegatedName, sheetSetter, checked))
}

function assertExportActionOpensReviewDownloadSheet(source, config) {
  const {
    menuLabel,
    opener,
    sheetSetter,
    sheetState,
    title,
    description,
    previewTitle,
    selectedRowsExpression,
    downloadHandler,
    fileNameExpression,
    menuAriaLabel,
  } = config

  const menuItem = dropdownItemBlockForLabel(source, menuLabel, { expectedExpression: opener ?? sheetSetter, after: menuAriaLabel ? bulkMenuAnchor(source, menuAriaLabel) : 0 })
  assert.match(menuItem, /event\.preventDefault\(\)/, `${menuLabel} should prevent the dropdown from performing an immediate action`)
  assert.doesNotMatch(menuItem, /download\w*ExportFile\(|build\w*ExportCsv\(|handleConfirm|handleBulkExportSubmit|link\.click\(|URL\.createObjectURL\(/, `${menuLabel} should not generate or download from the menu item`)

  if (opener) {
    const openerBody = functionBody(source, opener)
    assert.ok(openerEventuallyOpensSurface(source, opener, sheetSetter), `${opener} should open the review/download sheet`)
    assert.doesNotMatch(openerBody, /download\w*ExportFile\(|build\w*ExportCsv\(|handleConfirm|link\.click\(|URL\.createObjectURL\(/, `${opener} should only open the sheet, not download`)
  }

  const sheet = sheetBlockForState(source, sheetState)
  assert.match(sheet, /<SheetContent[\s\S]*side="right"/, `${title} should use a right-side sheet`)
  assert.match(sheet, /!max-w-\[var\(--container-lg\)\]/, `${title} should use the standard large review/download sheet width`)
  assert.match(sheet, new RegExp(`<SheetTitle[^>]*>${escapeRegex(title)}</SheetTitle>`), `${title} should be the sheet title`)
  assert.match(sheet, new RegExp(escapeRegex(description)), `${title} should explain this is a review before download`)
  assert.match(sheet, /Included (?:columns|fields)/, `${title} should show included export columns/fields before download`)
  assert.match(sheet, new RegExp(escapeRegex(previewTitle)), `${title} should show a selected-record preview before download`)
  assert.match(sheet, new RegExp(escapeRegex(selectedRowsExpression)), `${title} should preview selected rows in the sheet`)
  assert.match(sheet, new RegExp(escapeRegex(fileNameExpression)), `${title} should show or compute the export filename before download`)
  assert.match(sheet, /Download CSV/, `${title} should finish with a Download CSV action inside the sheet`)
  assert.match(sheet, new RegExp(`onClick=\\{${escapeRegex(downloadHandler)}\\}`), `${title} should own the final download handler in the sheet footer`)
}

describe('admin export actions review/download sheet source contract', () => {
  it('All Athletes export opens a review/download sheet before CSV generation', () => {
    assertExportActionOpensReviewDownloadSheet(readAdminComponent('athletes-data-table.jsx'), {
      menuLabel: 'Export',
      menuAriaLabel: 'Bulk actions',
      sheetSetter: 'setIsBulkExportSheetOpen',
      sheetState: 'isBulkExportSheetOpen',
      title: 'Export athletes',
      description: 'Review the selected athletes before downloading a CSV export.',
      previewTitle: 'Selected athletes preview',
      selectedRowsExpression: 'selectedAthletes.map',
      downloadHandler: 'handleBulkExportSubmit',
      fileNameExpression: 'bulkExportFileName',
    })
  })

  it('Invites export opens a review/download sheet before CSV generation', () => {
    assertExportActionOpensReviewDownloadSheet(readAdminComponent('invites-data-table.jsx'), {
      menuLabel: 'Export invites',
      menuAriaLabel: 'Invite bulk actions',
      opener: 'handleOpenExportInvitesSheet',
      sheetSetter: 'setIsExportInvitesSheetOpen',
      sheetState: 'isExportInvitesSheetOpen',
      title: 'Export invites',
      description: 'Review the selected invites before downloading a CSV export.',
      previewTitle: 'Selected invite preview',
      selectedRowsExpression: 'selectedInvites.map',
      downloadHandler: 'handleConfirmExportInvites',
      fileNameExpression: 'exportInvitesFileName',
    })
  })

  it('Groups export opens a review/download sheet before CSV generation', () => {
    assertExportActionOpensReviewDownloadSheet(readAdminComponent('groups-data-table.jsx'), {
      menuLabel: 'Export',
      menuAriaLabel: 'Group bulk actions',
      opener: 'handleOpenExportGroupsSheet',
      sheetSetter: 'setIsExportGroupsSheetOpen',
      sheetState: 'isExportGroupsSheetOpen',
      title: 'Export groups',
      description: 'Review the selected groups before downloading a CSV export.',
      previewTitle: 'Selected group preview',
      selectedRowsExpression: 'selectedBulkGroups.map',
      downloadHandler: 'handleConfirmExportGroups',
      fileNameExpression: 'exportGroupsFileName',
    })
  })

  it('Exercises export opens a review/download sheet before CSV generation', () => {
    assertExportActionOpensReviewDownloadSheet(readAdminComponent('exercises-data-table.jsx'), {
      menuLabel: 'Export',
      menuAriaLabel: 'Exercise bulk actions',
      opener: 'handleExportSelectedExercises',
      sheetSetter: 'setIsExportExerciseSheetOpen',
      sheetState: 'isExportExerciseSheetOpen',
      title: 'Export exercises',
      description: 'Review the selected exercises before downloading a CSV export.',
      previewTitle: 'Selected exercise preview',
      selectedRowsExpression: 'exportExercisesToReview.map',
      downloadHandler: 'handleConfirmExportExercises',
      fileNameExpression: 'exportExercisesFileName',
    })
  })

  it('Programs export opens a review/download sheet before CSV generation', () => {
    assertExportActionOpensReviewDownloadSheet(readAdminComponent('programs-data-table.jsx'), {
      menuLabel: 'Export',
      menuAriaLabel: 'Program bulk actions',
      opener: 'handleExportSelectedPrograms',
      sheetSetter: 'setIsExportProgramSheetOpen',
      sheetState: 'isExportProgramSheetOpen',
      title: 'Export programs',
      description: 'Review the selected programs before downloading a CSV export.',
      previewTitle: 'Selected program preview',
      selectedRowsExpression: 'exportProgramsToReview.map',
      downloadHandler: 'handleConfirmExportPrograms',
      fileNameExpression: 'exportProgramsFileName',
    })
  })

  it('Workouts export opens a review/download sheet before CSV generation', () => {
    assertExportActionOpensReviewDownloadSheet(readAdminComponent('workouts-data-table.jsx'), {
      menuLabel: 'Export',
      menuAriaLabel: 'Workout bulk actions',
      opener: 'handleOpenExportSelectedWorkoutsSheet',
      sheetSetter: 'setIsExportWorkoutSheetOpen',
      sheetState: 'isExportWorkoutSheetOpen',
      title: 'Export workouts',
      description: 'Review the selected workouts before downloading a CSV export.',
      previewTitle: 'Selected workout preview',
      selectedRowsExpression: 'exportWorkoutsToReview.map',
      downloadHandler: 'handleConfirmExportWorkouts',
      fileNameExpression: 'exportWorkoutsFileName',
    })
  })
})
