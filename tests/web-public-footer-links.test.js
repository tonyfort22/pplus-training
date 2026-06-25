import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')

function extractLandingFooterSource(source) {
  const start = source.indexOf('export function LandingFooter')

  assert.notEqual(start, -1, 'LandingFooter export should exist')

  return source.slice(start)
}

test('public footer renders every footer column link through the shared localized href helper', () => {
  const source = readFileSync(landingSectionsPath, 'utf8')
  const footerSource = extractLandingFooterSource(source)

  assert.match(source, /function FooterLinkColumn\(\{ title, links, language \}\) \{/, 'footer columns should share one link renderer')
  assert.match(source, /links\.map\(\(link\) => \(/, 'footer columns should render every configured link')
  assert.match(source, /<a href=\{getLocalizedHref\(link\.href, language\)\}>\{link\.label\}<\/a>/, 'footer links should all use the localized href helper')
  assert.match(footerSource, /<FooterLinkColumn title=\{footerCopy\.columnTitles\?\.features \|\| 'Features'\} links=\{footerCopy\.featureLinks\} language=\{language\} \/>/)
  assert.match(footerSource, /<FooterLinkColumn title=\{footerCopy\.columnTitles\?\.programs \|\| 'Programs'\} links=\{footerCopy\.programLinks\} language=\{language\} \/>/)
  assert.match(footerSource, /<FooterLinkColumn title=\{footerCopy\.columnTitles\?\.resources \|\| 'Resources'\} links=\{footerCopy\.resourceLinks\} language=\{language\} \/>/)
})

test('public footer contact links keep external maps safe and phone/mail honest', async () => {
  const source = readFileSync(landingSectionsPath, 'utf8')
  const footerSource = extractLandingFooterSource(source)
  const { getPublicPageCopy } = await import('../apps/web/lib/i18n/public-page-copy.js')

  assert.match(footerSource, /href=\{item\.href\}/)
  assert.match(footerSource, /target=\{item\.external \? '_blank' : undefined\}/)
  assert.match(footerSource, /rel=\{item\.external \? 'noopener noreferrer' : undefined\}/)
  assert.match(footerSource, /<span key=\{item\.text\} className="landing-footer-contact-item">/, 'contact rows without href should render as text, not fake links')

  const contact = getPublicPageCopy('en').home.footer.contact
  assert.deepEqual(contact.map((item) => item.icon), ['map-pin', 'phone', 'mail'])
  assert.equal(contact[0].href, 'https://www.google.com/maps/search/?api=1&query=80%20boulevard%20Brien%2C%20Repentigny%2C%20QC')
  assert.equal(contact[0].external, true)
  assert.match(contact[1].href, /^tel:\+1\d{10}$/)
  assert.equal(contact[1].href.endsWith('2722'), true)
  assert.equal(Object.hasOwn(contact[2], 'href'), false)
})

test('public footer link data stays complete for English and Canadian French', async () => {
  const { getPublicPageCopy } = await import('../apps/web/lib/i18n/public-page-copy.js')

  for (const language of ['en', 'fr']) {
    const footer = getPublicPageCopy(language).home.footer

    assert.equal(footer.featureLinks.length, 4, `${language} footer should expose four feature links`)
    assert.equal(footer.programLinks.length, 3, `${language} footer should expose three program links`)
    assert.equal(footer.resourceLinks.length, 2, `${language} footer should expose two public resource links`)
    assert.deepEqual(footer.featureLinks.map((link) => link.href), ['/#features', '/#features', '/#features', '/#features'])
    assert.deepEqual(footer.programLinks.map((link) => link.href), ['/#programs', '/#programs', '/#programs'])
    assert.deepEqual(footer.resourceLinks.map((link) => link.href), ['/support', '/faq'])
    assert.equal(new Set([...footer.featureLinks, ...footer.programLinks, ...footer.resourceLinks].map((link) => link.label)).size, 9)
  }

  assert.deepEqual(getPublicPageCopy('en').home.footer.columnTitles, {
    features: 'Features',
    programs: 'Programs',
    resources: 'Resources',
  })
  assert.deepEqual(getPublicPageCopy('fr').home.footer.columnTitles, {
    features: 'Fonctionnalités',
    programs: 'Programmes',
    resources: 'Ressources',
  })
})

test('public footer links resolve language-safe public anchors and resource routes', async () => {
  const { getPublicPageCopy } = await import('../apps/web/lib/i18n/public-page-copy.js')
  const { getLocalizedHref } = await import('../apps/web/lib/i18n/language.js')
  const englishLinks = getPublicPageCopy('en').home.footer
  const frenchLinks = getPublicPageCopy('fr').home.footer

  assert.deepEqual(englishLinks.featureLinks.map((link) => getLocalizedHref(link.href, 'en')), ['/#features', '/#features', '/#features', '/#features'])
  assert.deepEqual(englishLinks.programLinks.map((link) => getLocalizedHref(link.href, 'en')), ['/#programs', '/#programs', '/#programs'])
  assert.deepEqual(englishLinks.resourceLinks.map((link) => getLocalizedHref(link.href, 'en')), ['/support', '/faq'])

  assert.deepEqual(frenchLinks.featureLinks.map((link) => getLocalizedHref(link.href, 'fr')), ['/?lang=fr#features', '/?lang=fr#features', '/?lang=fr#features', '/?lang=fr#features'])
  assert.deepEqual(frenchLinks.programLinks.map((link) => getLocalizedHref(link.href, 'fr')), ['/?lang=fr#programs', '/?lang=fr#programs', '/?lang=fr#programs'])
  assert.deepEqual(frenchLinks.resourceLinks.map((link) => getLocalizedHref(link.href, 'fr')), ['/support?lang=fr', '/faq?lang=fr'])
}
)
