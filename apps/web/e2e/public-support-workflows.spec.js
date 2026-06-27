import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'

export const PUBLIC_SUPPORT_FORM_VALIDATION_WORKFLOW_CHECK = Object.freeze({
  id: 'public-support-form-validation',
  route: '/support',
  interaction: 'support-form-validation',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const PUBLIC_SUPPORT_FORM_SAFE_CREATE_WORKFLOW_CHECK = Object.freeze({
  id: 'public-support-form-safe-create',
  route: '/support',
  interaction: 'support-form-safe-test-request-create',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const PUBLIC_LANGUAGE_ROUTE_NAVIGATION_WORKFLOW_CHECK = Object.freeze({
  id: 'public-language-route-navigation',
  route: '/',
  interaction: 'language-switch-persists-across-public-navigation',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const PUBLIC_THEME_ROUTE_NAVIGATION_WORKFLOW_CHECK = Object.freeze({
  id: 'public-theme-route-navigation',
  route: '/',
  interaction: 'theme-switch-persists-across-public-navigation',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

async function chooseSupportCategory(page, optionName = /Technical/i) {
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: optionName }).click()
}

async function fillSupportForm(page, values) {
  await page.getByLabel(/First Name/i).fill(values.firstName)
  await page.getByLabel(/Last Name/i).fill(values.lastName)
  await page.getByLabel(/Email/i).fill(values.email)
  await chooseSupportCategory(page, values.categoryOption || /Technical/i)
  await page.getByLabel(/Description/i).fill(values.description)
}

test.describe('PPLUS public support safe workflows', () => {
  test('Public language switch persists across public route navigation', async ({ page }) => {
    await page.goto('/')
    await assertCssLoaded(page)

    const desktopHeader = page.locator('.landing-header-desktop')
    await desktopHeader.getByRole('link', { name: 'FR' }).click()
    await expect(page).toHaveURL(/\/\?lang=fr$/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pplus-public-language'))).toBe('fr')

    await desktopHeader.getByRole('link', { name: 'FAQ' }).click()
    await expect(page).toHaveURL(/\/faq\?lang=fr$/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pplus-public-language'))).toBe('fr')
    await expect(page.locator('main')).toContainText(/fréquentes|programmes/i)

    await page.locator('.landing-header-desktop').getByRole('link', { name: 'Support' }).click()
    await expect(page).toHaveURL(/\/support\?lang=fr$/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pplus-public-language'))).toBe('fr')
    await expect(page.locator('main')).toContainText(/support|demande/i)
  })

  test('Public theme switch persists across public route navigation', async ({ page }) => {
    await page.goto('/')
    await assertCssLoaded(page)

    await page.locator('.landing-footer').getByRole('button', { name: /Switch to light mode/ }).click()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pplus-public-theme'))).toBe('light')
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.publicTheme)).toBe('light')

    await page.locator('.landing-header-desktop').getByRole('link', { name: 'FAQ' }).click()
    await expect(page).toHaveURL(/\/faq$/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pplus-public-theme'))).toBe('light')
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.publicTheme)).toBe('light')
    await expect(page.locator('main')).toContainText(/frequently|programs/i)

    await page.locator('.landing-header-desktop').getByRole('link', { name: 'Support' }).click()
    await expect(page).toHaveURL(/\/support$/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pplus-public-theme'))).toBe('light')
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.publicTheme)).toBe('light')
    await expect(page.locator('main')).toContainText(/support|message/i)
  })

  test('Public support form validation works', async ({ page }) => {
    const supportApiRequests = []

    await page.route('**/api/support-requests', async (route) => {
      supportApiRequests.push(JSON.parse(route.request().postData() || '{}'))
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          supportRequestId: 'support-request-playwright',
          supportConversationId: 'conversation-playwright',
        }),
      })
    })

    await page.goto('/support')
    await assertCssLoaded(page)

    const form = page.locator('.support-template-form')
    await expect(form).toBeVisible()

    await page.getByRole('button', { name: /submit|send/i }).click()
    await expect(form).toContainText('This field is required')
    await expect(form).toContainText('Please select an item')
    expect(supportApiRequests).toHaveLength(0)

    await page.getByLabel(/First Name/i).fill('Jane')
    await page.getByLabel(/Last Name/i).fill('Hockey')
    await page.getByLabel(/Email/i).fill('not-an-email')
    await chooseSupportCategory(page)
    await page.getByLabel(/Description/i).fill('Video will not load')
    await page.getByRole('button', { name: /submit|send/i }).click()
    await expect(form).toContainText('Please enter a valid email')
    expect(supportApiRequests).toHaveLength(0)

    await page.getByLabel(/Email/i).fill('JANE@EXAMPLE.COM')
    await page.getByRole('button', { name: /submit|send/i }).click()

    await expect(page.locator('.support-template-success')).toBeVisible()
    await expect(page.locator('.support-template-success')).toContainText(/sent|submitted|received|thank/i)
    expect(supportApiRequests).toEqual([
      {
        firstName: 'Jane',
        lastName: 'Hockey',
        email: 'JANE@EXAMPLE.COM',
        category: 'technical',
        description: 'Video will not load',
      },
    ])
  })

  test('Public support form creates a safe test support request', async ({ page }) => {
    const supportApiRequests = []
    const requestUrls = []

    page.on('request', (request) => {
      requestUrls.push(request.url())
    })

    await page.route('**/api/support-requests', async (route) => {
      supportApiRequests.push(JSON.parse(route.request().postData() || '{}'))
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          supportRequestId: 'support-request-safe-playwright',
          supportConversationId: 'conversation-safe-playwright',
        }),
      })
    })

    await page.goto('/support')
    await assertCssLoaded(page)

    await fillSupportForm(page, {
      firstName: 'PPLUS',
      lastName: 'Safe Test',
      email: 'pplus-safe-support-test@example.com',
      categoryOption: /Technical/i,
      description: 'PPLUS SAFE TEST SUPPORT REQUEST - browser workflow should create only this mocked test request.',
    })
    await page.getByRole('button', { name: /submit|send/i }).click()

    await expect(page.locator('.support-template-success')).toBeVisible()
    expect(supportApiRequests).toEqual([
      {
        firstName: 'PPLUS',
        lastName: 'Safe Test',
        email: 'pplus-safe-support-test@example.com',
        category: 'technical',
        description: 'PPLUS SAFE TEST SUPPORT REQUEST - browser workflow should create only this mocked test request.',
      },
    ])
    expect(requestUrls.join('\n')).not.toContain('api.loops.so')
  })
})
