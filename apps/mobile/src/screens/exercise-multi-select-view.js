import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Info } from 'lucide-react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppSearchInput, AppSelectionIndicator, AppSheetHeader } from '../ui/primitives.js'

function ExerciseMultiSelectContent({ theme, sheet, selectedExerciseIds, onToggleExercise, searchQuery, onSearchChange, onAddExercises, onClose }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const filteredExercises = (sheet?.exercises || []).filter((exercise) => {
    const query = String(searchQuery || '').trim().toLowerCase()
    if (!query) return true
    return String(exercise.name || '').toLowerCase().includes(query)
  })

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={sheet.title} onBack={onClose} rightAction={<View className="w-11" />} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 112 }}>
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
                    <Text className="text-[18px] font-semibold" style={{ color: resolvedTheme.iconMuted }}>🏋️</Text>
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
      <View className="absolute inset-x-0 bottom-0 px-5" style={{ paddingBottom: Math.max(insets.bottom, 20), backgroundColor: resolvedTheme.background }}>
        <View className="flex-row items-center gap-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: resolvedTheme.border }}>
          <View className="flex-1">
            <AppSearchInput theme={resolvedTheme} value={searchQuery} onChangeText={onSearchChange} placeholder={sheet.searchPlaceholder} />
          </View>
          <AppButton theme={resolvedTheme} label={`${sheet.addButtonLabel} ${selectedExerciseIds.length}`} onPress={onAddExercises} disabled={selectedExerciseIds.length === 0} />
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
