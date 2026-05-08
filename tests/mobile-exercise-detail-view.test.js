import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getExerciseDetailViewModel } from '../apps/mobile/src/train/exercise-detail-view-models.js'
import { createDemoCompletedSessions, createDemoProgramWorkout } from '../apps/mobile/src/train/index.js'

test('mobile app shell owns a dedicated exercise detail view state and selected exercise model', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /const \[isExerciseDetailViewOpen, setIsExerciseDetailViewOpen\] = useState\(false\);/)
  assert.match(appSource, /const \[exerciseDetailReturnSurface, setExerciseDetailReturnSurface\] = useState\(null\);/)
  assert.match(appSource, /const \[selectedExerciseId, setSelectedExerciseId\] = useState\(null\);/)
  assert.match(appSource, /const exerciseDetailViewModel = useMemo\(/)
  assert.match(appSource, /<ExerciseDetailView[\s\S]*isVisible=\{isExerciseDetailViewOpen\}/)
})

test('mobile workout sheet, edit view, active workout, and completed recap hand exercise detail off through the app shell via the extracted orchestration seam', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const workoutSheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/workout-sheet.js'), 'utf8')
  const editViewSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/workout-edit-view.js'), 'utf8')
  const activeWorkoutSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/active-workout-view.js'), 'utf8')
  const analyticsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/analytics-view.js'), 'utf8')

  assert.match(appSource, /open-exercise-detail-selection\.js/)
  assert.match(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*orchestrateOpenExerciseDetail\(\{[\s\S]*exercise,[\s\S]*sourceSurface,[\s\S]*exerciseDetailClient,[\s\S]*logger: console,[\s\S]*setSelectedExerciseId,[\s\S]*setSelectedExercisePreview,[\s\S]*setExerciseDetailReturnSurface,[\s\S]*setIsWorkoutSheetOpen,[\s\S]*setIsWorkoutEditViewOpen,[\s\S]*setIsProfileViewOpen,[\s\S]*setIsActiveWorkoutViewOpen,[\s\S]*setIsExerciseDetailViewOpen,[\s\S]*\}\);[\s\S]*\}/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*setSelectedExerciseId\(exerciseId\)/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*setSelectedExercisePreview\(exercise\)/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*setExerciseDetailReturnSurface\(sourceSurface\)/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*setIsExerciseDetailViewOpen\(true\)/)
  assert.match(appSource, /onOpenExerciseDetail=\{\(exercise\) => handleOpenExerciseDetail\(exercise, 'workout-sheet'\)\}/)
  assert.match(appSource, /onOpenExerciseDetail=\{\(exercise\) => handleOpenExerciseDetail\(exercise, 'workout-edit'\)\}/)
  assert.match(appSource, /onOpenExerciseDetail=\{\(exercise\) => handleOpenExerciseDetail\(exercise, 'active-workout'\)\}/)
  assert.match(appSource, /renderAnalyticsView: \(screen\) => <AnalyticsView model=\{screen\} theme=\{appTheme\} onOpenExerciseDetail=\{\(exercise\) => handleOpenExerciseDetail\(exercise, 'metrics-strength'\)\} \/>/)
  assert.match(appSource, /if \(targetKey === 'exercise-detail'\) \{[\s\S]*handleOpenExerciseDetail\(payload\?\.exercise \?\? payload, payload\?\.sourceSurface \?\? 'completed-session'\);[\s\S]*return;[\s\S]*\}/)
  assert.match(appSource, /async function handleCloseExerciseDetail\(\) \{[\s\S]*orchestrateCloseExerciseDetail\(\{[\s\S]*exerciseDetailReturnSurface,[\s\S]*setIsExerciseDetailViewOpen,[\s\S]*setIsWorkoutSheetOpen,[\s\S]*setIsWorkoutEditViewOpen,[\s\S]*setIsProfileViewOpen,[\s\S]*setIsActiveWorkoutViewOpen,[\s\S]*setExerciseDetailReturnSurface,[\s\S]*\}\);[\s\S]*\}/)
  assert.doesNotMatch(appSource, /async function handleCloseExerciseDetail\(\) \{[\s\S]*setIsExerciseDetailViewOpen\(false\)/)
  assert.doesNotMatch(appSource, /async function handleCloseExerciseDetail\(\) \{[\s\S]*setExerciseDetailReturnSurface\(null\)/)
  assert.match(workoutSheetSource, /onOpenExerciseDetail/)
  assert.match(workoutSheetSource, /<Pressable onPress=\{\(\) => onOpenExerciseDetail\?\.\(exercise\)\}>/)
  assert.match(editViewSource, /onOpenExerciseDetail/)
  assert.match(editViewSource, /<Pressable onPress=\{\(\) => onOpenExerciseDetail\?\.\(exercise\)\}>/)
  assert.match(activeWorkoutSource, /onOpenExerciseDetail/)
  assert.match(activeWorkoutSource, /<Pressable onPress=\{\(\) => onOpenExerciseDetail\?\.\(exercise\)\}>/)
  assert.match(analyticsSource, /onOpenExerciseDetail/)
  assert.match(analyticsSource, /onPress=\{\(\) => onOpenExerciseDetail\?\.\(\{[\s\S]*sourceSurface: 'metrics-strength'/)
})

test('mobile exercise detail view opens PR-driven recap rows with best-history context and a new-record callout', () => {
  const modelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/exercise-detail-view-models.js'), 'utf8')
  const screenSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/exercise-detail-view.js'), 'utf8')

  assert.match(modelSource, /historyMode: exercise\?\.entryContext\?\.historyMode \|\| 'recent',/)
  assert.match(modelSource, /entryContext: exercise\?\.entryContext \|\| null,/)
  assert.match(modelSource, /prCallout: exercise\?\.entryContext\?\.type === 'completed-session-pr' \? \{[\s\S]*title: 'New PR',[\s\S]*body:[\s\S]*\} : null,/)
  assert.match(screenSource, /model\.prCallout \? \(/)
  assert.match(screenSource, /model\.prCallout\.title/)
  assert.match(screenSource, /model\.prCallout\.body/)
})

test('mobile exercise detail view can resolve profile library exercises and active-workout exercises outside the workout sheet data set', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const modelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/exercise-detail-view-models.js'), 'utf8')

  assert.match(appSource, /const \[selectedExercisePreview, setSelectedExercisePreview\] = useState\(null\);/)
  assert.match(appSource, /const allExercises = \[\.\.\.\(workoutSheetModel\?\.exercises \|\| \[\]\), \.\.\.\(workoutEditViewModel\?\.exercises \|\| \[\]\), \.\.\.\(activeWorkoutViewModel\?\.exercises \|\| \[\]\)\];/)
  assert.match(appSource, /return allExercises\.find\(\(exercise\) => exercise\.id === selectedExerciseId \|\| exercise\.exerciseId === selectedExerciseId\) \|\| selectedExercisePreview \|\| null;/)
  assert.match(modelSource, /title: exercise\?\.title \|\| exercise\?\.name \|\| exercise\?\.nameSnapshot \|\| 'Exercise detail',/)
  assert.match(modelSource, /videoUrl: exercise\?\.videoUrl \|\| DEFAULT_VIDEO_URL,/)
})

test('mobile app shell delegates exercise-detail hydration-by-id to the extracted selection helper so imported video URLs still win', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /open-exercise-detail-selection\.js/)
  assert.match(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*orchestrateOpenExerciseDetail\(\{[\s\S]*exerciseDetailClient,[\s\S]*\}\);[\s\S]*\}/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*exerciseDetailClient\?\.getExerciseById\?\.\(exerciseId\)/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*setSelectedExercisePreview\(/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*setIsExerciseDetailViewOpen\(true\)/)
})

test('mobile app shell delegates exact-name exercise-detail fallback lookup to the extracted selection helper when workout-side synthetic ids miss the real row', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /open-exercise-detail-selection\.js/)
  assert.match(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*orchestrateOpenExerciseDetail\(\{[\s\S]*exerciseDetailClient,[\s\S]*\}\);[\s\S]*\}/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*exerciseDetailClient\?\.getExerciseByName\?\.\(exerciseName\)/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*resolvedExerciseByName/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*const resolvedExercise = resolvedExerciseById \|\| resolvedExerciseByName \|\| null;/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*const exerciseName = exercise\?\.name \|\| exercise\?\.nameSnapshot \|\| null;/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*setSelectedExercisePreview\(/)
  assert.doesNotMatch(appSource, /function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*setIsExerciseDetailViewOpen\(true\)/)
})

