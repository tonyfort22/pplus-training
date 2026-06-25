import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'

export const ADMIN_SIDEBAR_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-sidebar-dark-mode',
  route: '/admin/dashboard',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_SIDEBAR_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-sidebar-light-mode',
  route: '/admin/dashboard',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_TOPBAR_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-topbar-dark-mode',
  route: '/admin/dashboard',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_TOPBAR_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-topbar-light-mode',
  route: '/admin/dashboard',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_ACCOUNT_DROPDOWN_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-account-dropdown-dark-mode',
  route: '/admin/dashboard',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_ACCOUNT_DROPDOWN_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-account-dropdown-light-mode',
  route: '/admin/dashboard',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_ROUTE_ACTIVE_STATE_CHECK = Object.freeze({
  id: 'admin-route-active-state',
  route: '/admin/programs/program-1',
  interaction: 'active-route-state',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_NO_DEFAULT_CONTROLS_CHECK = Object.freeze({
  id: 'admin-no-default-controls',
  route: '/admin/dashboard',
  interaction: 'control-appearance-reset',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_MOBILE_TABLET_WIDTH_CHECK = Object.freeze({
  id: 'admin-mobile-tablet-width',
  route: '/admin/dashboard',
  viewport: 'responsive',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_SUPPORT_INBOX_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-support-inbox-dark-mode',
  route: '/admin/support/reference',
  theme: 'dark',
  interaction: 'support-inbox-shell',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_SUPPORT_INBOX_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-support-inbox-light-mode',
  route: '/admin/support/reference',
  theme: 'light',
  interaction: 'support-inbox-shell',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_SETTINGS_PROFILE_ACCOUNT_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-settings-profile-account-dark-mode',
  route: '/admin/settings',
  theme: 'dark',
  interaction: 'profile-account-forms',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_SETTINGS_PROFILE_ACCOUNT_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-settings-profile-account-light-mode',
  route: '/admin/settings',
  theme: 'light',
  interaction: 'profile-account-forms',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_DASHBOARD_KPI_CARD_TABLE_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-dashboard-kpi-card-table-dark-mode',
  route: '/admin/dashboard',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_DASHBOARD_KPI_CARD_TABLE_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-dashboard-kpi-card-table-light-mode',
  route: '/admin/dashboard',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_ATHLETES_TABLE_FILTER_DIALOG_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-athletes-table-filter-dialog-dark-mode',
  route: '/admin/athletes',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_ATHLETES_TABLE_FILTER_DIALOG_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-athletes-table-filter-dialog-light-mode',
  route: '/admin/athletes',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_INVITES_TABLE_DIALOG_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-invites-table-dialog-dark-mode',
  route: '/admin/athletes/invites',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_INVITES_TABLE_DIALOG_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-invites-table-dialog-light-mode',
  route: '/admin/athletes/invites',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_GROUPS_TABLE_DIALOG_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-groups-table-dialog-dark-mode',
  route: '/admin/athletes/groups',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_GROUPS_TABLE_DIALOG_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-groups-table-dialog-light-mode',
  route: '/admin/athletes/groups',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_RANKINGS_TABLE_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-rankings-table-dark-mode',
  route: '/admin/athletes/rankings',
  theme: 'dark',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_RANKINGS_TABLE_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-rankings-table-light-mode',
  route: '/admin/athletes/rankings',
  theme: 'light',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_PROGRAMS_TABLE_SHEETS_DROPDOWNS_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-programs-table-sheets-dropdowns-dark-mode',
  route: '/admin/programs',
  theme: 'dark',
  interaction: 'table-sheets-dropdowns',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_PROGRAMS_TABLE_SHEETS_DROPDOWNS_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-programs-table-sheets-dropdowns-light-mode',
  route: '/admin/programs',
  theme: 'light',
  interaction: 'table-sheets-dropdowns',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_WORKOUTS_TABLE_SHEETS_DROPDOWNS_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-workouts-table-sheets-dropdowns-dark-mode',
  route: '/admin/workouts',
  theme: 'dark',
  interaction: 'table-sheets-dropdowns',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_WORKOUTS_TABLE_SHEETS_DROPDOWNS_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-workouts-table-sheets-dropdowns-light-mode',
  route: '/admin/workouts',
  theme: 'light',
  interaction: 'table-sheets-dropdowns',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_WORKOUTS_CALENDAR_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-workouts-calendar-dark-mode',
  route: '/admin/workouts/calendar',
  theme: 'dark',
  interaction: 'calendar-add-dialog',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_WORKOUTS_CALENDAR_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-workouts-calendar-light-mode',
  route: '/admin/workouts/calendar',
  theme: 'light',
  interaction: 'calendar-add-dialog',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})


export const ADMIN_EXERCISES_TABLE_SHEETS_MEDIA_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-exercises-table-sheets-media-dark-mode',
  route: '/admin/exercises',
  theme: 'dark',
  interaction: 'table-sheets-media',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_EXERCISES_TABLE_SHEETS_MEDIA_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-exercises-table-sheets-media-light-mode',
  route: '/admin/exercises',
  theme: 'light',
  interaction: 'table-sheets-media',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_PROGRAM_DETAIL_PLANNER_DARK_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-program-detail-planner-dark-mode',
  route: '/admin/programs/program-1',
  theme: 'dark',
  interaction: 'detail-planner',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

export const ADMIN_PROGRAM_DETAIL_PLANNER_LIGHT_MODE_VISUAL_CHECK = Object.freeze({
  id: 'admin-program-detail-planner-light-mode',
  route: '/admin/programs/program-1',
  theme: 'light',
  interaction: 'detail-planner',
  layer: WEB_TEST_LAYERS.VISUAL_THEME,
})

function rgbParts(value = '') {
  const match = value.match(/rgba?\(([^)]+)\)/)

  if (!match) {
    return [0, 0, 0, 1]
  }

  const [red = 0, green = 0, blue = 0, alpha = 1] = match[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))

  return [red, green, blue, alpha]
}

function luminance(value) {
  const [red, green, blue] = rgbParts(value)
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
}

function expectDarkSurface(value, label) {
  expect(luminance(value), `${label} should stay a dark surface; color=${value}`).toBeLessThan(80)
}

function expectLightSurface(value, label) {
  expect(luminance(value), `${label} should stay a light surface; color=${value}`).toBeGreaterThan(180)
}

function expectLightText(value, label) {
  expect(luminance(value), `${label} should stay readable on dark; color=${value}`).toBeGreaterThan(100)
}

function expectDarkText(value, label) {
  expect(luminance(value), `${label} should stay readable on light; color=${value}`).toBeLessThan(160)
}

function expectAccentText(value, label) {
  const [red, green, blue] = rgbParts(value)
  expect(green, `${label} should use the green admin accent; color=${value}`).toBeGreaterThan(120)
  expect(red, `${label} should keep the accent from drifting warm; color=${value}`).toBeLessThan(120)
  expect(blue, `${label} should keep enough cyan in the accent; color=${value}`).toBeGreaterThan(80)
}

function expectAccentSurface(value, label) {
  const [red, green, blue, alpha] = rgbParts(value)
  expect(alpha, `${label} should not be transparent; color=${value}`).toBeGreaterThan(0)
  expect(green, `${label} should lean green/cyan; color=${value}`).toBeGreaterThan(red)
  expect(blue, `${label} should keep the cool admin tint; color=${value}`).toBeGreaterThanOrEqual(red)
}

async function authenticateAdminShell(page, theme = 'dark') {
  const baseUrl = resolveWebBaseUrl(process.env) || 'http://127.0.0.1:3000'

  await page.context().addCookies([
    {
      name: 'pplus_admin_access_token',
      value: `admin-shell-${theme}-mode-visual-check-token`,
      url: baseUrl,
    },
  ])

  await page.addInitScript((nextTheme) => {
    window.localStorage?.setItem('pplus-admin-theme', nextTheme)
    document.documentElement.dataset.theme = nextTheme
  }, theme)
}

async function forceAdminTheme(page, theme) {
  await page.evaluate((nextTheme) => {
    window.localStorage?.setItem('pplus-admin-theme', nextTheme)
    document.documentElement.dataset.theme = nextTheme
  }, theme)

  const toggle = page.locator('.admin-theme-toggle')
  if (await toggle.count()) {
    await expect(toggle).toBeVisible()
    const expectedPressed = theme === 'light' ? 'true' : 'false'
    if (await toggle.getAttribute('aria-pressed') !== expectedPressed) {
      await toggle.click()
    }
    if (await toggle.getAttribute('aria-pressed') !== expectedPressed) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await assertCssLoaded(page)
    }
    await expect(toggle).toHaveAttribute('aria-pressed', expectedPressed)
    await expect(toggle).toHaveAttribute('aria-label', `Switch admin dashboard to ${theme === 'light' ? 'dark' : 'light'} mode`)
  }
}

async function openSidebarSubnav(page) {
  const athletesSummary = page.locator('.admin-dashboard-sidebar-nav-button').filter({ hasText: 'Athletes' })
  await athletesSummary.click()
  await expect(page.locator('.admin-dashboard-sidebar-subnav-button').filter({ hasText: 'All athletes' })).toBeVisible()
}

async function readSidebarVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null

      return {
        exists: Boolean(element),
        display: style?.display || '',
        visibility: style?.visibility || '',
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
      }
    }

    const sidebar = document.querySelector('.admin-dashboard-sidebar')
    const firstNavButton = document.querySelector('.admin-dashboard-sidebar-nav-button')
    const activeNavButton = document.querySelector('.admin-dashboard-sidebar-nav-button[data-active="true"]')
    const inactiveNavButton = Array.from(document.querySelectorAll('.admin-dashboard-sidebar-nav-button'))
      .find((button) => !button.matches('[data-active="true"]') && !button.closest('details')?.open)
    const subnavButton = document.querySelector('.admin-dashboard-sidebar-subnav-button')
    const switcher = document.querySelector('.admin-dashboard-sidebar-switcher')
    const accountButton = document.querySelector('.admin-dashboard-sidebar-account-button')
    const separator = document.querySelector('.admin-dashboard-sidebar-separator')
    const darkLogo = document.querySelector('.admin-dashboard-sidebar-logo-dark')
    const lightLogo = document.querySelector('.admin-dashboard-sidebar-logo-light')

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      sidebar: read('.admin-dashboard-sidebar'),
      sidebarInner: read('.admin-dashboard-sidebar [data-slot="sidebar-inner"]'),
      header: read('.admin-dashboard-sidebar-header'),
      content: read('.admin-dashboard-sidebar-content'),
      footer: read('.admin-dashboard-sidebar-footer'),
      groupLabel: read('.admin-dashboard-sidebar-group-label'),
      navButton: inactiveNavButton ? {
        color: getComputedStyle(inactiveNavButton).color,
        backgroundColor: getComputedStyle(inactiveNavButton).backgroundColor,
      } : read('.admin-dashboard-sidebar-nav-button'),
      activeNavButton: activeNavButton ? {
        color: getComputedStyle(activeNavButton).color,
        backgroundColor: getComputedStyle(activeNavButton).backgroundColor,
      } : null,
      subnavButton: read('.admin-dashboard-sidebar-subnav-button'),
      switcher: read('.admin-dashboard-sidebar-switcher'),
      accountButton: read('.admin-dashboard-sidebar-account-button'),
      separator: read('.admin-dashboard-sidebar-separator'),
      primaryText: read('.admin-dashboard-sidebar-primary-text'),
      secondaryText: read('.admin-dashboard-sidebar-secondary-text'),
      darkLogo: {
        display: getComputedStyle(darkLogo).display,
        width: darkLogo?.getBoundingClientRect().width || 0,
        src: darkLogo?.getAttribute('src') || '',
      },
      lightLogo: {
        display: getComputedStyle(lightLogo).display,
        width: lightLogo?.getBoundingClientRect().width || 0,
        src: lightLogo?.getAttribute('src') || '',
      },
      buttonCount: document.querySelectorAll('.admin-dashboard-sidebar-nav-button').length,
      subnavButtonCount: document.querySelectorAll('.admin-dashboard-sidebar-subnav-button').length,
      leftEdge: sidebar?.getBoundingClientRect().left || 0,
      rightEdge: sidebar?.getBoundingClientRect().right || 0,
      viewportWidth: window.innerWidth,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hasBulletMarker: firstNavButton?.textContent?.includes('•') || subnavButton?.textContent?.includes('•') || false,
      visibleAccountButton: Boolean(accountButton && accountButton.getBoundingClientRect().height > 0),
      visibleSwitcher: Boolean(switcher && switcher.getBoundingClientRect().height > 0),
      visibleSeparator: Boolean(separator),
    }
  })
}

async function mockSupportInboxApi(page) {
  await page.route('**/api/admin/support/conversations**', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ conversation: { id: 'conv-ann-smith', status: 'pending' } }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        conversations: [
          {
            id: 'conv-ann-smith',
            requesterName: 'Ann Smith',
            requesterEmail: 'ann@example.com',
            requesterRole: 'Athlete',
            requesterAvatarUrl: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png',
            subject: 'Program access question',
            lastMessagePreview: 'Can you confirm my next block is showing correctly?',
            lastMessageAt: '2026-06-22T12:30:00.000Z',
            status: 'open',
            priority: 'High',
          },
          {
            id: 'conv-coach-miller',
            requesterName: 'Coach Miller',
            requesterEmail: 'coach@example.com',
            requesterRole: 'Coach',
            requesterAvatarUrl: '',
            subject: 'Invite email not received',
            lastMessagePreview: 'The athlete code worked, but the email never landed.',
            lastMessageAt: '2026-06-21T16:15:00.000Z',
            status: 'pending',
            priority: 'Medium',
          },
        ],
      }),
    })
  })

  await page.route('**/api/admin/support/conversations/conv-ann-smith/messages', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: {
            id: 'msg-reply-1',
            conversationId: 'conv-ann-smith',
            senderType: 'admin',
            senderName: 'PPLUS Support',
            body: 'Thanks, checking it now.',
            createdAt: '2026-06-22T12:45:00.000Z',
          },
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-athlete-1',
            conversationId: 'conv-ann-smith',
            senderType: 'athlete',
            senderName: 'Ann Smith',
            senderAvatarUrl: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png',
            body: 'Can you confirm my next block is showing correctly?',
            createdAt: '2026-06-22T12:30:00.000Z',
          },
          {
            id: 'msg-admin-1',
            conversationId: 'conv-ann-smith',
            senderType: 'admin',
            senderName: 'PPLUS Support',
            body: 'Yes, your program access is active.',
            createdAt: '2026-06-22T12:34:00.000Z',
          },
        ],
      }),
    })
  })
}

async function readSupportInboxVisualState(page) {
  return page.evaluate(() => {
    const read = (selector, pseudoElement) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element, pseudoElement) : null

      return {
        exists: Boolean(element),
        display: style?.display || '',
        visibility: style?.visibility || '',
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
      }
    }

    const shell = document.querySelector('.support-inbox-shell')
    const statusContent = document.querySelector('.support-inbox-status-content')

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      shell: read('.support-inbox-shell'),
      main: read('.support-inbox-main'),
      sidebarFrame: read('.support-inbox-sidebar-frame'),
      sidebar: read('.support-inbox-sidebar'),
      sidebarInner: read('.support-inbox-sidebar [data-slot="sidebar-inner"]'),
      sidebarHeader: read('.support-inbox-sidebar-header'),
      sidebarSearchInput: read('.support-inbox-sidebar-search-input'),
      sidebarTrigger: read('.support-inbox-sidebar-trigger'),
      topbar: read('.support-inbox-topbar'),
      topbarTitle: read('.support-inbox-topbar-title'),
      topbarSubtitle: read('.support-inbox-topbar-subtitle'),
      topbarSearchInput: read('.support-inbox-topbar-search-input'),
      statusTrigger: read('.support-inbox-status-trigger'),
      statusContent: read('.support-inbox-status-content'),
      statusItem: read('.support-inbox-status-item'),
      conversationRowActive: read('.support-inbox-conversation-row-active'),
      conversationRowIdle: read('.support-inbox-conversation-row-idle'),
      conversationName: read('.support-inbox-conversation-name'),
      conversationPreview: read('.support-inbox-conversation-preview'),
      avatar: read('.support-inbox-conversation-avatar'),
      messageList: read('.support-inbox-message-list'),
      composer: read('.support-inbox-composer'),
      composerInner: read('.support-inbox-composer [data-slot="chat-toolbar-inner"]'),
      composerInput: read('.support-inbox-composer-input'),
      composerIconButton: read('.support-inbox-composer-icon-button'),
      composerSendButton: read('.support-inbox-composer-send-button'),
      darkLogo: {
        display: getComputedStyle(document.querySelector('.support-inbox-sidebar-logo-dark')).display,
        src: document.querySelector('.support-inbox-sidebar-logo-dark')?.getAttribute('src') || '',
        width: document.querySelector('.support-inbox-sidebar-logo-dark')?.getBoundingClientRect().width || 0,
      },
      lightLogo: {
        display: getComputedStyle(document.querySelector('.support-inbox-sidebar-logo-light')).display,
        src: document.querySelector('.support-inbox-sidebar-logo-light')?.getAttribute('src') || '',
        width: document.querySelector('.support-inbox-sidebar-logo-light')?.getBoundingClientRect().width || 0,
      },
      statusDropdownVisible: Boolean(statusContent && statusContent.getBoundingClientRect().height > 0),
      conversationRowCount: document.querySelectorAll('.support-inbox-conversation-row').length,
      messageText: document.body.innerText,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      shellWidth: shell?.getBoundingClientRect().width || 0,
    }
  })
}

