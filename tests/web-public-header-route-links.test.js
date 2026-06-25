import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const languagePath = resolve(repoRoot, 'apps/web/lib/i18n/language.js')

function extractLandingHeaderSource(source) {
  const start = source.indexOf('export function LandingHeader')
  const end = source.indexOf('\nexport function LandingFooter')

  assert.notEqual(start, -1, 'LandingHeader export should exist')
  assert.notEqual(end, -1, 'LandingFooter export should follow LandingHeader')

  return source.slice(start, end)
}

test('public header route contract keeps desktop and mobile navigation on the same localized links', () => {
  const source = readFileSync(landingSectionsPath, 'utf8')
  const headerSource = extractLandingHeaderSource(source)

  assert.match(source, /import \{ DEFAULT_LANGUAGE, getLocalizedHref \} from '\.\.\/lib\/i18n\/language'/)
  assert.match(source, /const landingHeaderNavItems = \(navCopy, language\) => \[/, 'header should build one shared nav link contract')
  assert.match(source, /\{ key: 'features', href: getLocalizedHref\('\/#features', language\), label: navCopy\.features \}/)
  assert.match(source, /\{ key: 'program', href: getLocalizedHref\('\/#programs', language\), label: navCopy\.program \}/)
  assert.match(source, /\{ key: 'faq', href: getLocalizedHref\('\/faq', language\), label: navCopy\.faq \}/)
  assert.match(source, /\{ key: 'support', href: getLocalizedHref\('\/support', language\), label: navCopy\.support \}/)
  assert.match(headerSource, /const navItems = landingHeaderNavItems\(navCopy, language\)/, 'LandingHeader should derive links once')
  assert.match(headerSource, /<nav className="landing-header-nav" aria-label="Primary">\s*\{navItems\.map\(\(item\) => \(\s*<a key=\{item\.key\} href=\{item\.href\}>\{item\.label\}<\/a>/, 'desktop nav should render the shared route contract')
  assert.match(headerSource, /<nav className="landing-mobile-menu-nav" aria-label="Mobile primary">\s*\{navItems\.map\(\(item\) => \(\s*<SheetClose key=\{item\.key\} asChild>\s*<a className="landing-mobile-menu-link" href=\{item\.href\}>\{item\.label\}<\/a>/, 'mobile drawer nav should render the same route contract')
})

test('public header link contract keeps public shell links public and language-safe', async () => {
  const source = readFileSync(landingSectionsPath, 'utf8')
  const languageSource = readFileSync(languagePath, 'utf8')
  const headerSource = extractLandingHeaderSource(source)
  const { getLocalizedHref } = await import('../apps/web/lib/i18n/language.js')

  assert.equal(getLocalizedHref('/', 'en'), '/')
  assert.equal(getLocalizedHref('/#features', 'en'), '/#features')
  assert.equal(getLocalizedHref('/#programs', 'en'), '/#programs')
  assert.equal(getLocalizedHref('/faq', 'en'), '/faq')
  assert.equal(getLocalizedHref('/support', 'en'), '/support')
  assert.equal(getLocalizedHref('/', 'fr'), '/?lang=fr')
  assert.equal(getLocalizedHref('/#features', 'fr'), '/?lang=fr#features')
  assert.equal(getLocalizedHref('/#programs', 'fr'), '/?lang=fr#programs')
  assert.equal(getLocalizedHref('/faq', 'fr'), '/faq?lang=fr')
  assert.equal(getLocalizedHref('/support', 'fr'), '/support?lang=fr')

  assert.match(languageSource, /const \[pathWithQuery, hash = ''\] = href\.split\('#'\)/, 'localized hrefs should preserve hash anchors after the lang query')
  assert.match(headerSource, /href=\{getLocalizedHref\('\/', language\)\} className="landing-header-brand" aria-label="PPLUS Training home"/, 'header logo should route to the localized public home page')
  assert.match(headerSource, /href=\{APP_STORE_DOWNLOAD_URL\} aria-label="Download PPLUS Training on the App Store"/, 'App Store CTA should stay as the external app download')
  assert.doesNotMatch(headerSource, /href=["']\/admin|href=\{getLocalizedHref\('\/admin/, 'public header should not link to admin routes')
  assert.doesNotMatch(headerSource, /Sign In|landing-signin-link/, 'public header should not expose Sign In')
})
