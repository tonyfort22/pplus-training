import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const repoRoot = dirname(fileURLToPath(import.meta.url)).replace(`${sep}tests`, '')
const invitesWorkflowSpecPath = join(repoRoot, 'apps/web/e2e/admin-invites-workflows.spec.js')

test('Admin Invites table has an L6 revoke/cancel test invite confirmation workflow', () => {
  assert.equal(existsSync(invitesWorkflowSpecPath), true)
  const source = readFileSync(invitesWorkflowSpecPath, 'utf8')

  assert.match(source, /ADMIN_INVITES_REVOKE_TEST_INVITE_WORKFLOW_CHECK/)
  assert.match(source, /admin-invites-revoke-test-invite-through-confirmation/)
  assert.match(source, /Revoke\/cancel test invite through confirmation/)
  assert.match(source, /route:\s*'\/admin\/athletes\/invites'/)
  assert.match(source, /revoke-test-invite-submits-mocked-patch-through-confirmation/)
  assert.match(source, /request\.method\(\) === 'PATCH'/)
  assert.match(source, /invite-cancel-fixture/)
  assert.match(source, /Thomas Thibault/)
  assert.match(source, /Keep invite/)
  assert.match(source, /This invite link will be revoked/)
  assert.match(source, /Invite canceled/)
  assert.match(source, /This athlete invitation was revoked\./)
  assert.match(source, /canceledInviteRequests/)
})
