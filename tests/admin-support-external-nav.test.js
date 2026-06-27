import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const adminNavigationPath = resolve(repoRoot, 'apps/web/components/admin/admin-navigation.js')
const adminShellPath = resolve(repoRoot, 'apps/web/components/admin/admin-shell.jsx')
const adminSupportPagePath = resolve(repoRoot, 'apps/web/app/admin/support/page.jsx')

test('admin sidebar exposes Support as an external dashboard tab', () => {
  assert.ok(existsSync(adminNavigationPath), 'admin navigation config should exist')
  assert.ok(existsSync(adminShellPath), 'admin shell should exist')
  assert.ok(existsSync(adminSupportPagePath), 'admin support dashboard page should exist')

  const navigationSource = readFileSync(adminNavigationPath, 'utf8')
  const shellSource = readFileSync(adminShellPath, 'utf8')

  assert.match(navigationSource, /id: 'support'/)
  assert.match(navigationSource, /label: 'Support'/)
  assert.match(navigationSource, /icon: 'message-circle'/)
  assert.match(navigationSource, /href: '\/admin\/support'/)
  assert.match(navigationSource, /external: true/)
  assert.match(navigationSource, /title: 'Support dashboard'/)

  assert.match(shellSource, /MessageCircle/)
  assert.match(shellSource, /'message-circle': MessageCircle/)
  assert.match(shellSource, /target=\{group\.external \? '_blank' : undefined\}/)
  assert.match(shellSource, /rel=\{group\.external \? 'noreferrer' : undefined\}/)
})
