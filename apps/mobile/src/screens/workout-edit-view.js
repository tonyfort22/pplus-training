import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Clock3, Dumbbell, Grip, Link2, Mic, Sparkles, Zap } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function WorkoutThumbnailIcon({ icon }) {
  if (icon === 'arrow-up') return <ArrowUp color="#94a3b8" size={22} strokeWidth={2.2} />
  if (icon === 'arrow-down') return <ArrowDown color="#94a3b8" size={22} strokeWidth={2.2} />
  if (icon === 'zap') return <Zap color="#94a3b8" size={22} strokeWidth={2.2} />
  return <Dumbbell color="#94a3b8" size={22} strokeWidth={2.2} />
}

function createDraftFromModel(model) {
  return {
    workoutNotes: '',
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

function WorkoutEditCellInput({ value, onChangeText, widthClass, align = 'left' }) {
  const alignClass = align === 'right' ? 'text-right' : 'text-left'

  return (
    <TextInput
      className={`${widthClass} rounded-[12px] border border-transparent px-2 py-2 text-[16px] text-white ${alignClass}`}
      keyboardType="numeric"
      onChangeText={onChangeText}
      selectTextOnFocus
      value={value}
    />
  )
}

function WorkoutEditSetTable({ exercise, onSetValueChange }) {
  return (
    <View className="overflow-hidden rounded-[20px] border border-[#243041] bg-[#111827]">
      <View className="flex-row items-center border-b border-[#243041] px-4 py-3">
        <Text className="w-9 text-[11px] font-semibold uppercase tracking-[1.6px] text-slate-400">#</Text>
        <Text className="flex-1 text-[11px] font-semibold uppercase tracking-[1.6px] text-slate-400">EFFORT</Text>
        <View className="w-[80px] flex-row items-center gap-1">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-slate-400">{exercise.weightHeader}</Text>
          <ArrowUpDown color="#94a3b8" size={12} strokeWidth={2.2} />
        </View>
        <Text className="w-12 text-right text-[11px] font-semibold uppercase tracking-[1.6px] text-slate-400">REPS</Text>
      </View>

      <View className="px-4">
        {exercise.sets.map((set) => (
          <View key={set.id} className="flex-row items-center border-b border-[#1f2937]/80 py-3 last:border-b-0">
            <Text className="w-9 text-[16px] text-white">{set.setNumber}</Text>
            <WorkoutEditCellInput
              value={set.effort}
              widthClass="flex-1"
              onChangeText={(nextValue) => onSetValueChange(exercise.id, set.id, 'effort', nextValue)}
            />
            <WorkoutEditCellInput
              value={set.load}
              widthClass="w-[80px]"
              onChangeText={(nextValue) => onSetValueChange(exercise.id, set.id, 'load', nextValue)}
            />
            <WorkoutEditCellInput
              value={set.reps}
              widthClass="w-12"
              align="right"
              onChangeText={(nextValue) => onSetValueChange(exercise.id, set.id, 'reps', nextValue)}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

function WorkoutEditExerciseControls({ exercise, addSetLabel, onAddSet }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Pressable className="h-11 w-11 items-center justify-center rounded-[16px] border border-[#34D399]/70 bg-[#052E2B]/88" onPress={() => {}}>
        <Link2 color="#34D399" size={18} strokeWidth={2.2} />
      </Pressable>

      <Pressable className="min-w-[112px] justify-center flex-row items-center gap-2 rounded-[16px] border border-[#34D399]/70 bg-[#052E2B]/88 px-4 py-3" onPress={() => onAddSet(exercise.id)}>
        <Text className="text-[18px] font-semibold text-[#34D399]">+</Text>
        <Text className="text-[15px] font-semibold text-[#34D399]">{addSetLabel || 'Add Set'}</Text>
      </Pressable>

      <View className="flex-1 flex-row items-center justify-end gap-2">
        <View className="flex-row items-center gap-1.5 rounded-[16px] border border-[#34D399]/70 bg-[#052E2B]/88 px-3 py-3">
          <Clock3 color="#34D399" size={17} strokeWidth={2.2} />
          <Text className="text-[14px] font-semibold text-[#34D399]">{exercise.restLabel}</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-[16px] border border-[#34D399]/70 bg-[#052E2B]/88 px-3 py-3">
          <ArrowUpDown color="#34D399" size={17} strokeWidth={2.2} />
          <Text className="text-[13px] font-semibold text-[#34D399]">{exercise.supersetCount}</Text>
        </View>
      </View>
    </View>
  )
}

function WorkoutEditExerciseBlock({ exercise, exerciseNotesPlaceholder, addSetLabel, onExerciseNotesChange, onSetValueChange, onAddSet }) {
  return (
    <View className="gap-5">
      <View className="flex-row items-start gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-[18px] border border-[#243041] bg-[#111827]">
          <WorkoutThumbnailIcon icon={exercise.thumbnailIcon} />
        </View>
        <View className="flex-1 gap-2 pt-0.5">
          <Text className="text-[28px] font-semibold leading-[32px] text-white">{exercise.name}</Text>
          <TextInput
            className="min-h-[44px] rounded-[14px] border border-[#243041] bg-[#111827] px-3 py-3 text-[15px] text-white"
            multiline
            onChangeText={(nextValue) => onExerciseNotesChange(exercise.id, nextValue)}
            placeholder={exerciseNotesPlaceholder || 'Add Notes'}
            placeholderTextColor="#94a3b8"
            value={exercise.notes}
          />
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-[14px] border border-[#243041] bg-[#111827]">
          <Grip color="#94a3b8" size={17} strokeWidth={2.2} />
        </View>
      </View>

      <WorkoutEditSetTable exercise={exercise} onSetValueChange={onSetValueChange} />
      <WorkoutEditExerciseControls exercise={exercise} addSetLabel={addSetLabel} onAddSet={onAddSet} />
    </View>
  )
}

function WorkoutEditFloatingTools() {
  return (
    <View className="absolute bottom-16 right-6 flex-row items-center overflow-hidden rounded-[24px] border border-[#34D399]/70 bg-[#052E2B]/92 shadow-2xl shadow-black/40">
      <Pressable className="px-5 py-4" onPress={() => {}}>
        <Sparkles color="#34D399" size={22} strokeWidth={2.2} />
      </Pressable>
      <View className="h-8 w-px bg-[#34D399]/35" />
      <Pressable className="px-5 py-4" onPress={() => {}}>
        <Mic color="#34D399" size={22} strokeWidth={2.2} />
      </Pressable>
    </View>
  )
}

function WorkoutEditViewContent({ model, onClose, onSave }) {
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState(() => (model ? createDraftFromModel(model) : null))

  useEffect(() => {
    if (!model) {
      setDraft(null)
      return
    }

    setDraft(createDraftFromModel(model))
  }, [model])

  if (!model || !draft) return null

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

  function handleAddSet(exerciseId) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      exercises: currentDraft.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise

        const lastSet = exercise.sets.at(-1)
        const nextSetNumber = exercise.sets.length + 1
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: `${exercise.id}-draft-set-${nextSetNumber}`,
              setNumber: nextSetNumber,
              effort: lastSet?.effort ?? '',
              load: lastSet?.load ?? '',
              reps: lastSet?.reps ?? '',
            },
          ],
        }
      }),
    }))
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <Pressable className="px-1 py-2" onPress={onClose}>
            <Text className="text-[17px] text-slate-300">{model.cancelLabel || 'Cancel'}</Text>
          </Pressable>
          <Pressable className="px-1 py-2" onPress={() => onSave?.(draft)}>
            <Text className="text-[17px] font-semibold text-[#34D399]">{model.editLabel || 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>
          <View className="gap-9">
            <View className="gap-3">
              <Text className="text-[36px] font-bold leading-[40px] text-white">{model.title}</Text>
              <TextInput
                className="min-h-[52px] rounded-[16px] border border-[#243041] bg-[#111827] px-4 py-3 text-[15px] text-white"
                multiline
                onChangeText={handleWorkoutNotesChange}
                placeholder={model.workoutNotesPlaceholder || 'Add notes'}
                placeholderTextColor="#94a3b8"
                value={draft.workoutNotes}
              />
            </View>

            <View className="gap-9">
              {draft.exercises.map((exercise) => (
                <WorkoutEditExerciseBlock
                  key={exercise.id}
                  exercise={exercise}
                  exerciseNotesPlaceholder={model.exerciseNotesPlaceholder}
                  addSetLabel={model.addSetLabel}
                  onExerciseNotesChange={handleExerciseNotesChange}
                  onSetValueChange={handleSetValueChange}
                  onAddSet={handleAddSet}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <WorkoutEditFloatingTools />
    </SafeAreaView>
  )
}

export function WorkoutEditView({ isVisible, model, onClose, onSave }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <WorkoutEditViewContent model={model} onClose={onClose} onSave={onSave} />
      </SafeAreaProvider>
    </Modal>
  )
}