function expectSupportInboxStructure(visualState) {
  expect(visualState.shell.exists).toBe(true)
  expect(visualState.main.exists).toBe(true)
  expect(visualState.sidebar.exists).toBe(true)
  expect(visualState.sidebarInner.exists).toBe(true)
  expect(visualState.sidebarHeader.exists).toBe(true)
  expect(visualState.sidebarSearchInput.exists).toBe(true)
  expect(visualState.sidebarTrigger.exists).toBe(true)
  expect(visualState.topbar.exists).toBe(true)
  expect(visualState.topbarSearchInput.exists).toBe(true)
  expect(visualState.statusTrigger.exists).toBe(true)
  expect(visualState.statusContent.exists).toBe(true)
  expect(visualState.statusDropdownVisible).toBe(true)
  expect(visualState.conversationRowActive.exists).toBe(true)
  expect(visualState.conversationRowIdle.exists).toBe(true)
  expect(visualState.messageList.exists).toBe(true)
  expect(visualState.composer.exists).toBe(true)
  expect(visualState.composerInner.exists).toBe(true)
  expect(visualState.composerInput.exists).toBe(true)
  expect(visualState.composerIconButton.exists).toBe(true)
  expect(visualState.composerSendButton.exists).toBe(true)
  expect(visualState.conversationRowCount).toBeGreaterThanOrEqual(2)
  expect(visualState.messageText).toContain('Ann Smith')
  expect(visualState.messageText).toContain('Program access question')
  expect(visualState.messageText).toContain('Can you confirm my next block is showing correctly?')
  expect(visualState.messageText).toContain('Yes, your program access is active.')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockSettingsProfileAccountApi(page) {
  await page.route(/\/admin\/api\/settings\/profile(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            avatarUrl: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_3.png',
            name: 'Anthony Fortugno',
            firstName: 'Anthony',
            lastName: 'Fortugno',
            phone: '416-555-0198',
          },
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          avatarUrl: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_3.png',
          name: 'Anthony Fortugno',
          firstName: 'Anthony',
          lastName: 'Fortugno',
          phone: '416-555-0198',
        },
      }),
    })
  })

  await page.route(/\/admin\/api\/settings\/account(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ account: { email: 'coach@pplus.test' } }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ account: { email: 'coach@pplus.test' } }),
    })
  })
}

async function readSettingsProfileAccountVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null

      return {
        exists: Boolean(element),
        display: style?.display || '',
        visibility: style?.visibility || '',
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        value: element?.value || '',
      }
    }

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      shell: read('.admin-settings-shell'),
      header: read('.admin-settings-header'),
      title: read('.admin-settings-title'),
      profileForm: read('.admin-settings-profile-form'),
      accountForm: read('.admin-settings-account-form'),
      avatar: read('.admin-settings-profile-avatar'),
      profileFirstName: read('.admin-settings-profile-first-name'),
      profileLastName: read('.admin-settings-profile-last-name'),
      profilePhone: read('.admin-settings-profile-phone'),
      profileSubmit: read('.admin-settings-profile-submit'),
      accountEmail: read('.admin-settings-account-email'),
      accountCurrentPassword: read('.admin-settings-account-current-password'),
      accountNewPassword: read('.admin-settings-account-new-password'),
      accountConfirmPassword: read('.admin-settings-account-confirm-password'),
      accountSubmit: read('.admin-settings-account-submit'),
      workspace: read('.admin-shell-workspace'),
      bodyText: document.body.innerText,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectSettingsProfileAccountStructure(visualState, activeTab) {
  expect(visualState.shell.exists).toBe(true)
  expect(visualState.header.exists).toBe(true)
  expect(visualState.title.exists).toBe(true)

  if (activeTab === 'profile') {
    expect(visualState.profileForm.exists).toBe(true)
    expect(visualState.avatar.exists).toBe(true)
    expect(visualState.profileFirstName.exists).toBe(true)
    expect(visualState.profileLastName.exists).toBe(true)
    expect(visualState.profilePhone.exists).toBe(true)
    expect(visualState.profileSubmit.exists).toBe(true)
    expect(visualState.bodyText).toContain('Profile')
    expect(visualState.bodyText).toContain('Anthony')
  } else {
    expect(visualState.accountForm.exists).toBe(true)
    expect(visualState.accountEmail.exists).toBe(true)
    expect(visualState.accountCurrentPassword.exists).toBe(true)
    expect(visualState.accountNewPassword.exists).toBe(true)
    expect(visualState.accountConfirmPassword.exists).toBe(true)
    expect(visualState.accountSubmit.exists).toBe(true)
    expect(visualState.bodyText).toContain('Account')
    expect(visualState.accountEmail.value).toContain('@')
  }

  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function openAccountDropdown(page) {
  const trigger = page.locator('.admin-dashboard-topbar [aria-label="Open top account menu"]')
  const content = page.locator('.admin-dashboard-dropdown-content')

  await trigger.scrollIntoViewIfNeeded()
  await expect(trigger).toBeVisible()
  await trigger.focus()
  await trigger.click({ force: true })

  try {
    await expect(content).toBeVisible({ timeout: 1500 })
  } catch {
    await trigger.focus()
    await page.keyboard.press('Enter')
    try {
      await expect(content).toBeVisible({ timeout: 1500 })
    } catch {
      await trigger.click({ force: true })
      await expect(content).toBeVisible()
    }
  }
}

async function readTopbarVisualState(page) {
  return page.evaluate(() => {
    const read = (selector, pseudoElement) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element, pseudoElement) : null

      return {
        exists: Boolean(element),
        display: style?.display || '',
        visibility: style?.visibility || '',
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        opacity: style?.opacity || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        left: element?.getBoundingClientRect().left || 0,
        right: element?.getBoundingClientRect().right || 0,
      }
    }

    const topbar = document.querySelector('.admin-dashboard-topbar')
    const search = document.querySelector('.admin-dashboard-topbar-search')
    const searchInput = document.querySelector('.admin-dashboard-topbar-search-input')
    const searchButton = document.querySelector('.admin-dashboard-topbar-search-button')
    const themeToggle = document.querySelector('.admin-theme-toggle')
    const accountButton = document.querySelector('[aria-label="Open top account menu"]')
    const avatar = document.querySelector('.admin-dashboard-topbar-avatar')
    const topbarChildren = topbar ? Array.from(topbar.querySelector(':scope > div')?.children || []) : []

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      topbar: read('.admin-dashboard-topbar'),
      search: read('.admin-dashboard-topbar-search'),
      searchInput: read('.admin-dashboard-topbar-search-input'),
      searchInputPlaceholder: read('.admin-dashboard-topbar-search-input', '::placeholder'),
      searchButton: read('.admin-dashboard-topbar-search-button'),
      sidebarTrigger: read('.admin-dashboard-sidebar-trigger'),
      themeToggle: read('.admin-theme-toggle'),
      activeThemeToggleImage: read('.admin-theme-toggle-image-active'),
      accountButton: read('[aria-label="Open top account menu"]'),
      avatar: read('.admin-dashboard-topbar-avatar'),
      searchPlaceholder: searchInput?.getAttribute('placeholder') || '',
      searchAriaLabel: searchInput?.getAttribute('aria-label') || '',
      searchButtonAriaLabel: searchButton?.getAttribute('aria-label') || '',
      themeToggleAriaLabel: themeToggle?.getAttribute('aria-label') || '',
      themeTogglePressed: themeToggle?.getAttribute('aria-pressed') || '',
      activeThemeToggleImageSrc: document.querySelector('.admin-theme-toggle-image-active')?.getAttribute('src') || '',
      accountButtonAriaLabel: accountButton?.getAttribute('aria-label') || '',
      order: {
        searchIndex: topbarChildren.findIndex((element) => element.contains(search)),
        themeToggleIndex: topbarChildren.findIndex((element) => element === themeToggle),
        accountIndex: topbarChildren.findIndex((element) => element.contains(accountButton)),
      },
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      viewportWidth: window.innerWidth,
      visibleTopbar: Boolean(topbar && topbar.getBoundingClientRect().height > 0),
      visibleSearch: Boolean(search && search.getBoundingClientRect().height > 0),
      visibleThemeToggle: Boolean(themeToggle && themeToggle.getBoundingClientRect().height > 0),
      visibleAvatar: Boolean(avatar && avatar.getBoundingClientRect().height > 0),
    }
  })
}

function expectSidebarStructure(visualState) {
  expect(visualState.sidebar.exists).toBe(true)
  expect(visualState.sidebarInner.exists).toBe(true)
  expect(visualState.header.exists).toBe(true)
  expect(visualState.content.exists).toBe(true)
  expect(visualState.footer.exists).toBe(true)
  expect(visualState.buttonCount).toBeGreaterThanOrEqual(5)
  expect(visualState.subnavButtonCount).toBeGreaterThanOrEqual(4)
  expect(visualState.leftEdge).toBeGreaterThanOrEqual(0)
  expect(visualState.rightEdge).toBeLessThanOrEqual(visualState.viewportWidth)
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
  expect(visualState.hasBulletMarker).toBe(false)
  expect(visualState.visibleAccountButton).toBe(true)
  expect(visualState.visibleSwitcher).toBe(true)
  expect(visualState.visibleSeparator).toBe(true)
}

function expectTopbarStructure(visualState) {
  expect(visualState.topbar.exists).toBe(true)
  expect(visualState.search.exists).toBe(true)
  expect(visualState.searchInput.exists).toBe(true)
  expect(visualState.searchButton.exists).toBe(true)
  expect(visualState.sidebarTrigger.exists).toBe(true)
  expect(visualState.themeToggle.exists).toBe(true)
  expect(visualState.accountButton.exists).toBe(true)
  expect(visualState.avatar.exists).toBe(true)
  expect(visualState.visibleTopbar).toBe(true)
  expect(visualState.visibleSearch).toBe(true)
  expect(visualState.visibleThemeToggle).toBe(true)
  expect(visualState.visibleAvatar).toBe(true)
  expect(visualState.searchPlaceholder).toBe('Search athletes, programs, or groups')
  expect(visualState.searchAriaLabel).toBe('Search athletes, programs, or groups')
  expect(visualState.searchButtonAriaLabel).toBe('Submit search')
  expect(visualState.accountButtonAriaLabel).toBe('Open top account menu')
  expect(visualState.order.searchIndex).toBeGreaterThanOrEqual(0)
  expect(visualState.order.themeToggleIndex).toBeGreaterThan(visualState.order.searchIndex)
  expect(visualState.order.accountIndex).toBeGreaterThan(visualState.order.themeToggleIndex)
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
  expect(Math.round(visualState.themeToggle.width)).toBe(62)
  expect(Math.round(visualState.themeToggle.height)).toBe(36)
  expect(visualState.topbar.left).toBeGreaterThanOrEqual(0)
  expect(visualState.topbar.right).toBeLessThanOrEqual(visualState.viewportWidth)
}

async function readAccountDropdownVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null

      return {
        exists: Boolean(element),
        display: style?.display || '',
        visibility: style?.visibility || '',
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        left: element?.getBoundingClientRect().left || 0,
        right: element?.getBoundingClientRect().right || 0,
        top: element?.getBoundingClientRect().top || 0,
        bottom: element?.getBoundingClientRect().bottom || 0,
      }
    }

    const content = document.querySelector('.admin-dashboard-dropdown-content')
    const label = Array.from(content?.querySelectorAll('*') || []).find((element) => element.textContent?.trim() === 'My Account')
    const items = Array.from(content?.querySelectorAll('[role="menuitem"]') || [])
    const profileItem = items.find((element) => element.textContent?.trim() === 'Profile')
    const accountItem = items.find((element) => element.textContent?.trim() === 'Account')
    const separator = content?.querySelector('[role="separator"]')
    const highlightedItem = content?.querySelector('[data-highlighted]')
    const contentRect = content?.getBoundingClientRect()

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      content: read('.admin-dashboard-dropdown-content'),
      label: label ? {
        color: getComputedStyle(label).color,
        text: label.textContent?.trim() || '',
        height: label.getBoundingClientRect().height,
      } : null,
      separator: separator ? {
        backgroundColor: getComputedStyle(separator).backgroundColor,
        width: separator.getBoundingClientRect().width,
        height: separator.getBoundingClientRect().height,
      } : null,
      profileItem: profileItem ? {
        color: getComputedStyle(profileItem).color,
        backgroundColor: getComputedStyle(profileItem).backgroundColor,
        href: profileItem.getAttribute('href') || '',
        text: profileItem.textContent?.trim() || '',
        height: profileItem.getBoundingClientRect().height,
      } : null,
      accountItem: accountItem ? {
        color: getComputedStyle(accountItem).color,
        backgroundColor: getComputedStyle(accountItem).backgroundColor,
        href: accountItem.getAttribute('href') || '',
        text: accountItem.textContent?.trim() || '',
        height: accountItem.getBoundingClientRect().height,
      } : null,
      highlightedItem: highlightedItem ? {
        color: getComputedStyle(highlightedItem).color,
        backgroundColor: getComputedStyle(highlightedItem).backgroundColor,
        text: highlightedItem.textContent?.trim() || '',
      } : null,
      itemTexts: items.map((element) => element.textContent?.trim() || ''),
      menuItemCount: items.length,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      visibleContent: Boolean(content && contentRect && contentRect.height > 0),
    }
  })
}

function expectAccountDropdownStructure(visualState) {
  expect(visualState.content.exists).toBe(true)
  expect(visualState.visibleContent).toBe(true)
  expect(visualState.content.width).toBeGreaterThanOrEqual(200)
  expect(visualState.content.width).toBeLessThanOrEqual(230)
  expect(visualState.content.left).toBeGreaterThanOrEqual(0)
  expect(visualState.content.right).toBeLessThanOrEqual(visualState.viewportWidth)
  expect(visualState.content.top).toBeGreaterThanOrEqual(0)
  expect(visualState.content.bottom).toBeLessThanOrEqual(visualState.viewportHeight)
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
  expect(visualState.label?.text).toBe('My Account')
  expect(visualState.separator?.width).toBeGreaterThan(0)
  expect(visualState.separator?.height).toBeGreaterThan(0)
  expect(visualState.menuItemCount).toBe(2)
  expect(visualState.itemTexts).toEqual(['Profile', 'Account'])
  expect(visualState.profileItem?.href).toBe('/admin/settings')
  expect(visualState.accountItem?.href).toBe('/admin/settings/account')
  expect(visualState.profileItem?.height).toBeGreaterThan(20)
  expect(visualState.accountItem?.height).toBeGreaterThan(20)
}


async function readRouteActiveState(page) {
  return page.evaluate(() => {
    const byLabel = (selector, label) => Array.from(document.querySelectorAll(selector))
      .find((element) => element.textContent?.trim() === label)
    const read = (element) => {
      const style = element ? getComputedStyle(element) : null

      return {
        exists: Boolean(element),
        active: element?.getAttribute('data-active') || null,
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        text: element?.textContent?.trim() || '',
        href: element?.getAttribute('href') || element?.querySelector('a')?.getAttribute('href') || '',
        open: Boolean(element?.closest('details')?.open),
      }
    }

    const topButtons = Array.from(document.querySelectorAll('.admin-dashboard-sidebar-nav-button'))
    const subButtons = Array.from(document.querySelectorAll('.admin-dashboard-sidebar-subnav-button'))

    return {
      pathname: window.location.pathname,
      search: window.location.search,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      activeTopLabels: topButtons
        .filter((element) => element.getAttribute('data-active') === 'true')
        .map((element) => element.textContent?.trim() || ''),
      activeSubLabels: subButtons
        .filter((element) => element.getAttribute('data-active') === 'true')
        .map((element) => element.textContent?.trim() || ''),
      openGroups: topButtons
        .filter((element) => element.closest('details')?.open)
        .map((element) => element.textContent?.trim() || ''),
      dashboard: read(byLabel('.admin-dashboard-sidebar-nav-button', 'Dashboard')),
      athletes: read(byLabel('.admin-dashboard-sidebar-nav-button', 'Athletes')),
      programs: read(byLabel('.admin-dashboard-sidebar-nav-button', 'Programs')),
      workouts: read(byLabel('.admin-dashboard-sidebar-nav-button', 'Workouts')),
      exercises: read(byLabel('.admin-dashboard-sidebar-nav-button', 'Exercises')),
      rankings: read(byLabel('.admin-dashboard-sidebar-subnav-button', 'Rankings')),
      programsLibrary: read(byLabel('.admin-dashboard-sidebar-subnav-button', 'Library')),
      workoutCalendar: read(byLabel('.admin-dashboard-sidebar-subnav-button', 'Calendar')),
    }
  })
}

function expectActiveRouteState(visualState, expected) {
  expect(visualState.pathname).toBe(expected.pathname)
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
  expect(visualState.activeTopLabels).toEqual([expected.topLabel])
  expect(visualState.activeSubLabels).toEqual(expected.subLabel ? [expected.subLabel] : [])
  expect(visualState.openGroups).toEqual(expected.openGroups)

  const activeTop = visualState[expected.topKey]
  expect(activeTop.exists).toBe(true)
  expect(activeTop.active).toBe('true')
  expectAccentText(activeTop.color, `${expected.topLabel} active route top item`)

  if (expected.subKey) {
    const activeSub = visualState[expected.subKey]
    expect(activeSub.exists).toBe(true)
    expect(activeSub.active).toBe('true')
    expect(activeSub.open).toBe(true)
    expectAccentText(activeSub.color, `${expected.subLabel} active route sub item`)
  }

  for (const inactiveTopKey of expected.inactiveTopKeys) {
    expect(visualState[inactiveTopKey].active).toBeNull()
  }
}

