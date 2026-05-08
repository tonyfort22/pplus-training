import { Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { AppButton, AppStatusBadge, AppSurfaceCard } from './primitives.js';

function ProgramSummaryCard({ theme, onAction, title, programName, dateRangeLabel, body, weekLabel, completionLabel, progressSegments }) {
  return (
    <AppSurfaceCard theme={theme} onPress={onAction} accent contentClassName="gap-4 pl-6 pr-5 py-5">
      {title ? <Text className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>{title}</Text> : null}
      <Text className="text-[20px] font-bold" style={{ color: theme.text }}>{programName || title}</Text>
      <Text className="text-[15px]" style={{ color: theme.textSoft }}>{dateRangeLabel || body}</Text>
      <View className="flex-row gap-2">
        {progressSegments.map((segment) => {
          const backgroundColor = segment.isCurrent
            ? theme.accentSoft
            : segment.isComplete
              ? theme.accent
              : theme.borderStrong

          return <View key={segment.id} className="h-[10px] flex-1 rounded-full" style={{ backgroundColor }} />
        })}
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[14px] font-semibold" style={{ color: theme.textMuted }}>{weekLabel}</Text>
        <Text className="text-[14px] font-semibold" style={{ color: theme.textMuted }}>{completionLabel}</Text>
      </View>
    </AppSurfaceCard>
  )
}

function TodaySummaryCard({ theme, onAction, title, workoutName, summaryLabel, scheduledLabel, quickSummary, body, statusLabel, completionTone }) {
  const isDone = completionTone === 'done'
  const hasStatusBadge = Boolean(statusLabel)
  const metaLine = summaryLabel || scheduledLabel || quickSummary || body

  return (
    <AppSurfaceCard theme={theme} onPress={onAction} contentClassName="gap-3 px-5 py-5" containerClassName="rounded-[24px] overflow-hidden">
      <View className="flex-row items-start gap-4">
        <View className="flex-1 gap-2.5">
          <View className="gap-1.5">
            {title ? <Text className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>{title}</Text> : null}
            <Text className="text-[20px] font-bold" style={{ color: theme.text }}>{workoutName || title}</Text>
          </View>
          <Text className="text-[15px] font-medium" style={{ color: theme.textSoft }}>{metaLine}</Text>
        </View>
        {hasStatusBadge ? (
          <AppStatusBadge
            theme={theme}
            tone={isDone ? 'accent' : 'accent'}
            label={statusLabel}
          />
        ) : null}
      </View>
    </AppSurfaceCard>
  )
}

export function EmptyCard({ styles, title, body }) {
  const theme = styles.theme

  return (
    <AppSurfaceCard theme={theme} contentClassName={body ? "gap-2 px-5 py-5" : "px-5 py-5"}>
      <Text className="text-[16px] font-normal" style={{ color: theme.text }}>{title}</Text>
      {body ? <Text className="text-[13px] font-normal leading-[20px]" style={{ color: theme.textMuted }}>{body}</Text> : null}
    </AppSurfaceCard>
  )
}

export function CreateWorkoutCard({ styles, title, subtitle, onAction }) {
  const theme = styles.theme

  return (
    <AppSurfaceCard
      theme={theme}
      onPress={onAction}
      contentClassName="flex-row items-center justify-between px-6 py-5"
      style={{
        borderColor: theme.accent,
        borderWidth: 1.5,
        backgroundColor: theme.background,
      }}
      containerClassName="rounded-[30px] overflow-hidden"
    >
      <View className="flex-1 pr-4">
        <Text className="text-[20px] font-semibold" style={{ color: theme.accentText }}>{title}</Text>
        <Text className="mt-1 text-[15px]" style={{ color: theme.accentText }}>{subtitle}</Text>
      </View>
      <Plus color={theme.accentText} size={28} strokeWidth={2.1} />
    </AppSurfaceCard>
  )
}

export function SurfaceCard({
  styles,
  title,
  body,
  actionLabel,
  onAction,
  variant,
  programName,
  dateRangeLabel,
  weekLabel,
  completionLabel,
  progressSegments = [],
  workoutName,
  scheduledLabel,
  summaryLabel,
  statusLabel,
  quickSummary,
  completionTone,
}) {
  const theme = styles.theme

  if (variant === 'program-summary') {
    return (
      <ProgramSummaryCard
        theme={theme}
        onAction={onAction}
        title={title}
        programName={programName}
        dateRangeLabel={dateRangeLabel}
        body={body}
        weekLabel={weekLabel}
        completionLabel={completionLabel}
        progressSegments={progressSegments}
      />
    )
  }

  if (variant === 'today-summary') {
    return (
      <TodaySummaryCard
        theme={theme}
        onAction={onAction}
        title={title}
        workoutName={workoutName}
        summaryLabel={summaryLabel}
        scheduledLabel={scheduledLabel}
        quickSummary={quickSummary}
        body={body}
        statusLabel={statusLabel}
        completionTone={completionTone}
      />
    )
  }

  return (
    <AppSurfaceCard theme={theme} contentClassName="gap-3 p-5">
      <Text className="text-[20px] font-bold" style={{ color: theme.text }}>{title}</Text>
      <Text className="text-[15px] leading-[22px]" style={{ color: theme.textMuted }}>{body}</Text>
      {actionLabel ? (
        <AppButton theme={theme} label={actionLabel} onPress={onAction} />
      ) : null}
    </AppSurfaceCard>
  )
}

export function MetricCard({ styles, label, value, detail }) {
  const theme = styles.theme

  return (
    <AppSurfaceCard theme={theme} contentClassName="gap-2 p-5" containerClassName="rounded-[20px] overflow-hidden">
      <Text className="font-bold" style={{ color: theme.accentText }}>{label}</Text>
      <Text className="text-[28px] font-bold" style={{ color: theme.text }}>{value}</Text>
      <Text className="leading-5" style={{ color: theme.textMuted }}>{detail}</Text>
    </AppSurfaceCard>
  )
}
