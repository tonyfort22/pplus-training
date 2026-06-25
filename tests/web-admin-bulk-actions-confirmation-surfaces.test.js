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
    if (depth === 0) {
      return source.slice(bodyStart + 1, index)
    }
  }

  assert.fail(`${functionName} should have a complete function body`)
}

function dropdownItemBlockForLabel(source, label, { after = 0, expectedExpression = '' } = {}) {
  let searchIndex = after

  while (searchIndex >= 0 && searchIndex < source.length) {
    const labelIndex = source.indexOf(label, searchIndex)
    assert.notEqual(labelIndex, -1, `Bulk action item "${label}" should exist`)
    const itemStart = source.lastIndexOf('<DropdownMenuItem', labelIndex)
    const itemEnd = source.indexOf('</DropdownMenuItem>', labelIndex)
    assert.notEqual(itemStart, -1, `Bulk action item "${label}" should start with DropdownMenuItem`)
    assert.notEqual(itemEnd, -1, `Bulk action item "${label}" should close its DropdownMenuItem`)

    const block = source.slice(itemStart, itemEnd)
    if (!expectedExpression || block.includes(expectedExpression)) {
      return block
    }

    searchIndex = labelIndex + label.length
  }

  assert.fail(`Bulk action item "${label}" should call ${expectedExpression}`)
}

function bulkMenuAnchor(source, ariaLabel) {
  const index = source.indexOf(`aria-label="${ariaLabel}"`)
  assert.notEqual(index, -1, `Bulk menu ${ariaLabel} should exist`)
  return index
}

