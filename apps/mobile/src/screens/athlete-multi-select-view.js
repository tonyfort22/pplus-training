import { useEffect, useState } from 'react'
import { Image, Keyboard, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Info, UserCircle2 } from 'lucide-react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppSearchInput, AppSelectionIndicator, AppSheetHeader } from '../ui/primitives.js'

export function AthleteSelectionRow({ theme, athlete, selected = false, onPress = null, rightAction = null, onRightActionPress = null }) {
  const Wrapper = onPress ? Pressable : View
  const trailingAction = rightAction || (
    selected ? (
      <AppSelectionIndicator theme={theme} selected />
    ) : (
      <View className="h-8 w-8 items-center justify-center rounded-full" style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surfaceMuted }}>
        <Info color={theme.iconMuted} size={15} strokeWidth={2.4} />
      </View>
    )
  )

  return (
    <Wrapper
      className="flex-row items-center py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}
      onPress={onPress}
    >
      <View className="mr-3 h-12 w-12 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: theme.surfaceMuted }}>
        {athlete.thumbnailUrl ? (
          <Image source={{ uri: athlete.thumbnailUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <UserCircle2 color={theme.iconMuted} size={34} strokeWidth={1.8} />
        )}
      </View>
      <Text className="flex-1 text-[17px]" style={{ color: theme.text }}>{athlete.name}</Text>
      {rightAction ? (
        <Pressable className="h-8 w-8 items-center justify-center rounded-full" onPress={onRightActionPress}>
          {rightAction}
        </Pressable>
      ) : trailingAction}
    </Wrapper>
  )
}

function AthleteMultiSelectContent({ theme, sheet, selectedAthleteIds, onToggleAthlete, searchQuery, onSearchChange, onAddAthletes, onClose }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

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

  const filteredAthletes = (sheet?.athletes || []).filter((athlete) => {
    const query = String(searchQuery || '').trim().toLowerCase()
    if (!query) return true
    return String(athlete.name || '').toLowerCase().includes(query)
  })
  const safeBottom = Math.max(insets.bottom, 20)
  const keyboardBottomOffset = Math.max(keyboardHeight - insets.bottom, 0)
  const bottomControlsHeight = isSearchFocused || keyboardHeight > 0 ? 86 : 96
  const scrollBottomPadding = bottomControlsHeight + safeBottom + keyboardBottomOffset

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={sheet.title} onBack={onClose} rightAction={<View className="w-11" />} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scrollBottomPadding }}>
          <View>
            {filteredAthletes.map((athlete) => (
              <AthleteSelectionRow
                key={athlete.id}
                theme={resolvedTheme}
                athlete={athlete}
                selected={selectedAthleteIds.includes(athlete.id)}
                onPress={() => onToggleAthlete?.(athlete.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
      <View className="absolute inset-x-0 px-5" style={{ bottom: keyboardBottomOffset, paddingBottom: safeBottom, backgroundColor: resolvedTheme.background }}>
        <View className="flex-row items-center gap-3 py-3" style={{ borderTopWidth: 1, borderTopColor: resolvedTheme.border }}>
          <View className="flex-1">
            <AppSearchInput
              theme={resolvedTheme}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder={sheet.searchPlaceholder}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>
          <AppButton theme={resolvedTheme} label={`${sheet.addButtonLabel} ${selectedAthleteIds.length}`} onPress={onAddAthletes} disabled={selectedAthleteIds.length === 0} />
        </View>
      </View>
    </SafeAreaView>
  )
}

export function AthleteMultiSelectView({ isVisible, theme, sheet, selectedAthleteIds = [], onToggleAthlete, searchQuery = '', onSearchChange, onAddAthletes, onClose, presentation = 'modal' }) {
  if (!sheet || !isVisible) return null

  if (presentation === 'inline') {
    return (
      <AthleteMultiSelectContent
        theme={theme}
        sheet={sheet}
        selectedAthleteIds={selectedAthleteIds}
        onToggleAthlete={onToggleAthlete}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onAddAthletes={onAddAthletes}
        onClose={onClose}
      />
    )
  }

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <AthleteMultiSelectContent
          theme={theme}
          sheet={sheet}
          selectedAthleteIds={selectedAthleteIds}
          onToggleAthlete={onToggleAthlete}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onAddAthletes={onAddAthletes}
          onClose={onClose}
        />
      </SafeAreaProvider>
    </Modal>
  )
}