async function readNoDefaultControlsState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      const rect = element?.getBoundingClientRect()

      return {
        exists: Boolean(element),
        appearance: style?.appearance || '',
        webkitAppearance: style?.webkitAppearance || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        borderStyle: style?.borderStyle || '',
        borderWidth: style?.borderWidth || '',
        borderRadius: style?.borderRadius || '',
        width: rect?.width || 0,
        height: rect?.height || 0,
      }
    }

    const buttonSelectors = [
      '.admin-dashboard-sidebar-trigger',
      '.admin-dashboard-topbar-search-button',
      '.admin-theme-toggle',
      '[aria-label="Open top account menu"]',
      '.admin-dashboard-floating-mic-button',
    ]
    const styledControlSelectors = [
      '.admin-dashboard-sidebar-trigger',
      '.admin-dashboard-topbar-search-input',
      '.admin-dashboard-topbar-search-button',
      '.admin-theme-toggle',
      '[aria-label="Open top account menu"]',
      '.admin-dashboard-sidebar-switcher',
      '.admin-dashboard-sidebar-account-button',
      '.admin-dashboard-floating-mic-button',
    ]
    const buttonAppearanceResets = buttonSelectors.map((selector) => ({
      selector,
      ...read(selector),
    }))
    const styledControlRadii = styledControlSelectors.map((selector) => ({
      selector,
      ...read(selector),
    }))

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      nativeSelectCount: document.querySelectorAll('select').length,
      rawVisibleButtonCount: Array.from(document.querySelectorAll('button'))
        .filter((button) => {
          const className = button.getAttribute('class') || ''
          const rect = button.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0 && !className.trim()
        }).length,
      buttonAppearanceResets,
      styledControlRadii,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectNoDefaultControlsState(visualState) {
  expect(visualState.htmlTheme).toBe('light')
  expect(visualState.storedTheme).toBe('light')
  expect(visualState.nativeSelectCount).toBe(0)
  expect(visualState.rawVisibleButtonCount).toBe(0)
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)

  for (const control of visualState.buttonAppearanceResets) {
    expect(control.exists, `${control.selector} should exist`).toBe(true)
    expect(control.width, `${control.selector} should have a rendered width`).toBeGreaterThan(0)
    expect(control.height, `${control.selector} should have a rendered height`).toBeGreaterThan(0)
    expect(control.webkitAppearance, `${control.selector} should not expose native WebKit button chrome`).not.toBe('button')
  }

  for (const control of visualState.styledControlRadii) {
    expect(control.exists, `${control.selector} should exist`).toBe(true)
    expect(Number.parseFloat(control.borderRadius), `${control.selector} should use explicit styled radius`).toBeGreaterThan(0)
  }
}

async function openMobileSidebar(page) {
  await page.locator('.admin-dashboard-sidebar-trigger').click()
  await expect(page.locator('.admin-dashboard-mobile-sidebar-sheet')).toBeVisible()
}

async function readResponsiveWidthState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      const rect = element?.getBoundingClientRect()

      return {
        exists: Boolean(element),
        display: style?.display || '',
        visibility: style?.visibility || '',
        width: rect?.width || 0,
        height: rect?.height || 0,
        left: rect?.left || 0,
        right: rect?.right || 0,
        overflowX: style?.overflowX || '',
      }
    }

    const mobileSheet = document.querySelector('.admin-dashboard-mobile-sidebar-sheet')
    const desktopSidebar = document.querySelector('.admin-dashboard-sidebar')
    const sidebarTrigger = document.querySelector('.admin-dashboard-sidebar-trigger')

    return {
      viewportWidth: window.innerWidth,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflowX: document.body.scrollWidth - document.body.clientWidth,
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      topbar: read('.admin-dashboard-topbar'),
      search: read('.admin-dashboard-topbar-search'),
      themeToggle: read('.admin-theme-toggle'),
      accountButton: read('.admin-dashboard-topbar [aria-label="Open top account menu"]'),
      sidebarTrigger: read('.admin-dashboard-sidebar-trigger'),
      mobileSheet: read('.admin-dashboard-mobile-sidebar-sheet'),
      desktopSidebar: read('.admin-dashboard-sidebar'),
      workspace: read('.admin-shell-workspace'),
      mobileSheetOpen: Boolean(mobileSheet && mobileSheet.getBoundingClientRect().width > 0),
      desktopSidebarVisible: Boolean(desktopSidebar && getComputedStyle(desktopSidebar).display !== 'none' && desktopSidebar.getBoundingClientRect().width > 0),
      triggerVisible: Boolean(sidebarTrigger && sidebarTrigger.getBoundingClientRect().height > 0),
    }
  })
}

function expectResponsiveWidthState(visualState, expected) {
  expect(visualState.htmlTheme).toBe('light')
  expect(visualState.storedTheme).toBe('light')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
  expect(visualState.bodyOverflowX).toBeLessThanOrEqual(1)
  expect(visualState.topbar.exists).toBe(true)
  expect(visualState.topbar.left).toBeGreaterThanOrEqual(0)
  expect(visualState.topbar.right).toBeLessThanOrEqual(visualState.viewportWidth)
  expect(visualState.triggerVisible).toBe(true)
  expect(visualState.sidebarTrigger.width).toBeGreaterThan(0)
  expect(visualState.themeToggle.width).toBeGreaterThan(0)
  expect(visualState.accountButton.width).toBeGreaterThan(0)

  if (expected.mobile) {
    expect(visualState.desktopSidebarVisible).toBe(false)
    expect(visualState.mobileSheetOpen).toBe(true)
    expect(visualState.mobileSheet.width).toBeGreaterThan(250)
    expect(visualState.mobileSheet.width).toBeLessThanOrEqual(visualState.viewportWidth)
    expect(visualState.mobileSheet.left).toBeGreaterThanOrEqual(0)
    expect(visualState.mobileSheet.right).toBeLessThanOrEqual(visualState.viewportWidth)
  } else {
    expect(visualState.desktopSidebarVisible).toBe(true)
    expect(visualState.desktopSidebar.right).toBeLessThanOrEqual(visualState.viewportWidth)
    expect(visualState.workspace.width).toBeGreaterThan(0)
  }
}

async function mockDashboardOverviewApi(page) {
  await page.route('**/api/admin/dashboard/overview**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overview: {
          summary: {
            athletes: { id: 'athletes', label: 'Athletes', value: '14', change: '64% active', changeDirection: 'positive', footerHeadline: 'Total athletes' },
            programs: { id: 'programs', label: 'Programs', value: '7', change: '71% assigned', changeDirection: 'positive', footerHeadline: 'Total programs' },
            workouts: { id: 'workouts', label: 'Workouts', value: '18', change: '78% assigned', changeDirection: 'positive', footerHeadline: 'Total workouts' },
            exercises: { id: 'exercises', label: 'Exercises', value: '97', change: '92% used', changeDirection: 'positive', footerHeadline: 'Total exercises' },
            invites: { id: 'invites', label: 'Invites', value: '6', change: '33% accepted', changeDirection: 'negative', footerHeadline: 'Total athlete invites' },
          },
          trainingExecution: {
            trend: '67%',
            trendDirection: 'negative',
            footer: '8 of 12 due workouts completed · 4 missed',
            buckets: [
              { label: 'W1', assigned: 4, completed: 3, missed: 1 },
              { label: 'W2', assigned: 5, completed: 4, missed: 1 },
              { label: 'W3', assigned: 3, completed: 1, missed: 2 },
            ],
          },
          workoutResults: {
            categoryOptions: ['Warmup', 'Speed Accelerator', 'Edge Work', 'Conditioning'],
            buckets: [
              { category: 'Warmup', workoutName: 'Phase 1 Warmup A', assigned: 8, completed: 6, missed: 2 },
              { category: 'Warmup', workoutName: 'Phase 1 Warmup B', assigned: 7, completed: 5, missed: 2 },
              { category: 'Speed Accelerator', workoutName: 'Phase 2 Speed Accelerator A', assigned: 5, completed: 3, missed: 2 },
              { category: 'Edge Work', workoutName: 'Phase 3 Edge Work A', assigned: 6, completed: 4, missed: 2 },
              { category: 'Conditioning', workoutName: 'Phase 4 Conditioning A', assigned: 4, completed: 2, missed: 2 },
            ],
          },
          trainingConsistency: {
            heatmapReady: true,
            footer: 'Based on 9 active athletes this month',
            dailyActivity: [
              { date: '2026-06-01', activeAthletes: 2 },
              { date: '2026-06-03', activeAthletes: 5 },
              { date: '2026-06-05', activeAthletes: 8 },
              { date: '2026-06-08', activeAthletes: 4 },
            ],
          },
        },
      }),
    })
  })
}

async function readDashboardSurfaceVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      const rect = element?.getBoundingClientRect()

      return {
        exists: Boolean(element),
        display: style?.display || '',
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        backgroundImage: style?.backgroundImage || '',
        borderColor: style?.borderColor || '',
        width: rect?.width || 0,
        height: rect?.height || 0,
        left: rect?.left || 0,
        right: rect?.right || 0,
      }
    }

    const summarySection = Array.from(document.querySelectorAll('section[aria-label]'))
      .find((element) => element.getAttribute('aria-label') === 'Dashboard summary cards')
    const summaryCards = Array.from(summarySection?.querySelectorAll('[data-slot="card"]') || [])
    const allCards = Array.from(document.querySelectorAll('.admin-shell-overview [data-slot="card"]'))
    const firstSummaryCard = summaryCards[0]
    const firstBadge = document.querySelector('.admin-shell-overview-card-badge')
    const workoutResultsCard = document.querySelector('.admin-shell-overview-workout-results-card')
    const tableLikeChart = document.querySelector('.admin-shell-overview-workout-results-chart')
    const tableLikeRows = Array.from(document.querySelectorAll('.admin-shell-overview-workout-results-chart .recharts-bar-rectangle'))
    const trainingConsistencyCard = document.querySelector('.admin-shell-overview-training-consistency-card')
    const heatmapGrid = document.querySelector('.admin-shell-overview-session-chart')
    const trainingExecutionCard = document.querySelector('.admin-shell-overview-performance-panel')

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      summarySection: read('section[aria-label="Dashboard summary cards"]'),
      analyticsSection: read('.admin-shell-overview-analytics-layout'),
      firstSummaryCard: firstSummaryCard ? {
        ...read('section[aria-label="Dashboard summary cards"] [data-slot="card"]'),
        text: firstSummaryCard.textContent || '',
      } : read('section[aria-label="Dashboard summary cards"] [data-slot="card"]'),
      firstSummaryValue: read('.admin-shell-overview-card-value'),
      firstSummaryLabel: read('.admin-shell-overview-card-label'),
      firstBadge: firstBadge ? {
        color: getComputedStyle(firstBadge).color,
        backgroundColor: getComputedStyle(firstBadge).backgroundColor,
        columnGap: getComputedStyle(firstBadge).columnGap,
        text: firstBadge.textContent || '',
      } : null,
      trainingExecutionCard: trainingExecutionCard ? {
        ...read('.admin-shell-overview-performance-panel'),
        text: trainingExecutionCard.textContent || '',
      } : read('.admin-shell-overview-performance-panel'),
      workoutResultsCard: workoutResultsCard ? {
        ...read('.admin-shell-overview-workout-results-card'),
        text: workoutResultsCard.textContent || '',
      } : read('.admin-shell-overview-workout-results-card'),
      tableLikeChart: tableLikeChart ? {
        ...read('.admin-shell-overview-workout-results-chart'),
        text: tableLikeChart.textContent || '',
      } : read('.admin-shell-overview-workout-results-chart'),
      heatmapGrid: heatmapGrid ? {
        ...read('.admin-shell-overview-session-chart'),
        text: heatmapGrid.textContent || '',
      } : read('.admin-shell-overview-session-chart'),
      trainingConsistencyCard: trainingConsistencyCard ? {
        ...read('.admin-shell-overview-training-consistency-card'),
        text: trainingConsistencyCard.textContent || '',
      } : read('.admin-shell-overview-training-consistency-card'),
      cardCount: allCards.length,
      summaryCardCount: summaryCards.length,
      tableLikeRowCount: tableLikeRows.length,
      chartSvgCount: document.querySelectorAll('.admin-shell-overview svg.recharts-surface').length,
      selectTriggerCount: document.querySelectorAll('.admin-shell-overview-select-trigger').length,
      hasDashboardError: Boolean(document.querySelector('.admin-shell-overview-error')),
      pageText: document.querySelector('.admin-shell-overview')?.textContent || '',
    }
  })
}

function expectDashboardSurfaceStructure(visualState) {
  expect(visualState.summarySection.exists).toBe(true)
  expect(visualState.analyticsSection.exists).toBe(true)
  expect(visualState.summaryCardCount).toBe(5)
  expect(visualState.cardCount).toBeGreaterThanOrEqual(8)
  expect(visualState.firstSummaryCard.text).toContain('Athletes')
  expect(visualState.firstSummaryCard.text).toContain('14')
  expect(visualState.trainingExecutionCard.text).toContain('Training execution')
  expect(visualState.workoutResultsCard.text).toContain('Workout results')
  expect(visualState.heatmapGrid.text).toContain('2026')
  expect(visualState.tableLikeChart.exists).toBe(true)
  expect(visualState.tableLikeChart.width).toBeGreaterThan(0)
  expect(visualState.tableLikeRowCount).toBeGreaterThan(0)
  expect(visualState.chartSvgCount).toBeGreaterThanOrEqual(2)
  expect(visualState.selectTriggerCount).toBeGreaterThanOrEqual(2)
  expect(visualState.hasDashboardError).toBe(false)
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockAthletesApi(page) {
  const athletes = [
    {
      id: 'athlete-1',
      name: 'Thomas Thibault',
      firstName: 'Thomas',
      lastName: 'Thibault',
      dateOfBirth: '2008-04-21',
      gender: 'male',
      position: 'forward',
      program: 'U18 Strength Block',
      workoutsCompleted: 8,
      workoutsTarget: 10,
      workoutsPercentage: 80,
      lastActive: 'Today',
      status: 'Active',
      hasInvite: true,
      inviteeEmail: 'thomas@example.com',
      avatarUrl: '',
      heightCm: 180,
      weightKg: 84,
    },
    {
      id: 'athlete-2',
      name: 'Maya Singh',
      firstName: 'Maya',
      lastName: 'Singh',
      dateOfBirth: '2009-01-12',
      gender: 'female',
      position: 'defense',
      program: 'Return to Play',
      workoutsCompleted: 4,
      workoutsTarget: 8,
      workoutsPercentage: 50,
      lastActive: 'Yesterday',
      status: 'Pending',
      hasInvite: false,
      inviteeEmail: '',
      avatarUrl: '',
      heightCm: 168,
      weightKg: 64,
    },
  ]

  await page.route('**/api/admin/athletes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ athletes }),
    })
  })
}

