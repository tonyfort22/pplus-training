import { Image, Keyboard, Modal, Platform, ScrollView, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, ChevronRight, Send, UserCircle2 } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppListRow, AppSearchInput, AppSheetHeader } from '../ui/primitives.js'
import { Skeleton } from '../ui/skeleton.js'

const INITIAL_VIEW_SKELETON_DELAY_MS = 1500

function CoachAthleteSkeletonRows({ theme }) {
  return (
    <View>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={`coach-athlete-skeleton-${index + 1}`} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <Skeleton className="h-12 w-12 rounded-full" theme={theme} />
          <View className="ml-3 flex-1 gap-2">
            <Skeleton className="h-5 flex-1 rounded-full" theme={theme} style={{ width: index % 3 === 0 ? '70%' : index % 3 === 1 ? '54%' : '62%' }} />
            <Skeleton className="h-3 rounded-full" theme={theme} style={{ width: index % 2 === 0 ? '46%' : '36%', opacity: 0.72 }} />
          </View>
          <Skeleton className="h-8 w-8 rounded-full" theme={theme} />
        </View>
      ))}
    </View>
  )
}

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
    <AppListRow
      theme={theme}
      title={athlete.displayName}
      onPress={() => onPress?.('coach-athlete-select', { athleteId: athlete.athleteId ?? athlete.id })}
      leading={avatar}
      trailing={trailing}
    />
  )
}

export function CoachAthletesSheetContent({ onClose, athletes = [], selectedAthleteId = null, isLoading = false, onActionTarget, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const [searchValue, setSearchValue] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isInitialSkeletonVisible, setIsInitialSkeletonVisible] = useState(true)

  useEffect(() => {
    const initialSkeletonTimer = setTimeout(() => {
      setIsInitialSkeletonVisible(false)
    }, INITIAL_VIEW_SKELETON_DELAY_MS)

    return () => clearTimeout(initialSkeletonTimer)
  }, [])

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(Math.max(0, event.endCoordinates?.height || 0))
    })
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
      setIsSearchFocused(false)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

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

  const safeBottom = Math.max(insets.bottom, 20)
  const keyboardBottomOffset = Math.max(keyboardHeight - insets.bottom, 0)
  const shouldCompactBottomActions = isSearchFocused || keyboardHeight > 0
  const compactTopTrayPadding = shouldCompactBottomActions ? 10 : 0
  const compactBottomTrayPadding = shouldCompactBottomActions ? 14 : 0
  const bottomControlsHeight = shouldCompactBottomActions ? 98 : 144
  const scrollBottomPadding = bottomControlsHeight + safeBottom + keyboardBottomOffset
  const shouldShowSkeleton = isLoading || isInitialSkeletonVisible

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: safeBottom }}>
        <AppSheetHeader theme={resolvedTheme} title="Athletes" onBack={onClose} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scrollBottomPadding }}>
          <View>
            {shouldShowSkeleton ? (
              <CoachAthleteSkeletonRows theme={resolvedTheme} />
            ) : null}
            {!shouldShowSkeleton ? filteredAthletes.map((athlete) => (
              <CoachAthleteRow
                key={athlete.id}
                athlete={athlete}
                isSelected={selectedAthleteId === (athlete.athleteId ?? athlete.id)}
                onPress={onActionTarget}
                theme={resolvedTheme}
              />
            )) : null}
            {!shouldShowSkeleton && !filteredAthletes.length ? (
              <View className="px-5 py-8">
                <Text className="text-[15px]" style={{ color: resolvedTheme.textSoft }}>No athletes found.</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View className="absolute inset-x-0 gap-3 px-5" style={{ bottom: keyboardBottomOffset, paddingTop: compactTopTrayPadding, paddingBottom: safeBottom + compactBottomTrayPadding, backgroundColor: resolvedTheme.background }}>
          {!shouldCompactBottomActions ? (
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
          ) : null}
          <AppSearchInput
            theme={resolvedTheme}
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Search by name"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export function CoachAthletesSheet({ isVisible, onClose, athletes = [], selectedAthleteId = null, isLoading = false, onActionTarget, theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <CoachAthletesSheetContent onClose={onClose} athletes={athletes} selectedAthleteId={selectedAthleteId} isLoading={isLoading} onActionTarget={onActionTarget} theme={theme} />
    </Modal>
  )
}
