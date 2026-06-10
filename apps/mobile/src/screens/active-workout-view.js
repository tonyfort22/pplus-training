import { useEffect, useRef, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, Clock3, Dumbbell, Link2, Mic, Settings, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react-native'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppDangerPillButton, AppOutlinedActionButton, AppSearchInput, AppSegmentedControl, AppSelectionIndicator, AppSurfaceCard } from '../ui/primitives.js'

function ActiveWorkoutCellInput({ value, onChangeText, widthClass, theme }) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <TextInput
      className={`${widthClass} h-full border px-0 py-0.5 text-[15px] text-center`}
      keyboardType="numeric"
      onBlur={() => setIsFocused(false)}
      onChangeText={onChangeText}
      onFocus={() => setIsFocused(true)}
      selectTextOnFocus
      style={{
        backgroundColor: 'transparent',
        borderColor: isFocused ? theme.accentText : 'transparent',
        lineHeight: 15,
        outlineStyle: 'none',
        paddingVertical: 0,
        color: theme.text,
      }}
      value={value}
    />
  )
}

function GlassActionSurface({ children, className = '', style, theme }) {
  return (
    <View
      className={`overflow-hidden rounded-[16px] ${className}`.trim()}
      style={[
        {
          backgroundColor: theme.accentSurface,
          borderWidth: 1,
          borderColor: theme.accentBorder,
          shadowColor: theme.cardShadow,
          shadowOpacity: 0.22,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

function SwipeableActiveWorkoutSetRow({ children, onDelete, theme }) {
  function renderRightActions() {
    return (
      <Pressable
        className="h-full w-24 items-center justify-center rounded-[16px]"
        onPress={onDelete}
        style={{ backgroundColor: theme.dangerSurface, borderWidth: 1, borderColor: theme.dangerBorder }}
      >
        <Trash2 color={theme.dangerText} size={18} strokeWidth={2.2} />
      </Pressable>
    )
  }

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={renderRightActions}
      rightThreshold={48}
    >
      <View className="w-full overflow-hidden rounded-[16px]">
        {children}
      </View>
    </Swipeable>
  )
}

function SwipeableActiveWorkoutExerciseRow({ children, onDelete, theme }) {
  function renderRightActions() {
    return (
      <Pressable
        className="h-full w-24 items-center justify-center rounded-[24px]"
        onPress={onDelete}
        style={{ backgroundColor: theme.dangerSurface, borderWidth: 1, borderColor: theme.dangerBorder }}
      >
        <Trash2 color={theme.dangerText} size={18} strokeWidth={2.2} />
      </Pressable>
    )
  }

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={renderRightActions}
      rightThreshold={48}
    >
      <View className="w-full overflow-hidden rounded-[24px]">
        {children}
      </View>
    </Swipeable>
  )
}

function ActiveWorkoutSetRow({ set, theme, onCompleteSet, exerciseId, onSetValueChange }) {
  const isCompleted = Boolean(set.isCompleted)

  return (
    <View
      className="min-h-[54px] flex-row items-center rounded-[16px] px-2"
      style={{
        backgroundColor: isCompleted ? theme.accentSurface : theme.background,
        borderWidth: 1,
        borderColor: isCompleted ? theme.accentBorder : 'transparent',
      }}
    >
      <Text className="w-14 text-center text-[15px] font-medium" style={{ color: theme.text }}>{set.setNumber}</Text>
      <ActiveWorkoutCellInput value={set.effort} widthClass="flex-1" theme={theme} onChangeText={(nextValue) => onSetValueChange?.(exerciseId, set.id, 'effort', nextValue)} />
      <ActiveWorkoutCellInput value={set.load} widthClass="flex-1" theme={theme} onChangeText={(nextValue) => onSetValueChange?.(exerciseId, set.id, 'load', nextValue)} />
      <ActiveWorkoutCellInput value={set.reps} widthClass="flex-1" theme={theme} onChangeText={(nextValue) => onSetValueChange?.(exerciseId, set.id, 'reps', nextValue)} />
      <Pressable
        className="ml-1 h-9 w-16 items-center justify-center rounded-[12px]"
        onPress={() => onCompleteSet?.(exerciseId, set.id)}
        style={{
          borderWidth: 1,
          borderColor: isCompleted ? theme.accentBorder : theme.border,
          backgroundColor: isCompleted ? theme.accentSurface : theme.surface,
        }}
      >
        {isCompleted ? <Check color={theme.accentText} size={16} strokeWidth={2.5} /> : <Text className="text-[12px] font-semibold" style={{ color: theme.textSoft }}>Done</Text>}
      </Pressable>
    </View>
  )
}

function ActiveWorkoutExerciseControls({ exercise, addSetLabel, theme, onAddSet, onOpenExerciseRestTimer }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <GlassActionSurface className="h-11 w-11" theme={theme}>
        <Pressable className="h-11 w-11 items-center justify-center" onPress={() => {}}>
          <Link2 color={theme.accentText} size={18} strokeWidth={2.2} />
        </Pressable>
      </GlassActionSurface>

      <GlassActionSurface className="min-w-[112px]" theme={theme}>
        <Pressable className="flex-row items-center justify-center gap-2 px-4 py-3" onPress={() => onAddSet?.(exercise.id)}>
          <Text className="text-[18px] font-semibold" style={{ color: theme.accentText }}>+</Text>
          <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>{addSetLabel || 'Add Set'}</Text>
        </Pressable>
      </GlassActionSurface>

      <View className="flex-1 flex-row items-center justify-end gap-2">
        <GlassActionSurface theme={theme}>
          <Pressable className="flex-row items-center gap-1.5 px-3 py-3" onPress={() => onOpenExerciseRestTimer?.(exercise.id)}>
            <Clock3 color={theme.accentText} size={17} strokeWidth={2.2} />
            <Text className="text-[14px] font-semibold" style={{ color: theme.accentText }}>{exercise.restLabel}</Text>
          </Pressable>
        </GlassActionSurface>
      </View>
    </View>
  )
}

function ActiveWorkoutExerciseBlock({ exercise, exerciseIndex, totalExercises, theme, addSetLabel, onAddSet, onDeleteSet, onDeleteExercise, onMoveExercise, onOpenExerciseDetail, onCompleteSet, onSetValueChange, onOpenExerciseRestTimer }) {
  const canMoveExerciseUp = exerciseIndex > 0
  const canMoveExerciseDown = exerciseIndex < totalExercises - 1

  return (
    <SwipeableActiveWorkoutExerciseRow onDelete={() => onDeleteExercise?.(exercise.id)} theme={theme}>
      <AppSurfaceCard theme={theme} containerClassName="rounded-[24px] overflow-hidden" contentClassName="gap-5 px-5 py-5">
        <View className="flex-row items-start gap-3">
          <AppSurfaceCard
            theme={theme}
            containerClassName="h-14 w-14 rounded-[18px] overflow-hidden"
            contentClassName="h-full items-center justify-center"
          >
            {exercise.thumbnailUrl ? (
              <Image source={{ uri: exercise.thumbnailUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Dumbbell color={theme.iconMuted} size={22} strokeWidth={2.2} />
            )}
          </AppSurfaceCard>
          <View className="flex-1">
            <Pressable onPress={() => onOpenExerciseDetail?.(exercise)}>
              <Text className="text-[22px] font-semibold leading-[28px]" style={{ color: theme.text }}>{exercise.title}</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2">
            <AppSurfaceCard
              theme={theme}
              containerClassName="h-10 w-10 rounded-[14px] overflow-hidden"
              contentClassName="h-full items-center justify-center"
            >
              <Pressable className="h-10 w-10 items-center justify-center" disabled={!canMoveExerciseUp} onPress={() => onMoveExercise?.(exercise.id, 'up')}>
                <ArrowUp color={canMoveExerciseUp ? theme.accentText : theme.iconMuted} size={17} strokeWidth={2.2} />
              </Pressable>
            </AppSurfaceCard>
            <AppSurfaceCard
              theme={theme}
              containerClassName="h-10 w-10 rounded-[14px] overflow-hidden"
              contentClassName="h-full items-center justify-center"
            >
              <Pressable className="h-10 w-10 items-center justify-center" disabled={!canMoveExerciseDown} onPress={() => onMoveExercise?.(exercise.id, 'down')}>
                <ArrowDown color={canMoveExerciseDown ? theme.accentText : theme.iconMuted} size={17} strokeWidth={2.2} />
              </Pressable>
            </AppSurfaceCard>
          </View>
        </View>

        <View className="flex-row items-center pb-3" style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <Text className="w-14 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>#</Text>
          <Text className="flex-1 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>EFFORT</Text>
          <Text className="flex-1 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>LB</Text>
          <Text className="flex-1 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>REPS</Text>
          <Text className="w-16 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>DONE</Text>
        </View>

        <View className="gap-2.5">
          {exercise.sets.map((set) => (
            <SwipeableActiveWorkoutSetRow key={set.id} onDelete={() => onDeleteSet?.(exercise.id, set.id)} theme={theme}>
              <ActiveWorkoutSetRow set={set} theme={theme} onCompleteSet={onCompleteSet} exerciseId={exercise.id} onSetValueChange={onSetValueChange} />
            </SwipeableActiveWorkoutSetRow>
          ))}
        </View>

        <ActiveWorkoutExerciseControls exercise={exercise} addSetLabel={addSetLabel} theme={theme} onAddSet={onAddSet} onOpenExerciseRestTimer={onOpenExerciseRestTimer} />
      </AppSurfaceCard>
    </SwipeableActiveWorkoutExerciseRow>
  )
}

function formatUtilityClock(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function ActiveWorkoutRestTimerChip({ label, theme, onOpenRestTimer }) {
  const isIconOnly = !label
  if (!onOpenRestTimer) return null

  return (
    <GlassActionSurface className="h-[58px] min-w-[112px] rounded-[24px]" theme={theme}>
      <Pressable className={`h-[58px] flex-row items-center px-5 ${isIconOnly ? 'justify-center' : 'justify-start gap-2'}`} onPress={onOpenRestTimer}>
        <Clock3 color={theme.accentText} size={17} strokeWidth={2.2} />
        {!isIconOnly ? (
          <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>{label}</Text>
        ) : null}
      </Pressable>
    </GlassActionSurface>
  )
}

function ActiveWorkoutRestTimerSheet({
  isVisible,
  restTimer,
  defaultTimerClockLabel,
  restTimerMode,
  stopwatchClockLabel,
  isStopwatchRunning,
  theme,
  onSelectTimerMode,
  onSelectStopwatchMode,
  onAdjustRestTimer,
  onDismissRestTimer,
  onToggleStopwatch,
  onCloseRestTimer,
}) {
  if (!isVisible) return null

  const timerIsActive = Boolean(restTimer)
  const clockLabel = restTimerMode === 'timer' ? (restTimer?.clockLabel || defaultTimerClockLabel) : stopwatchClockLabel
  const primaryLabel = restTimerMode === 'timer'
    ? (timerIsActive ? 'Cancel' : 'Start')
    : (isStopwatchRunning ? 'Cancel' : 'Start')

  return (
    <View className="absolute inset-0 justify-end" pointerEvents="box-none">
      <Pressable className="absolute inset-0" onPress={onCloseRestTimer} style={{ backgroundColor: 'rgba(0, 0, 0, 0.42)' }} />
      <View className="px-5 pb-6" pointerEvents="box-none">
        <AppSurfaceCard theme={theme} containerClassName="rounded-[28px] overflow-hidden" contentClassName="gap-5 px-5 py-5">
          <View className="items-center gap-2">
            <View className="h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.border }} />
          </View>

          <View className="flex-row rounded-[18px] p-1" style={{ backgroundColor: theme.background }}>
            <Pressable
              className="flex-1 items-center rounded-[14px] px-4 py-3"
              onPress={onSelectTimerMode}
              style={{ backgroundColor: restTimerMode === 'timer' ? theme.accentSurface : 'transparent' }}
            >
              <Text className="text-[14px] font-semibold" style={{ color: restTimerMode === 'timer' ? theme.accentText : theme.textSoft }}>Timer</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-[14px] px-4 py-3"
              onPress={onSelectStopwatchMode}
              style={{ backgroundColor: restTimerMode === 'stopwatch' ? theme.accentSurface : 'transparent' }}
            >
              <Text className="text-[14px] font-semibold" style={{ color: restTimerMode === 'stopwatch' ? theme.accentText : theme.textSoft }}>Stopwatch</Text>
            </Pressable>
          </View>

          <View className="items-center justify-center gap-4 py-2">
            <Text className="text-[40px] font-bold tracking-[1px]" style={{ color: theme.text }}>{clockLabel}</Text>
            {restTimerMode === 'timer' ? (
              <View className="w-full flex-row items-center justify-between px-8">
                <Pressable onPress={() => onAdjustRestTimer?.(-15)}>
                  <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>{restTimer?.minusLabel || '-15s'}</Text>
                </Pressable>
                <Pressable onPress={() => onAdjustRestTimer?.(15)}>
                  <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>{restTimer?.plusLabel || '+15s'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <AppButton
            theme={theme}
            label={primaryLabel}
            onPress={restTimerMode === 'timer' ? onDismissRestTimer : onToggleStopwatch}
          />
        </AppSurfaceCard>
      </View>
    </View>
  )
}

function WorkoutSettingsToggle({ isEnabled, onPress, theme }) {
  return (
    <View className="flex-row items-center gap-2 rounded-[14px] p-1" style={{ backgroundColor: theme.background }}>
      <Pressable
        className="flex-1 items-center rounded-[12px] px-3 py-2.5"
        onPress={() => onPress(false)}
        style={{ backgroundColor: !isEnabled ? theme.accentSurface : 'transparent' }}
      >
        <Text className="text-[13px] font-semibold" style={{ color: !isEnabled ? theme.accentText : theme.textSoft }}>Off</Text>
      </Pressable>
      <Pressable
        className="flex-1 items-center rounded-[12px] px-3 py-2.5"
        onPress={() => onPress(true)}
        style={{ backgroundColor: isEnabled ? theme.accentSurface : 'transparent' }}
      >
        <Text className="text-[13px] font-semibold" style={{ color: isEnabled ? theme.accentText : theme.textSoft }}>On</Text>
      </Pressable>
    </View>
  )
}

function ActiveWorkoutEffortAdjustmentSheet({
  isVisible,
  postSetEffortAdjustment,
  theme,
  onDecreaseEffort,
  onIncreaseEffort,
  onClosePostSetEffortAdjustment,
}) {
  if (!isVisible || !postSetEffortAdjustment) return null

  return (
    <View className="absolute inset-0 justify-end" pointerEvents="box-none">
      <Pressable className="absolute inset-0" onPress={onClosePostSetEffortAdjustment} style={{ backgroundColor: 'rgba(0, 0, 0, 0.42)' }} />
      <View className="px-5 pb-6" pointerEvents="box-none">
        <AppSurfaceCard theme={theme} containerClassName="rounded-[28px] overflow-hidden" contentClassName="gap-5 px-5 py-5">
          <View className="items-center gap-2">
            <View className="h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.border }} />
            <Text className="text-[18px] font-semibold" style={{ color: theme.text }}>Adjust Effort</Text>
            <Text className="text-[14px] text-center" style={{ color: theme.textSoft }}>{postSetEffortAdjustment.exerciseTitle} • Set {postSetEffortAdjustment.setNumber}</Text>
          </View>

          <View className="items-center gap-3 rounded-[20px] px-4 py-5" style={{ backgroundColor: theme.background }}>
            <Text className="text-[13px] font-medium uppercase tracking-[1px]" style={{ color: theme.textSoft }}>Set RPE for this completed set.</Text>
            <Text className="text-[40px] font-bold tracking-[1px]" style={{ color: theme.text }}>{String(postSetEffortAdjustment.currentEffort ?? 0)}</Text>
            <View className="w-full flex-row items-center justify-between px-8">
              <Pressable onPress={onDecreaseEffort}>
                <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>-1</Text>
              </Pressable>
              <Pressable onPress={onIncreaseEffort}>
                <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>+1</Text>
              </Pressable>
            </View>
          </View>

          <AppButton theme={theme} label="Done" onPress={onClosePostSetEffortAdjustment} />
        </AppSurfaceCard>
      </View>
    </View>
  )
}

function ActiveWorkoutSettingsSheet({ isVisible, title, settings, theme, onCloseWorkoutSettings, onUpdateWorkoutSettings }) {
  if (!isVisible || !settings) return null

  return (
    <View className="absolute inset-0 justify-end" pointerEvents="box-none">
      <Pressable className="absolute inset-0" onPress={onCloseWorkoutSettings} style={{ backgroundColor: 'rgba(0, 0, 0, 0.42)' }} />
      <View className="px-5 pb-6" pointerEvents="box-none">
        <AppSurfaceCard theme={theme} containerClassName="rounded-[28px] overflow-hidden" contentClassName="gap-5 px-5 py-5">
          <View className="items-center gap-2">
            <View className="h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.border }} />
            <Text className="text-[18px] font-semibold" style={{ color: theme.text }}>{title || 'Workout Settings'}</Text>
          </View>

          <View className="gap-3">
            <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>Default Rest Time</Text>
            <View className="flex-row items-center justify-between rounded-[18px] px-4 py-4" style={{ backgroundColor: theme.background }}>
              <Pressable onPress={() => onUpdateWorkoutSettings?.({ defaultRestSeconds: Math.max(0, (settings.defaultRestSeconds ?? 0) - 15) })}>
                <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>-15s</Text>
              </Pressable>
              <Text className="text-[20px] font-bold" style={{ color: theme.text }}>{settings.defaultRestClockLabel}</Text>
              <Pressable onPress={() => onUpdateWorkoutSettings?.({ defaultRestSeconds: Math.max(0, (settings.defaultRestSeconds ?? 0) + 15) })}>
                <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>+15s</Text>
              </Pressable>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>Adjust Effort After Set</Text>
            <WorkoutSettingsToggle isEnabled={settings.adjustEffortAfterSet} onPress={(nextValue) => onUpdateWorkoutSettings?.({ adjustEffortAfterSet: nextValue })} theme={theme} />
          </View>
        </AppSurfaceCard>
      </View>
    </View>
  )
}

function ActiveWorkoutExerciseRestTimerSheet({ isVisible, exercise, theme, onCloseExerciseRestTimer, onAdjustExerciseRestTimer, onRemoveExerciseRestTimer }) {
  if (!isVisible || !exercise) return null

  return (
    <View className="absolute inset-0 justify-end" pointerEvents="box-none">
      <Pressable className="absolute inset-0" onPress={onCloseExerciseRestTimer} style={{ backgroundColor: 'rgba(0, 0, 0, 0.42)' }} />
      <View className="px-5 pb-6" pointerEvents="box-none">
        <AppSurfaceCard theme={theme} containerClassName="rounded-[28px] overflow-hidden" contentClassName="gap-5 px-5 py-5">
          <View className="items-center gap-2">
            <View className="h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.border }} />
            <Text className="text-[18px] font-semibold" style={{ color: theme.text }}>Edit Rest Timer</Text>
          </View>

          <View className="items-center justify-center gap-4 py-2">
            <Text className="text-[40px] font-bold tracking-[1px]" style={{ color: theme.text }}>{exercise.restLabel}</Text>
            <View className="w-full flex-row items-center justify-between px-8">
              <Pressable onPress={() => onAdjustExerciseRestTimer?.(exercise.id, (exercise.defaultRestSeconds ?? 0) - 15)}>
                <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>-15s</Text>
              </Pressable>
              <Pressable onPress={() => onAdjustExerciseRestTimer?.(exercise.id, (exercise.defaultRestSeconds ?? 0) + 15)}>
                <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>+15s</Text>
              </Pressable>
            </View>
          </View>

          <AppButton theme={theme} label="Remove" tone="danger" onPress={() => onRemoveExerciseRestTimer?.(exercise.id)} />
        </AppSurfaceCard>
      </View>
    </View>
  )
}

function ActiveWorkoutAddExerciseSheet({
  isVisible,
  theme,
  availableExercises,
  isLoadingAvailableExercises,
  availableExercisesError,
  selectedAddExerciseIds,
  addExerciseSearchQuery,
  addExerciseTab,
  onSearchAddExercise,
  onToggleAddExercise,
  onChangeAddExerciseTab,
  onCloseAddExercise,
  onConfirmAddExercises,
}) {
  const insets = useSafeAreaInsets()
  const filteredExercises = (availableExercises || []).filter((exercise) => {
    const query = String(addExerciseSearchQuery || '').trim().toLowerCase()
    if (!query) return true
    return String(exercise.name || '').toLowerCase().includes(query)
  })

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onCloseAddExercise}>
      <View className="flex-1 justify-end" style={{ backgroundColor: theme.overlay }}>
        <Pressable className="flex-1" onPress={onCloseAddExercise} />
        <View className="rounded-t-[30px] px-5 pt-4" style={{ backgroundColor: theme.surfaceElevated, paddingBottom: Math.max(insets.bottom, 20) }}>
          <View className="mb-4 items-center">
            <View className="h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.borderStrong }} />
          </View>
          <Text className="mb-4 text-center text-[22px] font-bold" style={{ color: theme.text }}>Add Exercise</Text>
          <AppSegmentedControl
            theme={theme}
            activeId={addExerciseTab}
            onChange={onChangeAddExerciseTab}
            options={[{ id: 'exercises', label: 'Exercises' }, { id: 'chat', label: 'Chat' }]}
          />
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520, flexGrow: 0, marginTop: 16 }} contentContainerStyle={{ paddingBottom: 108 }}>
            {addExerciseTab === 'chat' ? (
              <View className="py-6">
                <Text className="text-center text-[15px]" style={{ color: theme.textSoft }}>Chat</Text>
              </View>
            ) : isLoadingAvailableExercises ? (
              <View className="py-6">
                <Text className="text-center text-[15px]" style={{ color: theme.textSoft }}>Loading exercises…</Text>
              </View>
            ) : availableExercisesError ? (
              <View className="py-6">
                <Text className="text-center text-[15px]" style={{ color: theme.dangerText }}>{availableExercisesError}</Text>
              </View>
            ) : (
              <View>
                {filteredExercises.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    className="flex-row items-center py-3"
                    style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}
                    onPress={() => onToggleAddExercise(exercise.id)}
                  >
                    <Text className="flex-1 text-[17px]" style={{ color: theme.text }}>{exercise.name}</Text>
                    <AppSelectionIndicator theme={theme} selected={selectedAddExerciseIds.includes(exercise.id)} />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
          <View className="absolute inset-x-0 bottom-0 px-5" style={{ paddingBottom: Math.max(insets.bottom, 20), backgroundColor: theme.surfaceElevated }}>
            <View className="flex-row items-center gap-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
              <View className="flex-1">
                <AppSearchInput
                  theme={theme}
                  value={addExerciseSearchQuery}
                  onChangeText={onSearchAddExercise}
                  placeholder="Search or create"
                />
              </View>
              <AppButton
                theme={theme}
                label={`Add ${selectedAddExerciseIds.length}`}
                onPress={onConfirmAddExercises}
                disabled={selectedAddExerciseIds.length === 0}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function ActiveWorkoutEmptyWorkoutSheet({ isVisible, theme, onCloseEmptyWorkoutSheet, onConfirmEmptyWorkoutDiscard }) {
  if (!isVisible) return null

  return (
    <View className="absolute inset-0 items-center justify-center px-5" pointerEvents="box-none">
      <Pressable className="absolute inset-0" onPress={onCloseEmptyWorkoutSheet} style={{ backgroundColor: 'rgba(0, 0, 0, 0.42)' }} />
      <AppSurfaceCard theme={theme} containerClassName="w-full max-w-[420px] rounded-[28px] overflow-hidden" contentClassName="gap-5 px-5 py-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <Text className="text-[18px] font-semibold" style={{ color: theme.text }}>Empty Workout</Text>
            <Text className="text-[14px]" style={{ color: theme.textSoft }}>Complete sets to finish a workout</Text>
          </View>
          <Pressable className="h-9 w-9 items-center justify-center rounded-[12px]" onPress={onCloseEmptyWorkoutSheet} style={{ backgroundColor: theme.background }}>
            <X color={theme.iconMuted} size={18} strokeWidth={2.2} />
          </Pressable>
        </View>

        <AppButton theme={theme} label="Discard Workout" tone="danger" onPress={onConfirmEmptyWorkoutDiscard} />
        <Pressable className="items-center py-2" onPress={onCloseEmptyWorkoutSheet}>
          <Text className="text-[15px] font-semibold" style={{ color: theme.textSoft }}>Continue</Text>
        </Pressable>
      </AppSurfaceCard>
    </View>
  )
}

function ActiveWorkoutFinishWorkoutSheet({ isVisible, theme, perceivedDifficulty, onDecreaseDifficulty, onIncreaseDifficulty, onCloseFinishWorkoutSheet, onConfirmFinishWorkout }) {
  if (!isVisible) return null

  return (
    <View className="absolute inset-0 items-center justify-center px-5" pointerEvents="box-none">
      <Pressable className="absolute inset-0" onPress={onCloseFinishWorkoutSheet} style={{ backgroundColor: 'rgba(0, 0, 0, 0.42)' }} />
      <AppSurfaceCard theme={theme} containerClassName="w-full max-w-[420px] rounded-[28px] overflow-hidden" contentClassName="gap-5 px-5 py-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <Text className="text-[18px] font-semibold" style={{ color: theme.text }}>Finish Workout</Text>
            <Text className="text-[14px]" style={{ color: theme.textSoft }}>Session Difficulty</Text>
          </View>
          <Pressable className="h-9 w-9 items-center justify-center rounded-[12px]" onPress={onCloseFinishWorkoutSheet} style={{ backgroundColor: theme.background }}>
            <X color={theme.iconMuted} size={18} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between rounded-[20px] px-4 py-4" style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }}>
          <Pressable className="h-11 w-11 items-center justify-center" onPress={onDecreaseDifficulty}>
            <Text className="text-[24px] font-semibold" style={{ color: theme.accentText }}>−</Text>
          </Pressable>
          <Text className="text-[28px] font-bold" style={{ color: theme.text }}>{perceivedDifficulty}</Text>
          <Pressable className="h-11 w-11 items-center justify-center" onPress={onIncreaseDifficulty}>
            <Text className="text-[24px] font-semibold" style={{ color: theme.accentText }}>+</Text>
          </Pressable>
        </View>

        <AppButton theme={theme} label="Complete Workout" onPress={onConfirmFinishWorkout} />
      </AppSurfaceCard>
    </View>
  )
}

function ActiveWorkoutDiscardWorkoutSheet({ isVisible, theme, onCloseDiscardWorkout, onConfirmDiscardWorkout }) {
  if (!isVisible) return null

  return (
    <View className="absolute inset-0 items-center justify-center px-5" pointerEvents="box-none">
      <Pressable className="absolute inset-0" onPress={onCloseDiscardWorkout} style={{ backgroundColor: 'rgba(0, 0, 0, 0.42)' }} />
      <AppSurfaceCard theme={theme} containerClassName="w-full max-w-[420px] rounded-[28px] overflow-hidden" contentClassName="gap-5 px-5 py-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <Text className="text-[18px] font-semibold" style={{ color: theme.text }}>Discard Workout</Text>
            <Text className="text-[14px]" style={{ color: theme.textSoft }}>Are you sure you want to discard this workout? This action cannot be undone.</Text>
          </View>
          <Pressable className="h-9 w-9 items-center justify-center rounded-[12px]" onPress={onCloseDiscardWorkout} style={{ backgroundColor: theme.background }}>
            <X color={theme.iconMuted} size={18} strokeWidth={2.2} />
          </Pressable>
        </View>

        <AppButton theme={theme} label="Discard" tone="danger" onPress={onConfirmDiscardWorkout} />
        <Pressable className="items-center py-2" onPress={onCloseDiscardWorkout}>
          <Text className="text-[15px] font-semibold" style={{ color: theme.textSoft }}>Cancel</Text>
        </Pressable>
      </AppSurfaceCard>
    </View>
  )
}

function ActiveWorkoutFloatingTools({ theme, timerChipLabel, onOpenRestTimer }) {
  return (
    <View className="absolute bottom-16 left-6 right-6">
      <View className="absolute left-0">
        <ActiveWorkoutRestTimerChip label={timerChipLabel} theme={theme} onOpenRestTimer={onOpenRestTimer} />
      </View>
      <View className="items-end">
        <GlassActionSurface
          className="h-[58px] flex-row items-center rounded-[24px]"
          theme={theme}
          style={{
            shadowOpacity: 0.28,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          }}
        >
          <Pressable className="h-[58px] px-6 items-center justify-center" onPress={() => {}}>
            <Mic color={theme.accentText} size={22} strokeWidth={2.2} />
          </Pressable>
        </GlassActionSurface>
      </View>
    </View>
  )
}

function ActiveWorkoutViewContent({ model, theme, onClose, onFinish, onDiscard, canFinishWorkout = true, onAddSet, onDeleteSet, onDeleteExercise, onMoveExercise, onOpenExerciseDetail, onWorkoutNotesChange, onExerciseRestTimeChange, onRemoveExerciseRestTime, onAddExercises, availableExercises, isLoadingAvailableExercises, availableExercisesError, onCompleteSet, onAdjustRestTimer, onDismissRestTimer, onSetValueChange, postSetEffortAdjustment, onPostSetEffortChange, onClosePostSetEffortAdjustment, onUpdateWorkoutSettings }) {
  const resolvedTheme = theme || getAppTheme('dark')
  const insets = useSafeAreaInsets()
  const sessionDifficultyDefault = 7
  const [isRestTimerSheetOpen, setIsRestTimerSheetOpen] = useState(false)
  const [isWorkoutSettingsSheetOpen, setIsWorkoutSettingsSheetOpen] = useState(false)
  const [isExerciseRestTimerSheetOpen, setIsExerciseRestTimerSheetOpen] = useState(false)
  const [selectedExerciseRestTimerId, setSelectedExerciseRestTimerId] = useState(null)
  const [isFinishWorkoutSheetOpen, setIsFinishWorkoutSheetOpen] = useState(false)
  const [finishWorkoutPerceivedDifficulty, setFinishWorkoutPerceivedDifficulty] = useState(sessionDifficultyDefault)
  const [isEmptyWorkoutSheetOpen, setIsEmptyWorkoutSheetOpen] = useState(false)
  const [isDiscardWorkoutSheetOpen, setIsDiscardWorkoutSheetOpen] = useState(false)
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false)
  const [selectedAddExerciseIds, setSelectedAddExerciseIds] = useState([])
  const [addExerciseSearchQuery, setAddExerciseSearchQuery] = useState('')
  const [addExerciseTab, setAddExerciseTab] = useState('exercises')
  const [isPostSetEffortSheetOpen, setIsPostSetEffortSheetOpen] = useState(false)
  const previousRestTimerClockLabelRef = useRef(null)
  const previousPostSetEffortTargetRef = useRef(null)
  const [restTimerMode, setRestTimerMode] = useState('timer')
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)
  const [stopwatchElapsedSeconds, setStopwatchElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!model?.restTimer && !isStopwatchRunning) {
      setIsRestTimerSheetOpen(false)
    }
  }, [isStopwatchRunning, model?.restTimer])

  useEffect(() => {
    const nextPostSetEffortKey = postSetEffortAdjustment ? `${postSetEffortAdjustment.exerciseId}:${postSetEffortAdjustment.setId}` : null

    if (nextPostSetEffortKey && nextPostSetEffortKey !== previousPostSetEffortTargetRef.current) {
      setIsPostSetEffortSheetOpen(true)
    }

    if (!nextPostSetEffortKey) {
      setIsPostSetEffortSheetOpen(false)
    }

    previousPostSetEffortTargetRef.current = nextPostSetEffortKey
  }, [postSetEffortAdjustment])

  useEffect(() => {
    if (model?.restTimer?.clockLabel && !previousRestTimerClockLabelRef.current) {
      setIsRestTimerSheetOpen(false)
    }
    previousRestTimerClockLabelRef.current = model?.restTimer?.clockLabel || null
  }, [model?.restTimer?.clockLabel])

  useEffect(() => {
    if (!isStopwatchRunning) return undefined

    const intervalId = setInterval(() => {
      setStopwatchElapsedSeconds((currentValue) => currentValue + 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isStopwatchRunning])

  if (!model) return null

  const stopwatchClockLabel = formatUtilityClock(stopwatchElapsedSeconds)
  const defaultTimerClockLabel = model.defaultRestTimerLabel || '00:00'
  const timerChipLabel = isStopwatchRunning
    ? stopwatchClockLabel
    : (model.restTimer?.clockLabel || null)
  const selectedExerciseRestTimer = model.exercises.find((exercise) => exercise.id === selectedExerciseRestTimerId) || null

  function onOpenRestTimer() {
    setIsRestTimerSheetOpen(true)
  }

  function onCloseRestTimer() {
    setIsRestTimerSheetOpen(false)
  }

  function onOpenWorkoutSettings() {
    setIsWorkoutSettingsSheetOpen(true)
  }

  function onCloseWorkoutSettings() {
    setIsWorkoutSettingsSheetOpen(false)
  }

  function onOpenExerciseRestTimer(exerciseId) {
    setSelectedExerciseRestTimerId(exerciseId)
    setIsExerciseRestTimerSheetOpen(true)
  }

  function onCloseExerciseRestTimer() {
    setIsExerciseRestTimerSheetOpen(false)
    setSelectedExerciseRestTimerId(null)
  }

  function onAdjustExerciseRestTimer(exerciseId, nextRestSeconds) {
    onExerciseRestTimeChange?.(exerciseId, Math.max(0, Number(nextRestSeconds) || 0))
  }

  function onRemoveExerciseRestTimer(exerciseId) {
    onRemoveExerciseRestTime?.(exerciseId)
    onCloseExerciseRestTimer()
  }

  function onOpenDiscardWorkout() {
    setIsDiscardWorkoutSheetOpen(true)
  }

  function onOpenFinishWorkoutSheet() {
    setFinishWorkoutPerceivedDifficulty(sessionDifficultyDefault)
    setIsFinishWorkoutSheetOpen(true)
  }

  function onCloseFinishWorkoutSheet() {
    setIsFinishWorkoutSheetOpen(false)
  }

  function onConfirmFinishWorkout() {
    setIsFinishWorkoutSheetOpen(false)
    onFinish?.({ perceivedDifficulty: finishWorkoutPerceivedDifficulty })
  }

  function onOpenEmptyWorkoutSheet() {
    setIsEmptyWorkoutSheetOpen(true)
  }

  function onCloseEmptyWorkoutSheet() {
    setIsEmptyWorkoutSheetOpen(false)
  }

  function onConfirmEmptyWorkoutDiscard() {
    setIsEmptyWorkoutSheetOpen(false)
    onDiscard?.()
  }

  function onCloseDiscardWorkout() {
    setIsDiscardWorkoutSheetOpen(false)
  }

  function onConfirmDiscardWorkout() {
    setIsDiscardWorkoutSheetOpen(false)
    onDiscard?.()
  }

  function onOpenAddExercise() {
    setIsAddExerciseSheetOpen(true)
  }

  function onCloseAddExercise() {
    setIsAddExerciseSheetOpen(false)
    setSelectedAddExerciseIds([])
    setAddExerciseSearchQuery('')
    setAddExerciseTab('exercises')
  }

  function onToggleAddExercise(exerciseId) {
    setSelectedAddExerciseIds((currentValue) => currentValue.includes(exerciseId)
      ? currentValue.filter((id) => id !== exerciseId)
      : [...currentValue, exerciseId])
  }

  async function onConfirmAddExercises() {
    await onAddExercises?.(selectedAddExerciseIds)
    onCloseAddExercise()
  }

  function onDecreaseEffort() {
    const nextEffort = Math.max(1, Number(postSetEffortAdjustment?.currentEffort ?? 0) - 1)
    onPostSetEffortChange?.(nextEffort)
  }

  function onIncreaseEffort() {
    const nextEffort = Math.min(10, Number(postSetEffortAdjustment?.currentEffort ?? 0) + 1)
    onPostSetEffortChange?.(nextEffort)
  }

  function handleClosePostSetEffortAdjustment() {
    setIsPostSetEffortSheetOpen(false)
    onClosePostSetEffortAdjustment?.()
  }

  function handleDismissRestTimerPress() {
    onCloseRestTimer()
    onDismissRestTimer?.()
  }

  function onSelectTimerMode() {
    setRestTimerMode('timer')
  }

  function onSelectStopwatchMode() {
    setRestTimerMode('stopwatch')
  }

  function onToggleStopwatch() {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false)
      setStopwatchElapsedSeconds(0)
      onCloseRestTimer()
      return
    }

    setRestTimerMode('stopwatch')
    setStopwatchElapsedSeconds(0)
    setIsStopwatchRunning(true)
  }

  function handleFinishPress() {
    if (!canFinishWorkout) {
      onOpenEmptyWorkoutSheet()
      return
    }

    onOpenFinishWorkoutSheet()
  }

  function onDecreaseDifficulty() {
    setFinishWorkoutPerceivedDifficulty((currentValue) => Math.max(1, Number(currentValue || sessionDifficultyDefault) - 1))
  }

  function onIncreaseDifficulty() {
    setFinishWorkoutPerceivedDifficulty((currentValue) => Math.min(10, Number(currentValue || sessionDifficultyDefault) + 1))
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 24) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <AppSurfaceCard
            theme={resolvedTheme}
            onPress={onClose}
            containerClassName="h-10 w-10 rounded-[14px] overflow-hidden"
            contentClassName="h-full items-center justify-center"
          >
            <X color={resolvedTheme.icon} size={20} strokeWidth={2.4} />
          </AppSurfaceCard>
          <Text className="text-[14px] font-semibold" style={{ color: resolvedTheme.textSoft }}>{model.header.workoutTimerLabel}</Text>
          <View className="flex-row items-center gap-2">
            <Pressable className="h-10 w-10 items-center justify-center" onPress={onOpenWorkoutSettings}>
              <Settings color={resolvedTheme.accentText} size={20} strokeWidth={2.2} />
            </Pressable>
            <AppButton theme={resolvedTheme} label={model.header.finishLabel} onPress={handleFinishPress} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
          <View className="gap-8">
            <View className="gap-4">
              <Text className="text-[28px] font-bold leading-[32px]" style={{ color: resolvedTheme.text }}>{model.title}</Text>
              <View className="flex-row flex-wrap items-center gap-3">
                <Text className="text-[15px]" style={{ color: resolvedTheme.textSoft }}>{model.header.exerciseCountLabel}</Text>
                <View className="h-4 w-px" style={{ backgroundColor: resolvedTheme.border }} />
                <Text className="text-[15px]" style={{ color: resolvedTheme.textSoft }}>{model.header.progressLabel}</Text>
                <View className="h-4 w-px" style={{ backgroundColor: resolvedTheme.border }} />
                <Text className="text-[15px]" style={{ color: resolvedTheme.textSoft }}>{model.header.workoutTimerLabel}</Text>
              </View>
              <AppSurfaceCard theme={resolvedTheme} containerClassName="rounded-[20px] overflow-hidden" contentClassName="px-4 py-4">
                <TextInput
                  className="min-h-[24px] px-0 py-0 text-[15px] leading-[20px]"
                  placeholder={model.notesPlaceholder}
                  placeholderTextColor={resolvedTheme.textSoft}
                  onChangeText={onWorkoutNotesChange}
                  value={model.notesValue}
                  style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: resolvedTheme.text }}
                />
              </AppSurfaceCard>
            </View>

            <View className="gap-5">
              {model.exercises.map((exercise, exerciseIndex) => (
                <ActiveWorkoutExerciseBlock key={exercise.id} exercise={exercise} exerciseIndex={exerciseIndex} totalExercises={model.exercises.length} theme={resolvedTheme} addSetLabel={model.addSetLabel} onAddSet={onAddSet} onDeleteSet={onDeleteSet} onDeleteExercise={onDeleteExercise} onMoveExercise={onMoveExercise} onOpenExerciseDetail={onOpenExerciseDetail} onCompleteSet={onCompleteSet} onSetValueChange={onSetValueChange} onOpenExerciseRestTimer={onOpenExerciseRestTimer} />
              ))}
            </View>

            <View className="gap-4 pt-2">
              <AppOutlinedActionButton
                theme={resolvedTheme}
                label="Add Exercise"
                onPress={onOpenAddExercise}
                leftIcon={<Dumbbell color={resolvedTheme.accentText} size={18} strokeWidth={2.2} />}
              />
              <AppDangerPillButton
                theme={resolvedTheme}
                label="Discard Workout"
                onPress={onOpenDiscardWorkout}
                leftIcon={<Trash2 color={resolvedTheme.dangerText} size={16} strokeWidth={2.2} />}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      <ActiveWorkoutFloatingTools theme={resolvedTheme} timerChipLabel={timerChipLabel} onOpenRestTimer={onOpenRestTimer} />
      <ActiveWorkoutRestTimerSheet
        isVisible={isRestTimerSheetOpen}
        restTimer={model.restTimer}
        defaultTimerClockLabel={defaultTimerClockLabel}
        restTimerMode={restTimerMode}
        stopwatchClockLabel={stopwatchClockLabel}
        isStopwatchRunning={isStopwatchRunning}
        theme={resolvedTheme}
        onSelectTimerMode={onSelectTimerMode}
        onSelectStopwatchMode={onSelectStopwatchMode}
        onAdjustRestTimer={onAdjustRestTimer}
        onDismissRestTimer={handleDismissRestTimerPress}
        onToggleStopwatch={onToggleStopwatch}
        onCloseRestTimer={onCloseRestTimer}
      />
      <ActiveWorkoutEffortAdjustmentSheet
        isVisible={isPostSetEffortSheetOpen}
        postSetEffortAdjustment={postSetEffortAdjustment}
        theme={resolvedTheme}
        onDecreaseEffort={onDecreaseEffort}
        onIncreaseEffort={onIncreaseEffort}
        onClosePostSetEffortAdjustment={handleClosePostSetEffortAdjustment}
      />
      <ActiveWorkoutSettingsSheet
        isVisible={isWorkoutSettingsSheetOpen}
        title={model.settingsButtonLabel}
        settings={model.workoutSettings}
        theme={resolvedTheme}
        onCloseWorkoutSettings={onCloseWorkoutSettings}
        onUpdateWorkoutSettings={onUpdateWorkoutSettings}
      />
      <ActiveWorkoutExerciseRestTimerSheet
        isVisible={isExerciseRestTimerSheetOpen}
        exercise={selectedExerciseRestTimer}
        theme={resolvedTheme}
        onCloseExerciseRestTimer={onCloseExerciseRestTimer}
        onAdjustExerciseRestTimer={onAdjustExerciseRestTimer}
        onRemoveExerciseRestTimer={onRemoveExerciseRestTimer}
      />
      <ActiveWorkoutFinishWorkoutSheet
        isVisible={isFinishWorkoutSheetOpen}
        theme={resolvedTheme}
        perceivedDifficulty={finishWorkoutPerceivedDifficulty}
        onDecreaseDifficulty={onDecreaseDifficulty}
        onIncreaseDifficulty={onIncreaseDifficulty}
        onCloseFinishWorkoutSheet={onCloseFinishWorkoutSheet}
        onConfirmFinishWorkout={onConfirmFinishWorkout}
      />
      <ActiveWorkoutEmptyWorkoutSheet
        isVisible={isEmptyWorkoutSheetOpen}
        theme={resolvedTheme}
        onCloseEmptyWorkoutSheet={onCloseEmptyWorkoutSheet}
        onConfirmEmptyWorkoutDiscard={onConfirmEmptyWorkoutDiscard}
      />
      <ActiveWorkoutDiscardWorkoutSheet
        isVisible={isDiscardWorkoutSheetOpen}
        theme={resolvedTheme}
        onCloseDiscardWorkout={onCloseDiscardWorkout}
        onConfirmDiscardWorkout={onConfirmDiscardWorkout}
      />
      <ActiveWorkoutAddExerciseSheet
        isVisible={isAddExerciseSheetOpen}
        theme={resolvedTheme}
        availableExercises={availableExercises}
        isLoadingAvailableExercises={isLoadingAvailableExercises}
        availableExercisesError={availableExercisesError}
        selectedAddExerciseIds={selectedAddExerciseIds}
        addExerciseSearchQuery={addExerciseSearchQuery}
        addExerciseTab={addExerciseTab}
        onSearchAddExercise={setAddExerciseSearchQuery}
        onToggleAddExercise={onToggleAddExercise}
        onChangeAddExerciseTab={setAddExerciseTab}
        onCloseAddExercise={onCloseAddExercise}
        onConfirmAddExercises={onConfirmAddExercises}
      />
    </SafeAreaView>
  )
}

export function ActiveWorkoutView({ isVisible, model, theme, onClose, onFinish, onDiscard, canFinishWorkout = true, onAddSet, onDeleteSet, onDeleteExercise, onMoveExercise, onOpenExerciseDetail, onWorkoutNotesChange, onExerciseRestTimeChange, onRemoveExerciseRestTime, onAddExercises, availableExercises, isLoadingAvailableExercises, availableExercisesError, onCompleteSet, onAdjustRestTimer, onDismissRestTimer, onSetValueChange, postSetEffortAdjustment, onPostSetEffortChange, onClosePostSetEffortAdjustment, onUpdateWorkoutSettings }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <ActiveWorkoutViewContent model={model} theme={theme} onClose={onClose} onFinish={onFinish} onDiscard={onDiscard} canFinishWorkout={canFinishWorkout} onAddSet={onAddSet} onDeleteSet={onDeleteSet} onDeleteExercise={onDeleteExercise} onMoveExercise={onMoveExercise} onOpenExerciseDetail={onOpenExerciseDetail} onWorkoutNotesChange={onWorkoutNotesChange} onExerciseRestTimeChange={onExerciseRestTimeChange} onRemoveExerciseRestTime={onRemoveExerciseRestTime} onAddExercises={onAddExercises} availableExercises={availableExercises} isLoadingAvailableExercises={isLoadingAvailableExercises} availableExercisesError={availableExercisesError} onCompleteSet={onCompleteSet} onAdjustRestTimer={onAdjustRestTimer} onDismissRestTimer={onDismissRestTimer} onSetValueChange={onSetValueChange} postSetEffortAdjustment={postSetEffortAdjustment} onPostSetEffortChange={onPostSetEffortChange} onClosePostSetEffortAdjustment={onClosePostSetEffortAdjustment} onUpdateWorkoutSettings={onUpdateWorkoutSettings} />
      </SafeAreaProvider>
    </Modal>
  )
}