async function openAthletesFilterAndCreateSheet(page) {
  await expect(page.getByRole('heading', { name: 'Athletes' })).toBeVisible()
  await expect(page.locator('.admin-shell-athletes-table-shell')).toBeVisible()
  await expect(page.getByText('Thomas Thibault')).toBeVisible()

  await page.getByRole('button', { name: 'Add filter' }).click()
  await expect(page.getByRole('menuitem', { name: 'Status' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Create athlete' }).click()
  await expect(page.getByText('Create athlete profile')).toBeVisible()
}

async function readAthletesTableFilterDialogVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const rows = Array.from(document.querySelectorAll('.admin-shell-athletes-table tbody tr'))
    const sheet = document.querySelector('.admin-shell-athletes-create-sheet')
    const filterTrigger = document.querySelector('.admin-shell-athletes-filter-trigger')
    const createButton = document.querySelector('.admin-shell-athletes-invite-button')
    const firstNameInput = document.querySelector('#create-athlete-first-name')
    const uploader = document.querySelector('.admin-shell-athletes-create-uploader-empty')

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      tableShell: read('.admin-shell-athletes-table-shell'),
      table: read('.admin-shell-athletes-table'),
      headerCell: read('.admin-shell-athletes-table thead th'),
      firstRow: read('.admin-shell-athletes-table tbody tr'),
      firstNameText: read('.admin-shell-athletes-name-text'),
      filterTrigger: read('.admin-shell-athletes-filter-trigger'),
      columnsButton: read('.admin-shell-athletes-example-columns-button'),
      createButton: read('.admin-shell-athletes-invite-button'),
      paginationBar: read('.admin-shell-athletes-pagination-bar'),
      createSheet: read('.admin-shell-athletes-create-sheet'),
      createSheetHeader: read('.admin-shell-athletes-create-sheet [data-slot="sheet-header"]'),
      createSheetFooter: read('.admin-shell-athletes-create-sheet-footer'),
      firstNameInput: read('#create-athlete-first-name'),
      tabs: read('.admin-shell-athletes-create-tabs'),
      uploader: read('.admin-shell-athletes-create-uploader-empty'),
      rowCount: rows.length,
      hasFilterTrigger: Boolean(filterTrigger),
      hasCreateButton: Boolean(createButton),
      visibleCreateSheet: Boolean(sheet && sheet.getBoundingClientRect().width > 0),
      visibleFirstNameInput: Boolean(firstNameInput && firstNameInput.getBoundingClientRect().height > 0),
      visibleUploader: Boolean(uploader && uploader.getBoundingClientRect().height > 0),
      pageText: document.body.textContent || '',
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectAthletesTableFilterDialogStructure(visualState) {
  expect(visualState.tableShell.exists).toBe(true)
  expect(visualState.table.exists).toBe(true)
  expect(visualState.headerCell.exists).toBe(true)
  expect(visualState.firstRow.exists).toBe(true)
  expect(visualState.firstNameText.text).toContain('Thomas Thibault')
  expect(visualState.rowCount).toBeGreaterThanOrEqual(2)
  expect(visualState.hasFilterTrigger).toBe(true)
  expect(visualState.hasCreateButton).toBe(true)
  expect(visualState.visibleCreateSheet).toBe(true)
  expect(visualState.visibleFirstNameInput).toBe(true)
  expect(visualState.visibleUploader).toBe(true)
  expect(visualState.pageText).toContain('Add filter')
  expect(visualState.pageText).toContain('Columns')
  expect(visualState.pageText).toContain('Create athlete profile')
  expect(visualState.pageText).toContain('Send an invite to this athlete')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockInvitesApi(page) {
  const invites = [
    {
      id: 'invite-1',
      athleteProfileId: 'athlete-1',
      name: 'Thomas Thibault',
      email: 'thomas@example.com',
      role: 'Athlete',
      sent: 'Today',
      status: 'Pending',
      createdAt: '2026-06-22T14:00:00.000Z',
      expiresAt: '2026-06-29T14:00:00.000Z',
      usedAt: null,
      revokedAt: null,
    },
    {
      id: 'invite-2',
      athleteProfileId: 'athlete-2',
      name: 'Maya Singh',
      email: 'maya@example.com',
      role: 'Athlete',
      sent: 'Yesterday',
      status: 'Accepted',
      createdAt: '2026-06-21T14:00:00.000Z',
      expiresAt: '2026-06-28T14:00:00.000Z',
      usedAt: '2026-06-21T15:00:00.000Z',
      revokedAt: null,
    },
  ]

  await page.route('**/api/admin/invites**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ invites }),
    })
  })
}

async function openInvitesCreateAndCancelDialogs(page) {
  await expect(page.getByRole('heading', { name: 'Invites' })).toBeVisible()
  await expect(page.locator('.admin-shell-invites-table-shell')).toBeVisible()
  await expect(page.getByText('Thomas Thibault')).toBeVisible()

  await page.getByRole('button', { name: 'Invite an athlete' }).click()
  await expect(page.getByText('Fill out the information below.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.admin-shell-invites-invite-sheet')).toBeHidden()

  await page.locator('.admin-shell-invites-row-menu').first().click()
  await page.getByRole('menuitem', { name: 'Cancel invite' }).click()
  await expect(page.getByRole('heading', { name: 'Cancel invite' })).toBeVisible()
}

async function readInvitesTableDialogVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const rows = Array.from(document.querySelectorAll('.admin-shell-invites-table tbody tr'))
    const cancelDialog = document.querySelector('.admin-shell-invites-cancel-dialog')

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      tableShell: read('.admin-shell-invites-table-shell'),
      table: read('.admin-shell-invites-table'),
      headerCell: read('.admin-shell-invites-table thead th'),
      firstRow: read('.admin-shell-invites-table tbody tr'),
      firstNameText: read('.admin-shell-invites-name-text'),
      bulkActionsButton: read('.admin-shell-invites-example-columns-button'),
      inviteButton: read('.admin-shell-invites-invite-button'),
      rowMenu: read('.admin-shell-invites-row-menu'),
      paginationBar: read('.admin-shell-invites-pagination-bar'),
      cancelDialog: read('.admin-shell-invites-cancel-dialog'),
      cancelDialogCard: read('.admin-shell-invites-cancel-dialog .admin-shell-invites-name-cell'),
      rowCount: rows.length,
      visibleCancelDialog: Boolean(cancelDialog && cancelDialog.getBoundingClientRect().width > 0),
      pageText: document.body.textContent || '',
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectInvitesTableDialogStructure(visualState) {
  expect(visualState.tableShell.exists).toBe(true)
  expect(visualState.table.exists).toBe(true)
  expect(visualState.headerCell.exists).toBe(true)
  expect(visualState.firstRow.exists).toBe(true)
  expect(visualState.firstNameText.text).toContain('Thomas Thibault')
  expect(visualState.rowCount).toBeGreaterThanOrEqual(2)
  expect(visualState.inviteButton.exists).toBe(true)
  expect(visualState.rowMenu.exists).toBe(true)
  expect(visualState.visibleCancelDialog).toBe(true)
  expect(visualState.pageText).toContain('Invite an athlete')
  expect(visualState.pageText).toContain('Columns')
  expect(visualState.pageText).toContain('Cancel invite')
  expect(visualState.pageText).toContain('This invite link will be revoked')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockGroupsApi(page) {
  const groups = [
    {
      id: 'group-1',
      name: 'Off-season forwards',
      description: 'High-volume summer development group.',
      access: 'Private',
      accessLevel: 'private',
      status: 'Active',
      statusValue: 'active',
      athleteCount: 2,
      athleteCountLabel: '2 athletes',
      athleteIds: ['athlete-1', 'athlete-2'],
      athleteNames: ['Thomas Thibault', 'Maya Singh'],
      athletes: [
        { id: 'athlete-1', name: 'Thomas Thibault', avatarUrl: '' },
        { id: 'athlete-2', name: 'Maya Singh', avatarUrl: '' },
      ],
      updated: 'Today',
      updatedAt: '2026-06-22T14:00:00.000Z',
    },
    {
      id: 'group-2',
      name: 'Goalie workload',
      description: 'Recovery and workload monitoring.',
      access: 'Public',
      accessLevel: 'public',
      status: 'Archived',
      statusValue: 'archived',
      athleteCount: 1,
      athleteCountLabel: '1 athlete',
      athleteIds: ['athlete-3'],
      athleteNames: ['Alex Park'],
      athletes: [{ id: 'athlete-3', name: 'Alex Park', avatarUrl: '' }],
      updated: 'Yesterday',
      updatedAt: '2026-06-21T14:00:00.000Z',
    },
  ]
  const athleteOptions = [
    { id: 'athlete-1', name: 'Thomas Thibault', avatarUrl: '' },
    { id: 'athlete-2', name: 'Maya Singh', avatarUrl: '' },
    { id: 'athlete-3', name: 'Alex Park', avatarUrl: '' },
  ]
  const programOptions = [
    { id: 'program-1', name: 'Summer strength block', workouts: '12', workoutCount: 12 },
  ]

  await page.route('**/api/admin/groups**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ groups, athleteOptions, programOptions }),
    })
  })
}

async function openGroupsCreateAndDeleteDialogs(page) {
  await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible()
  await expect(page.locator('.admin-shell-groups-table-shell')).toBeVisible()
  await expect(page.getByText('Off-season forwards')).toBeVisible()

  await page.getByRole('button', { name: 'Create group' }).click()
  await expect(page.getByRole('heading', { name: 'Create a group' })).toBeVisible()
  await expect(page.getByText('Fill out the information below.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.admin-shell-groups-create-sheet')).toBeHidden()

  await page.locator('.admin-shell-groups-row-menu').first().click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Delete group' })).toBeVisible()
}

async function readGroupsTableDialogVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const rows = Array.from(document.querySelectorAll('.admin-shell-groups-table tbody tr'))
    const deleteDialog = document.querySelector('.admin-shell-groups-delete-dialog')

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      tableShell: read('.admin-shell-groups-table-shell'),
      table: read('.admin-shell-groups-table'),
      headerCell: read('.admin-shell-groups-table thead th'),
      firstRow: read('.admin-shell-groups-table tbody tr'),
      firstNameText: read('.admin-shell-groups-name-text'),
      bulkActionsButton: read('[aria-label="Group bulk actions"]'),
      columnsButton: read('.admin-shell-groups-table-shell ~ .admin-shell-athletes-pagination-bar'),
      createButton: read('.admin-shell-athletes-invite-button'),
      rowMenu: read('.admin-shell-groups-row-menu'),
      paginationBar: read('.admin-shell-athletes-pagination-bar'),
      deleteDialog: read('.admin-shell-groups-delete-dialog'),
      rowCount: rows.length,
      visibleDeleteDialog: Boolean(deleteDialog && deleteDialog.getBoundingClientRect().width > 0),
      pageText: document.body.textContent || '',
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectGroupsTableDialogStructure(visualState) {
  expect(visualState.tableShell.exists).toBe(true)
  expect(visualState.table.exists).toBe(true)
  expect(visualState.headerCell.exists).toBe(true)
  expect(visualState.firstRow.exists).toBe(true)
  expect(visualState.firstNameText.text).toContain('Off-season forwards')
  expect(visualState.rowCount).toBeGreaterThanOrEqual(2)
  expect(visualState.createButton.exists).toBe(true)
  expect(visualState.rowMenu.exists).toBe(true)
  expect(visualState.visibleDeleteDialog).toBe(true)
  expect(visualState.pageText).toContain('Create group')
  expect(visualState.pageText).toContain('Columns')
  expect(visualState.pageText).toContain('Delete group')
  expect(visualState.pageText).toContain('This group will be permanently deleted')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockRankingsApi(page) {
  const rankings = [
    {
      id: 'athlete-1',
      rank: 1,
      name: 'Thomas Thibault',
      ageLabel: 'U18',
      avatarUrl: '',
      program: 'Summer strength block',
      workoutsCompleted: 11,
      workoutsTarget: 12,
      workoutsPercentage: 92,
      lastActive: 'Today',
      status: 'Active',
      badgeSrc: '/admin/gold_badge.svg',
    },
    {
      id: 'athlete-2',
      rank: 2,
      name: 'Maya Singh',
      ageLabel: 'U16',
      avatarUrl: '',
      program: 'Speed and power',
      workoutsCompleted: 8,
      workoutsTarget: 10,
      workoutsPercentage: 80,
      lastActive: 'Yesterday',
      status: 'Watch',
      badgeSrc: '/admin/silver_badge.svg',
    },
  ]

  await page.route('**/api/admin/rankings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ rankings }),
    })
  })
}

async function openRankingsTable(page) {
  await expect(page.getByRole('heading', { name: 'Rankings' })).toBeVisible()
  await expect(page.locator('.admin-shell-rankings-table-shell')).toBeVisible()
  await expect(page.getByText('Thomas Thibault')).toBeVisible()
}

async function readRankingsTableVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const rows = Array.from(document.querySelectorAll('.admin-shell-rankings-table tbody tr'))

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      tableShell: read('.admin-shell-rankings-table-shell'),
      table: read('.admin-shell-rankings-table'),
      headerCell: read('.admin-shell-rankings-table thead th'),
      firstRow: read('.admin-shell-rankings-table tbody tr'),
      firstNameText: read('.admin-shell-rankings-name-text'),
      columnsButton: read('.admin-shell-rankings-example-columns-button'),
      rowMenu: read('.admin-shell-rankings-row-menu'),
      paginationBar: read('.admin-shell-rankings-pagination-bar'),
      rowCount: rows.length,
      pageText: document.body.textContent || '',
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectRankingsTableStructure(visualState) {
  expect(visualState.tableShell.exists).toBe(true)
  expect(visualState.table.exists).toBe(true)
  expect(visualState.headerCell.exists).toBe(true)
  expect(visualState.firstRow.exists).toBe(true)
  expect(visualState.firstNameText.text).toContain('Thomas Thibault')
  expect(visualState.rowCount).toBeGreaterThanOrEqual(2)
  expect(visualState.columnsButton.exists).toBe(true)
  expect(visualState.rowMenu.exists).toBe(true)
  expect(visualState.paginationBar.exists).toBe(true)
  expect(visualState.pageText).toContain('Rank')
  expect(visualState.pageText).toContain('Workout progress')
  expect(visualState.pageText).toContain('Rows per page')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockProgramsApi(page) {
  const programs = [
    {
      id: 'program-1',
      name: 'Summer strength block',
      athletesLabel: '8 athletes',
      duration: '8 weeks',
      startDateLabel: 'Jun 24',
      endDateLabel: 'Aug 18',
      status: 'Active',
      statusValue: 'active',
      description: 'Off-season hypertrophy and speed prep.',
      athleteIds: ['athlete-1', 'athlete-2'],
    },
    {
      id: 'program-2',
      name: 'Speed and power',
      athletesLabel: '5 athletes',
      duration: '6 weeks',
      startDateLabel: 'Jul 1',
      endDateLabel: 'Aug 12',
      status: 'Draft',
      statusValue: 'draft',
      description: 'Acceleration and first-step development.',
      athleteIds: ['athlete-3'],
    },
  ]

  const athleteOptions = [
    { id: 'athlete-1', name: 'Thomas Thibault', email: 'thomas@example.test' },
    { id: 'athlete-2', name: 'Maya Singh', email: 'maya@example.test' },
    { id: 'athlete-3', name: 'Noah Carter', email: 'noah@example.test' },
  ]

  await page.route('**/api/admin/programs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ programs, athleteOptions }),
    })
  })
}

async function openProgramsCreateSheetExportSheetAndDeleteDialog(page) {
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible()
  await expect(page.locator('.admin-shell-programs-table-shell')).toBeVisible()
  await expect(page.getByText('Summer strength block')).toBeVisible()

  await page.locator('.admin-shell-programs-columns-button').click()
  await expect(page.getByRole('menuitemcheckbox', { name: /Program/i })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.locator('.admin-shell-programs-row-menu').first().click()
  await expect(page.getByRole('menuitem', { name: 'Export' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Export' }).click()
  await expect(page.getByRole('heading', { name: 'Export programs' })).toBeVisible()
  await rememberProgramsOverlayVisualState(page, 'exportSheet', '.admin-shell-programs-export-sheet')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Create a program' }).click()
  await expect(page.getByRole('heading', { name: 'Create a program' })).toBeVisible()
  await rememberProgramsOverlayVisualState(page, 'createSheet', '.admin-shell-programs-create-sheet')
  await page.keyboard.press('Escape')

  await page.locator('.admin-shell-programs-row-menu').first().click()
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Delete program' })).toBeVisible()
}

async function rememberProgramsOverlayVisualState(page, key, selector) {
  await page.evaluate(({ overlayKey, overlaySelector }) => {
    const element = document.querySelector(overlaySelector)
    const style = element ? getComputedStyle(element) : null
    window.__programsTableSheetsDropdownsVisualState = {
      ...(window.__programsTableSheetsDropdownsVisualState || {}),
      [overlayKey]: {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      },
    }
  }, { overlayKey: key, overlaySelector: selector })
}

async function readProgramsTableSheetsDropdownsVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const rows = Array.from(document.querySelectorAll('.admin-shell-programs-table tbody tr'))
    const remembered = window.__programsTableSheetsDropdownsVisualState || {}

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      tableShell: read('.admin-shell-programs-table-shell'),
      table: read('.admin-shell-programs-table'),
      headerCell: read('.admin-shell-programs-table thead th'),
      firstRow: read('.admin-shell-programs-table tbody tr'),
      firstNameText: read('.admin-shell-programs-name-text'),
      filterTrigger: read('.admin-shell-programs-filter-trigger'),
      columnsButton: read('.admin-shell-programs-columns-button'),
      createButton: read('.admin-shell-programs-create-button'),
      rowMenu: read('.admin-shell-programs-row-menu'),
      createSheet: remembered.createSheet || read('.admin-shell-programs-create-sheet'),
      exportSheet: remembered.exportSheet || read('.admin-shell-programs-export-sheet'),
      deleteDialog: read('.admin-shell-programs-delete-dialog'),
      visibleCreateSheet: Boolean(remembered.createSheet?.exists || document.querySelector('.admin-shell-programs-create-sheet')),
      visibleExportSheet: Boolean(remembered.exportSheet?.exists || document.querySelector('.admin-shell-programs-export-sheet')),
      visibleDeleteDialog: Boolean(document.querySelector('.admin-shell-programs-delete-dialog')),
      rowCount: rows.length,
      pageText: [
        document.body.textContent || '',
        remembered.createSheet?.text || '',
        remembered.exportSheet?.text || '',
      ].join(' '),
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectProgramsTableSheetsDropdownsStructure(visualState) {
  expect(visualState.tableShell.exists).toBe(true)
  expect(visualState.table.exists).toBe(true)
  expect(visualState.headerCell.exists).toBe(true)
  expect(visualState.firstRow.exists).toBe(true)
  expect(visualState.firstNameText.text).toContain('Summer strength block')
  expect(visualState.rowCount).toBeGreaterThanOrEqual(2)
  expect(visualState.filterTrigger.exists).toBe(true)
  expect(visualState.columnsButton.exists).toBe(true)
  expect(visualState.createButton.exists).toBe(true)
  expect(visualState.rowMenu.exists).toBe(true)
  expect(visualState.visibleCreateSheet).toBe(true)
  expect(visualState.visibleExportSheet).toBe(true)
  expect(visualState.visibleDeleteDialog).toBe(true)
  expect(visualState.pageText).toContain('Create a program')
  expect(visualState.pageText).toContain('Export programs')
  expect(visualState.pageText).toContain('Delete program')
  expect(visualState.pageText).toContain('Columns')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockWorkoutsApi(page) {
  const workoutTemplates = [
    {
      id: 'workout-1',
      name: 'Explosive first step',
      training_type: 'Speed',
      estimated_duration_minutes: 45,
      section_count: 2,
      exercise_count: 6,
      set_count: 18,
      status: 'active',
      description: 'Acceleration mechanics and short burst power.',
    },
    {
      id: 'workout-2',
      name: 'Edge control reset',
      training_type: 'Edge Work',
      estimated_duration_minutes: 35,
      section_count: 1,
      exercise_count: 4,
      set_count: 12,
      status: 'draft',
      description: 'Tight turns, mohawks, and underload edge quality.',
    },
  ]

  const programs = [
    { id: 'program-1', name: 'Summer strength block', duration: '8 weeks', weekCount: 8, status: 'active' },
    { id: 'program-2', name: 'Speed and power', duration: '6 weeks', weekCount: 6, status: 'draft' },
  ]

  await page.route('**/api/admin/workout-templates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ workoutTemplates }),
    })
  })

  await page.route('**/api/admin/programs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ programs, athleteOptions: [] }),
    })
  })
}

