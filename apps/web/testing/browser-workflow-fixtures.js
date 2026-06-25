import { createAdminTestRecordCleanup } from '../lib/admin-test-record-cleanup.js'

const REQUIRED_SUPABASE_ENV = Object.freeze([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
])

function hasSupabaseCleanupCredentials(env = process.env) {
  return REQUIRED_SUPABASE_ENV.every((name) => Boolean(String(env[name] ?? '').trim()))
}

function summarizeCleanupResult(result) {
  return Object.fromEntries(
    Object.entries(result ?? {}).map(([key, value]) => [
      key,
      {
        deletedCount: Number(value?.deletedCount ?? 0),
      },
    ]),
  )
}

async function runCleanupIfConfigured({ phase, env = process.env } = {}) {
  if (!hasSupabaseCleanupCredentials(env)) {
    const skippedMessage = phase === 'setup'
      ? 'browser workflow fixture setup skipped: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured.'
      : 'browser workflow fixture teardown skipped: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured.'
    console.log(skippedMessage)
    return { skipped: true, phase }
  }

  const cleanup = createAdminTestRecordCleanup()
  const cleanupResult = await cleanup.cleanupKnownTestRecords()
  const summary = summarizeCleanupResult(cleanupResult)
  console.log(`browser workflow fixture ${phase} cleanup complete: ${JSON.stringify(summary)}`)
  return { skipped: false, phase, cleanupResult }
}

export async function runBrowserWorkflowFixtureSetup(options = {}) {
  return runCleanupIfConfigured({ ...options, phase: 'setup' })
}

export async function runBrowserWorkflowFixtureTeardown(options = {}) {
  return runCleanupIfConfigured({ ...options, phase: 'teardown' })
}

async function main() {
  const command = process.argv[2]

  if (command === 'setup') {
    await runBrowserWorkflowFixtureSetup()
    return
  }

  if (command === 'teardown') {
    await runBrowserWorkflowFixtureTeardown()
    return
  }

  console.error('Usage: node apps/web/testing/browser-workflow-fixtures.js <setup|teardown>')
  process.exitCode = 2
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error?.message ?? error)
    process.exitCode = 1
  })
}
