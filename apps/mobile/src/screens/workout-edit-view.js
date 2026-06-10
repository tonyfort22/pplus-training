import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Clock3, Dumbbell, Link2, Mic, Sparkles, Trash2, Zap } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTheme } from '../theme/app-theme.js';
import { AppButton, AppDangerPillButton, AppOutlinedActionButton, AppSurfaceCard } from '../ui/primitives.js';
import { ExerciseMultiSelectView } from './exercise-multi-select-view.js'

function WorkoutThumbnailIcon({ icon, theme }) {
  if (icon === 'arrow-up') return <ArrowUp color={theme.iconMuted} size={22} strokeWidth={2.2} />
  if (icon === 'arrow-down') return <ArrowDown color={theme.iconMuted} size={22} strokeWidth={2.2} />
  if (icon === 'zap') return <Dumbbell color={theme.iconMuted} size={22} strokeWidth={2.2} />
  return <Dumbbell color={theme.iconMuted} size={22} strokeWidth={2.2} />
}

function createDraftFromModel(model) {
  return {
    workoutName: model.title || '',
    workoutNotes: model.workoutNotes || model.notes || '',
    exercises: model.exercises.map((exercise) => ({
      ...exercise,
      notes: '',
      sets: exercise.sets.map((set) => ({
        ...set,
        effort: String(set.effort),
        load: String(set.load),
        reps: String(set.reps),
      })),
    })),
  }
}

function parseRestLabelToSeconds(restLabel) {
  if (!restLabel || typeof restLabel !== 'string') return 0

  const [minutesPart = '0', secondsPart = '0'] = restLabel.split(':')
  const minutes = Number.parseInt(minutesPart, 10) || 0
  const seconds = Number.parseInt(secondsPart, 10) || 0
  return minutes * 60 + seconds
}

function formatRestSeconds(restSeconds) {
  const safeSeconds = Math.max(0, Number(restSeconds) || 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatRestSheetTime(restSeconds) {
  const safeSeconds = Math.max(0, Number(restSeconds) || 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function WorkoutEditCellInput({ value, onChangeText, widthClass, theme }) {
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

function SwipeableSetRow({ children, onDelete, theme }) {
  function renderRightActions() {
    return (
      <RectButton
        onPress={onDelete}
        style={{ backgroundColor: 'transparent', alignItems: 'center', height: '100%', justifyContent: 'center', width: 96 }}
      >
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.dangerSurface,
            borderColor: theme.dangerBorder,
            height: 50,
            width: 72,
            borderRadius: 18,
            borderWidth: 1,
            justifyContent: 'center',
          }}
        >
          <Trash2 color={theme.dangerText} size={18} strokeWidth={2.2} />
        </View>
      </RectButton>
    )
  }

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={renderRightActions}
      rightThreshold={48}
    >
      <View className="w-full overflow-hidden rounded-[18px]">
        {children}
      </View>
    </Swipeable>
  )
}

function WorkoutEditSetTable({ exercise, onSetValueChange, onDeleteSet, theme }) {
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
          <SwipeableSetRow key={set.id} onDelete={() => onDeleteSet(exercise.id, set.id)} theme={theme}>
            <View className="min-h-[50px] flex-row items-center" style={{ backgroundColor: theme.background }}>
              <Text className="w-24 text-center text-[15px]" style={{ color: theme.text }}>{set.setNumber}</Text>
              <WorkoutEditCellInput
                value={set.effort}
                widthClass="flex-1"
                theme={theme}
                onChangeText={(nextValue) => onSetValueChange(exercise.id, set.id, 'effort', nextValue)}
              />
              <WorkoutEditCellInput
                value={set.load}
                widthClass="flex-1"
                theme={theme}
                onChangeText={(nextValue) => onSetValueChange(exercise.id, set.id, 'load', nextValue)}
              />
              <WorkoutEditCellInput
                value={set.reps}
                widthClass="flex-1"
                theme={theme}
                onChangeText={(nextValue) => onSetValueChange(exercise.id, set.id, 'reps', nextValue)}
              />
            </View>
          </SwipeableSetRow>
        ))}
      </View>
    </View>
  )
}