async function openWorkoutsCreateSheetExportSheetAssignSheetAndDeleteDialog(page) {
  await expect(page.getByRole('heading', { name: 'Workout Library' })).toBeVisible()
  await expect(page.locator('.admin-shell-workouts-table-shell')).toBeVisible()
  await expect(page.getByText('Explosive first step')).toBeVisible()

  await page.locator('.admin-shell-workouts-columns-button').click()
  await expect(page.getByRole('menuitemcheckbox', { name: /Workout/i })).toBeVisible()
  await rememberWorkoutsOverlayVisualState(page, 'columnsMenu', '[role="menu"]')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Create workout' }).click()
  await expect(page.getByRole('heading', { name: 'Create workout' })).toBeVisible()
  await rememberWorkoutsOverlayVisualState(page, 'createSheet', '.admin-shell-workouts-create-sheet')
  await page.keyboard.press('Escape')

  await page.getByRole('checkbox', { name: 'Select row' }).first().click()
  await page.getByRole('button', { name: /Workout bulk actions|Bulk actions/ }).click()
  await expect(page.getByRole('menuitem', { name: 'Export' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Export' }).click()
  await expect(page.getByRole('heading', { name: 'Export workouts' })).toBeVisible()
  await rememberWorkoutsOverlayVisualState(page, 'exportSheet', '.admin-shell-workouts-export-sheet')
  await page.keyboard.press('Escape')
  await expect(page.locator('.admin-shell-workouts-export-sheet')).toBeHidden()

  await page.getByRole('button', { name: /Workout bulk actions|Bulk actions/ }).click()
  await expect(page.getByRole('menuitem', { name: 'Assign to program' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Assign to program' }).click()
  await expect(page.getByRole('heading', { name: 'Assign to program' })).toBeVisible()
  await page.locator('.admin-shell-workouts-assign-program-select-trigger').click()
  await expect(page.getByRole('option', { name: 'Summer strength block' })).toBeVisible()
  await rememberWorkoutsOverlayVisualState(page, 'assignSheet', '.admin-shell-workouts-assign-sheet')
  await rememberWorkoutsOverlayVisualState(page, 'assignDropdown', '.admin-shell-workouts-assign-program-select-content')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await page.locator('.admin-shell-workouts-row-menu').first().click()
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Delete workouts' })).toBeVisible()
}

async function rememberWorkoutsOverlayVisualState(page, key, selector) {
  await page.evaluate(({ overlayKey, overlaySelector }) => {
    const element = document.querySelector(overlaySelector)
    const style = element ? getComputedStyle(element) : null
    window.__workoutsTableSheetsDropdownsVisualState = {
      ...(window.__workoutsTableSheetsDropdownsVisualState || {}),
      [overlayKey]: {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      },
    }
  }, { overlayKey: key, overlaySelector: selector })
}

async function readWorkoutsTableSheetsDropdownsVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const rows = Array.from(document.querySelectorAll('.admin-shell-workouts-table tbody tr'))
    const remembered = window.__workoutsTableSheetsDropdownsVisualState || {}

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      tableShell: read('.admin-shell-workouts-table-shell'),
      table: read('.admin-shell-workouts-table'),
      headerCell: read('.admin-shell-workouts-table thead th'),
      firstRow: read('.admin-shell-workouts-table tbody tr'),
      firstNameText: read('.admin-shell-workouts-name-text'),
      filterTrigger: read('.admin-shell-workouts-filter-trigger'),
      columnsButton: read('.admin-shell-workouts-columns-button'),
      bulkActionsButton: read('.admin-shell-workouts-bulk-actions-button'),
      createButton: read('.admin-shell-workouts-create-button'),
      rowMenu: read('.admin-shell-workouts-row-menu'),
      createSheet: remembered.createSheet || read('.admin-shell-workouts-create-sheet'),
      exportSheet: remembered.exportSheet || read('.admin-shell-workouts-export-sheet'),
      assignSheet: remembered.assignSheet || read('.admin-shell-workouts-assign-sheet'),
      assignDropdown: remembered.assignDropdown || read('.admin-shell-workouts-assign-program-select-content'),
      deleteDialog: read('.admin-shell-workouts-delete-dialog'),
      visibleCreateSheet: Boolean(remembered.createSheet?.exists || document.querySelector('.admin-shell-workouts-create-sheet')),
      visibleExportSheet: Boolean(remembered.exportSheet?.exists || document.querySelector('.admin-shell-workouts-export-sheet')),
      visibleAssignSheet: Boolean(remembered.assignSheet?.exists || document.querySelector('.admin-shell-workouts-assign-sheet')),
      visibleAssignDropdown: Boolean(remembered.assignDropdown?.exists || document.querySelector('.admin-shell-workouts-assign-program-select-content')),
      visibleDeleteDialog: Boolean(document.querySelector('.admin-shell-workouts-delete-dialog')),
      rowCount: rows.length,
      pageText: [
        document.body.textContent || '',
        remembered.createSheet?.text || '',
        remembered.exportSheet?.text || '',
        remembered.assignSheet?.text || '',
        remembered.assignDropdown?.text || '',
      ].join(' '),
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectWorkoutsTableSheetsDropdownsStructure(visualState) {
  expect(visualState.tableShell.exists).toBe(true)
  expect(visualState.table.exists).toBe(true)
  expect(visualState.headerCell.exists).toBe(true)
  expect(visualState.firstRow.exists).toBe(true)
  expect(visualState.firstNameText.text).toContain('Explosive first step')
  expect(visualState.rowCount).toBeGreaterThanOrEqual(2)
  expect(visualState.filterTrigger.exists).toBe(true)
  expect(visualState.columnsButton.exists).toBe(true)
  expect(visualState.bulkActionsButton.exists).toBe(true)
  expect(visualState.createButton.exists).toBe(true)
  expect(visualState.rowMenu.exists).toBe(true)
  expect(visualState.visibleCreateSheet).toBe(true)
  expect(visualState.visibleExportSheet).toBe(true)
  expect(visualState.visibleAssignSheet).toBe(true)
  expect(visualState.visibleAssignDropdown).toBe(true)
  expect(visualState.visibleDeleteDialog).toBe(true)
  expect(visualState.pageText).toContain('Create workout')
  expect(visualState.pageText).toContain('Export workouts')
  expect(visualState.pageText).toContain('Assign to program')
  expect(visualState.pageText).toContain('Summer strength block')
  expect(visualState.pageText).toContain('Delete workouts')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}


async function mockExercisesApi(page) {
  const exercises = [
    {
      id: 'exercise-1',
      name: 'Plyometric stride',
      muscle: 'Quads',
      muscleNames: ['Quads', 'Glutes'],
      primaryMuscleId: 'muscle-quads',
      secondaryMuscleIds: ['muscle-glutes'],
      sets: '4',
      reps: '6',
      duration: '30 sec',
      distance: '20 m',
      rest: '60 sec',
      tempo: '3-1-1-0',
      category: 'power',
      difficulty: 'advanced',
      status: 'active',
      equipment: 'Cones',
      equipmentNeeded: ['Cones', 'Mini bands'],
      movementTypeValues: ['Explosive'],
      totalSetCount: 4,
      description: 'Explosive skating stride power pattern.',
      thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 360"%3E%3Crect width="840" height="360" fill="%233BE0AF"/%3E%3Ctext x="420" y="190" text-anchor="middle" font-size="48" fill="%230B1120"%3EPlyometric stride%3C/text%3E%3C/svg%3E',
      videoUrl: 'https://example.test/exercises/plyometric-stride.mp4',
    },
    {
      id: 'exercise-2',
      name: 'Edge reset hold',
      muscle: 'Adductors',
      muscleNames: ['Adductors'],
      primaryMuscleId: 'muscle-adductors',
      secondaryMuscleIds: [],
      sets: '3',
      reps: '8',
      duration: '40 sec',
      distance: '-',
      rest: '45 sec',
      tempo: '2-0-2-0',
      category: 'mobility',
      difficulty: 'intermediate',
      status: 'draft',
      equipment: 'Band',
      equipmentNeeded: ['Band'],
      movementTypeValues: ['Isometric'],
      totalSetCount: 3,
      description: 'Controlled edge stability work.',
      thumbnailUrl: '',
      videoUrl: '',
    },
  ]
  const muscleOptions = [
    { value: 'muscle-quads', label: 'Quads' },
    { value: 'muscle-glutes', label: 'Glutes' },
    { value: 'muscle-adductors', label: 'Adductors' },
  ]

  await page.route('**/api/admin/exercises**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const detailMatch = url.pathname.match(/\/api\/admin\/exercises\/([^/]+)$/)

    if (method === 'GET' && detailMatch) {
      const exercise = exercises.find((item) => item.id === detailMatch[1]) || exercises[0]
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exercise }),
      })
      return
    }

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exercises, muscleOptions }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, exercises, muscleOptions }),
    })
  })
}

async function openExercisesCreateSheetExportSheetMediaPreviewAndDeleteDialog(page) {
  await expect(page.getByRole('heading', { name: 'Exercise library' })).toBeVisible()
  await expect(page.locator('.admin-shell-exercises-table-shell')).toBeVisible()
  await expect(page.getByText('Plyometric stride')).toBeVisible()

  await page.locator('.admin-shell-exercises-columns-button').click()
  await expect(page.getByRole('menuitemcheckbox', { name: /Exercise/i })).toBeVisible()
  await rememberExercisesOverlayVisualState(page, 'columnsMenu', '[role="menu"]')
  await page.keyboard.press('Escape')

  await page.getByRole('checkbox', { name: 'Select row' }).first().click()
  await page.getByRole('button', { name: /Exercise bulk actions|Bulk actions/ }).click()
  await expect(page.getByRole('menuitem', { name: 'Export' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Export' }).click()
  await expect(page.getByRole('heading', { name: 'Export exercises' })).toBeVisible()
  await rememberExercisesOverlayVisualState(page, 'exportSheet', '.admin-shell-exercises-export-sheet')
  await page.keyboard.press('Escape')
  await expect(page.locator('.admin-shell-exercises-export-sheet')).toBeHidden()

  await page.locator('.admin-shell-exercises-row-menu').first().click()
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await expect(page.getByRole('heading', { name: 'Edit exercise' })).toBeVisible()
  await expect(page.getByText('Medias preview')).toBeVisible()
  await expect(page.getByText('Generated thumbnail and MP4 preview')).toBeVisible()
  await rememberExercisesOverlayVisualState(page, 'createSheet', '.admin-shell-exercises-create-sheet')
  await rememberExercisesOverlayVisualState(page, 'mediaPreview', '.admin-shell-exercises-media-preview')
  await page.keyboard.press('Escape')
  await expect(page.locator('.admin-shell-exercises-create-sheet')).toBeHidden()

  await page.locator('.admin-shell-exercises-row-menu').first().click()
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Delete exercise' })).toBeVisible()
}

async function rememberExercisesOverlayVisualState(page, key, selector) {
  await page.evaluate(({ overlayKey, overlaySelector }) => {
    const element = document.querySelector(overlaySelector)
    const style = element ? getComputedStyle(element) : null
    window.__exercisesTableSheetsMediaVisualState = {
      ...(window.__exercisesTableSheetsMediaVisualState || {}),
      [overlayKey]: {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      },
    }
  }, { overlayKey: key, overlaySelector: selector })
}

async function readExercisesTableSheetsMediaVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const rows = Array.from(document.querySelectorAll('.admin-shell-exercises-table tbody tr'))
    const remembered = window.__exercisesTableSheetsMediaVisualState || {}

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      tableShell: read('.admin-shell-exercises-table-shell'),
      table: read('.admin-shell-exercises-table'),
      headerCell: read('.admin-shell-exercises-table thead th'),
      firstRow: read('.admin-shell-exercises-table tbody tr'),
      firstNameText: read('.admin-shell-exercises-name-text'),
      filterTrigger: read('.admin-shell-exercises-filter-trigger'),
      columnsButton: read('.admin-shell-exercises-columns-button'),
      bulkActionsButton: read('.admin-shell-exercises-bulk-actions-button'),
      createButton: read('.admin-shell-exercises-create-button'),
      rowMenu: read('.admin-shell-exercises-row-menu'),
      createSheet: remembered.createSheet || read('.admin-shell-exercises-create-sheet'),
      exportSheet: remembered.exportSheet || read('.admin-shell-exercises-export-sheet'),
      mediaPreview: remembered.mediaPreview || read('.admin-shell-exercises-media-preview'),
      columnsMenu: remembered.columnsMenu || read('[role="menu"]'),
      deleteDialog: read('.admin-shell-athletes-invite-dialog'),
      visibleCreateSheet: Boolean(remembered.createSheet?.exists || document.querySelector('.admin-shell-exercises-create-sheet')),
      visibleExportSheet: Boolean(remembered.exportSheet?.exists || document.querySelector('.admin-shell-exercises-export-sheet')),
      visibleMediaPreview: Boolean(remembered.mediaPreview?.exists || document.querySelector('.admin-shell-exercises-media-preview')),
      visibleColumnsMenu: Boolean(remembered.columnsMenu?.exists),
      visibleDeleteDialog: Boolean(document.querySelector('.admin-shell-athletes-invite-dialog')),
      rowCount: rows.length,
      pageText: [
        document.body.textContent || '',
        remembered.columnsMenu?.text || '',
        remembered.createSheet?.text || '',
        remembered.exportSheet?.text || '',
        remembered.mediaPreview?.text || '',
      ].join(' '),
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectExercisesTableSheetsMediaStructure(visualState) {
  expect(visualState.tableShell.exists).toBe(true)
  expect(visualState.table.exists).toBe(true)
  expect(visualState.headerCell.exists).toBe(true)
  expect(visualState.firstRow.exists).toBe(true)
  expect(visualState.firstNameText.text).toContain('Plyometric stride')
  expect(visualState.rowCount).toBeGreaterThanOrEqual(2)
  expect(visualState.filterTrigger.exists).toBe(true)
  expect(visualState.columnsButton.exists).toBe(true)
  expect(visualState.bulkActionsButton.exists).toBe(true)
  expect(visualState.createButton.exists).toBe(true)
  expect(visualState.rowMenu.exists).toBe(true)
  expect(visualState.visibleColumnsMenu).toBe(true)
  expect(visualState.visibleExportSheet).toBe(true)
  expect(visualState.visibleCreateSheet).toBe(true)
  expect(visualState.visibleMediaPreview).toBe(true)
  expect(visualState.visibleDeleteDialog).toBe(true)
  expect(visualState.pageText).toContain('Create exercise')
  expect(visualState.pageText).toContain('Edit exercise')
  expect(visualState.pageText).toContain('Export exercises')
  expect(visualState.pageText).toContain('Medias preview')
  expect(visualState.pageText).toContain('Generated thumbnail and MP4 preview')
  expect(visualState.pageText).toContain('Delete exercise')
  expect(visualState.pageText).toContain('Columns')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockWorkoutCalendarApi(page) {
  const workoutTemplates = [
    {
      id: 'template-speed-1',
      name: 'Speed Accelerator',
      training_type: 'Speed Accelerator',
      bg_color: '#DDFBF2',
      text_color: '#0F5F4A',
      section_count: 2,
      exercise_count: 6,
      set_count: 18,
      estimated_duration_minutes: 45,
      status: 'active',
    },
    {
      id: 'template-edge-1',
      name: 'Edge control reset',
      training_type: 'Edge Work',
      bg_color: '#E7F0FF',
      text_color: '#1E3A8A',
      section_count: 1,
      exercise_count: 4,
      set_count: 12,
      estimated_duration_minutes: 35,
      status: 'active',
    },
  ]

  const assignments = [
    {
      id: 'calendar-assignment-1',
      workout_template_id: 'template-speed-1',
      name_snapshot: 'Speed Accelerator',
      training_type: 'Speed Accelerator',
      scheduled_date: '2026-05-04',
      scheduled_start_time: '08:00:00',
      scheduled_end_time: '09:00:00',
      workout_templates: workoutTemplates[0],
    },
    {
      id: 'calendar-assignment-2',
      workout_template_id: 'template-edge-1',
      name_snapshot: 'Edge control reset',
      training_type: 'Edge Work',
      scheduled_date: '2026-05-05',
      scheduled_start_time: '10:00:00',
      scheduled_end_time: '11:00:00',
      workout_templates: workoutTemplates[1],
    },
  ]

  await page.route('**/api/admin/workout-calendar**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ assignments }),
    })
  })

  await page.route('**/api/admin/workout-templates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ workoutTemplates }),
    })
  })
}

