import { useEffect, useMemo, useState } from 'react'
import * as data from '../../../../packages/data/src/index.js'
import { Check, ChevronDown, ChevronLeft, Clock3, Heart, SlidersHorizontal, Waves } from 'lucide-react-native'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SvgXml } from 'react-native-svg'
import { recoveryMuscleMapSvg, RECOVERY_GROUP_TO_SVG_IDS, getRecoveryColorForPercent, applyRecoveryColorsToSvg, applyFocusedRecoveryColorsToSvg } from '../assets/recovery-muscle-map.js'
import { getAnalyticsViewModel } from '../progress/index.js'
import { getAppTheme } from '../theme/app-theme.js'
import { ExerciseLibraryView } from './exercise-library-view.js'
import {
  resolveMetricProfileIdFromExercise,
} from '../train/exercise-metric-profile-resolution.js'
import { buildStrengthExerciseOptions, buildVisibleStrengthCards, normalizeStrengthExerciseName, getInitialStrengthSelectionIds, getInitialStrengthSelectionState, copyAppliedToDraft, toggleStrengthExerciseDraft, applyStrengthExerciseDraft, getDefaultSyncedStrengthSelection, reconcileStrengthExerciseSelectionIds, reconcileAppliedStrengthExerciseSelectionIds, resolveStrengthSelectionStorage, readStoredStrengthSelectionState, writeStoredStrengthSelectionState } from './analytics-strength-state.js'


function createMobileExerciseLibraryClient({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  if (!env?.EXPO_PUBLIC_SUPABASE_URL || !env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  return data.exercises.createSupabaseRestExerciseRepository({
    url: env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    fetchImpl,
  })
}

function getProgressOptionIdForExercise(exercise) {
  const metricProfileId = resolveMetricProfileIdFromExercise(exercise)
  if (metricProfileId === 'speed_time') return 'speed'
  if (metricProfileId === 'distance_load') return 'loaded-carry'
  if (metricProfileId === 'bodyweight_reps') return 'bodyweight'
  if (metricProfileId === 'duration_hold') return 'holds'
  if (metricProfileId === 'strength_1rm') return 'strength'
  return null
}

function filterExerciseLibraryItemsForProgressOption(exercises = [], optionId) {
  if (!optionId || optionId === 'consistency') return []
  return exercises.filter((exercise) => getProgressOptionIdForExercise(exercise) === optionId)
}

function parseRecoveryPercentageLabel(label) {
  const match = String(label || '').match(/(\d+)/)
  if (!match) return 100
  return Number(match[1])
}

function AnalyticsDropdown({ label, onPress, theme, styles }) {
  return (
    <Pressable style={styles.dropdownButton} onPress={onPress}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <ChevronDown color={theme.iconMuted} size={16} strokeWidth={2.4} />
    </Pressable>
  )
}

function areExerciseIdListsEqual(left = [], right = []) {
  if (left === right) return true
  if (!Array.isArray(left) || !Array.isArray(right)) return false
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

function AnalyticsOptionSheet({ title, options, activeOptionId, onClose, onSelect, theme, styles }) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.optionSheetWrap}>
        <Pressable style={styles.optionSheetBackdrop} onPress={onClose} />
        <View style={styles.optionSheet}>
          <View style={styles.optionSheetHandle} />
          <Text style={styles.optionSheetTitle}>{title}</Text>
          <View style={styles.optionSheetDivider} />
          {options.map((option) => {
            const isSelected = option.id === activeOptionId
            return (
              <Pressable key={option.id} style={styles.optionSheetRow} onPress={() => onSelect(option.id)}>
                <Text style={[styles.optionSheetLabel, isSelected && styles.optionSheetLabelSelected]}>
                  {option.sheetLabel || option.label}
                </Text>
                {isSelected ? <Check color={theme.accentText} size={18} strokeWidth={2.6} /> : null}
              </Pressable>
            )
          })}
        </View>
      </View>
    </Modal>
  )
}

