import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const copyPath = resolve(repoRoot, 'apps/web/lib/i18n/public-page-copy.js')
const homePagePath = resolve(repoRoot, 'apps/web/app/page.jsx')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')

test('home page copy dictionary exposes English and Canadian French landing content', async () => {
  const copySource = readFileSync(copyPath, 'utf8')

  assert.match(copySource, /home:[\s\S]*hero:[\s\S]*featuresSection:[\s\S]*features:[\s\S]*programsSection:[\s\S]*programs:[\s\S]*footer:/)
  assert.match(copySource, /La meilleure app d’entraînement de hockey/)
  assert.match(copySource, /Travail hors glace \/ Résultats sur glace/)
  assert.match(copySource, /Conçue pour l’entraînement hors glace/)
  assert.match(copySource, /Conçue pour le développement hockey/)

  const { getPublicPageCopy } = await import('../apps/web/lib/i18n/public-page-copy.js')
  const english = getPublicPageCopy('en').home
  const french = getPublicPageCopy('fr').home

  assert.equal(english.nav.program, 'Programs')
  assert.equal(french.nav.program, 'Programmes')
  assert.equal(english.hero.heading, 'Off-Ice Work / On-Ice Results')
  assert.equal(french.hero.heading, 'Travail hors glace / Résultats sur glace')
  assert.equal(french.featuresSection.heading, 'Conçue pour l’entraînement hors glace')
  assert.equal(french.features[1].title, 'Suivi des entraînements')
  assert.equal(french.features[3].title, 'Métriques sur la récupération')
  assert.equal(french.footer.featureLinks[1].label, 'Suivi des entraînements')
  assert.equal(french.footer.featureLinks[3].label, 'Métriques sur la récupération')
  assert.equal(french.programsSection.heading, 'Conçue pour le développement hockey')
  assert.equal(french.programs[0].bullets[1], '40+ entraînements')
  assert.equal(french.programs[1].bullets[1], '20+ entraînements')
  assert.equal(french.programs[2].bullets[1], '30+ entraînements')
  assert.equal(french.features.length, english.features.length)
  assert.equal(french.programs.length, english.programs.length)
  assert.equal(french.footer.resourceLinks.at(-1).label, 'Connexion')
})

test('home page and shared footer render localized copy from dictionary', () => {
  const homeSource = readFileSync(homePagePath, 'utf8')
  const sectionsSource = readFileSync(landingSectionsPath, 'utf8')

  assert.match(homeSource, /const copy = getPublicPageCopy\(language\)/)
  assert.match(homeSource, /const homeCopy = copy\.home/)
  assert.match(homeSource, /const \[heroLineOne, heroLineTwo\] = homeCopy\.hero\.heading\.split\(' \/ '\)/)
  assert.match(homeSource, /\{homeCopy\.hero\.pill\}/)
  assert.match(homeSource, /\{homeCopy\.hero\.copy\}/)
  assert.match(homeSource, /<LandingFeatureShowcase features=\{homeCopy\.features\} \/>/)
  assert.match(homeSource, /<p className="landing-pill landing-features-pill">\{homeCopy\.featuresSection\.label\}<\/p>/)
  assert.match(homeSource, /<p className="landing-pill landing-programs-pill">\{homeCopy\.programsSection\.label\}<\/p>/)
  assert.match(homeSource, /homeCopy\.programs\.map/)
  assert.doesNotMatch(homeSource, /from '\.\/landing-content'/, 'Home page should not import hardcoded landing content')

  assert.match(sectionsSource, /export function LandingFooter\(\{ language = DEFAULT_LANGUAGE, copy \} = \{\}\)/)
  assert.match(sectionsSource, /const footerCopy = copy\?\.home\?\.footer \|\| landingContentFallback\.footer/)
  assert.match(sectionsSource, /footerCopy\.brandCopy/)
  assert.match(sectionsSource, /footerCopy\.resourceLinks/)

  const cssSource = readFileSync(resolve(repoRoot, 'apps/web/app/globals.css'), 'utf8')
  assert.match(cssSource, /\.landing-features-heading \.landing-features-pill,\s*\n\.landing-programs-heading \.landing-programs-pill \{[^}]*border:\s*1px solid rgba\(57, 229, 180, 0\.22\);[^}]*background:\s*rgba\(10, 17, 31, 0\.72\);[^}]*color:\s*var\(--landing-accent\);[^}]*padding:\s*11px 18px;/)
})
