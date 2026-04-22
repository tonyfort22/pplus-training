import { ArrowDown, ArrowUp, ArrowUpDown, Clock3, Dumbbell, Grip, Link2, Mic, Sparkles, Zap } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function WorkoutThumbnailIcon({ icon }) {
  if (icon === 'arrow-up') return <ArrowUp color="#94a3b8" size={22} strokeWidth={2.2} />
  if (icon === 'arrow-down') return <ArrowDown color="#94a3b8" size={22} strokeWidth={2.2} />
  if (icon === 'zap') return <Zap color="#94a3b8" size={22} strokeWidth={2.2} />
  return <Dumbbell color="#94a3b8" size={22} strokeWidth={2.2} />
}

function WorkoutEditSetTable({ exercise }) {
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
            <Text className="flex-1 text-[16px] text-white">{set.effort}</Text>
            <Text className="w-[80px] text-[16px] text-white">{set.load}</Text>
            <Text className="w-12 text-right text-[16px] text-white">{set.reps}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function WorkoutEditExerciseControls({ exercise, addSetLabel }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Pressable className="h-11 w-11 items-center justify-center rounded-[16px] border border-indigo-400/20 bg-[#312e81]" onPress={() => {}}>
        <Link2 color="#c7d2fe" size={18} strokeWidth={2.2} />
      </Pressable>

      <Pressable className="min-w-[112px] justify-center flex-row items-center gap-2 rounded-[16px] border border-indigo-400/20 bg-[#312e81] px-4 py-3" onPress={() => {}}>
        <Text className="text-[18px] font-semibold text-indigo-100">+</Text>
        <Text className="text-[15px] font-semibold text-indigo-100">{addSetLabel || 'Add Set'}</Text>
      </Pressable>

      <View className="flex-1 flex-row items-center justify-end gap-2">
        <View className="flex-row items-center gap-1.5 rounded-[16px] border border-indigo-400/20 bg-[#312e81] px-3 py-3">
          <Clock3 color="#c7d2fe" size={17} strokeWidth={2.2} />
          <Text className="text-[14px] font-semibold text-indigo-100">{exercise.restLabel}</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-[16px] border border-indigo-400/20 bg-[#312e81] px-3 py-3">
          <ArrowUpDown color="#c7d2fe" size={17} strokeWidth={2.2} />
          <Text className="text-[13px] font-semibold text-indigo-100">{exercise.supersetCount}</Text>
        </View>
      </View>
    </View>
  )
}

function WorkoutEditExerciseBlock({ exercise, exerciseNotesPlaceholder, addSetLabel }) {
  return (
    <View className="gap-5">
      <View className="flex-row items-start gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-[18px] border border-[#243041] bg-[#111827]">
          <WorkoutThumbnailIcon icon={exercise.thumbnailIcon} />
        </View>
        <View className="flex-1 gap-1.5 pt-0.5">
          <Text className="text-[28px] font-semibold leading-[32px] text-white">{exercise.name}</Text>
          <Text className="text-[15px] text-slate-400">{exerciseNotesPlaceholder || 'Add Notes'}</Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-[14px] border border-[#243041] bg-[#111827]">
          <Grip color="#94a3b8" size={17} strokeWidth={2.2} />
        </View>
      </View>

      <WorkoutEditSetTable exercise={exercise} />
      <WorkoutEditExerciseControls exercise={exercise} addSetLabel={addSetLabel} />
    </View>
  )
}

function WorkoutEditFloatingTools() {
  return (
    <View className="absolute bottom-10 right-5 flex-row items-center overflow-hidden rounded-[20px] border border-indigo-400/20 bg-[#312e81]/95 shadow-2xl shadow-black/40">
      <Pressable className="px-4 py-3.5" onPress={() => {}}>
        <Sparkles color="#e0e7ff" size={18} strokeWidth={2.2} />
      </Pressable>
      <View className="h-7 w-px bg-indigo-300/35" />
      <Pressable className="px-4 py-3.5" onPress={() => {}}>
        <Mic color="#e0e7ff" size={18} strokeWidth={2.2} />
      </Pressable>
    </View>
  )
}

function WorkoutEditViewContent({ model, onClose, onSave }) {
  const insets = useSafeAreaInsets()

  if (!model) return null

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <Pressable className="px-1 py-2" onPress={onClose}>
            <Text className="text-[17px] text-slate-300">{model.cancelLabel || 'Cancel'}</Text>
          </Pressable>
          <Pressable className="px-1 py-2" onPress={onSave}>
            <Text className="text-[17px] font-semibold text-indigo-300">{model.editLabel || 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 184 }}>
          <View className="gap-9">
            <View className="gap-3">
              <Text className="text-[36px] font-bold leading-[40px] text-white">{model.title}</Text>
              <Text className="text-[15px] text-slate-400">{model.workoutNotesPlaceholder || 'Add notes'}</Text>
            </View>

            <View className="gap-9">
              {model.exercises.map((exercise) => (
                <WorkoutEditExerciseBlock
                  key={exercise.id}
                  exercise={exercise}
                  exerciseNotesPlaceholder={model.exerciseNotesPlaceholder}
                  addSetLabel={model.addSetLabel}
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