function WorkoutEditExerciseControls({ exercise, addSetLabel, onAddSet, onOpenRestTimerSheet, theme }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <GlassActionSurface className="h-11 w-11" theme={theme}>
        <Pressable className="h-11 w-11 items-center justify-center" onPress={() => {}}>
          <Link2 color={theme.accentText} size={18} strokeWidth={2.2} />
        </Pressable>
      </GlassActionSurface>

      <GlassActionSurface className="min-w-[112px]" theme={theme}>
        <Pressable className="flex-row items-center justify-center gap-2 px-4 py-3" onPress={() => onAddSet(exercise.id)}>
          <Text className="text-[18px] font-semibold" style={{ color: theme.accentText }}>+</Text>
          <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>{addSetLabel || 'Add Set'}</Text>
        </Pressable>
      </GlassActionSurface>

      <View className="flex-1 flex-row items-center justify-end gap-2">
        <GlassActionSurface theme={theme}>
          <Pressable className="flex-row items-center gap-1.5 px-3 py-3" onPress={() => onOpenRestTimerSheet?.(exercise)}>
            <Clock3 color={theme.accentText} size={17} strokeWidth={2.2} />
            <Text className="text-[14px] font-semibold" style={{ color: theme.accentText }}>{exercise.restLabel}</Text>
          </Pressable>
        </GlassActionSurface>
      </View>
    </View>
  )
}

function WorkoutEditExerciseBlock({
  exercise,
  exerciseNotesPlaceholder,
  addSetLabel,
  onExerciseNotesChange,
  onSetValueChange,
  onDeleteSet,
  onAddSet,
  onOpenExerciseDetail,
  onOpenRestTimerSheet,
  onMoveExerciseUp,
  onMoveExerciseDown,
  canMoveExerciseUp,
  canMoveExerciseDown,
  theme,
}) {
  return (
    <View className="gap-5">
      <View className="flex-row items-start gap-3">
        <AppSurfaceCard
          theme={theme}
          containerClassName="h-14 w-14 rounded-[18px] overflow-hidden"
          contentClassName="h-full items-center justify-center"
        >
          <WorkoutThumbnailIcon icon={exercise.thumbnailIcon} theme={theme} />
        </AppSurfaceCard>
        <View className="flex-1 gap-2 pt-0.5">
          <Pressable onPress={() => onOpenExerciseDetail?.(exercise)}>
            <Text className="text-[22px] font-semibold leading-[28px]" style={{ color: theme.text }}>{exercise.name}</Text>
          </Pressable>
          <TextInput
            className="min-h-[20px] px-0 py-0.5 text-[14px] leading-[18px]"
            multiline
            onChangeText={(nextValue) => onExerciseNotesChange(exercise.id, nextValue)}
            placeholder={exerciseNotesPlaceholder || 'Add Notes'}
            placeholderTextColor={theme.textSoft}
            style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: theme.textMuted }}
            value={exercise.notes}
          />
        </View>
        <View className="flex-row gap-2">
          <AppSurfaceCard
            theme={theme}
            containerClassName="h-10 w-10 rounded-[14px] overflow-hidden"
            contentClassName="h-full items-center justify-center"
          >
            <Pressable className="h-10 w-10 items-center justify-center" disabled={!canMoveExerciseUp} onPress={() => onMoveExerciseUp?.(exercise.id)}>
              <ArrowUp color={canMoveExerciseUp ? theme.accentText : theme.iconMuted} size={17} strokeWidth={2.2} />
            </Pressable>
          </AppSurfaceCard>
          <AppSurfaceCard
            theme={theme}
            containerClassName="h-10 w-10 rounded-[14px] overflow-hidden"
            contentClassName="h-full items-center justify-center"
          >
            <Pressable className="h-10 w-10 items-center justify-center" disabled={!canMoveExerciseDown} onPress={() => onMoveExerciseDown?.(exercise.id)}>
              <ArrowDown color={canMoveExerciseDown ? theme.accentText : theme.iconMuted} size={17} strokeWidth={2.2} />
            </Pressable>
          </AppSurfaceCard>
        </View>
      </View>

      <WorkoutEditSetTable exercise={exercise} onSetValueChange={onSetValueChange} onDeleteSet={onDeleteSet} theme={theme} />
      <WorkoutEditExerciseControls
        exercise={exercise}
        addSetLabel={addSetLabel}
        onAddSet={onAddSet}
        onOpenRestTimerSheet={onOpenRestTimerSheet}
        theme={theme}
      />
    </View>
  )
}