test('mobile exercise detail view prefers the imported exercise video URL even for known library exercise ids', () => {
  const modelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/exercise-detail-view-models.js'), 'utf8')

  assert.match(modelSource, /return \{[\s\S]*\.\.\.libraryDetail,[\s\S]*videoUrl: exercise\?\.videoUrl \|\| libraryDetail\.videoUrl \|\| DEFAULT_VIDEO_URL,[\s\S]*\}/)
})

test('mobile exercise detail view builds athlete-plus-exercise PR chart points from completed sessions instead of hardcoded placeholders', () => {
  const completedSessions = createDemoCompletedSessions(createDemoProgramWorkout())
  const model = getExerciseDetailViewModel({
    exercise: {
      id: 'exercise-squat',
      exerciseId: 'exercise-squat',
      title: 'Barbell Back Squat',
      name: 'Barbell Back Squat',
    },
    sessions: completedSessions,
  })

  assert.deepEqual(
    model.progressPoints.map((point) => ({ dateLabel: point.dateLabel, value: point.value, displayValue: point.displayValue })),
    [
      { dateLabel: 'Apr 18, 2026', value: 158, displayValue: '158' },
      { dateLabel: 'Apr 20, 2026', value: 171, displayValue: '171' },
    ],
  )
  assert.deepEqual(
    model.historyRows.slice(0, 2).map((row) => row.cells),
    [
      ['Apr 20, 2026', '135.0', '8', '171.0'],
      ['Apr 20, 2026', '135.0', '8', '171.0'],
    ],
  )
  assert.equal(model.progressYAxisLabel, 'ESTIMATED 1RM (LB)')
  assert.equal(model.progressXAxisLabel, 'DATE')
  assert.equal(model.metricProfileId, 'strength_1rm')
  assert.deepEqual(model.historyHeaders, ['DATE', 'WEIGHT (LB)', 'REPS', 'EST 1RM (LB)'])
})

