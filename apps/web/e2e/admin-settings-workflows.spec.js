import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'

export const ADMIN_SETTINGS_PROFILE_UPDATE_VISIBLE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-settings-profile-update-saves-visible-name-avatar',
  route: '/admin/settings',
  interaction: 'profile-update-saves-visible-name-avatar',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_SETTINGS_ACCOUNT_VALIDATION_ERROR_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-settings-account-validation-errors-visible',
  route: '/admin/settings/account',
  interaction: 'account-validation-errors-appear-visibly',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_SETTINGS_ACCOUNT_SAVE_TOAST_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-settings-account-save-renders-toast',
  route: '/admin/settings/account',
  interaction: 'account-save-renders-success-toast',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const initialCoachAvatarUrl = 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_3.png'
const updatedCoachAvatarUrl = 'https://cdn.pplus.test/coach-avatars/updated-workflow-coach.png'

async function seedAdminCookies(page) {
  const cookieUrl = resolveWebBaseUrl()
  await page.context().addCookies([
    {
      name: 'pplus_admin_access_token',
      value: 'settings-workflow-access-token',
      url: cookieUrl,
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'pplus_admin_refresh_token',
      value: 'settings-workflow-refresh-token',
      url: cookieUrl,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

test.describe('Admin Settings workflows', () => {
  test('Profile update saves visible name/avatar', async ({ page }) => {
    await seedAdminCookies(page)

    let profile = {
      id: 'coach-profile-1',
      name: 'Anthony Fortugno',
      firstName: 'Anthony',
      lastName: 'Fortugno',
      phone: '555-0101',
      email: 'tonyfortugno22@gmail.com',
      avatarUrl: initialCoachAvatarUrl,
    }
    const profilePatchRequests = []

    await page.route('https://cdn.pplus.test/coach-avatars/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGOSHzRgAAAAABJRU5ErkJggg==',
          'base64',
        ),
      })
    })

    await page.route(/\/admin\/api\/settings\/profile(?:\?.*)?$/, async (route) => {
      const request = route.request()

      if (request.method() === 'PATCH') {
        const body = request.postDataJSON()
        profilePatchRequests.push(body)
        expect(body.firstName).toBe('Updated')
        expect(body.lastName).toBe('Workflow Coach')
        expect(body.phone).toBe('555-9090')
        expect(body.avatarUpload?.fileName).toBe('updated-coach.png')
        expect(body.avatarUpload?.contentType).toBe('image/png')
        expect(body.avatarUpload?.dataUrl).toContain('data:image/png;base64,')

        profile = {
          ...profile,
          name: 'Updated Workflow Coach',
          firstName: 'Updated',
          lastName: 'Workflow Coach',
          phone: '555-9090',
          avatarUrl: updatedCoachAvatarUrl,
        }
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ profile }),
      })
    })

    await page.route('**/api/admin/athletes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ athletes: [] }),
      })
    })

    await page.goto('/admin/settings')
    await assertCssLoaded(page, { route: '/admin/settings' })
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar-primary-text').filter({ hasText: 'Anthony Fortugno' })).toBeVisible()
    await expect(page.locator('.admin-settings-profile-avatar')).toHaveAttribute('src', initialCoachAvatarUrl)

    await page.locator('.admin-settings-profile-first-name').fill('Updated')
    await page.locator('.admin-settings-profile-last-name').fill('Workflow Coach')
    await page.locator('.admin-settings-profile-phone').fill('555-9090')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'updated-coach.png',
      mimeType: 'image/png',
      buffer: Buffer.from('safe-test-avatar'),
    })
    await expect(page.locator('.admin-settings-profile-avatar')).toHaveAttribute('src', /data:image\/png;base64,/)

    await page.getByRole('button', { name: /Save changes/i }).click()

    await expect(page.locator('#admin-profile-status-notice')).toContainText('Profile updated.')
    await expect(page.getByText('Profile saved')).toBeVisible()
    await expect(page.getByText('Your profile changes are live.')).toBeVisible()
    expect(profilePatchRequests).toHaveLength(1)
    await expect(page.locator('.admin-settings-profile-avatar')).toHaveAttribute('src', updatedCoachAvatarUrl)
    await expect(page.locator('.admin-dashboard-sidebar-primary-text').filter({ hasText: 'Updated Workflow Coach' })).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar-account-avatar')).toHaveAttribute('src', updatedCoachAvatarUrl)
    await expect(page.locator('.admin-dashboard-topbar-avatar')).toHaveAttribute('src', updatedCoachAvatarUrl)
  })

  test('Account validation errors appear visibly', async ({ page }) => {
    await seedAdminCookies(page)

    const accountPatchRequests = []

    await page.route(/\/admin\/api\/settings\/profile(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            id: 'coach-profile-1',
            name: 'Anthony Fortugno',
            firstName: 'Anthony',
            lastName: 'Fortugno',
            phone: '555-0101',
            email: 'tonyfortugno22@gmail.com',
            avatarUrl: initialCoachAvatarUrl,
          },
        }),
      })
    })

    await page.route('**/admin/api/settings/account**', async (route) => {
      const request = route.request()
      if (request.method() === 'PATCH') {
        const body = request.postDataJSON()
        accountPatchRequests.push(body)
        expect(body.email).toBe('coach@example.com')
        expect(body.password).toBe('one-password')
        expect(body.confirmPassword).toBe('other-password')
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'New password and confirmation must match.' }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ account: { email: 'coach@example.com' } }),
      })
    })

    await page.route('**/api/admin/athletes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ athletes: [] }),
      })
    })

    await page.goto('/admin/settings/account')
    await assertCssLoaded(page, { route: '/admin/settings/account' })
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()

    await page.locator('.admin-settings-account-email').fill('coach@example.com')
    await page.locator('.admin-settings-account-current-password').fill('current-password')
    await page.locator('.admin-settings-account-new-password').fill('one-password')
    await page.locator('.admin-settings-account-confirm-password').fill('other-password')
    await page.locator('.admin-settings-account-submit').click()

    const validationAlert = page.getByRole('alert', { name: 'Account validation error' })
    await expect(validationAlert).toBeVisible()
    await expect(validationAlert).toContainText('New password and confirmation must match.')
    await expect(page.locator('#admin-account-status-notice')).toHaveClass(/border-\[#ef4444\]\/40/)
    await expect(page.locator('.admin-settings-account-new-password')).toHaveValue('one-password')
    await expect(page.locator('.admin-settings-account-confirm-password')).toHaveValue('other-password')
    expect(accountPatchRequests).toHaveLength(1)
  })

  test('Account save renders success toast', async ({ page }) => {
    await seedAdminCookies(page)

    const accountPatchRequests = []

    await page.route(/\/admin\/api\/settings\/profile(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            id: 'coach-profile-1',
            name: 'Anthony Fortugno',
            firstName: 'Anthony',
            lastName: 'Fortugno',
            phone: '555-0101',
            email: 'tonyfortugno22@gmail.com',
            avatarUrl: initialCoachAvatarUrl,
          },
        }),
      })
    })

    await page.route('**/admin/api/settings/account**', async (route) => {
      const request = route.request()
      if (request.method() === 'PATCH') {
        const body = request.postDataJSON()
        accountPatchRequests.push(body)
        expect(body.email).toBe('coach-updated@example.com')
        expect(body.currentPassword).toBe('current-password')
        expect(body.password).toBe('new-password')
        expect(body.confirmPassword).toBe('new-password')
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ account: { email: 'coach-updated@example.com' } }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ account: { email: 'coach@example.com' } }),
      })
    })

    await page.route('**/api/admin/athletes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ athletes: [] }),
      })
    })

    await page.goto('/admin/settings/account')
    await assertCssLoaded(page, { route: '/admin/settings/account' })
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()

    await page.locator('.admin-settings-account-email').fill('coach-updated@example.com')
    await page.locator('.admin-settings-account-current-password').fill('current-password')
    await page.locator('.admin-settings-account-new-password').fill('new-password')
    await page.locator('.admin-settings-account-confirm-password').fill('new-password')
    await page.locator('.admin-settings-account-submit').click()

    await expect(page.locator('#admin-account-status-notice')).toContainText('Account updated.')
    await expect(page.getByText('Account saved')).toBeVisible()
    await expect(page.getByText('Your account changes are saved.')).toBeVisible()
    await expect(page.locator('.admin-settings-account-email')).toHaveValue('coach-updated@example.com')
    await expect(page.locator('.admin-settings-account-current-password')).toHaveValue('')
    await expect(page.locator('.admin-settings-account-new-password')).toHaveValue('')
    await expect(page.locator('.admin-settings-account-confirm-password')).toHaveValue('')
    expect(accountPatchRequests).toHaveLength(1)
  })

})
