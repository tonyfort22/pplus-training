const SAFE_TEXT_PATTERNS = [
  /\btest\b/i,
  /\bfixture\b/i,
  /\bworkflow\b/i,
  /\.test$/i,
  /\+workflow@/i,
]

function stringifyRecordValue(value) {
  return typeof value === 'string' ? value : ''
}

export function isSafeDestructiveWorkflowRecord(record) {
  if (!record || typeof record !== 'object') return false
  if (record.safeForDestructiveWorkflow === true) return true

  const searchableValues = [
    stringifyRecordValue(record.id),
    stringifyRecordValue(record.name),
    stringifyRecordValue(record.email),
    stringifyRecordValue(record.label),
  ].filter(Boolean)

  return searchableValues.some((value) => SAFE_TEXT_PATTERNS.some((pattern) => pattern.test(value)))
}

export function assertDestructiveWorkflowSafety({
  workflowName,
  apiMocked,
  targetRecords,
  environment = process.env,
} = {}) {
  if (!workflowName) {
    throw new Error('Destructive workflow safety requires a workflowName.')
  }

  if (!Array.isArray(targetRecords) || targetRecords.length === 0) {
    throw new Error(`${workflowName} requires explicit targetRecords before destructive actions can run.`)
  }

  const unsafeTargets = targetRecords.filter((record) => !isSafeDestructiveWorkflowRecord(record))
  if (unsafeTargets.length > 0) {
    throw new Error(
      `Unsafe destructive workflow target in ${workflowName}: ${unsafeTargets
        .map((record) => record?.id ?? record?.name ?? record?.email ?? 'unknown-target')
        .join(', ')}. Destructive workflow tests must target mocked/test/fixture/workflow records only.`,
    )
  }

  if (apiMocked === true) {
    return { mode: 'mocked-test-environment', targetCount: targetRecords.length }
  }

  if (environment.PPLUS_DESTRUCTIVE_WORKFLOW_TEST_ENV !== 'test') {
    throw new Error(
      `${workflowName} requires PPLUS_DESTRUCTIVE_WORKFLOW_TEST_ENV=test before live destructive workflow tests can run.`,
    )
  }

  if (environment.PPLUS_ALLOW_DESTRUCTIVE_WORKFLOW_TESTS !== '1') {
    throw new Error(
      `${workflowName} requires PPLUS_ALLOW_DESTRUCTIVE_WORKFLOW_TESTS=1 before live destructive workflow tests can run.`,
    )
  }

  return { mode: 'live-test-records', targetCount: targetRecords.length }
}
