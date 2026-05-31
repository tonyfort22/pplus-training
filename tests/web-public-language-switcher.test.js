import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const switcherPath = resolve(repoRoot, 'apps/web/components/public-language-switcher.jsx')
const languagePath = resolve(repoRoot, 'apps/web/lib/i18n/language.js')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

test('public header renders an EN/FR segmented language switcher without exposing admin Sign In', () => {
  assert.ok(existsSync(switcherPath), 'expected reusable public language switcher component')
  assert.ok(existsSync(languagePath), 'expected public language helper module')

  const switcherSource = readFileSync(switcherPath, 'utf8')
  const languageSource = readFileSync(languagePath, 'utf8')
  const sectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(languageSource, /export const PUBLIC_LANGUAGES = \['en', 'fr'\]/)
  assert.match(languageSource, /export const DEFAULT_LANGUAGE = 'en'/)
  assert.match(languageSource, /export function normalizePublicLanguage/)
  assert.match(languageSource, /export function getLocalizedHref/)
  assert.match(languageSource, /URLSearchParams/)

  assert.match(switcherSource, /'use client'/)
  assert.match(switcherSource, /export default function PublicLanguageSwitcher/)
  assert.match(switcherSource, /localStorage\.setItem\('pplus-public-language'/)
  assert.match(switcherSource, /onClick=\{\(\) => persistLanguageChoice\(option\)\}/, 'language clicks should persist the clicked language before navigation')
  assert.match(switcherSource, /function persistLanguageChoice\(nextLanguage\)/, 'switcher should expose a click handler that overrides saved language')
  assert.match(switcherSource, /className="public-language-switcher"/)
  assert.match(switcherSource, /className=\{`public-language-switcher-option/)
  assert.match(switcherSource, /const languageLabels = \{[\s\S]*en: 'EN',[\s\S]*fr: 'FR',[\s\S]*\}/)
  assert.match(switcherSource, /\{languageLabels\[option\]\}/)

  assert.match(sectionsSource, /import PublicLanguageSwitcher from '\.\.\/components\/public-language-switcher'/)
  assert.match(sectionsSource, /<div className="landing-header-actions">[\s\S]*<PublicLanguageSwitcher language=\{language\} currentPath=\{currentPath\} \/>[\s\S]*<a className="landing-store-link landing-store-link-header"/)
  assert.doesNotMatch(sectionsSource, /landing-signin-link|>Sign In<\/a>/, 'admin Sign In should not appear in the public header')
  assert.match(sectionsSource, /export function LandingHeader\(\{ language = DEFAULT_LANGUAGE, currentPath = '\/', copy \} = \{\}\)/)
  assert.match(sectionsSource, /const navCopy = copy\?\.home\?\.nav \|\| \{/)

  assert.match(cssSource, /\.public-language-switcher\s*\{[^}]*display:\s*inline-grid;[^}]*grid-template-columns:\s*repeat\(2, minmax\(40px, 1fr\)\);/)
  assert.match(cssSource, /\.public-language-switcher-option\s*\{[^}]*border-radius:\s*999px;/)
  assert.match(cssSource, /\.public-language-switcher-option-active\s*\{[^}]*background:\s*var\(--landing-accent\);/)
})

test('localized href helper keeps English clean and appends lang=fr for French routes', async () => {
  const { getLocalizedHref, normalizePublicLanguage } = await import('../apps/web/lib/i18n/language.js')

  assert.equal(normalizePublicLanguage(), 'en')
  assert.equal(normalizePublicLanguage('fr'), 'fr')
  assert.equal(normalizePublicLanguage('es'), 'en')

  assert.equal(getLocalizedHref('/faq', 'en'), '/faq')
  assert.equal(getLocalizedHref('/faq', 'fr'), '/faq?lang=fr')
  assert.equal(getLocalizedHref('/support?conversationId=abc', 'fr'), '/support?conversationId=abc&lang=fr')
  assert.equal(getLocalizedHref('/?lang=en', 'fr'), '/?lang=fr')
  assert.equal(getLocalizedHref('/faq?lang=fr', 'en'), '/faq')
})