test('mobile exercise detail view switches to a speed metric profile for run-style exercises while keeping the same detail shell contract', () => {
  const sessions = [
    {
      id: 'session-tempo-1',
      status: 'completed',
      completedAt: '2026-05-01T20:00:00.000Z',
      exercises: [
        {
          id: 'session-exercise-tempo-1',
          exerciseId: 'exercise-tempo-run',
          nameSnapshot: 'Tempo Run',
          sets: [
            { id: 'tempo-set-1', isCompleted: true, actualDistance: 200, actualDistanceUnit: 'm', actualDurationSeconds: 42 },
            { id: 'tempo-set-2', isCompleted: true, actualDistance: 200, actualDistanceUnit: 'm', actualDurationSeconds: 40 },
          ],
        },
      ],
    },
    {
      id: 'session-tempo-2',
      status: 'completed',
      completedAt: '2026-05-08T20:00:00.000Z',
      exercises: [
        {
          id: 'session-exercise-tempo-2',
          exerciseId: 'exercise-tempo-run',
          nameSnapshot: 'Tempo Run',
          sets: [
            { id: 'tempo-set-3', isCompleted: true, actualDistance: 200, actualDistanceUnit: 'm', actualDurationSeconds: 39 },
          ],
        },
      ],
    },
  ]

  const model = getExerciseDetailViewModel({
    exercise: {
      id: 'exercise-tempo-run',
      exerciseId: 'exercise-tempo-run',
      title: 'Tempo Run',
      name: 'Tempo Run',
    },
    sessions,
  })

  assert.equal(model.metricProfileId, 'speed_time')
  assert.equal(model.progressYAxisLabel, 'TIME (SEC)')
  assert.equal(model.progressXAxisLabel, 'DATE')
  assert.deepEqual(model.historyHeaders, ['DATE', 'DISTANCE', 'TIME', 'PACE'])
  assert.deepEqual(
    model.progressPoints.map((point) => ({ dateLabel: point.dateLabel, value: point.value, displayValue: point.displayValue })),
    [
      { dateLabel: 'May 1, 2026', value: 40, displayValue: '40.0 s' },
      { dateLabel: 'May 8, 2026', value: 39, displayValue: '39.0 s' },
    ],
  )
  assert.deepEqual(model.historyRows[0].cells, ['May 8, 2026', '200 m', '39.0 s', '19.5 s / 100m'])
})

