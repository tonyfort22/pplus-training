import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildStrengthExerciseOptions, buildVisibleStrengthCards, getInitialStrengthSelectionIds, getInitialStrengthSelectionState, copyAppliedToDraft, toggleStrengthExerciseDraft, applyStrengthExerciseDraft, getDefaultSyncedStrengthSelection, reconcileStrengthExerciseSelectionIds, resolveStrengthSelectionStorage, readStoredStrengthSelectionState, writeStoredStrengthSelectionState, clearStoredStrengthSelectionState } from '../apps/mobile/src/screens/analytics-strength-state.js'

test('mobile analytics Strength pure state helpers keep one consistent draft/applied id universe', () => {
  assert.deepEqual(getInitialStrengthSelectionIds({
    defaultStrengthExerciseIds: ['exercise-back-squat', 'exercise-bench-press', 'exercise-third'],
    strengthCards: [],
  }), ['exercise-back-squat', 'exercise-bench-press'])

  assert.deepEqual(copyAppliedToDraft(['exercise-back-squat']), ['exercise-back-squat'])

  const toggledDraftSelection = toggleStrengthExerciseDraft({
    draftStrengthExerciseIds: ['exercise-back-squat'],
    exerciseId: 'exercise-bench-press',
    maxSelections: 4,
  })
  assert.deepEqual(toggledDraftSelection, ['exercise-back-squat', 'exercise-bench-press'])

  const toggledDraftOnly = toggleStrengthExerciseDraft({
    draftStrengthExerciseIds: toggledDraftSelection,
    exerciseId: 'exercise-back-squat',
    maxSelections: 4,
  })
  assert.deepEqual(toggledDraftOnly, ['exercise-bench-press'])

  const maxedDraftSelection = toggleStrengthExerciseDraft({
    draftStrengthExerciseIds: ['a', 'b', 'c', 'd'],
    exerciseId: 'e',
    maxSelections: 4,
  })
  assert.deepEqual(maxedDraftSelection, ['a', 'b', 'c', 'd'])

  assert.deepEqual(applyStrengthExerciseDraft(['exercise-bench-press', 'exercise-bench-press']), ['exercise-bench-press'])
  assert.deepEqual(copyAppliedToDraft(['exercise-bench-press']), ['exercise-bench-press'])
})

test('mobile analytics Strength same-session remount state and cold-start storage state are tested separately', async () => {
  const storage = await resolveStrengthSelectionStorage({
    storage: (() => {
      let storedValue = ''
      return {
        async getItem() {
          return storedValue
        },
        async setItem(value) {
          storedValue = value
          return value
        },
        async removeItem() {
          storedValue = ''
        },
      }
    })(),
  })

  assert.deepEqual(getInitialStrengthSelectionState({
    defaultStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
  }), {
    appliedStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
    draftStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
    appliedStrengthExercises: [],
    hasAppliedCustomStrengthFilter: false,
  })

  await writeStoredStrengthSelectionState({
    storage,
    selectionKey: 'analytics-strength:test-athlete',
    appliedStrengthExerciseIds: ['library-bench-press'],
    hasAppliedCustomStrengthFilter: true,
  })

  assert.deepEqual(await readStoredStrengthSelectionState({
    storage,
    selectionKey: 'analytics-strength:test-athlete',
    defaultStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
  }), {
    appliedStrengthExerciseIds: ['library-bench-press'],
    draftStrengthExerciseIds: ['library-bench-press'],
    appliedStrengthExercises: [],
    hasAppliedCustomStrengthFilter: true,
  })

  assert.deepEqual(await readStoredStrengthSelectionState({
    storage,
    selectionKey: 'analytics-strength:unseen-athlete',
    defaultStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
  }), {
    appliedStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
    draftStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
    appliedStrengthExercises: [],
    hasAppliedCustomStrengthFilter: false,
  })

  await clearStoredStrengthSelectionState({
    storage,
    selectionKey: 'analytics-strength:test-athlete',
  })

  assert.deepEqual(await readStoredStrengthSelectionState({
    storage,
    selectionKey: 'analytics-strength:test-athlete',
    defaultStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
  }), {
    appliedStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
    draftStrengthExerciseIds: ['metric-back-squat', 'metric-bench-press'],
    appliedStrengthExercises: [],
    hasAppliedCustomStrengthFilter: false,
  })
})

test('mobile analytics Strength default syncing stops once a custom applied selection exists', () => {
  assert.deepEqual(getDefaultSyncedStrengthSelection({
    hasAppliedCustomStrengthFilter: false,
    defaultStrengthExerciseIds: ['exercise-back-squat', 'exercise-bench-press'],
  }), {
    appliedStrengthExerciseIds: ['exercise-back-squat', 'exercise-bench-press'],
    draftStrengthExerciseIds: ['exercise-back-squat', 'exercise-bench-press'],
  })

  assert.equal(getDefaultSyncedStrengthSelection({
    hasAppliedCustomStrengthFilter: true,
    defaultStrengthExerciseIds: ['exercise-back-squat', 'exercise-bench-press'],
  }), null)
})

test('mobile analytics Strength reconciliation preserves valid applied selections across library/metric id divergence instead of destroying them', () => {
  const strengthCards = [
    { id: 'metric-back-squat', exerciseId: 'metric-back-squat', exerciseName: 'Back Squat' },
    { id: 'metric-bench-press', exerciseId: 'metric-bench-press', exerciseName: 'Bench Press' },
  ]
  const strengthExerciseOptions = buildStrengthExerciseOptions({
    strengthExerciseLibraryItems: [
      { id: 'library-bench-press', name: 'Barbell Bench Press', thumbnailUrl: null },
      { id: 'library-split-squat', name: 'DB Rear Foot Elevated Split Squat', thumbnailUrl: null },
    ],
    strengthCards,
  })
  const strengthExerciseOptionById = new Map(strengthExerciseOptions.map((exercise) => [exercise.id, exercise]))
  const strengthExerciseOptionByName = new Map(strengthExerciseOptions.map((exercise) => [exercise.name.trim().toLowerCase(), exercise]))
  const metricCardByLibraryId = new Map(strengthCards.map((card) => [card.exerciseId || card.id, card]))
  const metricCardByExerciseName = new Map(strengthCards.map((card) => [card.exerciseName.trim().toLowerCase(), card]))

  assert.deepEqual(reconcileStrengthExerciseSelectionIds(['metric-back-squat'], {
    strengthExerciseOptionById,
    strengthExerciseOptionByName,
    metricCardByLibraryId,
    metricCardByExerciseName,
  }), ['metric-back-squat'])

  assert.deepEqual(reconcileStrengthExerciseSelectionIds(['library-bench-press'], {
    strengthExerciseOptionById,
    strengthExerciseOptionByName,
    metricCardByLibraryId,
    metricCardByExerciseName,
  }), ['library-bench-press'])
})

