import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const headerScrollFramePath = resolve(repoRoot, 'apps/web/app/landing-header-scroll-frame.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

test('public landing header renders a shadcn Sheet mobile drawer with the same localized nav actions', () => {
  const source = readFileSync(landingSectionsPath, 'utf8')

  assert.match(source, /import \{ Menu, X \} from 'lucide-react'/, 'mobile header should use the Menu and X icons')
  assert.match(source, /from '@\/components\/ui\/sheet'/, 'mobile header should use the existing shadcn Sheet component')
  assert.match(source, /import LandingHeaderScrollFrame from '\.\/landing-header-scroll-frame'/, 'header should delegate scroll threshold state to a tiny client frame')
  assert.match(source, /<LandingHeaderScrollFrame>\s*<div className="landing-header-desktop landing-shell landing-header-inner">/, 'desktop header should stay isolated from the mobile structure inside the scroll frame')
  assert.match(source, /<div className="landing-header-mobile landing-shell">/, 'mobile header should have its own compact shell')
  assert.match(source, /<SheetTrigger asChild>/, 'mobile menu button should be the Sheet trigger')
  assert.match(source, /className="landing-mobile-menu-button"/, 'mobile trigger should have a dedicated tap-target class')
  assert.match(source, /<SheetContent[\s\S]*className="landing-mobile-menu-sheet"[\s\S]*>/, 'drawer should override the admin Sheet theme with a public class')
  assert.doesNotMatch(source, /SheetDescription|PPLUS Training navigation/, 'mobile drawer should not render the old subtitle copy')
  assert.match(source, /<SheetClose key=\{item\.key\} asChild>[\s\S]*href=\{item\.href\}[\s\S]*>\{item\.label\}<\/a>[\s\S]*<\/SheetClose>/, 'drawer nav links should close the Sheet after navigation')
  assert.match(source, /const landingHeaderNavItems = \(navCopy, language\) => \[/, 'header nav should share one item list between desktop and mobile')
  assert.match(source, /href: getLocalizedHref\('\/#features', language\),[\s\S]*label: navCopy\.features/, 'features link should stay localized')
  assert.match(source, /href: getLocalizedHref\('\/#programs', language\),[\s\S]*label: navCopy\.program/, 'program link should stay localized')
  assert.match(source, /href: getLocalizedHref\('\/faq', language\),[\s\S]*label: navCopy\.faq/, 'FAQ link should stay localized')
  assert.match(source, /href: getLocalizedHref\('\/support', language\),[\s\S]*label: navCopy\.support/, 'Support link should stay localized')
  assert.match(source, /<button className="landing-mobile-menu-close" type="button" aria-label="Close navigation menu">\s*<X aria-hidden="true" \/>\s*<\/button>/, 'mobile drawer should expose an icon-only X close button')
  assert.doesNotMatch(source, /landing-mobile-menu-close[^>]*>Close<\/button>/, 'mobile drawer close button should not render text')
  assert.match(source, /landing-mobile-menu-switcher-row[\s\S]*<PublicLanguageSwitcher language=\{language\} currentPath=\{currentPath\} \/>[\s\S]*<PublicThemeToggle \/>/, 'mobile drawer should place language first, then theme, on one row')
  assert.match(source, /landing-mobile-store-link[\s\S]*Download on the App Store/, 'mobile drawer should keep the App Store CTA')
})

test('public landing header floats only after the 20px scroll threshold', () => {
  const source = readFileSync(headerScrollFramePath, 'utf8')
  const css = readFileSync(cssPath, 'utf8')

  assert.match(source, /const SCROLLED_OFFSET_PX = 20/, 'scroll threshold should be exactly 20px')
  assert.match(source, /window\.scrollY > SCROLLED_OFFSET_PX/, 'header should turn on the floating state only after crossing the threshold')
  assert.match(source, /landing-header landing-header--scrolled/, 'client frame should apply the scrolled modifier class')
  assert.match(css, /\.landing-header \{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*z-index:\s*50;[^}]*background:\s*transparent;[^}]*transition:\s*background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, backdrop-filter 180ms ease;/, 'base public header should stay transparent at the top')
  assert.match(css, /\.landing-header--scrolled \{[^}]*border-bottom-color:\s*rgba\(143, 161, 190, 0\.14\);[^}]*background:\s*rgba\(8, 17, 31, 0\.86\);[^}]*backdrop-filter:\s*blur\(18px\);/, 'scrolled public header should get the dark floating background')
  assert.match(css, /html\[data-public-theme='light'\] \.landing-header--scrolled \{[^}]*background:\s*rgba\(255, 255, 255, 0\.92\);[^}]*border-bottom-color:\s*rgba\(15, 23, 42, 0\.08\);/, 'scrolled public header should adapt its background and border in light mode')
})

