const exerciseMatchOptions = [
  'Depth Drop',
  'Bent Knee Reverse Crunch',
  'Goblet Front Foot Elevated Split Squat Hold',
  '1/2 Kneel Anti-Rotation Press [Outside Leg Forward]',
  'Glute Ham Raise Hold',
  '1-Leg Wall Calf Raise',
  'Wall Supported Toe Raise',
  'Fan Bike',
  'Run',
]

function normalizeWhitespace(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeExerciseName(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singularizeExerciseName(value = '') {
  return normalizeExerciseName(value)
    .split(' ')
    .map((word) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word))
    .join(' ')
}

function normalizeExerciseCandidates(exerciseCandidates = []) {
  const providedCandidates = Array.isArray(exerciseCandidates)
    ? exerciseCandidates
    : []
  const fallbackCandidates = exerciseMatchOptions.map((name) => ({ id: name, name }))
  const candidates = [...providedCandidates, ...fallbackCandidates]
  const seen = new Set()

  return candidates
    .map((candidate) => ({
      id: candidate?.id ?? candidate?.value ?? candidate?.name ?? '',
      name: candidate?.name ?? candidate?.label ?? candidate?.exerciseName ?? '',
    }))
    .filter((candidate) => candidate.id && candidate.name)
    .filter((candidate) => {
      const key = normalizeExerciseName(candidate.name)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function unescapePdfLiteral(value = '') {
  return String(value)
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
}

function decodePdfishBuffer(buffer) {
  const binary = Buffer.from(buffer).toString('latin1')
  const literalText = [...binary.matchAll(/\(([^()]{3,})\)\s*Tj/g)]
    .map((match) => unescapePdfLiteral(match[1]))
    .join('\n')
  const arrayText = [...binary.matchAll(/\[((?:\([^()]*\)\s*)+)\]\s*TJ/g)]
    .map((match) => [...match[1].matchAll(/\(([^()]*)\)/g)].map((part) => unescapePdfLiteral(part[1])).join(''))
    .join('\n')
  const rawText = Buffer.from(buffer).toString('utf8')

  return [literalText, arrayText, rawText]
    .filter(Boolean)
    .join('\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, '\n')
}

export async function extractWorkoutTextFromPdfFile(file) {
  if (!file) throw new Error('Upload a workout PDF first.')
  if (file.type !== 'application/pdf' && !String(file.name || '').toLowerCase().endsWith('.pdf')) {
    throw new Error('Upload a PDF file.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const text = decodePdfishBuffer(arrayBuffer)
    .split(/\r?\n/)
    .map(normalizeWhitespace)
    .filter((line) => line.length >= 2)
    .filter((line) => !/^%PDF-|^endobj$|^xref$|^trailer$|^startxref$/i.test(line))
    .join('\n')

  if (!text.trim()) {
    throw new Error('No readable text was found in the PDF. OCR is not wired for this slice yet.')
  }

  return text.slice(0, 30000)
}

function findLineValue(lines, labels = []) {
  const escapedLabels = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`^(?:${escapedLabels.join('|')})\\s*[:\\-]\\s*(.+)$`, 'i')
  const matchedLine = lines.find((line) => pattern.test(line))
  return matchedLine ? normalizeWhitespace(matchedLine.replace(pattern, '$1')) : ''
}

function parsePositiveInteger(value = '') {
  const match = String(value ?? '').match(/\d+/)
  const number = match ? Number(match[0]) : NaN
  return Number.isInteger(number) && number > 0 ? number : null
}

function inferTrainingType(text = '') {
  const value = text.toLowerCase()
  if (/speed|sprint|acceleration|accelerator|plyo|jump/.test(value)) return 'Speed'
  if (/edge|skating|stride|crossover/.test(value)) return 'Edge Work'
  if (/condition|bike|run|interval|heart rate/.test(value)) return 'Conditioning'
  if (/warm\s?up|activation|mobility|prep/.test(value)) return 'Warmup'
  return 'Speed'
}

function inferWorkoutDayType(text = '', name = '') {
  const value = `${name} ${text}`.toLowerCase()
  if (value.includes('speed accelerator b')) return 'Speed Accelerator B'
  if (value.includes('speed accelerator c')) return 'Speed Accelerator C'
  if (value.includes('edge work b')) return 'Edge Work B'
  if (value.includes('edge work')) return 'Edge Work A'
  if (value.includes('deload')) return 'Deload'
  return 'Speed Accelerator A'
}

export function createExerciseMatch(exerciseName, exerciseCandidates = []) {
  const candidates = normalizeExerciseCandidates(exerciseCandidates)
  const normalizedName = normalizeExerciseName(exerciseName)
  const singularName = singularizeExerciseName(exerciseName)
  const exactMatch = candidates.find((candidate) => normalizeExerciseName(candidate.name) === normalizedName)
  if (exactMatch) return { status: 'matched', exerciseId: exactMatch.id, exerciseName: exactMatch.name }

  const suggestedMatch = candidates.find((candidate) => singularizeExerciseName(candidate.name) === singularName)
    ?? candidates.find((candidate) => {
      const candidateName = singularizeExerciseName(candidate.name)
      return candidateName && singularName && (candidateName.includes(singularName) || singularName.includes(candidateName))
    })

  if (suggestedMatch) return { status: 'suggested', exerciseId: suggestedMatch.id, exerciseName: suggestedMatch.name }
  return { status: 'unmatched', exerciseId: '', exerciseName: '' }
}

function extractSetCount(line) {
  const match = String(line).match(/(\d+)\s*(?:sets?|x)\b/i)
  return match ? Number(match[1]) : 1
}

function extractRestSeconds(line) {
  const match = String(line).match(/rest\s*(\d+)\s*(sec|secs|seconds?|s|min|mins|minutes?)?/i)
  if (!match) return 60
  const value = Number(match[1])
  const unit = String(match[2] || 'seconds').toLowerCase()
  return unit.startsWith('min') ? value * 60 : value
}

function extractPrescription(line) {
  const durationMatch = String(line).match(/(\d+)\s*(?:min|mins|minutes|sec|secs|seconds|s)\b/i)
  const repsMatch = String(line).match(/(\d+(?:\/side)?)\s*reps?\b/i)
  if (repsMatch) return { reps: repsMatch[1] }
  if (durationMatch) return { duration: durationMatch[0].replace(/\s+/g, '') }
  return { reps: '' }
}

function parseExerciseLine(line, exerciseCandidates = []) {
  const match = String(line).match(/^([A-Z]+\d*|Conditioning)\s+(.+)$/i)
  if (!match) return null
  const label = match[1]
  let rest = match[2]
  rest = rest.replace(/\b\d+\s*(?:sets?|x)\b.*$/i, '').trim() || rest
  const name = normalizeWhitespace(rest.replace(/[·|\-–—]+$/g, ''))
  if (!name || /^week\s+\d/i.test(name)) return null

  const prescription = extractPrescription(line)
  return {
    label,
    exercise: {
      name,
      notes: '',
      weeks: [{ week: 1, tempo: 'N/A', sets: extractSetCount(line), ...prescription, restSeconds: extractRestSeconds(line) }],
      exerciseMatch: createExerciseMatch(name, exerciseCandidates),
    },
  }
}

function createFallbackExercise(text, exerciseCandidates = []) {
  const trainingType = inferTrainingType(text)
  const name = trainingType === 'Conditioning' ? 'Fan Bike' : 'Depth Drop'
  return {
    label: 'A1',
    exercise: {
      name,
      notes: 'Review extracted PDF text and adjust the prescription before accepting.',
      weeks: [{ week: 1, tempo: 'N/A', sets: 1, reps: '', restSeconds: 60 }],
      exerciseMatch: createExerciseMatch(name, exerciseCandidates),
    },
  }
}

function buildSections(lines, text, exerciseCandidates = []) {
  const parsedExercises = lines.map((line) => parseExerciseLine(line, exerciseCandidates)).filter(Boolean)
  const exercises = parsedExercises.length ? parsedExercises : [createFallbackExercise(text, exerciseCandidates)]
  const grouped = new Map()

  for (const item of exercises) {
    const label = item.label || 'A1'
    if (!grouped.has(label)) grouped.set(label, { label, exercises: [] })
    grouped.get(label).exercises.push(item.exercise)
  }

  return [...grouped.values()]
}

function createExerciseMatchWarnings(sections = []) {
  const unmatchedCount = sections.reduce((total, section) => {
    return total + (section.exercises ?? []).filter((exercise) => exercise.exerciseMatch?.status === 'unmatched').length
  }, 0)

  return unmatchedCount > 0
    ? [{ type: 'exercise-match', severity: 'warning', message: `${unmatchedCount} unmatched exercise${unmatchedCount === 1 ? '' : 's'} ${unmatchedCount === 1 ? 'needs' : 'need'} review before accepting.` }]
    : []
}

export function createAiWorkoutDraftFromExtractedText({ text = '', sourceFileName = '', exerciseCandidates = [] } = {}) {
  const lines = String(text).split(/\r?\n/).map(normalizeWhitespace).filter(Boolean)
  const workoutName = findLineValue(lines, ['Workout', 'Workout Name', 'Title'])
    || lines.find((line) => /speed|edge|condition|warm/i.test(line) && !/^%PDF/i.test(line))
    || sourceFileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ')
    || 'Imported PDF Workout'
  const programName = findLineValue(lines, ['Program', 'Program Name']) || 'Imported Program'
  const trainingType = inferTrainingType(text)
  const workoutDayType = inferWorkoutDayType(text, workoutName)
  const sections = buildSections(lines, text, exerciseCandidates)

  return {
    workout: {
      name: normalizeWhitespace(workoutName),
      program: normalizeWhitespace(programName),
      phase: findLineValue(lines, ['Phase']) || 'Phase 1',
      phaseGoal: 'Tissue remodeling',
      weekNumber: parsePositiveInteger(findLineValue(lines, ['Week', 'Week Number'])),
      dayNumber: parsePositiveInteger(findLineValue(lines, ['Day', 'Day Number', 'Workout Day'])),
      sourceFileName,
      trainingType,
      workoutDayType,
      stressLevel: trainingType === 'Conditioning' ? 'Moderate' : 'High',
      trainingEmphasis: trainingType === 'Conditioning' ? 'Work capacity' : 'Lower-body acceleration',
      numberOfWeeks: 1,
      startDate: '',
      endDate: '',
      notes: `Generated from extracted PDF text: ${sourceFileName}`,
      description: `Generated from extracted PDF text: ${sourceFileName}`,
    },
    sections,
    warnings: createExerciseMatchWarnings(sections),
    rawTextPreview: String(text).slice(0, 2000),
  }
}

function reviseExerciseForPrompt(exercise = {}, prompt = '', exerciseCandidates = []) {
  const normalizedPrompt = String(prompt || '').toLowerCase()
  const wantsRunOnly = /run\s+only/.test(normalizedPrompt) || (/remove\s+fan\s+bike/.test(normalizedPrompt) && /run/.test(normalizedPrompt))
  const exerciseText = [exercise.name, ...(exercise.alternatives ?? [])].filter(Boolean).join(' ').toLowerCase()

  if (wantsRunOnly && /fan\s+bike/.test(exerciseText) && /run/.test(`${exerciseText} ${normalizedPrompt}`)) {
    return {
      ...exercise,
      name: 'Run',
      alternatives: [],
      notes: normalizeWhitespace([exercise.notes, 'Revised to Run only from coach prompt.'].filter(Boolean).join(' ')),
      exerciseMatch: createExerciseMatch('Run', exerciseCandidates),
    }
  }

  return exercise
}

export function reviseAiWorkoutDraft({ draft, prompt = '', exerciseCandidates = [] } = {}) {
  const trimmedPrompt = normalizeWhitespace(prompt)
  if (!draft || typeof draft !== 'object') throw new Error('A draft is required for revision.')
  if (!trimmedPrompt) throw new Error('Enter a revision prompt first.')

  const revisedSections = (draft.sections ?? []).map((section) => ({
    ...section,
    exercises: (section.exercises ?? []).map((exercise) => reviseExerciseForPrompt(exercise, trimmedPrompt, exerciseCandidates)),
  }))
  const revisionWarning = {
    type: 'revision',
    severity: 'info',
    message: `Applied revision: ${trimmedPrompt}`,
  }

  return {
    ...draft,
    workout: {
      ...(draft.workout ?? {}),
      notes: normalizeWhitespace([draft.workout?.notes, `Revised from prompt: ${trimmedPrompt}`].filter(Boolean).join(' ')),
      description: normalizeWhitespace([draft.workout?.description, `Revised from prompt: ${trimmedPrompt}`].filter(Boolean).join(' ')),
    },
    sections: revisedSections,
    warnings: [...createExerciseMatchWarnings(revisedSections), revisionWarning],
  }
}
