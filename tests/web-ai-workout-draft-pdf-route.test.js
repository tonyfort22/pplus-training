import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const draftLibPath = resolve(repoRoot, 'apps/web/lib/ai-workout-draft-pdf.js')
const routePath = resolve(repoRoot, 'apps/web/app/api/admin/ai-workout-drafts/route.js')
const reviseRoutePath = resolve(repoRoot, 'apps/web/app/api/admin/ai-workout-drafts/revise/route.js')
const plannerPath = resolve(repoRoot, 'apps/web/components/admin/program-planner-view.jsx')
const sheetPath = resolve(repoRoot, 'apps/web/components/admin/ai-workout-draft-sheet.jsx')

test('PDF draft helper extracts uploaded workout text and returns review-sheet draft shape', async () => {
  const { extractWorkoutTextFromPdfFile, createAiWorkoutDraftFromExtractedText } = await import(draftLibPath)
  const file = new File([
    '%PDF-1.7\n',
    'Workout: Slice 12 Real PDF Speed\n',
    'Program: Off-Season Domination 26\n',
    'A1 Depth Drop 3 sets 5 reps rest 30 seconds\n',
    'B1 Fan Bike 4 sets 1min rest 60 seconds\n',
  ], 'slice-12-real-workout.pdf', { type: 'application/pdf' })

  const extractedText = await extractWorkoutTextFromPdfFile(file)
  const draft = createAiWorkoutDraftFromExtractedText({ text: extractedText, sourceFileName: file.name })

  assert.match(extractedText, /Slice 12 Real PDF Speed/)
  assert.equal(draft.workout.name, 'Slice 12 Real PDF Speed')
  assert.equal(draft.workout.sourceFileName, 'slice-12-real-workout.pdf')
  assert.equal(draft.workout.trainingType, 'Speed')
  assert.ok(draft.sections.length >= 2)
  assert.deepEqual(draft.sections[0].exercises[0].weeks[0], { week: 1, tempo: 'N/A', sets: 3, reps: '5', restSeconds: 30 })
  assert.equal(draft.sections[0].exercises[0].exerciseMatch.status, 'matched')
  assert.equal(draft.sections[1].exercises[0].name, 'Fan Bike')
})

test('slice 30 PDF draft helper extracts week and day routing metadata', async () => {
  const { createAiWorkoutDraftFromExtractedText } = await import(draftLibPath)
  const draft = createAiWorkoutDraftFromExtractedText({
    sourceFileName: 'slice-30-week-2-day-5.pdf',
    text: [
      'Workout: Slice 30 Route Proof',
      'Program: Off-Season Domination 26',
      'Phase: P1',
      'Week: 2',
      'Day: 5',
      'A1 Depth Drop 3 sets 5 reps rest 30 seconds',
    ].join('\n'),
  })

  assert.equal(draft.workout.weekNumber, 2)
  assert.equal(draft.workout.dayNumber, 5)
})

