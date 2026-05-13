import { useEffect, useRef, useState } from 'react';
import { CircleMinus, Dumbbell, Image as ImageIcon, Info, Plus, Trash2 } from 'lucide-react-native';
import { Image, InteractionManager, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTheme } from '../theme/app-theme.js';
import { AppButton, AppSearchInput, AppSelectionIndicator, AppSurfaceCard } from '../ui/primitives.js'
import { ExerciseMultiSelectView } from './exercise-multi-select-view.js';

function ProgramEditDayRow({ day, theme, onOpenAddWorkout }) {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="w-12 shrink-0">
        <Text className="text-[14px] font-semibold uppercase" style={{ color: theme.textSoft }}>{day.dayLabel}</Text>
      </View>

      {day.isAssigned ? (
        <>
          <AppSurfaceCard
            theme={theme}
            containerClassName="flex-1 rounded-[22px] overflow-hidden"
            contentClassName="px-5 py-4"
          >
            <Text className="text-[16px] font-semibold" style={{ color: theme.text }}>{day.routineLabel}</Text>
          </AppSurfaceCard>
          <Pressable className="h-9 w-9 items-center justify-center rounded-full" style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }}>
            <CircleMinus color={theme.iconMuted} size={18} strokeWidth={2.2} />
          </Pressable>
        </>
      ) : (
        <Pressable className="flex-1 px-1 py-4" onPress={() => onOpenAddWorkout?.(day)}>
          <Text className="text-[16px] font-semibold" style={{ color: theme.accent }}>{day.actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

function ProgramEditOptionRow({ option, theme, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-[24px] px-5 py-4"
      style={{
        borderWidth: 1,
        borderColor: option.isSelected ? theme.accentBorder : theme.border,
        backgroundColor: option.isSelected ? theme.accentSurface : theme.surface,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[18px] font-semibold" style={{ color: option.isSelected ? theme.accentText : theme.text }}>{option.label}</Text>
          <Text className="text-[14px]" style={{ color: option.isSelected ? theme.accentText : theme.textSoft }}>{option.valueLabel}</Text>
        </View>
        {option.isSelected ? <AppSelectionIndicator theme={theme} selected /> : null}
      </View>
    </Pressable>
  )
}

const END_DATE_WHEEL_ROW_HEIGHT = 72
const END_DATE_WHEEL_VISIBLE_ROWS = 5
const END_DATE_WHEEL_FADE_STOPS = [0.92, 0.68, 0.4, 0.18]

function ProgramEndDateWheel({ sheet, theme, onSelectOption }) {
  const scrollRef = useRef(null)
  const selectedIndex = Math.max(0, sheet.options.findIndex((option) => option.isSelected))

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * END_DATE_WHEEL_ROW_HEIGHT, animated: false })
  }, [selectedIndex, sheet])

  function handleMomentumScrollEnd(event) {
    const offsetY = event?.nativeEvent?.contentOffset?.y || 0
    const index = Math.max(0, Math.min(sheet.options.length - 1, Math.round(offsetY / END_DATE_WHEEL_ROW_HEIGHT)))
    const option = sheet.options[index]
    if (option) {
      onSelectOption(option.id)
    }
  }

  return (
    <View
      className="relative overflow-hidden rounded-[28px]"
      style={{
        height: END_DATE_WHEEL_ROW_HEIGHT * END_DATE_WHEEL_VISIBLE_ROWS,
      }}
    >
      <View
        className="absolute inset-x-0 rounded-[24px]"
        style={{
          top: END_DATE_WHEEL_ROW_HEIGHT * Math.floor(END_DATE_WHEEL_VISIBLE_ROWS / 2),
          borderWidth: 1,
          borderColor: theme.accentBorder,
          backgroundColor: theme.accentSurface,
          height: END_DATE_WHEEL_ROW_HEIGHT,
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={END_DATE_WHEEL_ROW_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{ paddingVertical: END_DATE_WHEEL_ROW_HEIGHT * Math.floor(END_DATE_WHEEL_VISIBLE_ROWS / 2) }}
      >
        {sheet.options.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => onSelectOption(option.id)}
            className="items-center justify-center px-5"
            style={{ height: END_DATE_WHEEL_ROW_HEIGHT }}
          >
            <Text className="text-[22px] font-semibold" style={{ color: option.isSelected ? theme.accentText : theme.text }}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {END_DATE_WHEEL_FADE_STOPS.map((opacity, index) => (
        <View
          key={`top-fade-${index}`}
          pointerEvents="none"
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            top: index * (END_DATE_WHEEL_ROW_HEIGHT / 2.5),
            height: END_DATE_WHEEL_ROW_HEIGHT / 1.6,
            backgroundColor: theme.surfaceElevated,
            opacity,
          }}
        />
      ))}
      {END_DATE_WHEEL_FADE_STOPS.map((opacity, index) => (
        <View
          key={`bottom-fade-${index}`}
          pointerEvents="none"
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            bottom: index * (END_DATE_WHEEL_ROW_HEIGHT / 2.5),
            height: END_DATE_WHEEL_ROW_HEIGHT / 1.6,
            backgroundColor: theme.surfaceElevated,
            opacity,
          }}
        />
      ))}
    </View>
  )
}