test('mobile exercise detail view switches to a bodyweight control profile for reps-plus-duration work while keeping shared section chrome', () => {
  const sessions = [
    {
      id: 'session-control-1',
      status: 'completed',
      completedAt: '2026-05-03T20:00:00.000Z',
      exercises: [
        {
          id: 'session-exercise-control-1',
          exerciseId: 'exercise-knee-drive',
          nameSnapshot: 'Feet Elevated Hand Plank w/ Knee Drive',
          sets: [
            { id: 'control-set-1', isCompleted: true, actualReps: 4, actualDurationSeconds: 24 },
            { id: 'control-set-2', isCompleted: true, actualReps: 5, actualDurationSeconds: 25 },
          ],
        },
      ],
    },
    {
      id: 'session-control-2',
      status: 'completed',
      completedAt: '2026-05-10T20:00:00.000Z',
      exercises: [
        {
          id: 'session-exercise-control-2',
          exerciseId: 'exercise-knee-drive',
          nameSnapshot: 'Feet Elevated Hand Plank w/ Knee Drive',
          sets: [
            { id: 'control-set-3', isCompleted: true, actualReps: 6, actualDurationSeconds: 28 },
          ],
        },
      ],
    },
  ]

  const model = getExerciseDetailViewModel({
    exercise: {
      id: 'exercise-knee-drive',
      exerciseId: 'exercise-knee-drive',
      title: 'Feet Elevated Hand Plank w/ Knee Drive',
      name: 'Feet Elevated Hand Plank w/ Knee Drive',
    },
    sessions,
  })

  assert.equal(model.metricProfileId, 'bodyweight_reps')
  assert.equal(model.progressYAxisLabel, 'REPS')
  assert.equal(model.progressXAxisLabel, 'DATE')
  assert.deepEqual(model.historyHeaders, ['DATE', 'REPS', 'DURATION', 'RESULT'])
  assert.deepEqual(
    model.progressPoints.map((point) => ({ dateLabel: point.dateLabel, value: point.value, displayValue: point.displayValue })),
    [
      { dateLabel: 'May 3, 2026', value: 5, displayValue: '5 reps' },
      { dateLabel: 'May 10, 2026', value: 6, displayValue: '6 reps' },
    ],
  )
  assert.deepEqual(model.historyRows[0].cells, ['May 10, 2026', '6', '28.0 s', '6 reps in 28.0 s'])
})

