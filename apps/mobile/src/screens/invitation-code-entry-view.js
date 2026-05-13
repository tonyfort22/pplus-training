import { Modal, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyRound } from 'lucide-react-native'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppFieldShell, AppSheetHeader } from '../ui/primitives.js'

function InvitationCodeEntryViewContent({
  code = '',
  onChangeCode = () => {},
  onContinue = () => {},
  onClose = () => {},
  errorMessage = '',
  isSubmitting = false,
  theme,
}) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const normalizedCode = String(code || '').trim().toUpperCase()
  const isCodeReady = normalizedCode.length === 6

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title="Invitation code" onBack={onClose} />

        <View className="flex-1 justify-center gap-5 pb-8">
          <View className="gap-2">
            <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.textSoft }}>Invitation code</Text>
            <AppFieldShell theme={resolvedTheme} className="h-16 py-0">
              <TextInput
                testID="athlete-invitation-code-input"
                className="px-0 py-0 text-center text-[24px] font-semibold tracking-[8px]"
                style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: resolvedTheme.text }}
                value={normalizedCode}
                onChangeText={(nextValue) => onChangeCode(String(nextValue || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                placeholder="ABC123"
                placeholderTextColor={resolvedTheme.textSoft}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
            </AppFieldShell>
          </View>

          {errorMessage ? (
            <View className="gap-3">
              <Text className="text-center text-[14px] leading-6" style={{ color: resolvedTheme.dangerText }}>{errorMessage}</Text>
            </View>
          ) : null}

          <View className="gap-3">
            <AppButton
              theme={resolvedTheme}
              label={isSubmitting ? 'Checking code...' : 'Continue'}
              onPress={onContinue}
              disabled={!isCodeReady || isSubmitting}
              leftIcon={<KeyRound color={isCodeReady ? resolvedTheme.accentText : resolvedTheme.textSoft} size={18} strokeWidth={2.2} />}
              style={{ minHeight: 56, borderRadius: 999 }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export function InvitationCodeEntryView({ isVisible, code, onChangeCode, onContinue, onClose, errorMessage = '', isSubmitting = false, theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <InvitationCodeEntryViewContent
        code={code}
        onChangeCode={onChangeCode}
        onContinue={onContinue}
        onClose={onClose}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        theme={theme}
      />
    </Modal>
  )
}
