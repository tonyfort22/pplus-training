import { Dumbbell, Info, X } from 'lucide-react-native'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppNoticeCard, AppSearchInput, AppSelectionIndicator, AppSheetHeader, AppSurfaceCard } from '../ui/primitives.js'
import { Skeleton } from '../ui/skeleton.js'

function ExerciseLibrarySkeletonRows({ theme, selectable = false }) {
  return (
    <View>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={`exercise-skeleton-${index + 1}`} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <Skeleton className="mr-3 h-14 w-14 rounded-[14px]" theme={theme} />
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 flex-1 rounded-full" theme={theme} style={{ width: index % 3 === 0 ? '72%' : index % 3 === 1 ? '58%' : '66%' }} />
            <Skeleton className="h-3 rounded-full" theme={theme} style={{ width: index % 2 === 0 ? '42%' : '34%', opacity: 0.72 }} />
          </View>
          <Skeleton className="h-8 w-8 rounded-full" theme={theme} />
        </View>
      ))}
    </View>
  )
}

export function ExerciseLibraryView({
  title = 'Exercises',
  searchPlaceholder = 'Search or Create Exercises',
  onBack,
  exercises = [],
  isLoading = false,
  error = '',
  emptyLabel = 'No exercises found.',
  searchQuery = '',
  onSearchChange,
  onPressExercise,
  theme,
  selectedExercises = [],
  selectedSectionTitle = '',
  selectedSectionHelperText = '',
  showSelectedSection = false,
  selectedExerciseIds = [],
  onToggleExercise,
  selectable = false,
  primaryActionLabel = '',
  onPrimaryAction,
  primaryActionDisabled = false,
}) {
  const resolvedTheme = theme || getAppTheme('dark')
  const insets = useSafeAreaInsets()
  const styles = createExerciseLibraryStyles(resolvedTheme)

  function handleExercisePress(exercise) {
    if (selectable) {
      return onToggleExercise?.(exercise.id)
    }
    return onPressExercise?.(exercise)
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={title} onBack={onBack} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: primaryActionLabel ? 192 : 120 }}>
          {showSelectedSection ? (
            <View className="mb-5 gap-3">
              {selectedSectionTitle || selectedSectionHelperText ? (
                <View className="gap-1">
                  {selectedSectionTitle ? <Text className="text-[13px] font-semibold uppercase tracking-[1.2px]" style={{ color: resolvedTheme.textSoft }}>{selectedSectionTitle}</Text> : null}
                  {selectedSectionHelperText ? <Text className="text-[14px]" style={{ color: resolvedTheme.textSoft }}>{selectedSectionHelperText}</Text> : null}
                </View>
              ) : null}

              {selectedExercises.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
                  {selectedExercises.map((exercise) => (
                    <AppSurfaceCard key={exercise.id} theme={resolvedTheme} contentClassName="flex-row items-center gap-3 px-4 py-4" style={styles.selectedExerciseCard}>
                      <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-[14px]" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surfaceMuted }}>
                        {exercise.thumbnailUrl ? (
                          <Image source={{ uri: exercise.thumbnailUrl }} className="h-full w-full" resizeMode="cover" />
                        ) : (
                          <Dumbbell color={resolvedTheme.iconMuted} size={18} strokeWidth={2.2} />
                        )}
                      </View>
                      <Text numberOfLines={1} className="max-w-[120px] text-[15px] font-semibold" style={{ color: resolvedTheme.text }}>{exercise.name}</Text>
                      <Pressable className="h-8 w-8 items-center justify-center rounded-full" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surfaceMuted }} onPress={() => onToggleExercise?.(exercise.id)}>
                        <X color={resolvedTheme.iconMuted} size={14} strokeWidth={2.6} />
                      </Pressable>
                    </AppSurfaceCard>
                  ))}
                </ScrollView>
              ) : (
                <AppNoticeCard theme={resolvedTheme} body="No exercises selected yet." />
              )}
            </View>
          ) : null}

          <View>
            {isLoading ? (
              <ExerciseLibrarySkeletonRows theme={resolvedTheme} selectable={selectable} />
            ) : null}

            {!isLoading && error ? (
              <AppNoticeCard theme={resolvedTheme} body={error} tone="danger" />
            ) : null}

            {!isLoading && !error && exercises.length === 0 ? (
              <AppNoticeCard theme={resolvedTheme} body={emptyLabel} />
            ) : null}

            {!isLoading && !error
              ? exercises.map((exercise) => {
                const isSelected = selectable && selectedExerciseIds.includes(exercise.id)
                return (
                  <Pressable key={exercise.id} className="flex-row items-center py-3" style={styles.exerciseRow} onPress={() => handleExercisePress(exercise)}>
                    <View className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-[14px]" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
                      {exercise.thumbnailUrl ? (
                        <Image source={{ uri: exercise.thumbnailUrl }} className="h-full w-full" resizeMode="cover" />
                      ) : (
                        <Dumbbell color={resolvedTheme.iconMuted} size={20} strokeWidth={2.2} />
                      )}
                    </View>
                    <Text className="flex-1 text-[17px]" style={{ color: resolvedTheme.text }}>{exercise.name}</Text>
                    {selectable ? (
                      <AppSelectionIndicator theme={resolvedTheme} selected={isSelected} />
                    ) : (
                      <View className="h-8 w-8 items-center justify-center rounded-full" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surfaceMuted }}>
                        <Info color={resolvedTheme.iconMuted} size={16} strokeWidth={2.2} />
                      </View>
                    )}
                  </Pressable>
                )
              })
              : null}
          </View>
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0 px-5" style={{ paddingBottom: Math.max(insets.bottom, 20), backgroundColor: resolvedTheme.background }}>
          <View className="gap-3">
            <AppSearchInput
              theme={resolvedTheme}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
            />
            {primaryActionLabel ? (
              <AppButton theme={resolvedTheme} label={primaryActionLabel} onPress={onPrimaryAction} disabled={primaryActionDisabled} />
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

function createExerciseLibraryStyles(theme) {
  return StyleSheet.create({
    exerciseRow: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    selectedExerciseCard: {
      minWidth: 0,
      backgroundColor: theme.surface,
    },
  })
}
