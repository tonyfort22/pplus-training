import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { staleNextPreviewRecoveryProcedure } from '../apps/web/testing/local-preview-recovery.js'

const repoRoot = dirname(fileURLToPath(import.meta.url)).replace(`${sep}tests`, '')
const webRoot = join(repoRoot, 'apps/web')
const appDir = join(webRoot, 'app')
const appPathRoutesManifestPath = join(webRoot, '.next/app-path-routes-manifest.json')
const serverAppPathsManifestPath = join(webRoot, '.next/server/app-paths-manifest.json')
const staticCssDir = join(webRoot, '.next/static/css')
const previewOrigin = process.env.PPLUS_WEB_PREVIEW_ORIGIN ?? 'http://127.0.0.1:3000'
const previewSmokePaths = Object.freeze([
  '/',
  '/faq',
  '/support',
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
])
const unauthenticatedProtectedAdminPaths = Object.freeze([
  '/admin',
  '/admin/dashboard',
  '/admin/athletes?tab=invites',
  '/admin/programs/program-1',
  '/admin/ui',
])
const staleNextModuleErrorPatterns = Object.freeze([
  /ChunkLoadError/i,
  /Loading chunk [^\n]+ failed/i,
  /Cannot find module ['"][^'"]*(?:_next|chunks|app-page|webpack-runtime)[^'"]*['"]/i,
  /ENOENT[^\n]+\.next/i,
  /missing required error components/i,
])
let previewAvailabilityCheck

async function isPreviewServerAvailable() {
  previewAvailabilityCheck ??= fetch(new URL('/admin/login', previewOrigin), { signal: AbortSignal.timeout(1000) })
    .then((response) => response.status < 500)
    .catch(() => false)
  return previewAvailabilityCheck
}

async function skipWhenPreviewServerUnavailable(t) {
  if (await isPreviewServerAvailable()) {
    return false
  }

  t.skip(`preview/dev server is not reachable at ${previewOrigin}`)
  return true
}

function skipWhenBuildArtifactMissing(t, path, description) {
  if (existsSync(path)) {
    return false
  }

  t.skip(`${description} is missing; run pnpm --dir apps/web build before L3 build/static checks`)
  return true
}

function readJson(path) {
  assert.equal(
    existsSync(path),
    true,
    `missing build artifact: ${relative(repoRoot, path)}; run pnpm --dir apps/web build before L3 build/static checks`,
  )
  return JSON.parse(readFileSync(path, 'utf8'))
}

function collectAppRouteEntries(dir = appDir) {
  const entries = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      entries.push(...collectAppRouteEntries(fullPath))
      continue
    }

    if (!entry.isFile() || !['page.jsx', 'route.js'].includes(entry.name)) {
      continue
    }

    const relativeAppPath = relative(appDir, fullPath).split(sep).join('/')
    const manifestKey = `/${relativeAppPath.replace(/\.(jsx|js)$/, '')}`
    const routePath = manifestKey === '/page'
      ? '/'
      : manifestKey.replace(/\/page$/, '').replace(/\/route$/, '')

    entries.push({ manifestKey, routePath })
  }

  return entries.sort((a, b) => a.manifestKey.localeCompare(b.manifestKey))
}

function collectCssBundles() {
  assert.equal(
    existsSync(staticCssDir),
    true,
    `missing CSS bundle directory: ${relative(repoRoot, staticCssDir)}; run pnpm --dir apps/web build before L3 build/static checks`,
  )

  return readdirSync(staticCssDir)
    .filter((fileName) => fileName.endsWith('.css'))
    .map((fileName) => join(staticCssDir, fileName))
    .sort()
}

