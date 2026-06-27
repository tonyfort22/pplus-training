import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const middlewarePath = resolve(repoRoot, 'apps/web/middleware.js')
const routeProtectionPath = resolve(repoRoot, 'apps/web/lib/admin-route-protection.js')

test('admin middleware gates dashboard routes and leaves auth/support routes public', () => {
  assert.ok(existsSync(middlewarePath), 'expected web middleware')
  assert.ok(existsSync(routeProtectionPath), 'expected admin route protection helpers')

  const source = readFileSync(middlewarePath, 'utf8')
  const routeProtectionSource = readFileSync(routeProtectionPath, 'utf8')

  assert.match(source, /shouldBypassAdminAuth\(request\)/)
  assert.match(source, /NextResponse\.redirect\(getAdminProtectedLoginRedirectUrl\(request\)\)/)
  assert.match(source, /matcher:\s*\[\s*'\/admin\/:path\*'/)

  assert.match(routeProtectionSource, /PPLUS_ADMIN_ACCESS_TOKEN_COOKIE/)
  assert.match(routeProtectionSource, /PUBLIC_ADMIN_PATHS\s*=\s*Object\.freeze\(\[/)
  assert.match(routeProtectionSource, /'\/admin\/login'/)
  assert.match(routeProtectionSource, /'\/admin\/forgot-password'/)
  assert.match(routeProtectionSource, /'\/admin\/reset-password'/)
  assert.match(routeProtectionSource, /'\/admin\/support'/)
  assert.match(routeProtectionSource, /'\/admin\/support\/reference'/)
  assert.match(routeProtectionSource, /pathname\.startsWith\('\/api\/'\)/)
  assert.match(routeProtectionSource, /isPublicAssetPath\(pathname\)/)
  assert.match(routeProtectionSource, /'\.svg'/)
  assert.match(routeProtectionSource, /request\.cookies\.get\(PPLUS_ADMIN_ACCESS_TOKEN_COOKIE\)\?\.value/)
  assert.match(routeProtectionSource, /redirectUrl\.pathname = '\/admin\/login'/)
  assert.match(routeProtectionSource, /redirectUrl\.searchParams\.set\('next', pathname \+ search\)/)
})