test('mobile analytics Strength reconciliation preserves valid applied selections across metric-id to library-id alias mapping', () => {
  const strengthCards = [
    { id: 'metric-bench-press', exerciseId: 'metric-bench-press', exerciseName: 'Bench Press' },
  ]
  const strengthExerciseOptions = buildStrengthExerciseOptions({
    strengthExerciseLibraryItems: [
      { id: 'library-bench-press', name: 'Barbell Bench Press', thumbnailUrl: null },
    ],
    strengthCards,
  })
  const strengthExerciseOptionById = new Map(strengthExerciseOptions.map((exercise) => [exercise.id, exercise]))
  const strengthExerciseOptionByMetricExerciseId = new Map(strengthExerciseOptions.filter((exercise) => exercise.metricExerciseId).map((exercise) => [exercise.metricExerciseId, exercise]))
  const strengthExerciseOptionByName = new Map(strengthExerciseOptions.map((exercise) => [exercise.name.trim().toLowerCase(), exercise]))
  const metricCardByLibraryId = new Map(strengthCards.map((card) => [card.exerciseId || card.id, card]))
  const metricCardByExerciseName = new Map(strengthCards.map((card) => [card.exerciseName.trim().toLowerCase(), card]))

  assert.deepEqual(reconcileStrengthExerciseSelectionIds(['metric-bench-press'], {
    strengthExerciseOptionById,
    strengthExerciseOptionByMetricExerciseId,
    strengthExerciseOptionByName,
    metricCardByLibraryId,
    metricCardByExerciseName,
  }), ['library-bench-press'])
})

test('mobile analytics Strength visible rows derive from applied selection after apply and never keep stale previous rows', () => {
  const strengthCards = [
    {
      id: 'metric-back-squat',
      exerciseId: 'metric-back-squat',
      exerciseName: 'Back Squat',
      oneRepMaxValueLabel: '149 lb',
      sourcePerformanceTagLabel: '120 lb x 8',
      thumbnailUrl: null,
    },
    {
      id: 'metric-bench-press',
      exerciseId: 'metric-bench-press',
      exerciseName: 'Bench Press',
      oneRepMaxValueLabel: '225 lb',
      sourcePerformanceTagLabel: '185 lb x 8',
      thumbnailUrl: null,
    },
  ]

  const strengthExerciseOptions = buildStrengthExerciseOptions({
    strengthExerciseLibraryItems: [
      { id: 'library-bench-press', name: 'Barbell Bench Press', thumbnailUrl: null },
      { id: 'library-split-squat', name: 'DB Rear Foot Elevated Split Squat', thumbnailUrl: null },
    ],
    strengthCards,
  })

  const previousAppliedRows = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['metric-back-squat'],
    strengthExerciseOptions,
    strengthCards,
  })
  assert.deepEqual(previousAppliedRows.map((card) => card.exerciseName), ['Back Squat'])

  const nextAppliedRows = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['library-bench-press'],
    strengthExerciseOptions,
    strengthCards,
  })
  assert.deepEqual(nextAppliedRows.map((card) => card.exerciseName), ['Barbell Bench Press'])

  const noMetricAppliedRows = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['library-split-squat'],
    strengthExerciseOptions,
    strengthCards,
  })
  assert.deepEqual(noMetricAppliedRows.map((card) => card.exerciseName), ['DB Rear Foot Elevated Split Squat'])
  assert.equal(noMetricAppliedRows[0].oneRepMaxValueLabel, '--')
  assert.equal(noMetricAppliedRows[0].sourcePerformanceTagLabel, 'No logged strength sets yet')
})

