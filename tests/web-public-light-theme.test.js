import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const landingPagePath = resolve(repoRoot, 'apps/web/app/page.jsx')
const faqPagePath = resolve(repoRoot, 'apps/web/app/faq/page.jsx')
const supportPagePath = resolve(repoRoot, 'apps/web/app/support/page.jsx')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

const cssSource = () => readFileSync(cssPath, 'utf8')

function cssRuleFor(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = cssSource().match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))
  return match?.[1] || ''
}

function lightRuleFor(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = cssSource().match(new RegExp(`html\\[data-public-theme='light'\\] ${escapedSelector}\\s*\\{([^}]*)\\}`))
  return match?.[1] || ''
}

test('public pages share the same dark/light theme shell contract', () => {
  const landingSource = readFileSync(landingPagePath, 'utf8')
  const faqSource = readFileSync(faqPagePath, 'utf8')
  const supportSource = readFileSync(supportPagePath, 'utf8')

  assert.match(landingSource, /<main className="landing-page">/)
  assert.match(faqSource, /<main className="landing-page faq-page">/)
  assert.match(supportSource, /<main className="landing-page support-page support-template-page">/)
  assert.match(landingSource, /<LandingHeader language=\{language\} currentPath="\/" copy=\{copy\} \/>/)
  assert.match(faqSource, /<LandingHeader language=\{language\} currentPath="\/faq" copy=\{copy\} \/>/)
  assert.match(supportSource, /<LandingHeader language=\{language\} currentPath=\{currentPath\} copy=\{copy\} \/>/)
  assert.match(landingSource, /<LandingFooter language=\{language\} copy=\{copy\} \/>/)
  assert.match(faqSource, /<LandingFooter language=\{language\} copy=\{copy\} \/>/)
  assert.match(supportSource, /<LandingFooter language=\{language\} copy=\{copy\} \/>/)
})

test('public dark theme remains the default when no public theme attribute is set', () => {
  const css = cssSource()
  const landingPageRule = cssRuleFor('.landing-page')
  const headerScrolledRule = cssRuleFor('.landing-header--scrolled')
  const mobileSheetRule = cssRuleFor('.landing-mobile-menu-sheet')

  assert.match(css, /:root\s*\{[^}]*--landing-bg:\s*#08111f;/)
  assert.match(css, /:root\s*\{[^}]*--landing-surface:\s*#0d1727;/)
  assert.match(css, /:root\s*\{[^}]*--landing-copy:\s*#92a3ba;/)
  assert.match(css, /:root\s*\{[^}]*--landing-copy-soft:\s*#6f7f97;/)
  assert.match(css, /:root\s*\{[^}]*--landing-ink:\s*#f8fbff;/)
  assert.match(css, /:root\s*\{[^}]*--landing-accent:\s*#39e5b4;/)
  assert.match(css, /body\s*\{[^}]*background:\s*radial-gradient\(circle at top center, rgba\(27, 210, 255, 0\.08\), transparent 28%\), #08111f;/)
  assert.match(css, /body\s*\{[^}]*color:\s*var\(--landing-ink\);/)
  assert.match(landingPageRule, /background:\s*linear-gradient\(180deg, #08111f 0%, #091220 100%\);/)
  assert.match(headerScrolledRule, /background:\s*rgba\(8, 17, 31, 0\.86\);/)
  assert.match(mobileSheetRule, /background:\s*#08111f;/)
  assert.doesNotMatch(css, /html\[data-public-theme='dark'\]/)
})

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
  assert.match(css, /html\[data-public-theme='light'\] \.public-language-switcher\s*\{[^}]*border-color:\s*#F8FAFC;[^}]*background:\s*transparent;/)
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
  assert.match(css, /html\[data-public-theme='light'\] \.support-dashboard-input,\s*\nhtml\[data-public-theme='light'\] button\.support-dashboard-input\s*\{[^}]*background:\s*#ffffff(?:\s*!important)?;/)
  assert.match(css, /html\[data-public-theme='light'\] \.support-dashboard-textarea\s*\{[^}]*background:\s*#ffffff;/)
  assert.doesNotMatch(css, /html\[data-public-theme='light'\] \.admin-shell/)
})