test('admin AI workout draft route is cookie protected and accepts multipart PDFs only', () => {
  const source = readFileSync(routePath, 'utf8')

  assert.match(source, /assertAdminApiRequest\(/)
  assert.match(source, /request\.formData\(\)/)
  assert.match(source, /file\.type !== 'application\/pdf'/)
  assert.match(source, /extractWorkoutTextFromPdfFile\(file\)/)
  assert.match(source, /createAiWorkoutDraftFromExtractedText\(/)
  assert.match(source, /return NextResponse\.json\(\{ drafts, extractedTextPreview:/)
})

test('PDF draft helper marks exact suggested and unmatched exercise library matches honestly', async () => {
  const { createAiWorkoutDraftFromExtractedText } = await import(draftLibPath)
  const exerciseCandidates = [
    { id: '11111111-1111-4111-8111-111111111111', name: 'Depth Drop' },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Fan Bike' },
  ]
  const draft = createAiWorkoutDraftFromExtractedText({
    sourceFileName: 'slice-13-matches.pdf',
    exerciseCandidates,
    text: [
      'Workout: Slice 13 Match Proof',
      'A1 Depth Drop 3 sets 5 reps rest 30 seconds',
      'B1 Depth Drops 2 sets 4 reps rest 45 seconds',
      'C1 Mystery Hockey Thing 1 sets 8 reps rest 60 seconds',
    ].join('\n'),
  })

  const matches = draft.sections.flatMap((section) => section.exercises.map((exercise) => exercise.exerciseMatch))
  assert.deepEqual(matches.map((match) => match.status), ['matched', 'suggested', 'unmatched'])
  assert.deepEqual(matches.map((match) => match.exerciseId), ['11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', ''])
  assert.equal(matches[1].exerciseName, 'Depth Drop')
  assert.equal(draft.warnings.length, 1)
  assert.match(draft.warnings[0].message, /1 unmatched exercise/)
})

test('admin AI workout draft route loads real exercise candidates before creating draft', () => {
  const source = readFileSync(routePath, 'utf8')

  assert.match(source, /createAdminExerciseRepository/)
  assert.match(source, /repository\.listExercises\(\)/)
  assert.match(source, /exerciseCandidates/)
  assert.match(source, /createAiWorkoutDraftFromExtractedText\(\{[\s\S]*exerciseCandidates/)
})

test('draft review sheet shows matched suggested and unmatched states before accept', () => {
  const source = readFileSync(sheetPath, 'utf8')

  assert.match(source, /matchStatus === 'unmatched' \? 'Unmatched'/)
  assert.match(source, /reviewedMatchCounts/)
  assert.match(source, /blockingUnmatchedCount/)
  assert.match(source, /Suggested match/)
  assert.match(source, /Choose existing exercise/)
  assert.match(source, /Accept Draft/)
})

test('real planner import calls admin PDF draft API while QA mode keeps sample drafts local', () => {
  const source = readFileSync(plannerPath, 'utf8')

  assert.match(source, /async function handleCreateAiWorkoutDrafts\(\)/)
  assert.match(source, /if \(enableLocalAiImportQa\)[\s\S]*createSampleAiWorkoutDrafts\(aiWorkoutImportFiles\)/)
  assert.match(source, /const formData = new FormData\(\)/)
  assert.match(source, /aiWorkoutImportFiles\.forEach\(\(file\) => formData\.append\('files', file\)\)/)
  assert.doesNotMatch(source, /formData\.append\('file', aiWorkoutImportFiles\[0\]\)/)
  assert.match(source, /fetch\('\/api\/admin\/ai-workout-drafts'/)
  assert.match(source, /setAiWorkoutDrafts\(body\.drafts \?\? \[\]/)
})

test('slice 26 real AI draft route accepts multiple PDF files as separate workout drafts', () => {
  const routeSource = readFileSync(routePath, 'utf8')
  const plannerSource = readFileSync(plannerPath, 'utf8')

  assert.match(routeSource, /const files = formData\.getAll\('files'\)/)
  assert.match(routeSource, /const uploadedFiles = files\.length \? files : \[formData\.get\('file'\)\]/)
  assert.match(routeSource, /for \(const file of uploadedFiles\)/)
  assert.match(routeSource, /drafts\.push\(createAiWorkoutDraftFromExtractedText\(\{/)
  assert.match(routeSource, /return NextResponse\.json\(\{ drafts, extractedTextPreview:/)
  assert.match(plannerSource, /multiple/)
  assert.match(plannerSource, /buttonLabel="Choose PDFs"/)
  assert.match(plannerSource, /fileName=\{aiWorkoutImportFiles\.map\(\(file\) => file\.name\)\.join\(', '\)\}/)
})

test('AI workout draft revision helper changes Fan Bike or Run to Run only without database persistence', async () => {
  const { createAiWorkoutDraftFromExtractedText, reviseAiWorkoutDraft } = await import(draftLibPath)
  const draft = createAiWorkoutDraftFromExtractedText({
    sourceFileName: 'slice-14-revise.pdf',
    text: [
      'Workout: Slice 14 Revision Proof',
      'Conditioning Fan Bike or Run 4 sets 1min rest 60 seconds',
    ].join('\n'),
  })

  const revisedDraft = reviseAiWorkoutDraft({
    draft,
    prompt: 'Change Conditioning to Run only and remove Fan Bike alternative.',
  })

  const revisedExercise = revisedDraft.sections[0].exercises[0]
  assert.equal(revisedExercise.name, 'Run')
  assert.deepEqual(revisedExercise.alternatives ?? [], [])
  assert.equal(revisedExercise.exerciseMatch.status, 'matched')
  assert.equal(revisedExercise.exerciseMatch.exerciseName, 'Run')
  assert.match(revisedDraft.warnings.at(-1).message, /Applied revision/)
  assert.match(revisedDraft.workout.notes, /Revised from prompt/)
})

test('admin AI workout draft revise route is cookie protected and validates prompt plus draft payload', () => {
  const source = readFileSync(reviseRoutePath, 'utf8')

  assert.match(source, /assertAdminApiRequest\(/)
  assert.match(source, /await request\.json\(\)/)
  assert.match(source, /prompt\?\.trim\(\)/)
  assert.match(source, /return NextResponse\.json\(\{ error: 'Enter a revision prompt first\.' \}, \{ status: 400 \}\)/)
  assert.match(source, /reviseAiWorkoutDraft\(\{[\s\S]*draft,[\s\S]*prompt/)
  assert.match(source, /return NextResponse\.json\(\{ draft: revisedDraft \}/)
})
