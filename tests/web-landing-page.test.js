import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const rootPagePath = resolve(repoRoot, 'apps/web/app/page.jsx')
const loginPagePath = resolve(repoRoot, 'apps/web/app/admin/login/page.jsx')
const landingContentPath = resolve(repoRoot, 'apps/web/app/landing-content.js')
const landingFeatureShowcasePath = resolve(repoRoot, 'apps/web/app/landing-feature-showcase.jsx')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')
const landingLogoPath = resolve(repoRoot, 'apps/web/public/landing/brand/logo-ppht-landing.png')
const appStoreBadgePath = resolve(repoRoot, 'apps/web/public/landing/brand/app-store-badge.svg')

test('web root serves the marketing landing page and admin login lives at /admin/login', () => {
  for (const path of [
    rootPagePath,
    loginPagePath,
    landingContentPath,
    landingFeatureShowcasePath,
    landingSectionsPath,
    landingLogoPath,
    appStoreBadgePath,
  ]) {
    assert.ok(existsSync(path), `expected landing/login file to exist: ${path}`)
  }

  const rootPageSource = readFileSync(rootPagePath, 'utf8')
  const loginPageSource = readFileSync(loginPagePath, 'utf8')
  const landingContentSource = readFileSync(landingContentPath, 'utf8')
  const featureShowcaseSource = readFileSync(landingFeatureShowcasePath, 'utf8')
  const landingSectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(rootPageSource, /export default async function HomePage\(\{ searchParams \}\)/)
  assert.match(rootPageSource, /const resolvedSearchParams = await searchParams/)
  assert.match(rootPageSource, /const language = normalizePublicLanguage\(resolvedSearchParams\?\.lang\)/)
  assert.match(rootPageSource, /className="landing-page"/)
  assert.match(rootPageSource, /id="hero"/)
  assert.match(rootPageSource, /id="features"/)
  assert.match(rootPageSource, /id="programs"/)
  assert.match(rootPageSource, /<LandingHeader language=\{language\} currentPath="\/" copy=\{copy\} \/>/)
  assert.match(rootPageSource, /<LandingFooter language=\{language\} copy=\{copy\} \/>/)
  assert.match(landingSectionsSource, /id="footer"/)
  assert.match(landingSectionsSource, /export function LandingFooter\(\{ language = DEFAULT_LANGUAGE, copy \} = \{\}\)/)
  assert.match(landingSectionsSource, /<a href=\{getLocalizedHref\(link\.href, language\)\}>\{link\.label\}<\/a>/)
  assert.match(rootPageSource, /from '\.\.\/lib\/i18n\/public-page-copy'/)
  assert.doesNotMatch(rootPageSource, /from '\.\/landing-content'/)
  assert.match(rootPageSource, /from '\.\/landing-feature-showcase'/)
  assert.match(landingSectionsSource, /<a href=\{getLocalizedHref\('\/', language\)\} className="landing-header-brand" aria-label="PPLUS Training home">/)
  assert.doesNotMatch(landingSectionsSource, /<a href="#hero" className="landing-header-brand"/)
  assert.match(landingSectionsSource, /src="\/landing\/brand\/logo-ppht-landing\.png"/)
  assert.match(landingSectionsSource, /const APP_STORE_DOWNLOAD_URL = 'https:\/\/apps\.apple\.com\/'/)
  assert.doesNotMatch(landingSectionsSource, /className="landing-signin-link"/, 'admin Sign In should not appear in the public header')
  assert.match(rootPageSource, /href=\{APP_STORE_DOWNLOAD_URL\}/)
  assert.match(landingSectionsSource, /href=\{APP_STORE_DOWNLOAD_URL\}/)
  assert.match(rootPageSource, /aria-label="Download PPLUS Training on the App Store"/)
  assert.match(landingSectionsSource, /aria-label="Download PPLUS Training on the App Store"/)
  assert.doesNotMatch(rootPageSource, /Learn more/)
  assert.doesNotMatch(rootPageSource, /landing-program-link/)
  assert.doesNotMatch(rootPageSource, /ArrowRight/)
  assert.doesNotMatch(rootPageSource, /admin-auth-frame/)
  assert.doesNotMatch(rootPageSource, /Welcome back/)

  assert.match(loginPageSource, /className="admin-auth-frame"/)
  assert.match(loginPageSource, /const loginCopy = copy\.login/)
  assert.match(loginPageSource, /\{loginCopy\.form\.title\}/)
  assert.match(loginPageSource, /\{loginCopy\.form\.submit\}/)
  assert.match(loginPageSource, /from '\.\.\/\.\.\/\.\.\/components\/admin\/ui\/admin-page-shell'/)

  assert.match(landingContentSource, /export const hero =/)
  assert.match(landingContentSource, /export const features =/)
  assert.match(landingContentSource, /export const programs =/)
  assert.match(landingContentSource, /featureLinks: features\.map\(\(feature\) => \(\{[\s\S]*label: feature\.title,[\s\S]*href: '\/#features',[\s\S]*\}\)\)/)
  assert.match(landingContentSource, /programLinks: programs\.map\(\(program\) => \(\{[\s\S]*label: program\.title,[\s\S]*href: '\/#programs',[\s\S]*\}\)\)/)
  assert.match(landingContentSource, /\{ label: 'FAQ', href: '\/faq' \}/)
  assert.match(landingContentSource, /\{ label: 'Sign In', href: '\/admin\/login' \}/, 'admin Sign In should live in the footer Resources column')
  assert.doesNotMatch(landingContentSource, /#feature-\$\{feature\.slug\}/)
  assert.doesNotMatch(landingContentSource, /href: '#features'|href: '#programs'|href: '#footer'/)
  assert.match(featureShowcaseSource, /export default function LandingFeatureShowcase/)
  assert.match(cssSource, /\.landing-page\s*\{/)
  assert.match(cssSource, /\.landing-header\s*\{/)
  assert.match(cssSource, /\.landing-hero\s*\{/)
  assert.match(cssSource, /\.landing-features-section,\s*\n\.landing-programs-section\s*\{/)
  assert.match(cssSource, /\.landing-footer\s*\{/)
})

test('public footer logo, address, and phone have the expected link behavior', () => {
  const landingSectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const landingContentSource = readFileSync(landingContentPath, 'utf8')

  assert.match(landingSectionsSource, /<a href=\{getLocalizedHref\('\/', language\)\} className="landing-footer-logo-link" aria-label="PPLUS Training home">\s*<LandingLogo \/>\s*<\/a>/)
  assert.match(landingSectionsSource, /href=\{item\.href\}/)
  assert.match(landingSectionsSource, /target=\{item\.external \? '_blank' : undefined\}/)
  assert.match(landingSectionsSource, /rel=\{item\.external \? 'noopener noreferrer' : undefined\}/)
  assert.match(landingContentSource, /icon: 'map-pin', text: '80 boulevard Brien, Repentigny, QC', href: 'https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=80%20boulevard%20Brien%2C%20Repentigny%2C%20QC', external: true/)
  assert.match(landingContentSource, /icon: 'phone', text: '\(514\) 915-2722', href: 'tel:\+15149152722'/)
})
