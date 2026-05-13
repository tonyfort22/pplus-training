import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile athlete invitation flow owns a dedicated invite view, real backend send seam, success view, and explicit return to the Athletes sheet', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const inviteViewSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/invite-athlete-view.js'), 'utf8')
  const successViewSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/invitation-success-view.js'), 'utf8')
  const runtimeSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/athlete-invitation-runtime.js'), 'utf8')
  const mobilePackageSource = readFileSync(resolve(process.cwd(), 'apps/mobile/package.json'), 'utf8')

  assert.match(appSource, /import \{ InviteAthleteView \} from '\.\/src\/screens\/invite-athlete-view\.js';/)
  assert.match(appSource, /import \{ InvitationSuccessView \} from '\.\/src\/screens\/invitation-success-view\.js';/)
  assert.match(appSource, /import \{ createMobileInvitationClient, sendCoachAthleteInvitation \} from '\.\/src\/train\/athlete-invitation-runtime\.js';/)
  assert.match(appSource, /const \[isInviteAthleteViewOpen, setIsInviteAthleteViewOpen\] = useState\(false\);/)
  assert.match(appSource, /const \[isInvitationSuccessViewOpen, setIsInvitationSuccessViewOpen\] = useState\(false\);/)
  assert.match(appSource, /const \[inviteAthleteEmail, setInviteAthleteEmail\] = useState\(''\);/)
  assert.match(appSource, /const \[isSendingAthleteInvitation, setIsSendingAthleteInvitation\] = useState\(false\);/)
  assert.match(appSource, /const \[athleteInvitationErrorMessage, setAthleteInvitationErrorMessage\] = useState\(''\);/)
  assert.match(appSource, /if \(targetKey === 'coach-athlete-invite'\) \{[\s\S]*setIsCoachAthletesSheetOpen\(false\);[\s\S]*setIsInviteAthleteViewOpen\(true\);[\s\S]*setInviteAthleteEmail\(''\);[\s\S]*setAthleteInvitationErrorMessage\(''\);[\s\S]*return;[\s\S]*\}/)
  assert.match(appSource, /function handleCloseInviteAthleteView\(\) \{[\s\S]*setIsInviteAthleteViewOpen\(false\);[\s\S]*setAthleteInvitationErrorMessage\(''\);[\s\S]*setIsCoachAthletesSheetOpen\(true\);[\s\S]*\}/)
  assert.match(appSource, /const invitationClient = useMemo\(\(\) => createMobileInvitationClient\(\{ accessToken: authSession\.accessToken \}\), \[authSession\.accessToken\]\);/)
  assert.match(appSource, /async function handleSendAthleteInvitation\(\) \{[\s\S]*setIsSendingAthleteInvitation\(true\);[\s\S]*setAthleteInvitationErrorMessage\(''\);[\s\S]*await sendCoachAthleteInvitation\(\{[\s\S]*invitationClient,[\s\S]*inviteeEmail: inviteAthleteEmail,[\s\S]*coachProfile: effectiveBootstrapState\.coachProfile,[\s\S]*appStoreUrl: process\.env\.EXPO_PUBLIC_PPLUS_APP_STORE_URL \|\| '',[\s\S]*\}\);[\s\S]*setIsInviteAthleteViewOpen\(false\);[\s\S]*setIsInvitationSuccessViewOpen\(true\);[\s\S]*\} catch \(error\) \{[\s\S]*setAthleteInvitationErrorMessage\(error\?\.message \|\| 'Something went sideways while sending the athlete invitation\.'\);[\s\S]*\} finally \{[\s\S]*setIsSendingAthleteInvitation\(false\);[\s\S]*\}[\s\S]*\}/)
  assert.match(appSource, /function handleCloseInvitationSuccessView\(\) \{[\s\S]*setIsInvitationSuccessViewOpen\(false\);[\s\S]*setIsCoachAthletesSheetOpen\(true\);[\s\S]*\}/)
  assert.match(appSource, /<InviteAthleteView[\s\S]*isVisible=\{isInviteAthleteViewOpen\}[\s\S]*email=\{inviteAthleteEmail\}[\s\S]*onChangeEmail=\{setInviteAthleteEmail\}[\s\S]*onClose=\{handleCloseInviteAthleteView\}[\s\S]*onSendInvitation=\{handleSendAthleteInvitation\}[\s\S]*isSubmitting=\{isSendingAthleteInvitation\}[\s\S]*errorMessage=\{athleteInvitationErrorMessage\}[\s\S]*theme=\{appTheme\}/)
  assert.match(appSource, /<InvitationSuccessView[\s\S]*isVisible=\{isInvitationSuccessViewOpen\}[\s\S]*onClose=\{handleCloseInvitationSuccessView\}[\s\S]*theme=\{appTheme\}/)

  assert.match(runtimeSource, /createMobileInvitationClient/)
  assert.match(runtimeSource, /sendCoachAthleteInvitation/)
  assert.match(runtimeSource, /createSupabaseEdgeInvitationClient/)

  assert.match(inviteViewSource, /SvgXml/)
  assert.match(inviteViewSource, /AppButton/)
  assert.match(inviteViewSource, /AppSheetHeader/)
  assert.match(inviteViewSource, /TextInput/)
  assert.match(inviteViewSource, /testID="invite-athlete-email-input"/)
  assert.match(inviteViewSource, /title="Invite athlete"/)
  assert.match(inviteViewSource, /placeholder="Enter email"/)
  assert.match(inviteViewSource, /const normalizedEmail = String\(email \|\| ''\)\.trim\(\)/)
  assert.match(inviteViewSource, /const isInviteEmailValid = \/\^\[\^\\s@\]\+@\[\^\\s@\]\+\\\.\[\^\\s@\]\+\$\/\.test\(normalizedEmail\)/)
  assert.match(inviteViewSource, /disabled=\{!isInviteEmailValid \|\| isSubmitting\}/)
  assert.match(inviteViewSource, /label=\{isSubmitting \? 'Sending\.\.\.' : 'Send invitation'\}/)
  assert.match(inviteViewSource, /errorMessage \? \(/)

  assert.match(successViewSource, /LottieView/)
  assert.match(successViewSource, /successCheckAnimation/)
  assert.match(successViewSource, /require\('\.\.\/assets\/success-check\.json'\)/)
  assert.match(successViewSource, /The invitation was sent!/)
  assert.match(successViewSource, /Everything is ready for the athlete to check their inbox and join PPLUS\./)
  assert.match(successViewSource, /label="Back to Athletes"/)
  assert.match(successViewSource, /onPress=\{onClose\}/)
  assert.match(successViewSource, /animationType="slide"/)
  assert.match(successViewSource, /autoPlay/)
  assert.match(successViewSource, /loop=\{false\}/)
  assert.match(successViewSource, /backgroundColor: resolvedTheme\.background/)

  assert.match(mobilePackageSource, /"lottie-react-native":/)
})
