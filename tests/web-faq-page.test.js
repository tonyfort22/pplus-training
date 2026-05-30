import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const faqPagePath = resolve(repoRoot, 'apps/web/app/faq/page.jsx')
const landingContentPath = resolve(repoRoot, 'apps/web/app/landing-content.js')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const globalsPath = resolve(repoRoot, 'apps/web/app/globals.css')

test('faq page matches the PPLUS dark landing FAQ reference structure', () => {
  assert.ok(existsSync(faqPagePath), 'expected a real /faq route page')

  const pageSource = readFileSync(faqPagePath, 'utf8')
  const cssSource = readFileSync(globalsPath, 'utf8')

  assert.match(pageSource, /export const metadata = \{[\s\S]*title: 'FAQ \| PPLUS Training'/)
  assert.match(pageSource, /LandingHeader/)
  assert.match(pageSource, /LandingFooter/)
  assert.match(pageSource, /faqItems\.map/)
  assert.match(pageSource, /Frequently Asked/)
  assert.match(pageSource, /<span>Questions<\/span>/)
  assert.match(pageSource, /What programs does P\+ Training offer\?/)
  assert.match(pageSource, /Do I need previous training experience\?/)
  assert.match(pageSource, /How do I download the app\?/)
  assert.match(pageSource, /How much does it cost\?/)
  assert.match(pageSource, /How do I get started\?/)
  assert.match(pageSource, /<details/)
  assert.match(pageSource, /<summary/)

  assert.match(cssSource, /\.faq-page\s*\{[^}]*background:\s*linear-gradient\(180deg, #08111f 0%, #091220 100%\)/)
  assert.match(cssSource, /\.faq-hero-title\s*\{[^}]*font-size:\s*clamp\(2rem, 4\.2vw, 3\.4rem\)/)
  assert.match(cssSource, /\.faq-hero-title span\s*\{[^}]*color:\s*var\(--landing-accent\)/)
  assert.match(cssSource, /\.faq-accordion-list\s*\{[^}]*max-width:\s*900px/)
  assert.match(cssSource, /\.faq-item\s*\{[^}]*border-bottom:\s*1px solid rgba\(143, 161, 190, 0\.22\)/)
  assert.match(cssSource, /\.faq-item summary\s*\{[^}]*min-height:\s*72px/)
  assert.match(cssSource, /\.faq-item summary::after\s*\{[^}]*content:\s*'\+'/)
})

test('landing navigation and footer point FAQ to the real faq page', () => {
  const contentSource = readFileSync(landingContentPath, 'utf8')
  const sectionsSource = readFileSync(landingSectionsPath, 'utf8')

  assert.match(contentSource, /\{ label: 'FAQ', href: '\/faq' \}/)
  assert.match(sectionsSource, /<a href="\/faq">FAQ<\/a>/)
})
