import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const copyPath = resolve(repoRoot, 'apps/web/lib/i18n/public-page-copy.js')
const faqPagePath = resolve(repoRoot, 'apps/web/app/faq/page.jsx')

test('public page copy dictionary exposes editable English and Canadian French FAQ copy', async () => {
  assert.ok(existsSync(copyPath), 'expected public page copy dictionary')

  const source = readFileSync(copyPath, 'utf8')
  assert.match(source, /export const publicPageCopy = \{[\s\S]*en:[\s\S]*fr:/)
  assert.match(source, /faq:[\s\S]*pill:[\s\S]*titlePrefix:[\s\S]*titleAccent:[\s\S]*items:/)
  assert.match(source, /Questions fréquentes/)
  assert.match(source, /Quels programmes P\+ Training offre-t-il \?/)
  assert.match(source, /Est-ce que je dois avoir de l’expérience en entraînement \?/)
  assert.match(source, /Comment télécharger l’app \?/)

  const { getPublicPageCopy } = await import('../apps/web/lib/i18n/public-page-copy.js')
  assert.equal(getPublicPageCopy('en').faq.titlePrefix, 'Frequently Asked')
  assert.equal(getPublicPageCopy('en').faq.titleAccent, 'Questions')
  assert.equal(getPublicPageCopy('fr').faq.titlePrefix, 'Questions')
  assert.equal(getPublicPageCopy('fr').faq.titleAccent, 'fréquentes')
  assert.equal(getPublicPageCopy('es').faq.titleAccent, 'Questions')
  assert.equal(getPublicPageCopy('fr').faq.items.length, getPublicPageCopy('en').faq.items.length)
})

test('public page copy dictionary exposes editable English and Canadian French support copy', async () => {
  const source = readFileSync(copyPath, 'utf8')
  assert.match(source, /support:[\s\S]*pill:[\s\S]*headingPrefix:[\s\S]*headingAccent:[\s\S]*form:[\s\S]*reply:/)
  assert.match(source, /Prénom \*/)
  assert.match(source, /Nom \*/)
  assert.match(source, /Adresse courriel \*/)
  assert.match(source, /Catégorie du problème \*/)
  assert.match(source, /Décris ton problème en détail/)
  assert.match(source, /Envoyer/)
  assert.match(source, /Continuer ta conversation avec le support/)

  const { getPublicPageCopy } = await import('../apps/web/lib/i18n/public-page-copy.js')
  assert.equal(getPublicPageCopy('en').support.headingAccent, 'Touch')
  assert.equal(getPublicPageCopy('fr').support.headingPrefix, 'Nous')
  assert.equal(getPublicPageCopy('fr').support.headingAccent, 'joindre')
  assert.equal(getPublicPageCopy('fr').support.form.labels.firstName, 'Prénom *')
  assert.equal(getPublicPageCopy('fr').support.reply.submitIdle, 'Envoyer la réponse')
})

test('FAQ page renders copy from the language dictionary instead of hardcoded page strings', () => {
  const pageSource = readFileSync(faqPagePath, 'utf8')

  assert.match(pageSource, /import \{ getPublicPageCopy \} from '\.\.\/\.\.\/lib\/i18n\/public-page-copy'/)
  assert.match(pageSource, /const copy = getPublicPageCopy\(language\)/)
  assert.match(pageSource, /const faqCopy = copy\.faq/)
  assert.match(pageSource, /\{faqCopy\.pill\}/)
  assert.match(pageSource, /\{faqCopy\.titlePrefix\} <span>\{faqCopy\.titleAccent\}<\/span>/)
  assert.match(pageSource, /faqCopy\.items\.map/)

  for (const hardcoded of [
    'Frequently Asked <span>Questions</span>',
    'What programs does P+ Training offer?',
    'Do I need previous training experience?',
    'How do I download the app?',
    'How much does it cost?',
    'How do I get started?',
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `FAQ page should not hardcode: ${hardcoded}`)
  }
})