async function openWorkoutCalendarAddDialog(page) {
  await expect(page.getByRole('region', { name: 'Workout calendar admin view' })).toBeVisible()
  await expect(page.locator('.admin-shell-workouts-calendar-view')).toBeVisible()
  await expect(page.locator('.admin-shell-workouts-calendar-header')).toBeVisible()
  await expect(page.locator('.admin-shell-workouts-calendar-month-grid')).toBeVisible()
  await expect(page.getByText('Speed Accelerator')).toBeVisible()

  await page.getByRole('button', { name: 'View by week' }).click()
  await expect(page.locator('.admin-shell-workouts-calendar-week-grid')).toBeVisible()
  await expect(page.getByText('Weekly schedule')).toBeVisible()
  await page.getByRole('button', { name: 'View by month' }).click()
  await expect(page.locator('.admin-shell-workouts-calendar-month-grid')).toBeVisible()

  await page.getByRole('button', { name: 'Add Workout' }).click()
  await expect(page.getByRole('heading', { name: 'Add Workout' })).toBeVisible()
  await expect(page.locator('.admin-shell-workouts-calendar-add-dialog')).toBeVisible()
  await expect(page.getByText('Workout templates')).toBeVisible()
}

async function readWorkoutCalendarVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const events = Array.from(document.querySelectorAll('.admin-shell-workouts-calendar-event-card'))

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      view: read('.admin-shell-workouts-calendar-view'),
      header: read('.admin-shell-workouts-calendar-header'),
      monthGrid: read('.admin-shell-workouts-calendar-month-grid'),
      weekGrid: read('.admin-shell-workouts-calendar-week-grid'),
      firstEvent: read('.admin-shell-workouts-calendar-event-card'),
      addDialog: read('.admin-shell-workouts-calendar-add-dialog'),
      startDateInput: read('.admin-shell-workouts-calendar-add-dialog input[type="date"]'),
      templateCard: read('.admin-shell-workouts-calendar-add-dialog button'),
      eventCount: events.length,
      pageText: document.body.textContent || '',
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectWorkoutCalendarStructure(visualState) {
  expect(visualState.view.exists).toBe(true)
  expect(visualState.header.exists).toBe(true)
  expect(visualState.monthGrid.exists).toBe(true)
  expect(visualState.weekGrid.exists).toBe(false)
  expect(visualState.firstEvent.exists).toBe(true)
  expect(visualState.addDialog.exists).toBe(true)
  expect(visualState.startDateInput.exists).toBe(true)
  expect(visualState.templateCard.exists).toBe(true)
  expect(visualState.eventCount).toBeGreaterThanOrEqual(2)
  expect(visualState.pageText).toContain('May 2026')
  expect(visualState.pageText).toContain('Speed Accelerator')
  expect(visualState.pageText).toContain('Add Workout')
  expect(visualState.pageText).toContain('Workout templates')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

async function mockPlannerWorkoutTemplatesApi(page) {
  await page.route('**/api/admin/workout-templates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workoutTemplates: [
          {
            id: 'template-speed-1',
            name: 'Speed Accelerator',
            training_type: 'Speed Accelerator',
            bg_color: '#DDFBF2',
            text_color: '#0F5F4A',
            section_count: 2,
            exercise_count: 6,
            set_count: 18,
            estimated_duration_minutes: 45,
          },
        ],
      }),
    })
  })
}

async function openProgramPlannerCreateAndWorkoutSheets(page) {
  await expect(page.getByRole('heading', { name: 'Program 1' })).toBeVisible()
  await expect(page.locator('.program-planner-page-header')).toBeVisible()
  await expect(page.locator('.program-planner-week-row').first()).toBeVisible()
  await expect(page.locator('.program-planner-day-card').first()).toBeVisible()
  await expect(page.locator('.program-planner-workout-card').first()).toBeVisible()
  await expect(page.locator('.program-planner-empty-workout-card').first()).toBeVisible()

  await page.locator('.program-planner-day-card').first().getByRole('button', { name: /Add workout to Day 1/i }).click()
  await expect(page.getByRole('heading', { name: 'Create workout' })).toBeVisible()
  await expect(page.getByText('Workout Templates')).toBeVisible()
  await rememberProgramPlannerOverlayVisualState(page, 'createSheet', '.program-planner-create-workout-sheet')
  await page.keyboard.press('Escape')

  await page.locator('.program-planner-workout-card').first().click()
  await expect(page.getByRole('heading', { name: 'Edit workout' })).toBeVisible()
  await expect(page.getByLabel('Name')).toBeVisible()
  await rememberProgramPlannerOverlayVisualState(page, 'workoutSheet', '.program-planner-sheet')
  await page.keyboard.press('Escape')

  await page.locator('.program-planner-workout-card .program-planner-icon-button').first().click()
  const workoutActionsMenu = page.locator('[role="menu"]').filter({ hasText: 'Workout actions' })
  await expect(workoutActionsMenu).toBeVisible()
  await expect(workoutActionsMenu.getByRole('menuitem', { name: 'Edit' })).toBeVisible()
  await rememberProgramPlannerOverlayVisualState(page, 'workoutMenu', '[role="menu"]')
  await page.keyboard.press('Escape')
}

async function rememberProgramPlannerOverlayVisualState(page, key, selector) {
  await page.evaluate(({ overlayKey, overlaySelector }) => {
    const element = document.querySelector(overlaySelector)
    const style = element ? getComputedStyle(element) : null
    window.__programPlannerVisualState = {
      ...(window.__programPlannerVisualState || {}),
      [overlayKey]: {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      },
    }
  }, { overlayKey: key, overlaySelector: selector })
}

