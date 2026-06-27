import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const supportPagePath = resolve(repoRoot, 'apps/web/app/support/page.jsx')
const supportFormPath = resolve(repoRoot, 'apps/web/components/ppht-support-fac5db68-f122.jsx')
const supportThreadPath = resolve(repoRoot, 'apps/web/components/support-conversation-reply.jsx')
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

  assert.match(pageSource, /const currentPath = conversationId \? `\/support\?conversationId=\$\{encodeURIComponent\(conversationId\)\}` : '\/support'/)
  assert.match(pageSource, /<LandingHeader language=\{language\} currentPath=\{currentPath\} copy=\{copy\} \/>/, 'support page should reuse the shared project header with language context')
  assert.match(pageSource, /<LandingFooter language=\{language\} copy=\{copy\} \/>/, 'support page should reuse the shared project footer with language context')
  assert.match(pageSource, /landing-section landing-features-section support-template-section/, 'support section should reuse the home Features section surface')
  assert.match(pageSource, /landing-shell landing-features-stack support-template-stack/, 'support section should reuse the home Features stack')
  assert.match(pageSource, /landing-section-heading landing-section-heading-centered landing-features-heading support-template-heading-on-image/, 'support heading should reuse the home Features heading treatment')
  assert.match(pageSource, /<p className="landing-pill support-template-pill">\{supportCopy\.pill\}<\/p>/, 'support page should use the same top pill treatment as FAQ')
  assert.match(pageSource, /const copy = getPublicPageCopy\(language\)/, 'support page should load localized support copy')
  assert.match(pageSource, /const supportCopy = copy\.support/, 'support page should scope support copy')
  assert.match(pageSource, /<p className="landing-pill support-template-pill">\{supportCopy\.pill\}<\/p>/, 'support page should render localized pill text')
  assert.match(pageSource, /<h2>\{supportCopy\.headingPrefix\} <span>\{supportCopy\.headingAccent\}<\/span><\/h2>/, 'support heading should render localized green accent')
  assert.doesNotMatch(pageSource, /We're here to help! Please describe your issue below\./, 'support subtitle under the heading should be removed')
  assert.doesNotMatch(pageSource, /<h1>Customer Support Request<\/h1>|support-highlight-grid|How can we help\?|Email support|Clear context/, 'support page must not use the rejected custom marketing hero or wrong heading level')

  assert.doesNotMatch(formSource, /<h1>Customer Support Request<\/h1>|support-template-heading/, 'form component should not own the page heading')
  assert.match(formSource, /name="firstName"/, 'form should keep the first name field')
  assert.match(formSource, /name="lastName"/, 'form should keep the last name field')
  assert.match(formSource, /name="email"/, 'form should keep the email field')
  assert.match(formSource, /name="category"/, 'form should keep the issue category field')
  assert.match(formSource, /name="description"/, 'form should keep the issue description field')
  for (const label of [
    'copy.labels.firstName',
    'copy.labels.lastName',
    'copy.labels.email',
    'copy.labels.category',
    'copy.labels.description',
  ]) {
    assert.match(formSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing support template copy reference: ${label}`)
  }
  assert.match(formSource, /export function PphtSupportFac5db68F122\(\{ copy \}\)/, 'support form should accept localized copy')
  assert.match(formSource, /categoryOptions = copy\.categories/, 'support form should use localized categories')
  assert.match(formSource, /placeholder=\{copy\.placeholders\.firstName\}/)
  assert.match(formSource, /\{isSubmitting \? copy\.submitSubmitting : copy\.submitIdle\}/)

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
  assert.match(formSource, /const supportSelectTriggerStyle = \{ borderColor: 'var\(--support-dashboard-input-border\)' \}/, 'support category select should override the shared SelectTrigger inline border with the public form border token')
  assert.match(formSource, /<SelectTrigger id="category" className=\{dashboardInputClassName\} style=\{supportSelectTriggerStyle\}>/, 'support category select should use the public form border override')
  assert.match(cssSource, /\.support-template-form \{[^}]*--support-dashboard-input-border:\s*#24334a;/, 'support form should define a dark-mode input border token')
  assert.match(cssSource, /html\[data-public-theme='light'\] \.support-template-form \{[^}]*--support-dashboard-input-border:\s*rgba\(15, 23, 42, 0\.14\);/, 'light public support form should replace the dark select border token')
  assert.match(cssSource, /html\[data-public-theme='light'\] \.support-dashboard-input,[\s\S]*html\[data-public-theme='light'\] button\.support-dashboard-input \{[^}]*border-color:\s*var\(--support-dashboard-input-border\) !important;/, 'light support inputs and select trigger should not show the dark dashboard border')
  assert.match(formSource, /className=\{dashboardInputClassName\}/, 'support text fields and select should consume dashboard input styling')
  assert.match(formSource, /className=\{dashboardTextareaClassName\}/, 'support textarea should consume dashboard textarea styling')
  assert.doesNotMatch(formSource, /className="admin-input"|className="admin-select|className="admin-textarea"/, 'support form should not use the old global admin input classes')
  assert.doesNotMatch(cssSource, /\.support-template-form input,[\s\S]*?\.support-template-select-trigger \{/, 'support form should not keep custom input/select styling that overrides admin dashboard inputs')
  assert.doesNotMatch(cssSource, /\.support-template-form textarea \{[^}]*min-height:\s*118px/, 'support textarea should not keep custom FormCN textarea sizing')
  assert.match(cssSource, /\.support-dashboard-textarea \{[^}]*min-height:\s*140px;[^}]*border:\s*1px solid #24334a;[^}]*background:\s*#111d30;[^}]*color:\s*#dce6f8;/, 'support textarea override should force dashboard textarea styling live')
  assert.match(formSource, /bg-\[var\(--admin-shell-primary-button-bg\)\]/, 'support submit button should use the shared admin primary background token')
  assert.match(formSource, /text-\[#0B1120\]/, 'support submit button should use the solid green admin dashboard primary dark text')
  assert.match(formSource, /hover:bg-\[var\(--admin-shell-primary-button-bg\)\]/, 'support submit button should use the shared admin primary hover token')
  assert.doesNotMatch(formSource, /admin-button admin-button-prominent/, 'support submit button should not use the outlined admin button style')
  assert.match(cssSource, /\.support-template-heading-on-image h2 span \{[^}]*color:\s*var\(--landing-accent\);/)
  assert.match(cssSource, /\.support-template-heading-on-image \.support-template-pill \{[^}]*border:\s*1px solid rgba\(57, 229, 180, 0\.22\);/)
  assert.match(cssSource, /\.support-template-heading-on-image \.support-template-pill \{[^}]*background:\s*rgba\(10, 17, 31, 0\.72\);/)
  assert.match(cssSource, /\.support-template-heading-on-image \.support-template-pill \{[^}]*padding:\s*11px 18px;/)
  assert.doesNotMatch(cssSource, /\.support-template-actions button \{[^}]*background:\s*rgba\(238, 244, 255/, 'support submit button should not keep the rejected white FormCN button override')
})

test('support page switches to requester conversation reply mode from conversationId links', () => {
  assert.ok(existsSync(supportThreadPath), 'requester support conversation reply component should exist')
  const pageSource = readFileSync(supportPagePath, 'utf8')
  const threadSource = readFileSync(supportThreadPath, 'utf8')

  assert.match(pageSource, /export default async function SupportPage\(\{ searchParams \}\)/)
  assert.match(pageSource, /const resolvedSearchParams = await searchParams/)
  assert.match(pageSource, /const conversationId = resolvedSearchParams\?\.conversationId/)
  assert.match(pageSource, /const language = normalizePublicLanguage\(resolvedSearchParams\?\.lang\)/)
  assert.match(pageSource, /conversationId \? <SupportConversationReply conversationId=\{conversationId\} copy=\{supportCopy\.reply\} \/> : <PphtSupportFac5db68F122 copy=\{supportCopy\.form\} \/>/)
  assert.match(threadSource, /fetch\(`\/api\/support\/conversations\/\$\{conversationId\}\/messages`/)
  assert.match(threadSource, /method: 'POST'/)
  assert.match(threadSource, /body: JSON\.stringify\(\{ body: trimmedReply \}\)/)
  assert.match(threadSource, /export function SupportConversationReply\(\{ conversationId, copy \}\)/)
  assert.match(threadSource, /\{copy\.label\}/)
  assert.match(threadSource, /\{isSubmitting \? copy\.submitSubmitting : copy\.submitIdle\}/)
  assert.doesNotMatch(threadSource, /Continue your support conversation|Your reply was sent|Send reply/, 'reply strings should come from localized copy')
})

test('landing navigation points Support to the real support page', () => {
  const landingSectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const landingContentSource = readFileSync(landingContentPath, 'utf8')

  assert.match(landingSectionsSource, /\{ key: 'support', href: getLocalizedHref\('\/support', language\), label: navCopy\.support \}/, 'header Support nav should link to localized /support')
  assert.match(landingContentSource, /\{ label: 'Support', href: '\/support' \}/, 'footer Support resource link should link to /support')
})
