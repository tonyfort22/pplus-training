import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const supportPagePath = resolve(repoRoot, 'apps/web/app/support/page.jsx')
const supportFormPath = resolve(repoRoot, 'apps/web/components/ppht-support-fac5db68-f122.jsx')
const schemaPath = resolve(repoRoot, 'apps/web/lib/form-schema.js')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const landingContentPath = resolve(repoRoot, 'apps/web/app/landing-content.js')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

test('support page uses the FormCN customer support template, not a custom marketing layout', () => {
  for (const filePath of [supportPagePath, supportFormPath, schemaPath, landingSectionsPath]) {
    assert.ok(existsSync(filePath), `expected file to exist: ${filePath}`)
  }

  const pageSource = readFileSync(supportPagePath, 'utf8')
  const formSource = readFileSync(supportFormPath, 'utf8')
  const schemaSource = readFileSync(schemaPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(pageSource, /<LandingHeader \/>/, 'support page should reuse the shared project header')
  assert.match(pageSource, /<LandingFooter \/>/, 'support page should reuse the shared project footer')
  assert.match(pageSource, /landing-section landing-features-section support-template-section/, 'support section should reuse the home Features section surface')
  assert.match(pageSource, /landing-shell landing-features-stack support-template-stack/, 'support section should reuse the home Features stack')
  assert.match(pageSource, /landing-section-heading landing-section-heading-centered landing-features-heading support-template-heading-on-image/, 'support heading should reuse the home Features heading treatment')
  assert.match(pageSource, /<h2>Get in Touch<\/h2>/, 'support heading should use the requested Get in Touch copy')
  assert.match(pageSource, /We're here to help! Please describe your issue below\./, 'support subtitle should sit with the page heading')
  assert.doesNotMatch(pageSource, /<h1>Customer Support Request<\/h1>|support-highlight-grid|How can we help\?|Email support|Clear context/, 'support page must not use the rejected custom marketing hero or wrong heading level')

  assert.doesNotMatch(formSource, /<h1>Customer Support Request<\/h1>|support-template-heading/, 'form component should not own the page heading')
  assert.match(formSource, /First Name \*/, 'form should keep the exact FormCN support fields')
  for (const label of [
    'First Name *',
    'Last Name *',
    'Email Address *',
    'Issue Category *',
    'Issue Description *',
  ]) {
    assert.match(formSource, new RegExp(label.replace(/[()*]/g, '\\$&')), `missing support template label: ${label}`)
  }

  for (const field of ['firstName', 'lastName', 'email', 'category', 'description']) {
    assert.match(schemaSource, new RegExp(field), `schema should include ${field}`)
  }
  assert.doesNotMatch(formSource, /Order Number|orderNumber/, 'support form should not render or register the removed order number block')
  assert.doesNotMatch(schemaSource, /orderNumber/, 'support schema should not include removed order number')
  assert.doesNotMatch(formSource, /Priority Level|Low - General inquiry|Medium - Issue affecting usage|High - Urgent issue|name="priority"|Radio from/, 'support form should not render or import the removed priority level section')
  assert.doesNotMatch(schemaSource, /priority/, 'support schema should not require removed priority level')
  assert.match(formSource, /name="email"[\s\S]*?className="support-template-field support-template-full"/, 'email block should span the full support form width')
  assert.doesNotMatch(formSource, /name="email"[\s\S]*?className="support-template-field support-template-half"/, 'email block must not render as a half-width grid field')
  assert.match(formSource, /dashboardInputClassName = 'support-dashboard-input h-11 rounded-\[12px\] border-\[#24334A\] bg-\[#111D30\] px-4 text-sm text-\[#DCE6F8\] placeholder:text-\[#70809E\] focus-visible:border-\[#3BE0AF\] focus-visible:ring-\[#3BE0AF\]\/20'/, 'support inputs should use the exact dashboard input styling class')
  assert.match(formSource, /dashboardTextareaClassName = 'support-dashboard-textarea min-h-\[140px\] rounded-\[12px\] border border-\[#24334A\] bg-\[#111D30\] px-4 py-3 text-sm text-\[#DCE6F8\] placeholder:text-\[#70809E\] focus-visible:border-\[#3BE0AF\] focus-visible:ring-\[#3BE0AF\]\/20'/, 'support textarea should use the exact dashboard textarea styling class')
  assert.match(formSource, /className=\{dashboardInputClassName\}/, 'support text fields and select should consume dashboard input styling')
  assert.match(formSource, /className=\{dashboardTextareaClassName\}/, 'support textarea should consume dashboard textarea styling')
  assert.doesNotMatch(formSource, /className="admin-input"|className="admin-select|className="admin-textarea"/, 'support form should not use the old global admin input classes')
  assert.doesNotMatch(cssSource, /\.support-template-form input,[\s\S]*?\.support-template-select-trigger \{/, 'support form should not keep custom input/select styling that overrides admin dashboard inputs')
  assert.doesNotMatch(cssSource, /\.support-template-form textarea \{[^}]*min-height:\s*118px/, 'support textarea should not keep custom FormCN textarea sizing')
  assert.match(cssSource, /\.support-dashboard-textarea \{[^}]*min-height:\s*140px;[^}]*border:\s*1px solid #24334a;[^}]*background:\s*#111d30;[^}]*color:\s*#dce6f8;/, 'support textarea override should force dashboard textarea styling live')
  assert.match(formSource, /bg-\[#3BE0AF\]/, 'support submit button should use the solid green admin dashboard primary background')
  assert.match(formSource, /text-\[#0B1120\]/, 'support submit button should use the solid green admin dashboard primary dark text')
  assert.match(formSource, /hover:bg-\[#35c89d\]/, 'support submit button should use the admin dashboard primary hover green')
  assert.doesNotMatch(formSource, /admin-button admin-button-prominent/, 'support submit button should not use the outlined admin button style')
  assert.doesNotMatch(cssSource, /\.support-template-actions button \{[^}]*background:\s*rgba\(238, 244, 255/, 'support submit button should not keep the rejected white FormCN button override')
})

test('landing navigation points Support to the real support page', () => {
  const landingSectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const landingContentSource = readFileSync(landingContentPath, 'utf8')

  assert.match(landingSectionsSource, /<a href="\/support">Support<\/a>/, 'header Support nav should link to /support')
  assert.match(landingContentSource, /\{ label: 'Support', href: '\/support' \}/, 'footer Support resource link should link to /support')
})
