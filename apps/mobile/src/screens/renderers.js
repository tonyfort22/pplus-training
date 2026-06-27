import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { getGenericSectionViewItems, getSessionViewItems } from './view-items.js';
import { MetricCard, SurfaceCard, EmptyCard, CreateWorkoutCard } from '../ui/cards.js';

export function renderGenericSections({ sections, styles, onActionTarget }) {
  return getGenericSectionViewItems(sections).map((section) => {
    if (section.type === 'action-card') {
      const { key, ...cardProps } = section
      return (
        <SurfaceCard
          key={key}
          styles={styles}
          {...cardProps}
          onAction={onActionTarget ? () => onActionTarget(section.targetKey, section.actionPayload) : undefined}
        />
      )
    }

    if (section.type === 'section-heading') {
      return (
        <View key={section.key} style={styles.sectionHeadingWrap}>
          <Text className="text-[24px] font-bold" style={{ color: styles.theme.text }}>{section.title}</Text>
        </View>
      )
    }

    if (section.type === 'header-card') {
      return (
        <View key={section.key} style={styles.headerCard}>
          <Text className="text-sm font-medium uppercase tracking-[1px]" style={{ color: styles.theme.accentText }}>{section.eyebrow}</Text>
          <Text className="text-[32px] font-bold" style={{ color: styles.theme.text }}>{section.title}</Text>
          <Text className="text-[15px] leading-[22px]" style={{ color: styles.theme.textMuted }}>{section.body}</Text>
        </View>
      )
    }

    if (section.type === 'empty-state-card') {
      const { key, ...cardProps } = section
      return (
        <EmptyCard
          key={key}
          styles={styles}
          {...cardProps}
        />
      )
    }

    if (section.type === 'create-workout-card') {
      const { key, ...cardProps } = section
      return (
        <CreateWorkoutCard
          key={key}
          styles={styles}
          {...cardProps}
          onAction={onActionTarget ? () => onActionTarget(section.targetKey, section.actionPayload) : undefined}
        />
      )
    }

    if (section.type === 'body-list') {
      return (
        <View key={section.key} style={section.title ? styles.sectionCard : styles.sectionListOnly}>
          {section.title ? <Text className="text-[20px] font-bold" style={{ color: styles.theme.text }}>{section.title}</Text> : null}
          {section.rows.map((row) => {
            const isActionable = !!(row.targetKey && onActionTarget)
            const RowWrapper = isActionable ? Pressable : View

            const rowBody = (
              <RowWrapper
                key={row.id || row.title}
                className="flex-row items-center overflow-hidden rounded-[24px]" style={{ backgroundColor: styles.theme.surface, borderWidth: 1, borderColor: styles.theme.border }}
                accessibilityLabel={isActionable ? `Open ${row.title}` : undefined}
                accessibilityRole={isActionable ? 'button' : undefined}
                testID={isActionable ? `body-list-row-${row.id || row.title}` : undefined}
                onPress={isActionable ? () => onActionTarget(row.targetKey, row.actionPayload) : undefined}
              >
                <View className="w-1 self-stretch" style={{ backgroundColor: styles.theme.accent }} />
                <View className="flex-1 flex-row items-center gap-3 px-5 py-4">
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="flex-1 text-[18px] font-bold" style={{ color: styles.theme.text }}>{row.title}</Text>
                      {row.badgeLabel ? (
                        <View className="rounded-full px-3 py-1" style={{ backgroundColor: styles.theme.accent }}>
                          <Text className="text-[11px] font-bold uppercase tracking-[1px]" style={{ color: styles.theme.accentText }}>{row.badgeLabel}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-[15px]" style={{ color: styles.theme.textSoft }}>{row.body}</Text>
                    {row.actionLabel ? (
                      <Text className="text-[12px] font-bold uppercase tracking-[1px]" style={{ color: styles.theme.accentText }}>{row.actionLabel}</Text>
                    ) : null}
                  </View>
                  {isActionable ? <ChevronRight color={styles.theme.iconMuted} size={18} strokeWidth={2.4} /> : null}
                </View>
              </RowWrapper>
            )

            return rowBody
          })}
        </View>
      )
    }

    if (section.type === 'calendar-strip') {
      return (
        <View key={section.key} style={styles.calendarStripCard}>
          <View className="flex-row items-start justify-between gap-3">
            {section.days.map((day) => {
              const columnClassName = 'flex-1 items-center'
              const weekdayClassName = [
                'mb-2 text-[10px] font-bold uppercase tracking-[1.2px]',
                '',
              ].join(' ')
              const dayButtonClassName = [
                'min-h-[42px] min-w-[40px] items-center justify-between rounded-[14px] px-2 pt-1 pb-1',
                '',
              ].join(' ')
              const dayNumberClassName = [
                'text-base font-medium',
                '',
              ].join(' ')
              const indicatorClassName = day.indicatorTone === 'none'
                ? 'h-1 w-3'
                : [
                    'h-1 w-3 rounded-full',
                    '',
                  ].join(' ')

              const dayContent = (
                <>
                  <Text className={weekdayClassName} style={{ color: day.isSelected ? styles.theme.textMuted : styles.theme.textSoft }}>{day.weekdayLabel}</Text>
                  <View className="min-h-[44px] min-w-[40px] items-center justify-between rounded-[14px] px-1.5 pt-1.5 pb-1" style={day.isSelected ? { borderWidth: 2, borderColor: styles.theme.accent, backgroundColor: styles.theme.surface } : { borderWidth: 1, borderColor: 'transparent', backgroundColor: 'transparent' }}>
                    <Text className="text-[14px]" style={{ fontWeight: day.isSelected ? '700' : '500', color: styles.theme.text }}>{day.dateNumber}</Text>
                    <View className={day.indicatorTone === 'none' ? 'h-1 w-4' : 'h-1 w-4 rounded-full'} style={day.indicatorTone === 'none' ? null : { backgroundColor: day.indicatorTone === 'active' ? styles.theme.accent : styles.theme.borderStrong }} />
                  </View>
                </>
              )

              if (!day.targetKey || !onActionTarget) {
                return (
                  <View key={day.id} className={columnClassName}>
                    {dayContent}
                  </View>
                )
              }

              return (
                <Pressable
                  key={day.id}
                  accessibilityLabel={`Select ${day.weekdayLabel} ${day.dateNumber}`}
                  accessibilityRole="button"
                  testID={`calendar-day-${day.id}`}
                  className={columnClassName}
                  onPress={() => onActionTarget(day.targetKey, day.actionPayload)}
                >
                  {dayContent}
                </Pressable>
              )
            })}
          </View>
        </View>
      )
    }

    if (section.type === 'metrics-grid') {
      return (
        <View key={section.key} style={styles.metricsGrid}>
          {section.items.map((metric) => (
            <MetricCard key={metric.label} styles={styles} label={metric.label} value={metric.value} detail={metric.detail} />
          ))}
        </View>
      )
    }

    return (
      <View key={section.key} style={styles.sectionCard}>
        <Text className="text-[20px] font-bold" style={{ color: styles.theme.text }}>{section.title}</Text>
        <Text className="text-[15px] leading-[22px]" style={{ color: styles.theme.textMuted }}>{section.body}</Text>
        {section.rows?.map((row) => (
          <View key={row.title} style={styles.listRow}>
            <Text className="text-base font-bold" style={{ color: styles.theme.text }}>{row.title}</Text>
            <Text className="mt-1" style={{ color: styles.theme.textMuted }}>{row.body}</Text>
          </View>
        ))}
      </View>
    )
  })
}

export function renderTrainSurface({ trainRenderModel, sessionRenderModel, styles, onTrainTabPress, onActionTarget, renderSections, renderSessionSections }) {
  return (
    <>
      {trainRenderModel.showTabs ? (
        <View style={styles.trainTabsRow}>
          <View style={styles.trainTabsPill}>
            {trainRenderModel.tabs.map((tab) => (
              <Pressable
                key={tab.key}
                accessibilityLabel={`Open ${tab.label} train tab`}
                accessibilityRole="button"
                testID={`train-tab-${tab.key}`}
                style={[styles.trainTabButton, tab.isActive && styles.trainTabButtonActive]}
                onPress={() => onTrainTabPress(tab.key)}
              >
                <Text className="font-bold" style={{ color: tab.isActive ? styles.theme.text : styles.theme.textSoft }}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {trainRenderModel.content.type === 'sections' && renderSections(trainRenderModel.content.sections, onActionTarget)}
      {trainRenderModel.content.type === 'session-sections' && renderSessionSections(sessionRenderModel)}
    </>
  )
}

export function renderSessionSections({
  sections,
  styles,
  statusStyles,
  onFinishWorkout,
  onDiscardWorkout,
  onDismissRestTimer,
  onAdjustRestTimer,
  onCompleteSet,
  onQuickActualUpdate,
}) {
  return getSessionViewItems(sections).map((section) => {
    if (section.type === 'session-header-card') {
      return (
        <View key={section.key} style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View>
              <Text className="text-sm font-medium uppercase tracking-[1px]" style={{ color: styles.theme.accentText }}>{section.eyebrow}</Text>
              <Text className="text-[32px] font-bold" style={{ color: styles.theme.text }}>{section.title}</Text>
            </View>
            <View style={styles.headerActionsRow}>
              {section.discardLabel && !section.isCompleted && !section.isDiscarded ? (
                <Pressable onPress={onDiscardWorkout} style={styles.discardButton}>
                  <Text className="font-bold" style={{ color: styles.theme.dangerText }}>{section.discardLabel}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onFinishWorkout} style={[styles.finishButton, section.isCompleted && styles.finishButtonDone]}>
                <Text className="font-bold" style={{ color: styles.theme.text }}>{section.finishLabel}</Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-[18px] font-semibold" style={{ color: styles.theme.textMuted }}>{section.workoutTimerLabel}</Text>
          <Text className="text-[13px]" style={{ color: styles.theme.textSoft }}>{section.nextUpLabel}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${section.progressPercent}%` }]} />
          </View>
          <Text className="text-[13px]" style={{ color: styles.theme.textSoft }}>{section.progressLabel}</Text>
        </View>
      )
    }

    if (section.type === 'rest-timer-card') {
      return (
        <View key={section.key} style={styles.restCard}>
          <View style={styles.restHeaderRow}>
            <View>
              <Text className="text-xs font-medium uppercase tracking-[1px]" style={{ color: styles.theme.accentText }}>{section.eyebrow}</Text>
              <Text className="text-[18px] font-bold" style={{ color: styles.theme.text }}>{section.title}</Text>
            </View>
            <Pressable onPress={onDismissRestTimer}>
              <Text className="font-bold" style={{ color: styles.theme.accentText }}>{section.dismissLabel}</Text>
            </Pressable>
          </View>
          <Text className="text-[42px] font-bold" style={{ color: styles.theme.text }}>{section.clockLabel}</Text>
          <Text className="text-[15px] leading-[22px]" style={{ color: styles.theme.textMuted }}>{section.body}</Text>
          <View style={styles.restActions}>
            <Pressable style={styles.restActionButton} onPress={() => onAdjustRestTimer(-15)}>
              <Text className="font-bold" style={{ color: styles.theme.text }}>{section.minusLabel}</Text>
            </Pressable>
            <Pressable style={styles.restActionButton} onPress={() => onAdjustRestTimer(15)}>
              <Text className="font-bold" style={{ color: styles.theme.text }}>{section.plusLabel}</Text>
            </Pressable>
          </View>
        </View>
      )
    }

    return (
      <View key={section.key} style={styles.sectionCard}>
        <Text className="text-[20px] font-bold" style={{ color: styles.theme.text }}>{section.title}</Text>
        {section.exercises.map((exercise) => (
          <View key={exercise.key} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View>
                <Text className="text-[18px] font-bold" style={{ color: styles.theme.text }}>{exercise.title}</Text>
                <Text className="text-sm" style={{ color: styles.theme.textSoft }}>Rest {exercise.restLabel}</Text>
              </View>
              <View style={[styles.exerciseStatusBadge, statusStyles[exercise.status]]}>
                <Text className="text-xs font-bold" style={{ color: styles.theme.text }}>{exercise.status.replace('_', ' ')}</Text>
              </View>
            </View>

            {exercise.sets.map((set) => (
              <View
                key={set.key}
                style={[
                  styles.setRow,
                  set.isCurrent && styles.setRowCurrent,
                  set.isCompleted && styles.setRowCompleted,
                ]}
              >
                <Pressable style={styles.setCopy} onPress={() => onCompleteSet(exercise.id, set.id)}>
                  <Text className="text-base font-semibold" style={{ color: styles.theme.text }}>{set.title}</Text>
                  <Text className="mt-0.5 text-[13px]" style={{ color: styles.theme.textMuted }}>{set.prescribedLabel}</Text>
                  <Text className="mt-0.5 text-[13px]" style={{ color: styles.theme.textMuted }}>{set.actualLabel}</Text>
                </Pressable>

                <View style={styles.setControlsColumn}>
                  <View style={styles.actualControl}>
                    <Text className="text-xs font-bold" style={{ color: styles.theme.accentText }}>{set.loadControl.label}</Text>
                    <View style={styles.actualControlButtons}>
                      <Pressable style={styles.stepButton} onPress={() => onQuickActualUpdate(exercise.id, set.id, 'actualLoad', -5)}>
                        <Text className="font-bold" style={{ color: styles.theme.text }}>{set.loadControl.decrementLabel}</Text>
                      </Pressable>
                      <Text className="min-w-[28px] text-center font-bold" style={{ color: styles.theme.text }}>{set.loadControl.value}</Text>
                      <Pressable style={styles.stepButton} onPress={() => onQuickActualUpdate(exercise.id, set.id, 'actualLoad', 5)}>
                        <Text className="font-bold" style={{ color: styles.theme.text }}>{set.loadControl.incrementLabel}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.actualControl}>
                    <Text className="text-xs font-bold" style={{ color: styles.theme.accentText }}>{set.repsControl.label}</Text>
                    <View style={styles.actualControlButtons}>
                      <Pressable style={styles.stepButton} onPress={() => onQuickActualUpdate(exercise.id, set.id, 'actualReps', -1)}>
                        <Text className="font-bold" style={{ color: styles.theme.text }}>{set.repsControl.decrementLabel}</Text>
                      </Pressable>
                      <Text className="min-w-[28px] text-center font-bold" style={{ color: styles.theme.text }}>{set.repsControl.value}</Text>
                      <Pressable style={styles.stepButton} onPress={() => onQuickActualUpdate(exercise.id, set.id, 'actualReps', 1)}>
                        <Text className="font-bold" style={{ color: styles.theme.text }}>{set.repsControl.incrementLabel}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      set.completionTone === 'done'
                        ? styles.badgeDone
                        : set.completionTone === 'ready'
                          ? styles.badgeReady
                          : styles.badgeTodo,
                    ]}
                  >
                    <Text className="text-center text-[11px] font-bold" style={{ color: styles.theme.text }}>{set.completionLabel}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    )
  })
}