async function readProgramDetailPlannerVisualState(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector)
      const style = element ? getComputedStyle(element) : null
      return {
        exists: Boolean(element),
        color: style?.color || '',
        backgroundColor: style?.backgroundColor || '',
        borderColor: style?.borderColor || '',
        boxShadow: style?.boxShadow || '',
        width: element?.getBoundingClientRect().width || 0,
        height: element?.getBoundingClientRect().height || 0,
        text: element?.textContent || '',
      }
    }

    const remembered = window.__programPlannerVisualState || {}
    const allText = [document.body.textContent || '', remembered.createSheet?.text || '', remembered.workoutSheet?.text || '', remembered.workoutMenu?.text || ''].join(' ')

    return {
      htmlTheme: document.documentElement.dataset.theme,
      storedTheme: window.localStorage?.getItem('pplus-admin-theme'),
      pageHeader: read('.program-planner-page-header'),
      title: read('.admin-shell-athletes-page-title'),
      backButton: read('.program-planner-back-button'),
      addWeekButton: read('.program-planner-heading-row button'),
      weekRow: read('.program-planner-week-row'),
      dayCard: read('.program-planner-day-card'),
      workoutCard: read('.program-planner-workout-card'),
      workoutBlock: read('.program-planner-workout-block'),
      emptyWorkoutCard: read('.program-planner-empty-workout-card'),
      scrollButton: read('.program-planner-scroll-button'),
      createSheet: remembered.createSheet || read('.program-planner-create-workout-sheet'),
      workoutSheet: remembered.workoutSheet || read('.program-planner-sheet'),
      workoutMenu: remembered.workoutMenu || read('[role="menu"]'),
      pageText: allText,
      weekCount: document.querySelectorAll('.program-planner-week-row').length,
      dayCardCount: document.querySelectorAll('.program-planner-day-card').length,
      workoutCardCount: document.querySelectorAll('.program-planner-workout-card').length,
      emptyCardCount: document.querySelectorAll('.program-planner-empty-workout-card').length,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

function expectProgramDetailPlannerStructure(visualState) {
  expect(visualState.pageHeader.exists).toBe(true)
  expect(visualState.title.text).toContain('Program 1')
  expect(visualState.backButton.text).toContain('Back')
  expect(visualState.addWeekButton.text).toContain('Add Week')
  expect(visualState.weekRow.exists).toBe(true)
  expect(visualState.dayCard.exists).toBe(true)
  expect(visualState.workoutCard.exists).toBe(true)
  expect(visualState.workoutBlock.exists).toBe(true)
  expect(visualState.emptyWorkoutCard.exists).toBe(true)
  expect(visualState.scrollButton.exists).toBe(true)
  expect(visualState.createSheet.exists).toBe(true)
  expect(visualState.workoutSheet.exists).toBe(true)
  expect(visualState.workoutMenu.exists).toBe(true)
  expect(visualState.weekCount).toBeGreaterThanOrEqual(1)
  expect(visualState.dayCardCount).toBeGreaterThanOrEqual(7)
  expect(visualState.workoutCardCount).toBeGreaterThanOrEqual(1)
  expect(visualState.emptyCardCount).toBeGreaterThanOrEqual(1)
  expect(visualState.pageText).toContain('Week 1')
  expect(visualState.pageText).toContain('Day 1')
  expect(visualState.pageText).toContain('Speed Accelerator')
  expect(visualState.pageText).toContain('No workouts yet.')
  expect(visualState.pageText).toContain('Create workout')
  expect(visualState.pageText).toContain('Workout Templates')
  expect(visualState.pageText).toContain('Edit workout')
  expect(visualState.pageText).toContain('Workout actions')
  expect(visualState.documentOverflowX).toBeLessThanOrEqual(1)
}

test.describe('PPLUS admin shell visual/theme checks', () => {
  test('Admin sidebar dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')

    await expect(page.locator('.admin-dashboard-sidebar')).toBeVisible()
    await expect(page.locator('.admin-dashboard-topbar')).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar-logo-dark')).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar-logo-light')).toBeHidden()

    await openSidebarSubnav(page)

    const visualState = await readSidebarVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectSidebarStructure(visualState)
    expect(visualState.darkLogo.display).not.toBe('none')
    expect(visualState.darkLogo.src).toContain('/admin/logo_pplus_training.svg')
    expect(visualState.darkLogo.width).toBeGreaterThan(0)
    expect(visualState.lightLogo.display).toBe('none')
    expect(visualState.lightLogo.src).toContain('/admin/logo_ppht_light_mode.svg')

    expectDarkSurface(visualState.sidebarInner.backgroundColor, 'Sidebar inner')
    expectDarkSurface(visualState.header.backgroundColor, 'Sidebar header')
    expectDarkSurface(visualState.content.backgroundColor, 'Sidebar content')
    expectDarkSurface(visualState.footer.backgroundColor, 'Sidebar footer')
    expectDarkSurface(visualState.switcher.backgroundColor, 'Athlete switcher')
    expectDarkSurface(visualState.accountButton.backgroundColor, 'Account button')
    expectLightText(visualState.navButton.color, 'Sidebar nav button text')
    expectLightText(visualState.groupLabel.color, 'Sidebar group label')
    expectLightText(visualState.primaryText.color, 'Sidebar primary text')
    expectLightText(visualState.secondaryText.color, 'Sidebar secondary text')
    expectLightText(visualState.subnavButton.color, 'Sidebar subnav button text')
    expectAccentText(visualState.activeNavButton?.color || '', 'Active sidebar nav item')
  })

  test('Admin sidebar light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')

    await expect(page.locator('.admin-dashboard-sidebar')).toBeVisible()
    await expect(page.locator('.admin-dashboard-topbar')).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar-logo-light')).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar-logo-dark')).toBeHidden()

    await openSidebarSubnav(page)

    const visualState = await readSidebarVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectSidebarStructure(visualState)
    expect(visualState.lightLogo.display).not.toBe('none')
    expect(visualState.lightLogo.src).toContain('/admin/logo_ppht_light_mode.svg')
    expect(visualState.lightLogo.width).toBeGreaterThan(0)
    expect(visualState.darkLogo.display).toBe('none')
    expect(visualState.darkLogo.src).toContain('/admin/logo_pplus_training.svg')

    expectLightSurface(visualState.sidebarInner.backgroundColor, 'Sidebar inner')
    expectLightSurface(visualState.header.backgroundColor, 'Sidebar header')
    expectLightSurface(visualState.content.backgroundColor, 'Sidebar content')
    expectLightSurface(visualState.footer.backgroundColor, 'Sidebar footer')
    expectLightSurface(visualState.switcher.backgroundColor, 'Athlete switcher')
    expectLightSurface(visualState.accountButton.backgroundColor, 'Account button')
    expectDarkText(visualState.navButton.color, 'Sidebar nav button text')
    expectDarkText(visualState.groupLabel.color, 'Sidebar group label')
    expectDarkText(visualState.primaryText.color, 'Sidebar primary text')
    expectDarkText(visualState.secondaryText.color, 'Sidebar secondary text')
    expectDarkText(visualState.subnavButton.color, 'Sidebar subnav button text')
    expectAccentText(visualState.activeNavButton?.color || '', 'Active sidebar nav item')
  })

  test('Support inbox dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockSupportInboxApi(page)
    await page.goto('/admin/support/reference')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')

    await expect(page.locator('.support-inbox-shell')).toBeVisible()
    await expect(page.locator('.support-inbox-sidebar')).toBeVisible()
    await expect(page.locator('.support-inbox-topbar')).toBeVisible()
    await expect(page.locator('.support-inbox-sidebar-logo-dark')).toBeVisible()
    await expect(page.locator('.support-inbox-sidebar-logo-light')).toBeHidden()
    await expect(page.locator('.support-inbox-conversation-row-active')).toBeVisible()
    await expect(page.locator('.support-inbox-composer')).toBeVisible()
    await page.locator('.support-inbox-status-trigger').click()
    await expect(page.locator('.support-inbox-status-content')).toBeVisible()

    const visualState = await readSupportInboxVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectSupportInboxStructure(visualState)
    expect(visualState.darkLogo.display).not.toBe('none')
    expect(visualState.darkLogo.src).toContain('/admin/logo_pplus_training.svg')
    expect(visualState.lightLogo.display).toBe('none')
    expectDarkSurface(visualState.shell.backgroundColor, 'Support inbox shell')
    expectDarkSurface(visualState.sidebarInner.backgroundColor, 'Support inbox sidebar')
    expectDarkSurface(visualState.topbar.backgroundColor, 'Support inbox topbar')
    expectDarkSurface(visualState.sidebarSearchInput.backgroundColor, 'Support inbox sidebar search')
    expectDarkSurface(visualState.topbarSearchInput.backgroundColor, 'Support inbox topbar search')
    expectDarkSurface(visualState.statusTrigger.backgroundColor, 'Support inbox status trigger')
    expectDarkSurface(visualState.statusContent.backgroundColor, 'Support inbox status dropdown')
    expectDarkSurface(visualState.composer.backgroundColor, 'Support inbox composer')
    expectDarkSurface(visualState.composerInner.backgroundColor, 'Support inbox composer inner')
    expectLightText(visualState.topbarTitle.color, 'Support inbox topbar title')
    expectLightText(visualState.conversationName.color, 'Support inbox conversation name')
    expectLightText(visualState.composerInput.color, 'Support inbox composer input')
    expectAccentSurface(visualState.conversationRowActive.backgroundColor, 'Support inbox active conversation row')
  })

  test('Support inbox light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockSupportInboxApi(page)
    await page.goto('/admin/support/reference')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')

    await expect(page.locator('.support-inbox-shell')).toBeVisible()
    await expect(page.locator('.support-inbox-sidebar')).toBeVisible()
    await expect(page.locator('.support-inbox-topbar')).toBeVisible()
    await expect(page.locator('.support-inbox-sidebar-logo-light')).toBeVisible()
    await expect(page.locator('.support-inbox-sidebar-logo-dark')).toBeHidden()
    await expect(page.locator('.support-inbox-conversation-row-active')).toBeVisible()
    await expect(page.locator('.support-inbox-composer')).toBeVisible()
    await page.locator('.support-inbox-status-trigger').click()
    await expect(page.locator('.support-inbox-status-content')).toBeVisible()

    const visualState = await readSupportInboxVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectSupportInboxStructure(visualState)
    expect(visualState.lightLogo.display).not.toBe('none')
    expect(visualState.lightLogo.src).toContain('/admin/logo_ppht_light_mode.svg')
    expect(visualState.darkLogo.display).toBe('none')
    expectLightSurface(visualState.shell.backgroundColor, 'Support inbox shell')
    expectLightSurface(visualState.sidebarInner.backgroundColor, 'Support inbox sidebar')
    expectLightSurface(visualState.topbar.backgroundColor, 'Support inbox topbar')
    expectLightSurface(visualState.sidebarSearchInput.backgroundColor, 'Support inbox sidebar search')
    expectLightSurface(visualState.topbarSearchInput.backgroundColor, 'Support inbox topbar search')
    expectLightSurface(visualState.statusTrigger.backgroundColor, 'Support inbox status trigger')
    expectLightSurface(visualState.statusContent.backgroundColor, 'Support inbox status dropdown')
    expectLightSurface(visualState.composer.backgroundColor, 'Support inbox composer')
    expectLightSurface(visualState.composerInner.backgroundColor, 'Support inbox composer inner')
    expectDarkText(visualState.topbarTitle.color, 'Support inbox topbar title')
    expectDarkText(visualState.conversationName.color, 'Support inbox conversation name')
    expectDarkText(visualState.composerInput.color, 'Support inbox composer input')
    expectAccentSurface(visualState.conversationRowActive.backgroundColor, 'Support inbox active conversation row')
  })

  test('Settings profile/account dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockSettingsProfileAccountApi(page)
    await page.goto('/admin/settings')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')

    await expect(page.locator('.admin-settings-profile-form')).toBeVisible()
    await expect(page.locator('.admin-settings-profile-avatar')).toBeVisible()
    await expect(page.locator('.admin-settings-profile-first-name')).toHaveValue('Anthony')

    const profileState = await readSettingsProfileAccountVisualState(page)

    expect(profileState.htmlTheme).toBe('dark')
    expect(profileState.storedTheme).toBe('dark')
    expectSettingsProfileAccountStructure(profileState, 'profile')
    expectDarkSurface(profileState.workspace.backgroundColor, 'Settings workspace')
    expectLightText(profileState.title.color, 'Settings profile title')
    expectDarkSurface(profileState.profileFirstName.backgroundColor, 'Settings first name input')
    expectDarkSurface(profileState.profileLastName.backgroundColor, 'Settings last name input')
    expectDarkSurface(profileState.profilePhone.backgroundColor, 'Settings phone input')
    expectLightText(profileState.profileFirstName.color, 'Settings first name text')
    expectAccentText(profileState.profileSubmit.backgroundColor, 'Settings profile submit')

    await page.goto('/admin/settings/account')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await expect(page.locator('.admin-settings-account-form')).toBeVisible()
    await expect(page.locator('.admin-settings-account-email')).toHaveValue(/@/)

    const accountState = await readSettingsProfileAccountVisualState(page)

    expect(accountState.htmlTheme).toBe('dark')
    expect(accountState.storedTheme).toBe('dark')
    expectSettingsProfileAccountStructure(accountState, 'account')
    expectDarkSurface(accountState.accountEmail.backgroundColor, 'Settings account email input')
    expectDarkSurface(accountState.accountCurrentPassword.backgroundColor, 'Settings current password input')
    expectDarkSurface(accountState.accountNewPassword.backgroundColor, 'Settings new password input')
    expectDarkSurface(accountState.accountConfirmPassword.backgroundColor, 'Settings confirm password input')
    expectLightText(accountState.accountEmail.color, 'Settings account email text')
    expectAccentText(accountState.accountSubmit.backgroundColor, 'Settings account submit')
  })

  test('Settings profile/account light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockSettingsProfileAccountApi(page)
    await page.goto('/admin/settings')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')

    await expect(page.locator('.admin-settings-profile-form')).toBeVisible()
    await expect(page.locator('.admin-settings-profile-avatar')).toBeVisible()
    await expect(page.locator('.admin-settings-profile-first-name')).toHaveValue('Anthony')

    const profileState = await readSettingsProfileAccountVisualState(page)

    expect(profileState.htmlTheme).toBe('light')
    expect(profileState.storedTheme).toBe('light')
    expectSettingsProfileAccountStructure(profileState, 'profile')
    expectLightSurface(profileState.workspace.backgroundColor, 'Settings workspace')
    expectDarkText(profileState.title.color, 'Settings profile title')
    expectLightSurface(profileState.profileFirstName.backgroundColor, 'Settings first name input')
    expectLightSurface(profileState.profileLastName.backgroundColor, 'Settings last name input')
    expectLightSurface(profileState.profilePhone.backgroundColor, 'Settings phone input')
    expectDarkText(profileState.profileFirstName.color, 'Settings first name text')
    expectAccentText(profileState.profileSubmit.backgroundColor, 'Settings profile submit')

    await page.goto('/admin/settings/account')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await expect(page.locator('.admin-settings-account-form')).toBeVisible()
    await expect(page.locator('.admin-settings-account-email')).toHaveValue(/@/)

    const accountState = await readSettingsProfileAccountVisualState(page)

    expect(accountState.htmlTheme).toBe('light')
    expect(accountState.storedTheme).toBe('light')
    expectSettingsProfileAccountStructure(accountState, 'account')
    expectLightSurface(accountState.accountEmail.backgroundColor, 'Settings account email input')
    expectLightSurface(accountState.accountCurrentPassword.backgroundColor, 'Settings current password input')
    expectLightSurface(accountState.accountNewPassword.backgroundColor, 'Settings new password input')
    expectLightSurface(accountState.accountConfirmPassword.backgroundColor, 'Settings confirm password input')
    expectDarkText(accountState.accountEmail.color, 'Settings account email text')
    expectAccentText(accountState.accountSubmit.backgroundColor, 'Settings account submit')
  })

  test('Admin topbar dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')

    await expect(page.locator('.admin-dashboard-topbar')).toBeVisible()
    await expect(page.locator('.admin-dashboard-topbar-search-input')).toBeVisible()
    await expect(page.locator('.admin-theme-toggle')).toBeVisible()
    await expect(page.locator('[aria-label="Open top account menu"]')).toBeVisible()

    const visualState = await readTopbarVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectTopbarStructure(visualState)
    expect(visualState.themeToggleAriaLabel).toBe('Switch admin dashboard to light mode')
    expect(visualState.themeTogglePressed).toBe('false')
    expect(visualState.activeThemeToggleImageSrc).toContain('/admin/auth_theme_toggle.svg')

    expectDarkSurface(visualState.topbar.backgroundColor, 'Topbar')
    expectDarkSurface(visualState.searchInput.backgroundColor, 'Topbar search input')
    expectDarkSurface(visualState.sidebarTrigger.backgroundColor, 'Topbar sidebar trigger')
    expectLightText(visualState.topbar.color, 'Topbar text')
    expectLightText(visualState.searchInput.color, 'Topbar search input text')
    expectLightText(visualState.searchInputPlaceholder.color, 'Topbar search placeholder')
    expectAccentText(visualState.searchButton.backgroundColor, 'Topbar search button')
    expectDarkText(visualState.searchButton.color, 'Topbar search button icon')
  })

  test('Admin topbar light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')

    await expect(page.locator('.admin-dashboard-topbar')).toBeVisible()
    await expect(page.locator('.admin-dashboard-topbar-search-input')).toBeVisible()
    await expect(page.locator('.admin-theme-toggle')).toBeVisible()
    await expect(page.locator('[aria-label="Open top account menu"]')).toBeVisible()

    const visualState = await readTopbarVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectTopbarStructure(visualState)
    expect(visualState.themeToggleAriaLabel).toBe('Switch admin dashboard to dark mode')
    expect(visualState.themeTogglePressed).toBe('true')
    expect(visualState.activeThemeToggleImageSrc).toContain('/admin/auth_theme_toggle_light.svg')

    expectLightSurface(visualState.topbar.backgroundColor, 'Topbar')
    expectLightSurface(visualState.searchInput.backgroundColor, 'Topbar search input')
    expectLightSurface(visualState.sidebarTrigger.backgroundColor, 'Topbar sidebar trigger')
    expectDarkText(visualState.topbar.color, 'Topbar text')
    expectDarkText(visualState.searchInput.color, 'Topbar search input text')
    expectDarkText(visualState.searchInputPlaceholder.color, 'Topbar search placeholder')
    expectAccentText(visualState.searchButton.backgroundColor, 'Topbar search button')
    expectDarkText(visualState.searchButton.color, 'Topbar search button icon')
  })


  test('Admin account dropdown dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')

    await expect(page.locator('[aria-label="Open top account menu"]')).toBeVisible()
    await openAccountDropdown(page)
    await page.locator('.admin-dashboard-dropdown-content [role="menuitem"]').first().hover()
    await page.waitForTimeout(100)

    const visualState = await readAccountDropdownVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectAccountDropdownStructure(visualState)
    expectDarkSurface(visualState.content.backgroundColor, 'Account dropdown content')
    expectLightText(visualState.content.color, 'Account dropdown content text')
    expectLightText(visualState.label?.color || '', 'Account dropdown label')
    expectLightText(visualState.profileItem?.color || '', 'Profile menu item text')
    expectLightText(visualState.accountItem?.color || '', 'Account menu item text')
    expectAccentSurface(visualState.highlightedItem?.backgroundColor || '', 'Highlighted account dropdown item background')
    expectAccentText(visualState.highlightedItem?.color || '', 'Highlighted account dropdown item text')
  })

  test('Admin account dropdown light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')

    await expect(page.locator('[aria-label="Open top account menu"]')).toBeVisible()
    await openAccountDropdown(page)
    await page.locator('.admin-dashboard-dropdown-content [role="menuitem"]').first().hover()
    await page.waitForTimeout(100)

    const visualState = await readAccountDropdownVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectAccountDropdownStructure(visualState)
    expectLightSurface(visualState.content.backgroundColor, 'Account dropdown content')
    expectDarkText(visualState.content.color, 'Account dropdown content text')
    expectDarkText(visualState.label?.color || '', 'Account dropdown label')
    expectDarkText(visualState.profileItem?.color || '', 'Profile menu item text')
    expectDarkText(visualState.accountItem?.color || '', 'Account menu item text')
    expectAccentSurface(visualState.highlightedItem?.backgroundColor || '', 'Highlighted account dropdown item background')
    expectAccentText(visualState.highlightedItem?.color || '', 'Highlighted account dropdown item text')
  })


  test('Admin route active state check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')

    const cases = [
      {
        path: '/admin/programs/program-1',
        pathname: '/admin/programs/program-1',
        topLabel: 'Programs',
        topKey: 'programs',
        subLabel: 'Library',
        subKey: 'programsLibrary',
        openGroups: ['Programs'],
        inactiveTopKeys: ['dashboard', 'athletes', 'workouts', 'exercises'],
      },
      {
        path: '/admin/athletes/rankings',
        pathname: '/admin/athletes/rankings',
        topLabel: 'Athletes',
        topKey: 'athletes',
        subLabel: 'Rankings',
        subKey: 'rankings',
        openGroups: ['Athletes'],
        inactiveTopKeys: ['dashboard', 'programs', 'workouts', 'exercises'],
      },
      {
        path: '/admin/workouts/calendar?athleteId=athlete-1',
        pathname: '/admin/workouts/calendar',
        topLabel: 'Workouts',
        topKey: 'workouts',
        subLabel: 'Calendar',
        subKey: 'workoutCalendar',
        openGroups: ['Workouts'],
        inactiveTopKeys: ['dashboard', 'athletes', 'programs', 'exercises'],
      },
      {
        path: '/admin/dashboard',
        pathname: '/admin/dashboard',
        topLabel: 'Dashboard',
        topKey: 'dashboard',
        subLabel: null,
        subKey: null,
        openGroups: [],
        inactiveTopKeys: ['athletes', 'programs', 'workouts', 'exercises'],
      },
    ]

    for (const routeCase of cases) {
      await page.goto(routeCase.path)
      await assertCssLoaded(page)
      await forceAdminTheme(page, 'dark')
      await expect(page.locator('.admin-dashboard-sidebar')).toBeVisible()
      await expect(page.locator('.admin-dashboard-sidebar-nav-button').filter({ hasText: routeCase.topLabel })).toHaveAttribute('data-active', 'true')

      const visualState = await readRouteActiveState(page)
      expectActiveRouteState(visualState, routeCase)
    }
  })

  test('Admin no-default-controls check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')

    await expect(page.locator('.admin-dashboard-sidebar')).toBeVisible()
    await expect(page.locator('.admin-dashboard-topbar')).toBeVisible()
    await expect(page.locator('.admin-dashboard-floating-mic-button')).toBeVisible()

    const visualState = await readNoDefaultControlsState(page)
    expectNoDefaultControlsState(visualState)
  })

  test('Admin mobile/tablet width check if supported', async ({ page }) => {
    await authenticateAdminShell(page, 'light')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await expect(page.locator('.admin-dashboard-topbar')).toBeVisible()
    await openMobileSidebar(page)

    const mobileState = await readResponsiveWidthState(page)
    expectResponsiveWidthState(mobileState, { mobile: true })

    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await expect(page.locator('.admin-dashboard-topbar')).toBeVisible()

    const tabletState = await readResponsiveWidthState(page)
    expectResponsiveWidthState(tabletState, { mobile: false })
  })

  test('Dashboard KPI/card/table dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockDashboardOverviewApi(page)
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await page.evaluate(() => {
      window.localStorage?.setItem('pplus-admin-theme', 'dark')
      document.documentElement.dataset.theme = 'dark'
    })

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByLabel('Dashboard summary cards')).toBeVisible()
    await expect(page.getByText('Training execution')).toBeVisible()
    await expect(page.getByText('Workout results', { exact: true })).toBeVisible()
    await expect(page.getByText('Training consistency')).toBeVisible()

    const visualState = await readDashboardSurfaceVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectDashboardSurfaceStructure(visualState)
    expectDarkSurface(visualState.firstSummaryCard.backgroundColor, 'Dashboard KPI card')
    expectDarkSurface(visualState.trainingExecutionCard.backgroundColor, 'Training execution card')
    expectDarkSurface(visualState.workoutResultsCard.backgroundColor, 'Workout results table card')
    expectDarkSurface(visualState.trainingConsistencyCard.backgroundColor, 'Training consistency table card')
    expectLightText(visualState.firstSummaryValue.color, 'Dashboard KPI value')
    expectLightText(visualState.firstSummaryLabel.color, 'Dashboard KPI label')
    expectAccentSurface(visualState.firstBadge?.backgroundColor || '', 'Dashboard KPI badge background')
    expectAccentText(visualState.firstBadge?.color || '', 'Dashboard KPI badge text')
  })

  test('Dashboard KPI/card/table light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockDashboardOverviewApi(page)
    await page.goto('/admin/dashboard')
    await assertCssLoaded(page)
    await page.evaluate(() => {
      window.localStorage?.setItem('pplus-admin-theme', 'light')
      document.documentElement.dataset.theme = 'light'
    })

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByLabel('Dashboard summary cards')).toBeVisible()
    await expect(page.getByText('Training execution')).toBeVisible()
    await expect(page.getByText('Workout results', { exact: true })).toBeVisible()
    await expect(page.getByText('Training consistency')).toBeVisible()

    const visualState = await readDashboardSurfaceVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectDashboardSurfaceStructure(visualState)
    expectLightSurface(visualState.firstSummaryCard.backgroundColor, 'Dashboard KPI card')
    expectLightSurface(visualState.trainingExecutionCard.backgroundColor, 'Training execution card')
    expectLightSurface(visualState.workoutResultsCard.backgroundColor, 'Workout results table card')
    expectLightSurface(visualState.trainingConsistencyCard.backgroundColor, 'Training consistency table card')
    expectDarkText(visualState.firstSummaryValue.color, 'Dashboard KPI value')
    expectDarkText(visualState.firstSummaryLabel.color, 'Dashboard KPI label')
    expectAccentSurface(visualState.firstBadge?.backgroundColor || '', 'Dashboard KPI badge background')
    expectAccentText(visualState.firstBadge?.color || '', 'Dashboard KPI badge text')
  })

  test('Athletes table/filter/dialog dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockAthletesApi(page)
    await page.goto('/admin/athletes')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openAthletesFilterAndCreateSheet(page)

    const visualState = await readAthletesTableFilterDialogVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectAthletesTableFilterDialogStructure(visualState)
    expectDarkSurface(visualState.tableShell.backgroundColor, 'Athletes table shell')
    expectDarkSurface(visualState.headerCell.backgroundColor, 'Athletes table header')
    expectDarkSurface(visualState.firstRow.backgroundColor, 'Athletes first row')
    expectDarkSurface(visualState.filterTrigger.backgroundColor, 'Athletes filter trigger')
    expectDarkSurface(visualState.columnsButton.backgroundColor, 'Athletes columns button')
    expectDarkSurface(visualState.createSheet.backgroundColor, 'Athletes create sheet')
    expectDarkSurface(visualState.firstNameInput.backgroundColor, 'Athletes create input')
    expectDarkSurface(visualState.uploader.backgroundColor, 'Athletes profile uploader')
    expectLightText(visualState.firstNameText.color, 'Athletes table name')
    expectLightText(visualState.createSheet.color, 'Athletes create sheet text')
  })

  test('Athletes table/filter/dialog light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockAthletesApi(page)
    await page.goto('/admin/athletes')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openAthletesFilterAndCreateSheet(page)

    const visualState = await readAthletesTableFilterDialogVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectAthletesTableFilterDialogStructure(visualState)
    expectLightSurface(visualState.tableShell.backgroundColor, 'Athletes table shell')
    expectLightSurface(visualState.headerCell.backgroundColor, 'Athletes table header')
    expectLightSurface(visualState.firstRow.backgroundColor, 'Athletes first row')
    expectLightSurface(visualState.filterTrigger.backgroundColor, 'Athletes filter trigger')
    expectLightSurface(visualState.columnsButton.backgroundColor, 'Athletes columns button')
    expectLightSurface(visualState.createSheet.backgroundColor, 'Athletes create sheet')
    expectLightSurface(visualState.firstNameInput.backgroundColor, 'Athletes create input')
    expectLightSurface(visualState.uploader.backgroundColor, 'Athletes profile uploader')
    expectDarkText(visualState.firstNameText.color, 'Athletes table name')
    expectDarkText(visualState.createSheet.color, 'Athletes create sheet text')
  })

  test('Invites table/dialog dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockInvitesApi(page)
    await page.goto('/admin/athletes/invites')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openInvitesCreateAndCancelDialogs(page)

    const visualState = await readInvitesTableDialogVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectInvitesTableDialogStructure(visualState)
    expectDarkSurface(visualState.tableShell.backgroundColor, 'Invites table shell')
    expectDarkSurface(visualState.headerCell.backgroundColor, 'Invites table header')
    expectDarkSurface(visualState.firstRow.backgroundColor, 'Invites first row')
    expectDarkSurface(visualState.bulkActionsButton.backgroundColor, 'Invites columns button')
    expectDarkSurface(visualState.cancelDialog.backgroundColor, 'Invites cancel dialog')
    expectLightText(visualState.firstNameText.color, 'Invites table name')
    expectLightText(visualState.cancelDialog.color, 'Invites cancel dialog text')
  })



  test('Groups table/dialog dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockGroupsApi(page)
    await page.goto('/admin/athletes/groups')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openGroupsCreateAndDeleteDialogs(page)

    const visualState = await readGroupsTableDialogVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectGroupsTableDialogStructure(visualState)
    expectDarkSurface(visualState.tableShell.backgroundColor, 'Groups table shell')
    expectDarkSurface(visualState.headerCell.backgroundColor, 'Groups table header')
    expectDarkSurface(visualState.firstRow.backgroundColor, 'Groups first row')
    expectAccentSurface(visualState.createButton.backgroundColor, 'Groups create button')
    expectDarkSurface(visualState.deleteDialog.backgroundColor, 'Groups delete dialog')
    expectLightText(visualState.firstNameText.color, 'Groups table name')
    expectLightText(visualState.deleteDialog.color, 'Groups delete dialog text')
  })

  test('Groups table/dialog light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockGroupsApi(page)
    await page.goto('/admin/athletes/groups')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openGroupsCreateAndDeleteDialogs(page)

    const visualState = await readGroupsTableDialogVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectGroupsTableDialogStructure(visualState)
    expectLightSurface(visualState.tableShell.backgroundColor, 'Groups table shell')
    expectLightSurface(visualState.headerCell.backgroundColor, 'Groups table header')
    expectLightSurface(visualState.firstRow.backgroundColor, 'Groups first row')
    expectAccentSurface(visualState.createButton.backgroundColor, 'Groups create button')
    expectLightSurface(visualState.deleteDialog.backgroundColor, 'Groups delete dialog')
    expectDarkText(visualState.firstNameText.color, 'Groups table name')
    expectDarkText(visualState.deleteDialog.color, 'Groups delete dialog text')
  })

  test('Rankings table dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockRankingsApi(page)
    await page.goto('/admin/athletes/rankings')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openRankingsTable(page)

    const visualState = await readRankingsTableVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectRankingsTableStructure(visualState)
    expectDarkSurface(visualState.tableShell.backgroundColor, 'Rankings table shell')
    expectDarkSurface(visualState.headerCell.backgroundColor, 'Rankings table header')
    expectDarkSurface(visualState.firstRow.backgroundColor, 'Rankings first row')
    expectDarkSurface(visualState.columnsButton.backgroundColor, 'Rankings columns button')
    expectLightText(visualState.firstNameText.color, 'Rankings table name')
  })

  test('Rankings table light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockRankingsApi(page)
    await page.goto('/admin/athletes/rankings')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openRankingsTable(page)

    const visualState = await readRankingsTableVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectRankingsTableStructure(visualState)
    expectLightSurface(visualState.tableShell.backgroundColor, 'Rankings table shell')
    expectLightSurface(visualState.headerCell.backgroundColor, 'Rankings table header')
    expectLightSurface(visualState.firstRow.backgroundColor, 'Rankings first row')
    expectLightSurface(visualState.columnsButton.backgroundColor, 'Rankings columns button')
    expectDarkText(visualState.firstNameText.color, 'Rankings table name')
  })

  test('Programs table/sheets/dropdowns dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockProgramsApi(page)
    await page.goto('/admin/programs')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openProgramsCreateSheetExportSheetAndDeleteDialog(page)

    const visualState = await readProgramsTableSheetsDropdownsVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectProgramsTableSheetsDropdownsStructure(visualState)
    expectDarkSurface(visualState.tableShell.backgroundColor, 'Programs table shell')
    expectDarkSurface(visualState.headerCell.backgroundColor, 'Programs table header')
    expectDarkSurface(visualState.firstRow.backgroundColor, 'Programs first row')
    expectDarkSurface(visualState.columnsButton.backgroundColor, 'Programs columns button')
    expectDarkSurface(visualState.createSheet.backgroundColor, 'Programs create sheet')
    expectDarkSurface(visualState.exportSheet.backgroundColor, 'Programs export sheet')
    expectDarkSurface(visualState.deleteDialog.backgroundColor, 'Programs delete dialog')
    expectAccentSurface(visualState.createButton.backgroundColor, 'Programs create button')
    expectLightText(visualState.firstNameText.color, 'Programs table name')
    expectLightText(visualState.createSheet.color, 'Programs create sheet text')
    expectLightText(visualState.deleteDialog.color, 'Programs delete dialog text')
  })

  test('Programs table/sheets/dropdowns light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockProgramsApi(page)
    await page.goto('/admin/programs')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openProgramsCreateSheetExportSheetAndDeleteDialog(page)

    const visualState = await readProgramsTableSheetsDropdownsVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectProgramsTableSheetsDropdownsStructure(visualState)
    expectLightSurface(visualState.tableShell.backgroundColor, 'Programs table shell')
    expectLightSurface(visualState.headerCell.backgroundColor, 'Programs table header')
    expectLightSurface(visualState.firstRow.backgroundColor, 'Programs first row')
    expectLightSurface(visualState.columnsButton.backgroundColor, 'Programs columns button')
    expectLightSurface(visualState.createSheet.backgroundColor, 'Programs create sheet')
    expectLightSurface(visualState.exportSheet.backgroundColor, 'Programs export sheet')
    expectLightSurface(visualState.deleteDialog.backgroundColor, 'Programs delete dialog')
    expectAccentSurface(visualState.createButton.backgroundColor, 'Programs create button')
    expectDarkText(visualState.firstNameText.color, 'Programs table name')
    expectDarkText(visualState.createSheet.color, 'Programs create sheet text')
    expectDarkText(visualState.deleteDialog.color, 'Programs delete dialog text')
  })

  test('Workouts table/sheets/dropdowns dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockWorkoutsApi(page)
    await page.goto('/admin/workouts')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openWorkoutsCreateSheetExportSheetAssignSheetAndDeleteDialog(page)

    const visualState = await readWorkoutsTableSheetsDropdownsVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectWorkoutsTableSheetsDropdownsStructure(visualState)
    expectDarkSurface(visualState.tableShell.backgroundColor, 'Workouts table shell')
    expectDarkSurface(visualState.headerCell.backgroundColor, 'Workouts table header')
    expectDarkSurface(visualState.firstRow.backgroundColor, 'Workouts first row')
    expectDarkSurface(visualState.columnsButton.backgroundColor, 'Workouts columns button')
    expectDarkSurface(visualState.bulkActionsButton.backgroundColor, 'Workouts bulk actions button')
    expectDarkSurface(visualState.createSheet.backgroundColor, 'Workouts create sheet')
    expectDarkSurface(visualState.exportSheet.backgroundColor, 'Workouts export sheet')
    expectDarkSurface(visualState.assignSheet.backgroundColor, 'Workouts assign sheet')
    expectDarkSurface(visualState.assignDropdown.backgroundColor, 'Workouts assign dropdown')
    expectDarkSurface(visualState.deleteDialog.backgroundColor, 'Workouts delete dialog')
    expectAccentSurface(visualState.createButton.backgroundColor, 'Workouts create button')
    expectLightText(visualState.firstNameText.color, 'Workouts table name')
    expectLightText(visualState.createSheet.color, 'Workouts create sheet text')
    expectLightText(visualState.deleteDialog.color, 'Workouts delete dialog text')
  })

  test('Workouts table/sheets/dropdowns light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockWorkoutsApi(page)
    await page.goto('/admin/workouts')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openWorkoutsCreateSheetExportSheetAssignSheetAndDeleteDialog(page)

    const visualState = await readWorkoutsTableSheetsDropdownsVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectWorkoutsTableSheetsDropdownsStructure(visualState)
    expectLightSurface(visualState.tableShell.backgroundColor, 'Workouts table shell')
    expectLightSurface(visualState.headerCell.backgroundColor, 'Workouts table header')
    expectLightSurface(visualState.firstRow.backgroundColor, 'Workouts first row')
    expectLightSurface(visualState.columnsButton.backgroundColor, 'Workouts columns button')
    expectLightSurface(visualState.bulkActionsButton.backgroundColor, 'Workouts bulk actions button')
    expectLightSurface(visualState.createSheet.backgroundColor, 'Workouts create sheet')
    expectLightSurface(visualState.exportSheet.backgroundColor, 'Workouts export sheet')
    expectLightSurface(visualState.assignSheet.backgroundColor, 'Workouts assign sheet')
    expectLightSurface(visualState.assignDropdown.backgroundColor, 'Workouts assign dropdown')
    expectLightSurface(visualState.deleteDialog.backgroundColor, 'Workouts delete dialog')
    expectAccentSurface(visualState.createButton.backgroundColor, 'Workouts create button')
    expectDarkText(visualState.firstNameText.color, 'Workouts table name')
    expectDarkText(visualState.createSheet.color, 'Workouts create sheet text')
    expectDarkText(visualState.deleteDialog.color, 'Workouts delete dialog text')
  })


  test('Exercises table/sheets/media dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockExercisesApi(page)
    await page.goto('/admin/exercises')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openExercisesCreateSheetExportSheetMediaPreviewAndDeleteDialog(page)

    const visualState = await readExercisesTableSheetsMediaVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectExercisesTableSheetsMediaStructure(visualState)
    expectDarkSurface(visualState.tableShell.backgroundColor, 'Exercises table shell')
    expectDarkSurface(visualState.headerCell.backgroundColor, 'Exercises table header')
    expectDarkSurface(visualState.firstRow.backgroundColor, 'Exercises first row')
    expectDarkSurface(visualState.columnsButton.backgroundColor, 'Exercises columns button')
    expectDarkSurface(visualState.bulkActionsButton.backgroundColor, 'Exercises bulk actions button')
    expectDarkSurface(visualState.createSheet.backgroundColor, 'Exercises editor sheet')
    expectDarkSurface(visualState.exportSheet.backgroundColor, 'Exercises export sheet')
    expectDarkSurface(visualState.mediaPreview.backgroundColor, 'Exercises media preview')
    expectDarkSurface(visualState.deleteDialog.backgroundColor, 'Exercises delete dialog')
    expectAccentSurface(visualState.createButton.backgroundColor, 'Exercises create button')
    expectLightText(visualState.firstNameText.color, 'Exercises table name')
    expectLightText(visualState.createSheet.color, 'Exercises editor sheet text')
    expectLightText(visualState.deleteDialog.color, 'Exercises delete dialog text')
  })

  test('Exercises table/sheets/media light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockExercisesApi(page)
    await page.goto('/admin/exercises')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openExercisesCreateSheetExportSheetMediaPreviewAndDeleteDialog(page)

    const visualState = await readExercisesTableSheetsMediaVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectExercisesTableSheetsMediaStructure(visualState)
    expectLightSurface(visualState.tableShell.backgroundColor, 'Exercises table shell')
    expectLightSurface(visualState.headerCell.backgroundColor, 'Exercises table header')
    expectLightSurface(visualState.firstRow.backgroundColor, 'Exercises first row')
    expectLightSurface(visualState.columnsButton.backgroundColor, 'Exercises columns button')
    expectLightSurface(visualState.bulkActionsButton.backgroundColor, 'Exercises bulk actions button')
    expectLightSurface(visualState.createSheet.backgroundColor, 'Exercises editor sheet')
    expectLightSurface(visualState.exportSheet.backgroundColor, 'Exercises export sheet')
    expectLightSurface(visualState.mediaPreview.backgroundColor, 'Exercises media preview')
    expectLightSurface(visualState.deleteDialog.backgroundColor, 'Exercises delete dialog')
    expectAccentSurface(visualState.createButton.backgroundColor, 'Exercises create button')
    expectDarkText(visualState.firstNameText.color, 'Exercises table name')
    expectDarkText(visualState.createSheet.color, 'Exercises editor sheet text')
    expectDarkText(visualState.deleteDialog.color, 'Exercises delete dialog text')
  })

  test('Workout Calendar dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockWorkoutCalendarApi(page)
    await page.goto('/admin/workouts/calendar')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openWorkoutCalendarAddDialog(page)

    const visualState = await readWorkoutCalendarVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectWorkoutCalendarStructure(visualState)
    expectDarkSurface(visualState.monthGrid.backgroundColor, 'Workout Calendar month grid')
    expectDarkSurface(visualState.addDialog.backgroundColor, 'Workout Calendar add dialog')
    expectDarkSurface(visualState.startDateInput.backgroundColor, 'Workout Calendar date input')
    expectLightText(visualState.view.color, 'Workout Calendar view text')
    expectLightText(visualState.addDialog.color, 'Workout Calendar add dialog text')
  })

  test('Workout Calendar light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockWorkoutCalendarApi(page)
    await page.goto('/admin/workouts/calendar')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openWorkoutCalendarAddDialog(page)

    const visualState = await readWorkoutCalendarVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectWorkoutCalendarStructure(visualState)
    expectLightSurface(visualState.monthGrid.backgroundColor, 'Workout Calendar month grid')
    expectLightSurface(visualState.addDialog.backgroundColor, 'Workout Calendar add dialog')
    expectLightSurface(visualState.startDateInput.backgroundColor, 'Workout Calendar date input')
    expectDarkText(visualState.view.color, 'Workout Calendar view text')
    expectDarkText(visualState.addDialog.color, 'Workout Calendar add dialog text')
  })

  test('Program detail/planner dark mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'dark')
    await mockPlannerWorkoutTemplatesApi(page)
    await page.goto('/admin/programs/program-1')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'dark')
    await openProgramPlannerCreateAndWorkoutSheets(page)

    const visualState = await readProgramDetailPlannerVisualState(page)

    expect(visualState.htmlTheme).toBe('dark')
    expect(visualState.storedTheme).toBe('dark')
    expectProgramDetailPlannerStructure(visualState)
    expectLightText(visualState.title.color, 'Program planner title')
    expectLightText(visualState.backButton.color, 'Program planner back button')
    expectDarkSurface(visualState.weekRow.backgroundColor, 'Program planner week row')
    expectDarkSurface(visualState.dayCard.backgroundColor, 'Program planner day card')
    expectDarkSurface(visualState.workoutCard.backgroundColor, 'Program planner workout card')
    expectDarkSurface(visualState.workoutBlock.backgroundColor, 'Program planner workout block')
    expectDarkSurface(visualState.emptyWorkoutCard.backgroundColor, 'Program planner empty workout card')
    expectDarkSurface(visualState.scrollButton.backgroundColor, 'Program planner scroll button')
    expectDarkSurface(visualState.createSheet.backgroundColor, 'Program planner create sheet')
    expectDarkSurface(visualState.workoutSheet.backgroundColor, 'Program planner workout sheet')
    expectDarkSurface(visualState.workoutMenu.backgroundColor, 'Program planner workout menu')
    expectAccentSurface(visualState.addWeekButton.backgroundColor, 'Program planner Add Week button')
    expectLightText(visualState.dayCard.color, 'Program planner day card text')
    expectLightText(visualState.workoutSheet.color, 'Program planner workout sheet text')
  })

  test('Program detail/planner light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockPlannerWorkoutTemplatesApi(page)
    await page.goto('/admin/programs/program-1')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openProgramPlannerCreateAndWorkoutSheets(page)

    const visualState = await readProgramDetailPlannerVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectProgramDetailPlannerStructure(visualState)
    expectDarkText(visualState.title.color, 'Program planner title')
    expectDarkText(visualState.backButton.color, 'Program planner back button')
    expectLightSurface(visualState.weekRow.backgroundColor, 'Program planner week row')
    expectLightSurface(visualState.dayCard.backgroundColor, 'Program planner day card')
    expectLightSurface(visualState.workoutCard.backgroundColor, 'Program planner workout card')
    expectLightSurface(visualState.workoutBlock.backgroundColor, 'Program planner workout block')
    expectLightSurface(visualState.emptyWorkoutCard.backgroundColor, 'Program planner empty workout card')
    expectLightSurface(visualState.scrollButton.backgroundColor, 'Program planner scroll button')
    expectLightSurface(visualState.createSheet.backgroundColor, 'Program planner create sheet')
    expectLightSurface(visualState.workoutSheet.backgroundColor, 'Program planner workout sheet')
    expectLightSurface(visualState.workoutMenu.backgroundColor, 'Program planner workout menu')
    expectAccentSurface(visualState.addWeekButton.backgroundColor, 'Program planner Add Week button')
    expectDarkText(visualState.dayCard.color, 'Program planner day card text')
    expectDarkText(visualState.workoutSheet.color, 'Program planner workout sheet text')
  })

  test('Invites table/dialog light mode check', async ({ page }) => {
    await authenticateAdminShell(page, 'light')
    await mockInvitesApi(page)
    await page.goto('/admin/athletes/invites')
    await assertCssLoaded(page)
    await forceAdminTheme(page, 'light')
    await openInvitesCreateAndCancelDialogs(page)

    const visualState = await readInvitesTableDialogVisualState(page)

    expect(visualState.htmlTheme).toBe('light')
    expect(visualState.storedTheme).toBe('light')
    expectInvitesTableDialogStructure(visualState)
    expectLightSurface(visualState.tableShell.backgroundColor, 'Invites table shell')
    expectLightSurface(visualState.headerCell.backgroundColor, 'Invites table header')
    expectLightSurface(visualState.firstRow.backgroundColor, 'Invites first row')
    expectLightSurface(visualState.bulkActionsButton.backgroundColor, 'Invites columns button')
    expectLightSurface(visualState.cancelDialog.backgroundColor, 'Invites cancel dialog')
    expectDarkText(visualState.firstNameText.color, 'Invites table name')
    expectDarkText(visualState.cancelDialog.color, 'Invites cancel dialog text')
  })
})
