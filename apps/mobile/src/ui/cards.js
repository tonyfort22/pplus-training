import { Pressable, Text, View } from 'react-native';

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
    const CardWrapper = onAction ? Pressable : View

    return (
      <CardWrapper style={styles.programCard} onPress={onAction}>
        <View style={styles.programAccentRail} />
        <View style={styles.programCardContent}>
          {title ? <Text style={styles.programCardLabel}>{title}</Text> : null}
          <Text style={styles.programCardTitle}>{programName || title}</Text>
          <Text style={styles.programCardDateRange}>{dateRangeLabel || body}</Text>
          <View style={styles.programProgressRow}>
            {progressSegments.map((segment) => (
              <View
                key={segment.id}
                style={[
                  styles.programProgressSegment,
                  segment.isComplete && styles.programProgressSegmentComplete,
                  segment.isCurrent && styles.programProgressSegmentCurrent,
                ]}
              />
            ))}
          </View>
          <View style={styles.programMetaRow}>
            <Text style={styles.programMetaText}>{weekLabel}</Text>
            <Text style={styles.programMetaText}>{completionLabel}</Text>
          </View>
        </View>
      </CardWrapper>
    )
  }

  if (variant === 'today-summary') {
    const CardWrapper = onAction ? Pressable : View
    const isDone = completionTone === 'done'
    const metaLine = summaryLabel || scheduledLabel || quickSummary || body

    return (
      <CardWrapper style={styles.todayCard} onPress={onAction}>
        <View style={styles.todayCardContent}>
          <View style={styles.todayCardTitleBlock}>
            {title ? <Text style={styles.todayCardLabel}>{title}</Text> : null}
            <Text style={styles.todayCardWorkoutName}>{workoutName || title}</Text>
          </View>
          <Text style={styles.todayCardSummary}>{metaLine}</Text>
          {statusLabel ? <Text style={styles.todayCardFooterStatus}>{statusLabel}</Text> : null}
        </View>
        <View style={[styles.todayCardCheckWrap, isDone && styles.todayCardCheckWrapDone]}>
          <Text style={[styles.todayCardCheckIcon, isDone && styles.todayCardCheckIconDone]}>✓</Text>
        </View>
      </CardWrapper>
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
