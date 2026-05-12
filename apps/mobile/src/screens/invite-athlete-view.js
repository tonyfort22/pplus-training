import { Modal, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Send } from 'lucide-react-native'
import { SvgXml } from 'react-native-svg'
import { inviteAthleteIllustrationSvg } from '../assets/invite-athlete-illustration.js'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppSheetHeader } from '../ui/primitives.js'

function InviteAthleteViewContent({ onClose, email = '', onChangeEmail = () => {}, onSendInvitation, isSubmitting = false, errorMessage = '', theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const normalizedEmail = String(email || '').trim()
  const isInviteEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  const sendIconColor = isInviteEmailValid ? resolvedTheme.accentText : resolvedTheme.textSoft

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title="Invite athlete" onBack={onClose} />

        <View className="flex-1 items-center justify-center pb-8 pt-2">
          <View className="w-full items-center">
            <SvgXml xml={inviteAthleteIllustrationSvg} width="278" height="278" />
          </View>

          <View className="mt-8 w-full gap-4">
            <View className="rounded-[24px] px-5 py-4" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
              <TextInput
                testID="invite-athlete-email-input"
                className="text-[16px]"
                style={{ color: resolvedTheme.text, backgroundColor: 'transparent', outlineStyle: 'none' }}
                value={email}
                onChangeText={onChangeEmail}
                placeholder="Enter email"
                placeholderTextColor={resolvedTheme.textSoft}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {errorMessage ? (
              <Text className="px-1 text-[13px]" style={{ color: resolvedTheme.dangerText || '#F87171' }}>
                {errorMessage}
              </Text>
            ) : null}

            <AppButton
              theme={resolvedTheme}
              label={isSubmitting ? 'Sending...' : 'Send invitation'}
              onPress={onSendInvitation}
              disabled={!isInviteEmailValid || isSubmitting}
              leftIcon={<Send color={sendIconColor} size={18} strokeWidth={2.2} />}
              style={{
                minHeight: 56,
                borderRadius: 999,
                backgroundColor: isInviteEmailValid ? resolvedTheme.accentSurface : resolvedTheme.backgroundMuted,
                borderColor: isInviteEmailValid ? resolvedTheme.accentBorder : resolvedTheme.borderStrong,
                shadowColor: resolvedTheme.cardShadow,
                shadowOpacity: isInviteEmailValid ? 0.28 : 0.14,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 10,
              }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export function InviteAthleteView({
  isVisible,
  onClose,
  email = '',
  onChangeEmail = () => {},
  onSendInvitation,
  isSubmitting = false,
  errorMessage = '',
  theme,
}) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <InviteAthleteViewContent
        onClose={onClose}
        email={email}
        onChangeEmail={onChangeEmail}
        onSendInvitation={onSendInvitation}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        theme={theme}
      />
    </Modal>
  )
}
