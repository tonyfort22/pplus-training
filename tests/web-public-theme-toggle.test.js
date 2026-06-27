import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const themeTogglePath = resolve(repoRoot, 'apps/web/components/public-theme-toggle.jsx')
const landingSectionsPath = resolve(repoRoot, 'apps/web/app/landing-sections.jsx')
const layoutPath = resolve(repoRoot, 'apps/web/app/layout.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')

test('public footer renders a dark/light toggle beside the copyright row', () => {
  assert.ok(existsSync(themeTogglePath), 'expected reusable public theme toggle component')

  const toggleSource = readFileSync(themeTogglePath, 'utf8')
  const sectionsSource = readFileSync(landingSectionsPath, 'utf8')
  const layoutSource = readFileSync(layoutPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(toggleSource, /'use client'/)
  assert.match(toggleSource, /export default function PublicThemeToggle/)
  assert.match(toggleSource, /const STORAGE_KEY = 'pplus-public-theme'/)
  assert.match(toggleSource, /export function PublicThemeHydrator\(\)/)
  assert.match(toggleSource, /import \{ usePathname \} from 'next\/navigation'/)
  assert.match(toggleSource, /function readSavedTheme\(\) \{[\s\S]*localStorage\?\.getItem\(STORAGE_KEY\)/)
  assert.match(toggleSource, /function applyPublicTheme\(nextTheme\) \{[\s\S]*document\.documentElement\.dataset\.publicTheme = normalizedTheme/)
  assert.match(toggleSource, /const pathname = usePathname\(\)/)
  assert.match(toggleSource, /useEffect\(\(\) => \{\s*applyPublicTheme\(readSavedTheme\(\)\)\s*\}, \[pathname\]\)/)
  assert.match(layoutSource, /<html lang="en" data-theme="dark" data-public-theme="dark" suppressHydrationWarning>/)
  assert.match(toggleSource, /localStorage\.setItem\(STORAGE_KEY, nextTheme\)/)
  assert.match(toggleSource, /aria-label=\{`Switch to \$\{theme === 'dark' \? 'light' : 'dark'\} mode`\}/)
  assert.match(toggleSource, /className="public-theme-toggle"/)
  assert.match(toggleSource, /const nextTheme = theme === 'dark' \? 'light' : 'dark'/)
  assert.match(toggleSource, /onClick=\{toggleTheme\}/)
  assert.match(toggleSource, /src="\/admin\/auth_theme_toggle\.svg"/)
  assert.match(toggleSource, /src="\/admin\/auth_theme_toggle_light\.svg"/)
  assert.match(toggleSource, /className=\{theme === 'dark' \? 'public-theme-toggle-image public-theme-toggle-image-active' : 'public-theme-toggle-image'\}/)
  assert.match(toggleSource, /className=\{theme === 'light' \? 'public-theme-toggle-image public-theme-toggle-image-light public-theme-toggle-image-active' : 'public-theme-toggle-image public-theme-toggle-image-light'\}/)
  assert.doesNotMatch(toggleSource, /public-theme-toggle-hit/)
  assert.doesNotMatch(toggleSource, /onClick=\{\(\) => applyTheme\('dark'\)\}/)
  assert.doesNotMatch(toggleSource, /onClick=\{\(\) => applyTheme\('light'\)\}/)
  assert.doesNotMatch(toggleSource, /Dark<\/button>/)
  assert.doesNotMatch(toggleSource, /Light<\/button>/)

  assert.match(sectionsSource, /import PublicThemeToggle, \{ PublicThemeHydrator \} from '\.\.\/components\/public-theme-toggle'/)
  assert.match(sectionsSource, /<LandingHeaderScrollFrame>\s*<PublicThemeHydrator \/>/)
  assert.match(sectionsSource, /<div className="landing-shell landing-footer-meta">\s*<p>\{footerCopy\.copyright\}<\/p>\s*<PublicThemeToggle \/>\s*<\/div>/)

  assert.match(cssSource, /\.landing-footer-meta\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*space-between;[^}]*align-items:\s*center;/)
  assert.match(cssSource, /\.public-theme-toggle\s*\{[^}]*position:\s*relative;[^}]*width:\s*62px;[^}]*height:\s*36px;[^}]*cursor:\s*pointer;/)
  assert.match(cssSource, /\.public-theme-toggle-image\s*\{[^}]*position:\s*absolute;[^}]*opacity:\s*0;/)
  assert.match(cssSource, /\.public-theme-toggle-image-active\s*\{[^}]*opacity:\s*1;/)
  assert.doesNotMatch(cssSource, /\.public-theme-toggle-hit/)
})