function WorkoutEditRestTimerSheet({ isVisible, exercise, onClose, onAdjustTime, onRemove, theme }) {
  const insets = useSafeAreaInsets()

  if (!exercise) return null

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: theme.overlay }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="rounded-t-[28px] px-5 pt-5"
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.backgroundMuted,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          <Text className="text-center text-[20px] font-semibold" style={{ color: theme.text }}>Edit Rest Timer</Text>
          <View className="mt-4 h-px" style={{ backgroundColor: theme.border }} />

          <View className="flex-row items-center justify-between py-6">
            <Pressable className="px-2 py-2" onPress={() => onAdjustTime(-15)}>
              <Text className="text-[22px] font-semibold" style={{ color: theme.accentText }}>-15s</Text>
            </Pressable>
            <Text className="text-[32px] font-bold tracking-[1px]" style={{ color: theme.text }}>{formatRestSheetTime(parseRestLabelToSeconds(exercise.restLabel))}</Text>
            <Pressable className="px-2 py-2" onPress={() => onAdjustTime(15)}>
              <Text className="text-[22px] font-semibold" style={{ color: theme.accentText }}>+15s</Text>
            </Pressable>
          </View>

          <AppButton theme={theme} label="Remove" tone="ghost" onPress={onRemove} />
        </View>
      </View>
    </Modal>
  )
}

function WorkoutEditFloatingTools({ theme }) {
  return (
    <GlassActionSurface
      className="absolute bottom-16 right-6 flex-row items-center rounded-[24px]"
      theme={theme}
      style={{
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      }}
    >
      <Pressable className="px-8 py-7" onPress={() => {}}>
        <Sparkles color={theme.accentText} size={22} strokeWidth={2.2} />
      </Pressable>
      <View className="h-12 w-px" style={{ backgroundColor: theme.accentBorder }} />
      <Pressable className="px-8 py-7" onPress={() => {}}>
        <Mic color={theme.accentText} size={22} strokeWidth={2.2} />
      </Pressable>
    </GlassActionSurface>
  )
}

