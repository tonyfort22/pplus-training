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

  assert.match(rootPageSource, /export default function HomePage\(\)/)
  assert.match(rootPageSource, /className="landing-page"/)
  assert.match(rootPageSource, /id="hero"/)
  assert.match(rootPageSource, /id="features"/)
  assert.match(rootPageSource, /id="programs"/)
  assert.match(rootPageSource, /<LandingFooter \/>/)
  assert.match(landingSectionsSource, /id="footer"/)
  assert.match(rootPageSource, /from '\.\/landing-content'/)
  assert.match(rootPageSource, /from '\.\/landing-feature-showcase'/)
  assert.match(landingSectionsSource, /<a href="\/" className="landing-header-brand" aria-label="PPLUS Training home">/)
  assert.doesNotMatch(landingSectionsSource, /<a href="#hero" className="landing-header-brand"/)
  assert.match(landingSectionsSource, /src="\/landing\/brand\/logo-ppht-landing\.png"/)
  assert.match(landingSectionsSource, /const APP_STORE_DOWNLOAD_URL = 'https:\/\/apps\.apple\.com\/'/)
  assert.match(landingSectionsSource, /<a href="\/admin\/login" className="landing-signin-link">Sign In<\/a>/)
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
  assert.match(loginPageSource, /Welcome back/)
  assert.match(loginPageSource, /Sign in/)
  assert.match(loginPageSource, /from '\.\.\/\.\.\/\.\.\/components\/admin\/ui\/admin-page-shell'/)

  assert.match(landingContentSource, /export const hero =/)
  assert.match(landingContentSource, /export const features =/)
  assert.match(landingContentSource, /export const programs =/)
  assert.match(landingContentSource, /featureLinks: features\.map\(\(feature\) => \(\{[\s\S]*label: feature\.title,[\s\S]*href: '\/#features',[\s\S]*\}\)\)/)
  assert.match(landingContentSource, /programLinks: programs\.map\(\(program\) => \(\{[\s\S]*label: program\.title,[\s\S]*href: '\/#programs',[\s\S]*\}\)\)/)
  assert.match(landingContentSource, /\{ label: 'FAQ', href: '\/#footer' \}/)
  assert.doesNotMatch(landingContentSource, /#feature-\$\{feature\.slug\}/)
  assert.doesNotMatch(landingContentSource, /href: '#features'|href: '#programs'|href: '#footer'/)
  assert.match(featureShowcaseSource, /export default function LandingFeatureShowcase/)
  assert.match(cssSource, /\.landing-page\s*\{/)
  assert.match(cssSource, /\.landing-header\s*\{/)
  assert.match(cssSource, /\.landing-hero\s*\{/)
  assert.match(cssSource, /\.landing-features-section,\s*\n\.landing-programs-section\s*\{/)
  assert.match(cssSource, /\.landing-footer\s*\{/)
})