function ConsistencyBarChart({ chart, theme, styles }) {
  const maxChartValue = Math.max(6, ...chart.bars.map((bar) => bar.value || 0))

  return (
    <View style={styles.consistencyCardContent}>
      <Text style={styles.consistencyChartTitle}>WORKOUTS PER WEEK</Text>

      <View style={styles.consistencyChartWrap}>
        <View style={[styles.consistencyGridline, styles.consistencyGridlineTop]} />
        <View style={[styles.consistencyGridline, styles.consistencyGridlineMiddle]} />
        <View style={[styles.consistencyGridline, styles.consistencyGridlineBottom]} />

        <View style={styles.consistencyYAxisLabels}>
          {chart.yAxisLabels.map((label) => (
            <Text key={label} style={styles.consistencyYAxisLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.consistencyBarsWrap}>
          <View style={styles.consistencyBarsRow}>
            {chart.bars.map((bar) => {
              const barHeight = maxChartValue > 0 ? `${Math.max(0, (bar.value / maxChartValue) * 100)}%` : '0%'
              return (
                <View key={bar.id || bar.label} style={styles.consistencyBarColumn}>
                  <View style={styles.consistencyBarTrack}>
                    {bar.value > 0 ? (
                      <View
                        style={[
                          styles.consistencyBarFill,
                          {
                            height: barHeight,
                            minHeight: 8,
                            backgroundColor: theme.accentText,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        <View style={styles.consistencyXAxisLabels}>
          {chart.xAxisLabels.map((label) => (
            <Text key={label} style={styles.consistencyXAxisLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}

function RecoveryFigure({ styles, svg }) {
  return (
    <View style={styles.recoveryFigureWrap}>
      <SvgXml xml={svg} width="100%" height="100%" />
    </View>
  )
}

function RecoveryCard({ row, onPress, isCompact = false, isBackCard = false, children, styles }) {
  const cardStyle = [
    styles.recoveryCard,
    isCompact ? styles.recoveryCardCompact : null,
    isBackCard ? styles.recoveryBackCard : null,
  ]

  if (children) {
    return (
      <Pressable style={cardStyle} onPress={onPress}>
        {children}
      </Pressable>
    )
  }

  const recoveryPercent = parseRecoveryPercentageLabel(row.percentageLabel)
  const recoveryBarColor = getRecoveryColorForPercent(recoveryPercent)
  const recoveryBarMinWidth = recoveryPercent === 0 ? 6 : 0

  return (
    <Pressable style={cardStyle} onPress={onPress}>
      <Text style={styles.recoveryCardLabel}>{row.label}</Text>
      <View style={styles.recoveryBarTrack}>
        <View style={[styles.recoveryBarFill, { width: row.barWidth, minWidth: recoveryBarMinWidth, backgroundColor: recoveryBarColor }]} />
      </View>
      <Text style={styles.recoveryCardValue}>{row.percentageLabel}</Text>
    </Pressable>
  )
}

function RecoveryBackButton({ theme, styles }) {
  return (
    <View style={styles.recoveryBackButton}>
      <ChevronLeft color={theme.accentText} size={18} strokeWidth={2.4} />
    </View>
  )
}

function RecoveryOverview({ rows, onSelectMuscle, styles, svg }) {
  return (
    <View style={styles.trainingLoadContent}>
      <RecoveryFigure styles={styles} svg={svg} />
      <View style={styles.recoveryGridColumn}>
        <View style={styles.recoveryGridRow}>
          <RecoveryCard row={rows[0]} onPress={() => onSelectMuscle(rows[0])} styles={styles} />
          <RecoveryCard row={rows[1]} onPress={() => onSelectMuscle(rows[1])} styles={styles} />
        </View>
        <View style={styles.recoveryGridRow}>
          <RecoveryCard row={rows[2]} onPress={() => onSelectMuscle(rows[2])} styles={styles} />
          <RecoveryCard row={rows[3]} onPress={() => onSelectMuscle(rows[3])} styles={styles} />
        </View>
        <View style={styles.recoveryGridRow}>
          <RecoveryCard row={rows[4]} onPress={() => onSelectMuscle(rows[4])} styles={styles} />
          <RecoveryCard row={rows[5]} onPress={() => onSelectMuscle(rows[5])} styles={styles} />
        </View>
      </View>
    </View>
  )
}

function RecoveryDetailView({ muscleGroup, onBack, theme, styles, svg }) {
  const detailSubMuscles = muscleGroup.subMuscles || []
  const primaryDetailMuscle = detailSubMuscles[0] || null
  const secondaryDetailMuscles = detailSubMuscles.slice(1, 3)

  return (
    <View style={styles.trainingLoadContent}>
      <RecoveryFigure styles={styles} svg={svg} />
      <View style={styles.recoveryDetailColumn}>
        <View style={styles.recoveryDetailTopRow}>
          <RecoveryCard isBackCard onPress={onBack} styles={styles}>
            <RecoveryBackButton theme={theme} styles={styles} />
          </RecoveryCard>
          {primaryDetailMuscle ? <RecoveryCard row={primaryDetailMuscle} isCompact styles={styles} /> : <View style={styles.recoveryDetailCardSpacer} />}
        </View>
        <View style={styles.recoveryDetailBottomRow}>
          {secondaryDetailMuscles.map((row) => (
            <RecoveryCard key={row.id} row={row} isCompact styles={styles} />
          ))}
          {secondaryDetailMuscles.length < 2 ? <View style={styles.recoveryDetailCardSpacer} /> : null}
        </View>
      </View>
    </View>
  )
}

function ActivityCard({ row, onPress, isCompact = false, isBackCard = false, children, styles }) {
  const cardStyle = [
    styles.recoveryCard,
    isCompact ? styles.recoveryCardCompact : null,
    isBackCard ? styles.recoveryBackCard : null,
  ]

  if (children) {
    return (
      <Pressable style={cardStyle} onPress={onPress}>
        {children}
      </Pressable>
    )
  }

  return (
    <Pressable style={cardStyle} onPress={onPress}>
      <Text style={styles.recoveryCardLabel}>{row.label}</Text>
      <Text style={styles.activityCardValue}>{row.setCountLabel}</Text>
    </Pressable>
  )
}

function ActivityOverview({ rows, onSelectMuscle, styles, svg }) {
  return (
    <View style={styles.trainingLoadContent}>
      <RecoveryFigure styles={styles} svg={svg} />
      <View style={styles.recoveryGridColumn}>
        <View style={styles.recoveryGridRow}>
          <ActivityCard row={rows[0]} onPress={() => onSelectMuscle(rows[0])} styles={styles} />
          <ActivityCard row={rows[1]} onPress={() => onSelectMuscle(rows[1])} styles={styles} />
        </View>
        <View style={styles.recoveryGridRow}>
          <ActivityCard row={rows[2]} onPress={() => onSelectMuscle(rows[2])} styles={styles} />
          <ActivityCard row={rows[3]} onPress={() => onSelectMuscle(rows[3])} styles={styles} />
        </View>
        <View style={styles.recoveryGridRow}>
          <ActivityCard row={rows[4]} onPress={() => onSelectMuscle(rows[4])} styles={styles} />
          <ActivityCard row={rows[5]} onPress={() => onSelectMuscle(rows[5])} styles={styles} />
        </View>
      </View>
    </View>
  )
}

function ActivityDetailView({ muscleGroup, onBack, theme, styles, svg }) {
  return (
    <View style={styles.trainingLoadContent}>
      <RecoveryFigure styles={styles} svg={svg} />
      <View style={styles.recoveryDetailColumn}>
        <View style={styles.recoveryDetailTopRow}>
          <ActivityCard isBackCard onPress={onBack} styles={styles}>
            <RecoveryBackButton theme={theme} styles={styles} />
          </ActivityCard>
          <ActivityCard row={muscleGroup.subMuscles[0]} isCompact styles={styles} />
        </View>
        <View style={styles.recoveryDetailBottomRow}>
          <ActivityCard row={muscleGroup.subMuscles[1]} isCompact styles={styles} />
          <ActivityCard row={muscleGroup.subMuscles[2]} isCompact styles={styles} />
        </View>
      </View>
    </View>
  )
}

function HealthMetricCard({ metric, theme, styles }) {
  return (
    <View style={styles.healthMetricCard}>
      <View style={styles.healthMetricIconWrap}>
        {metric.icon === 'sleep' ? <Clock3 color={theme.iconMuted} size={16} strokeWidth={2.2} /> : null}
        {metric.icon === 'heart' ? <Heart color={theme.iconMuted} size={16} strokeWidth={2.2} /> : null}
        {metric.icon === 'waves' ? <Waves color={theme.iconMuted} size={16} strokeWidth={2.2} /> : null}
      </View>
      <Text style={styles.healthMetricLabel}>{metric.label}</Text>
      <Text style={styles.healthMetricValue}>--</Text>
    </View>
  )
}

function StrengthMetricRow({ card, styles, sourceSurface = 'metrics-strength', onOpenExerciseDetail }) {
  const canOpenExerciseDetail = Boolean(card.exerciseId) && !String(card.exerciseId).startsWith('empty-') && typeof onOpenExerciseDetail === 'function'

  return (
    <Pressable
      onPress={canOpenExerciseDetail ? () => onOpenExerciseDetail?.({
        id: card.exerciseId || card.id,
        exerciseId: card.exerciseId || card.id,
        name: card.exerciseName,
        videoUrl: card.videoUrl || null,
        thumbnailUrl: card.thumbnailUrl || null,
        metricProfileId: card.metricProfileId || null,
        stimulusType: card.stimulusType || null,
        movementPattern: card.movementPattern || null,
        sourceSurface,
      }) : undefined}
      style={styles.progressStrengthRow}
    >
      <Text style={styles.progressExerciseLabel}>{card.exerciseName}</Text>
      <View style={styles.progressStrengthValueRow}>
        <Text style={styles.progressStrengthValueText}>{card.oneRepMaxValueLabel}</Text>

        <View style={styles.progressSetPill}>
          <Text style={styles.progressSetPillText}>{card.sourcePerformanceTagLabel}</Text>
        </View>
      </View>
    </Pressable>
  )
}

function StrengthMetricsCard({ cards, theme, styles, metricLabel, filterLabel, emptyMessage = 'No logged strength sets yet', sourceSurface, onOpenFilter, onOpenExerciseDetail }) {
  const resolvedCards = cards.length === 0
    ? [{
        id: `empty-${filterLabel}`,
        exerciseId: `empty-${filterLabel}`,
        exerciseName: filterLabel,
        oneRepMaxValueLabel: '--',
        sourcePerformanceTagLabel: emptyMessage,
        isMetricMissing: true,
      }]
    : cards

  return (
    <View style={styles.progressStrengthCard}>
      <View style={styles.progressStrengthCardHeader}>
        <Text style={styles.progressStrengthMetricLabel}>{metricLabel}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${filterLabel} exercise filter`} hitSlop={20} onPress={onOpenFilter} style={styles.progressStrengthFilterButton}>
          <SlidersHorizontal color={theme.iconMuted} size={16} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.progressStrengthRows}>
        {resolvedCards.map((card, index) => (
          <View key={card.id} style={index > 0 ? styles.progressStrengthRowDivider : null}>
            <StrengthMetricRow key={card.id} card={card} styles={styles} sourceSurface={sourceSurface} onOpenExerciseDetail={onOpenExerciseDetail} />
          </View>
        ))}
      </View>
    </View>
  )
}

function StrengthExerciseFilterView({
  isVisible,
  theme,
  exercises = [],
  selectedExercises = [],
  selectedExerciseIds = [],
  onToggleExercise,
  onApply,
  onClose,
  isLoading = false,
  error = '',
  searchQuery = '',
  onSearchChange,
}) {
  if (!isVisible) return null

  const maxStrengthSelectionReached = selectedExerciseIds.length >= 4

  return (
    <ExerciseLibraryView
      title="Exercises"
      searchPlaceholder="Search or Create Exercises"
      onBack={onClose}
      exercises={exercises}
      isLoading={isLoading}
      error={error}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      theme={theme}
      selectedExercises={selectedExercises}
      showSelectedSection
      selectedSectionTitle=""
      selectedSectionHelperText={maxStrengthSelectionReached ? 'Select up to 4 exercises maximum' : ''}
      selectable
      selectedExerciseIds={selectedExerciseIds}
      onToggleExercise={onToggleExercise}
      primaryActionLabel="Update Chart"
      onPrimaryAction={onApply}
      primaryActionDisabled={selectedExerciseIds.length === 0}
    />
  )
}

export function AnalyticsView({ model = getAnalyticsViewModel(), theme, onOpenExerciseDetail = null }) {
  const resolvedTheme = theme || getAppTheme('dark')
  const styles = createAnalyticsStyles(resolvedTheme)
  const [activeSheet, setActiveSheet] = useState(null)
  const [activeProgressOptionId, setActiveProgressOptionId] = useState(model.activeProgressOptionId)
  const [activeTrainingLoadOptionId, setActiveTrainingLoadOptionId] = useState(model.activeTrainingLoadOptionId)
  const [activeRecoveryMuscleId, setActiveRecoveryMuscleId] = useState(null)
  const [activeActivityMuscleId, setActiveActivityMuscleId] = useState(null)
  const [isStrengthFilterViewOpen, setIsStrengthFilterViewOpen] = useState(false)
  const strengthSelectionPersistenceKey = model.strengthSelectionPersistenceKey || 'analytics-strength:default'
  const activeMetricCards = useMemo(() => model.progressMetricCardsByOptionId?.[activeProgressOptionId] || [], [activeProgressOptionId, model.progressMetricCardsByOptionId])
  const activeMetricLabel = useMemo(() => activeMetricCards[0]?.metricLabel || (activeProgressOptionId === 'speed' || activeProgressOptionId === 'loaded-carry' ? 'TIME' : activeProgressOptionId === 'bodyweight' ? 'REPS' : activeProgressOptionId === 'holds' ? 'DURATION' : model.oneRepMaxLabel), [activeMetricCards, activeProgressOptionId, model.oneRepMaxLabel])
  const activeMetricEmptyMessage = useMemo(() => activeProgressOptionId === 'loaded-carry' ? 'No logged loaded carry sets yet' : activeProgressOptionId === 'speed' ? 'No logged speed sets yet' : activeProgressOptionId === 'bodyweight' ? 'No logged bodyweight sets yet' : activeProgressOptionId === 'holds' ? 'No logged hold sets yet' : 'No logged strength sets yet', [activeProgressOptionId])
  const activeMetricSourceSurface = useMemo(() => `metrics-${activeProgressOptionId}`, [activeProgressOptionId])
  const activeMetricSelectionStorageKey = useMemo(() => `${strengthSelectionPersistenceKey}:${activeProgressOptionId}`, [activeProgressOptionId, strengthSelectionPersistenceKey])
  const activeMetricCardsKey = useMemo(() => activeMetricCards.map((card) => card.exerciseId || card.id).join('|'), [activeMetricCards])
  const activeDefaultMetricExerciseIds = useMemo(() => model.defaultMetricExerciseIdsByOptionId?.[activeProgressOptionId] || [], [activeProgressOptionId, model.defaultMetricExerciseIdsByOptionId])
  const initialStrengthSelectionState = useMemo(() => getInitialStrengthSelectionState({
    defaultStrengthExerciseIds: getInitialStrengthSelectionIds({
      defaultStrengthExerciseIds: activeDefaultMetricExerciseIds,
      strengthCards: activeMetricCards,
    }),
  }), [activeDefaultMetricExerciseIds, activeMetricCards])
  const [appliedStrengthExerciseIds, setAppliedStrengthExerciseIds] = useState(initialStrengthSelectionState.appliedStrengthExerciseIds)
  const [draftStrengthExerciseIds, setDraftStrengthExerciseIds] = useState(initialStrengthSelectionState.draftStrengthExerciseIds)
  const [appliedStrengthExercises, setAppliedStrengthExercises] = useState(initialStrengthSelectionState.appliedStrengthExercises)
  const [hasAppliedCustomStrengthFilter, setHasAppliedCustomStrengthFilter] = useState(initialStrengthSelectionState.hasAppliedCustomStrengthFilter)
  const [resolvedStrengthSelectionStorage, setResolvedStrengthSelectionStorage] = useState(null)
  const [isStrengthSelectionHydrated, setIsStrengthSelectionHydrated] = useState(false)
  const [strengthExerciseSearchQuery, setStrengthExerciseSearchQuery] = useState('')
  const [strengthExerciseLibraryState, setStrengthExerciseLibraryState] = useState({ items: [], isLoading: false, error: '' })
  const activeProgressOption = model.progressOptions.find((option) => option.id === activeProgressOptionId)?.label || 'Strength'
  const activeTrainingLoadOption = model.trainingLoadOptions.find((option) => option.id === activeTrainingLoadOptionId)?.label || 'Recovery'
  const recoveryMuscleGroups = model.recoveryMuscleGroups || model.recoveryRows || []
  const activeRecoveryMuscle = recoveryMuscleGroups.find((row) => row.id === activeRecoveryMuscleId) || null
  const recoverySvgColorMap = useMemo(() => {
    return recoveryMuscleGroups.reduce((accumulator, row) => {
      const color = getRecoveryColorForPercent(parseRecoveryPercentageLabel(row.percentageLabel))
      for (const svgId of RECOVERY_GROUP_TO_SVG_IDS[row.id] || []) {
        accumulator[svgId] = color
      }
      return accumulator
    }, {})
  }, [recoveryMuscleGroups])
  const focusedRecoverySvgIds = useMemo(() => (
    activeRecoveryMuscle ? RECOVERY_GROUP_TO_SVG_IDS[activeRecoveryMuscle.id] || [] : []
  ), [activeRecoveryMuscle])
  const recoveryFigureSvg = useMemo(() => {
    return focusedRecoverySvgIds.length > 0
      ? applyFocusedRecoveryColorsToSvg(recoveryMuscleMapSvg, recoverySvgColorMap, focusedRecoverySvgIds)
      : applyRecoveryColorsToSvg(recoveryMuscleMapSvg, recoverySvgColorMap)
  }, [recoveryMuscleMapSvg, recoverySvgColorMap, focusedRecoverySvgIds])
  const activityMuscleGroups = model.activityMuscleGroups || []
  const activeActivityMuscle = activityMuscleGroups.find((row) => row.id === activeActivityMuscleId) || null
  const metricCardByLibraryId = useMemo(() => new Map(activeMetricCards.map((card) => [card.exerciseId || card.id, card])), [activeMetricCards])
  const metricCardByExerciseName = useMemo(() => new Map(activeMetricCards.map((card) => [normalizeStrengthExerciseName(card.exerciseName), card])), [activeMetricCards])
  const strengthExerciseOptions = useMemo(() => buildStrengthExerciseOptions({
    strengthExerciseLibraryItems: strengthExerciseLibraryState.items,
    strengthCards: activeMetricCards,
  }), [activeMetricCards, strengthExerciseLibraryState.items])
  const strengthExerciseOptionById = useMemo(() => new Map(strengthExerciseOptions.map((exercise) => [exercise.id, exercise])), [strengthExerciseOptions])
  const strengthExerciseOptionByMetricExerciseId = useMemo(() => new Map(
    strengthExerciseOptions
      .filter((exercise) => exercise.metricExerciseId)
      .map((exercise) => [exercise.metricExerciseId, exercise])
  ), [strengthExerciseOptions])
  const strengthExerciseOptionByName = useMemo(() => new Map(strengthExerciseOptions.map((exercise) => [normalizeStrengthExerciseName(exercise.name), exercise])), [strengthExerciseOptions])
  const defaultStrengthSelectionSeedIds = useMemo(() => {
    if (activeDefaultMetricExerciseIds.length) return activeDefaultMetricExerciseIds
    return strengthExerciseOptions.map((exercise) => exercise.metricExerciseId || exercise.id)
  }, [activeDefaultMetricExerciseIds, strengthExerciseOptions])
  const defaultAppliedStrengthExerciseIds = useMemo(() => reconcileAppliedStrengthExerciseSelectionIds(getInitialStrengthSelectionIds({
    defaultStrengthExerciseIds: defaultStrengthSelectionSeedIds,
    strengthCards: activeMetricCards,
  }), {
    strengthExerciseOptionById,
    strengthExerciseOptionByMetricExerciseId,
    metricCardByLibraryId,
    metricCardByExerciseName,
  }), [activeMetricCards, defaultStrengthSelectionSeedIds, metricCardByExerciseName, metricCardByLibraryId, strengthExerciseOptionById, strengthExerciseOptionByMetricExerciseId])
  const defaultAppliedStrengthExerciseIdsKey = useMemo(() => defaultAppliedStrengthExerciseIds.join('|'), [defaultAppliedStrengthExerciseIds])
  const defaultDraftStrengthExerciseIds = useMemo(() => reconcileStrengthExerciseSelectionIds(getInitialStrengthSelectionIds({
    defaultStrengthExerciseIds: defaultStrengthSelectionSeedIds,
    strengthCards: activeMetricCards,
  }), {
    strengthExerciseOptionById,
    strengthExerciseOptionByMetricExerciseId,
    metricCardByLibraryId,
    metricCardByExerciseName,
    strengthExerciseOptionByName,
  }), [activeMetricCards, defaultStrengthSelectionSeedIds, metricCardByExerciseName, metricCardByLibraryId, strengthExerciseOptionById, strengthExerciseOptionByMetricExerciseId, strengthExerciseOptionByName])
  const defaultDraftStrengthExerciseIdsKey = useMemo(() => defaultDraftStrengthExerciseIds.join('|'), [defaultDraftStrengthExerciseIds])
  const appliedStrengthExerciseIdsKey = useMemo(() => appliedStrengthExerciseIds.join('|'), [appliedStrengthExerciseIds])

  function resolveStrengthExerciseOption(exerciseId) {
    const exactExercise = strengthExerciseOptionById.get(exerciseId)
    if (exactExercise) return exactExercise

    const metricCard = metricCardByLibraryId.get(exerciseId) || null
    const metricExerciseName = normalizeStrengthExerciseName(metricCard?.exerciseName)
    if (!metricExerciseName) return null

    return strengthExerciseOptionByName.get(metricExerciseName)
      || strengthExerciseOptions.find((exercise) => exercise.metricExerciseId === (metricCard.exerciseId || metricCard.id))
      || null
  }

  const visibleStrengthCards = useMemo(() => buildVisibleStrengthCards({
    appliedStrengthExerciseIds,
    strengthExerciseOptions,
    strengthCards: activeMetricCards,
    appliedStrengthExercises,
    emptyMetricMessage: activeMetricEmptyMessage,
    emptyMetricLabel: activeMetricLabel,
  }), [activeMetricCards, activeMetricEmptyMessage, activeMetricLabel, appliedStrengthExerciseIds, appliedStrengthExercises, strengthExerciseOptions])
  const selectedStrengthExerciseOptions = useMemo(() => draftStrengthExerciseIds
    .map((exerciseId) => resolveStrengthExerciseOption(exerciseId))
    .filter(Boolean), [draftStrengthExerciseIds, strengthExerciseOptionById, strengthExerciseOptionByName, strengthExerciseOptions, metricCardByLibraryId])
  const shouldHydratePersistedStrengthExercises = isStrengthSelectionHydrated && hasAppliedCustomStrengthFilter && !appliedStrengthExercises.length
  const shouldHydrateDefaultStrengthExercises = isStrengthSelectionHydrated && !hasAppliedCustomStrengthFilter && defaultAppliedStrengthExerciseIds.length === 0
  const visibleStrengthExerciseOptions = useMemo(() => strengthExerciseOptions.filter((exercise) => {
    const query = String(strengthExerciseSearchQuery || '').trim().toLowerCase()
    if (!query) return true
    return String(exercise.name || '').toLowerCase().includes(query)
  }), [strengthExerciseOptions, strengthExerciseSearchQuery])

  useEffect(() => {
    let isActive = true
    setIsStrengthSelectionHydrated(false)

    async function hydrateStrengthSelectionState() {
      const nextStorage = await resolveStrengthSelectionStorage()
      if (!isActive) return
      setResolvedStrengthSelectionStorage(nextStorage)

      const persistedSelectionState = await readStoredStrengthSelectionState({
        storage: nextStorage,
        selectionKey: activeMetricSelectionStorageKey,
        defaultStrengthExerciseIds: defaultAppliedStrengthExerciseIds,
      })
      if (!isActive) return

      setAppliedStrengthExerciseIds((current) => {
        return areExerciseIdListsEqual(current, persistedSelectionState.appliedStrengthExerciseIds)
          ? current
          : persistedSelectionState.appliedStrengthExerciseIds
      })
      setAppliedStrengthExercises((current) => {
        const next = persistedSelectionState.appliedStrengthExercises || []
        if (current === next) return current
        if (current.length !== next.length) return next
        for (let index = 0; index < current.length; index += 1) {
          if (current[index]?.id !== next[index]?.id) return next
        }
        return current
      })
      setDraftStrengthExerciseIds((current) => {
        const next = reconcileStrengthExerciseSelectionIds(persistedSelectionState.appliedStrengthExerciseIds, {
          strengthExerciseOptionById,
          strengthExerciseOptionByMetricExerciseId,
          metricCardByLibraryId,
          metricCardByExerciseName,
          strengthExerciseOptionByName,
        })
        return areExerciseIdListsEqual(current, next) ? current : next
      })
      setHasAppliedCustomStrengthFilter((current) => (
        current === persistedSelectionState.hasAppliedCustomStrengthFilter
          ? current
          : persistedSelectionState.hasAppliedCustomStrengthFilter
      ))
      setIsStrengthSelectionHydrated(true)
    }

    hydrateStrengthSelectionState()

    return () => {
      isActive = false
    }
  }, [activeMetricSelectionStorageKey, defaultAppliedStrengthExerciseIdsKey])

  useEffect(() => {
    if (!isStrengthSelectionHydrated) return

    const nextDefaultSelection = getDefaultSyncedStrengthSelection({
      hasAppliedCustomStrengthFilter,
      defaultStrengthExerciseIds: defaultAppliedStrengthExerciseIds,
    })
    if (!nextDefaultSelection) return
    setAppliedStrengthExerciseIds((current) => {
      return areExerciseIdListsEqual(current, nextDefaultSelection.appliedStrengthExerciseIds)
        ? current
        : nextDefaultSelection.appliedStrengthExerciseIds
    })
    setAppliedStrengthExercises((current) => (current.length ? [] : current))
    setDraftStrengthExerciseIds((current) => {
      return areExerciseIdListsEqual(current, defaultDraftStrengthExerciseIds)
        ? current
        : defaultDraftStrengthExerciseIds
    })
  }, [defaultAppliedStrengthExerciseIdsKey, defaultDraftStrengthExerciseIdsKey, hasAppliedCustomStrengthFilter, isStrengthSelectionHydrated])

  useEffect(() => {
    if (!isStrengthSelectionHydrated || !resolvedStrengthSelectionStorage) return

    writeStoredStrengthSelectionState({
      storage: resolvedStrengthSelectionStorage,
      selectionKey: activeMetricSelectionStorageKey,
      appliedStrengthExerciseIds,
      hasAppliedCustomStrengthFilter,
    })
  }, [activeMetricSelectionStorageKey, appliedStrengthExerciseIds, hasAppliedCustomStrengthFilter, isStrengthSelectionHydrated, resolvedStrengthSelectionStorage])

  useEffect(() => {
    setAppliedStrengthExerciseIds((current) => {
      const next = reconcileAppliedStrengthExerciseSelectionIds(current, {
        strengthExerciseOptionById,
        strengthExerciseOptionByMetricExerciseId,
        metricCardByLibraryId,
        metricCardByExerciseName,
      })
      if (hasAppliedCustomStrengthFilter && current.length > 0 && next.length === 0) {
        setHasAppliedCustomStrengthFilter(false)
      }
      return areExerciseIdListsEqual(current, next) ? current : next
    })
    setDraftStrengthExerciseIds((current) => {
      const next = reconcileStrengthExerciseSelectionIds(current, {
        strengthExerciseOptionById,
        strengthExerciseOptionByMetricExerciseId,
        metricCardByLibraryId,
        metricCardByExerciseName,
        strengthExerciseOptionByName,
      })
      return areExerciseIdListsEqual(current, next) ? current : next
    })
  }, [hasAppliedCustomStrengthFilter, strengthExerciseOptionById, strengthExerciseOptionByMetricExerciseId, strengthExerciseOptionByName, metricCardByExerciseName, metricCardByLibraryId])

  useEffect(() => {
    const shouldLoadStrengthExerciseLibrary = isStrengthFilterViewOpen || shouldHydratePersistedStrengthExercises || shouldHydrateDefaultStrengthExercises
    if (!shouldLoadStrengthExerciseLibrary) return

    const exerciseClient = createMobileExerciseLibraryClient()
    if (!exerciseClient) {
      setStrengthExerciseLibraryState({ items: [], isLoading: false, error: 'Exercise library is unavailable right now.' })
      return
    }

    let isActive = true
    setStrengthExerciseLibraryState((current) => ({ ...current, isLoading: true, error: '' }))

    exerciseClient.listExercises()
      .then((items) => {
        if (!isActive) return
        const filteredLibraryItems = filterExerciseLibraryItemsForProgressOption(items, activeProgressOptionId)
        const nextStrengthExerciseOptions = buildStrengthExerciseOptions({
          strengthExerciseLibraryItems: filteredLibraryItems,
          strengthCards: activeMetricCards,
        })
        const nextStrengthExerciseOptionById = new Map(nextStrengthExerciseOptions.map((exercise) => [exercise.id, exercise]))
        const nextStrengthExerciseOptionByMetricExerciseId = new Map(
          nextStrengthExerciseOptions
            .filter((exercise) => exercise.metricExerciseId)
            .map((exercise) => [exercise.metricExerciseId, exercise])
        )
        const nextStrengthExerciseOptionByName = new Map(nextStrengthExerciseOptions.map((exercise) => [normalizeStrengthExerciseName(exercise.name), exercise]))
        setStrengthExerciseLibraryState({ items: filteredLibraryItems, isLoading: false, error: '' })
        setAppliedStrengthExercises((current) => current.length ? current : reconcileStrengthExerciseSelectionIds(appliedStrengthExerciseIds, {
          strengthExerciseOptionById: nextStrengthExerciseOptionById,
          strengthExerciseOptionByMetricExerciseId: nextStrengthExerciseOptionByMetricExerciseId,
          metricCardByLibraryId,
          metricCardByExerciseName,
          strengthExerciseOptionByName: nextStrengthExerciseOptionByName,
        }).map((exerciseId) => nextStrengthExerciseOptionById.get(exerciseId)).filter(Boolean))
      })
      .catch((error) => {
        if (!isActive) return
        setStrengthExerciseLibraryState({ items: [], isLoading: false, error: error?.message || 'Unable to load exercises.' })
      })

    return () => {
      isActive = false
    }
  }, [activeMetricCardsKey, activeProgressOptionId, appliedStrengthExerciseIdsKey, isStrengthFilterViewOpen, shouldHydrateDefaultStrengthExercises, shouldHydratePersistedStrengthExercises])

  function handleOpenStrengthExerciseFilter() {
    setDraftStrengthExerciseIds(reconcileStrengthExerciseSelectionIds(appliedStrengthExerciseIds, {
      strengthExerciseOptionById,
      strengthExerciseOptionByMetricExerciseId,
      metricCardByLibraryId,
      metricCardByExerciseName,
      strengthExerciseOptionByName,
    }))
    setStrengthExerciseSearchQuery('')
    setIsStrengthFilterViewOpen(true)
  }

  function handleCloseStrengthExerciseFilter() {
    setDraftStrengthExerciseIds(reconcileStrengthExerciseSelectionIds(appliedStrengthExerciseIds, {
      strengthExerciseOptionById,
      strengthExerciseOptionByMetricExerciseId,
      metricCardByLibraryId,
      metricCardByExerciseName,
      strengthExerciseOptionByName,
    }))
    setStrengthExerciseSearchQuery('')
    setIsStrengthFilterViewOpen(false)
  }

  function handleToggleStrengthExercise(exerciseId) {
    setDraftStrengthExerciseIds((current) => toggleStrengthExerciseDraft({
      draftStrengthExerciseIds: current,
      exerciseId,
      maxSelections: 4,
    }))
  }

  function handleApplyStrengthExerciseFilter() {
    const nextAppliedStrengthExercises = draftStrengthExerciseIds.map((exerciseId) => resolveStrengthExerciseOption(exerciseId)).filter(Boolean)
    const nextAppliedStrengthExerciseIds = applyStrengthExerciseDraft(draftStrengthExerciseIds.map((exerciseId) => {
      const option = strengthExerciseOptionById.get(exerciseId)
      return option?.metricExerciseId || option?.id || exerciseId
    }))
    setAppliedStrengthExerciseIds(nextAppliedStrengthExerciseIds)
    setAppliedStrengthExercises(nextAppliedStrengthExercises)
    setHasAppliedCustomStrengthFilter(true)
    setStrengthExerciseSearchQuery('')
    setIsStrengthFilterViewOpen(false)
  }

  return (
    <View style={styles.screen}>
      <View style={styles.analyticsHeaderWrap}>
        <Text style={styles.analyticsEyebrow}>{model.title}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{model.progressLabel}</Text>
          <AnalyticsDropdown label={activeProgressOption} theme={resolvedTheme} styles={styles} onPress={() => setActiveSheet('progress')} />
        </View>

        {activeProgressOptionId === 'consistency' ? (
          <View style={styles.primaryCard}>
            <ConsistencyBarChart chart={model.consistencyChart} theme={resolvedTheme} styles={styles} />
          </View>
        ) : (
          <View style={styles.progressStrengthList}>
            <StrengthMetricsCard cards={visibleStrengthCards} theme={resolvedTheme} styles={styles} metricLabel={activeMetricLabel} filterLabel={activeProgressOption} emptyMessage={activeMetricEmptyMessage} sourceSurface={activeMetricSourceSurface} onOpenFilter={handleOpenStrengthExerciseFilter} onOpenExerciseDetail={onOpenExerciseDetail} />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{model.trainingLoadLabel}</Text>
          <AnalyticsDropdown label={activeTrainingLoadOption} theme={resolvedTheme} styles={styles} onPress={() => setActiveSheet('training-load')} />
        </View>

        {activeTrainingLoadOptionId === 'recovery' ? (
          activeRecoveryMuscleId ? (
            <RecoveryDetailView muscleGroup={activeRecoveryMuscle} onBack={() => setActiveRecoveryMuscleId(null)} theme={resolvedTheme} styles={styles} svg={recoveryFigureSvg} />
          ) : (
            <RecoveryOverview rows={recoveryMuscleGroups} onSelectMuscle={(row) => setActiveRecoveryMuscleId(row.id)} styles={styles} svg={recoveryFigureSvg} />
          )
        ) : activeActivityMuscleId ? (
          <ActivityDetailView muscleGroup={activeActivityMuscle} onBack={() => setActiveActivityMuscleId(null)} theme={resolvedTheme} styles={styles} svg={recoveryFigureSvg} />
        ) : (
          <ActivityOverview rows={activityMuscleGroups} onSelectMuscle={(row) => setActiveActivityMuscleId(row.id)} styles={styles} svg={recoveryFigureSvg} />
        )}
      </View>

      <View style={styles.healthMetricsSection}>
        <Text style={styles.sectionTitle}>{model.healthMetricsTitle}</Text>
        <View style={styles.healthMetricsRow}>
          {model.healthMetrics.map((metric) => (
            <HealthMetricCard key={metric.id} metric={metric} theme={resolvedTheme} styles={styles} />
          ))}
        </View>
      </View>

      {activeSheet === 'progress' ? (
        <AnalyticsOptionSheet
          styles={styles}
          theme={resolvedTheme}
          title="Progress"
          options={model.progressOptions.map((option) => ({
            ...option,
            sheetLabel: option.label,
          }))}
          activeOptionId={activeProgressOptionId}
          onClose={() => setActiveSheet(null)}
          onSelect={(optionId) => {
            setActiveProgressOptionId(optionId)
            setActiveSheet(null)
          }}
        />
      ) : null}

      {activeSheet === 'training-load' ? (
        <AnalyticsOptionSheet
          styles={styles}
          theme={resolvedTheme}
          title="Training Load"
          options={model.trainingLoadOptions.map((option) => ({
            ...option,
            sheetLabel: option.id === 'seven-day-activity' ? '7d Activity' : option.label,
          }))}
          activeOptionId={activeTrainingLoadOptionId}
          onClose={() => setActiveSheet(null)}
          onSelect={(optionId) => {
            setActiveTrainingLoadOptionId(optionId)
            setActiveRecoveryMuscleId(null)
            setActiveActivityMuscleId(null)
            setActiveSheet(null)
          }}
        />
      ) : null}

      <Modal visible={isStrengthFilterViewOpen} animationType="slide" onRequestClose={handleCloseStrengthExerciseFilter}>
        <SafeAreaProvider>
          <StrengthExerciseFilterView
            isVisible={isStrengthFilterViewOpen}
            theme={resolvedTheme}
            exercises={visibleStrengthExerciseOptions}
            selectedExercises={selectedStrengthExerciseOptions}
            selectedExerciseIds={draftStrengthExerciseIds}
            onToggleExercise={handleToggleStrengthExercise}
            onApply={handleApplyStrengthExerciseFilter}
            onClose={handleCloseStrengthExerciseFilter}
            isLoading={strengthExerciseLibraryState.isLoading}
            error={strengthExerciseLibraryState.error}
            searchQuery={strengthExerciseSearchQuery}
            onSearchChange={setStrengthExerciseSearchQuery}
          />
        </SafeAreaProvider>
      </Modal>
    </View>
  )
}

function createAnalyticsStyles(theme) {
  return StyleSheet.create({
  screen: {
    gap: 24,
  },
  analyticsHeaderWrap: {
    gap: 4,
  },
  analyticsEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.textSoft,
  },
  section: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dropdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textMuted,
  },
  optionSheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.overlay,
  },
  optionSheetBackdrop: {
    flex: 1,
  },
  optionSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 2,
  },
  optionSheetHandle: {
    alignSelf: 'center',
    marginBottom: 14,
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.borderStrong,
  },
  optionSheetTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.text,
  },
  optionSheetDivider: {
    marginTop: 14,
    marginBottom: 6,
    height: 1,
    backgroundColor: theme.borderStrong,
  },
  optionSheetRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionSheetLabel: {
    fontSize: 17,
    color: theme.textMuted,
  },
  optionSheetLabelSelected: {
    color: theme.text,
    fontWeight: '600',
  },
  primaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: 16,
  },
  progressCardContent: {
    gap: 16,
  },
  progressStrengthList: {
    gap: 16,
  },
  progressStrengthCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: 16,
    gap: 12,
  },
  progressStrengthCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressStrengthRows: {
    gap: 14,
  },
  progressStrengthRowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 14,
  },
  progressStrengthRow: {
    gap: 10,
  },
  progressStrengthMetricLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.text,
  },
  progressStrengthFilterButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consistencyCardContent: {
    gap: 16,
  },
  consistencyChartTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.textSoft,
  },
  consistencyChartWrap: {
    position: 'relative',
    height: 256,
    borderRadius: 24,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingTop: 22,
    paddingBottom: 28,
    paddingHorizontal: 18,
  },
  consistencyGridline: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: theme.borderStrong,
  },
  consistencyGridlineTop: {
    top: 70,
  },
  consistencyGridlineMiddle: {
    top: 116,
  },
  consistencyGridlineBottom: {
    top: 162,
  },
  consistencyYAxisLabels: {
    position: 'absolute',
    top: 56,
    right: 18,
    bottom: 66,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  consistencyYAxisLabel: {
    fontSize: 12,
    color: theme.textSoft,
  },
  consistencyBarsWrap: {
    marginTop: 14,
    marginRight: 52,
    marginBottom: 26,
    height: 156,
  },
  consistencyBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    gap: 20,
  },
  consistencyBarColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  consistencyBarTrack: {
    width: 22,
    height: '100%',
    justifyContent: 'flex-end',
  },
  consistencyBarFill: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  consistencyXAxisLabels: {
    position: 'absolute',
    left: 18,
    right: 24,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consistencyXAxisLabel: {
    fontSize: 12,
    color: theme.textSoft,
  },
  consistencyAxisLabel: {
    fontSize: 12,
    color: theme.textSoft,
  },
  progressExerciseLabel: {
    fontSize: 14,
    color: theme.textSoft,
  },
  progressStrengthValueText: {
    fontSize: 30,
    fontWeight: '600',
    color: theme.text,
  },
  progressStrengthValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 10,
  },
  progressSetPill: {
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  progressSetPillText: {
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '500',
    color: theme.textMuted,
  },
  trainingLoadContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    minHeight: 228,
  },
  recoveryFigureWrap: {
    width: 118,
    height: 228,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryGridColumn: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 12,
  },
  recoveryGridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  recoveryDetailColumn: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 12,
  },
  recoveryDetailTopRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  recoveryDetailBottomRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  recoveryCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  recoveryCardCompact: {
    minHeight: 108,
  },
  recoveryDetailCardSpacer: {
    flex: 1,
    minHeight: 108,
  },
  recoveryBackCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentSurface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recoveryBackButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryCardLabel: {
    fontSize: 13,
    color: theme.textSoft,
  },
  recoveryBarTrack: {
    marginTop: 12,
    height: 8,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: theme.backgroundMuted,
  },
  recoveryBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.accent,
  },
  recoveryCardValue: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  activityCardValue: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  healthMetricsSection: {
    gap: 16,
  },
  healthMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  healthMetricCard: {
    minWidth: 110,
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  healthMetricIconWrap: {
    marginBottom: 16,
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundMuted,
  },
  healthMetricLabel: {
    fontSize: 13,
    color: theme.textSoft,
  },
  healthMetricValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '600',
    color: theme.text,
  },
  })
}