function ProgramAddWorkoutSheet({ isVisible, theme, sheet, onOpenCreateWorkout, onClose }) {
  if (!sheet) return null

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: theme.overlay }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="rounded-t-[30px] px-5 pb-6 pt-4"
          style={{ backgroundColor: theme.surfaceElevated }}
        >
          <View className="mb-4 items-center">
            <View className="h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.borderStrong }} />
          </View>
          <Text className="mb-5 text-center text-[22px] font-bold" style={{ color: theme.text }}>{sheet.title}</Text>

          <Pressable
            className="mb-5 flex-row items-center justify-between rounded-[24px] px-5 py-4"
            style={{ borderWidth: 1, borderColor: theme.accentBorder, backgroundColor: theme.surface }}
            onPress={onOpenCreateWorkout}
          >
            <Text className="text-[17px] font-semibold" style={{ color: theme.accentText }}>{sheet.createWorkoutLabel}</Text>
            <Plus color={theme.accentText} size={18} strokeWidth={2.4} />
          </Pressable>

          <Text className="mb-3 text-[14px] font-medium" style={{ color: theme.textSoft }}>{sheet.programRoutinesLabel}</Text>
          <ScrollView style={{ maxHeight: 360, flexGrow: 0 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <View className="gap-3 pb-1">
              {sheet.routines.map((routine) => (
                <AppSurfaceCard
                  key={routine.id}
                  theme={theme}
                  containerClassName="rounded-[22px] overflow-hidden"
                  contentClassName="flex-row items-center justify-between px-5 py-4"
                >
                  <Text className="text-[16px] font-semibold" style={{ color: theme.text }}>{routine.label}</Text>
                  <View className="h-8 w-8 items-center justify-center rounded-full" style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surfaceMuted }}>
                    <Info color={theme.iconMuted} size={15} strokeWidth={2.4} />
                  </View>
                </AppSurfaceCard>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function ProgramCreateWorkoutView({ isVisible, theme, model, onOpenAddExercise, onClose, onSave }) {
  const resolvedTheme = theme || getAppTheme('dark')
  const [routineName, setRoutineName] = useState('')
  const [routineNotes, setRoutineNotes] = useState('')

  useEffect(() => {
    if (isVisible) {
      setRoutineName('')
      setRoutineNotes('')
    }
  }, [isVisible, model])

  if (!model) return null

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
          <View className="flex-1 px-5 pb-6">
            <View className="mb-7 flex-row items-center justify-between">
              <Pressable onPress={onClose}>
                <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.textSoft }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onSave}>
                <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.accent }}>Save</Text>
              </Pressable>
            </View>

            <View className="flex-1 gap-8">
              <View className="gap-2">
                <TextInput
                  value={routineName}
                  onChangeText={setRoutineName}
                  placeholder={model.title}
                  placeholderTextColor={resolvedTheme.textMuted}
                  className="px-0 py-0 text-[34px] font-bold"
                  style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: resolvedTheme.text }}
                />
                <TextInput
                  value={routineNotes}
                  onChangeText={setRoutineNotes}
                  placeholder={model.notesPlaceholder}
                  placeholderTextColor={resolvedTheme.textSoft}
                  multiline
                  className="px-0 py-0 text-[16px]"
                  style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: resolvedTheme.textSoft }}
                />
              </View>

              <Pressable
                className="flex-row items-center justify-center gap-3 rounded-[24px] px-5 py-5"
                style={{ borderWidth: 1, borderColor: resolvedTheme.accentBorder, backgroundColor: resolvedTheme.surface }}
                onPress={onOpenAddExercise}
              >
                <Dumbbell color={resolvedTheme.accentText} size={18} strokeWidth={2.2} />
                <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.accentText }}>{model.addExerciseLabel}</Text>
              </Pressable>

              <AppButton
                theme={resolvedTheme}
                label={model.deleteLabel}
                tone="danger"
                leftIcon={<Trash2 color={resolvedTheme.dangerText} size={16} strokeWidth={2.4} />}
              />
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  )
}

