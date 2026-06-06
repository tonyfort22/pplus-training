import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deflateSync } from 'node:zlib'

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

async function scanPdfFixture(path, sourceFileName) {
  const { extractWorkoutTextFromPdfFile, createAiWorkoutDraftFromExtractedText } = await import(draftLibPath)
  const fileBytes = readFileSync(path)
  const file = new File([fileBytes], sourceFileName, { type: 'application/pdf' })
  const extractedText = await extractWorkoutTextFromPdfFile(file)
  const draft = createAiWorkoutDraftFromExtractedText({ text: extractedText, sourceFileName: file.name })
  return { extractedText, draft, exercises: draft.sections.flatMap((section) => section.exercises) }
}

test('OSD26 custom-encoded PDFs scan through generic OCR/table parsing instead of one hardcoded workout', async () => {
  const cases = [
    {
      path: '/Users/anthonyfortugno/Desktop/OSD26+P1+A.pdf',
      sourceFileName: 'OSD26+P1+A.pdf',
      workoutName: 'Speed Accelerator A',
      exercises: ['Depth Drop', 'Bent Knee Reverse Crunch', 'Fan Bike or Run'],
    },
    {
      path: '/Users/anthonyfortugno/Desktop/OSD26+P1+B.pdf',
      sourceFileName: 'OSD26+P1+B.pdf',
      workoutName: 'Speed Accelerator B',
      exercises: ['Push Up w/ Eccentric Drop', '2-Leg Hip Lift w/ Plate Pullover', 'Seated DB External Rotation'],
    },
    {
      path: '/Users/anthonyfortugno/Desktop/OSD26+P1+C.pdf',
      sourceFileName: 'OSD26+P1+C.pdf',
      workoutName: 'Speed Accelerator C',
      exercises: ['Medial/Lateral Split Squat Depth Drop', 'Hanging Knee Tuck', 'Fan Bike or Run'],
    },
    {
      path: '/Users/anthonyfortugno/Desktop/thibault_training_program/phase3/OSD26+P3+EW+A.pdf',
      sourceFileName: 'OSD26+P3+EW+A.pdf',
      workoutName: 'Edge Work A',
      exercises: ['Skate Position Hip Extension', 'Side Plank w/ Leg Lift', 'Tempo Run'],
    },
  ]

  for (const testCase of cases) {
    const { draft, exercises } = await scanPdfFixture(testCase.path, testCase.sourceFileName)
    const exerciseNames = exercises.map((exercise) => exercise.name)

    assert.equal(draft.workout.name, testCase.workoutName)
    assert.equal(draft.workout.program, 'Off-Season Domination 26')
    assert.match(draft.workout.phase, /^Phase \d+$/)
    assert.ok(exercises.length >= testCase.exercises.length, `${testCase.sourceFileName} should produce several real exercises`)
    for (const expectedExercise of testCase.exercises) {
      assert.ok(exerciseNames.includes(expectedExercise), `${testCase.sourceFileName} missing ${expectedExercise}: ${exerciseNames.join(', ')}`)
    }
    assert.ok(exercises.every((exercise) => exercise.weeks.length >= 4), `${testCase.sourceFileName} should preserve week prescriptions`)
    assert.doesNotMatch(JSON.stringify(draft), /Could not reliably scan|Review extracted PDF text and adjust the prescription/)
  }
})

test('PDF scanner has no one-file OSD26 P1 A hardcoded parser branch', () => {
  const source = readFileSync(draftLibPath, 'utf8')

  assert.doesNotMatch(source, /createKnownOsd26P1ASections/)
  assert.doesNotMatch(source, /OSD26\+P1\+A/)
})

