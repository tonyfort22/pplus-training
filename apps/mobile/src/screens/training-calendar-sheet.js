import { RotateCcw, X } from 'lucide-react-native';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTheme } from '../theme/app-theme.js';
import { AppSheetHeader, AppStatusIconBadge, AppSurfaceCard } from '../ui/primitives.js';

function WeekBadge({ label, theme }) {
  return (
    <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: theme.accentSurface }}>
      <Text className="text-[12px] font-semibold" style={{ color: theme.accentText }}>{label}</Text>
    </View>
  )
}

function TrainingCalendarStatusBadge({ status, theme }) {
  const resolvedStatus = status === 'done' || status === 'missed' ? status : 'upcoming'
  return <AppStatusIconBadge status={resolvedStatus} theme={theme} size="xs" />
}

function TrainingCalendarDayLabel({ day, theme }) {
  return (
    <View className="w-10 shrink-0 items-center gap-1 pt-0.5">
      <Text className="text-[11px] font-semibold uppercase tracking-[0.8px]" style={{ color: theme.textSoft }}>{day.dayLabel}</Text>
      <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>{day.dateNumber}</Text>
    </View>
  )
}

function TrainingCalendarWorkoutCard({ day, theme }) {
  return (
    <AppSurfaceCard
      theme={theme}
      containerClassName="flex-1 rounded-[16px] overflow-hidden"
      contentClassName="flex-row items-center justify-between gap-3 px-3.5 py-3"
      style={{ backgroundColor: theme.surfaceMuted }}
    >
      <Text numberOfLines={1} className="flex-1 text-[13px] font-semibold" style={{ color: theme.text }}>{day.workoutLabel}</Text>
      <TrainingCalendarStatusBadge status={day.status} theme={theme} />
    </AppSurfaceCard>
  )
}

function TrainingCalendarRestDay({ theme }) {
  return (
    <View className="min-h-[48px] flex-1 flex-row items-center gap-3">
      <View className="h-px flex-1" style={{ backgroundColor: theme.borderStrong }} />
      <Text className="text-[13px] font-semibold" style={{ color: theme.textSoft }}>Rest Day</Text>
      <View className="h-px flex-1" style={{ backgroundColor: theme.borderStrong }} />
    </View>
  )
}

function TrainingCalendarDayRow({ day, theme }) {
  return (
    <View className="flex-row items-start gap-3 py-1.5">
      <TrainingCalendarDayLabel day={day} theme={theme} />
      {day.type === 'rest' ? (
        <TrainingCalendarRestDay theme={theme} />
      ) : (
        <TrainingCalendarWorkoutCard day={day} theme={theme} />
      )}
    </View>
  )
}

function TrainingCalendarWeekSection({ week, theme }) {
  return (
    <View className="gap-3.5 py-4" style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[14px] font-semibold" style={{ color: theme.text }}>{week.dateRangeLabel}</Text>
        <WeekBadge label={week.weekLabel} theme={theme} />
      </View>

      <View className="gap-1">
        {week.days.map((day) => (
          <TrainingCalendarDayRow key={day.id} day={day} theme={theme} />
        ))}
      </View>
    </View>
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
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader
          theme={resolvedTheme}
          title={model.title || 'Training Calendar'}
          onBack={onClose}
          leftIcon={<X color={resolvedTheme.icon} size={20} strokeWidth={2.6} />}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="gap-5">
            <AppSurfaceCard
              theme={resolvedTheme}
              onPress={() => {}}
              containerClassName="rounded-[14px] overflow-hidden"
              contentClassName="flex-row items-center justify-center gap-2 px-4 py-4"
            >
              <RotateCcw color={resolvedTheme.textMuted} size={16} strokeWidth={2.2} />
              <Text className="text-[16px] font-medium" style={{ color: resolvedTheme.textMuted }}>{model.loadMoreLabel || 'Load more'}</Text>
            </AppSurfaceCard>

            <View>
              {model.weeks.map((week) => (
                <TrainingCalendarWeekSection key={week.id} week={week} theme={resolvedTheme} />
              ))}
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
