import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  ADMIN_DEFAULT_DASHBOARD_PATH,
  getAdminIndexRedirectPath,
} from '../apps/web/lib/admin-route-redirects.js'

const repoRoot = resolve(import.meta.dirname, '..')
const adminIndexPagePath = resolve(repoRoot, 'apps/web/app/admin/page.jsx')
const adminUiPagePath = resolve(repoRoot, 'apps/web/app/admin/ui/page.jsx')

test('/admin redirect helper returns the canonical admin dashboard route', () => {
  assert.equal(ADMIN_DEFAULT_DASHBOARD_PATH, '/admin/dashboard')
  assert.equal(getAdminIndexRedirectPath(), '/admin/dashboard')
})

test('/admin page delegates to the canonical admin dashboard redirect helper', () => {
  assert.equal(existsSync(adminIndexPagePath), true)

  const source = readFileSync(adminIndexPagePath, 'utf8')

  assert.match(source, /import \{ redirect \} from 'next\/navigation'/)
  assert.match(source, /getAdminIndexRedirectPath/)
  assert.match(source, /redirect\(getAdminIndexRedirectPath\(\)\)/)
  assert.doesNotMatch(source, /redirect\('\/admin\/dashboard'\)/)
})

test('/admin/ui page delegates to the canonical admin dashboard redirect helper', () => {
  assert.equal(existsSync(adminUiPagePath), true)

  const source = readFileSync(adminUiPagePath, 'utf8')

  assert.match(source, /import \{ redirect \} from 'next\/navigation'/)
  assert.match(source, /getAdminIndexRedirectPath/)
  assert.match(source, /redirect\(getAdminIndexRedirectPath\(\)\)/)
  assert.doesNotMatch(source, /redirect\('\/admin\/dashboard'\)/)
})
