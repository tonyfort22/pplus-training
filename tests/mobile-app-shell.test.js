import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function extractFunctionBlock(source, signature) {
 const start = source.indexOf(signature)
 assert.notEqual(start, -1, `Expected to find function signature: ${signature}`)

 const bodyStart = source.indexOf('{', start + signature.length)
 assert.notEqual(bodyStart, -1, `Expected to find function body for: ${signature}`)

 let depth = 0
 for (let index = bodyStart; index < source.length; index += 1) {
   const char = source[index]
   if (char === '{') depth += 1
   if (char === '}') depth -= 1
   if (depth === 0) return source.slice(start, index + 1)
 }

 assert.fail(`Expected to find closing brace for: ${signature}`)
}

test('mobile app shell routes unconnected entry state to auth instead of demo train home scaffolding', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.doesNotMatch(appSource, /import \{[\s\S]*createTrainDemoState,[\s\S]*\} from '\.\/src\/train\/index\.js';/)
 assert.doesNotMatch(appSource, /const fallbackTrainState = useMemo\(\(\) => createTrainDemoState\(\{ previewState \}\), \[previewState\]\);/)
 assert.doesNotMatch(appSource, /effectiveRemoteTrainState \|\| fallbackTrainState/)
 assert.match(appSource, /overrideScreen: effectiveBootstrapState\.status === 'signed_out' \|\| \(isAuthPreviewEnabled && \(authPreviewState === 'sign_in' \|\| authPreviewState === 'sign_up'\)\)[\s\S]*\? authScreenModel/)
})

test('mobile app shell uses react-native-safe-area-context instead of deprecated react-native SafeAreaView', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /from 'react-native-safe-area-context'/)
 assert.match(appSource, /SafeAreaProvider/)
 assert.match(appSource, /<SafeAreaProvider>/)
 assert.match(appSource, /<SafeAreaView edges=\{\['top', 'left', 'right'\]\} style=\{styles\.container\}>/)
 assert.doesNotMatch(appSource, /import\s*\{\s*SafeAreaView\s*\}\s*from 'react-native'/)
})

test('mobile app shell opens the train preview on Calendar so the weekly strip is visible immediately', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /const \[activeTrainTab, setActiveTrainTab\] = useState\('calendar'\);/)
 assert.match(appSource, /setActiveTrainTab\('calendar'\)/)
})

test('mobile app shell no longer renders the preview state control in the top header', () => {
 const shellSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'),
   'utf8'
 )

 assert.doesNotMatch(shellSource, /Preview state/)
 assert.doesNotMatch(shellSource, /previewStates\?\.length/)
 assert.doesNotMatch(shellSource, /onPreviewStatePress/)
})

test('mobile app shell opens a dedicated program sheet from the program card instead of navigating away', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )
 const sheetSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'),
   'utf8'
 )
 const iconsSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/assets/ppht-icons.js'),
   'utf8'
 )

 assert.match(appSource, /const \[isProgramSheetOpen, setIsProgramSheetOpen\] = useState\(false\);/)
 assert.match(appSource, /const programSheetModel = useMemo\(/)
 assert.match(appSource, /if \(targetKey === 'program'\) \{[\s\S]*orchestrateOpenProgramSheet\(\{[\s\S]*trainState,[\s\S]*programSheetClient,[\s\S]*setProgramSheetReturnSurface,[\s\S]*setSelectedProgramPreview,[\s\S]*setIsProgramSheetOpen,[\s\S]*\}\);[\s\S]*return;[\s\S]*\}/)
 assert.match(appSource, /renderProgramSheet\(\{[\s\S]*isVisible: isProgramSheetOpen/)
 assert.match(sheetSource, /from 'lucide-react-native'/)
 assert.match(sheetSource, /className=/)
 assert.match(sheetSource, /Modal/)
 assert.match(sheetSource, /CalendarDays/)
 assert.match(sheetSource, /Dumbbell/)
 assert.match(sheetSource, /AppStatusIconBadge/)
 assert.doesNotMatch(sheetSource, /pphtCalendarDotsSvg/)
 assert.doesNotMatch(sheetSource, /pphtBarbellSvg/)
 assert.doesNotMatch(sheetSource, /pphtChatTextSvg/)
 assert.match(iconsSource, /export const pphtCheckSvg/)
})

test('mobile app shell renders bottom navigation from grouped shell tab view items instead of raw tab models', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /import \{ getBottomTabViewItems \} from '\.\/src\/screens\/shell-view-models\.js';/)
 assert.match(appSource, /const bottomTabModels = useMemo\(\(\) => getTabButtonModels\(\{ tabs: mobileTabs, activeKey: activeTab \}\), \[activeTab\]\);/)
 assert.match(appSource, /const bottomTabViewItems = useMemo\(\(\) => getBottomTabViewItems\(bottomTabModels\), \[bottomTabModels\]\);/)
 assert.match(appSource, /renderAppShell\(\{[\s\S]*bottomTabs: bottomTabViewItems,[\s\S]*\}\)/)
 assert.doesNotMatch(appSource, /renderAppShell\(\{[\s\S]*bottomTabs: bottomTabModels,[\s\S]*\}\)/)
})