function WorkoutEditDeleteConfirmationModal({ isVisible, onClose, onConfirm, isDeleting = false, errorMessage = '', theme }) {
  if (!isVisible) return null

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center px-5" style={{ backgroundColor: theme.overlay }}>
        <View
          className="self-center w-full max-w-[340px] rounded-[28px] px-5 py-5"
          style={{ backgroundColor: theme.backgroundMuted, borderWidth: 1, borderColor: theme.border }}
        >
          <View className="flex-row items-start justify-between gap-4">
            <Text className="flex-1 text-[26px] font-bold leading-[30px]" style={{ color: theme.text }}>Delete Workout</Text>
            <Pressable className="px-1 py-2" onPress={onClose}>
              <Text className="text-[20px] font-semibold" style={{ color: theme.textSoft }}>✕</Text>
            </Pressable>
          </View>

          <Text className="mt-3 text-[15px] leading-[22px]" style={{ color: theme.textMuted }}>
            Are you sure you want to delete this workout? This action cannot be undone.
          </Text>

          {errorMessage ? (
            <Text className="mt-3 text-[14px] leading-[20px]" style={{ color: theme.dangerText }}>{errorMessage}</Text>
          ) : null}

          <Pressable
            className="mt-6 items-center justify-center rounded-[16px] px-5 py-4"
            disabled={isDeleting}
            onPress={onConfirm}
            style={{ borderWidth: 1, borderColor: theme.dangerText, backgroundColor: 'transparent', opacity: isDeleting ? 0.6 : 1 }}
          >
            <Text className="text-[15px] font-semibold" style={{ color: theme.dangerText }}>{isDeleting ? 'Deleting…' : 'Delete'}</Text>
          </Pressable>

          <Pressable className="mt-4 items-center justify-center px-4 py-2" disabled={isDeleting} onPress={onClose}>
            <Text className="text-[15px]" style={{ color: theme.textSoft }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function WorkoutEditViewContent({ model, onClose, onSave, onAddSet, onDeleteSet, onMoveExercise, onOpenExerciseDetail, onAddExercise, onAddExercises, onOpenDeleteWorkout, onCloseDeleteWorkoutModal, onConfirmDeleteWorkout, isDeleteWorkoutModalOpen = false, isDeletingWorkout = false, deleteWorkoutErrorMessage = '', theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const [draft, setDraft] = useState(() => (model ? createDraftFromModel(model) : null))
  const [restTimerSheetExerciseId, setRestTimerSheetExerciseId] = useState(null)
  const [isAddExerciseViewOpen, setIsAddExerciseViewOpen] = useState(false)
  const [selectedAddExerciseIds, setSelectedAddExerciseIds] = useState([])
  const [addExerciseSearchQuery, setAddExerciseSearchQuery] = useState('')

  useEffect(() => {
    if (!model) {
      setDraft(null)
      setRestTimerSheetExerciseId(null)
      return
    }

    setDraft(createDraftFromModel(model))
    setRestTimerSheetExerciseId(null)
  }, [model])

  if (!model || !draft) return null

  const restTimerSheetExercise = draft.exercises.find((exercise) => exercise.id === restTimerSheetExerciseId) || null

  function updateExerciseRestLabel(exerciseId, nextRestSeconds) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              restLabel: formatRestSeconds(nextRestSeconds),
            }
          : exercise
      ),
    }))
  }

  function handleOpenRestTimerSheet(exercise) {
    setRestTimerSheetExerciseId(exercise?.id || null)
  }

  function handleCloseRestTimerSheet() {
    setRestTimerSheetExerciseId(null)
  }

  function resequenceExercises(exercises) {
    return exercises.map((exercise, index) => ({
      ...exercise,
      sortOrder: index + 1,
      sortOrderLabel: String(index + 1),
    }))
  }

  function getReorderedExercises(exercises, exerciseId, direction) {
    const currentIndex = exercises.findIndex((exercise) => exercise.id === exerciseId)
    if (currentIndex < 0) return exercises

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= exercises.length) return exercises

    const nextExercises = [...exercises]
    const [movedExercise] = nextExercises.splice(currentIndex, 1)
    nextExercises.splice(targetIndex, 0, movedExercise)
    return resequenceExercises(nextExercises)
  }

  async function handleMoveExerciseUp(exerciseId) {
    if (!exerciseId) return
    const moveResult = await onMoveExercise?.(exerciseId, 'up')
    if (moveResult === false) return

    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: getReorderedExercises(currentDraft.exercises, exerciseId, 'up'),
    }))
  }

  async function handleMoveExerciseDown(exerciseId) {
    if (!exerciseId) return
    const moveResult = await onMoveExercise?.(exerciseId, 'down')
    if (moveResult === false) return

    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: getReorderedExercises(currentDraft.exercises, exerciseId, 'down'),
    }))
  }

  function handleAdjustRestTimer(delta) {
    if (!restTimerSheetExercise) return

    const nextRestSeconds = parseRestLabelToSeconds(restTimerSheetExercise.restLabel) + delta
    updateExerciseRestLabel(restTimerSheetExercise.id, nextRestSeconds)
  }

  function handleRemoveRestTimer() {
    if (!restTimerSheetExercise) return

    updateExerciseRestLabel(restTimerSheetExercise.id, 0)
    setRestTimerSheetExerciseId(null)
  }

  function handleWorkoutNotesChange(nextValue) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      workoutNotes: nextValue,
    }))
  }

  function handleExerciseNotesChange(exerciseId, nextValue) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, notes: nextValue } : exercise
      ),
    }))
  }

  function handleSetValueChange(exerciseId, setId, field, nextValue) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: nextValue.replace(/[^0-9.-]/g, '') } : set
              ),
            }
          : exercise
      ),
    }))
  }

  async function handleDeleteSet(exerciseId, setId) {
    const deleteResult = await onDeleteSet?.(exerciseId, setId)
    if (deleteResult === false) return

    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((currentExercise) =>
        currentExercise.id === exerciseId
          ? {
              ...currentExercise,
              sets: currentExercise.sets.filter((set) => set.id !== setId).map((set, index) => ({
                ...set,
                sortOrder: index + 1,
                setNumber: index + 1,
              })),
            }
          : currentExercise
      ),
    }))
  }

  async function handleAddSet(exerciseId) {
    const exercise = draft.exercises.find((item) => item.id === exerciseId)
    if (!exercise) return

    const lastSet = exercise.sets.at(-1)
    const nextSortOrder = Math.max(0, ...exercise.sets.map((set) => Number(set.sortOrder) || 0)) + 1
    const tempSetId = `${exerciseId}-draft-set-${nextSortOrder}`

    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((currentExercise) => {
        if (currentExercise.id !== exerciseId) return currentExercise

        return {
          ...currentExercise,
          sets: [
            ...currentExercise.sets,
            {
              id: tempSetId,
              programWorkoutSetId: null,
              sortOrder: nextSortOrder,
              setType: lastSet?.setType || 'straight',
              prescribedRestSeconds: lastSet?.prescribedRestSeconds ?? parseRestLabelToSeconds(currentExercise.restLabel),
              targetLoadUnit: lastSet?.targetLoadUnit || 'lb',
              setNumber: currentExercise.sets.length + 1,
              effort: lastSet?.effort ?? '',
              load: lastSet?.load ?? '',
              reps: lastSet?.reps ?? '',
            },
          ],
        }
      }),
    }))

    const persistedSet = await onAddSet?.(exerciseId)
    if (!persistedSet) return

    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((currentExercise) =>
        currentExercise.id === exerciseId
          ? {
              ...currentExercise,
              sets: currentExercise.sets.map((set) =>
                set.id === tempSetId
                  ? {
                      ...set,
                      ...persistedSet,
                      setNumber: persistedSet.setNumber ?? set.setNumber,
                    }
                  : set
              ),
            }
          : currentExercise
      ),
    }))
  }

  function handleToggleAddExercise(exerciseId) {
    setSelectedAddExerciseIds((currentValue) => currentValue.includes(exerciseId)
      ? currentValue.filter((id) => id !== exerciseId)
      : [...currentValue, exerciseId])
  }

  function handleOpenAddExercise() {
    setIsAddExerciseViewOpen(true)
    onAddExercise?.()
  }

  function handleCloseAddExercise() {
    setIsAddExerciseViewOpen(false)
    setSelectedAddExerciseIds([])
    setAddExerciseSearchQuery('')
  }

  async function handleConfirmAddExercises() {
    await onAddExercises?.(selectedAddExerciseIds)
    handleCloseAddExercise()
  }

  if (isAddExerciseViewOpen) {
    return (
      <ExerciseMultiSelectView
        isVisible={isAddExerciseViewOpen}
        presentation="inline"
        theme={resolvedTheme}
        sheet={model.addExerciseSheet}
        selectedExerciseIds={selectedAddExerciseIds}
        onToggleExercise={handleToggleAddExercise}
        searchQuery={addExerciseSearchQuery}
        onSearchChange={setAddExerciseSearchQuery}
        onAddExercises={handleConfirmAddExercises}
        onClose={handleCloseAddExercise}
      />
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <Pressable className="px-1 py-2" onPress={onClose}>
            <Text className="text-[17px]" style={{ color: resolvedTheme.textMuted }}>{model.cancelLabel || 'Cancel'}</Text>
          </Pressable>
          <Pressable className="px-1 py-2" onPress={() => onSave?.(draft)}>
            <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.accentText }}>{model.editLabel || 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>
          <View className="gap-9">
            <View className="gap-3">
              <TextInput
                className="px-0 py-1 text-[28px] font-bold leading-[32px]"
                onChangeText={(nextValue) => setDraft((currentDraft) => ({ ...currentDraft, workoutName: nextValue }))}
                placeholder={model.workoutNamePlaceholder || 'Workout name'}
                placeholderTextColor={resolvedTheme.textSoft}
                style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: resolvedTheme.text }}
                value={draft.workoutName}
              />
              <TextInput
                className="min-h-[24px] px-0 py-1 text-[15px] leading-[20px]"
                multiline
                onChangeText={handleWorkoutNotesChange}
                placeholder={model.workoutNotesPlaceholder || 'Add notes'}
                placeholderTextColor={resolvedTheme.textSoft}
                style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: resolvedTheme.text }}
                value={draft.workoutNotes}
              />
            </View>

            <View className="gap-9">
              {draft.exercises.map((exercise, exerciseIndex) => (
                <WorkoutEditExerciseBlock
                  key={exercise.id}
                  exercise={exercise}
                  exerciseNotesPlaceholder={model.exerciseNotesPlaceholder}
                  addSetLabel={model.addSetLabel}
                  onExerciseNotesChange={handleExerciseNotesChange}
                  onSetValueChange={handleSetValueChange}
                  onDeleteSet={handleDeleteSet}
                  onAddSet={handleAddSet}
                  onOpenExerciseDetail={onOpenExerciseDetail}
                  onOpenRestTimerSheet={handleOpenRestTimerSheet}
                  onMoveExerciseUp={handleMoveExerciseUp}
                  onMoveExerciseDown={handleMoveExerciseDown}
                  canMoveExerciseUp={exerciseIndex > 0}
                  canMoveExerciseDown={exerciseIndex < draft.exercises.length - 1}
                  theme={resolvedTheme}
                />
              ))}

              <AppOutlinedActionButton
                theme={resolvedTheme}
                label={model.addExerciseLabel || 'Add Exercise'}
                onPress={handleOpenAddExercise}
                leftIcon={<Dumbbell color={resolvedTheme.accentText} size={18} strokeWidth={2.2} />}
              />

              <AppDangerPillButton
                theme={resolvedTheme}
                label={model.deleteLabel || 'Delete Workout'}
                onPress={onOpenDeleteWorkout}
                leftIcon={<Trash2 color={resolvedTheme.dangerText} size={16} strokeWidth={2.2} />}
                style={{ marginTop: 20 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {draft.exercises.length > 0 ? <WorkoutEditFloatingTools theme={resolvedTheme} /> : null}
      <WorkoutEditRestTimerSheet
        isVisible={Boolean(restTimerSheetExercise)}
        exercise={restTimerSheetExercise}
        onClose={handleCloseRestTimerSheet}
        onAdjustTime={handleAdjustRestTimer}
        onRemove={handleRemoveRestTimer}
        theme={resolvedTheme}
      />
      <WorkoutEditDeleteConfirmationModal
        isVisible={isDeleteWorkoutModalOpen}
        onClose={onCloseDeleteWorkoutModal}
        onConfirm={onConfirmDeleteWorkout}
        isDeleting={isDeletingWorkout}
        errorMessage={deleteWorkoutErrorMessage}
        theme={resolvedTheme}
      />
    </SafeAreaView>
  )
}

export function WorkoutEditView({ isVisible, model, onClose, onSave, onAddSet, onDeleteSet, onMoveExercise, onOpenExerciseDetail, onAddExercise, onAddExercises, onOpenDeleteWorkout, onCloseDeleteWorkoutModal, onConfirmDeleteWorkout, isDeleteWorkoutModalOpen = false, isDeletingWorkout = false, deleteWorkoutErrorMessage = '', theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <WorkoutEditViewContent model={model} onClose={onClose} onSave={onSave} onAddSet={onAddSet} onDeleteSet={onDeleteSet} onMoveExercise={onMoveExercise} onOpenExerciseDetail={onOpenExerciseDetail} onAddExercise={onAddExercise} onAddExercises={onAddExercises} onOpenDeleteWorkout={onOpenDeleteWorkout} onCloseDeleteWorkoutModal={onCloseDeleteWorkoutModal} onConfirmDeleteWorkout={onConfirmDeleteWorkout} isDeleteWorkoutModalOpen={isDeleteWorkoutModalOpen} isDeletingWorkout={isDeletingWorkout} deleteWorkoutErrorMessage={deleteWorkoutErrorMessage} theme={theme} />
      </SafeAreaProvider>
    </Modal>
  )
}
