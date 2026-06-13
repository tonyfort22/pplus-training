import { ArrowDown, ArrowUp, ArrowUpDown, Clock3, Dumbbell, X, Zap } from 'lucide-react-native';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTheme } from '../theme/app-theme.js';
import { AppButton, AppSurfaceCard } from '../ui/primitives.js';

function WorkoutThumbnailIcon({ icon, theme }) {
  if (icon === 'arrow-up') return <ArrowUp color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'arrow-down') return <ArrowDown color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'zap') return <Zap color={theme.iconMuted} size={20} strokeWidth={2.2} />
  return <Dumbbell color={theme.iconMuted} size={20} strokeWidth={2.2} />
}

function WorkoutSheetSetTable({ exercise, theme }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center pb-3" style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Text className="w-24 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>#</Text>
        <Text className="flex-1 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>EFFORT</Text>
        <View className="flex-1 flex-row items-center justify-center gap-1">
          <Text className="text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>{exercise.weightHeader}</Text>
          <ArrowUpDown color={theme.iconMuted} size={12} strokeWidth={2.2} />
        </View>
        <Text className="flex-1 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>REPS</Text>
      </View>

      <View className="gap-2">
        {exercise.sets.map((set) => (
          <View key={set.id} className="min-h-[50px] flex-row items-center">
            <Text className="w-24 text-center text-[15px]" style={{ color: theme.text }}>{set.setNumber}</Text>
            <Text className="flex-1 text-center text-[15px]" style={{ color: theme.text }}>{set.effort}</Text>
            <Text className="flex-1 text-center text-[15px]" style={{ color: theme.text }}>{set.load}</Text>
            <Text className="flex-1 text-center text-[15px]" style={{ color: theme.text }}>{set.reps}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function WorkoutSheetExerciseBlock({ exercise, onOpenExerciseDetail, theme }) {
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <AppSurfaceCard
          theme={theme}
          containerClassName="h-12 w-12 rounded-[14px] overflow-hidden"
          contentClassName="h-full items-center justify-center"
        >
          {exercise.thumbnailUrl ? (
            <Image source={{ uri: exercise.thumbnailUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <WorkoutThumbnailIcon icon={exercise.thumbnailIcon || 'dumbbell'} theme={theme} />
          )}
        </AppSurfaceCard>
        <Pressable onPress={() => onOpenExerciseDetail?.(exercise)}>
          <Text className="flex-1 text-[22px] font-semibold leading-[28px]" style={{ color: theme.text }}>{exercise.name}</Text>
        </Pressable>
      </View>

      <WorkoutSheetSetTable exercise={exercise} theme={theme} />

      <View className="flex-row justify-end gap-2">
        <AppSurfaceCard theme={theme} containerClassName="rounded-[14px] overflow-hidden" contentClassName="flex-row items-center gap-1.5 px-3 py-2">
          <Clock3 color={theme.iconMuted} size={15} strokeWidth={2.2} />
          <Text className="text-[14px] font-medium" style={{ color: theme.textMuted }}>{exercise.restLabel}</Text>
        </AppSurfaceCard>
        <AppSurfaceCard theme={theme} containerClassName="rounded-[14px] overflow-hidden" contentClassName="items-center justify-center px-3 py-2">
          <ArrowUpDown color={theme.iconMuted} size={16} strokeWidth={2.2} />
        </AppSurfaceCard>
      </View>
    </View>
  )
}

function WorkoutSheetContent({ model, theme, onClose, onStartWorkout, onEditWorkout, onOpenExerciseDetail, isStartingWorkout = false }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')

  if (!model) return null

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="px-5 pb-6" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <AppSurfaceCard
            theme={resolvedTheme}
            onPress={onClose}
            containerClassName="h-10 w-10 rounded-[14px] overflow-hidden"
            contentClassName="h-full items-center justify-center"
          >
            <X color={resolvedTheme.icon} size={20} strokeWidth={2.4} />
          </AppSurfaceCard>
          <Pressable onPress={onEditWorkout}>
            <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.accentText }}>{model.editLabel || 'Edit'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="gap-8">
            <View className="gap-3">
              <Text className="text-[26px] font-bold leading-[30px]" style={{ color: resolvedTheme.text }}>{model.title}</Text>
              {model.resumeNotice ? (
                <View
                  className="self-start rounded-full px-3 py-1"
                  style={{
                    backgroundColor: resolvedTheme.accentSurface,
                    borderWidth: 1,
                    borderColor: resolvedTheme.accentBorder,
                  }}
                >
                  <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.accentText }}>
                    {model.resumeNotice}
                  </Text>
                </View>
              ) : null}
              <View className="flex-row flex-wrap items-center gap-3">
                {model.summaryItems.map((item, index) => (
                  <View key={item.id} className="flex-row items-center gap-3">
                    <Text className="text-[15px]" style={{ color: resolvedTheme.textSoft }}>{item.label}</Text>
                    {index < model.summaryItems.length - 1 ? <View className="h-4 w-px" style={{ backgroundColor: resolvedTheme.border }} /> : null}
                  </View>
                ))}
              </View>
            </View>

            <View className="gap-8">
              {model.exercises.map((exercise) => (
                <WorkoutSheetExerciseBlock key={exercise.id} exercise={exercise} onOpenExerciseDetail={onOpenExerciseDetail} theme={resolvedTheme} />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="absolute inset-x-0 bottom-0 px-5 pb-6" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        <AppButton
          theme={resolvedTheme}
          label={isStartingWorkout ? 'Starting...' : (model.ctaLabel || 'Start Workout')}
          disabled={isStartingWorkout}
          onPress={onStartWorkout}
          style={{
            shadowColor: theme.cardShadow,
            shadowOpacity: 0.28,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          }}
        />
      </View>
    </SafeAreaView>
  )
}

export function WorkoutSheet({ isVisible, model, theme, onClose, onStartWorkout, onEditWorkout, onOpenExerciseDetail, onDismiss, isStartingWorkout = false }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose} onDismiss={onDismiss}>
      <SafeAreaProvider>
        <WorkoutSheetContent
          model={model}
          theme={theme}
          onClose={onClose}
          onStartWorkout={onStartWorkout}
          onEditWorkout={onEditWorkout}
          onOpenExerciseDetail={onOpenExerciseDetail}
          isStartingWorkout={isStartingWorkout}
        />
      </SafeAreaProvider>
    </Modal>
  )
}
