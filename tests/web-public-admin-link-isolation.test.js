import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicPagePaths = [
  'apps/web/app/page.jsx',
  'apps/web/app/faq/page.jsx',
  'apps/web/app/support/page.jsx',
  'apps/web/app/landing-sections.jsx',
]
const legacyLandingContentPath = resolve(repoRoot, 'apps/web/app/landing-content.js')
const adminOnlyHrefPattern = /href:\s*['"]\/admin(?:\/|['"?#])|href=\{getLocalizedHref\(['"]\/admin|href=["']\/admin(?:\/|["'?#])/g
const adminOnlyCopyPattern = /Sign In|Connexion|landing-signin-link/g

function publicPageSource() {
  return publicPagePaths
    .map((path) => readFileSync(resolve(repoRoot, path), 'utf8'))
    .join('\n')
}

test('public page source does not expose admin-only links or sign-in copy', () => {
  const source = publicPageSource()

  assert.doesNotMatch(source, adminOnlyHrefPattern)
  assert.doesNotMatch(source, adminOnlyCopyPattern)
})

test('public home copy does not expose admin-only resource links', async () => {
  const { getPublicPageCopy } = await import('../apps/web/lib/i18n/public-page-copy.js')

  for (const language of ['en', 'fr']) {
    const homeCopy = getPublicPageCopy(language).home
    const publicLinks = [
      ...homeCopy.footer.featureLinks,
      ...homeCopy.footer.programLinks,
      ...homeCopy.footer.resourceLinks,
    ]

    assert.equal(Object.hasOwn(homeCopy.nav, 'signIn'), false, `${language} public nav should not carry sign-in copy`)
    assert.equal(publicLinks.some((link) => link.href.startsWith('/admin')), false, `${language} public footer should not link to admin routes`)
    assert.equal(publicLinks.some((link) => /sign in|connexion/i.test(link.label)), false, `${language} public footer should not expose sign-in labels`)
  }
})

test('legacy landing content fixture does not keep stale admin-only footer links', () => {
  const source = readFileSync(legacyLandingContentPath, 'utf8')

  assert.doesNotMatch(source, adminOnlyHrefPattern)
  assert.doesNotMatch(source, adminOnlyCopyPattern)
})
