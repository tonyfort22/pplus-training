import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const plannerPath = resolve(repoRoot, 'apps/web/components/admin/program-planner-view.jsx')
const realPlannerRoutePath = resolve(repoRoot, 'apps/web/app/admin/programs/[programId]/page.jsx')

function readPlannerSource() {
  return readFileSync(plannerPath, 'utf8')
}

test('program planner day lanes expose an AI import action beside normal template create', () => {
  const source = readPlannerSource()

  assert.match(source, /import AiWorkoutDraftSheet from '@\/components\/admin\/ai-workout-draft-sheet'/)
  assert.doesNotMatch(source, /createSampleAiWorkoutDrafts/)
  assert.match(source, /function DayLane\([\s\S]*onImportAiWorkout/)
  assert.match(source, /onClick=\{\(\) => onImportAiWorkout\(day\.id\)\}/)
  assert.match(source, /Import AI Workout/)
  assert.match(source, /<span className="sr-only">Import AI Workout into \{day\.label\}<\/span>/)
  assert.match(source, /onImportAiWorkoutToDay=\{\(dayId\) => handleImportAiWorkout\(week\.id, dayId\)\}/)
})

test('program planner AI import keeps selected week and day context through draft accept persistence', () => {
  const source = readPlannerSource()

  assert.match(source, /const \[aiWorkoutImportTarget, setAiWorkoutImportTarget\] = useState\(null\)/)
  assert.match(source, /const \[isAcceptingAiWorkoutDraft, setIsAcceptingAiWorkoutDraft\] = useState\(false\)/)
  assert.match(source, /function handleImportAiWorkout\(weekId, dayId\)/)
  assert.match(source, /setAiWorkoutImportTarget\(\{ weekId, dayId, weekLabel: targetWeek\?\.label, dayLabel: targetDay\?\.label, day: targetDay \}\)/)
  assert.match(source, /fetch\('\/api\/admin\/ai-workout-drafts'/)
  assert.match(source, /function createProgramWorkoutDraftPayload\(\{ planner, day, acceptedDraft, trainingSections, sortOrder \}\)/)
  assert.match(source, /createProgramPlanFromDraft: true/)
  assert.match(source, /programId: planner\.id/)
  assert.match(source, /programDayId: day\?\.programDayId/)
  assert.match(source, /programWeekId: day\?\.programWeekId/)
  assert.match(source, /scheduledDate: day\?\.date \?\? acceptedDraft\?\.workout\?\.startDate \?\? null/)
  assert.match(source, /requestProgramWorkoutCreate\(createProgramWorkoutDraftPayload\(\{/)
  assert.match(source, /setIsAcceptingAiWorkoutDraft\(true\)/)
  assert.match(source, /setIsAcceptingAiWorkoutDraft\(false\)/)
  assert.match(source, /isAccepting=\{isAcceptingAiWorkoutDraft\}/)
  assert.match(source, /workouts: \[\.\.\.day\.workouts, persistedDraftWorkout\]/)
})

test('program planner reuses the AI draft review sheet instead of forking another review UI', () => {
  const source = readPlannerSource()

  assert.match(source, /<AiWorkoutDraftSheet[\s\S]*open=\{isAiWorkoutDraftSheetOpen\}[\s\S]*drafts=\{aiWorkoutDrafts\}[\s\S]*onAccept=\{handleAcceptAiWorkoutDraft\}/)
  assert.doesNotMatch(source, /function ProgramPlannerAiDraftSheet/)
  assert.doesNotMatch(source, /Planner AI Draft Review/)
})


test('real admin program detail route hides upload sheet while AI draft review sheet is open', () => {
  const source = readPlannerSource()

  assert.match(source, /<Sheet open=\{Boolean\(aiWorkoutImportTarget\) && !isAiWorkoutDraftSheetOpen\}/)
  assert.match(source, /onOpenChange=\{\(isOpen\) => !isOpen && !isAiWorkoutDraftSheetOpen && closeAiWorkoutImport\(\)\}/)
  assert.match(source, /<AiWorkoutDraftSheet[\s\S]*open=\{isAiWorkoutDraftSheetOpen\}/)
})


test('real admin program detail route uses persisted planner AI import unless it falls back to local seed data', () => {
  const source = readPlannerSource()
  const realRouteSource = readFileSync(realPlannerRoutePath, 'utf8')

  assert.match(realRouteSource, /app\/admin\/programs\/\[programId\]\/page\.jsx|ProgramPlannerPage/)
  assert.match(realRouteSource, /let isLocalSeedPlanner = true/)
  assert.match(realRouteSource, /program = createProgramPlannerFromAdminProgram\(adminProgram\)[\s\S]*isLocalSeedPlanner = false/)
  assert.match(realRouteSource, /const legacySeedTitle = seedTitle\.replace\(\/\^Program\\s\+\/i, 'Training Program '\)/)
  assert.match(realRouteSource, /candidateName === seedTitle\.toLowerCase\(\) \|\| candidateName === legacySeedTitle\.toLowerCase\(\)/)
  assert.match(realRouteSource, /<ProgramPlannerView program=\{program\} enableLocalAiImportPersistence=\{isLocalSeedPlanner\} \/>/)
  assert.doesNotMatch(realRouteSource, /planner-ai-import/)
  assert.match(source, /fetch\('\/api\/admin\/ai-workout-drafts'/)
  assert.doesNotMatch(source, /createSampleAiWorkoutDrafts/)
})


test('program planner AI import QA route uses the real PDF draft API instead of sample drafts', () => {
  const source = readPlannerSource()
  const qaRouteSource = readFileSync(resolve(repoRoot, 'apps/web/app/qa/planner-ai-import/page.jsx'), 'utf8')
  const createDraftsBlock = source.match(/async function handleCreateAiWorkoutDrafts\(\) \{[\s\S]*?\n  async function createPersistedAiWorkoutDraftForTarget/)?.[0] ?? ''

  assert.match(source, /accept="application\/pdf,\.pdf"/)
  assert.doesNotMatch(createDraftsBlock, /createSampleAiWorkoutDrafts/)
  assert.match(createDraftsBlock, /fetch\('\/api\/admin\/ai-workout-drafts'/)
  assert.doesNotMatch(qaRouteSource, /createSampleAiWorkoutDrafts/)
  assert.match(qaRouteSource, /enableLocalAiImportPersistence/)
  assert.match(qaRouteSource, /allowUnauthenticatedAiWorkoutDrafts/)
  assert.doesNotMatch(qaRouteSource, /AdminShell/)
})

test('slice 19 accepted AI import card visibly lands in the selected planner day', () => {
  const source = readPlannerSource()

  assert.match(source, /function createPlannerWorkoutFromTrainingSections\(\{ id, title, trainingSections, source = 'manual', sourceFileName = '' \}\)/)
  assert.match(source, /source,/)
  assert.match(source, /sourceFileName,/)
  assert.match(source, /source: 'ai-import'/)
  assert.match(source, /sourceFileName: acceptedDraft\?\.workout\?\.sourceFileName \?\? ''/)
  assert.match(source, /workouts: \[\.\.\.day\.workouts, persistedDraftWorkout\]/)
  assert.match(source, /workout\.source === 'ai-import'/)
  assert.match(source, /AI import/)
  assert.match(source, /workout\.sourceFileName/)
})

test('slice 20 accepted AI import card opens the normal editor with reviewed workout data', () => {
  const source = readPlannerSource()

  assert.match(source, /onClick=\{\(\) => onOpenWorkoutEditor\(\{ mode: 'edit', workout, weekId, dayId, weekLabel, dayLabel: day\.label \}\)\}/)
  assert.match(source, /setSelectedWorkoutDetailsValues\(createPlannerWorkoutDetailsValues\(workout, mode\)\)/)
  assert.match(source, /setSelectedWorkoutTrainingSections\(createPlannerWorkoutTrainingSections\(workout\)\)/)
  assert.match(source, /<SheetTitle className="text-\[var\(--admin-dashboard-card-text\)\]">\{selectedWorkoutMode === 'duplicate' \? 'Duplicate workout' : 'Edit workout'\}<\/SheetTitle>/)
  assert.match(source, /selectedWorkout\?\.workout\?\.source === 'ai-import'/)
  assert.match(source, /Imported from AI draft/)
  assert.match(source, /selectedWorkout\.workout\.sourceFileName/)
  assert.match(source, /<WorkoutTrainingBuilder sections=\{selectedWorkoutTrainingSections\} onSectionsChange=\{setSelectedWorkoutTrainingSections\} \/>/)
})

test('slice 21 saving edited local AI import keeps marker and training without calling persistence', () => {
  const source = readPlannerSource()

  assert.match(source, /const nextSections = createWorkoutSectionsFromTrainingSections\(selectedWorkoutTrainingSections\)/)
  assert.match(source, /const nextWorkout = \{[\s\S]*\.\.\.selectedWorkout\.workout[\s\S]*source:[\s\S]*selectedWorkout\.workout\.source[\s\S]*sourceFileName:[\s\S]*selectedWorkout\.workout\.sourceFileName[\s\S]*sections: nextSections[\s\S]*\}/)
  assert.match(source, /if \(shouldSaveLocalAiImportWorkout && selectedWorkoutMode !== 'duplicate'\) \{[\s\S]*replacePlannerWorkout\(currentPlanner, selectedWorkout, nextWorkout\)[\s\S]*setSelectedWorkout\(null\)[\s\S]*return[\s\S]*\}/)
})

test('slice 22 duplicating local AI import stays local and preserves marker plus training', () => {
  const source = readPlannerSource()

  assert.match(source, /const shouldSaveLocalAiImportWorkout = enableLocalAiImportPersistence && selectedWorkout\.workout\.source === 'ai-import'/)
  assert.match(source, /if \(selectedWorkoutMode === 'duplicate'\) \{[\s\S]*if \(shouldSaveLocalAiImportWorkout \|\| !selectedDay\?\.programDayId\) \{[\s\S]*const localDuplicateWorkout = \{[\s\S]*\.\.\.nextWorkout[\s\S]*id: `\$\{selectedWorkout\.workout\.id\}-copy-\$\{Date\.now\(\)\}`[\s\S]*programWorkoutId: null[\s\S]*\}[\s\S]*insertPlannerWorkoutAfterSelected\(currentPlanner, selectedWorkout, localDuplicateWorkout\)[\s\S]*return/)
  assert.match(source, /source: selectedWorkout\.workout\.source/)
  assert.match(source, /sourceFileName: selectedWorkout\.workout\.sourceFileName/)
})

test('slice 23 deleting local AI import removes the planner card without calling persistence', () => {
  const source = readPlannerSource()

  assert.match(source, /function isLocalAiImportWorkout\(workout = \{\}\) \{[\s\S]*return workout\.source === 'ai-import' && !workout\.programWorkoutId[\s\S]*\}/)
  assert.match(source, /const shouldDeleteLocalAiImportWorkout = enableLocalAiImportPersistence && isLocalAiImportWorkout\(workoutPendingDelete\.workout\)/)
  assert.match(source, /if \(!shouldDeleteLocalAiImportWorkout\) \{[\s\S]*const persistedProgramWorkoutId = getPersistedProgramWorkoutDeleteId\(workoutPendingDelete\.workout\)[\s\S]*await requestProgramWorkoutDelete\(persistedProgramWorkoutId\)[\s\S]*\}/)
  assert.match(source, /setPlanner\(\(currentPlanner\) => removePlannerWorkout\(currentPlanner, workoutPendingDelete\)\)/)
})

test('slice 24 real AI import accept decorates persisted create response with source marker before appending card', () => {
  const source = readPlannerSource()

  assert.match(source, /function decorateAiImportPlannerWorkout\(workout, acceptedDraft\) \{[\s\S]*\.\.\.workout[\s\S]*source: 'ai-import'[\s\S]*sourceFileName: acceptedDraft\?\.workout\?\.sourceFileName \?\? ''[\s\S]*\}/)
  assert.match(source, /const createdPlannerWorkout = await requestProgramWorkoutCreate\(createProgramWorkoutDraftPayload\(\{/)
  assert.match(source, /decorateAiImportPlannerWorkout\(createdPlannerWorkout, acceptedDraft\)/)
  assert.doesNotMatch(source, /: await requestProgramWorkoutCreate\(createProgramWorkoutDraftPayload\(\{[\s\S]*\}\)\)\n\s*setPlanner/)
})

test('slice 27 planner handoff preserves reviewed section instructions and exercise notes', () => {
  const source = readPlannerSource()

  assert.match(source, /showInstruction: Boolean\(section\?\.instructions \?\? section\?\.blockLabel\)/)
  assert.match(source, /instruction: section\?\.instructions \?\? \(section\?\.blockLabel \? `Block \$\{section\.blockLabel\}` : ''\)/)
  assert.match(source, /showInstruction: Boolean\(exercise\?\.notes\)/)
  assert.match(source, /instruction: exercise\?\.notes \?\? ''/)
})

test('slice 28 accepting one multi-PDF draft keeps remaining drafts open for the same day', () => {
  const source = readPlannerSource()

  assert.match(source, /function removeAcceptedAiWorkoutDraft\(drafts = \[\], acceptedDraft\)/)
  assert.match(source, /acceptedDraft\?\.workout\?\.sourceFileName/)
  assert.match(source, /const remainingDrafts = removeAcceptedAiWorkoutDraft\(aiWorkoutDrafts, acceptedDraft\)/)
  assert.match(source, /setAiWorkoutDrafts\(remainingDrafts\)/)
  assert.match(source, /if \(remainingDrafts\.length > 0\) \{[\s\S]*setIsAiWorkoutDraftSheetOpen\(true\)[\s\S]*return[\s\S]*\}/)
  assert.match(source, /closeAiWorkoutImport\(\)/)
})

test('slice 29 accepted AI draft maps reviewed phase label onto an existing program phase id', () => {
  const source = readPlannerSource()
  const utilsSource = readFileSync(resolve(repoRoot, 'apps/web/components/admin/program-planner-utils.js'), 'utf8')

  assert.match(utilsSource, /function cloneProgramPhase\(phase = \{\}\)/)
  assert.match(utilsSource, /phases: Array\.isArray\(program\.phases \?\? program\.programPhases\)/)
  assert.match(source, /function normalizePhaseLabel\(value = ''\)/)
  assert.match(source, /function resolveProgramPhaseIdForDraft\(planner = \{\}, acceptedDraft = \{\}\)/)
  assert.match(source, /acceptedDraft\?\.workout\?\.phase/)
  assert.match(source, /planner\.phases\?\.find\(\(phase\) => normalizePhaseLabel\(phase\.name \?\? phase\.label\) === draftPhaseLabel\)/)
  assert.match(source, /programPhaseId: resolveProgramPhaseIdForDraft\(planner, acceptedDraft\)/)
})

test('slice 30 accepted AI draft routes to explicit week and day when both are present', () => {
  const source = readPlannerSource()

  assert.match(source, /function resolveAiWorkoutDraftTarget\(planner = \{\}, clickedTarget = \{\}, acceptedDraft = \{\}\)/)
  assert.match(source, /const draftWeekNumber = Number\(acceptedDraft\?\.workout\?\.weekNumber\)/)
  assert.match(source, /const draftDayNumber = Number\(acceptedDraft\?\.workout\?\.dayNumber\)/)
  assert.match(source, /planner\.weeks\?\.\[draftWeekNumber - 1\]/)
  assert.match(source, /draftWeek\?\.daySlots\?\.find\(\(day\) => day\.label === `Day \$\{draftDayNumber\}` \|\| day\.id === `day-\$\{draftDayNumber\}`\)/)
  assert.match(source, /const resolvedTarget = resolveAiWorkoutDraftTarget\(planner, aiWorkoutImportTarget, acceptedDraft\)/)
  assert.match(source, /week\.id === resolvedTarget\.weekId/)
  assert.match(source, /day\.id === resolvedTarget\.dayId/)
})

test('slice 31 planner passes resolved AI draft destination preview into review sheet', () => {
  const source = readPlannerSource()

  assert.match(source, /function formatAiWorkoutDraftTargetLabel\(target = \{\}\)/)
  assert.match(source, /function createAiWorkoutDraftDestinationPreview\(planner = \{\}, clickedTarget = \{\}, draft = \{\}\)/)
  assert.match(source, /const resolvedTarget = resolveAiWorkoutDraftTarget\(planner, clickedTarget, draft\)/)
  assert.match(source, /const clickedTargetLabel = formatAiWorkoutDraftTargetLabel\(resolveClickedAiWorkoutDraftTarget\(planner, clickedTarget\)\)/)
  assert.match(source, /const resolvedTargetLabel = formatAiWorkoutDraftTargetLabel\(resolvedTarget\)/)
  assert.match(source, /const usedClickedFallback = hasDraftRoutingMetadata && !resolvedTarget\.usedDraftRouting/)
  assert.match(source, /isFallback: usedClickedFallback/)
  assert.match(source, /message: usedClickedFallback \? `PDF says Week \$\{draft\?\.workout\?\.weekNumber \?\? 'unknown'\} · Day \$\{draft\?\.workout\?\.dayNumber \?\? 'unknown'\}, using clicked lane: \$\{clickedTargetLabel\}` : `Will place into: \$\{resolvedTargetLabel\}`/)
  assert.match(source, /destinationPreview=\{\(draft\) => createAiWorkoutDraftDestinationPreview\(planner, aiWorkoutImportTarget, draft\)\}/)
})

test('slice 32 destination preview exposes compact labels for multi-PDF tabs', () => {
  const source = readPlannerSource()

  assert.match(source, /shortLabel: resolvedTargetLabel/)
  assert.match(source, /fallbackLabel: clickedTargetLabel/)
  assert.match(source, /isFallback: usedClickedFallback/)
})

test('slice 33 planner accepts all remaining drafts with per-draft Week Day routing', () => {
  const source = readPlannerSource()

  assert.match(source, /function handleAcceptAllRemainingAiWorkoutDrafts\(acceptedDrafts = \[\]\)/)
  assert.match(source, /for \(const acceptedDraft of acceptedDrafts\)/)
  assert.match(source, /resolveAiWorkoutDraftTarget\(nextPlanner, aiWorkoutImportTarget, acceptedDraft\)/)
  assert.match(source, /appendAiWorkoutDraftToPlanner\(nextPlanner, resolvedTarget, persistedDraftWorkout\)/)
  assert.match(source, /setAiWorkoutDrafts\(\[\]\)/)
  assert.match(source, /closeAiWorkoutImport\(\)/)
})

test('slice 34 destination preview warns when target day already has workouts', () => {
  const source = readPlannerSource()

  assert.match(source, /const existingWorkoutCount = resolvedTarget\.day\?\.workouts\?\.length \?\? 0/)
  assert.match(source, /appendWarning: existingWorkoutCount > 0 \? `Target day already has \$\{existingWorkoutCount\} workout\$\{existingWorkoutCount === 1 \? '' : 's'\}\. This import will append below existing workouts\.` : ''/)
  assert.match(source, /existingWorkoutCount,/)
})

test('slice 25 planner rehydrates persisted AI import provenance after reload', () => {
  const source = readPlannerSource()

  assert.match(source, /importSource: 'ai-import'/)
  assert.match(source, /importSourceFileName: acceptedDraft\?\.workout\?\.sourceFileName \?\? ''/)
  assert.match(source, /source: workout\.import_source \?\? 'manual'/)
  assert.match(source, /sourceFileName: workout\.import_source_file_name \?\? ''/)
})
