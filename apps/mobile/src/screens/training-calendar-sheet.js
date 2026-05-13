import { Check, RotateCcw, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTheme } from '../theme/app-theme.js';
import { AppStatusIconBadge, AppSurfaceCard } from '../ui/primitives.js';

function WeekBadge({ label, theme }) {
  return (
    <AppSurfaceCard theme={theme} containerClassName="rounded-full overflow-hidden" contentClassName="px-3 py-1.5">
      <Text className="text-[13px] font-semibold" style={{ color: theme.accentText }}>{label}</Text>
    </AppSurfaceCard>
  )
}

function TrainingCalendarStatusBadge({ status, theme }) {
  const resolvedStatus = status === 'done' || status === 'missed' ? status : 'upcoming'
  return <AppStatusIconBadge status={resolvedStatus} theme={theme} size="sm" />
}

function TrainingCalendarDayRow({ day, theme }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-3">
      <View className="w-12 shrink-0 pr-2">
        <Text className="text-[14px] font-semibold uppercase" style={{ color: theme.textSoft }}>{day.dayLabel}</Text>
      </View>
      {day.type === 'rest' ? (
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-px flex-1" style={{ backgroundColor: theme.borderStrong }} />
          <Text className="text-xs font-semibold" style={{ color: theme.textSoft }}>Rest Day</Text>
          <View className="h-px flex-1" style={{ backgroundColor: theme.borderStrong }} />
        </View>
      ) : (
        <>
          <View className="flex-1 gap-1">
            <Text className="text-[16px] font-semibold" style={{ color: theme.text }}>{day.workoutLabel}</Text>
            <Text className="text-[14px]" style={{ color: theme.textSoft }}>{day.statusLabel || 'Scheduled'}</Text>
          </View>
          <TrainingCalendarStatusBadge status={day.status} theme={theme} />
        </>
      )}
    </View>
  )
}

function TrainingCalendarWeekCard({ week, theme }) {
  return (
    <AppSurfaceCard theme={theme} contentClassName="gap-3.5 px-[18px] py-[18px]" containerClassName="rounded-3xl overflow-hidden">
      <Text className="text-[13px] font-semibold" style={{ color: theme.textSoft }}>{week.dateRangeLabel}</Text>
      <Text className="text-2xl font-bold" style={{ color: theme.text }}>{week.weekTitle || week.weekLabel}</Text>

      <View className="gap-1.5">
        {week.days.map((day) => (
          <TrainingCalendarDayRow key={day.id} day={day} theme={theme} />
        ))}
      </View>
    </AppSurfaceCard>
  )
}

function TrainingCalendarSheetContent({ onClose, model, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')

  if (!model) {
    return null
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="px-5 pb-6" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <AppSurfaceCard
            theme={resolvedTheme}
            onPress={onClose}
            containerClassName="h-10 w-10 rounded-[14px] overflow-hidden"
            contentClassName="h-full items-center justify-center"
          >
            <X color={resolvedTheme.icon} size={20} strokeWidth={2.4} />
          </AppSurfaceCard>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          <View className="gap-8">
            <Text className="text-[34px] font-bold" style={{ color: resolvedTheme.text }}>Training Calendar</Text>

            <AppSurfaceCard
              theme={resolvedTheme}
              onPress={() => {}}
              containerClassName="rounded-[14px] overflow-hidden"
              contentClassName="flex-row items-center justify-center gap-2 px-4 py-4"
            >
              <RotateCcw color={resolvedTheme.textMuted} size={16} strokeWidth={2.2} />
              <Text className="text-[16px] font-medium" style={{ color: resolvedTheme.textMuted }}>{model.loadMoreLabel || 'Load more'}</Text>
            </AppSurfaceCard>

            <View className="gap-3.5">
              <Text className="text-lg font-semibold" style={{ color: resolvedTheme.textMuted }}>Schedule</Text>
              <View className="gap-4">
                {model.weeks.map((week) => (
                  <TrainingCalendarWeekCard key={week.id} week={week} theme={resolvedTheme} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export function TrainingCalendarSheet({ isVisible, onClose, model, theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <TrainingCalendarSheetContent onClose={onClose} model={model} theme={theme} />
      </SafeAreaProvider>
    </Modal>
  )
}