function collectNextStaticAssetUrls(html, pageUrl) {
  const assetPaths = new Set()
  for (const match of html.matchAll(/\/_next\/static\/[^"'<>\s)]+\.(?:js|css)/g)) {
    assetPaths.add(match[0].replaceAll('&amp;', '&'))
  }

  return [...assetPaths]
    .sort()
    .map((assetPath) => new URL(assetPath, pageUrl))
}

function collectStylesheetUrls(html, pageUrl) {
  const stylesheetUrls = []
  const linkPattern = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi

  for (const [linkTag] of html.matchAll(linkPattern)) {
    const href = linkTag.match(/\bhref=["']([^"']+)["']/i)?.[1]
    if (href) {
      stylesheetUrls.push(new URL(href.replaceAll('&amp;', '&'), pageUrl))
    }
  }

  return stylesheetUrls
}

function assertNoStaleNextModuleErrors(body, label) {
  const matchedPattern = staleNextModuleErrorPatterns.find((pattern) => pattern.test(body))
  assert.equal(
    matchedPattern,
    undefined,
    `${label} contained stale _next module/chunk error matching ${matchedPattern}`,
  )
}

test('stale .next preview recovery procedure clears build output before rebuilding preview', () => {
  assert.equal(staleNextPreviewRecoveryProcedure.trigger, 'local preview serves broken _next chunks or module errors')
  assert.deepEqual(staleNextPreviewRecoveryProcedure.failureSignals, [
    'ChunkLoadError or Loading chunk failed in served HTML/browser output',
    "Cannot find module from .next/server, app-page, chunks, vendor-chunks, or webpack-runtime",
    'CSS or JS under /_next/static returns 400, 404, or 500 while the route HTML still loads',
  ])
  assert.deepEqual(staleNextPreviewRecoveryProcedure.resetSteps, [
    'confirm the preview port owner with lsof before killing anything',
    'kill the stale next dev/start listener for the preview port',
    'remove apps/web/.next completely',
    'rebuild with pnpm --dir apps/web build',
    'restart the preview from the current repo/app state',
    'verify the route and referenced /_next/static assets over HTTP before trusting the browser',
  ])
  assert.deepEqual(staleNextPreviewRecoveryProcedure.commands, [
    'lsof -iTCP:<port> -sTCP:LISTEN -n -P',
    'kill <pid>',
    'rm -rf apps/web/.next',
    'pnpm --dir apps/web build',
    'pnpm --dir apps/web exec next start -H 127.0.0.1 -p <port>',
  ])
})

test('Next build output includes every expected app page and route path', (t) => {
  if (skipWhenBuildArtifactMissing(t, appPathRoutesManifestPath, relative(repoRoot, appPathRoutesManifestPath))) return

  const appPathRoutesManifest = readJson(appPathRoutesManifestPath)
  const expectedEntries = collectAppRouteEntries()
  const missingEntries = expectedEntries.filter(
    ({ manifestKey, routePath }) => appPathRoutesManifest[manifestKey] !== routePath,
  )

  assert.deepEqual(
    missingEntries,
    [],
    `build output missing expected app routes: ${missingEntries.map(({ manifestKey, routePath }) => `${manifestKey} -> ${routePath}`).join(', ')}`,
  )
})

test('Next server app-paths build output points emitted app routes to compiled server artifacts', (t) => {
  if (skipWhenBuildArtifactMissing(t, serverAppPathsManifestPath, relative(repoRoot, serverAppPathsManifestPath))) return

  const serverAppPathsManifest = readJson(serverAppPathsManifestPath)
  const unexpectedTargets = Object.entries(serverAppPathsManifest).filter(([, target]) => !target.startsWith('app/'))
  const missingArtifacts = Object.entries(serverAppPathsManifest).filter(([, target]) => !existsSync(join(webRoot, '.next/server', target)))

  assert.notEqual(
    Object.keys(serverAppPathsManifest).length,
    0,
    `server app-paths manifest should include emitted app routes in ${relative(repoRoot, serverAppPathsManifestPath)}`,
  )
  assert.deepEqual(
    unexpectedTargets,
    [],
    `server build output had unexpected app route targets: ${unexpectedTargets.map(([manifestKey, target]) => `${manifestKey} -> ${target}`).join(', ')}`,
  )
  assert.deepEqual(
    missingArtifacts,
    [],
    `server build output points to missing compiled artifacts: ${missingArtifacts.map(([manifestKey, target]) => `${manifestKey} -> ${target}`).join(', ')}`,
  )
})

test('Next build output includes non-empty CSS bundle files', (t) => {
  if (skipWhenBuildArtifactMissing(t, staticCssDir, relative(repoRoot, staticCssDir))) return

  const cssBundles = collectCssBundles()
  const emptyCssBundles = cssBundles.filter((cssBundle) => statSync(cssBundle).size <= 0)

  assert.notEqual(cssBundles.length, 0, `missing CSS bundle files in ${relative(repoRoot, staticCssDir)}`)
  assert.deepEqual(
    emptyCssBundles,
    [],
    `CSS bundle files should not be empty: ${emptyCssBundles.map((cssBundle) => relative(repoRoot, cssBundle)).join(', ')}`,
  )
})

test('running web preview/dev server can fetch every CSS bundle', async (t) => {
  if (await skipWhenPreviewServerUnavailable(t)) return

  const cssBundles = collectCssBundles()
  assert.notEqual(cssBundles.length, 0, `missing CSS bundle files in ${relative(repoRoot, staticCssDir)}`)

  for (const cssBundle of cssBundles) {
    const bundlePath = relative(join(webRoot, '.next'), cssBundle).split(sep).join('/')
    const bundleUrl = new URL(`/_next/${bundlePath}`, previewOrigin)
    const response = await fetch(bundleUrl)
    const body = await response.text()

    assert.equal(response.status, 200, `expected ${bundleUrl.toString()} to return 200, got ${response.status}`)
    assert.match(
      response.headers.get('content-type') ?? '',
      /text\/css/,
      `expected ${bundleUrl.toString()} to return text/css`,
    )
    assert.equal(
      body.length,
      statSync(cssBundle).size,
      `expected fetched CSS length to match build artifact size for ${bundleUrl.toString()}`,
    )
  }
})

test('/admin/login returns styled HTML with stylesheet links', async (t) => {
  if (await skipWhenPreviewServerUnavailable(t)) return

  const pageUrl = new URL('/admin/login', previewOrigin)
  const response = await fetch(pageUrl)
  const html = await response.text()

  assert.equal(response.status, 200, `expected ${pageUrl.toString()} to return 200, got ${response.status}`)
  assert.match(
    response.headers.get('content-type') ?? '',
    /text\/html/,
    `expected ${pageUrl.toString()} to return text/html`,
  )
  assert.match(html, /<!DOCTYPE html>|<html\b/i, `expected ${pageUrl.toString()} to return HTML markup`)
  assert.match(html, /<form\b/i, `expected ${pageUrl.toString()} to include the login form markup`)

  const stylesheetUrls = collectStylesheetUrls(html, pageUrl)
  assert.notEqual(stylesheetUrls.length, 0, `expected ${pageUrl.toString()} to include stylesheet <link> tags`)

  for (const stylesheetUrl of stylesheetUrls) {
    const stylesheetResponse = await fetch(stylesheetUrl)
    await stylesheetResponse.arrayBuffer()
    assert.equal(
      stylesheetResponse.status,
      200,
      `expected stylesheet ${stylesheetUrl.toString()} linked by ${pageUrl.toString()} to return 200, got ${stylesheetResponse.status}`,
    )
    assert.match(
      stylesheetResponse.headers.get('content-type') ?? '',
      /text\/css/,
      `expected stylesheet ${stylesheetUrl.toString()} linked by ${pageUrl.toString()} to return text/css`,
    )
  }
})

test('protected admin routes redirect unauthenticated users cleanly to login', async (t) => {
  if (await skipWhenPreviewServerUnavailable(t)) return

  for (const protectedPath of unauthenticatedProtectedAdminPaths) {
    const protectedUrl = new URL(protectedPath, previewOrigin)
    const response = await fetch(protectedUrl, { redirect: 'manual' })
    await response.arrayBuffer()

    assert.equal(
      response.status,
      307,
      `expected unauthenticated ${protectedUrl.toString()} to redirect with 307, got ${response.status}`,
    )

    const location = response.headers.get('location')
    assert.ok(location, `expected unauthenticated ${protectedUrl.toString()} to include a Location header`)

    const redirectUrl = new URL(location, protectedUrl)
    assert.equal(
      redirectUrl.protocol,
      protectedUrl.protocol,
      `expected ${protectedUrl.toString()} to keep the redirect protocol local to the preview server`,
    )
    assert.equal(
      redirectUrl.port,
      protectedUrl.port,
      `expected ${protectedUrl.toString()} to keep the redirect on the same preview port`,
    )
    assert.ok(
      ['127.0.0.1', 'localhost'].includes(redirectUrl.hostname),
      `expected ${protectedUrl.toString()} to redirect to the local preview host, got ${redirectUrl.hostname}`,
    )
    assert.equal(
      redirectUrl.pathname,
      '/admin/login',
      `expected ${protectedUrl.toString()} to redirect to /admin/login`,
    )
    assert.equal(
      redirectUrl.searchParams.get('next'),
      `${protectedUrl.pathname}${protectedUrl.search}`,
      `expected ${protectedUrl.toString()} redirect to preserve next path/query`,
    )

    const loginResponse = await fetch(redirectUrl)
    const loginHtml = await loginResponse.text()
    assert.equal(loginResponse.status, 200, `expected redirected login URL ${redirectUrl.toString()} to return 200`)
    assert.match(loginHtml, /<form\b/i, `expected redirected login URL ${redirectUrl.toString()} to render the login form`)
  }
})

test('running web preview/dev server has no stale _next module or chunk errors', async (t) => {
  if (await skipWhenPreviewServerUnavailable(t)) return

  const checkedAssetUrls = new Set()

  for (const smokePath of previewSmokePaths) {
    const pageUrl = new URL(smokePath, previewOrigin)
    const response = await fetch(pageUrl)
    const body = await response.text()

    assert.equal(response.status, 200, `expected ${pageUrl.toString()} to return 200, got ${response.status}`)
    assertNoStaleNextModuleErrors(body, pageUrl.toString())

    const assetUrls = collectNextStaticAssetUrls(body, pageUrl)
    assert.notEqual(assetUrls.length, 0, `expected ${pageUrl.toString()} to reference _next static assets`)

    for (const assetUrl of assetUrls) {
      const assetUrlString = assetUrl.toString()
      if (checkedAssetUrls.has(assetUrlString)) {
        continue
      }
      checkedAssetUrls.add(assetUrlString)

      const assetResponse = await fetch(assetUrl)
      await assetResponse.arrayBuffer()
      assert.equal(assetResponse.status, 200, `expected ${assetUrlString} referenced by ${pageUrl.toString()} to return 200, got ${assetResponse.status}`)
    }
  }

  assert.notEqual(checkedAssetUrls.size, 0, 'expected smoke pages to reference fetchable _next static assets')
})