test('mobile analytics Strength source seam exports the stable helper contract used by AnalyticsView', () => {
  const strengthStateSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-strength-state.js'), 'utf8')

  assert.match(strengthStateSource, /export function getInitialStrengthSelectionIds\(/)
  assert.match(strengthStateSource, /export function copyAppliedToDraft\(/)
  assert.match(strengthStateSource, /export function toggleStrengthExerciseDraft\(/)
  assert.match(strengthStateSource, /export function applyStrengthExerciseDraft\(/)
  assert.match(strengthStateSource, /export function getDefaultSyncedStrengthSelection\(/)
  assert.match(strengthStateSource, /export function reconcileStrengthExerciseSelectionIds\(/)
  assert.match(strengthStateSource, /export function buildStrengthExerciseOptions\(/)
  assert.match(strengthStateSource, /export function buildVisibleStrengthCards\(/)
  assert.match(strengthStateSource, /export async function resolveStrengthSelectionStorage\(/)
  assert.match(strengthStateSource, /export function getInitialStrengthSelectionState\(/)
  assert.match(strengthStateSource, /export async function readStoredStrengthSelectionState\(/)
  assert.match(strengthStateSource, /export async function writeStoredStrengthSelectionState\(/)
  assert.match(strengthStateSource, /export async function clearStoredStrengthSelectionState\(/)
})

test('mobile analytics view maps the first-pass Progress and Training Load structure from the reference', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(analyticsSource, /function AnalyticsView\(/)
  assert.match(analyticsSource, /function StrengthMetricsCard\({ cards, theme, styles, metricLabel, onOpenFilter, onOpenExerciseDetail }\)/)
  assert.match(analyticsSource, /function StrengthMetricRow\({ card, styles, onOpenExerciseDetail }\)/)
  assert.match(analyticsSource, /function RecoveryFigure\({ styles }\)/)
  assert.match(analyticsSource, /function RecoveryCard\({ row, onPress, isCompact = false, isBackCard = false, children, styles }\)/)
  assert.match(analyticsSource, /function RecoveryOverview\({ rows, onSelectMuscle, styles }\)/)
  assert.match(analyticsSource, /function RecoveryDetailView\({ muscleGroup, onBack, theme, styles }\)/)
  assert.match(analyticsSource, /function ActivityCard\({ row, onPress, isCompact = false, isBackCard = false, children, styles }\)/)
  assert.match(analyticsSource, /function ActivityOverview\({ rows, onSelectMuscle, styles }\)/)
  assert.match(analyticsSource, /function ActivityDetailView\({ muscleGroup, onBack, theme, styles }\)/)
  assert.match(analyticsSource, /function HealthMetricCard\({ metric, theme, styles }\)/)
  assert.match(analyticsSource, /<RecoveryDetailView muscleGroup=\{activeRecoveryMuscle\} onBack=\{\(\) => setActiveRecoveryMuscleId\(null\)\} theme=\{resolvedTheme\} styles=\{styles\} \/>/)
  assert.match(analyticsSource, /<RecoveryOverview rows=\{recoveryMuscleGroups\} onSelectMuscle=\{\(row\) => setActiveRecoveryMuscleId\(row.id\)\} styles=\{styles\} \/>/)
  assert.match(analyticsSource, /<ActivityDetailView muscleGroup=\{activeActivityMuscle\} onBack=\{\(\) => setActiveActivityMuscleId\(null\)\} theme=\{resolvedTheme\} styles=\{styles\} \/>/)
  assert.match(analyticsSource, /<ActivityOverview rows=\{activityMuscleGroups\} onSelectMuscle=\{\(row\) => setActiveActivityMuscleId\(row.id\)\} styles=\{styles\} \/>/)
  assert.match(analyticsSource, /<HealthMetricCard key=\{metric.id\} metric=\{metric\} theme=\{resolvedTheme\} styles=\{styles\} \/>/)
  assert.match(analyticsSource, /<StrengthMetricsCard cards=\{visibleStrengthCards\} theme=\{resolvedTheme\} styles=\{styles\} metricLabel=\{model\.oneRepMaxLabel\} onOpenFilter=\{handleOpenStrengthExerciseFilter\} onOpenExerciseDetail=\{onOpenExerciseDetail\} \/>/)
  assert.match(analyticsSource, /HealthMetricCard/)
  assert.match(analyticsSource, /RecoveryFigure/)
  assert.match(analyticsSource, /RecoveryCard/)
  assert.match(analyticsSource, /AnalyticsDropdown/)
  assert.doesNotMatch(analyticsSource, /TinyTrendChart/)
  assert.doesNotMatch(analyticsSource, /chartMenuPill/)

  assert.match(progressSource, /title: 'ANALYTICS'/)
  assert.match(progressSource, /progressLabel: 'Progress'/)
  assert.match(progressSource, /trainingLoadLabel: 'Training Load'/)
  assert.match(progressSource, /healthMetricsTitle: 'Health Metrics'/)
  assert.match(progressSource, /oneRepMaxLabel: '1RM'/)
  assert.match(progressSource, /strengthCards: \[/)
  assert.match(progressSource, /metricLabel: '1RM'/)
  assert.match(progressSource, /exerciseName: 'Barbell Back Squat'/)
  assert.match(progressSource, /oneRepMaxValueLabel: '149 lb'/)
  assert.match(progressSource, /sourcePerformanceTagLabel: '120 lb x 8'/)
  assert.match(progressSource, /Barbell Back Squat/)
  assert.match(progressSource, /Barbell Bench Press/)
  assert.match(progressSource, /149 lb/)
  assert.match(progressSource, /120 lb x 8/)
  assert.match(progressSource, /0 lb/)
  assert.match(progressSource, /0 lb x 8/)
  assert.match(progressSource, /Arms/)
  assert.match(progressSource, /Shoulders/)
  assert.match(progressSource, /Chest/)
  assert.match(progressSource, /Back/)
  assert.match(progressSource, /Abs/)
  assert.match(progressSource, /Legs/)
  assert.match(progressSource, /97%/)
  assert.match(progressSource, /Start Workout/)
})

test('mobile analytics strength cards render the 1RM label, filter icon, exercise name, value, and source tag without a mini trend chart', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(analyticsSource, /SlidersHorizontal/)
  assert.match(analyticsSource, /progressStrengthList/)
  assert.match(analyticsSource, /progressStrengthCardHeader/)
  assert.match(analyticsSource, /progressStrengthMetricLabel/)
  assert.match(analyticsSource, /progressStrengthValueText/)
  assert.match(analyticsSource, /metricLabel=\{model\.oneRepMaxLabel\}/)
  assert.match(analyticsSource, /card\.exerciseName/)
  assert.match(analyticsSource, /card\.oneRepMaxValueLabel/)
  assert.match(analyticsSource, /card\.sourcePerformanceTagLabel/)
  assert.match(analyticsSource, /onPress=\{onOpenFilter\}/)
  assert.match(analyticsSource, /onPress=\{\(\) => onOpenExerciseDetail\?\.\(\{[\s\S]*name: card\.exerciseName,[\s\S]*videoUrl: card\.videoUrl \|\| null,[\s\S]*sourceSurface: 'metrics-strength'/)
  assert.doesNotMatch(analyticsSource, /LineChart/)
  assert.doesNotMatch(analyticsSource, /TinyTrendChart/)

  assert.match(progressSource, /buildAnalyticsStrengthCards\(completedSessions\)/)
  assert.match(progressSource, /sourcePerformanceTagLabel: `\$\{formatStrengthValue\(card\.strongestLoad, card\.loadUnit\)\} x \$\{card\.strongestReps\}`/)
})

test('mobile analytics strength list uses one shared outer container header and repeated inner rows', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')

  assert.match(analyticsSource, /function StrengthMetricRow\({ card, styles, onOpenExerciseDetail }\)/)
  assert.match(analyticsSource, /function StrengthMetricsCard\({ cards, theme, styles, metricLabel, onOpenFilter, onOpenExerciseDetail }\)/)
  assert.match(analyticsSource, /metricLabel=\{model\.oneRepMaxLabel\}/)
  assert.match(analyticsSource, /<StrengthMetricRow key=\{card.id\} card=\{card\} styles=\{styles\} onOpenExerciseDetail=\{onOpenExerciseDetail\} \/>/)
  assert.doesNotMatch(analyticsSource, /card\.metricLabel/)
  assert.doesNotMatch(analyticsSource, /<StrengthMetricCard key=\{card.id\} card=\{card\} theme=\{resolvedTheme\} styles=\{styles\} \/>/)
})

test('mobile analytics strength source tag fits its content height without extra vertical padding', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')

  assert.match(analyticsSource, /progressSetPill:[\s\S]*alignSelf: 'center'/)
  assert.match(analyticsSource, /progressSetPill:[\s\S]*paddingHorizontal: 12/)
  assert.match(analyticsSource, /progressSetPill:[\s\S]*paddingVertical: 8/)
  assert.match(analyticsSource, /progressSetPillText:[\s\S]*lineHeight: 12/)
})

test('mobile analytics strength value and source tag share one horizontal row under the exercise name', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')

  assert.match(analyticsSource, /progressStrengthValueRow/)
  assert.match(analyticsSource, /<View style=\{styles\.progressStrengthValueRow\}>[\s\S]*progressStrengthValueText[\s\S]*progressSetPill[\s\S]*<\/View>/)
  assert.match(analyticsSource, /progressStrengthValueRow:[\s\S]*flexDirection: 'row'/)
  assert.match(analyticsSource, /progressStrengthValueRow:[\s\S]*alignItems: 'center'/)
  assert.match(analyticsSource, /progressStrengthValueRow:[\s\S]*flexWrap: 'nowrap'/)
})

test('mobile analytics strength filter view reuses the exercise screen shell, keeps selected preview, removes default helper copy, and anchors bottom controls together', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const sharedExerciseLibrarySource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/exercise-library-view.js'), 'utf8')

  assert.match(analyticsSource, /function StrengthExerciseFilterView\(/)
  assert.match(analyticsSource, /import \{ ExerciseLibraryView \} from '\.\/exercise-library-view\.js'/)

  assert.match(analyticsSource, /const \[appliedStrengthExerciseIds, setAppliedStrengthExerciseIds\] = useState\(/)
  assert.match(analyticsSource, /const \[draftStrengthExerciseIds, setDraftStrengthExerciseIds\] = useState\(/)
  assert.match(analyticsSource, /const \[strengthExerciseSearchQuery, setStrengthExerciseSearchQuery\] = useState\(''\)/)
  assert.match(analyticsSource, /onPress=\{onOpenFilter\}/)
  assert.match(analyticsSource, /setIsStrengthFilterViewOpen\(true\)/)
  assert.match(analyticsSource, /<StrengthExerciseFilterView[\s\S]*isVisible=\{isStrengthFilterViewOpen\}[\s\S]*selectedExerciseIds=\{draftStrengthExerciseIds\}[\s\S]*onApply=\{handleApplyStrengthExerciseFilter\}[\s\S]*onClose=\{handleCloseStrengthExerciseFilter\}/)
  assert.match(analyticsSource, /const maxStrengthSelectionReached = selectedExerciseIds\.length >= 4/)
  assert.match(analyticsSource, /<ExerciseLibraryView[\s\S]*title="Exercises"[\s\S]*searchPlaceholder="Search or Create Exercises"[\s\S]*searchQuery=\{searchQuery\}[\s\S]*onSearchChange=\{onSearchChange\}[\s\S]*selectedExercises=\{selectedExercises\}[\s\S]*showSelectedSection[\s\S]*selectedSectionTitle=""[\s\S]*selectedSectionHelperText=\{maxStrengthSelectionReached \? 'Select up to 4 exercises maximum' : ''\}[\s\S]*selectable[\s\S]*selectedExerciseIds=\{selectedExerciseIds\}[\s\S]*onToggleExercise=\{onToggleExercise\}[\s\S]*primaryActionLabel="Update Chart"[\s\S]*onPrimaryAction=\{onApply\}/)
  assert.match(sharedExerciseLibrarySource, /AppSelectionIndicator/)
  assert.match(analyticsSource, /Update Chart/)
  assert.match(sharedExerciseLibrarySource, /selectedExercises\.map\(/)
  assert.match(sharedExerciseLibrarySource, /absolute inset-x-0 bottom-0 px-5/)

})

test('mobile analytics strength filter keeps draft and applied selection truth in the full exercise-id seam', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')

  assert.match(analyticsSource, /const strengthSelectionPersistenceKey = model\.strengthSelectionPersistenceKey \|\| 'analytics-strength:default'/)
  assert.match(analyticsSource, /const initialStrengthSelectionState = useMemo\(\(\) => getInitialStrengthSelectionState\(/)
  assert.match(analyticsSource, /const \[appliedStrengthExerciseIds, setAppliedStrengthExerciseIds\] = useState\(initialStrengthSelectionState\.appliedStrengthExerciseIds\)/)
  assert.match(analyticsSource, /const \[draftStrengthExerciseIds, setDraftStrengthExerciseIds\] = useState\(initialStrengthSelectionState\.draftStrengthExerciseIds\)/)
  assert.match(analyticsSource, /const \[hasAppliedCustomStrengthFilter, setHasAppliedCustomStrengthFilter\] = useState\(initialStrengthSelectionState\.hasAppliedCustomStrengthFilter\)/)
  assert.match(analyticsSource, /const defaultAppliedStrengthExerciseIds = useMemo\(\(\) => reconcileAppliedStrengthExerciseSelectionIds\(getInitialStrengthSelectionIds\(/)
  assert.match(analyticsSource, /const defaultDraftStrengthExerciseIds = useMemo\(\(\) => reconcileStrengthExerciseSelectionIds\(getInitialStrengthSelectionIds\(/)
  assert.match(analyticsSource, /function handleOpenStrengthExerciseFilter\(\) \{[\s\S]*setDraftStrengthExerciseIds\(reconcileStrengthExerciseSelectionIds\(appliedStrengthExerciseIds, \{[\s\S]*strengthExerciseOptionByMetricExerciseId[\s\S]*\}\)\)[\s\S]*setStrengthExerciseSearchQuery\(''\)[\s\S]*setIsStrengthFilterViewOpen\(true\)/)
  assert.match(analyticsSource, /function handleCloseStrengthExerciseFilter\(\) \{[\s\S]*setDraftStrengthExerciseIds\(reconcileStrengthExerciseSelectionIds\(appliedStrengthExerciseIds, \{[\s\S]*strengthExerciseOptionByMetricExerciseId[\s\S]*\}\)\)[\s\S]*setStrengthExerciseSearchQuery\(''\)[\s\S]*setIsStrengthFilterViewOpen\(false\)/)
  assert.match(analyticsSource, /function handleApplyStrengthExerciseFilter\(\) \{[\s\S]*const nextAppliedStrengthExerciseIds = applyStrengthExerciseDraft\(draftStrengthExerciseIds\.map\(\(exerciseId\) => \{[\s\S]*strengthExerciseOptionById\.get\(exerciseId\)[\s\S]*option\?\.metricExerciseId \|\| option\?\.id \|\| exerciseId[\s\S]*\}\)\)[\s\S]*setAppliedStrengthExerciseIds\(nextAppliedStrengthExerciseIds\)[\s\S]*setStrengthExerciseSearchQuery\(''\)[\s\S]*setIsStrengthFilterViewOpen\(false\)/)
  assert.doesNotMatch(analyticsSource, /return next\.length \|\| !defaultStrengthExerciseIds\.length \? next : defaultStrengthExerciseIds/)
})

test('mobile analytics strength filter keeps the selected preview chips tied to the current draft ids and derives visible cards separately at apply time', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')

  assert.match(analyticsSource, /const strengthExerciseOptions = useMemo\(\(\) => buildStrengthExerciseOptions\(\{[\s\S]*strengthExerciseLibraryItems: strengthExerciseLibraryState\.items,[\s\S]*strengthCards: model\.strengthCards,[\s\S]*\}\), \[model\.strengthCards, strengthExerciseLibraryState\.items\]\)/)
  assert.match(analyticsSource, /const selectedStrengthExerciseOptions = useMemo\(\(\) => draftStrengthExerciseIds[\s\S]*resolveStrengthExerciseOption\(exerciseId\)[\s\S]*filter\(Boolean\)/)
  assert.match(analyticsSource, /const visibleStrengthCards = useMemo\(\(\) => buildVisibleStrengthCards\(\{[\s\S]*appliedStrengthExerciseIds,[\s\S]*strengthExerciseOptions,[\s\S]*strengthCards: model\.strengthCards,[\s\S]*appliedStrengthExercises,[\s\S]*\}\), \[appliedStrengthExerciseIds, appliedStrengthExercises, model\.strengthCards, strengthExerciseOptions\]\)/)
})

test('mobile analytics strength Update Chart canonicalizes applied selections to metric ids so the main Strength rows still render on a fresh mount before the library reloads', () => {
  const draftStrengthExerciseIds = ['library-bench-press']
  const strengthExerciseOptions = [
    { id: 'library-bench-press', name: 'Barbell Bench Press', metricExerciseId: 'metric-bench-press', thumbnailUrl: null },
  ]
  const strengthExerciseOptionById = new Map(strengthExerciseOptions.map((exercise) => [exercise.id, exercise]))
  const canonicalAppliedStrengthExerciseIds = applyStrengthExerciseDraft(draftStrengthExerciseIds.map((exerciseId) => {
    const option = strengthExerciseOptionById.get(exerciseId)
    return option?.metricExerciseId || option?.id || exerciseId
  }))

  assert.deepEqual(canonicalAppliedStrengthExerciseIds, ['metric-bench-press'])

  const strengthCards = [
    {
      id: 'metric-bench-press',
      exerciseId: 'metric-bench-press',
      exerciseName: 'Bench Press',
      oneRepMaxValueLabel: '225 lb',
      sourcePerformanceTagLabel: '185 lb x 8',
      thumbnailUrl: null,
    },
  ]

  const noLibraryVisibleStrengthCards = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: canonicalAppliedStrengthExerciseIds,
    strengthExerciseOptions: strengthCards.map((card) => ({
      id: card.exerciseId || card.id,
      name: card.exerciseName,
      thumbnailUrl: card.thumbnailUrl || null,
      metricExerciseId: card.exerciseId || card.id,
    })),
    strengthCards,
  })

  assert.deepEqual(noLibraryVisibleStrengthCards.map((card) => card.exerciseName), ['Bench Press'])
})

test('mobile analytics strength cold reload can reconstruct selected non-metric exercises before the library picker is opened', () => {
  const strengthCards = [
    {
      id: 'metric-back-squat',
      exerciseId: 'metric-back-squat',
      exerciseName: 'Back Squat',
      oneRepMaxValueLabel: '149 lb',
      sourcePerformanceTagLabel: '120 lb x 8',
      thumbnailUrl: 'back-squat-thumb',
    },
  ]

  const visibleStrengthCards = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['metric-back-squat', 'library-1arm-row', 'library-cable-rdl'],
    strengthExerciseOptions: strengthCards.map((card) => ({
      id: card.exerciseId || card.id,
      name: card.exerciseName,
      thumbnailUrl: card.thumbnailUrl || null,
      metricExerciseId: card.exerciseId || card.id,
    })),
    strengthCards,
    appliedStrengthExercises: [
      { id: 'metric-back-squat', name: 'Back Squat', thumbnailUrl: 'back-squat-thumb', metricExerciseId: 'metric-back-squat' },
      { id: 'library-1arm-row', name: '1-Arm DB Row', thumbnailUrl: 'row-thumb', metricExerciseId: null },
      { id: 'library-cable-rdl', name: '1-Leg Cable RDL', thumbnailUrl: 'rdl-thumb', metricExerciseId: null },
    ],
  })

  assert.deepEqual(visibleStrengthCards.map((card) => card.exerciseName), ['Back Squat', '1-Arm DB Row', '1-Leg Cable RDL'])
  assert.equal(visibleStrengthCards[1].oneRepMaxValueLabel, '--')
  assert.equal(visibleStrengthCards[2].sourcePerformanceTagLabel, 'No logged strength sets yet')
})

test('mobile analytics strength Progress rows prefer the selected library exercise metadata when applied state is stored as metric ids', () => {
  const strengthCards = [
    {
      id: 'metric-bench-press',
      exerciseId: 'metric-bench-press',
      exerciseName: 'Bench Press',
      oneRepMaxValueLabel: '225 lb',
      sourcePerformanceTagLabel: '185 lb x 8',
      thumbnailUrl: null,
    },
  ]

  const strengthExerciseOptions = buildStrengthExerciseOptions({
    strengthExerciseLibraryItems: [
      { id: 'library-bench-press', name: 'Barbell Bench Press', thumbnailUrl: 'bench-thumb' },
    ],
    strengthCards,
  })

  const visibleStrengthCards = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['metric-bench-press'],
    strengthExerciseOptions,
    strengthCards,
  })

  assert.deepEqual(visibleStrengthCards.map((card) => card.exerciseName), ['Barbell Bench Press'])
  assert.equal(visibleStrengthCards[0].thumbnailUrl, 'bench-thumb')
  assert.equal(visibleStrengthCards[0].oneRepMaxValueLabel, '225 lb')
})

test('mobile analytics strength Progress rows can still prefer matching library metadata even when metricExerciseId enrichment is missing', () => {
  const strengthCards = [
    {
      id: 'metric-bench-press',
      exerciseId: 'metric-bench-press',
      exerciseName: 'Bench Press',
      oneRepMaxValueLabel: '225 lb',
      sourcePerformanceTagLabel: '185 lb x 8',
      thumbnailUrl: null,
    },
  ]

  const strengthExerciseOptions = [
    { id: 'library-bench-press', name: 'Barbell Bench Press', thumbnailUrl: 'bench-thumb', metricExerciseId: null },
  ]

  const visibleStrengthCards = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['metric-bench-press'],
    strengthExerciseOptions,
    strengthCards,
  })

  assert.deepEqual(visibleStrengthCards.map((card) => card.exerciseName), ['Barbell Bench Press'])
  assert.equal(visibleStrengthCards[0].thumbnailUrl, 'bench-thumb')
})

test('mobile analytics strength comparable-name fallback does not let a generic one-word metric card hijack specific filter selections', () => {
  const strengthCards = [
    {
      id: 'metric-leg',
      exerciseId: 'metric-leg',
      exerciseName: 'Leg',
      oneRepMaxValueLabel: '149 lb',
      sourcePerformanceTagLabel: '120 lb x 8',
      thumbnailUrl: null,
    },
  ]

  const strengthExerciseOptions = [
    { id: 'library-leg-curl', name: 'Leg Curl', thumbnailUrl: null, metricExerciseId: null },
    { id: 'library-leg-press-45', name: 'Leg Press 45', thumbnailUrl: null, metricExerciseId: null },
  ]

  const visibleStrengthCards = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['library-leg-curl', 'library-leg-press-45'],
    strengthExerciseOptions,
    strengthCards,
  })

  assert.deepEqual(visibleStrengthCards.map((card) => card.exerciseName), ['Leg Curl', 'Leg Press 45'])
  assert.equal(visibleStrengthCards[0].oneRepMaxValueLabel, '--')
  assert.equal(visibleStrengthCards[1].sourcePerformanceTagLabel, 'No logged strength sets yet')
})

test('mobile analytics strength Update Chart can switch the visible rows when applied selections use library ids but metric cards use different ids and names', () => {
  const strengthCards = [
    {
      id: 'metric-back-squat',
      exerciseId: 'metric-back-squat',
      exerciseName: 'Back Squat',
      oneRepMaxValueLabel: '149 lb',
      sourcePerformanceTagLabel: '120 lb x 8',
      thumbnailUrl: null,
    },
    {
      id: 'metric-bench-press',
      exerciseId: 'metric-bench-press',
      exerciseName: 'Bench Press',
      oneRepMaxValueLabel: '225 lb',
      sourcePerformanceTagLabel: '185 lb x 8',
      thumbnailUrl: null,
    },
  ]

  const strengthExerciseOptions = buildStrengthExerciseOptions({
    strengthExerciseLibraryItems: [
      { id: 'library-bench-press', name: 'Barbell Bench Press', thumbnailUrl: null },
      { id: 'library-split-squat', name: 'DB Rear Foot Elevated Split Squat', thumbnailUrl: null },
    ],
    strengthCards,
  })

  const initialVisibleStrengthCards = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['metric-back-squat'],
    strengthExerciseOptions,
    strengthCards,
  })
  assert.deepEqual(initialVisibleStrengthCards.map((card) => card.exerciseName), ['Back Squat'])

  const nextVisibleStrengthCards = buildVisibleStrengthCards({
    appliedStrengthExerciseIds: ['library-bench-press'],
    strengthExerciseOptions,
    strengthCards,
  })
  assert.deepEqual(nextVisibleStrengthCards.map((card) => card.exerciseName), ['Barbell Bench Press'])
  assert.equal(nextVisibleStrengthCards[0].oneRepMaxValueLabel, '225 lb')
  assert.equal(nextVisibleStrengthCards[0].sourcePerformanceTagLabel, '185 lb x 8')
})

test('mobile analytics strength defaults come from the athlete\'s two most frequently performed exercises and only auto-sync before the user applies a custom filter', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(analyticsSource, /let isActive = true[\s\S]*setIsStrengthSelectionHydrated\(false\)/)
  assert.match(analyticsSource, /const nextStorage = await resolveStrengthSelectionStorage\(\)/)
  assert.match(analyticsSource, /setResolvedStrengthSelectionStorage\(nextStorage\)/)
  assert.match(analyticsSource, /const persistedSelectionState = await readStoredStrengthSelectionState\(\{[\s\S]*storage: nextStorage,[\s\S]*selectionKey: strengthSelectionPersistenceKey,[\s\S]*defaultStrengthExerciseIds: defaultAppliedStrengthExerciseIds,[\s\S]*\}\)/)
  assert.match(analyticsSource, /setAppliedStrengthExerciseIds\(persistedSelectionState\.appliedStrengthExerciseIds\)/)
  assert.match(analyticsSource, /setDraftStrengthExerciseIds\(reconcileStrengthExerciseSelectionIds\(persistedSelectionState\.appliedStrengthExerciseIds, \{[\s\S]*strengthExerciseOptionByMetricExerciseId[\s\S]*\}\)\)/)
  assert.match(analyticsSource, /setHasAppliedCustomStrengthFilter\(persistedSelectionState\.hasAppliedCustomStrengthFilter\)/)
  assert.match(analyticsSource, /setIsStrengthSelectionHydrated\(true\)/)
  assert.match(analyticsSource, /const nextDefaultSelection = getDefaultSyncedStrengthSelection\(\{[\s\S]*hasAppliedCustomStrengthFilter,[\s\S]*defaultStrengthExerciseIds: defaultAppliedStrengthExerciseIds,[\s\S]*\}\)/)
  assert.match(analyticsSource, /if \(!isStrengthSelectionHydrated \|\| !resolvedStrengthSelectionStorage\) return/)
  assert.match(analyticsSource, /writeStoredStrengthSelectionState\(\{[\s\S]*storage: resolvedStrengthSelectionStorage,[\s\S]*selectionKey: strengthSelectionPersistenceKey,[\s\S]*appliedStrengthExerciseIds,[\s\S]*hasAppliedCustomStrengthFilter,[\s\S]*\}\)/)
  assert.match(analyticsSource, /setHasAppliedCustomStrengthFilter\(true\)/)
  assert.match(progressSource, /strengthSelectionPersistenceKey: buildStrengthSelectionPersistenceKey\(\{[\s\S]*sessions: completedSessions,[\s\S]*strengthSelectionContextId,[\s\S]*\}\)/)
  assert.match(progressSource, /defaultStrengthExerciseIds: buildDefaultStrengthExerciseIds\(completedSessions\)/)
  assert.match(progressSource, /function buildDefaultStrengthExerciseIds\(sessions\) \{[\s\S]*exerciseCountById[\s\S]*sort\([\s\S]*right\.count - left\.count[\s\S]*slice\(0, 2\)[\s\S]*map\(\(entry\) => entry\.exerciseId\)/)
})

test('mobile analytics strength cold-reload migration backfills legacy saved selections by loading the exercise library even before the filter is reopened', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')

  assert.match(analyticsSource, /const shouldHydratePersistedStrengthExercises = isStrengthSelectionHydrated && hasAppliedCustomStrengthFilter && !appliedStrengthExercises\.length/)
  assert.match(analyticsSource, /const shouldLoadStrengthExerciseLibrary = isStrengthFilterViewOpen \|\| shouldHydratePersistedStrengthExercises/)
  assert.match(analyticsSource, /if \(!shouldLoadStrengthExerciseLibrary\) return/)
  assert.match(analyticsSource, /setAppliedStrengthExercises\(\(current\) => current\.length \? current : reconcileStrengthExerciseSelectionIds\(appliedStrengthExerciseIds, \{[\s\S]*\.map\(\(exerciseId\) => nextStrengthExerciseOptionById\.get\(exerciseId\)\)[\s\S]*\.filter\(Boolean\)\)/)
  assert.match(analyticsSource, /\}, \[isStrengthFilterViewOpen, shouldHydratePersistedStrengthExercises\]\)/)
})

test('mobile analytics strength defaults only count metric-capable completed work for the initial top-2 selection', () => {
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(progressSource, /function buildDefaultStrengthExerciseIds\(sessions\) \{[\s\S]*for \(const set of exercise\.sets \|\| \[\]\) \{[\s\S]*if \(!set\.isCompleted\) continue[\s\S]*const load = set\.actualLoad \?\? set\.prescribedLoad[\s\S]*const reps = set\.actualReps \?\? set\.prescribedReps[\s\S]*if \(load == null \|\| reps == null\) continue[\s\S]*hasMetricCompletedSet = true/)
})

test('mobile analytics strength filter reconciles selection ids into the visible exercise-id seam instead of raw-pruning applied state when the library ids differ', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const strengthStateSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-strength-state.js'), 'utf8')

  assert.match(strengthStateSource, /export function reconcileStrengthExerciseSelectionIds\(exerciseIds, \{[\s\S]*strengthExerciseOptionById[\s\S]*metricCardByLibraryId[\s\S]*metricCardByExerciseName[\s\S]*strengthExerciseOptionByName/)
  assert.match(analyticsSource, /const defaultAppliedStrengthExerciseIds = useMemo\(\(\) => reconcileAppliedStrengthExerciseSelectionIds\(getInitialStrengthSelectionIds\(/)
  assert.match(analyticsSource, /setAppliedStrengthExerciseIds\(\(current\) => reconcileAppliedStrengthExerciseSelectionIds\(current, \{[\s\S]*strengthExerciseOptionByMetricExerciseId[\s\S]*\}\)\)/)
  assert.match(analyticsSource, /setDraftStrengthExerciseIds\(\(current\) => reconcileStrengthExerciseSelectionIds\(current, \{[\s\S]*strengthExerciseOptionByMetricExerciseId[\s\S]*\}\)\)/)
})

test('mobile analytics strength rendering keeps selected non-metric exercises visible with placeholder rows, while back-close keeps the last applied state intact', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const strengthStateSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-strength-state.js'), 'utf8')

  assert.match(analyticsSource, /import \{ buildStrengthExerciseOptions, buildVisibleStrengthCards, normalizeStrengthExerciseName, getInitialStrengthSelectionIds, getInitialStrengthSelectionState, copyAppliedToDraft, toggleStrengthExerciseDraft, applyStrengthExerciseDraft, getDefaultSyncedStrengthSelection, reconcileStrengthExerciseSelectionIds, reconcileAppliedStrengthExerciseSelectionIds, resolveStrengthSelectionStorage, readStoredStrengthSelectionState, writeStoredStrengthSelectionState \} from '\.\/analytics-strength-state\.js'/)
  assert.match(analyticsSource, /const visibleStrengthCards = useMemo\(\(\) => buildVisibleStrengthCards\(/)
  assert.doesNotMatch(analyticsSource, /function createEmptyStrengthCard\(/)
  assert.match(strengthStateSource, /export function buildVisibleStrengthCards\([\s\S]*findMetricCardForExerciseOption[\s\S]*if \(!resolvedMetricCard\) \{[\s\S]*oneRepMaxValueLabel: '--'[\s\S]*sourcePerformanceTagLabel: 'No logged strength sets yet'/)
  assert.match(analyticsSource, /function handleCloseStrengthExerciseFilter\(\) \{[\s\S]*setDraftStrengthExerciseIds\(reconcileStrengthExerciseSelectionIds\(appliedStrengthExerciseIds, \{[\s\S]*strengthExerciseOptionByMetricExerciseId[\s\S]*\}\)\)[\s\S]*setStrengthExerciseSearchQuery\(''\)[\s\S]*setIsStrengthFilterViewOpen\(false\)[\s\S]*\}/)
})

test('mobile analytics view includes the requested dropdown labels for Progress and Training Load', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(progressSource, /progressOptions: \[/)
  assert.match(progressSource, /id: 'strength'/)
  assert.match(progressSource, /label: 'Strength'/)
  assert.match(progressSource, /id: 'consistency'/)
  assert.match(progressSource, /label: 'Consistency'/)
  assert.match(progressSource, /activeProgressOptionId: 'strength'/)
  assert.match(progressSource, /trainingLoadOptions: \[/)
  assert.match(progressSource, /id: 'recovery'/)
  assert.match(progressSource, /label: 'Recovery'/)
  assert.match(progressSource, /id: 'seven-day-activity'/)
  assert.match(progressSource, /label: '7 Days Activity'/)
  assert.match(progressSource, /activeTrainingLoadOptionId: 'recovery'/)
  assert.match(analyticsSource, /ChevronDown/)
  assert.doesNotMatch(analyticsSource, /rotate-\[/)
  assert.doesNotMatch(analyticsSource, /react-native-reanimated/)
})

test('mobile analytics recovery bars do not use a generic `.value` member in inline width styles', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.doesNotMatch(analyticsSource, /width:\s*row\.value/)
  assert.match(analyticsSource, /width:\s*row\.barWidth/)
  assert.match(progressSource, /percentageLabel:/)
  assert.match(progressSource, /barWidth:/)
})

test('mobile analytics progress dropdown opens a real bottom sheet with Strength and Consistency options', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(progressSource, /label: 'Strength'/)
  assert.match(progressSource, /label: 'Consistency'/)
  assert.match(analyticsSource, /useState\(/)
  assert.match(analyticsSource, /function AnalyticsOptionSheet\(/)
  assert.match(analyticsSource, /<Modal transparent animationType="fade" visible onRequestClose=\{onClose\}>/)
  assert.match(analyticsSource, /optionSheetWrap/)
  assert.match(analyticsSource, /optionSheetBackdrop/)
  assert.match(analyticsSource, /Strength/)
  assert.match(analyticsSource, /Consistency/)
  assert.match(analyticsSource, /Check/)
  assert.match(analyticsSource, /activeSheet === 'progress'/)
  assert.match(analyticsSource, /setActiveSheet\('progress'\)/)
})

test('mobile analytics training load dropdown opens a real bottom sheet with Recovery and 7d Activity options', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(progressSource, /label: 'Recovery'/)
  assert.match(progressSource, /label: '7 Days Activity'/)
  assert.match(analyticsSource, /useState\(/)
  assert.match(analyticsSource, /function AnalyticsOptionSheet\(/)
  assert.match(analyticsSource, /<Modal transparent animationType="fade" visible onRequestClose=\{onClose\}>/)
  assert.match(analyticsSource, /optionSheetWrap/)
  assert.match(analyticsSource, /optionSheetBackdrop/)
  assert.match(analyticsSource, /7d Activity/)
  assert.match(analyticsSource, /Recovery/)
  assert.match(analyticsSource, /Check/)
  assert.match(analyticsSource, /activeSheet === 'training-load'/)
  assert.match(analyticsSource, /setActiveSheet\('training-load'\)/)
})

test('mobile analytics renders a dedicated Consistency chart state with Gifted Charts when Progress is switched', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const packageSource = readFileSync(resolve(process.cwd(), 'apps/mobile/package.json'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(packageSource, /"react-native-gifted-charts"/)
  assert.match(packageSource, /"expo-linear-gradient"/)
  assert.match(analyticsSource, /from 'react-native-gifted-charts'/)
  assert.match(analyticsSource, /function ConsistencyBarChart\(/)
  assert.match(analyticsSource, /activeProgressOptionId === 'consistency'/)
  assert.match(analyticsSource, /BarChart/)
  assert.match(analyticsSource, /WORKOUTS PER WEEK/)
  assert.match(progressSource, /Mar 8/)
  assert.match(progressSource, /Apr 19/)
  assert.match(analyticsSource, /consistencyGridline/)
  assert.match(analyticsSource, /consistencyXAxisLabels/)
  assert.match(progressSource, /title: 'Workouts per week'/)
  assert.doesNotMatch(analyticsSource, /from 'victory-native'/)
  assert.doesNotMatch(analyticsSource, /model\.consistencyLabel/)
})

test('mobile analytics recovery view supports borderless figure art and muscle drilldown with a primary green back button', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(analyticsSource, /const \[activeRecoveryMuscleId, setActiveRecoveryMuscleId\] = useState\(null\)/)
  assert.match(analyticsSource, /activeTrainingLoadOptionId === 'recovery'/)
  assert.match(analyticsSource, /function RecoveryOverview\(/)
  assert.match(analyticsSource, /function RecoveryDetailView\(\{ muscleGroup, onBack, theme, styles \}\)/)
  assert.match(analyticsSource, /function RecoveryBackButton\(/)
  assert.match(analyticsSource, /activeRecoveryMuscleId \? \(/)
  assert.match(analyticsSource, /setActiveRecoveryMuscleId\(row\.id\)/)
  assert.match(analyticsSource, /setActiveRecoveryMuscleId\(null\)/)
  assert.match(analyticsSource, /ChevronLeft/)
  assert.match(analyticsSource, /recoveryFigureWrap/)
  assert.doesNotMatch(analyticsSource, /recoveryFigureCard/)
  assert.match(analyticsSource, /recoveryGridColumn:[\s\S]*justifyContent: 'space-between'/)
  assert.match(analyticsSource, /<RecoveryBackButton theme=\{theme\} styles=\{styles\} \/>/)
  assert.doesNotMatch(analyticsSource, /RecoveryBackButton label=/)
  assert.match(analyticsSource, /recoveryBackCard:/)
  assert.match(analyticsSource, /recoveryBackCard:[\s\S]*backgroundColor: theme\.accentSurface/)
  assert.match(analyticsSource, /recoveryBackCard:[\s\S]*borderColor: theme\.accentBorder/)
  assert.match(analyticsSource, /recoveryBackCard:[\s\S]*flex: 1/)
  assert.match(analyticsSource, /recoveryBackButton:[\s\S]*width: '100%'/)
  assert.match(analyticsSource, /recoveryBackButton:[\s\S]*height: '100%'/)
  assert.match(analyticsSource, /recoveryBackButton:[\s\S]*justifyContent: 'center'/)

  assert.match(progressSource, /recoveryMuscleGroups:/)
  assert.match(progressSource, /subMuscles:/)
  assert.match(progressSource, /id: 'arms'/)
  assert.match(progressSource, /label: 'Biceps'/)
  assert.match(progressSource, /label: 'Triceps'/)
  assert.match(progressSource, /label: 'Forearms'/)
})

test('mobile analytics 7 day activity uses set counts with muscle drilldown and the same green back card treatment', () => {
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')
  const progressSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/progress/index.js'), 'utf8')

  assert.match(analyticsSource, /const \[activeActivityMuscleId, setActiveActivityMuscleId\] = useState\(null\)/)
  assert.match(analyticsSource, /function ActivityOverview\(/)
  assert.match(analyticsSource, /function ActivityDetailView\(\{ muscleGroup, onBack, theme, styles \}\)/)
  assert.match(analyticsSource, /<ActivityDetailView muscleGroup=\{activeActivityMuscle\} onBack=\{\(\) => setActiveActivityMuscleId\(null\)\} theme=\{resolvedTheme\} styles=\{styles\} \/>/)
  assert.match(analyticsSource, /<ActivityOverview rows=\{activityMuscleGroups\} onSelectMuscle=\{\(row\) => setActiveActivityMuscleId\(row\.id\)\} styles=\{styles\} \/>/)
  assert.match(analyticsSource, /setActiveActivityMuscleId\(row\.id\)/)
  assert.match(analyticsSource, /setActiveActivityMuscleId\(null\)/)
  assert.match(analyticsSource, /setCountLabel/)
  assert.doesNotMatch(analyticsSource, /row\.percentageLabel.*seven-day-activity/)
  assert.doesNotMatch(analyticsSource, /row\.barWidth.*seven-day-activity/)
  assert.match(analyticsSource, /<RecoveryBackButton theme=\{theme\} styles=\{styles\} \/>/)
  assert.match(analyticsSource, /recoveryBackCard:[\s\S]*backgroundColor: theme\.accentSurface/)
  assert.match(analyticsSource, /recoveryBackCard:[\s\S]*borderColor: theme\.accentBorder/)

  assert.match(progressSource, /activityMuscleGroups:/)
  assert.match(progressSource, /setCountLabel: '0 sets'/)
  assert.match(progressSource, /setCountLabel: '6 sets'/)
  assert.match(progressSource, /label: 'Biceps'/)
  assert.match(progressSource, /label: 'Triceps'/)
  assert.match(progressSource, /label: 'Forearms'/)
})
