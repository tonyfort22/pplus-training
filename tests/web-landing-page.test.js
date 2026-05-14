import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const landingContentPath = resolve(repoRoot, 'apps/web/app/landing-content.js')
const pagePath = resolve(repoRoot, 'apps/web/app/page.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

test('web landing page source exports the locked content model', async () => {
  assert.equal(existsSync(landingContentPath), true, 'expected landing-content.js to exist')

  const landingContent = await import(landingContentPath)

  assert.equal(landingContent.hero.pill, 'The Best Hockey Training App')
  assert.equal(landingContent.hero.eyebrow, 'ELITE HOCKEY TRAINING')
  assert.match(landingContent.hero.heading, /Off-Ice Work/)
  assert.equal(landingContent.features.length, 4)
  assert.deepEqual(landingContent.features.map((feature) => feature.title), [
    'Training Programs',
    'Workout Tracking',
    'Progress Tracking',
    'Recovery Insights',
  ])
  assert.deepEqual(landingContent.programs.map((program) => program.title), [
    'P+ Off-Season',
    'P+ Skills',
    'P+ Advanced',
  ])
})

test('web landing page source matches the wireframe seams and responsive dark layout', () => {
  const pageSource = readFileSync(pagePath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(pageSource, /<header className="landing-header"/)
  assert.match(pageSource, /Program/)
  assert.match(pageSource, /Features/)
  assert.match(pageSource, /Support/)
  assert.match(pageSource, /Sign In/)
  assert.match(pageSource, /id="hero"/)
  assert.match(pageSource, /id="features"/)
  assert.match(pageSource, /id="programs"/)
  assert.match(pageSource, /footer/i)
  assert.match(pageSource, /landing-hero-icon-cloud/)
  assert.match(pageSource, /landing-hero-icon-box/)
  assert.match(pageSource, /landing-feature-showcase/i)
  assert.match(pageSource, /app-store-badge\.svg/)
  assert.match(pageSource, /logo-ppht-landing\.png/)

  assert.match(cssSource, /--landing-bg:\s*#08111f/i)
  assert.match(cssSource, /\.landing-shell\s*\{[\s\S]*display:\s*grid;[\s\S]*row-gap:\s*32px;/)
  assert.match(cssSource, /\.landing-header/)
  assert.match(cssSource, /\.landing-hero-inner/)
  assert.match(cssSource, /\.landing-hero-icon-cloud/)
  assert.match(cssSource, /\.landing-program-grid\s*\{/)
  assert.match(cssSource, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(cssSource, /@media\s*\(max-width:\s*900px\)/)
  assert.match(cssSource, /@media\s*\(max-width:\s*640px\)/)
})

test('hero section source applies the requested v1 hero fixes only', () => {
  const pageSource = readFileSync(pagePath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')
  const webPackageSource = readFileSync(resolve(repoRoot, 'apps/web/package.json'), 'utf8')

  assert.match(webPackageSource, /"lucide-react"/)
  assert.match(pageSource, /from 'lucide-react'/)
  assert.match(pageSource, /Dumbbell/)
  assert.match(pageSource, /Flame/)
  assert.match(pageSource, /Zap/)
  assert.match(pageSource, /Trophy/)
  assert.match(pageSource, /Users/)
  assert.match(pageSource, /Medal/)
  assert.match(pageSource, /<nav className="landing-header-nav"[\s\S]*href="#features"[\s\S]*Features[\s\S]*href="#programs"[\s\S]*Program/)
  assert.doesNotMatch(pageSource, /<nav className="landing-header-nav"[\s\S]*landing-nav-chevron/)
  assert.match(pageSource, /<Trophy[^>]*className="landing-pill-icon"/)
  assert.doesNotMatch(pageSource, /className="landing-eyebrow"/)

  assert.match(cssSource, /\.landing-logo\s*\{[\s\S]*height:\s*32px;/)
  assert.match(cssSource, /\.landing-logo-header\s*\{[\s\S]*height:\s*32px;/)
  assert.match(cssSource, /\.landing-store-link-header img\s*\{[\s\S]*width:\s*132px;/)
  assert.match(cssSource, /\.landing-pill\s*\{[^}]*color:\s*var\(--landing-accent\);/)
  assert.match(cssSource, /\.landing-hero-title\s*\{[\s\S]*font-size:\s*clamp\(3\.1rem,\s*6\.6vw,\s*5\.4rem\);/)
  assert.match(cssSource, /\.landing-hero-description\s*\{[\s\S]*font-weight:\s*400;/)
  assert.match(cssSource, /\.landing-hero-icon-box\s*\{[\s\S]*width:\s*54px;[\s\S]*height:\s*54px;[\s\S]*border-radius:\s*16px;/)
  assert.match(cssSource, /\.landing-hero-icon-box svg\s*\{[\s\S]*width:\s*24px;[\s\S]*height:\s*24px;[\s\S]*stroke-width:\s*1;/)
  assert.doesNotMatch(cssSource, /@keyframes landing-hero-pill-motion/)
  assert.doesNotMatch(cssSource, /@keyframes landing-hero-eyebrow-motion/)
  assert.doesNotMatch(cssSource, /@keyframes landing-hero-title-motion/)
  assert.doesNotMatch(cssSource, /@keyframes landing-hero-description-motion/)
  assert.doesNotMatch(cssSource, /\.landing-pill\s*\{[^}]*animation:/)
  assert.doesNotMatch(cssSource, /\.landing-eyebrow\s*\{[^}]*animation:/)
  assert.doesNotMatch(cssSource, /\.landing-hero-title\s*\{[^}]*animation:/)
  assert.doesNotMatch(cssSource, /\.landing-hero-description\s*\{[^}]*animation:/)
  assert.match(cssSource, /@keyframes landing-hero-float/)
  assert.match(cssSource, /\.landing-hero-icon-top-left\s*\{[\s\S]*animation:\s*landing-hero-float 8s ease-in-out infinite;/)
  assert.match(cssSource, /\.landing-hero-icon-top-right\s*\{[\s\S]*animation:\s*landing-hero-float 9s ease-in-out infinite 1\.2s;/)
  assert.match(cssSource, /\.landing-hero-icon-mid-left\s*\{[\s\S]*animation:\s*landing-hero-float 7\.5s ease-in-out infinite 2\.1s;/)
  assert.match(cssSource, /\.landing-hero-icon-mid-right\s*\{[\s\S]*animation:\s*landing-hero-float 10s ease-in-out infinite 0\.8s;/)
  assert.match(cssSource, /\.landing-hero-icon-bottom-left\s*\{[\s\S]*animation:\s*landing-hero-float 8\.8s ease-in-out infinite 3s;/)
  assert.match(cssSource, /\.landing-hero-icon-bottom-right\s*\{[\s\S]*animation:\s*landing-hero-float 9\.4s ease-in-out infinite 1\.7s;/)
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.landing-hero-icon-box\s*\{[\s\S]*animation:\s*none !important;/)
})

test('features section source applies the requested v1 feature fixes only', () => {
  const pageSource = readFileSync(pagePath, 'utf8')
  const showcaseSource = readFileSync(resolve(repoRoot, 'apps/web/app/landing-feature-showcase.jsx'), 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(pageSource, /<section id="features" className="landing-section landing-features-section">[\s\S]*<div className="landing-shell landing-features-stack">/)
  assert.match(pageSource, /landing-section-heading landing-section-heading-centered landing-features-heading/)
  assert.match(showcaseSource, /className="landing-feature-card-description"/)
  assert.doesNotMatch(showcaseSource, /landing-feature-card-index/)
  assert.match(showcaseSource, /className="landing-feature-phone-frame"/)

  assert.match(cssSource, /\.landing-features-stack\s*\{[\s\S]*display:\s*grid;[\s\S]*row-gap:\s*32px;/)
  assert.match(cssSource, /\.landing-feature-showcase\s*\{[\s\S]*align-items:\s*stretch;/)
  assert.match(cssSource, /\.landing-feature-list\s*\{[\s\S]*gap:\s*16px;[\s\S]*align-content:\s*start;[\s\S]*align-self:\s*start;/)
  assert.match(cssSource, /\.landing-feature-card\s*\{[\s\S]*display:\s*block;[\s\S]*padding:\s*28px;[\s\S]*border-radius:\s*16px;/)
  assert.match(cssSource, /\.landing-feature-card-copy\s*\{[\s\S]*gap:\s*10px;/)
  assert.match(cssSource, /\.landing-feature-card-title\s*\{[\s\S]*font-size:\s*1\.32rem;[\s\S]*line-height:\s*1\.2;/)
  assert.match(cssSource, /\.landing-feature-card-description\s*\{[\s\S]*font-weight:\s*400;[\s\S]*font-size:\s*0\.94rem;[\s\S]*line-height:\s*1\.52;/)
  assert.match(cssSource, /\.landing-feature-phone-shell\s*\{[\s\S]*align-items:\s*stretch;[\s\S]*height:\s*100%;[\s\S]*min-height:\s*0;/)
  assert.match(cssSource, /\.landing-feature-phone-frame\s*\{[\s\S]*width:\s*min\(100%, 286px\);[\s\S]*height:\s*100%;[\s\S]*padding:\s*0;[\s\S]*border-radius:\s*0;[\s\S]*background:\s*transparent;[\s\S]*border:\s*0;[\s\S]*box-shadow:\s*none;/)
  assert.match(cssSource, /\.landing-feature-phone-frame::before\s*\{[\s\S]*display:\s*none;/)
  assert.match(cssSource, /\.landing-feature-phone-image\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*object-fit:\s*cover;[\s\S]*object-position:\s*top center;/)
})

test('programs section source applies the requested v1 program fixes only', () => {
  const pageSource = readFileSync(pagePath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(pageSource, /<section id="programs" className="landing-section landing-programs-section">[\s\S]*landing-section-heading landing-section-heading-centered landing-programs-heading/)
  assert.match(pageSource, /CircleCheckBig/)
  assert.match(pageSource, /className="landing-program-list"/)
  assert.match(pageSource, /className="landing-program-list-item"/)
  assert.match(pageSource, /className="landing-program-list-icon"/)
  assert.match(pageSource, /ArrowRight/)
  assert.match(pageSource, /className="landing-program-link-icon"/)
  assert.match(pageSource, /<a href="#footer" className="landing-program-link">[\s\S]*Learn more[\s\S]*<ArrowRight[^>]*className="landing-program-link-icon"/)
  assert.match(cssSource, /\.landing-programs-heading h2\s*\{[\s\S]*font-size:\s*clamp\(2rem,\s*4\.2vw,\s*3\.4rem\);/)
  assert.match(cssSource, /\.landing-program-card p\s*\{[\s\S]*color:\s*var\(--landing-ink\);[\s\S]*font-weight:\s*400;/)
  assert.match(cssSource, /\.landing-program-list\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*8px;/)
  assert.match(cssSource, /\.landing-program-list-item\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;[\s\S]*gap:\s*8px;/)
  assert.match(cssSource, /\.landing-program-list-icon\s*\{[\s\S]*width:\s*14px;[\s\S]*height:\s*14px;[\s\S]*color:\s*var\(--landing-accent\);/)
  assert.doesNotMatch(cssSource, /\.landing-program-card li::before/)
})

test('footer source applies the requested contact icons only', () => {
  const pageSource = readFileSync(pagePath, 'utf8')
  const landingContentSource = readFileSync(landingContentPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(pageSource, /MapPin/)
  assert.match(pageSource, /Phone/)
  assert.match(pageSource, /Mail/)
  assert.match(pageSource, /className="landing-footer-contact-item"/)
  assert.match(pageSource, /className="landing-footer-contact-icon"/)
  assert.match(landingContentSource, /icon:\s*'map-pin'/)
  assert.match(landingContentSource, /icon:\s*'phone'/)
  assert.match(landingContentSource, /icon:\s*'mail'/)
  assert.match(cssSource, /\.landing-footer-contact-item\s*\{[\s\S]*display:\s*inline-flex;[\s\S]*align-items:\s*center;[\s\S]*gap:\s*12px;/)
  assert.match(cssSource, /\.landing-footer-contact-icon\s*\{[\s\S]*width:\s*18px;[\s\S]*height:\s*18px;[\s\S]*color:\s*var\(--landing-accent\);/)
})
