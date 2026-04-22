import { Check, CalendarDays, ChevronLeft, Dumbbell, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

function ProgramSheetStatIcon({ icon }) {
  if (icon === 'calendar') {
    return <CalendarDays color="#06D6A0" size={18} strokeWidth={2.2} />
  }

  return <Dumbbell color="#06D6A0" size={18} strokeWidth={2.2} />
}

function ProgramSheetStatusBadge({ status }) {
  if (status === 'done') {
    return (
      <View className="h-6 w-6 items-center justify-center rounded-lg border border-green-500 bg-[#052e1a]">
        <Check color="#22c55e" size={14} strokeWidth={2.6} />
      </View>
    )
  }

  return (
    <View className="h-6 w-6 items-center justify-center rounded-lg border border-red-500 bg-[#3b0b12]">
      <X color="#ef4444" size={14} strokeWidth={2.6} />
    </View>
  )
}

function ProgramSheetWeekCard({ week }) {
  return (
    <View key={week.id} className="gap-3.5 rounded-3xl border border-[#243041] bg-[#111827] p-[18px]">
      <Text className="text-[13px] font-semibold text-slate-400">{week.dateRangeLabel}</Text>
      <Text className="text-2xl font-bold text-white">{week.title}</Text>

      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-slate-600" />
        <Text className="text-xs font-semibold text-slate-400">{week.topDividerLabel}</Text>
        <View className="h-px flex-1 bg-slate-600" />
      </View>

      <View className="gap-3.5">
        {week.entries.map((entry) => (
          <View key={entry.id} className="flex-row items-center gap-2.5">
            <Text className="w-[34px] text-[15px] font-bold text-white">{entry.dayLabel}</Text>
            <Text className="flex-1 text-[15px] font-semibold text-white">{entry.workoutLabel}</Text>
            <Text className="text-[13px] font-semibold text-slate-400">{entry.durationLabel}</Text>
            <ProgramSheetStatusBadge status={entry.status} />
          </View>
        ))}
      </View>

      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-slate-600" />
        <Text className="text-xs font-semibold text-slate-400">{week.bottomDividerLabel}</Text>
        <View className="h-px flex-1 bg-slate-600" />
      </View>
    </View>
  )
}

export function renderProgramSheet({ isVisible, onClose, model }) {
  if (!model) {
    return null
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[rgba(2,6,23,0.76)]">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="max-h-[88%] rounded-t-[28px] bg-slate-900 px-5 pb-7 pt-[18px]">
          <ScrollView
            className="flex-grow-0"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 24, paddingBottom: 32 }}
          >
            <View className="flex-row items-center justify-between">
              <Pressable className="h-10 w-10 items-center justify-center rounded-[14px] bg-slate-800" onPress={onClose}>
                <ChevronLeft color="#ffffff" size={24} strokeWidth={2.2} />
              </Pressable>
              <Pressable onPress={() => {}}>
                <Text className="text-[17px] font-semibold text-emerald-400">{model.editLabel}</Text>
              </Pressable>
            </View>

            <View className="gap-2">
              <Text className="text-[28px] font-bold text-white">{model.title}</Text>
              <Text className="text-sm text-slate-400">{model.dateRangeLabel}</Text>
            </View>

            <View className="gap-4">
              <View className="flex-row gap-1.5">
                {model.progressSegments.map((segment) => {
                  const stateClass = segment.isCurrent
                    ? 'bg-emerald-700'
                    : segment.isComplete
                      ? 'bg-emerald-500'
                      : 'bg-slate-700'

                  return <View key={segment.id} className={`h-3 flex-1 rounded-full ${stateClass}`} />
                })}
              </View>
            </View>

            <View className="gap-2.5">
              {model.stats.map((stat) => (
                <View key={stat.id} className="flex-row items-center gap-2.5">
                  <ProgramSheetStatIcon icon={stat.icon} />
                  <Text className="text-sm font-semibold text-slate-300">{stat.label}</Text>
                </View>
              ))}
            </View>

            <View className="gap-3.5">
              <Text className="text-lg font-semibold text-slate-300">Workouts</Text>
              <View className="flex-row flex-wrap gap-3">
                {model.routines.map((routine) => (
                  <View
                    key={routine.id}
                    className="min-h-[52px] w-[48%] justify-center rounded-[18px] border border-[#243041] bg-[#111827] px-4"
                  >
                    <Text className="text-[15px] font-semibold text-white">{routine.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="gap-3.5">
              <Text className="text-lg font-semibold text-slate-300">Schedule</Text>
              <View className="gap-4">
                {model.weeks.map((week) => (
                  <ProgramSheetWeekCard key={week.id} week={week} />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
