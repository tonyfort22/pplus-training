import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const loginPagePath = resolve(repoRoot, 'apps/web/app/admin/login/page.jsx')
const copyPath = resolve(repoRoot, 'apps/web/lib/i18n/public-page-copy.js')

test('admin login page renders localized copy from the public dictionary', () => {
  assert.ok(existsSync(loginPagePath), 'expected /admin/login page')
  assert.ok(existsSync(copyPath), 'expected public page copy dictionary')

  const pageSource = readFileSync(loginPagePath, 'utf8')
  const copySource = readFileSync(copyPath, 'utf8')

  assert.match(copySource, /login:[\s\S]*badge:[\s\S]*kicker:[\s\S]*headline:[\s\S]*form:/)
  assert.match(copySource, /La meilleure app d’entraînement de hockey/)
  assert.match(copySource, /ENTRAÎNEMENT DE HOCKEY ÉLITE/)
  assert.match(copySource, /Travail hors glace/)
  assert.match(copySource, /Résultats sur glace/)
  assert.match(copySource, /Bonjour 👋🏻/)
  assert.match(copySource, /Connexion/)
  assert.match(copySource, /Mot de passe oublié/)

  assert.doesNotMatch(pageSource, /PublicLanguageSwitcher/)
  assert.doesNotMatch(pageSource, /public-language-switcher/)
  assert.match(pageSource, /import \{ getLocalizedHref, normalizePublicLanguage \} from '\.\.\/\.\.\/\.\.\/lib\/i18n\/language'/)
  assert.match(pageSource, /import \{ getPublicPageCopy \} from '\.\.\/\.\.\/\.\.\/lib\/i18n\/public-page-copy'/)
  assert.match(pageSource, /export default async function HomePage\(\{ searchParams \}\)/)
  assert.match(pageSource, /const resolvedSearchParams = await searchParams/)
  assert.match(pageSource, /const language = normalizePublicLanguage\(resolvedSearchParams\?\.lang\)/)
  assert.match(pageSource, /const copy = getPublicPageCopy\(language\)/)
  assert.match(pageSource, /const loginCopy = copy\.login/)
  assert.match(pageSource, /href=\{getLocalizedHref\('\/', language\)\}/)
  assert.doesNotMatch(pageSource, /<PublicLanguageSwitcher/)

  for (const copyReference of [
    'loginCopy.badge',
    'loginCopy.kicker',
    'loginCopy.headline.lineOne',
    'loginCopy.headline.lineTwo',
    'loginCopy.description',
    'loginCopy.form.title',
    'loginCopy.form.email',
    'loginCopy.form.password',
    'loginCopy.form.submit',
    'loginCopy.form.forgotPassword',
  ]) {
    assert.match(pageSource, new RegExp(copyReference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing login copy reference: ${copyReference}`)
  }

  for (const hardcoded of [
    'The Best Hockey Training App',
    'ELITE HOCKEY TRAINING',
    'Off-Ice Work',
    'On-Ice Results',
    'Welcome back 👋🏻',
    'Bon retour 👋🏻',
    'Forgot Password',
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `login page should not hardcode: ${hardcoded}`)
  }
})

test('login dictionary falls back to English and exposes French form labels', async () => {
  const { getPublicPageCopy } = await import('../apps/web/lib/i18n/public-page-copy.js')

  assert.equal(getPublicPageCopy('en').login.form.submit, 'Sign in')
  assert.equal(getPublicPageCopy('fr').login.form.submit, 'Connexion')
  assert.equal(getPublicPageCopy('fr').login.form.email, 'Courriel')
  assert.equal(getPublicPageCopy('fr').login.form.password, 'Mot de passe')
  assert.equal(getPublicPageCopy('es').login.form.submit, 'Sign in')
})
