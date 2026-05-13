import { Image, Modal, ScrollView, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, ChevronRight, Send, UserCircle2 } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppListRow, AppSearchInput, AppSheetHeader } from '../ui/primitives.js'

function CoachAthleteRow({ athlete, isSelected = false, onPress, theme }) {
  const avatar = (
    <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: theme.surfaceMuted }}>
      {athlete.avatarUrl ? (
        <Image source={{ uri: athlete.avatarUrl }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <UserCircle2 color={theme.iconMuted} size={34} strokeWidth={1.8} />
      )}
    </View>
  )

  const trailing = isSelected
    ? <Check color={theme.accent} size={20} strokeWidth={2.6} />
    : <ChevronRight color={theme.iconMuted} size={20} strokeWidth={2.2} />

  return (
    <View className="px-5">
      <AppListRow
        theme={theme}
        title={athlete.displayName}
        onPress={() => onPress?.('coach-athlete-select', { athleteId: athlete.athleteId ?? athlete.id })}
        leading={avatar}
        trailing={trailing}
      />
    </View>
  )
}

function CoachAthletesSheetContent({ onClose, athletes = [], selectedAthleteId = null, onActionTarget, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const [searchValue, setSearchValue] = useState('')

  const filteredAthletes = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase()
    if (!normalizedSearchValue) {
      return athletes
    }

    return athletes.filter((athlete) => {
      const fullName = [athlete.firstName, athlete.lastName].filter(Boolean).join(' ').toLowerCase()
      const displayName = String(athlete.displayName || '').toLowerCase()
      return fullName.includes(normalizedSearchValue) || displayName.includes(normalizedSearchValue)
    })
  }, [athletes, searchValue])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title="Athletes" onBack={onClose} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 188 }}>
          <View>
            {filteredAthletes.map((athlete) => (
              <CoachAthleteRow
                key={athlete.id}
                athlete={athlete}
                isSelected={selectedAthleteId === (athlete.athleteId ?? athlete.id)}
                onPress={onActionTarget}
                theme={resolvedTheme}
              />
            ))}
            {!filteredAthletes.length ? (
              <View className="px-5 py-8">
                <Text className="text-[15px]" style={{ color: resolvedTheme.textSoft }}>No athletes found.</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0 gap-3 px-5" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
          <AppButton
            theme={resolvedTheme}
            label="Invite athlete"
            onPress={() => onActionTarget?.('coach-athlete-invite')}
            leftIcon={<Send color={resolvedTheme.accentText} size={18} strokeWidth={2.2} />}
            style={{
              minHeight: 56,
              borderRadius: 999,
              backgroundColor: resolvedTheme.accentSurface,
              borderColor: resolvedTheme.accentBorder,
            }}
          />
          <AppSearchInput
            theme={resolvedTheme}
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Search by name"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export function CoachAthletesSheet({ isVisible, onClose, athletes = [], selectedAthleteId = null, onActionTarget, theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <CoachAthletesSheetContent onClose={onClose} athletes={athletes} selectedAthleteId={selectedAthleteId} onActionTarget={onActionTarget} theme={theme} />
    </Modal>
  )
}
