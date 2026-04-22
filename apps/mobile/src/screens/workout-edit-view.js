import { ArrowDown, ArrowUp, ArrowUpDown, Clock3, Dumbbell, Grip, Link2, Mic, Sparkles, X, Zap } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function WorkoutThumbnailIcon({ icon }) {
  if (icon === 'arrow-up') return <ArrowUp color="#94a3b8" size={20} strokeWidth={2.2} />
  if (icon === 'arrow-down') return <ArrowDown color="#94a3b8" size={20} strokeWidth={2.2} />
  if (icon === 'zap') return <Zap color="#94a3b8" size={20} strokeWidth={2.2} />
  return <Dumbbell color="#94a3b8" size={20} strokeWidth={2.2} />
}

function WorkoutEditSetTable({ exercise }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center border-b border-[#243041] pb-2">
        <Text className="w-8 text-[11px] font-semibold uppercase tracking-[1px] text-slate-400">#</Text>
        <Text className="flex-1 text-[11px] font-semibold uppercase tracking-[1px] text-slate-400">EFFORT</Text>
        <View className="w-[72px] flex-row items-center gap-1">
          <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-400">{exercise.weightHeader}</Text>
          <ArrowUpDown color="#94a3b8" size={12} strokeWidth={2.2} />
        </View>
        <Text className="w-12 text-right text-[11px] font-semibold uppercase tracking-[1px] text-slate-400">REPS</Text>
      </View>

      <View className="gap-3">
        {exercise.sets.map((set) => (
          <View key={set.id} className="flex-row items-center">
            <Text className="w-8 text-[15px] text-white">{set.setNumber}</Text>
            <Text className="flex-1 text-[15px] text-white">{set.effort}</Text>
            <Text className="w-[72px] text-[15px] text-white">{set.load}</Text>
            <Text className="w-12 text-right text-[15px] text-white">{set.reps}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function WorkoutEditExerciseBlock({ exercise, exerciseNotesPlaceholder, addSetLabel }) {
  return (
    <View className="gap-4">
      <View className="flex-row items-start gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-[14px] border border-[#243041] bg-[#111827]">
          <WorkoutThumbnailIcon icon={exercise.thumbnailIcon} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-[24px] font-semibold text-white">{exercise.name}</Text>
          <Text className="text-[15px] text-slate-400">{exerciseNotesPlaceholder || 'Add Notes'}</Text>
        </View>
        <View className="pt-1">
          <Grip color="#94a3b8" size={18} strokeWidth={2.2} />
        </View>
      </View>

      <WorkoutEditSetTable exercise={exercise} />

      <View className="flex-row items-center justify-between gap-3">
        <Pressable className="items-center justify-center rounded-[14px] px-1 py-2" onPress={() => {}}>
          <Link2 color="#a5b4fc" size={18} strokeWidth={2.2} />
        </Pressable>

        <Pressable className="flex-row items-center gap-2 rounded-[14px] bg-[#312e81] px-4 py-2.5" onPress={() => {}}>
          <Text className="text-[18px] font-semibold text-indigo-200">+</Text>
          <Text className="text-[15px] font-semibold text-indigo-200">{addSetLabel || 'Add Set'}</Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1.5 rounded-[14px] px-1 py-2">
            <Clock3 color="#a5b4fc" size={18} strokeWidth={2.2} />
            <Text className="text-[15px] font-semibold text-indigo-200">{exercise.restLabel}</Text>
          </View>
          <View className="flex-row items-center gap-1 rounded-[14px] px-1 py-2">
            <ArrowUpDown color="#a5b4fc" size={18} strokeWidth={2.2} />
            <Text className="text-[13px] font-semibold text-indigo-200">{exercise.supersetCount}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function WorkoutEditFloatingTools() {
  return (
    <View className="absolute bottom-24 right-5 flex-row items-center overflow-hidden rounded-[18px] bg-[#312e81]">
      <View className="px-4 py-3">
        <Sparkles color="#c7d2fe" size={18} strokeWidth={2.2} />
      </View>
      <View className="h-6 w-px bg-indigo-300/40" />
      <View className="px-4 py-3">
        <Mic color="#c7d2fe" size={18} strokeWidth={2.2} />
      </View>
    </View>
  )
}

function WorkoutEditViewContent({ model, onClose, onSave }) {
  const insets = useSafeAreaInsets()

  if (!model) return null

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <View className="px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <Pressable onPress={onClose}>
            <Text className="text-[17px] text-slate-300">{model.cancelLabel || 'Cancel'}</Text>
          </Pressable>
          <Pressable onPress={onSave}>
            <Text className="text-[17px] font-semibold text-indigo-300">{model.editLabel || 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="gap-8">
            <View className="gap-3">
              <Text className="text-[34px] font-bold text-white">{model.title}</Text>
              <Text className="text-[15px] text-slate-400">{model.workoutNotesPlaceholder || 'Add notes'}</Text>
            </View>

            <View className="gap-8">
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
