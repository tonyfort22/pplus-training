import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'

export const ADMIN_DASHBOARD_SEEDED_DATA_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-dashboard-seeded-data-loads',
  route: '/admin/dashboard',
  interaction: 'dashboard-loads-with-seeded-data',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_DASHBOARD_KPI_FIXTURE_CHANGES_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-dashboard-kpi-cards-reflect-fixture-changes',
  route: '/admin/dashboard',
  interaction: 'kpi-cards-reflect-fixture-changes-honestly',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const seededDashboardOverview = Object.freeze({
  rangeLabel: 'Last month',
  generatedAt: '2026-05-30T16:00:00.000Z',
  summary: {
    athletes: {
      id: 'athletes',
      label: 'Athletes',
      value: '4',
      change: '50% active',
      changeDirection: 'positive',
      footerHeadline: 'Total athletes',
      footerSubtext: '2 active athletes',
    },
    programs: {
      id: 'programs',
      label: 'Programs',
      value: '2',
      change: '100% assigned',
      changeDirection: 'positive',
      footerHeadline: 'Total programs',
      footerSubtext: '2 of 2 assigned programs',
    },
    workouts: {
      id: 'workouts',
      label: 'Workouts',
      value: '3',
      change: '67% assigned',
      changeDirection: 'positive',
      footerHeadline: 'Total workouts',
      footerSubtext: '2 of 3 assigned workouts',
    },
    exercises: {
      id: 'exercises',
      label: 'Exercises',
      value: '4',
      change: '50% used',
      changeDirection: 'positive',
      footerHeadline: 'Total exercises',
      footerSubtext: '2 of 4 used in workouts',
    },
    invites: {
      id: 'invites',
      label: 'Invites',
      value: '3',
      change: '67% accepted',
      changeDirection: 'positive',
      footerHeadline: 'Total athlete invites',
      footerSubtext: '2 of 3 accepted invites',
    },
  },
  trainingExecution: {
    trend: '67% completed',
    trendDirection: 'positive',
    footer: '2 of 3 due workouts completed',
    buckets: [
      { label: 'May 10', assigned: 2, completed: 1, missed: 0 },
      { label: 'May 17', assigned: 1, completed: 1, missed: 0 },
      { label: 'May 24', assigned: 1, completed: 0, missed: 1 },
    ],
  },
  workoutResults: {
    categoryOptions: ['Speed', 'Strength'],
    buckets: [
      { category: 'Speed', workoutName: 'Speed Accelerator', assigned: 2, completed: 1, missed: 1 },
      { category: 'Strength', workoutName: 'Strength Foundation', assigned: 1, completed: 1, missed: 0 },
    ],
  },
  trainingConsistency: {
    heatmapReady: true,
    dailyActivity: [
      { date: '2026-05-10', activeAthletes: 2 },
      { date: '2026-05-17', activeAthletes: 1 },
    ],
    footer: '2 active athletes trained this month',
  },
})

const changedKpiDashboardOverview = Object.freeze({
  ...seededDashboardOverview,
  summary: {
    athletes: {
      id: 'athletes',
      label: 'Athletes',
      value: '9',
      change: '22% active',
      changeDirection: 'neutral',
      footerHeadline: '9 active athletes',
    },
    programs: {
      id: 'programs',
      label: 'Programs',
      value: '5',
      change: '40% assigned',
      changeDirection: 'negative',
      footerHeadline: '5 of 5 assigned programs',
    },
    workouts: {
      id: 'workouts',
      label: 'Workouts',
      value: '7',
      change: '14% assigned',
      changeDirection: 'negative',
      footerHeadline: '7 total workout templates',
    },
    exercises: {
      id: 'exercises',
      label: 'Exercises',
      value: '11',
      change: '73% used',
      changeDirection: 'positive',
      footerHeadline: '11 exercise library records',
    },
    invites: {
      id: 'invites',
      label: 'Invites',
      value: '8',
      change: '25% accepted',
      changeDirection: 'negative',
      footerHeadline: '8 athlete invites',
    },
  },
})

async function expectKpiCards(summaryCards, expectedCards) {
  await expect(summaryCards).toBeVisible()
  for (const card of expectedCards) {
    await expect(summaryCards.getByText(card.label, { exact: true })).toBeVisible()
    await expect(summaryCards.getByText(card.value, { exact: true })).toBeVisible()
    await expect(summaryCards.getByText(card.change)).toBeVisible()
    await expect(summaryCards.getByText(card.footerHeadline)).toBeVisible()
  }
}

