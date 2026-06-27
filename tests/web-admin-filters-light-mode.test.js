import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const filtersPath = resolve(repoRoot, 'apps/web/components/reui/filters.jsx')
const athletesDataTablePath = resolve(repoRoot, 'apps/web/components/admin/athletes-data-table.jsx')

test('admin ReUI filters menu and active filter chips use admin theme tokens', () => {
  const filtersSource = readFileSync(filtersPath, 'utf8')
  const athletesSource = readFileSync(athletesDataTablePath, 'utf8')

  assert.match(athletesSource, /const athleteFilterRangeInputClassName =/)
  assert.match(athletesSource, /const athleteFilterRangeSeparatorClassName =/)
  assert.match(athletesSource, /className=\{athleteFilterRangeInputClassName\}/)
  assert.match(athletesSource, /className=\{athleteFilterRangeSeparatorClassName\}/)
  assert.doesNotMatch(athletesSource, /className="h-8 w-28 !border-0 bg-\[#0F1728\] text-\[#DCE6F8\]/)

  assert.match(filtersSource, /const filterMenuContentClassName =/)
  assert.match(filtersSource, /const filterMenuItemClassName =/)
  assert.match(filtersSource, /const filterControlButtonClassName =/)
  assert.match(filtersSource, /const filterChipClassName =/)
  assert.match(filtersSource, /const filterChipLabelClassName =/)
  assert.match(filtersSource, /const filterValueShellClassName =/)
  assert.match(filtersSource, /const filterChipDividerClassName =/)
  assert.match(filtersSource, /const filterInputClassName =/)

  assert.match(filtersSource, /border-\[color:var\(--admin-dashboard-card-border\)\]/)
  assert.match(filtersSource, /border-\[color:var\(--admin-dashboard-chart-header-divider\)\]/)
  assert.match(filtersSource, /borderColor:\s*'var\(--admin-dashboard-chart-header-divider\)'/)
  assert.match(filtersSource, /bg-\[var\(--admin-dashboard-card-bg\)\]/)
  assert.match(filtersSource, /bg-\[var\(--admin-dashboard-control-bg\)\]/)
  assert.match(filtersSource, /text-\[var\(--admin-dashboard-card-text\)\]/)
  assert.match(filtersSource, /text-\[var\(--admin-dashboard-card-muted\)\]/)
  assert.match(filtersSource, /hover:bg-\[var\(--admin-shell-nav-active-bg\)\]/)
  assert.match(filtersSource, /hover:text-\[var\(--admin-shell-nav-active-text\)\]/)
  assert.match(filtersSource, /focus:bg-\[var\(--admin-shell-nav-active-bg\)\]/)
  assert.match(filtersSource, /data-\[state=open\]:bg-\[var\(--admin-shell-nav-active-bg\)\]/)

  assert.doesNotMatch(filtersSource, /bg-\[#111D30\]|bg-\[#0F1728\]|bg-\[#0d1727\]|bg-\[#15233A\]/)
  assert.doesNotMatch(filtersSource, /border-\[#24334A\]|!border-\[#24334A\]|border \!border-\[#24334A\]/)
  assert.doesNotMatch(filtersSource, /text-\[#DCE6F8\]|text-\[#EEF4FF\]|text-\[#8EA0BC\]|text-\[#70809E\]/)
  assert.doesNotMatch(filtersSource, /focus:bg-\[#15233A\]|focus:text-\[#EEF4FF\]|hover:bg-\[#15233A\]|hover:text-\[#EEF4FF\]/)
})