test('mobile exercise detail view is video-ready and keeps one shared shell while reading metric-specific chart and history labels from the model', () => {
  const screenSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/exercise-detail-view.js'), 'utf8')
  const modelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/exercise-detail-view-models.js'), 'utf8')
  const packageSource = readFileSync(resolve(process.cwd(), 'apps/mobile/package.json'), 'utf8')

  assert.match(screenSource, /from 'expo-video'/)
  assert.match(screenSource, /VideoView/)
  assert.match(screenSource, /useVideoPlayer/)
  assert.match(screenSource, /from 'react-native-svg'/)
  assert.match(screenSource, /import Svg, \{ Circle, Line, Path, Text as SvgText \} from 'react-native-svg'/)
  assert.match(screenSource, /const values = model\.progressPoints\.map\(\(point\) => point\.value\)/)
  assert.match(screenSource, /\{point\.displayValue \|\| point\.value\}/)
  assert.match(screenSource, /<Line key=\{`\$\{point\.id\}-guide`\}/)
  assert.match(screenSource, /model\.historyHeaders\.map/)
  assert.match(screenSource, /row\.cells\.map/)
  assert.match(screenSource, /<SafeAreaView edges=\{\['bottom'\]\}/)
  assert.match(screenSource, /className="relative overflow-hidden" style=\{\{ backgroundColor: resolvedTheme\.surface \}\}/)
  assert.match(screenSource, /className="absolute left-5 h-10 w-10 items-center justify-center rounded-\[14px\]"/)
  assert.match(screenSource, /className="text-\[26px\] font-bold leading-\[32px\]" style=\{\{ color: resolvedTheme\.text \}\}>\{model\.title\}<\/Text>/)
  assert.match(screenSource, /from '\.\.\/ui\/primitives\.js'/)
  assert.match(screenSource, /AppSegmentedControl/)
  assert.match(screenSource, /options=\{historyModes\}/)
  assert.match(screenSource, /activeId=\{historyMode\}/)
  assert.match(screenSource, /onChange=\{onHistoryModeChange\}/)
  assert.doesNotMatch(screenSource, /function ExerciseHistoryTable[\s\S]*<View className="flex-row rounded-full p-1"/)
  assert.match(screenSource, /function ExerciseHistoryTable[\s\S]*model\.historyHeaders/)
  assert.match(screenSource, /function ExerciseHistoryTable[\s\S]*row\.cells/)
  assert.doesNotMatch(screenSource, /function ExerciseHistoryTable[\s\S]*rounded-\[24px\] border border-\[#243041\] bg-\[#111827\] px-4 py-4/)
  assert.match(screenSource, /DATE/)
  assert.match(modelSource, /metricProfileId/)
  assert.match(modelSource, /historyHeaders/)
  assert.match(modelSource, /progressPoints: detail\.progressPoints/)
  assert.match(modelSource, /getExerciseDetailViewModel/)
  assert.match(modelSource, /videoUrl/)
  assert.match(modelSource, /historyMode: exercise\?\.entryContext\?\.historyMode \|\| 'recent',/)
  assert.match(packageSource, /"expo-video"/)
})

test('mobile exercise detail empty Progress state keeps the full History chrome and shows the empty message under the headers', () => {
  const screenSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/exercise-detail-view.js'), 'utf8')

  assert.match(screenSource, /const hasProgressData = Array\.isArray\(model\.progressPoints\) && model\.progressPoints\.length > 0/)
  assert.match(screenSource, /\{hasProgressData \? \(/)
  assert.match(screenSource, /\) : \([\s\S]*<View className="min-h-\[220px\] items-center justify-center">/)
  assert.match(screenSource, /model\.emptyProgressMessage \|\| 'No data available for this exercise'/)
  assert.match(screenSource, /<AppSegmentedControl theme=\{theme\} options=\{historyModes\} activeId=\{historyMode\} onChange=\{onHistoryModeChange\} \/>/)
  assert.match(screenSource, /model\.historyHeaders\.map/)
  assert.match(screenSource, /model\.emptyHistoryMessage \|\| 'No history found'/)
})
