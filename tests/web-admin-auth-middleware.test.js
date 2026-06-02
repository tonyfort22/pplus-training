import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const middlewarePath = resolve(repoRoot, 'apps/web/middleware.js')

test('admin middleware gates dashboard routes and leaves auth/support routes public', () => {
  assert.ok(existsSync(middlewarePath), 'expected web middleware')

  const source = readFileSync(middlewarePath, 'utf8')

  assert.match(source, /PPLUS_ADMIN_ACCESS_TOKEN_COOKIE/)
  assert.match(source, /PUBLIC_ADMIN_PATHS\s*=\s*\[/)
  assert.match(source, /'\/admin\/login'/)
  assert.match(source, /'\/admin\/forgot-password'/)
  assert.match(source, /'\/admin\/reset-password'/)
  assert.match(source, /'\/admin\/support'/)
  assert.match(source, /'\/admin\/support\/reference'/)
  assert.match(source, /pathname\.startsWith\('\/api\/'\)/)
  assert.match(source, /isPublicAssetPath\(pathname\)/)
  assert.match(source, /'\.svg'/)
  assert.match(source, /request\.cookies\.get\(PPLUS_ADMIN_ACCESS_TOKEN_COOKIE\)\?\.value/)
  assert.match(source, /redirectUrl\.pathname = '\/admin\/login'/)
  assert.match(source, /redirectUrl\.searchParams\.set\('next', pathname \+ search\)/)
  assert.match(source, /matcher:\s*\[\s*'\/admin\/:path\*'/)
})