test('unreadable unknown PDFs block accept instead of generating a fake one-exercise fallback', async () => {
  const { createAiWorkoutDraftFromExtractedText } = await import(draftLibPath)
  const draft = createAiWorkoutDraftFromExtractedText({
    sourceFileName: 'unknown-custom-encoded.pdf',
    text: Array.from({ length: 120 }, (_, index) => `obj ${index} stream /Subtype /Widget \u0001\u0002\u0003`).join('\n'),
  })

  assert.equal(draft.sections.length, 0)
  assert.equal(draft.warnings[0].blocking, true)
  assert.match(draft.warnings[0].message, /Could not reliably scan/)
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

test('PDF draft helper extracts compressed FlateDecode text streams', async () => {
  const { extractWorkoutTextFromPdfFile, createAiWorkoutDraftFromExtractedText } = await import(draftLibPath)
  const compressedStream = deflateSync(Buffer.from([
    'BT',
    '(Workout: Compressed Real PDF Speed) Tj',
    '(Program: Off-Season Domination 26) Tj',
    '(Week 2 / Day 5) Tj',
    '(A1 Depth Drop 3 sets 5 reps rest 30 seconds) Tj',
    'ET',
  ].join('\n')))
  const file = new File([
    '%PDF-1.7\n',
    '1 0 obj << /Length ', String(compressedStream.length), ' /Filter /FlateDecode >> stream\n',
    compressedStream,
    '\nendstream endobj\n%%EOF',
  ], 'compressed-real-workout.pdf', { type: 'application/pdf' })

  const extractedText = await extractWorkoutTextFromPdfFile(file)
  const draft = createAiWorkoutDraftFromExtractedText({ text: extractedText, sourceFileName: file.name })

  assert.match(extractedText, /Compressed Real PDF Speed/)
  assert.match(extractedText, /A1 Depth Drop 3 sets 5 reps rest 30 seconds/)
  assert.equal(draft.workout.name, 'Compressed Real PDF Speed')
  assert.equal(draft.workout.weekNumber, 2)
  assert.equal(draft.workout.dayNumber, 5)
  assert.equal(draft.sections[0].exercises[0].name, 'Depth Drop')
})

test('admin AI workout draft route allows blank browser MIME type when filename is pdf', () => {
  const source = readFileSync(routePath, 'utf8')

  assert.match(source, /uploadedFiles\.find\(\(file\) => file\.type && file\.type !== 'application\/pdf' && !String\(file\.name \|\| ''\)\.toLowerCase\(\)\.endsWith\('\.pdf'\)\)/)
})

test('admin AI workout draft route is cookie protected and accepts multipart PDFs only', () => {
  const source = readFileSync(routePath, 'utf8')

  assert.match(source, /assertAdminApiRequest\(/)
  assert.match(source, /function isLocalQaPlannerDraftRequest\(request\)/)
  assert.match(source, /x-pplus-planner-ai-import-qa/)
  assert.match(source, /referer\.includes\('\/qa\/planner-ai-import'\)/)
  assert.match(source, /host\.startsWith\('127\.0\.0\.1'\) \|\| host\.startsWith\('localhost'\)/)
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

test('PDF draft payload carries real exercise library candidates for review matching', async () => {
  const { createAiWorkoutDraftFromExtractedText } = await import(draftLibPath)
  const exerciseCandidates = [
    { id: 'depth-real-id', name: 'Depth Drop' },
    { id: 'med-ball-real-id', name: 'Medicine Ball Scoop Toss' },
  ]
  const draft = createAiWorkoutDraftFromExtractedText({
    sourceFileName: 'real-library-matching.pdf',
    exerciseCandidates,
    text: [
      'Workout: Real Library Match Proof',
      'A1 Medicine Ball Scoop Toss 3 sets 5 reps rest 45 seconds',
    ].join('\n'),
  })

  assert.deepEqual(draft.exerciseCandidates.slice(0, 2), exerciseCandidates.map((candidate) => ({ id: candidate.id, name: candidate.name })))
  assert.ok(draft.exerciseCandidates.some((candidate) => candidate.id === 'med-ball-real-id' && candidate.name === 'Medicine Ball Scoop Toss'))
  assert.equal(draft.sections[0].exercises[0].exerciseMatch.exerciseId, 'med-ball-real-id')
  assert.equal(draft.sections[0].exercises[0].exerciseMatch.exerciseName, 'Medicine Ball Scoop Toss')
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

test('planner import always calls admin PDF draft API and never uses local sample drafts', () => {
  const source = readFileSync(plannerPath, 'utf8')
  const createDraftsBlock = source.match(/async function handleCreateAiWorkoutDrafts\(\) \{[\s\S]*?\n  async function createPersistedAiWorkoutDraftForTarget/)?.[0] ?? ''

  assert.match(source, /async function handleCreateAiWorkoutDrafts\(\)/)
  assert.doesNotMatch(createDraftsBlock, /enableLocalAiImportQa/)
  assert.doesNotMatch(createDraftsBlock, /createSampleAiWorkoutDrafts/)
  assert.match(source, /const formData = new FormData\(\)/)
  assert.match(source, /aiWorkoutImportFiles\.forEach\(\(file\) => formData\.append\('files', file\)\)/)
  assert.doesNotMatch(source, /formData\.append\('file', aiWorkoutImportFiles\[0\]\)/)
  assert.match(source, /fetch\('\/api\/admin\/ai-workout-drafts'/)
  assert.match(source, /allowUnauthenticatedAiWorkoutDrafts \? \{ 'x-pplus-planner-ai-import-qa': 'true' \} : undefined/)
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
