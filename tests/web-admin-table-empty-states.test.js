import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const repoRoot = dirname(fileURLToPath(import.meta.url)).replace(`${sep}tests`, '')
const adminComponentsDir = join(repoRoot, 'apps/web/components/admin')

const tableSurfaces = [
  {
    label: 'All Athletes',
    file: 'athletes-data-table.jsx',
    expectedDefaultCopy: 'No results.',
    expectedFilteredCopy: 'No athletes match the current filters.',
    filterState: 'athleteFilters',
    emptyClass: 'admin-shell-athletes-empty-state',
  },
  {
    label: 'Invites',
    file: 'invites-data-table.jsx',
    expectedDefaultCopy: 'No invites found.',
    expectedFilteredCopy: 'No invites match the current search.',
    filterState: 'searchQuery',
    emptyClass: 'admin-shell-invites-empty-state',
  },
  {
    label: 'Groups',
    file: 'groups-data-table.jsx',
    expectedDefaultCopy: 'No groups found.',
    expectedFilteredCopy: 'No groups match the current filters.',
    filterState: 'groupFilters',
    emptyClass: 'admin-shell-athletes-empty-state',
  },
  {
    label: 'Rankings',
    file: 'rankings-data-table.jsx',
    expectedDefaultCopy: 'No ranked athletes found.',
    expectedFilteredCopy: 'No athletes match the current ranking search.',
    filterState: 'searchQuery',
    emptyClass: 'admin-shell-athletes-empty-state',
  },
  {
    label: 'Programs',
    file: 'programs-data-table.jsx',
    expectedDefaultCopy: 'No programs found.',
    expectedFilteredCopy: 'No programs match the current filters.',
    filterState: 'programFilters',
    emptyClass: 'admin-shell-athletes-empty-state',
  },
  {
    label: 'Workouts',
    file: 'workouts-data-table.jsx',
    expectedDefaultCopy: 'No workouts found.',
    expectedFilteredCopy: 'No workouts match the current filters.',
    filterState: 'workoutFilters',
    loadingCopy: 'Loading workouts...',
    emptyClass: 'admin-shell-athletes-empty-state',
  },
  {
    label: 'Exercises',
    file: 'exercises-data-table.jsx',
    expectedDefaultCopy: 'No exercises found.',
    expectedFilteredCopy: 'No exercises match the current filters.',
    filterState: 'exerciseFilters',
    loadingCopy: 'Loading exercises...',
    emptyClass: 'admin-shell-athletes-empty-state',
  },
]

function readAdminTableSource(fileName) {
  return readFileSync(join(adminComponentsDir, fileName), 'utf8')
}

describe('admin major table empty-state source contract', () => {
  for (const tableSurface of tableSurfaces) {
    it(`${tableSurface.label} table renders a tested route-specific empty state`, () => {
      const source = readAdminTableSource(tableSurface.file)

      assert.match(source, /const emptyStateMessage =/, `${tableSurface.label} should derive one empty-state message`)
      assert.match(source, new RegExp(tableSurface.expectedDefaultCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${tableSurface.label} should own route-specific default empty copy`)
      assert.match(source, new RegExp(tableSurface.expectedFilteredCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${tableSurface.label} should own route-specific filtered/search empty copy`)
      assert.match(source, new RegExp(tableSurface.filterState), `${tableSurface.label} should branch empty copy from its search/filter state`)
      assert.match(source, /<TableCell colSpan=\{columns\.length\}/, `${tableSurface.label} empty state should span the visible table columns`)
      assert.match(source, new RegExp(`className="[^"]*${tableSurface.emptyClass}`), `${tableSurface.label} should render through the shared empty-state class`)
      assert.match(source, /\{emptyStateMessage\}/, `${tableSurface.label} should render the derived empty-state message, not hardcode it inline`)

      if (tableSurface.loadingCopy) {
        assert.match(source, new RegExp(tableSurface.loadingCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${tableSurface.label} should keep a loading empty-state row while data is loading`)
      }
    })
  }
})
