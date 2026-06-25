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
const publicWorkflowSpecPath = resolve(repoRoot, 'apps/web/e2e/public-support-workflows.spec.js')

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

  assert.match(cssSource, /\.public-language-switcher\s*\{[^}]*width:\s*62px;[^}]*height:\s*36px;/, 'language switcher should match public theme toggle dimensions')
  assert.match(cssSource, /\.public-language-switcher\s*\{[^}]*border:\s*1px solid #24334A;[^}]*border-radius:\s*6px;[^}]*background:\s*#111D30;/, 'language switcher should match dark public theme toggle shell')
  assert.match(cssSource, /\.public-language-switcher-option\s*\{[^}]*width:\s*31px;[^}]*height:\s*36px;/, 'language switcher text slots should match the theme toggle halves')
  assert.match(cssSource, /\.public-language-switcher-option-active\s*\{[^}]*color:\s*#06D6A0;/, 'active language text should use the same green as the active theme icon')
  assert.match(cssSource, /html\[data-public-theme='light'\] \.public-language-switcher\s*\{[^}]*border-color:\s*#F8FAFC;[^}]*background:\s*transparent;/, 'light-mode language switcher should match the light theme toggle shell')

  const switcherRule = cssSource.match(/\.public-language-switcher\s*\{[^}]*\}/)?.[0] || ''
  const optionRule = cssSource.match(/\.public-language-switcher-option\s*\{[^}]*\}/)?.[0] || ''
  const activeOptionRule = cssSource.match(/\.public-language-switcher-option-active\s*\{[^}]*\}/)?.[0] || ''
  const lightSwitcherRule = cssSource.match(/html\[data-public-theme='light'\] \.public-language-switcher\s*\{[^}]*\}/)?.[0] || ''
  assert.doesNotMatch(switcherRule, /box-shadow:/, 'language switcher shell should not have a box shadow')
  assert.doesNotMatch(optionRule, /border-radius:\s*999px/, 'language switcher should not use the old pill option styling')
  assert.doesNotMatch(activeOptionRule, /background:/, 'active language option should not use a filled pill background')
  assert.doesNotMatch(activeOptionRule, /box-shadow:/, 'active language option should not have a box shadow')
  assert.doesNotMatch(lightSwitcherRule, /box-shadow:/, 'light-mode language switcher should not have a box shadow')
})

test('public language switcher link contract stays accessible and route-preserving', () => {
  const switcherSource = readFileSync(switcherPath, 'utf8')

  assert.match(switcherSource, /<nav className="public-language-switcher" aria-label="Language">/)
  assert.match(switcherSource, /PUBLIC_LANGUAGES\.map\(\(option\) => \{/)
  assert.match(switcherSource, /const isActive = option === activeLanguage/)
  assert.match(switcherSource, /key=\{option\}/)
  assert.match(switcherSource, /href=\{getLocalizedHref\(currentPath, option\)\}/)
  assert.match(switcherSource, /aria-current=\{isActive \? 'true' : undefined\}/)
  assert.match(switcherSource, /onClick=\{\(\) => persistLanguageChoice\(option\)\}/)
  assert.doesNotMatch(switcherSource, /window\.location\.href[^\n]+onClick/, 'language click should be a normal link, not an imperative navigation handler')
})

test('public language switcher respects saved preference only when the URL has no explicit lang param', () => {
  const switcherSource = readFileSync(switcherPath, 'utf8')

  assert.match(switcherSource, /const savedLanguage = localStorage\.getItem\('pplus-public-language'\)/)
  assert.match(switcherSource, /const hasLanguageParam = new URLSearchParams\(window\.location\.search\)\.has\('lang'\)/)
  assert.match(switcherSource, /if \(!hasLanguageParam && savedLanguage && normalizePublicLanguage\(savedLanguage\) !== activeLanguage\) \{/)
  assert.match(switcherSource, /window\.location\.href = getLocalizedHref\(`\$\{window\.location\.pathname\}\$\{window\.location\.search\}\$\{window\.location\.hash\}`, savedLanguage\)/)
  assert.match(switcherSource, /localStorage\.setItem\('pplus-public-language', activeLanguage\)/)
})

test('public header passes the current public path into every language switcher instance', () => {
  const sectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const switcherUsages = sectionsSource.match(/<PublicLanguageSwitcher language=\{language\} currentPath=\{currentPath\} \/>/g) || []

  assert.equal(switcherUsages.length, 2, 'desktop and mobile header should both preserve currentPath when switching language')
  assert.doesNotMatch(sectionsSource, /<PublicLanguageSwitcher(?! language=\{language\} currentPath=\{currentPath\})/, 'language switcher should not be mounted without currentPath')
})

test('localized href helper keeps English clean and appends lang=fr for French routes', async () => {
  const { getLocalizedHref, normalizePublicLanguage } = await import('../apps/web/lib/i18n/language.js')

  assert.equal(normalizePublicLanguage(), 'en')
  assert.equal(normalizePublicLanguage('fr'), 'fr')
  assert.equal(normalizePublicLanguage('es'), 'en')

  assert.equal(getLocalizedHref('/faq', 'en'), '/faq')
  assert.equal(getLocalizedHref('/faq', 'fr'), '/faq?lang=fr')
  assert.equal(getLocalizedHref('/support?conversationId=abc', 'fr'), '/support?conversationId=abc&lang=fr')
  assert.equal(getLocalizedHref('/support?conversationId=abc#reply', 'fr'), '/support?conversationId=abc&lang=fr#reply')
  assert.equal(getLocalizedHref('/?lang=en', 'fr'), '/?lang=fr')
  assert.equal(getLocalizedHref('/faq?lang=fr', 'en'), '/faq')
  assert.equal(getLocalizedHref('/#features', 'fr'), '/?lang=fr#features')
})

test('public language preference persists across public route navigation in the browser workflow harness', () => {
  const publicWorkflowSource = readFileSync(publicWorkflowSpecPath, 'utf8')

  assert.match(publicWorkflowSource, /PUBLIC_LANGUAGE_ROUTE_NAVIGATION_WORKFLOW_CHECK/, 'public browser workflow should export a language route navigation check')
  assert.match(publicWorkflowSource, /id:\s*'public-language-route-navigation'/)
  assert.match(publicWorkflowSource, /route:\s*'\/'/)
  assert.match(publicWorkflowSource, /interaction:\s*'language-switch-persists-across-public-navigation'/)
  assert.match(publicWorkflowSource, /localStorage\.getItem\('pplus-public-language'\)/, 'browser workflow should prove the saved language key survives navigation')
  assert.match(publicWorkflowSource, /getByRole\('link', \{ name: 'FR' \}\)\.click\(\)/, 'browser workflow should switch to French through the visible language control')
  assert.match(publicWorkflowSource, /getByRole\('link', \{ name: 'FAQ' \}\)\.click\(\)/, 'browser workflow should navigate through the public FAQ link')
  assert.match(publicWorkflowSource, /getByRole\('link', \{ name: 'Support' \}\)\.click\(\)/, 'browser workflow should navigate through the public Support link')
  assert.ok(publicWorkflowSource.includes("await expect(page).toHaveURL(/\\/faq\\?lang=fr$/)"), 'browser workflow should keep lang=fr on FAQ navigation')
  assert.ok(publicWorkflowSource.includes("await expect(page).toHaveURL(/\\/support\\?lang=fr$/)"), 'browser workflow should keep lang=fr on Support navigation')
})
