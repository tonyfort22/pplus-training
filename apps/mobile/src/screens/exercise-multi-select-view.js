import { useEffect, useState } from 'react'
import { Image, Keyboard, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Dumbbell, Info } from 'lucide-react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppSearchInput, AppSelectionIndicator, AppSheetHeader } from '../ui/primitives.js'

function ExerciseMultiSelectContent({ theme, sheet, selectedExerciseIds, onToggleExercise, searchQuery, onSearchChange, onAddExercises, onClose }) {
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

  const filteredExercises = (sheet?.exercises || []).filter((exercise) => {
    const query = String(searchQuery || '').trim().toLowerCase()
    if (!query) return true
    return String(exercise.name || '').toLowerCase().includes(query)
  })
  const safeBottom = Math.max(insets.bottom, 20)
  const keyboardBottomOffset = Math.max(keyboardHeight - insets.bottom, 0)
  const bottomControlsHeight = isSearchFocused || keyboardHeight > 0 ? 86 : 96
  const scrollBottomPadding = bottomControlsHeight + safeBottom + keyboardBottomOffset
  const canSubmitEmptySelection = Boolean(sheet?.allowEmptySelection)
  const actionLabel = selectedExerciseIds.length > 0
    ? `${sheet.addButtonLabel} ${selectedExerciseIds.length}`
    : (sheet.emptySelectionLabel || `${sheet.addButtonLabel} ${selectedExerciseIds.length}`)

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: safeBottom }}>
        <AppSheetHeader theme={resolvedTheme} title={sheet.title} onBack={onClose} rightAction={<View className="w-11" />} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scrollBottomPadding }}>
          <View>
            {filteredExercises.map((exercise) => (
              <Pressable
                key={exercise.id}
                className="flex-row items-center py-3"
                style={{ borderBottomWidth: 1, borderBottomColor: resolvedTheme.border }}
                onPress={() => onToggleExercise?.(exercise.id)}
              >
                <View className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-[14px]" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
                  {exercise.thumbnailUrl ? (
                    <Image source={{ uri: exercise.thumbnailUrl }} className="h-full w-full" resizeMode="cover" />
                  ) : (
                    <Dumbbell color={resolvedTheme.iconMuted} size={22} strokeWidth={2.2} />
                  )}
                </View>
                <Text className="flex-1 text-[17px]" style={{ color: resolvedTheme.text }}>{exercise.name}</Text>
                {selectedExerciseIds.includes(exercise.id) ? (
                  <AppSelectionIndicator theme={resolvedTheme} selected />
                ) : (
                  <View className="h-8 w-8 items-center justify-center rounded-full" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surfaceMuted }}>
                    <Info color={resolvedTheme.iconMuted} size={15} strokeWidth={2.4} />
                  </View>
                )}
              </Pressable>
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
          <AppButton theme={resolvedTheme} label={actionLabel} onPress={onAddExercises} disabled={selectedExerciseIds.length === 0 && !canSubmitEmptySelection} />
        </View>
      </View>
    </SafeAreaView>
  )
}

export function ExerciseMultiSelectView({ isVisible, theme, sheet, selectedExerciseIds = [], onToggleExercise, searchQuery = '', onSearchChange, onAddExercises, onClose, presentation = 'modal' }) {
  if (!sheet || !isVisible) return null

  if (presentation === 'inline') {
    return (
      <ExerciseMultiSelectContent
        theme={theme}
        sheet={sheet}
        selectedExerciseIds={selectedExerciseIds}
        onToggleExercise={onToggleExercise}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onAddExercises={onAddExercises}
        onClose={onClose}
      />
    )
  }

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <ExerciseMultiSelectContent
          theme={theme}
          sheet={sheet}
          selectedExerciseIds={selectedExerciseIds}
          onToggleExercise={onToggleExercise}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onAddExercises={onAddExercises}
          onClose={onClose}
        />
      </SafeAreaProvider>
    </Modal>
  )
}
