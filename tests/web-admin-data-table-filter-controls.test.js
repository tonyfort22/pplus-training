import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const repoRoot = dirname(fileURLToPath(import.meta.url)).replace(`${sep}tests`, '')
const adminComponentsDir = join(repoRoot, 'apps/web/components/admin')

const filterTableContracts = [
  {
    label: 'All Athletes',
    fileName: 'athletes-data-table.jsx',
    filterState: 'athleteFilters',
    setFilterState: 'setAthleteFilters',
    queryKey: 'athleteFilters',
    fields: 'athleteFilterFields',
    matcher: 'athleteMatchesFilters',
    emptyCopy: 'No athletes match the current filters.',
  },
  {
    label: 'Groups',
    fileName: 'groups-data-table.jsx',
    filterState: 'groupFilters',
    setFilterState: 'setGroupFilters',
    queryKey: 'groupFilters',
    fields: 'groupFilterFields',
    matcher: 'groupMatchesFilters',
    emptyCopy: 'No groups match the current filters.',
  },
  {
    label: 'Programs',
    fileName: 'programs-data-table.jsx',
    filterState: 'programFilters',
    setFilterState: 'setProgramFilters',
    queryKey: 'programFilters',
    fields: 'programFilterFields',
    matcher: 'programMatchesFilters',
    emptyCopy: 'No programs match the current filters.',
  },
  {
    label: 'Workouts',
    fileName: 'workouts-data-table.jsx',
    filterState: 'workoutFilters',
    setFilterState: 'setWorkoutFilters',
    queryKey: 'workoutFilters',
    fields: 'workoutFilterFields',
    matcher: 'workoutMatchesFilters',
    emptyCopy: 'No workouts match the current filters.',
  },
  {
    label: 'Exercises',
    fileName: 'exercises-data-table.jsx',
    filterState: 'exerciseFilters',
    setFilterState: 'setExerciseFilters',
    queryKey: 'exerciseFilters',
    fields: 'exerciseFilterFields',
    matcher: 'exerciseMatchesFilters',
    emptyCopy: 'No exercises match the current filters.',
  },
]

function readAdminComponent(fileName) {
  return readFileSync(join(adminComponentsDir, fileName), 'utf8')
}

describe('admin data-table filter controls source contract', () => {
  for (const contract of filterTableContracts) {
    it(`${contract.label} owns a route-scoped ReUI filter control`, () => {
      const source = readAdminComponent(contract.fileName)

      assert.match(source, /import \{ parseAsJson, useQueryState \} from 'nuqs'/)
      assert.match(source, /import \{[^}]*Filters[^}]*\} from '@\/components\/reui\/filters'/)
      assert.match(
        source,
        new RegExp(`const \\[${contract.filterState}, ${contract.setFilterState}\\] = useQueryState\\(\\s*['"]${contract.queryKey}['"]`),
      )
      assert.match(source, new RegExp(`(?:const|function) ${contract.fields}`))
      assert.match(source, new RegExp(`function ${contract.matcher.replace('MatchesFilters', 'MatchesFilter')}\\(`))
      assert.match(source, new RegExp(`function ${contract.matcher}\\(`))
      assert.match(source, new RegExp(`\\.filter\\(\\([^)]*\\) => ${contract.matcher}\\(`))
      assert.match(source, new RegExp(`filters=\\{(?:Array\\.isArray\\(${contract.filterState}\\) \\? ${contract.filterState} : \\[\\]|${contract.filterState})\\}`))
      assert.match(source, new RegExp(`fields=\\{${contract.fields}\\}`))
      assert.match(source, new RegExp(`onChange=\\{${contract.setFilterState}\\}`))
      assert.match(source, /admin-shell-athletes-filter-trigger[^"]*rounded-\[12px\] min-h-\[40px\] shadow-none/)
      assert.match(source, /Add filter/)
      assert.match(source, new RegExp(contract.emptyCopy.replaceAll('.', '\\.')))
    })
  }

  it('tables without filter controls do not pretend to expose Add filter', () => {
    for (const fileName of ['invites-data-table.jsx', 'rankings-data-table.jsx']) {
      const source = readAdminComponent(fileName)

      assert.doesNotMatch(source, /<Filters/)
      assert.doesNotMatch(source, /Add filter/)
      assert.doesNotMatch(source, /useQueryState\(\s*['"]filters['"]/)
    }
  })
})