test('public landing header CSS switches desktop and mobile layouts and themes the drawer in dark and light mode', () => {
  const css = readFileSync(cssPath, 'utf8')

  assert.match(css, /\.landing-header \{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*z-index:\s*50;[^}]*background:\s*transparent;/, 'public header should stick while scrolling but stay transparent until the 20px threshold')
  assert.match(css, /\.landing-header--scrolled \{[^}]*background:\s*rgba\(8, 17, 31, 0\.86\);[^}]*backdrop-filter:\s*blur\(18px\);/, 'public header should gain a non-transparent dark floating background after scrolling')
  assert.match(css, /html\[data-public-theme='light'\] \.landing-header--scrolled \{[^}]*background:\s*rgba\(255, 255, 255, 0\.92\);[^}]*border-bottom-color:\s*rgba\(15, 23, 42, 0\.08\);/, 'floating public header should adapt its background and border in light mode')
  assert.match(css, /\.landing-header-desktop \{[^}]*display:\s*grid;/, 'desktop header should keep the grid layout')
  assert.match(css, /\.landing-header-mobile \{[^}]*display:\s*none;/, 'mobile header should be hidden on desktop')
  assert.match(css, /\.landing-mobile-menu-sheet \{[^}]*background:\s*#08111f;[^}]*color:\s*var\(--landing-ink\);/, 'drawer should have explicit dark public colors')
  assert.match(css, /html\[data-public-theme='light'\] \.landing-mobile-menu-sheet \{[^}]*background:\s*#ffffff;[^}]*color:\s*#07111f;/, 'drawer should have explicit light public colors')
  assert.match(css, /\.landing-mobile-menu-link \{[^}]*min-height:\s*42px;[^}]*padding:\s*0;[^}]*transition:\s*color 160ms ease;/, 'drawer nav should be plain text links, not card rows')
  assert.match(css, /\.landing-mobile-menu-switcher-row \{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*space-between;[^}]*width:\s*100%;/, 'mobile drawer switcher row should spread language and theme controls with space-between')
  assert.match(css, /\.landing-mobile-menu-close \{[^}]*width:\s*34px;[^}]*height:\s*34px;[^}]*padding:\s*0;[^}]*border:\s*0;[^}]*background:\s*transparent;/, 'drawer close button should be a transparent icon-only button')
  assert.doesNotMatch(css, /\.landing-mobile-menu-close \{[^}]*border-radius:/, 'drawer close button should not be a card or pill')
  assert.match(css, /\.landing-mobile-menu-close svg \{[^}]*width:\s*22px;[^}]*height:\s*22px;/, 'drawer close icon should be sized explicitly and visibly larger')
  assert.doesNotMatch(css, /\.landing-mobile-menu-link \{[^}]*(border|background|border-radius):/, 'drawer nav links should not keep card-style border/background/radius')
  assert.match(css, /html\[data-public-theme='light'\] \.landing-mobile-menu-link \{[^}]*color:\s*#07111f;/, 'drawer links should adapt text color in light mode')
  assert.match(css, /@media \(max-width:\s*900px\) \{[\s\S]*\.landing-header-desktop \{[^}]*display:\s*none;[\s\S]*\.landing-header-mobile \{[^}]*display:\s*flex;/, 'mobile media query should swap desktop header for compact mobile row')
  assert.doesNotMatch(css, /@media \(max-width:\s*900px\) \{[\s\S]*\.landing-header-inner,[\s\S]*grid-template-columns:\s*1fr;/, 'mobile should not rely on stacking the desktop header grid')
})
