import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const programsDataTablePath = resolve(repoRoot, 'apps/web/components/admin/programs-data-table.jsx')
const adminProgramRepositoryPath = resolve(repoRoot, 'apps/web/lib/admin-program-repository.js')

test('programs library surface uses admin light-mode tokens instead of dark-coded colors', () => {
  const programsSource = readFileSync(programsDataTablePath, 'utf8')
  const repositorySource = readFileSync(adminProgramRepositoryPath, 'utf8')

  assert.match(programsSource, /const programFilterRangeInputClassName =/)
  assert.match(programsSource, /const programFilterRangeSeparatorClassName =/)
  assert.match(programsSource, /className=\{programFilterRangeInputClassName\}/)
  assert.match(programsSource, /className=\{programFilterRangeSeparatorClassName\}/)
  assert.match(programsSource, /admin-shell-athletes-filter-trigger/)
  assert.match(programsSource, /admin-shell-athletes-pagination-bar/)
  assert.match(programsSource, /admin-shell-athletes-empty-state/)
  assert.match(programsSource, /className="grid gap-5 admin-shell-athletes-create-tabs"/)
  assert.match(programsSource, /<TabsList className="admin-shell-program-dialog-tabs-list">/)
  assert.match(programsSource, /<TabsTrigger value="details" className="admin-shell-program-dialog-tabs-trigger">Details<\/TabsTrigger>/)
  assert.match(programsSource, /<TabsTrigger value="athletes" className="admin-shell-program-dialog-tabs-trigger">Athletes<\/TabsTrigger>/)
  assert.match(programsSource, /admin-shell-athletes-status-badge admin-shell-athletes-status-badge-active/)
  assert.match(programsSource, /admin-shell-athletes-status-badge admin-shell-athletes-status-badge-inactive/)
  assert.match(programsSource, /admin-shell-athletes-status-badge admin-shell-athletes-status-badge-pending/)
  assert.match(programsSource, /admin-shell-athletes-example-pagination-button-active/)
  assert.match(programsSource, /Select one athlete from the real athlete list, or leave this program unassigned\./)
  assert.match(programsSource, /handleSelectProgramAthlete/)
  assert.match(programsSource, /handleClearProgramAthlete/)
  assert.match(programsSource, /\{ value: 'unassigned', label: 'Unassigned' \}/)
  assert.match(repositorySource, /function formatProgramTypeLabel\(row\)/)
  assert.match(repositorySource, /row\?\.athlete_id \? 'Assigned' : 'Unassigned'/)

  assert.doesNotMatch(programsSource, /bg-\[#111D30\]|bg-\[#0F1728\]|bg-\[#15233A\]/)
  assert.doesNotMatch(programsSource, /border-\[#24334A\]|!border-\[#24334A\]/)
  assert.doesNotMatch(programsSource, /text-\[#DCE6F8\]|text-\[#EEF4FF\]|text-\[#8EA0BC\]|text-\[#70809E\]/)
  assert.doesNotMatch(programsSource, /hover:bg-\[#15233A\]|hover:text-\[#EEF4FF\]/)
  assert.doesNotMatch(programsSource, /className="h-9 w-\[76px\] rounded-\[10px\] !border-\[#24334A\] bg-\[#111D30\]/)
  assert.doesNotMatch(programsSource, /className="h-24 text-center text-\[#8EA0BC\]"/)
  assert.doesNotMatch(programsSource, /<DropdownMenuItem>Assign<\/DropdownMenuItem>/)
  assert.doesNotMatch(programsSource, /<DropdownMenuItem>Archive<\/DropdownMenuItem>/)
  assert.doesNotMatch(programsSource, /handleToggleProgramAthlete/)
  assert.doesNotMatch(programsSource, /\[\.\.\.current\.athleteIds, nextAthleteId\]/)
})
