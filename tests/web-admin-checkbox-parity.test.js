import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'

const repoRoot = resolve(import.meta.dirname, '..')
const webRoot = resolve(repoRoot, 'apps/web')
const cssSource = readFileSync(resolve(webRoot, 'app/globals.css'), 'utf8')

const adminComponentPaths = [
  'components/admin/athletes-data-table.jsx',
  'components/admin/invites-data-table.jsx',
  'components/admin/groups-data-table.jsx',
  'components/admin/rankings-data-table.jsx',
  'components/admin/programs-data-table.jsx',
  'components/admin/workouts-data-table.jsx',
  'components/admin/exercises-data-table.jsx',
]

function getCheckboxTags(source) {
  return [...source.matchAll(/<Checkbox\b[\s\S]*?(?:\/>|>)/g)].map((match) => match[0])
}

test('admin checkbox primitive class owns the All Athletes checkbox visual style', () => {
  assert.match(cssSource, /\.ui-checkbox\.admin-shell-athletes-checkbox-input\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*appearance:\s*none;[^}]*-webkit-appearance:\s*none;[^}]*border:\s*1px solid var\(--admin-dashboard-card-border\);[^}]*border-radius:\s*3px;[^}]*background:\s*var\(--admin-dashboard-control-bg\);[^}]*background-size:\s*13px 13px;[^}]*cursor:\s*pointer;/)
  assert.match(cssSource, /\.ui-checkbox\.admin-shell-athletes-checkbox-input:checked\s*\{[^}]*border-color:\s*var\(--admin-shell-primary-button-bg\) !important;[^}]*background-color:\s*var\(--admin-shell-primary-button-bg\) !important;[^}]*background-image:\s*url\([^}]*stroke='white'[^}]*!important;/)
  assert.match(cssSource, /\.ui-checkbox\.admin-shell-athletes-checkbox-input:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--admin-shell-primary-button-bg\);[^}]*outline-offset:\s*2px;/)
})

test('every admin table and dialog Checkbox uses the shared All Athletes checkbox class', () => {
  for (const relativePath of adminComponentPaths) {
    const source = readFileSync(resolve(webRoot, relativePath), 'utf8')
    const checkboxTags = getCheckboxTags(source)
    assert.ok(checkboxTags.length > 0, `${relativePath} should keep explicit Checkbox usages covered by this parity test`)

    for (const tag of checkboxTags) {
      assert.match(
        tag,
        /className="[^"]*admin-shell-athletes-checkbox-input[^"]*"/,
        `${relativePath} has an admin Checkbox missing the shared All Athletes checkbox class:\n${tag}`,
      )
    }
  }
})
