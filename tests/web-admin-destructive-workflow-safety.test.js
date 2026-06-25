import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import {
  assertDestructiveWorkflowSafety,
  isSafeDestructiveWorkflowRecord,
} from '../apps/web/e2e/destructive-workflow-safety.js'

const destructiveWorkflowSpecs = [
  {
    file: 'apps/web/e2e/admin-programs-workflows.spec.js',
    call: /assertDestructiveWorkflowSafety\(\{[\s\S]*workflowName:\s*'Admin Programs archive\/delete workflow'[\s\S]*targetRecords:/,
  },
  {
    file: 'apps/web/e2e/admin-workouts-workflows.spec.js',
    call: /assertDestructiveWorkflowSafety\(\{[\s\S]*workflowName:\s*'Admin Workouts archive\/delete workflow'[\s\S]*targetRecords:/,
  },
  {
    file: 'apps/web/e2e/admin-exercises-workflows.spec.js',
    call: /assertDestructiveWorkflowSafety\(\{[\s\S]*workflowName:\s*'Admin Exercises archive\/delete workflow'[\s\S]*targetRecords:/,
  },
  {
    file: 'apps/web/e2e/admin-groups-workflows.spec.js',
    call: /assertDestructiveWorkflowSafety\(\{[\s\S]*workflowName:\s*'Admin Groups delete workflow'[\s\S]*targetRecords:/,
  },
  {
    file: 'apps/web/e2e/admin-invites-workflows.spec.js',
    call: /assertDestructiveWorkflowSafety\(\{[\s\S]*workflowName:\s*'Admin Invites cancel workflow'[\s\S]*targetRecords:/,
  },
]

test('destructive workflow safety helper allows mocked test fixtures and rejects live non-test records', () => {
  assert.equal(isSafeDestructiveWorkflowRecord({ id: 'program-delete-fixture', name: 'Test Deletable Program' }), true)
  assert.equal(isSafeDestructiveWorkflowRecord({ id: 'group-created-fixture', name: 'Updated Workflow Group' }), true)
  assert.equal(isSafeDestructiveWorkflowRecord({ id: 'invite-cancel-fixture', email: 'thomas.cancel.workflow@example.com' }), true)
  assert.equal(isSafeDestructiveWorkflowRecord({ id: 'program-1', name: 'Summer strength block' }), false)

  assert.deepEqual(
    assertDestructiveWorkflowSafety({
      workflowName: 'unit mocked workflow',
      apiMocked: true,
      targetRecords: [{ id: 'program-delete-fixture', name: 'Test Deletable Program' }],
      environment: {},
    }),
    { mode: 'mocked-test-environment', targetCount: 1 },
  )

  assert.throws(
    () => assertDestructiveWorkflowSafety({
      workflowName: 'unsafe workflow',
      apiMocked: true,
      targetRecords: [{ id: 'program-1', name: 'Summer strength block' }],
      environment: {},
    }),
    /Unsafe destructive workflow target/,
  )

  assert.throws(
    () => assertDestructiveWorkflowSafety({
      workflowName: 'live workflow without test env',
      apiMocked: false,
      targetRecords: [{ id: 'program-delete-fixture', name: 'Test Deletable Program' }],
      environment: {},
    }),
    /requires PPLUS_DESTRUCTIVE_WORKFLOW_TEST_ENV=test/,
  )
})

test('destructive browser workflow specs declare the safety gate before mutation assertions', () => {
  for (const { file, call } of destructiveWorkflowSpecs) {
    const source = readFileSync(file, 'utf8')
    assert.match(source, /from '\.\/destructive-workflow-safety\.js'/, `${file} should import destructive workflow safety helper`)
    assert.match(source, call, `${file} should declare target records for destructive workflow safety`)
  }
})
