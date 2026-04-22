import { Check, ChevronLeft, RotateCcw, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function WeekBadge({ label }) {
  return (
    <View className="rounded-full bg-[#2b2f5c] px-3 py-1.5">
      <Text className="text-[13px] font-semibold text-[#7c83ff]">{label}</Text>
    </View>
  )
}

function TrainingCalendarStatusBadge({ status }) {
  if (status === 'done') {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-[10px] border border-emerald-500 bg-transparent">
        <Check color="#1fb56c" size={16} strokeWidth={2.8} />
      </View>
    )
  }

  if (status === 'missed') {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-[10px] border border-rose-500 bg-transparent">
        <X color="#d94b63" size={16} strokeWidth={2.8} />
      </View>
    )
  }

  return <View className="h-8 w-8 rounded-[10px] border border-white/10 bg-transparent" />
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
          <View className="flex-row items-center justify-between rounded-[18px] border border-white/8 bg-[#2c2e3a] px-4 py-4">
            <Text className="flex-1 text-[16px] font-medium text-white">{day.workoutLabel}</Text>
            <TrainingCalendarStatusBadge status={day.status} />
          </View>
        )}
      </View>
    </View>
  )
}

export function renderTrainingCalendarSheet({ isVisible, onClose, model }) {
  if (!model) {
    return null
  }

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-[#1f1f2b]">
        <View className="border-b border-white/5 px-5 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <Pressable className="h-10 w-10 items-center justify-center rounded-[12px] bg-[#2a2c37]" onPress={onClose}>
              <ChevronLeft color="#d1d5db" size={22} strokeWidth={2.4} />
            </Pressable>
            <Text className="flex-1 text-center text-[19px] font-semibold text-white">Training Calendar</Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 }}>
          <Pressable className="mb-7 flex-row items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-[#242532] px-4 py-4" onPress={() => {}}>
            <RotateCcw color="#a8a9b8" size={16} strokeWidth={2.2} />
            <Text className="text-[16px] font-medium text-[#a8a9b8]">Load more</Text>
          </Pressable>

          <View className="gap-7">
            {model.weeks.map((week) => (
              <View key={week.id} className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[20px] font-semibold text-slate-200">{week.dateRangeLabel}</Text>
                  <WeekBadge label={week.weekLabel} />
                </View>
                <View className="h-px bg-white/5" />
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
