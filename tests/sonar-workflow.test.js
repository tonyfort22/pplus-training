import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('sonar workflow defaults to a successful skip unless CI sonar is explicitly enabled', () => {
  const workflowSource = readFileSync(resolve(process.cwd(), '.github/workflows/sonar.yml'), 'utf8')

  assert.match(workflowSource, /SONAR_CI_ENABLED:/)
  assert.match(workflowSource, /vars\.SONAR_CI_ENABLED/)
  assert.match(workflowSource, /Skip SonarQube Cloud scan when CI sonar is disabled or token is not configured/)
  assert.match(workflowSource, /if: env\.SONAR_CI_ENABLED != 'true' \|\| env\.SONAR_TOKEN == ''/)
  assert.match(workflowSource, /Run SonarQube Cloud scan/)
  assert.match(workflowSource, /if: env\.SONAR_CI_ENABLED == 'true' && env\.SONAR_TOKEN != ''/)
})
