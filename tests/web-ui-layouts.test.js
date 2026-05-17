import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sharedUiDir = resolve(repoRoot, 'apps/web/components/ui')

const componentPaths = {
  sidebarLayout: resolve(sharedUiDir, 'sidebar-layout.jsx'),
  stackedLayout: resolve(sharedUiDir, 'stacked-layout.jsx'),
  authLayout: resolve(sharedUiDir, 'auth-layout.jsx'),
}

test('phase 4 shared layouts exist with simple layout seams', () => {
  for (const path of Object.values(componentPaths)) {
    assert.ok(existsSync(path), `expected shared layout component to exist: ${path}`)
  }

  const sidebarLayoutSource = readFileSync(componentPaths.sidebarLayout, 'utf8')
  const stackedLayoutSource = readFileSync(componentPaths.stackedLayout, 'utf8')
  const authLayoutSource = readFileSync(componentPaths.authLayout, 'utf8')

  assert.match(sidebarLayoutSource, /export default function SidebarLayout/)
  assert.match(sidebarLayoutSource, /sidebar/)
  assert.match(sidebarLayoutSource, /navbar/)
  assert.match(sidebarLayoutSource, /children/)
  assert.match(sidebarLayoutSource, /ui-sidebar-layout/)

  assert.match(stackedLayoutSource, /export default function StackedLayout/)
  assert.match(stackedLayoutSource, /navbar/)
  assert.match(stackedLayoutSource, /children/)
  assert.match(stackedLayoutSource, /ui-stacked-layout/)

  assert.match(authLayoutSource, /export default function AuthLayout/)
  assert.match(authLayoutSource, /title/)
  assert.match(authLayoutSource, /description/)
  assert.match(authLayoutSource, /children/)
  assert.match(authLayoutSource, /ui-auth-layout/)
})
