import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const groupsListViewPath = resolve(repoRoot, 'apps/web/components/admin/groups-list-view.jsx')
const groupsDataTablePath = resolve(repoRoot, 'apps/web/components/admin/groups-data-table.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

test('groups admin reuses light-mode admin filters and tokens without dark hardcoding', () => {
  const groupsListViewSource = readFileSync(groupsListViewPath, 'utf8')
  const groupsDataTableSource = readFileSync(groupsDataTablePath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(groupsListViewSource, /admin-shell-groups-view/)
  assert.match(groupsListViewSource, /admin-shell-groups-page-title/)
  assert.match(cssSource, /\.admin-shell-groups-view\s*\{[^}]*display:\s*grid;[^}]*gap:\s*28px;/)
  assert.match(cssSource, /\.admin-shell-groups-page-title,\s*\.admin-shell-athletes-page-title\s*\{[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.doesNotMatch(cssSource, /\.admin-shell-groups-page-title\s*\{[^}]*color:\s*#f4f7fb;/)
  assert.doesNotMatch(cssSource, /\.admin-shell-groups-row-even\s*\{[^}]*background:\s*rgba\(15, 23, 38, 0\.94\);/)
  assert.doesNotMatch(cssSource, /\.admin-shell-groups-table-card\s*\{[^}]*background:\s*rgba\(10, 18, 33, 0\.92\);/)

  assert.match(groupsDataTableSource, /from 'nuqs'/)
  assert.match(groupsDataTableSource, /import \{ Filters \} from '@\/components\/reui\/filters'/)
  assert.match(groupsDataTableSource, /const \[groupFilters, setGroupFilters\] = useQueryState\(/)
  assert.match(groupsDataTableSource, /const filteredGroups = useMemo\(\(\) => \{/)
  assert.match(groupsDataTableSource, /groupMatchesFilters\(group, normalizedFilters\)/)
  assert.match(groupsDataTableSource, /data: filteredGroups,/)
  assert.match(groupsDataTableSource, /<Filters\s+filters=\{groupFilters\}/)
  assert.match(groupsDataTableSource, /fields=\{groupFilterFields\}/)
  assert.match(groupsDataTableSource, /onChange=\{setGroupFilters\}/)
  assert.match(groupsDataTableSource, /admin-shell-athletes-filter-trigger rounded-\[12px\] min-h-\[40px\] shadow-none/)
  assert.match(groupsDataTableSource, /groupFilters\.length > 0 \? 'No groups match the current filters\.' : 'No groups found\.'/)
  assert.doesNotMatch(groupsDataTableSource, />Reset</)

  assert.doesNotMatch(groupsDataTableSource, /text-\[#8EA0BC\]/)
  assert.doesNotMatch(groupsDataTableSource, /text-\[#70809E\]/)
  assert.doesNotMatch(groupsDataTableSource, /border\s+border-\[#24334A\]/)
  assert.doesNotMatch(groupsDataTableSource, /bg-\[#0F1728\]/)
  assert.doesNotMatch(groupsDataTableSource, /bg-\[#111D30\]/)
  assert.doesNotMatch(groupsDataTableSource, /text-\[#DCE6F8\]/)
})
