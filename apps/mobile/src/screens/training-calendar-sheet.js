import { Check, ChevronLeft, RotateCcw, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function WeekBadge({ label }) {
  return (
    <View className="rounded-full border border-[#243041] bg-[#111827] px-3 py-1.5">
      <Text className="text-[13px] font-semibold text-emerald-300">{label}</Text>
    </View>
  )
}

function TrainingCalendarStatusBadge({ status }) {
  if (status === 'done') {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-[10px] border border-emerald-500 bg-[#052e1a]">
        <Check color="#1fb56c" size={16} strokeWidth={2.8} />
      </View>
    )
  }

  if (status === 'missed') {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-[10px] border border-rose-500 bg-[#3b0b12]">
        <X color="#d94b63" size={16} strokeWidth={2.8} />
      </View>
    )
  }

  return <View className="h-8 w-8 rounded-[10px] border border-[#243041] bg-[#111827]" />
}

function TrainingCalendarDayRow({ day }) {
  return (
    <View className="flex-row items-center gap-4 py-2.5">
      <View className="w-[52px] items-start">
        <Text className="text-[12px] font-semibold uppercase tracking-[1px] text-slate-400">{day.dayLabel}</Text>
        <Text className="text-[20px] font-semibold text-white">{day.dateNumber}</Text>
      </View>

      <View className="flex-1">
        {day.type === 'rest' ? (
          <Text className="text-[16px] text-slate-300">Rest Day</Text>
        ) : (
          <View className="flex-row items-center justify-between rounded-[18px] border border-[#243041] bg-[#111827] px-4 py-4">
            <Text className="flex-1 text-[16px] font-medium text-white">{day.workoutLabel}</Text>
            <TrainingCalendarStatusBadge status={day.status} />
          </View>
        )}
      </View>
    </View>
  )
}

export function renderTrainingCalendarSheet({ isVisible, onClose, model }) {
  const insets = useSafeAreaInsets()

  if (!model) {
    return null
  }

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-[#0b1220]">
        <View className="border-b border-[#243041] px-5 pb-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <View className="flex-row items-center justify-between">
            <Pressable className="flex-row items-center gap-2 rounded-[14px] border border-[#243041] bg-[#111827] px-3 py-2 focus:outline-none" onPress={onClose}>
              <ChevronLeft color="#ffffff" size={24} strokeWidth={2.4} />
              <Text className="text-[16px] font-semibold text-white">Back</Text>
            </Pressable>
            <Text className="flex-1 text-center text-[19px] font-semibold text-white">Training Calendar</Text>
            <View className="w-11" />
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 }}>
          <Pressable className="mb-7 flex-row items-center justify-center gap-2 rounded-[14px] border border-[#243041] bg-[#111827] px-4 py-4" onPress={() => {}}>
            <RotateCcw color="#cbd5e1" size={16} strokeWidth={2.2} />
            <Text className="text-[16px] font-medium text-slate-300">Load more</Text>
          </Pressable>

          <View className="gap-7">
            {model.weeks.map((week) => (
              <View key={week.id} className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[20px] font-semibold text-slate-200">{week.dateRangeLabel}</Text>
                  <WeekBadge label={week.weekLabel} />
                </View>
                <View className="h-px bg-[#243041]" />
                <View className="gap-1">
                  {week.days.map((day) => (
                    <TrainingCalendarDayRow key={day.id} day={day} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}
