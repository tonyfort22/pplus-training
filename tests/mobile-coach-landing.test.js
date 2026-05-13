import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile coach login landing resets the shell to coach train home and relies on the coach train readiness gate', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /const previousBootstrapStatusRef = useRef\(bootstrapState\.status\);/)
  assert.match(appSource, /useEffect\(\(\) => \{[\s\S]*const previousBootstrapStatus = previousBootstrapStatusRef\.current;[\s\S]*if \(effectiveBootstrapState\.status === 'authenticated_coach' && previousBootstrapStatus !== 'authenticated_coach'\) \{[\s\S]*setActiveTab\('train'\);[\s\S]*\}[\s\S]*previousBootstrapStatusRef\.current = effectiveBootstrapState\.status;[\s\S]*\}, \[effectiveBootstrapState\.status\]\);/)
  assert.match(appSource, /const isCoachTrainHomeReadinessPending = activeTab === 'train'[\s\S]*isCoachBootstrapState[\s\S]*activeCoachAthleteProfile\?\.id[\s\S]*coachTrainBridgeState\.isHydrating/)
  assert.match(appSource, /overrideScreen: [\s\S]*: isCoachBootstrapState && isCoachTrainHomeReadinessPending[\s\S]*\? \{ type: 'loading' \}/)
  assert.match(appSource, /: isCoachBootstrapState[\s\S]*\? coachOverrideScreen/)
  assert.doesNotMatch(appSource, /coachNoWorkoutPlaceholderModel/)
})
