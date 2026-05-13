import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile auth view exposes role tabs without the extra I am a label and keeps the same shell padding as the sign-in tabs', () => {
  const authViewSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/auth-view.js'), 'utf8')

  assert.match(authViewSource, /const \[values, setValues\] = useState\(\{[\s\S]*role: 'athlete'/)
  assert.match(authViewSource, /function AuthRoleButton\({ option, isSelected, onPress, theme }\)/)
  assert.match(authViewSource, /model\.roleOptions\.map\(\(option\) => \(/)
  assert.match(authViewSource, /onPress=\{\(\) => onPress\(option\.id\)\}/)
  assert.match(authViewSource, /handleRoleChange/)
  assert.match(authViewSource, /setValues\(\(current\) => \(\{ \.\.\.current, role: nextRoleId \}\)\)/)
  assert.match(authViewSource, /import \{ getAppTheme \} from '\.\.\/theme\/app-theme\.js'/)
  assert.match(authViewSource, /AppFieldShell/)
  assert.match(authViewSource, /const resolvedTheme = theme \|\| getAppTheme\('dark'\)/)
  assert.match(authViewSource, /theme\.accentText|resolvedTheme\.accentText/)
  assert.match(authViewSource, /theme\.accentSurface|resolvedTheme\.accentSurface/)
  assert.match(authViewSource, /theme\.accentBorder|resolvedTheme\.accentBorder/)
  assert.doesNotMatch(authViewSource, /#34D399|#243041|#111827|text-white|text-slate-400|rgba\(5,46,43/)
  assert.doesNotMatch(authViewSource, />I am a</)
})

test('mobile signup flow sends the selected auth role instead of hardcoding athlete', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /import \{[\s\S]*orchestrateAuthSubmit,[\s\S]*\} from '\.\/src\/auth\/auth-profile-actions\.js';/)
  assert.match(appSource, /async function handleAuthSubmit\(\{ mode, values \}\) \{[\s\S]*await orchestrateAuthSubmit\(\{[\s\S]*mode,[\s\S]*values,[\s\S]*resetPasswordForEmail,[\s\S]*signUpWithPassword,[\s\S]*signInWithPassword,[\s\S]*setAuthErrorMessage,[\s\S]*setAuthNoticeMessage,[\s\S]*setIsAuthSubmitting,[\s\S]*setAuthMode,[\s\S]*\}\);[\s\S]*\}/)
  assert.doesNotMatch(appSource, /async function handleAuthSubmit\(\{ mode, values \}\) \{[\s\S]*metadata: \{[\s\S]*role: 'athlete'/)
})

test('mobile athlete signup passes coach email linkage metadata through the real auth submit seam', () => {
  const actionSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/auth/auth-profile-actions.js'), 'utf8')

  assert.match(actionSource, /await signUpWithPassword\(\{[\s\S]*metadata: \{[\s\S]*first_name: values\.firstName\.trim\(\),[\s\S]*last_name: values\.lastName\.trim\(\),[\s\S]*role: values\.role,[\s\S]*coach_email: values\.role === 'athlete' \? values\.coachEmail\?\.trim\(\) \|\| null : null,[\s\S]*\},[\s\S]*\}\)/)
})
