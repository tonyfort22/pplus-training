import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

function ProgramSummaryCard({ onAction, title, programName, dateRangeLabel, body, weekLabel, completionLabel, progressSegments }) {
  const CardWrapper = onAction ? Pressable : View

  return (
    <CardWrapper className="flex-row overflow-hidden rounded-[22px] bg-slate-900" onPress={onAction}>
      <View className="w-1 self-stretch bg-emerald-400" />
      <View className="flex-1 gap-3 px-4 py-[18px]">
        {title ? <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-400">{title}</Text> : null}
        <Text className="text-[18px] font-bold text-white">{programName || title}</Text>
        <Text className="text-sm text-slate-400">{dateRangeLabel || body}</Text>
        <View className="flex-row gap-1.5">
          {progressSegments.map((segment) => {
            const stateClass = segment.isCurrent
              ? 'bg-violet-700'
              : segment.isComplete
                ? 'bg-violet-500'
                : 'bg-slate-700'

            return <View key={segment.id} className={`h-2 flex-1 rounded-full ${stateClass}`} />
          })}
        </View>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-[12px] font-semibold text-slate-300">{weekLabel}</Text>
          <Text className="text-[12px] font-semibold text-slate-300">{completionLabel}</Text>
        </View>
      </View>
    </CardWrapper>
  )
}

function TodaySummaryCard({ onAction, title, workoutName, summaryLabel, scheduledLabel, quickSummary, body, statusLabel, completionTone }) {
  const CardWrapper = onAction ? Pressable : View
  const isDone = completionTone === 'done'
  const metaLine = summaryLabel || scheduledLabel || quickSummary || body

  return (
    <CardWrapper className="flex-row items-stretch gap-3 rounded-[18px] bg-slate-900 p-[14px]" onPress={onAction}>
      <View className="flex-1 gap-2">
        <View className="gap-0.5">
          {title ? <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-400">{title}</Text> : null}
          <Text className="text-[18px] font-bold text-white">{workoutName || title}</Text>
        </View>
        <Text className="text-xs font-medium text-slate-400">{metaLine}</Text>
        {statusLabel ? <Text className="text-xs font-semibold text-slate-500">{statusLabel}</Text> : null}
      </View>
      <View
        className={[
          'h-7 w-7 items-center justify-center self-center rounded-lg border',
          isDone ? 'border-emerald-500 bg-emerald-950' : 'border-slate-600 bg-slate-800',
        ].join(' ')}
      >
        <Check color={isDone ? '#34d399' : '#94a3b8'} size={15} strokeWidth={2.8} />
      </View>
    </CardWrapper>
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
  if (variant === 'program-summary') {
    return (
      <ProgramSummaryCard
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
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
      {actionLabel ? (
        <Pressable style={styles.primaryAction} onPress={onAction}>
          <Text style={styles.primaryActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function MetricCard({ styles, label, value, detail }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  )
}