test('mobile app shell can hydrate a selected program into the shared program sheet from the profile programs list', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )
 const detailHandler = extractFunctionBlock(appSource, 'function handleOpenProgramDetail(program, sourceSurface = null)')
 const closeHandler = extractFunctionBlock(appSource, 'function handleCloseProgramSheet()')

 assert.match(appSource, /const \[selectedProgramPreview, setSelectedProgramPreview\] = useState\(null\);/)
 assert.match(appSource, /const \[programSheetReturnSurface, setProgramSheetReturnSurface\] = useState\(null\);/)
 assert.match(appSource, /const programSheetModel = useMemo\(\(\) => getProgramSheetModel\(selectedProgramPreview \|\| trainState\), \[selectedProgramPreview, trainState\]\);/)
 assert.match(appSource, /open-program-selection\.js/)
 assert.match(detailHandler, /orchestrateOpenProgramSheet\(\{/)
 assert.match(detailHandler, /sourceSurface,/)
 assert.match(detailHandler, /closeProfileView: \(\) => setIsProfileViewOpen\(false\),/)
 assert.match(detailHandler, /programSheetClient,/)
 assert.match(detailHandler, /setProgramSheetReturnSurface,/)
 assert.match(detailHandler, /setSelectedProgramPreview,/)
 assert.match(detailHandler, /setIsProgramSheetOpen,/)
 assert.doesNotMatch(detailHandler, /programSheetClient\?\.getProgramById\?\.\(/)
 assert.match(appSource, /onClose: handleCloseProgramSheet/)
 assert.match(appSource, /onOpenProgramDetail=\{\(program\) => handleOpenProgramDetail\(program, 'profile-view'\)\}/)
 assert.match(closeHandler, /orchestrateCloseProgramSheet\(\{[\s\S]*programSheetReturnSurface,[\s\S]*setIsProgramSheetOpen,[\s\S]*setIsProfileViewOpen,[\s\S]*setProgramSheetReturnSurface,[\s\S]*setSelectedProgramPreview,[\s\S]*/)
 assert.doesNotMatch(closeHandler, /setProgramSheetReturnSurface\(null\)|setSelectedProgramPreview\(null\)/)
})

test('mobile app shell can open the selected-date workout into the workout detail sheet using the program workout id', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )
 const shellRenderersSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'),
   'utf8'
 )

 assert.match(appSource, /import \{ useEffect, useLayoutEffect, useMemo, useRef, useState \} from 'react';/)
 assert.match(appSource, /import \{ findSessionSet \} from '\.\.\/\.\.\/packages\/core\/src\/index\.js';/)
 assert.doesNotMatch(appSource, /const selectedSet = session\.activeRestTimer\s*\?\s*findSessionSet\([\s\S]*from '@pplus\/core';/)
 assert.match(appSource, /const \[coachMetricError, setCoachMetricError\] = useState\(''\);[\s\S]*const optimisticSessionMutationRef = useRef\(0\);/)
 assert.match(appSource, /import \{ createSessionPersistenceController \} from '\.\/src\/train\/session-persistence\.js';/)
 assert.match(appSource, /const \{[\s\S]*persistSessionUpdate,[\s\S]*persistSessionUpdateOptimistic,[\s\S]*persistSessionDeletionOptimistic,[\s\S]*\} = createSessionPersistenceController\(\{[\s\S]*effectiveSessionStore,[\s\S]*setSession,[\s\S]*optimisticSessionMutationRef,[\s\S]*getSessionDebugSummary,[\s\S]*\}\);/)
 assert.match(appSource, /const \[postSetEffortAdjustment, setPostSetEffortAdjustment\] = useState\(null\);/)
 assert.match(appSource, /import \{[\s\S]*orchestrateCompleteSet,[\s\S]*orchestrateExerciseRestTimeChange,[\s\S]*orchestratePostSetEffortChange,[\s\S]*orchestrateRemoveExerciseRestTime,[\s\S]*orchestrateWorkoutNotesChange,[\s\S]*orchestrateWorkoutSettingsChange,[\s\S]*\} from '\.\/src\/train\/active-workout-mutations\.js';/)
 assert.match(appSource, /canFinishWorkoutSession/)
 assert.match(appSource, /const canFinishActiveWorkout = useMemo\(\(\) => canFinishWorkoutSession\(session\), \[session\]\);/)
 assert.doesNotMatch(appSource, /function persistSessionDeletionOptimistic\(nextSession, \{ setId = null, exerciseId = null \} = \{\}\) \{/)

 const completeHandler = extractFunctionBlock(appSource, 'async function handleCompleteSet(exerciseId, setId)')
 const postSetEffortHandler = extractFunctionBlock(appSource, 'async function handlePostSetEffortChange(nextEffort)')
 const closeEffortHandler = extractFunctionBlock(appSource, 'function handleClosePostSetEffortAdjustment()')
 const setValueHandler = extractFunctionBlock(appSource, 'async function handleSessionSetValueChange(exerciseId, setId, field, nextValue)')
 const addSetHandler = extractFunctionBlock(appSource, 'async function handleAddSessionSet(exerciseId)')
 const deleteSetHandler = extractFunctionBlock(appSource, 'async function handleDeleteSessionSet(exerciseId, setId)')
 const deleteExerciseHandler = extractFunctionBlock(appSource, 'async function handleDeleteSessionExercise(exerciseId)')
 const moveExerciseHandler = extractFunctionBlock(appSource, 'async function handleMoveActiveWorkoutExercise(exerciseId, direction)')
 const restTimeHandler = extractFunctionBlock(appSource, 'async function handleExerciseRestTimeChange(exerciseId, nextRestSeconds)')
 const removeRestHandler = extractFunctionBlock(appSource, 'async function handleRemoveExerciseRestTime(exerciseId)')
 const addExercisesHandler = extractFunctionBlock(appSource, 'async function handleAddExercisesToSession(exerciseIds)')
 const notesHandler = extractFunctionBlock(appSource, 'async function handleWorkoutNotesChange(nextNotes)')
 const settingsHandler = extractFunctionBlock(appSource, 'async function handleWorkoutSettingsChange(settingsPatch)')
 const finishWorkoutHandler = extractFunctionBlock(appSource, 'async function handleFinishWorkout(completionPayload = {})')
 const discardWorkoutHandler = extractFunctionBlock(appSource, 'async function handleDiscardWorkout()')

 assert.match(completeHandler, /orchestrateCompleteSet\(\{/)
 assert.doesNotMatch(completeHandler, /completeWorkoutSessionSet\(/)
 assert.match(postSetEffortHandler, /orchestratePostSetEffortChange\(\{/)
 assert.match(closeEffortHandler, /orchestrateClosePostSetEffortAdjustment\(\{/)
 assert.match(setValueHandler, /orchestrateSessionSetValueChange\(\{/)
 assert.match(addSetHandler, /orchestrateAddSessionSet\(\{/)
 assert.match(deleteSetHandler, /orchestrateDeleteSessionSet\(\{/)
 assert.match(deleteExerciseHandler, /orchestrateDeleteSessionExercise\(\{/)
 assert.match(moveExerciseHandler, /orchestrateMoveActiveWorkoutExercise\(\{/)
 assert.match(restTimeHandler, /orchestrateExerciseRestTimeChange\(\{/)
 assert.match(removeRestHandler, /orchestrateRemoveExerciseRestTime\(\{/)
 assert.match(addExercisesHandler, /orchestrateAddExercisesToSession\(\{/)
 assert.match(notesHandler, /orchestrateWorkoutNotesChange\(\{/)
 assert.match(settingsHandler, /orchestrateWorkoutSettingsChange\(\{/)
 assert.match(finishWorkoutHandler, /orchestrateFinishWorkout\(\{/)
 assert.match(finishWorkoutHandler, /setPostSetEffortAdjustment/)
 assert.match(finishWorkoutHandler, /setSelectedWorkoutSessionPreview/)
 assert.match(finishWorkoutHandler, /setIsActiveWorkoutViewOpen/)
 assert.match(finishWorkoutHandler, /setActiveTrainTab/)
 assert.match(discardWorkoutHandler, /orchestrateDiscardWorkout\(\{/)

 assert.match(appSource, /const selectedProgramWorkoutId = workoutModel\?\.actionPayload\?\.programWorkoutId \|\| selectedDayWorkoutPreview\?\.programWorkoutId \|\| selectedDayWorkoutPreview\?\.id \|\| null;/)
 assert.match(appSource, /const selectedDayWorkoutPreview = trainState\.program\.calendarWeek\.find\(\(day\) => day\.id === selectedCalendarDayId\)\?\.workoutPreview \|\| null;/)
 assert.match(appSource, /const \[elapsedSecondsNow, setElapsedSecondsNow\] = useState\(\(\) => Date\.now\(\)\);/)
 assert.match(appSource, /import \{[\s\S]*resolveIncomingSession,[\s\S]*\} from '\.\/src\/train\/session-orchestration\.js';/)
 assert.match(appSource, /import \{ getSessionDebugSummary, logResolvedIncomingSession \} from '\.\/src\/train\/session-diagnostics\.js';/)
  assert.match(appSource, /async function handleStartWorkoutFromSheet\(payload = null\) \{[\s\S]*await orchestrateStartWorkoutFromSheet\(\{[\s\S]*effectiveSessionStore,[\s\S]*selectedProgramWorkoutId: payload\?\.programWorkoutId \|\| selectedProgramWorkoutId,[\s\S]*session,[\s\S]*selectedWorkoutSessionPreview,[\s\S]*workoutSheetModel,[\s\S]*startedAt: new Date\(\)\.toISOString\(\),[\s\S]*setIsStartingWorkout,[\s\S]*setSession,[\s\S]*setIsWorkoutSheetOpen,[\s\S]*setIsActiveWorkoutViewOpen,[\s\S]*\}\);[\s\S]*\}/)
assert.doesNotMatch(appSource, /async function handleStartWorkoutFromSheet\(payload = null\) \{[\s\S]*runAfterInteractions: InteractionManager\.runAfterInteractions/)
assert.match(appSource, /const floatingStartWorkoutButtonModel = useMemo\(\(\) => \{[\s\S]*if \(activeTab !== 'train'\) return null/)
assert.match(appSource, /if \(session\?\.status === 'in_progress'\) \{[\s\S]*kind: 'in-progress'/)
assert.match(appSource, /label: session\?\.nameSnapshot \|\| session\?\.name \|\| 'Workout in progress'/)
assert.match(appSource, /elapsedLabel: formatWorkoutTimer\(elapsedSeconds\)/)
assert.match(appSource, /targetKey: 'start-workout'/)
assert.match(appSource, /actionPayload: \{[\s\S]*programWorkoutId: inProgressProgramWorkoutId,[\s\S]*\}/)
assert.doesNotMatch(appSource, /actionPayload: \{[\s\S]*selectedDayId: inProgressSelectedDayId,[\s\S]*programWorkoutId: inProgressProgramWorkoutId,[\s\S]*\}/)
assert.match(appSource, /if \(!workoutModel\.hasWorkoutData\) return null/)
assert.match(appSource, /kind: 'start-workout',[\s\S]*label: 'Start Workout',[\s\S]*targetKey: 'start-workout',[\s\S]*actionPayload: undefined/)
assert.match(appSource, /if \(targetKey === 'start-workout'\) \{[\s\S]*await handleStartWorkoutFromSheet\(payload\);[\s\S]*return;[\s\S]*\}/)
assert.match(appSource, /if \(targetKey === 'session'\) \{[\s\S]*await handleOpenOrResumeSession\(payload\);[\s\S]*return;[\s\S]*\}/)
assert.doesNotMatch(appSource, /if \(session\?\.status === 'in_progress'\) \{[\s\S]*targetKey: 'session'/)
assert.match(appSource, /renderAppShell\(\{[\s\S]*floatingStartWorkoutButton: floatingStartWorkoutButtonModel,[\s\S]*\}\)/)
assert.match(shellRenderersSource, /export function renderAppShell\([\s\S]*floatingStartWorkoutButton = null,[\s\S]*\)/)
assert.match(shellRenderersSource, /floatingStartWorkoutButton \? \([\s\S]*left: 24,[\s\S]*right: 24,[\s\S]*bottom: 96,[\s\S]*floatingStartWorkoutButton\.kind === 'in-progress'/)
assert.match(shellRenderersSource, /ChevronUp/)
assert.match(shellRenderersSource, /floatingStartWorkoutButton\.elapsedLabel/)
assert.match(shellRenderersSource, /floatingStartWorkoutButton\.kind === 'in-progress' \?[\s\S]*backgroundColor: styles\.theme\.accentSurface/)
assert.doesNotMatch(shellRenderersSource, /floatingStartWorkoutButton\.kind === 'in-progress' \?[\s\S]*backgroundColor: styles\.theme\.accent,[\s\S]*ChevronUp color=\{styles\.theme\.accentText\}[\s\S]*color: styles\.theme\.accentText/)
assert.match(shellRenderersSource, /<AppButton[\s\S]*label=\{floatingStartWorkoutButton\.label\}/)
 assert.match(appSource, /useEffect\(\(\) => \{[\s\S]*session\?\.status !== 'in_progress'[\s\S]*setElapsedSecondsNow\(Date\.now\(\)\);[\s\S]*setInterval\(\(\) => setElapsedSecondsNow\(Date\.now\(\)\), 1000\);[\s\S]*\}, \[session\?\.status, session\?\.startedAt\]\);/)
 assert.match(appSource, /useLayoutEffect\(\(\) => \{[\s\S]*const didWorkflowContextChange = workflowContextKeyRef\.current !== nextWorkflowContextKey;[\s\S]*setSelectedCalendarDayId\(\(current\) => \{[\s\S]*!didWorkflowContextChange && nextTrainState\.program\.calendarWeek\.some\(\(day\) => day\.id === current\)[\s\S]*return current;[\s\S]*return nextTrainState\.program\.selectedCalendarDayId;[\s\S]*\}\);/)
assert.doesNotMatch(appSource, /setSelectedCalendarDayId\(nextTrainState\.program\.selectedCalendarDayId\);/)
assert.match(appSource, /if \(didWorkflowContextChange\) \{[\s\S]*setActiveTrainTab\('calendar'\);[\s\S]*setIsWorkoutSheetOpen\(false\);[\s\S]*setSelectedProgramWorkoutPreview\(null\);[\s\S]*setSelectedWorkoutSessionPreview\(null\);/)
 assert.match(appSource, /const elapsedSeconds = useMemo\(\(\) => \{[\s\S]*session\?\.status !== 'in_progress'[\s\S]*return session\?\.elapsedSeconds \?\? 0;[\s\S]*const startedAtMs = Date\.parse\(session\.startedAt\);[\s\S]*return Math\.max\(0, Math\.floor\(\(elapsedSecondsNow - startedAtMs\) \/ 1000\)\);[\s\S]*\}, \[elapsedSecondsNow, session\?\.elapsedSeconds, session\?\.startedAt, session\?\.status\]\);/)
 assert.match(appSource, /useEffect\(\(\) => \{[\s\S]*if \(!session\?\.activeRestTimer\?\.isRunning\) return undefined;[\s\S]*setInterval\(\(\) => \{[\s\S]*adjustRestTimer\(currentSession, -1\)/)
  assert.match(appSource, /async function handleAdjustRestTimer\(delta\) \{[\s\S]*await orchestrateAdjustRestTimer\(\{[\s\S]*session,[\s\S]*delta,[\s\S]*persistSessionUpdateOptimistic,[\s\S]*\}\);[\s\S]*\}/)
  assert.match(appSource, /async function handleDismissRestTimer\(\) \{[\s\S]*await orchestrateDismissRestTimer\(\{[\s\S]*session,[\s\S]*persistSessionUpdateOptimistic,[\s\S]*\}\);[\s\S]*\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onAdjustRestTimer=\{handleAdjustRestTimer\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onDismissRestTimer=\{handleDismissRestTimer\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onAddSet=\{handleAddSessionSet\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onDeleteSet=\{handleDeleteSessionSet\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onDeleteExercise=\{handleDeleteSessionExercise\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onMoveExercise=\{handleMoveActiveWorkoutExercise\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onOpenExerciseDetail=\{\(exercise\) => handleOpenExerciseDetail\(exercise, 'active-workout'\)\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onExerciseRestTimeChange=\{handleExerciseRestTimeChange\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onRemoveExerciseRestTime=\{handleRemoveExerciseRestTime\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onAddExercises=\{handleAddExercisesToSession\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*availableExercises=\{activeWorkoutAvailableExercises\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*isLoadingAvailableExercises=\{isActiveWorkoutExercisesLoading\}/)
  assert.match(appSource, /<ActiveWorkoutView[\s\S]*onFinish=\{handleFinishWorkout\}/)
  assert.match(appSource, /<ActiveWorkoutView[\s\S]*onDiscard=\{handleDiscardWorkout\}/)
  assert.match(appSource, /<ActiveWorkoutView[\s\S]*canFinishWorkout=\{canFinishActiveWorkout\}/)
assert.match(appSource, /<ActiveWorkoutView[\s\S]*postSetEffortAdjustment=\{postSetEffortAdjustment\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onPostSetEffortChange=\{handlePostSetEffortChange\}/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onClosePostSetEffortAdjustment=\{handleClosePostSetEffortAdjustment\}/)
  assert.match(appSource, /<ActiveWorkoutView[\s\S]*onWorkoutNotesChange=\{handleWorkoutNotesChange\}/)
  assert.match(appSource, /<ActiveWorkoutView[\s\S]*onUpdateWorkoutSettings=\{handleWorkoutSettingsChange\}/)
assert.match(appSource, /import \{ deriveWorkoutOpenRequestContext \} from '\.\/src\/train\/workout-open-request-context\.js';/)
assert.match(appSource, /const \{[\s\S]*requestedCalendarDayId,[\s\S]*requestedDayWorkoutPreview,[\s\S]*requestedProgramWorkoutId,[\s\S]*\} = deriveWorkoutOpenRequestContext\(\{[\s\S]*payload,[\s\S]*selectedCalendarDayId,[\s\S]*selectedProgramWorkoutId,[\s\S]*trainState,[\s\S]*\}\);/)
assert.match(appSource, /if \(targetKey === 'workout'\) \{[\s\S]*const \{[\s\S]*requestedCalendarDayId,[\s\S]*requestedDayWorkoutPreview,[\s\S]*requestedProgramWorkoutId,[\s\S]*immediateProgramWorkout,[\s\S]*workoutOpenRequestContext,[\s\S]*\} = deriveWorkoutOpenRequestContext\(\{[\s\S]*payload,[\s\S]*selectedCalendarDayId,[\s\S]*selectedProgramWorkoutId,[\s\S]*trainState,[\s\S]*\}\);[\s\S]*await orchestrateWorkoutOpen\(\{[\s\S]*targetKey,[\s\S]*payload,[\s\S]*selectedCalendarDayId,[\s\S]*selectedProgramWorkoutId,[\s\S]*workoutOpenRequestContext:[\s\S]*requestedProgramWorkoutId,[\s\S]*immediateProgramWorkout,[\s\S]*effectiveSessionStore,[\s\S]*workoutClient: createMobileWorkoutClient\(\{ accessToken: authSession\.accessToken \}\),[\s\S]*session,[\s\S]*trainState,[\s\S]*selectedWorkoutSessionPreview,[\s\S]*setIsWorkoutSheetOpen,[\s\S]*setSelectedProgramWorkoutPreview,[\s\S]*setSelectedWorkoutSessionPreview,[\s\S]*\}\);[\s\S]*return;[\s\S]*\}/)
assert.doesNotMatch(appSource, /if \(targetKey === 'workout'\) \{[\s\S]*const immediateProgramWorkout = buildImmediateWorkoutSheetPreview\(/)
assert.doesNotMatch(appSource, /if \(targetKey === 'workout'\) \{[\s\S]*applyWorkoutOpenStateTransition\(\{[\s\S]*immediateProgramWorkout/)
assert.doesNotMatch(appSource, /if \(targetKey === 'workout'\) \{[\s\S]*const previewSession = createWorkoutSession\(\{ programWorkout: immediateProgramWorkout, startedAt: new Date\(\)\.toISOString\(\) \}\)[\s\S]*setSelectedWorkoutSessionPreview\(previewSession\)/)
assert.doesNotMatch(appSource, /if \(targetKey === 'workout'\) \{[\s\S]*const previewSession = createWorkoutSession\(\{ programWorkout: selectedWorkout, startedAt: new Date\(\)\.toISOString\(\) \}\)[\s\S]*setSelectedWorkoutSessionPreview\(previewSession\)/)
})

test('mobile app shell passes completed-session history into the workout completed recap model', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /const progressSessions = useMemo\(/)
 assert.match(appSource, /session\.status === 'completed'/)
 assert.match(appSource, /trainState\.completedSessions/)
 assert.match(appSource, /\.\.\.trainState\.completedSessions, session/)
 assert.match(appSource, /const exerciseDetailViewModel = useMemo\(\(\) => getExerciseDetailViewModel\(\{ exercise: selectedExercise, sessions: progressSessions \}\), \[progressSessions, selectedExercise\]\);/)
 assert.ok(appSource.indexOf('const progressSessions = useMemo(') < appSource.indexOf('const exerciseDetailViewModel = useMemo('))
 assert.match(appSource, /const completedSessionModel = useMemo\(/)
 assert.match(appSource, /getCompletedSessionSurfaceModel\(session, \{ completedSessions: progressSessions \}\)/)
 assert.doesNotMatch(appSource, /getCompletedSessionSurfaceModel\(session, \{ completedSessions: trainState\.completedSessions \}\)/)
})

test('mobile app shell also owns a dedicated training calendar screen state from the header utility icon', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /const \[isTrainingCalendarOpen, setIsTrainingCalendarOpen\] = useState\(false\);/)
 assert.match(appSource, /const trainingCalendarModel = useMemo\(/)
 assert.match(appSource, /<TrainingCalendarSheet[\s\S]*isVisible=\{isTrainingCalendarOpen\}/)
})

test('mobile app shell also owns a dedicated workout sheet state for workout previews', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /const \[isWorkoutSheetOpen, setIsWorkoutSheetOpen\] = useState\(false\);/)
 assert.match(appSource, /const workoutSheetModel = useMemo\(/)
 assert.match(appSource, /<WorkoutSheet[\s\S]*isVisible=\{isWorkoutSheetOpen\}/)
})

test('mobile app shell changes only the selected calendar day when a date chip is pressed instead of opening the workout sheet', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /if \(payload\?\.selectedDayId\) \{[\s\S]*setSelectedCalendarDayId\(payload\.selectedDayId\);[\s\S]*\}/)
 assert.match(appSource, /if \(targetKey === 'calendar-day-select'\) \{[\s\S]*return;[\s\S]*\}/)
 assert.doesNotMatch(appSource, /if \(targetKey === 'calendar-day-select'\) \{[^}]*setIsWorkoutSheetOpen\(true\)[^}]*\}/)
})

test('mobile app shell initializes session state before deriving active-workout exercise ids for runtime safety', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 const sessionIndex = appSource.indexOf("const [session, setSession] = useState(() => emptySession);")
 const activeIdsIndex = appSource.indexOf("const activeWorkoutExerciseIds = useMemo(() => new Set((session?.exercises || []).map((exercise) => exercise.exerciseId || exercise.id)), [session]);")

 assert.notEqual(sessionIndex, -1)
 assert.notEqual(activeIdsIndex, -1)
 assert.ok(sessionIndex < activeIdsIndex)
})

test('mobile app shell only forwards real uuid ownership ids into create-workout runtime calls', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /function isUuidValue\(value\) \{/)
 assert.match(appSource, /return \/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[1-5\]\[0-9a-f\]\{3\}-\[89ab\]\[0-9a-f\]\{3\}-\[0-9a-f\]\{12\}\$\/i\.test\(String\(value \|\| ''\)\);/)
})

test('mobile app shell also owns a dedicated workout edit view state that supports existing workouts and newly created planned workouts', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /const \[isWorkoutEditViewOpen, setIsWorkoutEditViewOpen\] = useState\(false\);/)
 assert.match(appSource, /const \[workoutEditReturnSurface, setWorkoutEditReturnSurface\] = useState\(null\);/)
 assert.match(appSource, /const \[workoutEditDraftModel, setWorkoutEditDraftModel\] = useState\(null\);/)
 assert.match(appSource, /const \[persistedCreatedWorkoutRows, setPersistedCreatedWorkoutRows\] = useState\(\[\]\);/)
 assert.match(appSource, /const workoutEditViewModel = useMemo\(\(\) => getWorkoutEditViewModel\(\{ workoutSheetModel, workoutDraftModel: workoutEditDraftModel \}\), \[workoutEditDraftModel, workoutSheetModel\]\);/)
 assert.match(appSource, /function handleOpenWorkoutEditView\(\) \{[\s\S]*orchestrateOpenWorkoutEditView\(\{[\s\S]*setIsWorkoutSheetOpen,[\s\S]*setIsWorkoutEditViewOpen,[\s\S]*setWorkoutEditReturnSurface,[\s\S]*nextReturnSurface: 'workout-sheet',[\s\S]*setWorkoutEditDraftModel,[\s\S]*workoutDraftModel: null,[\s\S]*\}\);[\s\S]*\}/)
 assert.match(appSource, /if \(targetKey === 'create-workout'\) \{[\s\S]*await handleCreateWorkout\(\);[\s\S]*return;[\s\S]*\}/)
 assert.match(appSource, /async function handleCreateWorkout\(\) \{[\s\S]*const relatedWorkoutCount = [\s\S]*const defaultWorkoutName = `Untitled Workout \$\{relatedWorkoutCount \+ 1\}`;/)
 assert.match(appSource, /setPersistedCreatedWorkoutRows\(\(currentRows\) => \[[\s\S]*title: createdWorkout\.nameSnapshot[\s\S]*actionPayload: \{[\s\S]*programWorkoutId: createdWorkout\.id[\s\S]*\}[\s\S]*\]\)/)
 assert.doesNotMatch(appSource, /function handleCloseWorkoutEditView\(\) \{[\s\S]*setPersistedCreatedWorkoutRows\(\[\]\)/)
 assert.match(appSource, /getTrainSurfaceModel\(\{[\s\S]*persistedWorkoutListRows: persistedCreatedWorkoutRows,[\s\S]*\}\)/)
 assert.match(appSource, /\[[\s\S]*persistedCreatedWorkoutRows[\s\S]*\]\s*\);/)
 assert.match(appSource, /async function handleCreateWorkout\(\) \{[\s\S]*const rawAthleteId = bootstrapState\.status === 'authenticated_coach'[\s\S]*const rawCoachId = trainState\.programWorkout\?\.coachId \|\| activeCoachAthleteProfile\?\.coachId \|\| null;[\s\S]*const rawProgramId = trainState\.program\.id \|\| null;[\s\S]*const athleteId = isUuidValue\(rawAthleteId\) \? rawAthleteId : null;[\s\S]*const coachId = isUuidValue\(rawCoachId\) \? rawCoachId : null;[\s\S]*const programId = isUuidValue\(rawProgramId\) \? rawProgramId : null;[\s\S]*const selectedProgramDayId = trainState\.program\.calendarWeek\.find\(\(day\) => day\.id === selectedCalendarDayId\)\?\.programDayId \|\| null;[\s\S]*nameSnapshot: defaultWorkoutName,[\s\S]*notes: '',[\s\S]*sortOrder: relatedWorkoutCount \+ 1,[\s\S]*\)[\s\S]*setSelectedProgramWorkoutPreview\([\s\S]*createdWorkout[\s\S]*\)[\s\S]*setSelectedWorkoutSessionPreview\([\s\S]*programWorkoutId: createdWorkout\.id[\s\S]*\)[\s\S]*orchestrateOpenWorkoutEditView\(\{[\s\S]*nextReturnSurface: 'train-home'[\s\S]*setWorkoutEditDraftModel,[\s\S]*workoutDraftModel: \{[\s\S]*programWorkoutId: createdWorkout\.id[\s\S]*\}[\s\S]*\}\);[\s\S]*\}/)
 assert.doesNotMatch(appSource, /if \(targetKey === 'create-workout'\) \{[\s\S]*createEmptyWorkoutEditDraftModel\(\)/)
 assert.match(appSource, /function handleCloseWorkoutEditView\(\) \{[\s\S]*orchestrateCloseWorkoutEditView\(\{[\s\S]*workoutEditReturnSurface,[\s\S]*setIsWorkoutEditViewOpen,[\s\S]*setIsWorkoutSheetOpen,[\s\S]*setWorkoutEditReturnSurface,[\s\S]*setWorkoutEditDraftModel,[\s\S]*\}\);[\s\S]*\}/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*isVisible=\{isWorkoutEditViewOpen\}/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*key=\{[^\n]*workoutEditViewModel\?\.programWorkoutId[^\n]*workoutEditViewModel\?\.title[^\n]*\}/)
 assert.match(appSource, /async function handleSaveWorkoutEdit\(draft\) \{[\s\S]*programSheetClient\?\.updateProgramWorkout\?\.\([\s\S]*programWorkoutId: workoutEditViewModel\?\.programWorkoutId \|\| workoutEditDraftModel\?\.programWorkoutId,[\s\S]*nameSnapshot: draft\?\.workoutName \|\| '',[\s\S]*notes: draft\?\.workoutNotes \|\| '',[\s\S]*\)[\s\S]*setSelectedProgramWorkoutPreview\([\s\S]*nameSnapshot: savedWorkout\.nameSnapshot[\s\S]*notes: savedWorkout\.notes[\s\S]*\)[\s\S]*setSelectedWorkoutSessionPreview\([\s\S]*nameSnapshot: savedWorkout\.nameSnapshot[\s\S]*notes: savedWorkout\.notes[\s\S]*\)[\s\S]*setWorkoutEditDraftModel\([\s\S]*title: savedWorkout\.nameSnapshot[\s\S]*workoutNotes: savedWorkout\.notes[\s\S]*\)[\s\S]*setPersistedCreatedWorkoutRows\([\s\S]*savedWorkout\.nameSnapshot[\s\S]*handleCloseWorkoutEditView\(\);[\s\S]*\}/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*onSave=\{handleSaveWorkoutEdit\}/)
 assert.doesNotMatch(appSource, /<WorkoutEditView[\s\S]*onSave=\{handleCloseWorkoutEditView\}/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*onAddExercise=\{handleOpenWorkoutEditExercisePicker\}/)
 assert.match(appSource, /async function handleOpenWorkoutEditExercisePicker\(\) \{[\s\S]*setWorkoutEditDraftModel\([\s\S]*addExerciseSheet:[\s\S]*\}[\s\S]*\);/)
 assert.match(appSource, /async function handleAddExercisesToWorkoutEdit\(exerciseIds\) \{[\s\S]*orchestrateAddExercisesToWorkoutEdit\(\{[\s\S]*programWorkoutId: workoutEditViewModel\?\.programWorkoutId \|\| workoutEditDraftModel\?\.programWorkoutId[\s\S]*programSheetClient,[\s\S]*exerciseLibraryClient,[\s\S]*setSelectedWorkoutSessionPreview,[\s\S]*setWorkoutEditDraftModel,[\s\S]*\}\);[\s\S]*\}/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*onAddExercises=\{handleAddExercisesToWorkoutEdit\}/)
 assert.match(appSource, /const \[isDeleteWorkoutModalOpen, setIsDeleteWorkoutModalOpen\] = useState\(false\);/)
 assert.match(appSource, /const \[isDeletingWorkout, setIsDeletingWorkout\] = useState\(false\);/)
 assert.match(appSource, /const \[deleteWorkoutErrorMessage, setDeleteWorkoutErrorMessage\] = useState\(''\);/)
 assert.match(appSource, /async function handleConfirmDeleteWorkout\(\) \{[\s\S]*programSheetClient\?\.deleteProgramWorkout\?\.\([\s\S]*programWorkoutId: workoutEditViewModel\?\.programWorkoutId \|\| workoutEditDraftModel\?\.programWorkoutId,[\s\S]*\)[\s\S]*handleCloseWorkoutEditView\(\)/)
 assert.match(appSource, /setPersistedCreatedWorkoutRows\(\(currentRows\) => currentRows\.filter\(\(row\) => row\.actionPayload\?\.programWorkoutId !== deletedWorkoutId\)\)/)
 assert.match(appSource, /setSelectedProgramWorkoutPreview\(\(currentWorkout\) => currentWorkout\?\.id === deletedWorkoutId \? null : currentWorkout\)/)
 assert.match(appSource, /setSelectedWorkoutSessionPreview\(\(currentSession\) => currentSession\?\.programWorkoutId === deletedWorkoutId \? null : currentSession\)/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*onOpenDeleteWorkout=\{\(\) => setIsDeleteWorkoutModalOpen\(true\)\}/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*onCloseDeleteWorkoutModal=\{\(\) => setIsDeleteWorkoutModalOpen\(false\)\}/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*onConfirmDeleteWorkout=\{handleConfirmDeleteWorkout\}/)
 assert.match(appSource, /<WorkoutEditView[\s\S]*isDeleteWorkoutModalOpen=\{isDeleteWorkoutModalOpen\}/)
})

test('mobile app shell owns a dedicated active workout view opened from the workout sheet start button', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /const \[isActiveWorkoutViewOpen, setIsActiveWorkoutViewOpen\] = useState\(false\);/)
 assert.match(appSource, /const activeWorkoutViewModel = useMemo\(/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*isVisible=\{isActiveWorkoutViewOpen\}/)
  assert.match(appSource, /<ActiveWorkoutView[\s\S]*theme=\{appTheme\}/)
  assert.match(appSource, /<ActiveWorkoutView[\s\S]*onFinish=\{handleFinishWorkout\}/)
  assert.match(appSource, /<ActiveWorkoutView[\s\S]*onClose=\{handleCloseActiveWorkout\}/)
})

test('mobile app shell preserves a rich in-progress active session when bootstrap refresh hands back a thinner copy', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /resolveIncomingSession/)
 assert.match(appSource, /logResolvedIncomingSession/)
 assert.match(appSource, /setSession\(\(currentSession\) => \{[\s\S]*resolveIncomingSession\(\{/)
 assert.match(appSource, /setSession\(\(currentSession\) => \{[\s\S]*logResolvedIncomingSession\(\{/)
 assert.doesNotMatch(appSource, /setSession\(nextSession\);/)
})

test('mobile app shell routes active workout set presses through handleCompleteSet so the same tap can reverse completion state', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /async function handleCompleteSet\(exerciseId, setId\) \{[\s\S]*await orchestrateCompleteSet\(\{/)
 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onCompleteSet=\{handleCompleteSet\}/)
})

test('mobile app shell closes the active workout cleanly without reopening the workout sheet on X', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )
 const closeHandler = extractFunctionBlock(appSource, 'async function handleCloseActiveWorkout()')

 assert.match(appSource, /<ActiveWorkoutView[\s\S]*onClose=\{handleCloseActiveWorkout\}/)
 assert.match(closeHandler, /orchestrateCloseActiveWorkout\(\{/)
 assert.doesNotMatch(closeHandler, /setIsWorkoutSheetOpen\(true\)/)
})

test('mobile app shell opens coach athletes inside a dedicated sheet from profile and bottom-right quick access instead of routing the whole shell to a progress tab screen', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )
 const sheetSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/screens/coach-athletes-sheet.js'),
   'utf8'
 )

 assert.match(appSource, /const \[isCoachAthletesSheetOpen, setIsCoachAthletesSheetOpen\] = useState\(false\);/)
 assert.match(appSource, /const coachAthletesList = useMemo\(\(\) => \{/)
 assert.match(appSource, /avatarUrl: athlete\.avatarUrl \?\? null/)
 assert.match(appSource, /function handleTabPress\(nextTab\) \{[\s\S]*if \(isCoachBootstrapState && nextTab === 'inbox'\) \{[\s\S]*setIsCoachAthletesSheetOpen\(true\);[\s\S]*return;[\s\S]*\}[\s\S]*setActiveTab\(nextTab\);[\s\S]*\}/)
 assert.match(appSource, /renderAppShell\(\{[\s\S]*onTabPress: handleTabPress,[\s\S]*\}\)/)
 assert.doesNotMatch(appSource, /if \(isCoachBootstrapState && \(nextTab === 'progress' \|\| nextTab === 'inbox'\)\)/)
 assert.match(appSource, /<CoachAthletesSheet[\s\S]*isVisible=\{isCoachAthletesSheetOpen\}/)
 assert.match(appSource, /<CoachAthletesSheet[\s\S]*athletes=\{coachAthletesList\}/)
 assert.match(appSource, /<CoachAthletesSheet[\s\S]*selectedAthleteId=\{selectedCoachAthleteId\}/)
 assert.match(appSource, /<ProfileView isVisible=\{isProfileViewOpen\}[\s\S]*onOpenAthletes=\{\(\) => setIsCoachAthletesSheetOpen\(true\)\}/)
 assert.match(sheetSource, /export function CoachAthletesSheet\(/)
 assert.match(sheetSource, /Modal/)
 assert.match(sheetSource, /Athletes/)
  assert.match(sheetSource, /AppSheetHeader/)
  assert.match(sheetSource, /AppButton/)
  assert.match(sheetSource, /AppSearchInput/)
  assert.match(sheetSource, /AppListRow/)
  assert.match(sheetSource, /Invite athlete/)
  assert.match(sheetSource, /coach-athlete-invite/)
  assert.match(sheetSource, /leftIcon=\{<Send/)
  assert.match(sheetSource, /theme=\{resolvedTheme\}[\s\S]*label="Invite athlete"[\s\S]*onPress=\{\(\) => onActionTarget\?\.\('coach-athlete-invite'\)\}/)
  assert.match(sheetSource, /Search by name/)
  assert.match(sheetSource, /Check/)
  assert.match(sheetSource, /ChevronRight/)
  assert.match(sheetSource, /Image/)
assert.doesNotMatch(sheetSource, /renderGenericSections/)
 assert.doesNotMatch(sheetSource, /<Text className="text-\[16px\] font-semibold text-white">Back<\/Text>/)
 assert.doesNotMatch(appSource, /Tony Fortugno/)
 assert.doesNotMatch(appSource, /Mia Chen/)
 assert.doesNotMatch(appSource, /Noah Bouchard/)
 assert.doesNotMatch(appSource, /No linked athletes found yet/)
})

test('mobile coach athlete selection changes the active athlete context across the app instead of opening a placeholder workspace sheet', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )
 const shellSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'),
   'utf8'
 )
 const sheetSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/screens/coach-athletes-sheet.js'),
   'utf8'
 )

 assert.match(shellSource, /import \{ Image, Pressable, ScrollView, Text, View \} from 'react-native';/)
 assert.match(shellSource, /renderProfileHeaderIcon\(styles\)[\s\S]*styles\.theme\.iconMuted/)
 assert.match(shellSource, /renderUtilityHeaderIcon\(styles\)[\s\S]*styles\.theme\.iconMuted/)
 assert.match(shellSource, /const iconColor = isActive \? styles\.theme\.text : styles\.theme\.iconMuted/)
 assert.match(shellSource, /activeAthleteSummary = null/)
 assert.match(shellSource, /activeAthleteSummary \? \(/)
 assert.match(shellSource, /activeAthleteSummary\.avatarUrl \? \(/)
 assert.match(shellSource, /<Image[\s\S]*source=\{\{ uri: activeAthleteSummary\.avatarUrl \}\}/)
 assert.doesNotMatch(shellSource, /activeAthleteSummary\.avatarUrl \? [\s\S]*: <View/)
 assert.match(shellSource, /\[activeAthleteSummary\.firstName, activeAthleteSummary\.lastName\]\.filter\(Boolean\)\.join\(' '\)/)
 assert.match(shellSource, /Viewing athlete/)
 assert.match(shellSource, /styles\.activeAthleteBannerRow/)
 assert.match(shellSource, /styles\.activeAthleteIdentity/)
 assert.match(shellSource, /styles\.activeAthleteLabelWrap/)
 assert.doesNotMatch(shellSource, /<Text className="text-\[20px\] font-bold" style=\{\{ color: styles\.theme\.text \}\}>\{activeAthleteLabel\}<\/Text>/)
 assert.doesNotMatch(shellSource, /#ffffff/)
 assert.doesNotMatch(shellSource, /#f8fafc/)
 assert.doesNotMatch(shellSource, /text-\[#6EE7B7\]/)

 assert.doesNotMatch(appSource, /const \[selectedCoachAthleteId, setSelectedCoachAthleteId\] = useState\('coach-athlete-tony'\);/)
 assert.match(appSource, /const \[selectedCoachAthleteId, setSelectedCoachAthleteId\] = useState\(null\);/)
 assert.match(appSource, /const selectedCoachAthlete = useMemo\(\(\) => \{/)
 assert.match(appSource, /const activeCoachAthleteProfile = useMemo\(\(\) => \{[\s\S]*bootstrapState\.coachAthletes\.find/)
 assert.match(appSource, /const activeCoachAthleteSummary = useMemo\(\(\) => \{[\s\S]*const selectedNameParts = String\(selectedCoachAthlete\?\.name \|\| ''\)\.trim\(\)\.split\(\/\\s\+\/\)\.filter\(Boolean\)/)
 assert.match(appSource, /const firstName = selectedNameParts\[0\] \|\| activeCoachAthleteProfile\?\.firstName \|\| ''/)
 assert.match(appSource, /const lastName = selectedNameParts\.slice\(1\)\.join\(' '\) \|\| activeCoachAthleteProfile\?\.lastName \|\| ''/)
 assert.match(appSource, /const avatarUrl = activeCoachAthleteProfile\?\.avatarUrl \|\| selectedCoachAthlete\?\.avatarUrl \|\| null/)
 assert.doesNotMatch(appSource, /const coachFallbackAthleteOptions = useMemo/)
 assert.match(appSource, /const coachAthleteOptions = useMemo\(\(\) => \{[\s\S]*if \(!bootstrapState\.coachAthletes\?\.length\) \{[\s\S]*return \[\]/)
 assert.match(appSource, /athleteProfileId: athlete\.id/)
 assert.match(appSource, /avatarUrl: athlete\.avatarUrl \?\? null/)
 assert.match(appSource, /const \[resolvedCoachAthleteDefaultId, setResolvedCoachAthleteDefaultId\] = useState\(null\);/)
 assert.match(appSource, /setSelectedCoachAthleteId\(\(current\) => \{[\s\S]*return resolvedCoachAthleteDefaultId \?\? current/)
 assert.match(appSource, /const assignedProgram = await programClient\?\.getAssignedProgramForAthlete\?\.\(athlete\.id\)/)
 assert.match(appSource, /setResolvedCoachAthleteDefaultId\(`coach-athlete-\$\{athlete\.id\}`\)/)
 assert.match(sheetSource, /onPress=\{\(\) => onPress\?\.\('coach-athlete-select', \{ athleteId: athlete\.athleteId \?\? athlete\.id \}\)\}/)
 assert.match(sheetSource, /function CoachAthleteRow\([\s\S]*isSelected = false[\s\S]*\)/)
 assert.match(sheetSource, /const trailing = isSelected[\s\S]*<Check color=\{theme\.accent\} size=\{20\} strokeWidth=\{2\.6\} \/>[\s\S]*<ChevronRight color=\{theme\.iconMuted\} size=\{20\} strokeWidth=\{2\.2\} \/>/)
 assert.match(sheetSource, /<AppListRow[\s\S]*trailing=\{trailing\}/)
 assert.match(sheetSource, /isSelected=\{selectedAthleteId === \(athlete\.athleteId \?\? athlete\.id\)\}/)
 assert.match(appSource, /if \(targetKey === 'coach-athlete-select'\) \{[\s\S]*orchestrateCoachAthleteSelect\(\{[\s\S]*payload,[\s\S]*selectedCoachAthleteId,[\s\S]*setSelectedCoachAthleteId,[\s\S]*setIsCoachAthletesSheetOpen,[\s\S]*setIsCoachAthleteWorkspaceOpen,[\s\S]*setCoachMetricNotice,[\s\S]*setCoachMetricError,[\s\S]*\}\);[\s\S]*return;[\s\S]*\}/)
 assert.doesNotMatch(appSource, /if \(targetKey === 'coach-athlete-select'\) \{[\s\S]*setIsCoachAthleteWorkspaceOpen\(true\);/)
 assert.match(appSource, /renderAppShell\(\{[\s\S]*activeAthleteSummary: isCoachBootstrapState \? activeCoachAthleteSummary : null,/)
})


test('mobile coach progress keeps the built analytics view instead of replacing it with an empty coach override screen', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )
 const renderModelsSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/screens/app-render-models.js'),
   'utf8'
 )

 assert.match(appSource, /if \(!isCoachBootstrapState \|\| activeTab === 'train' \|\| activeTab === 'progress'\) \{[\s\S]*return null;[\s\S]*\}/)
 assert.doesNotMatch(appSource, /if \(activeTab === 'progress'\) \{[\s\S]*getPlaceholderSurfaceModel\('Athletes'/)
 assert.doesNotMatch(appSource, /if \(activeTab === 'progress' && coachAthleteOptions\.length\) \{[\s\S]*type: 'coach-athletes'/)
 assert.match(renderModelsSource, /if \(activeTab === 'progress'\) \{[\s\S]*type: 'analytics'/)
 assert.doesNotMatch(appSource, /title: 'Coach workflow'/)
})


test('mobile app shell limits authenticated athletes to progress-first visibility instead of broad coach-side surfaces', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )

 assert.match(appSource, /const isRuntimeTrainHomeVerificationEnabled = process\.env\.EXPO_PUBLIC_PPLUS_RUNTIME_SURFACE_OVERRIDE === 'authenticated_train_home';/)
 assert.match(appSource, /const isAthleteLimitedState = !isRuntimeTrainHomeVerificationEnabled && !isCoachBootstrapState && \(effectiveBootstrapState\.status === 'authenticated' \|\| effectiveBootstrapState\.status === 'authenticated_no_workout'\);/)
 assert.match(appSource, /if \(isAthleteLimitedState\) \{[\s\S]*setActiveTab\('progress'\);[\s\S]*\}/)
 assert.match(appSource, /const athleteLimitedPlaceholderModel = useMemo\(/)
 assert.match(appSource, /getPlaceholderSurfaceModel\('Progress only', 'Athletes only see their own progress metrics here\./)
 assert.match(appSource, /const athleteLimitedOverrideScreen = useMemo\([\s\S]*getPlaceholderSections\(athleteLimitedPlaceholderModel\)/)
 assert.match(appSource, /overrideScreen: effectiveBootstrapState\.status === 'signed_out' \|\| \(isAuthPreviewEnabled && \(authPreviewState === 'sign_in' \|\| authPreviewState === 'sign_up'\)\)[\s\S]*\? authScreenModel[\s\S]*: isAthleteLimitedState && activeTab !== 'progress'[\s\S]*\? athleteLimitedOverrideScreen/)
 assert.doesNotMatch(appSource, /const isAthleteLimitedState = !isCoachBootstrapState && \(effectiveBootstrapState\.status === 'authenticated' \|\| effectiveBootstrapState\.status === 'authenticated_no_workout'\);/)
})

test('mobile coach athlete quick button replaces chat/inbox utility copy with athlete selection access', () => {
  const shellSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')
  const tabsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/index.js'), 'utf8')

  assert.match(shellSource, /Users color=\{iconColor\} size=\{22\} strokeWidth=\{2\.2\} \/>/)
  assert.doesNotMatch(shellSource, /MessageCircle color=\{iconColor\} size=\{22\} strokeWidth=\{2\.2\} \/>/)
  assert.match(tabsSource, /\{ key: 'inbox', label: 'Athletes' \}/)
  assert.doesNotMatch(tabsSource, /\{ key: 'inbox', label: 'Inbox' \}/)
})

test('mobile bottom nav renders one four-option bar and keeps athletes as the far-right entry without a detached utility button', () => {
 const shellSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')
 const stylesSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/styles.js'), 'utf8')
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

 assert.match(shellSource, /tabViewItems\.tabs\.map\(\(tab\) => \(/)
 assert.doesNotMatch(shellSource, /tabViewItems\.primaryTabs\.map\(\(tab\) => \(/)
 assert.doesNotMatch(shellSource, /tabViewItems\.utilityTab/)
 assert.match(shellSource, /if \(tabKey === 'inbox'\) \{[\s\S]*return <Contact color=\{iconColor\} size=\{22\} strokeWidth=\{2\.2\} \/>/)
 assert.match(shellSource, /if \(tabKey === 'team'\) \{[\s\S]*return <Users color=\{iconColor\} size=\{22\} strokeWidth=\{2\.2\} \/>/)
 assert.match(stylesSource, /bottomNavWrap:\s*\{[\s\S]*left: 24,[\s\S]*right: 24,[\s\S]*bottom: 16,[\s\S]*alignItems: 'stretch',[\s\S]*gap: 12,/)
 assert.match(stylesSource, /bottomNavMainPill:\s*\{[\s\S]*justifyContent: 'space-between'/)
 assert.doesNotMatch(stylesSource, /bottomNavUtilityButton:\s*\{/)
 assert.doesNotMatch(stylesSource, /bottomNavUtilityButtonActive:\s*\{/)
 assert.match(appSource, /function handleTabPress\(nextTab\) \{[\s\S]*if \(isCoachBootstrapState && nextTab === 'inbox'\) \{[\s\S]*setIsCoachAthletesSheetOpen\(true\);[\s\S]*return;[\s\S]*\}[\s\S]*setActiveTab\(nextTab\);[\s\S]*\}/)
})

test('mobile today workout card removes the inner Open workout button and reuses the same workout-open seam through the whole card press surface', () => {
 const cardsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/ui/cards.js'), 'utf8')
 const renderersSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/renderers.js'), 'utf8')
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
 const todayCardSource = cardsSource.match(/function TodaySummaryCard\([\s\S]*?\n\}/)?.[0] || ''

 assert.match(todayCardSource, /<AppSurfaceCard theme=\{theme\} onPress=\{onAction\}[\s\S]*>/)
 assert.doesNotMatch(todayCardSource, /<AppButton theme=\{theme\} label=\{actionLabel\} onPress=\{onAction\} \/>/)
 assert.doesNotMatch(todayCardSource, /\{statusLabel \? <Text className=\"text-\[14px\] font-semibold\" style=\{\{ color: theme\.accent \}\}>\{statusLabel\}<\/Text> : null\}/)
 assert.match(todayCardSource, /\{hasStatusBadge \? \([\s\S]*<AppStatusBadge[\s\S]*label=\{statusLabel\}/)
 assert.match(renderersSource, /<SurfaceCard[\s\S]*onAction=\{onActionTarget \? \(\) => onActionTarget\(section\.targetKey, section\.actionPayload\) : undefined\}/)
 assert.match(appSource, /if \(targetKey === 'workout'\) \{[\s\S]*await orchestrateWorkoutOpen\(\{[\s\S]*targetKey,[\s\S]*payload,[\s\S]*selectedCalendarDayId,[\s\S]*selectedProgramWorkoutId,[\s\S]*\}\);[\s\S]*return;[\s\S]*\}/)
})

test('mobile coach train home can derive athlete-scoped train state from the selected coach athlete instead of falling back to a static demo week', () => {
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

 assert.match(appSource, /const \{ authSession, bootstrapState, sessionStore, signInWithPassword,[\s\S]*refreshAuthSession,[\s\S]*createCoachBodyMetricLog,[\s\S]*getLatestCoachBodyMetricLog \} = useMobileAuthSession\(\);/)
 assert.match(appSource, /const \[coachTrainBridgeState, setCoachTrainBridgeState\] = useState\(\{ trainState: null, sessionStore: null, isHydrating: false, hasResolved: false \}\);/)
 assert.match(appSource, /import \{ hydrateCoachTrainBridge \} from '\.\/src\/train\/coach-train-bridge\.js';/)
 assert.match(appSource, /const nextCoachTrainBridgeState = await hydrateCoachTrainBridge\(\{[\s\S]*athleteId: activeCoachAthleteProfile\.id,[\s\S]*currentUserId: authSession\.currentUserId,[\s\S]*accessToken: authSession\.accessToken,[\s\S]*accessTokenProvider: \(\) => authSession\.accessToken,[\s\S]*refreshAccessToken: refreshAuthSession,[\s\S]*programClient: createMobileProgramClient\(\{ accessToken: authSession\.accessToken \}\),[\s\S]*workoutClient: createMobileWorkoutClient\(\{ accessToken: authSession\.accessToken \}\),[\s\S]*\}\)/)
 assert.match(appSource, /setCoachTrainBridgeState\(\{[\s\S]*\.\.\.nextCoachTrainBridgeState,[\s\S]*isHydrating: false,[\s\S]*hasResolved: true,[\s\S]*\}\)/)
 assert.doesNotMatch(appSource, /const seededCoachTrainState = assignedProgram\?\.id[\s\S]*createAssignedProgramTrainState\(\{ assignedProgram, programWorkout: todayProgramWorkout, todayIsoDate \}\)/)
 assert.doesNotMatch(appSource, /const resolvedProgramWorkoutId = seededCoachTrainState\?\.programWorkout\?\.id \|\| todayProgramWorkout\?\.id \|\| getAssignedProgramWorkoutIdForDate\(assignedProgram, todayIsoDate\)/)
 assert.doesNotMatch(appSource, /createMobileWorkoutClient\(\)\?\.getInProgressSessionByProgramWorkoutId\?\.\(resolvedProgramWorkoutId\)/)
 assert.doesNotMatch(appSource, /coach-train-bridge\.program-resolution/)
 assert.match(appSource, /const effectiveRemoteTrainState = bootstrapState\.status === 'authenticated_coach'[\s\S]*coachTrainBridgeState\.trainState[\s\S]*: bootstrapState\.trainState/)
 assert.match(appSource, /const effectiveSessionStore = bootstrapState\.status === 'authenticated_coach'[\s\S]*coachTrainBridgeState\.sessionStore[\s\S]*: sessionStore/)
})

test('mobile coach workspace wires a first real coach-side body metric write seam', () => {
 const appSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/App.js'),
   'utf8'
 )
 const workspaceSheetSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/screens/coach-athlete-workspace-sheet.js'),
   'utf8'
 )
 const providerSource = readFileSync(
   resolve(process.cwd(), 'apps/mobile/src/auth/session-provider.js'),
   'utf8'
 )

 assert.match(appSource, /createCoachBodyMetricLog/)
 assert.match(appSource, /import \{[\s\S]*orchestrateSaveCoachReadinessMetric,[\s\S]*\} from '\.\/src\/auth\/auth-profile-actions\.js';/)
 assert.match(appSource, /const \[isCoachMetricSaving, setIsCoachMetricSaving\] = useState\(false\);/)
 assert.match(appSource, /const \[coachMetricNotice, setCoachMetricNotice\] = useState\(''\);/)
 assert.match(appSource, /const \[coachMetricError, setCoachMetricError\] = useState\(''\);/)
 assert.match(appSource, /async function handleSaveCoachReadinessMetric\(\) \{[\s\S]*await orchestrateSaveCoachReadinessMetric\(\{[\s\S]*selectedCoachAthlete: coachWorkspaceAthlete,[\s\S]*createCoachBodyMetricLog,[\s\S]*setCoachMetricNotice,[\s\S]*setCoachMetricError,[\s\S]*setIsCoachMetricSaving,[\s\S]*\}\);[\s\S]*\}/)
 assert.match(appSource, /<CoachAthleteWorkspaceSheet[\s\S]*selectedAthlete=\{coachWorkspaceAthlete\}[\s\S]*readinessDraft=\{coachReadinessDraft\}[\s\S]*onChangeReadinessDraft=\{setCoachReadinessDraft\}[\s\S]*onSaveReadinessMetric=\{handleSaveCoachReadinessMetric\}[\s\S]*isSavingMetric=\{isCoachMetricSaving\}[\s\S]*saveNotice=\{coachMetricNotice\}[\s\S]*saveErrorMessage=\{coachMetricError\}/)
 assert.match(workspaceSheetSource, /Save readiness snapshot/)
 assert.match(workspaceSheetSource, /Backend athlete link required before this save can go live\./)
 assert.match(workspaceSheetSource, /disabled=\{isSaveDisabled\}/)
 assert.match(providerSource, /async createCoachBodyMetricLog\(\{ athleteId, metricType, value, unit = null, recordedAt = null, source = 'coach_workspace', notes = '', progressPhotoUrl = null } = \{\}\) \{[\s\S]*identityClient\.createBodyMetricLog\(/)
})

test('mobile coach workspace lets the coach enter a real readiness percentage and note instead of saving the old canned snapshot values', () => {
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
 const workspaceSheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/coach-athlete-workspace-sheet.js'), 'utf8')

 assert.match(appSource, /const \[coachReadinessDraft, setCoachReadinessDraft\] = useState\(\{ percent: '', note: '' \}\);/)
 assert.match(appSource, /const coachWorkspaceAthlete = useMemo\(\(\) => \{[\s\S]*readinessPercent: coachReadinessDraft\.percent === '' \? null : Number\(coachReadinessDraft\.percent\),[\s\S]*nextActionLabel: coachReadinessDraft\.note\.trim\(\) \|\| ''/)
 assert.match(appSource, /setCoachReadinessDraft\(\{ percent: '', note: '' \}\)/)
 assert.match(appSource, /<CoachAthleteWorkspaceSheet[\s\S]*selectedAthlete=\{coachWorkspaceAthlete\}[\s\S]*readinessDraft=\{coachReadinessDraft\}[\s\S]*onChangeReadinessDraft=\{setCoachReadinessDraft\}/)
 assert.doesNotMatch(appSource, /readinessPercent: 82/)
 assert.doesNotMatch(appSource, /nextActionLabel: 'Next action: save readiness snapshot'/)
 assert.match(workspaceSheetSource, /readinessDraft = \{ percent: '', note: '' \}/)
 assert.match(workspaceSheetSource, /onChangeReadinessDraft = \(\) => \{\}/)
 assert.match(workspaceSheetSource, /Readiness percentage/)
 assert.match(workspaceSheetSource, /TextInput/)
 assert.match(workspaceSheetSource, /placeholder="82"/)
 assert.match(workspaceSheetSource, /placeholder="What should happen next for this athlete\?"/)
 assert.match(workspaceSheetSource, /onChangeText=\{\(nextValue\) => onChangeReadinessDraft\?\.\(\(current\) => \(\{[\s\S]*percent: nextValue\.replace\(/)
 assert.match(workspaceSheetSource, /onChangeText=\{\(nextValue\) => onChangeReadinessDraft\?\.\(\(current\) => \(\{[\s\S]*note: nextValue/)
})

test('mobile coach workspace rehydrates the latest saved readiness snapshot when returning to a selected athlete', () => {
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
 const providerSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/auth/session-provider.js'), 'utf8')
 const runtimeSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/session-runtime.js'), 'utf8')
 const identitySource = readFileSync(resolve(process.cwd(), 'packages/data/src/identity/index.js'), 'utf8')

 assert.match(identitySource, /async getLatestBodyMetricLog\(\{ athleteId, metricType, source = null \}/)
 assert.match(runtimeSource, /createSupabaseMobileIdentityClient\([\s\S]*createSupabaseRestIdentityRepository/)
 assert.match(providerSource, /async getLatestCoachBodyMetricLog\(\{ athleteId, metricType = 'readiness', source = 'coach_workspace' \} = \{\}\) \{[\s\S]*identityClient\.getLatestBodyMetricLog\(/)
 assert.match(appSource, /const \{ authSession, bootstrapState, sessionStore, signInWithPassword, signUpWithPassword, resetPasswordForEmail, signOut, refreshAuthSession, updateAuthSession, updateAthleteProfile, updateCoachProfile, createCoachBodyMetricLog, getLatestCoachBodyMetricLog \} = useMobileAuthSession\(\);/)
 assert.match(appSource, /useEffect\(\(\) => \{[\s\S]*getLatestCoachBodyMetricLog\(\{[\s\S]*athleteId: selectedCoachAthlete\.athleteProfileId,[\s\S]*metricType: 'readiness',[\s\S]*source: 'coach_workspace',[\s\S]*\}\)/)
 assert.match(appSource, /setCoachReadinessDraft\(\{ percent: '', note: '' \}\)/)
 assert.match(appSource, /percent: latestReadinessLog\?\.value != null \? String\(latestReadinessLog\.value\) : ''/)
 assert.match(appSource, /note: latestReadinessLog\?\.notes \?\? ''/)
})

test('mobile coach workspace remounts the workspace form when hydrated readiness values land so the editable inputs visibly refresh on return', () => {
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
 const workspaceSheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/coach-athlete-workspace-sheet.js'), 'utf8')

 assert.match(appSource, /const \[coachWorkspaceFormVersion, setCoachWorkspaceFormVersion\] = useState\(0\);/)
 assert.match(appSource, /setCoachReadinessDraft\(\{ percent: '', note: '' \}\)[\s\S]*setCoachWorkspaceFormVersion\(\(current\) => current \+ 1\)/)
 assert.match(appSource, /setCoachReadinessDraft\(\{[\s\S]*percent: latestReadinessLog\?\.value != null \? String\(latestReadinessLog\.value\) : '',[\s\S]*note: latestReadinessLog\?\.notes \?\? '',[\s\S]*\}\)[\s\S]*setCoachWorkspaceFormVersion\(\(current\) => current \+ 1\)/)
 assert.match(appSource, /<CoachAthleteWorkspaceSheet[\s\S]*workspaceFormVersion=\{coachWorkspaceFormVersion\}/)
 assert.match(workspaceSheetSource, /workspaceFormVersion = 0/)
 assert.match(workspaceSheetSource, /<AppSurfaceCard key=\{`\$\{workspaceFormVersion\}-readiness-form`\} theme=\{resolvedTheme\} contentClassName="gap-4 px-5 py-5">/)
 assert.match(workspaceSheetSource, /<TextInput[\s\S]*value=\{readinessDraft\.percent\}/)
 assert.match(workspaceSheetSource, /<TextInput[\s\S]*value=\{readinessDraft\.note\}/)
 assert.doesNotMatch(workspaceSheetSource, /const workspaceInputKeyPrefix = selectedAthlete\?\.athleteProfileId \|\| 'no-athlete'/)
})

test('mobile coach workspace does not duplicate the assigned-program open action when the coach already has program visibility on home', () => {
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
 const workspaceSheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/coach-athlete-workspace-sheet.js'), 'utf8')

 const closeHandler = extractFunctionBlock(appSource, 'function handleCloseProgramSheet()')

 assert.match(appSource, /function handleOpenProgramDetail\(program, sourceSurface = null\) \{[\s\S]*orchestrateOpenProgramSheet\(\{[\s\S]*program,[\s\S]*sourceSurface,[\s\S]*programSheetClient,[\s\S]*setProgramSheetReturnSurface,[\s\S]*setSelectedProgramPreview,[\s\S]*setIsProgramSheetOpen,[\s\S]*\}\);[\s\S]*\}/)
 assert.doesNotMatch(appSource, /const coachWorkspaceProgram = useMemo\(\(\) => trainState\?\.program\?\.id \? trainState\.program : null, \[trainState\]\);/)
 assert.doesNotMatch(appSource, /<CoachAthleteWorkspaceSheet[\s\S]*selectedProgram=\{coachWorkspaceProgram\}/)
 assert.doesNotMatch(appSource, /<CoachAthleteWorkspaceSheet[\s\S]*onOpenProgramDetail=\{\(program\) => handleOpenProgramDetail\(program, 'coach-athlete-workspace'\)\}/)
 assert.doesNotMatch(closeHandler, /setIsCoachAthleteWorkspaceOpen,/)
 assert.doesNotMatch(workspaceSheetSource, /selectedProgram = null/)
 assert.doesNotMatch(workspaceSheetSource, /onOpenProgramDetail = \(\) => \{\}/)
 assert.doesNotMatch(workspaceSheetSource, /Open assigned program/)
 assert.doesNotMatch(workspaceSheetSource, /disabled=\{!selectedProgram\?\.id\}/)
})

test('mobile assigned-program review can drill into a scheduled workout and return to the shared program sheet', () => {
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
 const programSheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'), 'utf8')

 assert.match(appSource, /const \[workoutSheetReturnSurface, setWorkoutSheetReturnSurface\] = useState\(null\);/)
 assert.match(appSource, /async function handleOpenProgramSheetWorkout\(workout\) \{[\s\S]*setIsProgramSheetOpen\(false\);[\s\S]*setWorkoutSheetReturnSurface\('program-sheet'\);[\s\S]*await handleTrainNavigation\('workout', \{[\s\S]*programWorkoutId: workout\.programWorkoutId,[\s\S]*selectedDayId: workout\.programDayId,[\s\S]*\}\);[\s\S]*\}/)
 assert.match(appSource, /function handleCloseWorkoutSheet\(\) \{[\s\S]*setIsWorkoutSheetOpen\(false\);[\s\S]*if \(workoutSheetReturnSurface === 'program-sheet'\) \{[\s\S]*setIsProgramSheetOpen\(true\);[\s\S]*setWorkoutSheetReturnSurface\(null\);[\s\S]*\}[\s\S]*\}/)
 assert.match(appSource, /renderProgramSheet\(\{[\s\S]*onOpenWorkoutDetail: handleOpenProgramSheetWorkout,[\s\S]*model: programSheetModel,[\s\S]*theme: appTheme,[\s\S]*\}\)/)
 assert.match(appSource, /<WorkoutSheet[\s\S]*onClose=\{handleCloseWorkoutSheet\}/)
 assert.match(programSheetSource, /function ProgramSheetWeekCard\(\{ week, theme, onOpenWorkoutDetail \}\)/)
 assert.match(programSheetSource, /<Pressable[\s\S]*onPress=\{\(\) => onOpenWorkoutDetail\?\.\(entry\)\}/)
 assert.match(programSheetSource, /export function renderProgramSheet\(\{ isVisible, onClose, onEditProgram, onOpenWorkoutDetail, model, theme \}\)/)
})

test('mobile coach train home does not render a duplicate Athlete Workspace card when program and workout cards already cover that path', () => {
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

 assert.doesNotMatch(appSource, /const coachTrainWorkspaceCard = useMemo\(\(\) => \{[\s\S]*title: 'Athlete Workspace'[\s\S]*actionLabel: 'Open athlete workspace'[\s\S]*targetKey: 'coach-athlete-workspace-open'[\s\S]*actionPayload: \{ sourceSurface: 'coach-train-home' \}/)
 assert.doesNotMatch(appSource, /const trainSurfaceModel = useMemo\([\s\S]*getTrainSurfaceModel\(\{[\s\S]*coachWorkspaceCard: isCoachBootstrapState && activeCoachAthleteProfile\?\.id \? coachTrainWorkspaceCard : null,[\s\S]*\}\)/)
})

test('mobile coach train home keeps the normal shell structure and does not replace it with a special no-workout workflow card', () => {
 const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
 const shellSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')

 assert.doesNotMatch(appSource, /const coachNoWorkoutPlaceholderModel = useMemo\(\(\) => \{[\s\S]*title: 'No workout scheduled'[\s\S]*actionLabel: 'Open athlete workspace'[\s\S]*targetKey: 'coach-athlete-workspace-open'[\s\S]*actionPayload: \{ sourceSurface: 'coach-no-workout' \}/)
 assert.doesNotMatch(appSource, /: isCoachBootstrapState && coachNoWorkoutPlaceholderModel[\s\S]*\? \{ type: 'train-bootstrap', sections: getPlaceholderSections\(coachNoWorkoutPlaceholderModel\) \}/)
 assert.match(appSource, /renderGenericSections: \(\{ sections, styles, onActionTarget \}\) => renderGenericSections\(\{ sections, styles, onActionTarget \}\),/)
 assert.match(shellSource, /export function renderAppShell\(\{[\s\S]*renderTrainSurface,[\s\S]*renderAnalyticsView,[\s\S]*renderAuthView,[\s\S]*renderLoadingView,[\s\S]*renderGenericSections,/)
})