function functionOpensSurface(source, functionName, surfaceSetter, checked = new Set()) {
  if (checked.has(functionName)) return false
  checked.add(functionName)

  const body = functionBody(source, functionName)
  if (new RegExp(`${escapeRegex(surfaceSetter)}\\(true\\)`).test(body)) return true

  const delegatedCalls = [...body.matchAll(/\b((?:handle|open)[A-Z]\w+)\(/g)].map((match) => match[1])
  return delegatedCalls.some((delegatedName) => functionOpensSurface(source, delegatedName, surfaceSetter, checked))
}

function assertMenuItemOpensSurface(source, { itemLabel, opener, surfaceSetter, surfaceState, after = 0 }) {
  const openExpression = opener ?? surfaceSetter
  const menuItem = dropdownItemBlockForLabel(source, itemLabel, { after, expectedExpression: openExpression })
  assert.match(menuItem, new RegExp(`${escapeRegex(openExpression)}\\(`), `${itemLabel} should open a review/confirmation surface first`)
  assert.doesNotMatch(menuItem, /handleConfirm|handleBulkDelete|handleDeleteWorkoutTemplate|handleArchiveWorkoutTemplates|handleDeleteExercise|handleConfirmArchiveExercises|fetch\(|requestExercisesApi\(|download\w+ExportFile\(|navigator\.clipboard/, `${itemLabel} bulk menu item should not run the side effect directly`)

  if (opener) {
    assert.ok(functionOpensSurface(source, opener, surfaceSetter), `${opener} should open the confirmation surface`)
    const openerBody = functionBody(source, opener)
    assert.doesNotMatch(openerBody, /handleConfirm|fetch\(|requestExercisesApi\(|download\w+ExportFile\(|navigator\.clipboard/, `${opener} should prepare/open a surface, not run the side effect`)
  }

  if (surfaceState) {
    assert.match(source, new RegExp(`(?:<Dialog|<Sheet|<[A-Z][A-Za-z0-9]*Dialog)[\\s\\S]{0,320}open=\\{${escapeRegex(surfaceState)}\\}`), `${itemLabel} should render a controlled confirmation/review surface`)
  }
}

function assertSurfaceOwnsConfirm(source, { surfaceState, confirmHandler }) {
  const surfaceIndex = source.indexOf(`open={${surfaceState}}`)
  assert.notEqual(surfaceIndex, -1, `${surfaceState} should render a controlled confirmation/review surface`)
  const confirmIndex = source.indexOf(`{${confirmHandler}}`, surfaceIndex)
  assert.notEqual(confirmIndex, -1, `${surfaceState} should own the final side-effect confirmation handler`)
}

describe('admin bulk action side-effect confirmation surfaces source contract', () => {
  it('All Athletes bulk side effects open sheets/dialogs before mutating', () => {
    const source = readAdminComponent('athletes-data-table.jsx')
    const after = bulkMenuAnchor(source, 'Bulk actions')

    assertMenuItemOpensSurface(source, { itemLabel: 'Assign program', surfaceSetter: 'setIsAssignProgramSheetOpen', surfaceState: 'isAssignProgramSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Add to groups', surfaceSetter: 'setIsAddToGroupsSheetOpen', surfaceState: 'isAddToGroupsSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Send invite', surfaceSetter: 'setIsBulkInviteSheetOpen', surfaceState: 'isBulkInviteSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Export', surfaceSetter: 'setIsBulkExportSheetOpen', surfaceState: 'isBulkExportSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Delete', surfaceSetter: 'setIsBulkDeleteDialogOpen', surfaceState: 'isBulkDeleteDialogOpen', after })

    assertSurfaceOwnsConfirm(source, { surfaceState: 'isBulkDeleteDialogOpen', confirmHandler: 'handleBulkDeleteAthletes' })
  })

  it('Invites bulk resend/export/cancel open review surfaces before side effects', () => {
    const source = readAdminComponent('invites-data-table.jsx')
    const after = bulkMenuAnchor(source, 'Invite bulk actions')

    assertMenuItemOpensSurface(source, { itemLabel: 'Resend invites', opener: 'handleOpenBulkResendSheet', surfaceSetter: 'setIsBulkResendSheetOpen', surfaceState: 'isBulkResendSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Export invites', opener: 'handleOpenExportInvitesSheet', surfaceSetter: 'setIsExportInvitesSheetOpen', surfaceState: 'isExportInvitesSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Cancel invites', opener: 'handleOpenBulkCancelDialog', surfaceSetter: 'setIsBulkCancelDialogOpen', surfaceState: 'isBulkCancelDialogOpen', after })

    assertSurfaceOwnsConfirm(source, { surfaceState: 'isBulkResendSheetOpen', confirmHandler: 'handleConfirmBulkResendInvites' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isExportInvitesSheetOpen', confirmHandler: 'handleConfirmExportInvites' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isBulkCancelDialogOpen', confirmHandler: 'handleConfirmBulkCancelInvites' })
  })

  it('Groups bulk add/restore/export/assign/archive open review surfaces first', () => {
    const source = readAdminComponent('groups-data-table.jsx')
    const after = bulkMenuAnchor(source, 'Group bulk actions')

    assertMenuItemOpensSurface(source, { itemLabel: 'Add athletes', surfaceSetter: 'setIsAddAthletesSheetOpen', surfaceState: 'isAddAthletesSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Restore', opener: 'handleOpenRestoreGroupsSheet', surfaceSetter: 'setIsRestoreGroupsSheetOpen', surfaceState: 'isRestoreGroupsSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Export', opener: 'handleOpenExportGroupsSheet', surfaceSetter: 'setIsExportGroupsSheetOpen', surfaceState: 'isExportGroupsSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Assign program', opener: 'handleOpenAssignProgramSheet', surfaceSetter: 'setIsAssignProgramSheetOpen', surfaceState: 'isAssignProgramSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Archive', opener: 'handleOpenArchiveGroupsDialog', surfaceSetter: 'setIsArchiveGroupsDialogOpen', surfaceState: 'isArchiveGroupsDialogOpen', after })

    assertSurfaceOwnsConfirm(source, { surfaceState: 'isRestoreGroupsSheetOpen', confirmHandler: 'handleConfirmRestoreGroups' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isExportGroupsSheetOpen', confirmHandler: 'handleConfirmExportGroups' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isArchiveGroupsDialogOpen', confirmHandler: 'handleConfirmArchiveGroups' })
  })

  it('Exercises bulk assignment/export/archive/delete open review surfaces first', () => {
    const source = readAdminComponent('exercises-data-table.jsx')
    const after = bulkMenuAnchor(source, 'Exercise bulk actions')

    assertMenuItemOpensSurface(source, { itemLabel: 'Assign muscle group', opener: 'handleAssignSelectedExercisesToMuscleGroup', surfaceSetter: 'setIsAssignMuscleGroupSheetOpen', surfaceState: 'isAssignMuscleGroupSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Assign equipment', opener: 'handleAssignSelectedExercisesToEquipment', surfaceSetter: 'setIsAssignEquipmentSheetOpen', surfaceState: 'isAssignEquipmentSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Export', opener: 'handleExportSelectedExercises', surfaceSetter: 'setIsExportExerciseSheetOpen', surfaceState: 'isExportExerciseSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Archive', opener: 'handleArchiveSelectedExercises', surfaceSetter: 'setIsArchiveExerciseDialogOpen', surfaceState: 'isArchiveExerciseDialogOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Delete', opener: 'handleDeleteSelectedExercises', surfaceSetter: 'setIsExerciseDeleteDialogOpen', surfaceState: 'isExerciseDeleteDialogOpen', after })

    assertSurfaceOwnsConfirm(source, { surfaceState: 'isAssignMuscleGroupSheetOpen', confirmHandler: 'handleConfirmAssignMuscleGroup' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isAssignEquipmentSheetOpen', confirmHandler: 'handleConfirmAssignEquipment' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isExportExerciseSheetOpen', confirmHandler: 'handleConfirmExportExercises' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isArchiveExerciseDialogOpen', confirmHandler: 'handleConfirmArchiveExercises' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isExerciseDeleteDialogOpen', confirmHandler: 'handleDeleteExercise' })
  })

  it('Programs bulk assign/export/archive/delete open dialogs or sheets first', () => {
    const source = readAdminComponent('programs-data-table.jsx')
    const after = bulkMenuAnchor(source, 'Program bulk actions')

    assertMenuItemOpensSurface(source, { itemLabel: 'Assign to athletes', opener: 'handleAssignSelectedProgram', surfaceSetter: 'setIsCreateProgramDialogOpen', surfaceState: 'isCreateProgramDialogOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Export', opener: 'handleExportSelectedPrograms', surfaceSetter: 'setIsExportProgramSheetOpen', surfaceState: 'isExportProgramSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Archive', opener: 'handleOpenArchiveSelectedProgramsDialog', surfaceSetter: 'setIsArchiveProgramDialogOpen', surfaceState: 'isArchiveProgramDialogOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Delete', opener: 'handleOpenDeleteSelectedProgramsDialog', surfaceSetter: 'setIsDeleteProgramDialogOpen', surfaceState: 'isDeleteProgramDialogOpen', after })

    assertSurfaceOwnsConfirm(source, { surfaceState: 'isExportProgramSheetOpen', confirmHandler: 'handleConfirmExportPrograms' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isArchiveProgramDialogOpen', confirmHandler: 'handleArchiveProgram' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isDeleteProgramDialogOpen', confirmHandler: 'handleDeleteProgram' })
  })

  it('Workouts bulk assign/export/archive/delete open dialogs or sheets first', () => {
    const source = readAdminComponent('workouts-data-table.jsx')
    const after = bulkMenuAnchor(source, 'Workout bulk actions')

    assertMenuItemOpensSurface(source, { itemLabel: 'Assign to program', opener: 'handleAssignSelectedWorkoutsToProgram', surfaceSetter: 'setIsAssignWorkoutSheetOpen', surfaceState: 'isAssignWorkoutSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Export', opener: 'handleOpenExportSelectedWorkoutsSheet', surfaceSetter: 'setIsExportWorkoutSheetOpen', surfaceState: 'isExportWorkoutSheetOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Archive', opener: 'handleOpenArchiveSelectedWorkoutsDialog', surfaceSetter: 'setIsArchiveWorkoutDialogOpen', surfaceState: 'isArchiveWorkoutDialogOpen', after })
    assertMenuItemOpensSurface(source, { itemLabel: 'Delete', opener: 'handleOpenDeleteSelectedWorkoutsDialog', surfaceSetter: 'setIsDeleteWorkoutDialogOpen', surfaceState: 'isDeleteWorkoutDialogOpen', after })

    assertSurfaceOwnsConfirm(source, { surfaceState: 'isAssignWorkoutSheetOpen', confirmHandler: 'handleConfirmAssignSelectedWorkouts' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isExportWorkoutSheetOpen', confirmHandler: 'handleConfirmExportWorkouts' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isArchiveWorkoutDialogOpen', confirmHandler: 'handleArchiveWorkoutTemplates' })
    assertSurfaceOwnsConfirm(source, { surfaceState: 'isDeleteWorkoutDialogOpen', confirmHandler: 'handleDeleteWorkoutTemplate' })
  })

  it('Rankings still avoids fake bulk action workflows', () => {
    const source = readAdminComponent('rankings-data-table.jsx')
    assert.doesNotMatch(source, /Bulk actions/i, 'rankings-data-table.jsx should not expose bulk action workflows')
  })
})