async function seedAdminBrowserSession(page) {
  const cookieUrl = resolveWebBaseUrl()
  await page.context().addCookies([
    {
      name: 'pplus_admin_access_token',
      value: 'browser-smoke-access-token',
      url: cookieUrl,
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'pplus_admin_refresh_token',
      value: 'browser-smoke-refresh-token',
      url: cookieUrl,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

test.describe('Admin dashboard workflows', () => {
  test('Dashboard loads with seeded data', async ({ page }) => {
    const dashboardOverviewRequests = []

    await seedAdminBrowserSession(page)
    await page.route('**/api/admin/dashboard/overview?**', async (route) => {
      dashboardOverviewRequests.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ overview: seededDashboardOverview }),
      })
    })

    await page.goto(ADMIN_DASHBOARD_SEEDED_DATA_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_DASHBOARD_SEEDED_DATA_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.locator('.admin-shell-overview')).toBeVisible()
    const summaryCards = page.getByLabel('Dashboard summary cards')
    await expect(summaryCards).toBeVisible()
    await expect(summaryCards.getByText('Athletes', { exact: true })).toBeVisible()
    await expect(summaryCards.getByText('Total athletes')).toBeVisible()
    await expect(summaryCards.getByText('50% active')).toBeVisible()
    await expect(summaryCards.getByText('Programs', { exact: true })).toBeVisible()
    await expect(summaryCards.getByText('100% assigned')).toBeVisible()
    await expect(summaryCards.getByText('Workouts', { exact: true })).toBeVisible()
    await expect(summaryCards.getByText('67% assigned')).toBeVisible()
    await expect(summaryCards.getByText('Exercises', { exact: true })).toBeVisible()
    await expect(summaryCards.getByText('50% used')).toBeVisible()
    await expect(summaryCards.getByText('Invites', { exact: true })).toBeVisible()
    await expect(summaryCards.getByText('67% accepted')).toBeVisible()

    await expect(page.getByText('Training execution', { exact: true })).toBeVisible()
    await expect(page.getByText('67% completed')).toBeVisible()
    await expect(page.getByText('2 of 3 due workouts completed')).toBeVisible()
    await expect(page.getByText('Workout results', { exact: true })).toBeVisible()
    await expect(page.getByText('Showing all Speed workout results')).toBeVisible()
    await expect(page.getByText('Training consistency', { exact: true })).toBeVisible()
    await expect(page.getByText('2 active athletes trained this month')).toBeVisible()
    await expect(page.getByText('No dashboard data yet')).toHaveCount(0)
    await expect(page.getByText('Dashboard overview error')).toHaveCount(0)
    expect(dashboardOverviewRequests.length).toBeGreaterThanOrEqual(1)
    expect(dashboardOverviewRequests[0]).toContain('range=last-month')
  })

  test('KPI cards reflect fixture changes honestly', async ({ page }) => {
    const dashboardOverviewRequests = []

    await seedAdminBrowserSession(page)
    await page.route('**/api/admin/dashboard/overview?**', async (route) => {
      dashboardOverviewRequests.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ overview: changedKpiDashboardOverview }),
      })
    })

    await page.goto(ADMIN_DASHBOARD_KPI_FIXTURE_CHANGES_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_DASHBOARD_KPI_FIXTURE_CHANGES_WORKFLOW_CHECK.route })

    const summaryCards = page.getByLabel('Dashboard summary cards')
    await expectKpiCards(summaryCards, [
      { label: 'Athletes', value: '9', change: '22% active', footerHeadline: '9 active athletes' },
      { label: 'Programs', value: '5', change: '40% assigned', footerHeadline: '5 of 5 assigned programs' },
      { label: 'Workouts', value: '7', change: '14% assigned', footerHeadline: '7 total workout templates' },
      { label: 'Exercises', value: '11', change: '73% used', footerHeadline: '11 exercise library records' },
      { label: 'Invites', value: '8', change: '25% accepted', footerHeadline: '8 athlete invites' },
    ])
    await expect(summaryCards.getByText('50% active')).toHaveCount(0)
    await expect(summaryCards.getByText('100% assigned')).toHaveCount(0)
    await expect(summaryCards.getByText('67% accepted')).toHaveCount(0)
    await expect(page.getByText('No dashboard data yet')).toHaveCount(0)
    await expect(page.getByText('Dashboard overview error')).toHaveCount(0)
    expect(dashboardOverviewRequests.length).toBeGreaterThanOrEqual(1)
    expect(dashboardOverviewRequests[0]).toContain('range=last-month')
  })
})
