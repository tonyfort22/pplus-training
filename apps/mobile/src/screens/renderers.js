import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { getGenericSectionViewItems, getSessionViewItems } from './view-items.js';
import { MetricCard, SurfaceCard } from '../ui/cards.js';

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
          <Text className="text-[22px] font-bold text-white">{section.title}</Text>
        </View>
      )
    }

    if (section.type === 'header-card') {
      return (
        <View key={section.key} style={styles.headerCard}>
          <Text className="text-sm font-medium uppercase tracking-[1px] text-emerald-200">{section.eyebrow}</Text>
          <Text className="text-[32px] font-bold text-white">{section.title}</Text>
          <Text className="text-[15px] leading-[22px] text-slate-300">{section.body}</Text>
        </View>
      )
    }

    if (section.type === 'body-list') {
      return (
        <View key={section.key} style={section.title ? styles.sectionCard : styles.sectionListOnly}>
          {section.title ? <Text className="text-[20px] font-bold text-white">{section.title}</Text> : null}
          {section.rows.map((row) => {
            const isActionable = !!(row.targetKey && onActionTarget)
            const RowWrapper = isActionable ? Pressable : View

            const rowBody = (
              <RowWrapper
                key={row.id || row.title}
                className="flex-row items-center overflow-hidden rounded-[22px] bg-slate-900"
                onPress={isActionable ? () => onActionTarget(row.targetKey, row.actionPayload) : undefined}
              >
                <View className="w-1 self-stretch bg-emerald-400" />
                <View className="flex-1 flex-row items-center gap-3 px-4 py-[14px]">
                  <View className="flex-1 gap-1">
                    <Text className="text-[18px] font-bold text-white">{row.title}</Text>
                    <Text className="text-sm text-slate-400">{row.body}</Text>
                  </View>
                  {isActionable ? <ChevronRight color="#94a3b8" size={18} strokeWidth={2.4} /> : null}
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
          <View className="flex-row items-start justify-between gap-0.5">
            {section.days.map((day) => {
              const columnClassName = 'flex-1 items-center'
              const weekdayClassName = [
                'mb-2.5 text-[11px] font-bold uppercase tracking-[1px]',
                day.isSelected ? 'text-slate-300' : 'text-slate-400',
              ].join(' ')
              const dayButtonClassName = [
                'min-h-[42px] min-w-[40px] items-center justify-between rounded-[14px] px-2 pt-1 pb-1',
                day.isSelected ? 'border-2 border-emerald-400 bg-slate-950' : 'border border-transparent bg-transparent',
              ].join(' ')
              const dayNumberClassName = [
                'text-base font-medium',
                day.isSelected ? 'font-bold text-emerald-400' : 'text-slate-50',
              ].join(' ')
              const indicatorClassName = day.indicatorTone === 'none'
                ? 'h-1 w-3'
                : [
                    'h-1 w-3 rounded-full',
                    day.indicatorTone === 'active' ? 'bg-emerald-400' : 'bg-slate-600',
                  ].join(' ')

              const dayContent = (
                <>
                  <Text className={weekdayClassName}>{day.weekdayLabel}</Text>
                  <View className={dayButtonClassName}>
                    <Text className={dayNumberClassName}>{day.dateNumber}</Text>
                    <View className={indicatorClassName} />
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
                <Pressable key={day.id} className={columnClassName} onPress={() => onActionTarget(day.targetKey, day.actionPayload)}>
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
        <Text className="text-[20px] font-bold text-white">{section.title}</Text>
        <Text className="text-[15px] leading-[22px] text-slate-300">{section.body}</Text>
        {section.rows?.map((row) => (
          <View key={row.title} style={styles.listRow}>
            <Text className="text-base font-bold text-white">{row.title}</Text>
            <Text className="mt-1 text-slate-300">{row.body}</Text>
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
                style={[styles.trainTabButton, tab.isActive && styles.trainTabButtonActive]}
                onPress={() => onTrainTabPress(tab.key)}
              >
                <Text className={tab.isActive ? 'font-bold text-white' : 'font-bold text-slate-400'}>{tab.label}</Text>
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
              <Text className="text-sm font-medium uppercase tracking-[1px] text-emerald-200">{section.eyebrow}</Text>
              <Text className="text-[32px] font-bold text-white">{section.title}</Text>
            </View>
            <View style={styles.headerActionsRow}>
              {section.discardLabel && !section.isCompleted && !section.isDiscarded ? (
                <Pressable onPress={onDiscardWorkout} style={styles.discardButton}>
                  <Text className="font-bold text-red-200">{section.discardLabel}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onFinishWorkout} style={[styles.finishButton, section.isCompleted && styles.finishButtonDone]}>
                <Text className="font-bold text-white">{section.finishLabel}</Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-[18px] font-semibold text-slate-300">{section.workoutTimerLabel}</Text>
          <Text className="text-[13px] text-slate-400">{section.nextUpLabel}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${section.progressPercent}%` }]} />
          </View>
          <Text className="text-[13px] text-slate-400">{section.progressLabel}</Text>
        </View>
      )
    }

    if (section.type === 'rest-timer-card') {
      return (
        <View key={section.key} style={styles.restCard}>
          <View style={styles.restHeaderRow}>
            <View>
              <Text className="text-xs font-medium uppercase tracking-[1px] text-emerald-200">{section.eyebrow}</Text>
              <Text className="text-[18px] font-bold text-white">{section.title}</Text>
            </View>
            <Pressable onPress={onDismissRestTimer}>
              <Text className="font-bold text-emerald-200">{section.dismissLabel}</Text>
            </Pressable>
          </View>
          <Text className="text-[42px] font-bold text-white">{section.clockLabel}</Text>
          <Text className="text-[15px] leading-[22px] text-slate-300">{section.body}</Text>
          <View style={styles.restActions}>
            <Pressable style={styles.restActionButton} onPress={() => onAdjustRestTimer(-15)}>
              <Text className="font-bold text-white">{section.minusLabel}</Text>
            </Pressable>
            <Pressable style={styles.restActionButton} onPress={() => onAdjustRestTimer(15)}>
              <Text className="font-bold text-white">{section.plusLabel}</Text>
            </Pressable>
          </View>
        </View>
      )
    }

    return (
      <View key={section.key} style={styles.sectionCard}>
        <Text className="text-[20px] font-bold text-white">{section.title}</Text>
        {section.exercises.map((exercise) => (
          <View key={exercise.key} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View>
                <Text className="text-[18px] font-bold text-white">{exercise.title}</Text>
                <Text className="text-sm text-slate-400">Rest {exercise.restLabel}</Text>
              </View>
              <View style={[styles.exerciseStatusBadge, statusStyles[exercise.status]]}>
                <Text className="text-xs font-bold text-white">{exercise.status.replace('_', ' ')}</Text>
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
                  <Text className="text-base font-semibold text-white">{set.title}</Text>
                  <Text className="mt-0.5 text-[13px] text-slate-300">{set.prescribedLabel}</Text>
                  <Text className="mt-0.5 text-[13px] text-slate-300">{set.actualLabel}</Text>
                </Pressable>

                <View style={styles.setControlsColumn}>
                  <View style={styles.actualControl}>
                    <Text className="text-xs font-bold text-emerald-200">{set.loadControl.label}</Text>
                    <View style={styles.actualControlButtons}>
                      <Pressable style={styles.stepButton} onPress={() => onQuickActualUpdate(exercise.id, set.id, 'actualLoad', -5)}>
                        <Text className="font-bold text-white">{set.loadControl.decrementLabel}</Text>
                      </Pressable>
                      <Text className="min-w-[28px] text-center font-bold text-white">{set.loadControl.value}</Text>
                      <Pressable style={styles.stepButton} onPress={() => onQuickActualUpdate(exercise.id, set.id, 'actualLoad', 5)}>
                        <Text className="font-bold text-white">{set.loadControl.incrementLabel}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.actualControl}>
                    <Text className="text-xs font-bold text-emerald-200">{set.repsControl.label}</Text>
                    <View style={styles.actualControlButtons}>
                      <Pressable style={styles.stepButton} onPress={() => onQuickActualUpdate(exercise.id, set.id, 'actualReps', -1)}>
                        <Text className="font-bold text-white">{set.repsControl.decrementLabel}</Text>
                      </Pressable>
                      <Text className="min-w-[28px] text-center font-bold text-white">{set.repsControl.value}</Text>
                      <Pressable style={styles.stepButton} onPress={() => onQuickActualUpdate(exercise.id, set.id, 'actualReps', 1)}>
                        <Text className="font-bold text-white">{set.repsControl.incrementLabel}</Text>
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
                    <Text className="text-center text-[11px] font-bold text-white">{set.completionLabel}</Text>
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
