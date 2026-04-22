import { ArrowDown, ArrowUp, ArrowUpDown, Clock3, Dumbbell, X, Zap } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function WorkoutThumbnailIcon({ icon }) {
  if (icon === 'arrow-up') return <ArrowUp color="#94a3b8" size={20} strokeWidth={2.2} />
  if (icon === 'arrow-down') return <ArrowDown color="#94a3b8" size={20} strokeWidth={2.2} />
  if (icon === 'zap') return <Zap color="#94a3b8" size={20} strokeWidth={2.2} />
  return <Dumbbell color="#94a3b8" size={20} strokeWidth={2.2} />
}

function WorkoutSheetSetTable({ exercise }) {
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

function WorkoutSheetExerciseBlock({ exercise }) {
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-[14px] border border-[#243041] bg-[#111827]">
          <WorkoutThumbnailIcon icon={exercise.thumbnailIcon} />
        </View>
        <Text className="flex-1 text-[24px] font-semibold text-white">{exercise.name}</Text>
      </View>

      <WorkoutSheetSetTable exercise={exercise} />

      <View className="flex-row justify-end gap-2">
        <View className="flex-row items-center gap-1.5 rounded-[14px] border border-[#243041] bg-[#111827] px-3 py-2">
          <Clock3 color="#94a3b8" size={15} strokeWidth={2.2} />
          <Text className="text-[14px] font-medium text-slate-300">{exercise.restLabel}</Text>
        </View>
        <View className="items-center justify-center rounded-[14px] border border-[#243041] bg-[#111827] px-3 py-2">
          <ArrowUpDown color="#94a3b8" size={16} strokeWidth={2.2} />
        </View>
      </View>
    </View>
  )
}

function WorkoutSheetContent({ model, onClose, onStartWorkout }) {
  const insets = useSafeAreaInsets()

  if (!model) return null

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <View className="px-5 pb-6" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <Pressable className="h-10 w-10 items-center justify-center rounded-[14px] border border-[#243041] bg-[#111827]" onPress={onClose}>
            <X color="#ffffff" size={20} strokeWidth={2.4} />
          </Pressable>
          <Pressable onPress={() => {}}>
            <Text className="text-[17px] font-semibold text-emerald-300">{model.editLabel || 'Edit'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="gap-8">
            <View className="gap-3">
              <Text className="text-[34px] font-bold text-white">{model.title}</Text>
              <View className="flex-row flex-wrap items-center gap-3">
                {model.summaryItems.map((item, index) => (
                  <View key={item.id} className="flex-row items-center gap-3">
                    <Text className="text-[15px] text-slate-400">{item.label}</Text>
                    {index < model.summaryItems.length - 1 ? <View className="h-4 w-px bg-[#243041]" /> : null}
                  </View>
                ))}
              </View>
            </View>

            <View className="gap-8">
              {model.exercises.map((exercise) => (
                <WorkoutSheetExerciseBlock key={exercise.id} exercise={exercise} />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="absolute inset-x-0 bottom-0 px-5 pb-6" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        <Pressable className="items-center justify-center rounded-[18px] bg-[#312e81] py-4" onPress={onStartWorkout}>
          <Text className="text-[18px] font-semibold text-indigo-200">{model.ctaLabel || 'Start Workout'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

export function WorkoutSheet({ isVisible, model, onClose, onStartWorkout }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <WorkoutSheetContent model={model} onClose={onClose} onStartWorkout={onStartWorkout} />
      </SafeAreaProvider>
    </Modal>
  )
}
