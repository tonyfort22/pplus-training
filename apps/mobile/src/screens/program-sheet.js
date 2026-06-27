import { CalendarDays, Dumbbell, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTheme } from '../theme/app-theme.js';
import { AppStatusIconBadge, AppSurfaceCard } from '../ui/primitives.js';

function ProgramSheetStatIcon({ icon, theme }) {
  if (icon === 'calendar') {
    return <CalendarDays color={theme.accent} size={18} strokeWidth={2.2} />
  }

  return <Dumbbell color={theme.accent} size={18} strokeWidth={2.2} />
}

function ProgramSheetStatusBadge({ status, theme, testID }) {
  return <AppStatusIconBadge status={status} theme={theme} size="xs" testID={testID} />
}

function ProgramSheetWeekCard({ week, theme, onOpenWorkoutDetail, onOpenTrainingCalendar }) {
  return (
    <AppSurfaceCard
      accessibilityLabel={`Program sheet ${week.title} card`}
      theme={theme}
      onPress={onOpenTrainingCalendar}
      contentClassName="gap-3.5 px-[18px] py-[18px]"
      containerClassName="rounded-3xl overflow-hidden"
      testID={`program-sheet-week-card-${week.id}`}
    >
      <Text className="text-[13px] font-semibold" style={{ color: theme.textSoft }}>{week.dateRangeLabel}</Text>
      <Text className="text-2xl font-bold" style={{ color: theme.text }}>{week.title}</Text>

      <View className="gap-1.5">
        {week.entries.map((entry) => {
          const restDividerColor = entry.isProgramEnd ? theme.accent : theme.borderStrong
          const restTextColor = entry.isProgramEnd ? theme.accentText : theme.textSoft
          const restLabel = entry.isProgramEnd ? 'Program End' : 'Rest Day'

          return (
            <View
              key={entry.id}
              className="flex-row items-center justify-between gap-3 py-2.5"
              testID={`program-sheet-schedule-row-${entry.id}`}
            >
              <View className="w-10 shrink-0 pr-2" testID={`program-sheet-day-label-rail-${entry.id}`}>
                <Text className="text-[11px] font-semibold uppercase" style={{ color: theme.textSoft }}>{entry.dayLabel}</Text>
              </View>
              {entry.status === 'rest' ? (
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-px flex-1" style={{ backgroundColor: restDividerColor }} />
                  <Text className="text-[11px] font-semibold" style={{ color: restTextColor }}>{restLabel}</Text>
                  <View className="h-px flex-1" style={{ backgroundColor: restDividerColor }} />
                </View>
              ) : (
                <>
                  <Pressable className="flex-1" onPress={() => onOpenWorkoutDetail?.(entry)}>
                    <Text className="text-[14px] font-semibold" style={{ color: theme.text }}>{entry.workoutLabel}</Text>
                  </Pressable>
                  {entry.durationLabel ? <Text className="text-[12px] font-medium" style={{ color: theme.textSoft }}>{entry.durationLabel}</Text> : null}
                  <ProgramSheetStatusBadge status={entry.status} theme={theme} testID={`program-sheet-status-checkbox-${entry.id}`} />
                </>
              )}
            </View>
          )
        })}
      </View>
    </AppSurfaceCard>
  )
}

function ProgramSheetContent({ model, theme, onClose, onEditProgram, onOpenWorkoutDetail, onOpenTrainingCalendar }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')

  if (!model) return null

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
          <Pressable onPress={onEditProgram}>
            <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.accent }}>{model.editLabel}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          <View className="gap-8">
            <View className="gap-3">
              <Text className="text-[34px] font-bold" style={{ color: resolvedTheme.text }}>{model.title}</Text>
              <Text className="text-[15px]" style={{ color: resolvedTheme.textSoft }}>{model.dateRangeLabel}</Text>
            </View>

            <View className="gap-4">
              <View className="flex-row gap-1.5">
                {model.progressSegments.map((segment) => {
                  const backgroundColor = segment.isCurrent
                    ? resolvedTheme.accentSoft
                    : segment.isComplete
                      ? resolvedTheme.accent
                      : resolvedTheme.borderStrong

                  return <View key={segment.id} className="h-3 flex-1 rounded-full" style={{ backgroundColor }} />
                })}
              </View>
            </View>

            <AppSurfaceCard theme={resolvedTheme} contentClassName="gap-2.5 px-4 py-4">
              {model.stats.map((stat, index) => (
                <View
                  key={stat.id}
                  className="flex-row items-center gap-3 py-3"
                  style={index < model.stats.length - 1 ? { borderBottomWidth: 1, borderBottomColor: resolvedTheme.border } : null}
                >
                  <ProgramSheetStatIcon icon={stat.icon} theme={resolvedTheme} />
                  <Text className="text-[16px] font-semibold" style={{ color: resolvedTheme.text }}>{stat.label}</Text>
                </View>
              ))}
            </AppSurfaceCard>

            <View className="gap-3.5">
              <Text className="text-lg font-semibold" style={{ color: resolvedTheme.textMuted }}>Workouts</Text>
              <View className="flex-row flex-wrap gap-3">
                {model.routines.map((routine) => (
                  <AppSurfaceCard
                    key={routine.id}
                    theme={resolvedTheme}
                    containerClassName="min-h-[56px] w-[48%] justify-center rounded-[24px] overflow-hidden"
                    contentClassName="justify-center px-5 py-4"
                    testID={`program-sheet-routine-card-${routine.id}`}
                  >
                    <Text className="text-[15px] font-semibold" style={{ color: resolvedTheme.text }}>{routine.label}</Text>
                  </AppSurfaceCard>
                ))}
              </View>
            </View>

            <View className="gap-3.5">
              <Text className="text-lg font-semibold" style={{ color: resolvedTheme.textMuted }}>Schedule</Text>
              <View className="gap-4">
                {model.weeks.map((week) => (
                  <ProgramSheetWeekCard key={week.id} week={week} theme={resolvedTheme} onOpenWorkoutDetail={onOpenWorkoutDetail} onOpenTrainingCalendar={onOpenTrainingCalendar} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export function renderProgramSheet({ isVisible, onClose, onEditProgram, onOpenWorkoutDetail, onOpenTrainingCalendar, model, theme }) {
  if (!model) {
    return null
  }

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <ProgramSheetContent model={model} theme={theme} onClose={onClose} onEditProgram={onEditProgram} onOpenWorkoutDetail={onOpenWorkoutDetail} onOpenTrainingCalendar={onOpenTrainingCalendar} />
      </SafeAreaProvider>
    </Modal>
  )
}
