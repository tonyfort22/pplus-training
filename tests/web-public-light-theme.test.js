import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

const cssSource = () => readFileSync(cssPath, 'utf8')

function lightRuleFor(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = cssSource().match(new RegExp(`html\\[data-public-theme='light'\\] ${escapedSelector}\\s*\\{([^}]*)\\}`))
  return match?.[1] || ''
}

test('public light theme exposes a shared light surface for Home, FAQ, and Support', () => {
  const css = cssSource()

  assert.match(css, /html\[data-public-theme='light'\] \.landing-page\s*\{[^}]*background:\s*#ffffff;/)
  assert.match(css, /html\[data-public-theme='light'\] \.faq-page\s*\{[^}]*background:\s*#ffffff;/)
  assert.match(css, /html\[data-public-theme='light'\] \.support-template-page\s*\{[^}]*background:\s*#ffffff;/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-page\s*\{[^}]*--landing-ink:\s*#07111f;/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-page\s*\{[^}]*--landing-copy:\s*#314155;/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-page\s*\{[^}]*--landing-copy-soft:\s*#667085;/)
})

test('public light header keeps Sign In out of the header while preserving dark nav and App Store action', () => {
  const sectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const css = cssSource()

  assert.doesNotMatch(sectionsSource, /<a className="landing-signin-link"/)
  assert.match(sectionsSource, /<PublicLanguageSwitcher language=\{language\} currentPath=\{currentPath\} \/>\s*<a className="landing-store-link landing-store-link-header"/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-header-nav\s*\{[^}]*color:\s*#111827;/)
  assert.doesNotMatch(css, /html\[data-public-theme='light'\] \.landing-signin-link/)
  assert.match(css, /html\[data-public-theme='light'\] \.public-language-switcher\s*\{[^}]*background:\s*#ffffff;/)
})

test('public light mode uses the light PPLUS logo asset in the header and footer', () => {
  const sectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const css = cssSource()

  assert.match(sectionsSource, /function LandingLogo\(\{ className = '', priority = false \} = \{\}\)/)
  assert.match(sectionsSource, /src="\/landing\/brand\/logo-ppht-landing\.png"/)
  assert.match(sectionsSource, /src="\/admin\/logo_ppht_light_mode\.svg"/)
  assert.match(sectionsSource, /<LandingLogo className="landing-logo-header" priority \/>/)
  assert.match(sectionsSource, /<LandingLogo \/>/)
  assert.match(css, /\.landing-logo-dark\s*\{[^}]*display:\s*block;/)
  assert.match(css, /\.landing-logo-light\s*\{[^}]*display:\s*none;/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-logo-dark\s*\{[^}]*display:\s*none;/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-logo-light\s*\{[^}]*display:\s*block;/)
})

test('Home light mode converts dark marketing cards into clean light cards', () => {
  const css = cssSource()

  assert.match(css, /html\[data-public-theme='light'\] \.landing-hero-icon-box\s*\{[^}]*background:\s*#ffffff;/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-feature-card\s*\{[^}]*background:\s*#ffffff;/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-feature-card\s*\{[^}]*border:\s*1px solid rgba\(15, 23, 42, 0\.08\);/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-program-card\s*\{[^}]*background:\s*#ffffff;/)
  assert.match(css, /html\[data-public-theme='light'\] \.landing-program-card\s*\{[^}]*box-shadow:\s*0 24px 60px rgba\(15, 23, 42, 0\.08\);/)
})

test('FAQ light mode matches the supplied white FAQ reference', () => {
  const css = cssSource()
  const faqTitleRule = lightRuleFor('.faq-hero-title')
  const faqItemRule = lightRuleFor('.faq-item')
  const faqSummaryRule = lightRuleFor('.faq-item summary')

  assert.match(faqTitleRule, /color:\s*#07111f;/)
  assert.match(css, /html\[data-public-theme='light'\] \.faq-hero-title span\s*\{[^}]*color:\s*var\(--landing-accent\);/)
  assert.match(faqItemRule, /border-bottom:\s*1px solid rgba\(15, 23, 42, 0\.12\);/)
  assert.match(faqSummaryRule, /color:\s*#111827;/)
  assert.match(faqSummaryRule, /font-weight:\s*650;/)
})

test('Support light mode keeps the same public light system without changing admin dashboard styling', () => {
  const css = cssSource()

  assert.match(css, /html\[data-public-theme='light'\] \.support-template-heading-on-image h2\s*\{[^}]*color:\s*#07111f;/)
  assert.match(css, /html\[data-public-theme='light'\] \.support-dashboard-input,\s*\nhtml\[data-public-theme='light'\] button\.support-dashboard-input\s*\{[^}]*background:\s*#ffffff;/)
  assert.match(css, /html\[data-public-theme='light'\] \.support-dashboard-textarea\s*\{[^}]*background:\s*#ffffff;/)
  assert.doesNotMatch(css, /html\[data-public-theme='light'\] \.admin-shell/)
})
