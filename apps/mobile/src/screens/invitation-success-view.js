import { Modal, Text, View } from 'react-native'
import LottieView from 'lottie-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton } from '../ui/primitives.js'

const successCheckAnimation = require('../assets/success-check.json')

function InvitationSuccessViewContent({ onClose = () => {}, theme }) {
  const resolvedTheme = theme || getAppTheme('dark')

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 items-center justify-center px-8">
        <LottieView
          source={successCheckAnimation}
          autoPlay
          loop={false}
          style={{ width: 184, height: 184 }}
        />
        <Text className="mt-6 text-center text-[28px] font-bold" style={{ color: resolvedTheme.text }}>
          The invitation was sent!
        </Text>
        <Text className="mt-3 text-center text-[15px] leading-6" style={{ color: resolvedTheme.textSoft }}>
          Everything is ready for the athlete to check their inbox and join PPLUS.
        </Text>
        <View className="mt-8 w-full">
          <AppButton
            theme={resolvedTheme}
            label="Back to Athletes"
            onPress={onClose}
            style={{
              minHeight: 56,
              borderRadius: 999,
              backgroundColor: resolvedTheme.accentSurface,
              borderColor: resolvedTheme.accentBorder,
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export function InvitationSuccessView({ isVisible, onClose, theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <InvitationSuccessViewContent onClose={onClose} theme={theme} />
    </Modal>
  )
}
