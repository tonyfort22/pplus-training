import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'

export const PUBLIC_HOME_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'public-home-dark-mode',
  route: '/',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const PUBLIC_HOME_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'public-home-light-mode',
  route: '/',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const PUBLIC_HOME_MOBILE_HEADER_DRAWER_VISUAL_CHECK = Object.freeze({
  id: 'public-home-mobile-header-drawer',
  route: '/',
  viewport: 'mobile',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const PUBLIC_FAQ_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'public-faq-dark-mode',
  route: '/faq',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const PUBLIC_FAQ_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'public-faq-light-mode',
  route: '/faq',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const PUBLIC_SUPPORT_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'public-support-dark-mode',
  route: '/support',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const PUBLIC_SUPPORT_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'public-support-light-mode',
  route: '/support',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const PUBLIC_FOOTER_LINK_LAYOUT_VISUAL_CHECK = Object.freeze({
  id: 'public-footer-link-layout',
  route: '/',
  viewport: 'responsive',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

function rgbParts(value) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) {
    throw new Error(`Expected an rgb/rgba color, received: ${value}`)
  }

  return match.slice(1, 4).map(Number)
}

function expectDarkColor(value, label) {
  const [red, green, blue] = rgbParts(value)
  expect(red, `${label} red channel should stay dark`).toBeLessThanOrEqual(20)
  expect(green, `${label} green channel should stay dark`).toBeLessThanOrEqual(30)
  expect(blue, `${label} blue channel should stay dark`).toBeLessThanOrEqual(45)
}

function expectDarkInputSurface(value, label) {
  const [red, green, blue] = rgbParts(value)
  expect(red, `${label} red channel should stay dark`).toBeLessThanOrEqual(25)
  expect(green, `${label} green channel should stay dark`).toBeLessThanOrEqual(35)
  expect(blue, `${label} blue channel should stay dark`).toBeLessThanOrEqual(60)
}

function expectLightText(value, label) {
  const [red, green, blue] = rgbParts(value)
  expect(red, `${label} red channel should stay light`).toBeGreaterThanOrEqual(230)
  expect(green, `${label} green channel should stay light`).toBeGreaterThanOrEqual(235)
  expect(blue, `${label} blue channel should stay light`).toBeGreaterThanOrEqual(240)
}

function expectMutedLightText(value, label) {
  const [red, green, blue] = rgbParts(value)
  expect(red, `${label} red channel should stay readable on dark surfaces`).toBeGreaterThanOrEqual(140)
  expect(green, `${label} green channel should stay readable on dark surfaces`).toBeGreaterThanOrEqual(150)
  expect(blue, `${label} blue channel should stay readable on dark surfaces`).toBeGreaterThanOrEqual(165)
}

function expectLightSurface(value, label) {
  const [red, green, blue] = rgbParts(value)
  expect(red, `${label} red channel should stay light`).toBeGreaterThanOrEqual(245)
  expect(green, `${label} green channel should stay light`).toBeGreaterThanOrEqual(245)
  expect(blue, `${label} blue channel should stay light`).toBeGreaterThanOrEqual(245)
}

function expectDarkText(value, label) {
  const [red, green, blue] = rgbParts(value)
  expect(red, `${label} red channel should stay dark`).toBeLessThanOrEqual(60)
  expect(green, `${label} green channel should stay dark`).toBeLessThanOrEqual(75)
  expect(blue, `${label} blue channel should stay dark`).toBeLessThanOrEqual(95)
}

async function assertPublicCssLoaded(page) {
  await page.waitForLoadState('domcontentloaded')
  await expect.poll(async () => {
    try {
      await assertCssLoaded(page)
      return true
    } catch {
      return false
    }
  }, { timeout: 10_000 }).toBe(true)
}

async function waitForPublicTheme(page, theme) {
  await page.waitForFunction((expectedTheme) => {
    return document.documentElement.dataset.publicTheme === expectedTheme
  }, theme, { timeout: 15_000 })
}

function setPublicThemeBeforeLoad(page, theme) {
  return page.addInitScript((themeValue) => {
    window.localStorage?.setItem('pplus-public-theme', themeValue)
    document.documentElement.dataset.publicTheme = themeValue
  }, theme)
}

test.describe('PPLUS public visual/theme checks', () => {
  test('Home page dark mode check', async ({ page }) => {
    await setPublicThemeBeforeLoad(page, 'dark')
    await page.goto('/')
    await assertPublicCssLoaded(page)
    await expect(page.locator('.landing-page')).toBeVisible()
    await expect(page.locator('.landing-hero-title')).toBeVisible()

    const visualState = await page.evaluate(() => {
      const htmlTheme = document.documentElement.dataset.publicTheme || 'dark'
      const landingPage = document.querySelector('.landing-page')
      const heroTitle = document.querySelector('.landing-hero-title')
      const heroAccent = document.querySelector('.landing-hero-title-accent')
      const darkLogo = document.querySelector('.landing-logo-dark')
      const lightLogo = document.querySelector('.landing-logo-light')
      const featureCard = document.querySelector('.landing-feature-card')
      const programCard = document.querySelector('.landing-program-card')
      const themeToggle = document.querySelector('.public-theme-toggle')

      return {
        htmlTheme,
        bodyBackgroundColor: getComputedStyle(document.body).backgroundColor,
        landingBackgroundImage: getComputedStyle(landingPage).backgroundImage,
        landingTextColor: getComputedStyle(landingPage).color,
        heroTitleColor: getComputedStyle(heroTitle).color,
        heroAccentColor: getComputedStyle(heroAccent).color,
        darkLogoDisplay: getComputedStyle(darkLogo).display,
        lightLogoDisplay: getComputedStyle(lightLogo).display,
        featureCardBackgroundColor: getComputedStyle(featureCard).backgroundColor,
        programCardBackgroundColor: getComputedStyle(programCard).backgroundColor,
        themeTogglePressed: themeToggle?.getAttribute('aria-pressed'),
        themeToggleLabel: themeToggle?.getAttribute('aria-label'),
      }
    })

    const { htmlTheme } = visualState
    expect(htmlTheme).toBe('dark')
    expect(visualState.landingBackgroundImage).toContain('linear-gradient')
    expect(visualState.landingBackgroundImage).toContain('rgb(8, 17, 31)')
    expect(visualState.darkLogoDisplay).toBe('block')
    expect(visualState.lightLogoDisplay).toBe('none')
    expect(visualState.themeTogglePressed).toBe('false')
    expect(visualState.themeToggleLabel).toBe('Switch to light mode')
    expect(visualState.heroAccentColor).toBe('rgb(57, 229, 180)')

    expectDarkColor(visualState.bodyBackgroundColor, 'body background')
    expectDarkColor(visualState.featureCardBackgroundColor, 'feature card background')
    expectDarkColor(visualState.programCardBackgroundColor, 'program card background')
    expectLightText(visualState.landingTextColor, 'landing page text')
    expectLightText(visualState.heroTitleColor, 'hero title text')
  })

  test('Home page light mode check', async ({ page }) => {
    await setPublicThemeBeforeLoad(page, 'light')
    await page.goto('/')
    await assertPublicCssLoaded(page)
    await page.evaluate(() => {
      window.localStorage?.setItem('pplus-public-theme', 'light')
      document.documentElement.dataset.publicTheme = 'light'
    })
    await expect(page.locator('.landing-page')).toBeVisible()
    await expect(page.locator('.landing-hero-title')).toBeVisible()
    await page.waitForFunction(() => {
      const featureCard = document.querySelector('.landing-feature-card')
      return document.documentElement.dataset.publicTheme === 'light'
        && featureCard
        && getComputedStyle(featureCard).backgroundColor === 'rgb(255, 255, 255)'
    })

    const visualState = await page.evaluate(() => {
      const htmlTheme = document.documentElement.dataset.publicTheme || 'dark'
      const landingPage = document.querySelector('.landing-page')
      const heroTitle = document.querySelector('.landing-hero-title')
      const heroAccent = document.querySelector('.landing-hero-title-accent')
      const darkLogo = document.querySelector('.landing-logo-dark')
      const lightLogo = document.querySelector('.landing-logo-light')
      const featureCard = document.querySelector('.landing-feature-card')
      const programCard = document.querySelector('.landing-program-card')
      const themeToggle = document.querySelector('.public-theme-toggle')

      return {
        htmlTheme,
        landingBackgroundColor: getComputedStyle(landingPage).backgroundColor,
        landingBackgroundImage: getComputedStyle(landingPage).backgroundImage,
        landingTextColor: getComputedStyle(landingPage).color,
        heroTitleColor: getComputedStyle(heroTitle).color,
        heroAccentColor: getComputedStyle(heroAccent).color,
        darkLogoDisplay: getComputedStyle(darkLogo).display,
        lightLogoDisplay: getComputedStyle(lightLogo).display,
        featureCardBackgroundColor: getComputedStyle(featureCard).backgroundColor,
        programCardBackgroundColor: getComputedStyle(programCard).backgroundColor,
        themeTogglePressed: themeToggle?.getAttribute('aria-pressed'),
        themeToggleLabel: themeToggle?.getAttribute('aria-label'),
      }
    })

    const { htmlTheme } = visualState
    expect(htmlTheme).toBe('light')
    expect(visualState.landingBackgroundImage).toBe('none')
    expect(visualState.darkLogoDisplay).toBe('none')
    expect(visualState.lightLogoDisplay).toBe('block')
    expect(visualState.heroAccentColor).toBe('rgb(57, 229, 180)')

    expectLightSurface(visualState.landingBackgroundColor, 'landing page background')
    expectLightSurface(visualState.featureCardBackgroundColor, 'feature card background')
    expectLightSurface(visualState.programCardBackgroundColor, 'program card background')
    expectDarkText(visualState.landingTextColor, 'landing page text')
    expectDarkText(visualState.heroTitleColor, 'hero title text')
  })

  test('Home page mobile header/drawer check', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setPublicThemeBeforeLoad(page, 'dark')
    await page.goto('/')
    await assertPublicCssLoaded(page)

    const mobileHeader = page.locator('.landing-header-mobile')
    const desktopHeader = page.locator('.landing-header-desktop')
    const menuButton = page.locator('.landing-mobile-menu-button')

    await expect(page.locator('.landing-page')).toBeVisible()
    await expect(mobileHeader).toBeVisible()
    await expect(desktopHeader).toBeHidden()
    await expect(menuButton).toBeVisible()
    await expect(menuButton).toHaveAccessibleName('Open navigation menu')
    await expect(menuButton).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(1000)

    const closedMobileState = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      mobileHeaderDisplay: getComputedStyle(document.querySelector('.landing-header-mobile')).display,
      desktopHeaderDisplay: getComputedStyle(document.querySelector('.landing-header-desktop')).display,
    }))

    expect(closedMobileState.viewportWidth).toBe(390)
    expect(closedMobileState.mobileHeaderDisplay).toBe('flex')
    expect(closedMobileState.desktopHeaderDisplay).toBe('none')
    expect(closedMobileState.scrollWidth).toBeLessThanOrEqual(closedMobileState.clientWidth)

    const drawer = page.locator('.landing-mobile-menu-sheet')
    await expect.poll(async () => {
      await menuButton.click().catch(() => {})
      return await drawer.count()
    }, { timeout: 10_000 }).toBe(1)
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('heading', { name: 'Menu' })).toBeVisible()
    await expect(drawer.getByRole('button', { name: 'Close navigation menu' })).toBeVisible()
    await expect(drawer.locator('.landing-mobile-menu-link')).toHaveCount(4)
    await expect(drawer.getByRole('link', { name: 'Features' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Program' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'FAQ' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Support' })).toBeVisible()
    await expect(drawer.locator('.public-language-switcher')).toBeVisible()
    await expect(drawer.locator('.public-theme-toggle')).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Download PPLUS Training on the App Store' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: /Sign In/i })).toHaveCount(0)
    await expect(drawer.locator('a[href="/admin"], a[href="/admin/login"]')).toHaveCount(0)

    const darkDrawerState = await page.evaluate(() => {
      const drawerElement = document.querySelector('.landing-mobile-menu-sheet')
      const drawerLink = document.querySelector('.landing-mobile-menu-link')
      const closeButton = document.querySelector('.landing-mobile-menu-close')
      const themeToggle = drawerElement.querySelector('.public-theme-toggle')

      return {
        htmlTheme: document.documentElement.dataset.publicTheme || 'dark',
        drawerBackgroundColor: getComputedStyle(drawerElement).backgroundColor,
        drawerTextColor: getComputedStyle(drawerElement).color,
        drawerLinkColor: getComputedStyle(drawerLink).color,
        closeButtonColor: getComputedStyle(closeButton).color,
        themeToggleLabel: themeToggle?.getAttribute('aria-label'),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }
    })

    expect(darkDrawerState.htmlTheme).toBe('dark')
    expect(darkDrawerState.themeToggleLabel).toBe('Switch to light mode')
    expect(darkDrawerState.scrollWidth).toBeLessThanOrEqual(darkDrawerState.clientWidth)
    expectDarkColor(darkDrawerState.drawerBackgroundColor, 'mobile drawer dark background')
    expectLightText(darkDrawerState.drawerTextColor, 'mobile drawer dark text')
    expectLightText(darkDrawerState.drawerLinkColor, 'mobile drawer dark link text')
    expectMutedLightText(darkDrawerState.closeButtonColor, 'mobile drawer close control')

    await drawer.locator('.public-theme-toggle').click()
    await page.waitForFunction(() => document.documentElement.dataset.publicTheme === 'light')
    await page.waitForFunction(() => {
      const drawerElement = document.querySelector('.landing-mobile-menu-sheet')
      return drawerElement && getComputedStyle(drawerElement).backgroundColor === 'rgb(255, 255, 255)'
    })

    const lightDrawerState = await page.evaluate(() => {
      const drawerElement = document.querySelector('.landing-mobile-menu-sheet')
      const drawerLink = document.querySelector('.landing-mobile-menu-link')
      const closeButton = document.querySelector('.landing-mobile-menu-close')
      const themeToggle = drawerElement.querySelector('.public-theme-toggle')

      return {
        htmlTheme: document.documentElement.dataset.publicTheme || 'dark',
        drawerBackgroundColor: getComputedStyle(drawerElement).backgroundColor,
        drawerTextColor: getComputedStyle(drawerElement).color,
        drawerLinkColor: getComputedStyle(drawerLink).color,
        closeButtonColor: getComputedStyle(closeButton).color,
        themeToggleLabel: themeToggle?.getAttribute('aria-label'),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }
    })

    expect(lightDrawerState.htmlTheme).toBe('light')
    expect(lightDrawerState.themeToggleLabel).toBe('Switch to dark mode')
    expect(lightDrawerState.scrollWidth).toBeLessThanOrEqual(lightDrawerState.clientWidth)
    expectLightSurface(lightDrawerState.drawerBackgroundColor, 'mobile drawer light background')
    expectDarkText(lightDrawerState.drawerTextColor, 'mobile drawer light text')
    expectDarkText(lightDrawerState.drawerLinkColor, 'mobile drawer light link text')
    expectDarkText(lightDrawerState.closeButtonColor, 'mobile drawer close control')

    await drawer.getByRole('button', { name: 'Close navigation menu' }).click()
    await expect(drawer).toBeHidden()
  })

  test('FAQ dark mode check', async ({ page }) => {
    await setPublicThemeBeforeLoad(page, 'dark')
    await page.goto('/faq')
    await assertPublicCssLoaded(page)
    await expect(page.locator('.faq-page')).toBeVisible()
    await expect(page.locator('.faq-hero-title')).toBeVisible()
    await expect(page.locator('.faq-accordion-list')).toBeVisible()
    await expect(page.locator('.faq-item').first()).toBeVisible()

    const visualState = await page.evaluate(() => {
      const faqPage = document.querySelector('.faq-page')
      const faqTitle = document.querySelector('.faq-hero-title')
      const faqAccent = document.querySelector('.faq-hero-title span')
      const faqItem = document.querySelector('.faq-item')
      const faqSummary = document.querySelector('.faq-item summary')
      const faqAnswer = document.querySelector('.faq-item p')
      const themeToggle = document.querySelector('.public-theme-toggle')

      return {
        htmlTheme: document.documentElement.dataset.publicTheme || 'dark',
        bodyBackgroundColor: getComputedStyle(document.body).backgroundColor,
        faqBackgroundImage: getComputedStyle(faqPage).backgroundImage,
        faqBackgroundColor: getComputedStyle(faqPage).backgroundColor,
        faqTextColor: getComputedStyle(faqPage).color,
        faqTitleColor: getComputedStyle(faqTitle).color,
        faqAccentColor: getComputedStyle(faqAccent).color,
        faqBorderBottomColor: getComputedStyle(faqItem).borderBottomColor,
        faqSummaryColor: getComputedStyle(faqSummary).color,
        faqAnswerColor: getComputedStyle(faqAnswer).color,
        themeTogglePressed: themeToggle?.getAttribute('aria-pressed'),
        themeToggleLabel: themeToggle?.getAttribute('aria-label'),
      }
    })

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.faqBackgroundImage).toContain('linear-gradient')
    expect(visualState.faqBackgroundImage).toContain('rgb(8, 17, 31)')
    expect(visualState.faqAccentColor).toBe('rgb(57, 229, 180)')
    expect(visualState.themeTogglePressed).toBe('false')
    expect(visualState.themeToggleLabel).toBe('Switch to light mode')

    expectDarkColor(visualState.bodyBackgroundColor, 'FAQ body background')
    expectLightText(visualState.faqTextColor, 'FAQ page text')
    expectLightText(visualState.faqTitleColor, 'FAQ title text')
    expectLightText(visualState.faqSummaryColor, 'FAQ question text')
    expectMutedLightText(visualState.faqAnswerColor, 'FAQ answer text')
    expectMutedLightText(visualState.faqBorderBottomColor, 'FAQ divider')
  })

  test('FAQ light mode check', async ({ page }) => {
    await setPublicThemeBeforeLoad(page, 'light')
    await page.goto('/faq')
    await assertPublicCssLoaded(page)
    await page.evaluate(() => {
      window.localStorage?.setItem('pplus-public-theme', 'light')
      document.documentElement.dataset.publicTheme = 'light'
    })
    await expect(page.locator('.faq-page')).toBeVisible()
    await expect(page.locator('.faq-hero-title')).toBeVisible()
    await expect(page.locator('.faq-accordion-list')).toBeVisible()
    await page.waitForFunction(() => {
      const faqPage = document.querySelector('.faq-page')
      return document.documentElement.dataset.publicTheme === 'light'
        && faqPage
        && getComputedStyle(faqPage).backgroundColor === 'rgb(255, 255, 255)'
    })

    const visualState = await page.evaluate(() => {
      const faqPage = document.querySelector('.faq-page')
      const faqTitle = document.querySelector('.faq-hero-title')
      const faqAccent = document.querySelector('.faq-hero-title span')
      const faqItem = document.querySelector('.faq-item')
      const faqSummary = document.querySelector('.faq-item summary')
      const faqAnswer = document.querySelector('.faq-item p')
      const themeToggle = document.querySelector('.public-theme-toggle')

      return {
        htmlTheme: document.documentElement.dataset.publicTheme || 'dark',
        faqBackgroundImage: getComputedStyle(faqPage).backgroundImage,
        faqBackgroundColor: getComputedStyle(faqPage).backgroundColor,
        faqTextColor: getComputedStyle(faqPage).color,
        faqTitleColor: getComputedStyle(faqTitle).color,
        faqAccentColor: getComputedStyle(faqAccent).color,
        faqBorderBottomColor: getComputedStyle(faqItem).borderBottomColor,
        faqSummaryColor: getComputedStyle(faqSummary).color,
        faqAnswerColor: getComputedStyle(faqAnswer).color,
        themeTogglePressed: themeToggle?.getAttribute('aria-pressed'),
        themeToggleLabel: themeToggle?.getAttribute('aria-label'),
      }
    })

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.faqBackgroundImage).toBe('none')
    expect(visualState.faqAccentColor).toBe('rgb(57, 229, 180)')

    expectLightSurface(visualState.faqBackgroundColor, 'FAQ light background')
    expectDarkText(visualState.faqTextColor, 'FAQ light page text')
    expectDarkText(visualState.faqTitleColor, 'FAQ light title text')
    expectDarkText(visualState.faqSummaryColor, 'FAQ light question text')
    expectDarkText(visualState.faqAnswerColor, 'FAQ light answer text')
    expectDarkText(visualState.faqBorderBottomColor, 'FAQ light divider')
  })

  test('Support page dark mode check', async ({ page }) => {
    await setPublicThemeBeforeLoad(page, 'dark')
    await page.goto('/support')
    await assertPublicCssLoaded(page)
    await expect(page.locator('.support-template-page')).toBeVisible()
    await expect(page.locator('.support-template-heading-on-image')).toBeVisible()
    await expect(page.locator('.support-template-card')).toBeVisible()
    await expect(page.locator('.support-template-form')).toBeVisible()
    await expect(page.locator('.support-dashboard-input').first()).toBeVisible()
    await expect(page.locator('.support-dashboard-textarea')).toBeVisible()

    const visualState = await page.evaluate(() => {
      const supportPage = document.querySelector('.support-template-page')
      const heading = document.querySelector('.support-template-heading-on-image h2')
      const headingAccent = document.querySelector('.support-template-heading-on-image h2 span')
      const pill = document.querySelector('.support-template-pill')
      const form = document.querySelector('.support-template-form')
      const label = document.querySelector('.support-template-field [data-slot="field-label"]')
      const input = document.querySelector('.support-dashboard-input')
      const textarea = document.querySelector('.support-dashboard-textarea')
      const submitButton = document.querySelector('.support-template-submit-button')
      const themeToggle = document.querySelector('.public-theme-toggle')

      return {
        htmlTheme: document.documentElement.dataset.publicTheme || 'dark',
        bodyBackgroundColor: getComputedStyle(document.body).backgroundColor,
        supportBackgroundImage: getComputedStyle(supportPage).backgroundImage,
        supportTextColor: getComputedStyle(supportPage).color,
        headingColor: getComputedStyle(heading).color,
        headingAccentColor: getComputedStyle(headingAccent).color,
        pillBackgroundColor: getComputedStyle(pill).backgroundColor,
        formInputBorder: getComputedStyle(form).getPropertyValue('--support-dashboard-input-border').trim(),
        labelColor: getComputedStyle(label).color,
        inputBackgroundColor: getComputedStyle(input).backgroundColor,
        inputTextColor: getComputedStyle(input).color,
        textareaBackgroundColor: getComputedStyle(textarea).backgroundColor,
        textareaTextColor: getComputedStyle(textarea).color,
        submitButtonBackgroundColor: getComputedStyle(submitButton).backgroundColor,
        submitButtonColor: getComputedStyle(submitButton).color,
        themeTogglePressed: themeToggle?.getAttribute('aria-pressed'),
        themeToggleLabel: themeToggle?.getAttribute('aria-label'),
      }
    })

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.supportBackgroundImage).toContain('linear-gradient')
    expect(visualState.supportBackgroundImage).toContain('rgb(8, 17, 31)')
    expect(visualState.headingAccentColor).toBe('rgb(57, 229, 180)')
    expect(visualState.formInputBorder).toBe('#24334a')
    expect(visualState.submitButtonBackgroundColor).toBe('rgb(59, 224, 175)')
    expect(visualState.themeTogglePressed).toBe('false')
    expect(visualState.themeToggleLabel).toBe('Switch to light mode')

    expectDarkColor(visualState.bodyBackgroundColor, 'Support body background')
    expectDarkInputSurface(visualState.inputBackgroundColor, 'Support dark input background')
    expectDarkInputSurface(visualState.textareaBackgroundColor, 'Support dark textarea background')
    expectLightText(visualState.supportTextColor, 'Support page text')
    expectLightText(visualState.headingColor, 'Support heading text')
    expectMutedLightText(visualState.labelColor, 'Support field label')
    expectMutedLightText(visualState.inputTextColor, 'Support dark input text')
    expectMutedLightText(visualState.textareaTextColor, 'Support dark textarea text')
    expectDarkText(visualState.submitButtonColor, 'Support submit button text')
  })

  test('Support page light mode check', async ({ page }) => {
    await setPublicThemeBeforeLoad(page, 'light')
    await page.goto('/support')
    await assertPublicCssLoaded(page)
    await page.evaluate(() => {
      window.localStorage?.setItem('pplus-public-theme', 'light')
      document.documentElement.dataset.publicTheme = 'light'
    })
    await expect(page.locator('.support-template-page')).toBeVisible()
    await expect(page.locator('.support-template-heading-on-image')).toBeVisible()
    await expect(page.locator('.support-template-form')).toBeVisible()
    await page.waitForFunction(() => {
      const supportPage = document.querySelector('.support-template-page')
      const input = document.querySelector('.support-dashboard-input')
      return document.documentElement.dataset.publicTheme === 'light'
        && supportPage
        && input
        && getComputedStyle(supportPage).backgroundColor === 'rgb(255, 255, 255)'
        && getComputedStyle(input).backgroundColor === 'rgb(255, 255, 255)'
    })

    const visualState = await page.evaluate(() => {
      const supportPage = document.querySelector('.support-template-page')
      const heading = document.querySelector('.support-template-heading-on-image h2')
      const headingAccent = document.querySelector('.support-template-heading-on-image h2 span')
      const pill = document.querySelector('.support-template-pill')
      const form = document.querySelector('.support-template-form')
      const label = document.querySelector('.support-template-field [data-slot="field-label"]')
      const input = document.querySelector('.support-dashboard-input')
      const textarea = document.querySelector('.support-dashboard-textarea')
      const submitButton = document.querySelector('.support-template-submit-button')
      const themeToggle = document.querySelector('.public-theme-toggle')

      return {
        htmlTheme: document.documentElement.dataset.publicTheme || 'dark',
        supportBackgroundImage: getComputedStyle(supportPage).backgroundImage,
        supportBackgroundColor: getComputedStyle(supportPage).backgroundColor,
        supportTextColor: getComputedStyle(supportPage).color,
        headingColor: getComputedStyle(heading).color,
        headingAccentColor: getComputedStyle(headingAccent).color,
        pillBackgroundColor: getComputedStyle(pill).backgroundColor,
        formInputBorder: getComputedStyle(form).getPropertyValue('--support-dashboard-input-border').trim(),
        labelColor: getComputedStyle(label).color,
        inputBackgroundColor: getComputedStyle(input).backgroundColor,
        inputTextColor: getComputedStyle(input).color,
        textareaBackgroundColor: getComputedStyle(textarea).backgroundColor,
        textareaTextColor: getComputedStyle(textarea).color,
        submitButtonBackgroundColor: getComputedStyle(submitButton).backgroundColor,
        submitButtonColor: getComputedStyle(submitButton).color,
        themeTogglePressed: themeToggle?.getAttribute('aria-pressed'),
        themeToggleLabel: themeToggle?.getAttribute('aria-label'),
      }
    })

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.supportBackgroundImage).toBe('none')
    expect(visualState.headingAccentColor).toBe('rgb(57, 229, 180)')
    expect(visualState.formInputBorder).toBe('rgba(15, 23, 42, 0.14)')
    expect(visualState.submitButtonBackgroundColor).toBe('rgb(59, 224, 175)')

    expectLightSurface(visualState.supportBackgroundColor, 'Support light background')
    expectLightSurface(visualState.inputBackgroundColor, 'Support light input background')
    expectLightSurface(visualState.textareaBackgroundColor, 'Support light textarea background')
    expectDarkText(visualState.supportTextColor, 'Support light page text')
    expectDarkText(visualState.headingColor, 'Support light heading text')
    expectDarkText(visualState.labelColor, 'Support light field label')
    expectDarkText(visualState.inputTextColor, 'Support light input text')
    expectDarkText(visualState.textareaTextColor, 'Support light textarea text')
    expectDarkText(visualState.submitButtonColor, 'Support submit button text')
  })

  test('Public footer/link layout check', async ({ page }) => {
    await setPublicThemeBeforeLoad(page, 'dark')
    await page.goto('/')
    await assertPublicCssLoaded(page)

    const footer = page.locator('.landing-footer')
    const footerGrid = footer.locator('.landing-footer-grid')
    const footerBrand = footer.locator('.landing-footer-brand-block')
    const footerColumns = footer.locator('.landing-footer-column')
    const footerMeta = footer.locator('.landing-footer-meta')

    await expect(footer).toBeVisible()
    await footer.scrollIntoViewIfNeeded()
    await expect(footerGrid).toBeVisible()
    await expect(footerBrand).toBeVisible()
    await expect(footerColumns).toHaveCount(3)
    await expect(footerMeta).toBeVisible()
    await expect(footer.locator('.landing-footer-logo-link')).toHaveAttribute('href', '/')
    await expect(footer.locator('.landing-footer-logo-link')).toHaveAccessibleName('PPLUS Training home')
    await expect(footer.getByRole('heading', { name: 'Features' })).toBeVisible()
    await expect(footer.getByRole('heading', { name: 'Programs' })).toBeVisible()
    await expect(footer.getByRole('heading', { name: 'Resources' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Support' })).toHaveAttribute('href', '/support')
    await expect(footer.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq')
    await expect(footer.locator('a[href^="https://www.google.com/maps/search/"]')).toHaveAttribute('target', '_blank')
    await expect(footer.locator('a[href^="https://www.google.com/maps/search/"]')).toHaveAttribute('rel', /noopener noreferrer/)
    await expect(footer.locator('a[href^="tel:"]')).toHaveCount(1)
    await expect(footer.locator('address .landing-footer-contact-item')).toHaveCount(3)
    await expect(footer.locator('address .landing-footer-contact-item').filter({ hasText: '@' }).locator('a')).toHaveCount(0)
    await expect(footer.locator('.public-theme-toggle')).toBeVisible()
    await expect(footer.locator('a[href="/admin"], a[href="/admin/login"]')).toHaveCount(0)

    const desktopFooterState = await page.evaluate(() => {
      const footerElement = document.querySelector('.landing-footer')
      const grid = document.querySelector('.landing-footer-grid')
      const brand = document.querySelector('.landing-footer-brand-block')
      const columns = Array.from(document.querySelectorAll('.landing-footer-column'))
      const meta = document.querySelector('.landing-footer-meta')
      const supportLink = Array.from(footerElement.querySelectorAll('a')).find((link) => link.textContent?.trim() === 'Support')
      const firstColumnLink = document.querySelector('.landing-footer-column a')

      return {
        viewportWidth: window.innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        footerDisplay: getComputedStyle(footerElement).display,
        gridColumnCount: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
        brandColumnStart: getComputedStyle(brand).gridColumnStart,
        columnCount: columns.length,
        columnsHaveListReset: columns.every((column) => getComputedStyle(column.querySelector('ul')).listStyleType === 'none'),
        columnsBelowBrandTop: columns.every((column) => column.getBoundingClientRect().top >= brand.getBoundingClientRect().top - 1),
        metaDisplay: getComputedStyle(meta).display,
        metaJustify: getComputedStyle(meta).justifyContent,
        footerTextColor: getComputedStyle(footerElement).color,
        firstColumnLinkColor: getComputedStyle(firstColumnLink).color,
        supportHref: supportLink?.getAttribute('href'),
      }
    })

    expect(desktopFooterState.viewportWidth).toBeGreaterThanOrEqual(900)
    expect(desktopFooterState.scrollWidth).toBeLessThanOrEqual(desktopFooterState.clientWidth)
    expect(desktopFooterState.gridColumnCount).toBe(4)
    expect(desktopFooterState.brandColumnStart).toBe('auto')
    expect(desktopFooterState.columnCount).toBe(3)
    expect(desktopFooterState.columnsHaveListReset).toBe(true)
    expect(desktopFooterState.columnsBelowBrandTop).toBe(true)
    expect(desktopFooterState.metaDisplay).toBe('flex')
    expect(desktopFooterState.metaJustify).toBe('space-between')
    expect(desktopFooterState.supportHref).toBe('/support')
    expectMutedLightText(desktopFooterState.footerTextColor, 'footer dark text')
    expectMutedLightText(desktopFooterState.firstColumnLinkColor, 'footer dark link text')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await assertPublicCssLoaded(page)
    await page.locator('.landing-footer').scrollIntoViewIfNeeded()
    await expect(page.locator('.landing-footer')).toBeVisible()

    const mobileFooterState = await page.evaluate(() => {
      const grid = document.querySelector('.landing-footer-grid')
      const brand = document.querySelector('.landing-footer-brand-block')
      const columns = Array.from(document.querySelectorAll('.landing-footer-column'))
      const meta = document.querySelector('.landing-footer-meta')
      const footerLinks = Array.from(document.querySelectorAll('.landing-footer-column a'))

      return {
        viewportWidth: window.innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        gridColumnCount: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
        brandGridColumn: getComputedStyle(brand).gridColumn,
        columnsStackBelowBrand: columns.every((column) => column.getBoundingClientRect().top > brand.getBoundingClientRect().top),
        linksWithinViewport: footerLinks.every((link) => link.getBoundingClientRect().right <= document.documentElement.clientWidth + 1),
        metaFlexWrap: getComputedStyle(meta).flexWrap,
      }
    })

    expect(mobileFooterState.viewportWidth).toBe(390)
    expect(mobileFooterState.scrollWidth).toBeLessThanOrEqual(mobileFooterState.clientWidth)
    expect(mobileFooterState.gridColumnCount).toBe(1)
    expect(mobileFooterState.brandGridColumn).toBe('1 / -1')
    expect(mobileFooterState.columnsStackBelowBrand).toBe(true)
    expect(mobileFooterState.linksWithinViewport).toBe(true)
    expect(mobileFooterState.metaFlexWrap).toBe('wrap')
  })
})