function ProgramAddExerciseSheet({ isVisible, theme, sheet, selectedExerciseIds, onToggleExercise, searchQuery, onSearchChange, onAddExercises, onClose }) {
  return (
    <ExerciseMultiSelectView
      isVisible={isVisible}
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

function ProgramDateOptionSheet({ isVisible, theme, sheet, onSelectOption, onClose }) {
  if (!sheet) return null

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" onPress={onClose} style={{ backgroundColor: theme.overlay }}>
        <Pressable
          onPress={() => {}}
          className="rounded-t-[30px] px-5 pb-6 pt-4"
          style={{ backgroundColor: theme.surfaceElevated }}
        >
          <View className="mb-4 items-center">
            <View className="h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.borderStrong }} />
          </View>
          <Text className="mb-5 text-center text-[22px] font-bold" style={{ color: theme.text }}>{sheet.title}</Text>
          {sheet.variant === 'wheel' ? (
            <ProgramEndDateWheel sheet={sheet} theme={theme} onSelectOption={onSelectOption} />
          ) : (
            <View className="gap-3">
              {sheet.options.map((option) => (
                <ProgramEditOptionRow
                  key={option.id}
                  option={option}
                  theme={theme}
                  onPress={() => onSelectOption(option.id)}
                />
              ))}
            </View>
          )}
          <AppButton theme={theme} label={sheet.doneLabel} tone="primary" onPress={onClose} style={{ marginTop: 20 }} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function ProgramEditViewContent({ model, theme, onClose, onSave }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const [isStartDateSheetOpen, setIsStartDateSheetOpen] = useState(false)
  const [isEndDateSheetOpen, setIsEndDateSheetOpen] = useState(false)
  const [isAddWorkoutSheetOpen, setIsAddWorkoutSheetOpen] = useState(false)
  const [isCreateWorkoutViewOpen, setIsCreateWorkoutViewOpen] = useState(false)
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false)
  const [selectedAddWorkoutDayId, setSelectedAddWorkoutDayId] = useState(null)
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([])
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('')
  const [selectedStartDateValue, setSelectedStartDateValue] = useState(model?.startDateSheet?.selectedValue || null)
  const [selectedEndDateValue, setSelectedEndDateValue] = useState(model?.endDateSheet?.selectedValue || null)

  useEffect(() => {
    setIsStartDateSheetOpen(false)
    setIsEndDateSheetOpen(false)
    setIsAddWorkoutSheetOpen(false)
    setIsCreateWorkoutViewOpen(false)
    setIsAddExerciseSheetOpen(false)
    setSelectedAddWorkoutDayId(null)
    setSelectedExerciseIds([])
    setExerciseSearchQuery('')
    setSelectedStartDateValue(model?.startDateSheet?.selectedValue || null)
    setSelectedEndDateValue(model?.endDateSheet?.selectedValue || null)
  }, [model])

  if (!model) return null

  const startDateSheet = {
    ...model.startDateSheet,
    options: (model.startDateSheet?.options || []).map((option) => ({
      ...option,
      isSelected: option.value === selectedStartDateValue,
    })),
  }

  const endDateSheet = {
    ...model.endDateSheet,
    options: (model.endDateSheet?.options || []).map((option) => ({
      ...option,
      isSelected: option.value === selectedEndDateValue,
    })),
  }

  const selectedStartDateOption = startDateSheet.options.find((option) => option.isSelected) || startDateSheet.options[0] || null
  const selectedEndDateOption = endDateSheet.options.find((option) => option.isSelected) || endDateSheet.options[0] || null
  const startDateLabel = selectedStartDateOption?.id === 'custom'
    ? model.startDateLabel
    : selectedStartDateOption?.valueLabel?.replace(/^[A-Za-z]+,\s*/, '') || model.startDateLabel
  const endDateLabel = selectedEndDateOption?.valueLabel || model.endDateLabel

  function handleSelectStartDateOption(optionId) {
    const option = startDateSheet.options.find((item) => item.id === optionId)
    if (!option) return
    setSelectedStartDateValue(option.value)
  }

  function handleSelectEndDateOption(optionId) {
    const option = endDateSheet.options.find((item) => item.id === optionId)
    if (!option) return
    setSelectedEndDateValue(option.value)
  }

  function handleOpenAddWorkout(day) {
    setSelectedAddWorkoutDayId(day?.id || null)
    setIsAddWorkoutSheetOpen(true)
  }

  function handleOpenCreateWorkout() {
    setIsAddWorkoutSheetOpen(false)
    setSelectedAddWorkoutDayId(null)
    InteractionManager.runAfterInteractions(() => {
      setIsCreateWorkoutViewOpen(true)
    })
  }

  function handleToggleExercise(exerciseId) {
    setSelectedExerciseIds((current) => {
      if (current.includes(exerciseId)) {
        return current.filter((id) => id !== exerciseId)
      }
      return [...current, exerciseId]
    })
  }

  function handleOpenAddExercise() {
    setIsCreateWorkoutViewOpen(false)
    InteractionManager.runAfterInteractions(() => {
      setIsAddExerciseSheetOpen(true)
    })
  }

  function handleAddExercises() {
    setIsAddExerciseSheetOpen(false)
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="px-5 pb-6" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <Pressable onPress={onClose}>
            <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.textSoft }}>{model.cancelLabel}</Text>
          </Pressable>
          <Pressable onPress={onSave}>
            <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.accent }}>{model.saveLabel}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          <View className="gap-8">
            <Text className="text-[34px] font-bold" style={{ color: resolvedTheme.text }}>{model.title}</Text>

            <View className="gap-3.5">
              <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.textSoft }}>{model.programDatesLabel}</Text>
              <View className="flex-row gap-3">
                <AppSurfaceCard
                  theme={resolvedTheme}
                  onPress={() => setIsStartDateSheetOpen(true)}
                  containerClassName="flex-1 rounded-[22px] overflow-hidden"
                  contentClassName="gap-1.5 px-4 py-4"
                >
                  <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.textSoft }}>Start Date</Text>
                  <Text className="text-[18px] font-semibold" style={{ color: resolvedTheme.text }}>{startDateLabel}</Text>
                </AppSurfaceCard>
                <AppSurfaceCard
                  theme={resolvedTheme}
                  onPress={() => setIsEndDateSheetOpen(true)}
                  containerClassName="flex-1 rounded-[22px] overflow-hidden"
                  contentClassName="gap-1.5 px-4 py-4"
                >
                  <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.textSoft }}>End Date</Text>
                  <Text className="text-[18px] font-semibold" style={{ color: resolvedTheme.text }}>{endDateLabel}</Text>
                </AppSurfaceCard>
              </View>
            </View>

            <View className="gap-3.5">
              <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.textSoft }}>{model.trainingSplitLabel}</Text>
              <View className="gap-1.5">
                {model.splitDays.map((day) => (
                  <ProgramEditDayRow key={day.id} day={day} theme={resolvedTheme} onOpenAddWorkout={handleOpenAddWorkout} />
                ))}
              </View>
            </View>

            <Text className="flex-1 text-[13px] leading-[19px]" style={{ color: resolvedTheme.textSoft }}>{model.helperNote}</Text>
          </View>
        </ScrollView>
      </View>

      <ProgramDateOptionSheet
        isVisible={isStartDateSheetOpen}
        theme={resolvedTheme}
        sheet={startDateSheet}
        onSelectOption={handleSelectStartDateOption}
        onClose={() => setIsStartDateSheetOpen(false)}
      />

      <ProgramDateOptionSheet
        isVisible={isEndDateSheetOpen}
        theme={resolvedTheme}
        sheet={endDateSheet}
        onSelectOption={handleSelectEndDateOption}
        onClose={() => setIsEndDateSheetOpen(false)}
      />

      <ProgramAddWorkoutSheet
        isVisible={isAddWorkoutSheetOpen}
        theme={resolvedTheme}
        sheet={model.addWorkoutSheet}
        onOpenCreateWorkout={handleOpenCreateWorkout}
        onClose={() => {
          setIsAddWorkoutSheetOpen(false)
          setSelectedAddWorkoutDayId(null)
        }}
      />

      <ProgramCreateWorkoutView
        isVisible={isCreateWorkoutViewOpen}
        theme={resolvedTheme}
        model={model.createWorkoutView}
        onOpenAddExercise={handleOpenAddExercise}
        onClose={() => setIsCreateWorkoutViewOpen(false)}
        onSave={() => setIsCreateWorkoutViewOpen(false)}
      />

      <ProgramAddExerciseSheet
        isVisible={isAddExerciseSheetOpen}
        theme={resolvedTheme}
        sheet={model.addExerciseSheet}
        selectedExerciseIds={selectedExerciseIds}
        onToggleExercise={handleToggleExercise}
        searchQuery={exerciseSearchQuery}
        onSearchChange={setExerciseSearchQuery}
        onAddExercises={handleAddExercises}
        onClose={() => setIsAddExerciseSheetOpen(false)}
      />
    </SafeAreaView>
  )
}

export function ProgramEditView({ isVisible, model, theme, onClose, onSave }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <ProgramEditViewContent model={model} theme={theme} onClose={onClose} onSave={onSave} />
      </SafeAreaProvider>
    </Modal>
  )
}
