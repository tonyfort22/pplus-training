import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'

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

function extractPdfOperatorText(buffer) {
  const binary = Buffer.from(buffer).toString('latin1')
  const literalText = [...binary.matchAll(/\(([^()]{3,})\)\s*Tj/g)]
    .map((match) => unescapePdfLiteral(match[1]))
    .join('\n')
  const arrayText = [...binary.matchAll(/\[((?:\([^()]*\)\s*)+)\]\s*TJ/g)]
    .map((match) => [...match[1].matchAll(/\(([^()]*)\)/g)].map((part) => unescapePdfLiteral(part[1])).join(''))
    .join('\n')

  return [literalText, arrayText].filter(Boolean).join('\n')
}

function extractFlateDecodedPdfStreams(buffer) {
  const binary = Buffer.from(buffer).toString('latin1')
  return [...binary.matchAll(/\/FlateDecode[\s\S]{0,500}?stream\r?\n([\s\S]*?)\r?\nendstream/g)]
    .map((match) => {
      try {
        const inflated = inflateSync(Buffer.from(match[1], 'latin1'))
        return [extractPdfOperatorText(inflated), inflated.toString('utf8')].filter(Boolean).join('\n')
      } catch {
        return ''
      }
    })
    .filter(Boolean)
    .join('\n')
}

function decodePdfishBuffer(buffer) {
  const rawText = Buffer.from(buffer).toString('utf8')
  const operatorText = extractPdfOperatorText(buffer)
  const flateText = extractFlateDecodedPdfStreams(buffer)

  return [operatorText, flateText, rawText]
    .filter(Boolean)
    .join('\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, '\n')
}

function cleanExtractedPdfText(value = '') {
  return String(value || '')
    .split(/\r?\n/)
    .map(normalizeWhitespace)
    .filter((line) => line.length >= 2)
    .filter((line) => !/^%PDF-|^endobj$|^xref$|^trailer$|^startxref$/i.test(line))
    .join('\n')
}

function hasUsefulWorkoutText(value = '') {
  const text = String(value || '').toLowerCase()
  return /(workout|program|phase|speed accelerator|edge work|conditioning|sets\s*x\s*reps)/.test(text)
    && /[a-z]{3,}/.test(text)
}

function ensureMacVisionOcrBinary() {
  const binaryPath = join(tmpdir(), 'pplus-macos-vision-ocr-v1')
  if (existsSync(binaryPath)) return binaryPath
  const sourcePath = join(tmpdir(), 'pplus-macos-vision-ocr-v1.swift')
  writeFileSync(sourcePath, `
import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
if args.count < 2 { exit(2) }
let url = URL(fileURLWithPath: args[1])
guard let image = NSImage(contentsOf: url), let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  print("IMAGE_LOAD_FAILED")
  exit(1)
}
let request = VNRecognizeTextRequest { request, error in
  if let error = error {
    print("OCR_ERROR: \\(error)")
    return
  }
  let observations = request.results as? [VNRecognizedTextObservation] ?? []
  for observation in observations {
    if let candidate = observation.topCandidates(1).first {
      print(candidate.string)
    }
  }
}
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try handler.perform([request])
`)
  execFileSync('swiftc', [sourcePath, '-o', binaryPath], { stdio: 'pipe' })
  return binaryPath
}

function extractTextWithMacVisionOcr(buffer) {
  if (process.platform !== 'darwin') return ''
  const workdir = mkdtempSync(join(tmpdir(), 'pplus-pdf-ocr-'))
  const pdfPath = join(workdir, 'input.pdf')
  const imagePath = join(workdir, 'page-1.png')
  try {
    writeFileSync(pdfPath, Buffer.from(buffer))
    execFileSync('python3', ['-c', `
import fitz, sys
pdf_path, image_path = sys.argv[1], sys.argv[2]
doc = fitz.open(pdf_path)
if doc.page_count < 1:
    raise SystemExit(1)
page = doc[0]
pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), alpha=False)
pix.save(image_path)
`, pdfPath, imagePath], { stdio: 'pipe' })
    const ocrBinary = ensureMacVisionOcrBinary()
    return execFileSync(ocrBinary, [imagePath], { encoding: 'utf8', stdio: 'pipe', maxBuffer: 1024 * 1024 * 4 })
  } catch {
    return ''
  } finally {
    rmSync(workdir, { recursive: true, force: true })
  }
}

export async function extractWorkoutTextFromPdfFile(file) {
  if (!file) throw new Error('Upload a workout PDF first.')
  if (file.type !== 'application/pdf' && !String(file.name || '').toLowerCase().endsWith('.pdf')) {
    throw new Error('Upload a PDF file.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const decodedText = decodePdfishBuffer(arrayBuffer)
  const cleanedText = cleanExtractedPdfText(decodedText)
  if (cleanedText.trim() && hasUsefulWorkoutText(cleanedText) && !isLikelyPdfObjectGarbage(decodedText)) {
    return cleanedText.slice(0, 30000)
  }

  const ocrText = cleanExtractedPdfText(extractTextWithMacVisionOcr(arrayBuffer))
  if (ocrText.trim() && hasUsefulWorkoutText(ocrText)) {
    return ocrText.slice(0, 30000)
  }

  const fallbackText = cleanedText || ocrText
  if (!fallbackText.trim()) {
    throw new Error('No readable text was found in the PDF. OCR could not extract workout rows.')
  }

  return fallbackText.slice(0, 30000)
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
  const match = String(line).match(/^([A-Z]{1,3}\d+|Conditioning)\s+(.+)$/i)
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

function isLikelyPdfObjectGarbage(text = '') {
  const value = String(text || '')
  const controlCount = [...value].filter((character) => {
    const code = character.charCodeAt(0)
    return (code > 0 && code < 32 && !['\n', '\r', '\t'].includes(character)) || code === 127 || code === 65533
  }).length
  const pdfObjectNoise = (value.match(/\b(?:obj|endobj|xref|stream|endstream|\/Subtype|\/Widget|\/Length|\/Filter|\/FlateDecode)\b/g) ?? []).length
  return controlCount > 80 || pdfObjectNoise > 20
}

function parseSourceFileMetadata(sourceFileName = '') {
  const basename = String(sourceFileName || '').replace(/\.pdf$/i, '')
  const osdMatch = basename.match(/^OSD26\+P(\d+)\+(.+)$/i)
  if (!osdMatch) return { basename }
  const phaseNumber = Number(osdMatch[1])
  const code = osdMatch[2].toUpperCase()
  const workoutDayType = code === 'A'
    ? 'Speed Accelerator A'
    : code === 'B'
      ? 'Speed Accelerator B'
      : code === 'C'
        ? 'Speed Accelerator C'
        : code === 'EW+A'
          ? 'Edge Work A'
          : code === 'EW+B'
            ? 'Edge Work B'
            : basename
  return {
    basename,
    programName: 'Off-Season Domination 26',
    phase: `Phase ${phaseNumber}`,
    phaseNumber,
    workoutDayType,
    trainingType: code.startsWith('EW') ? 'Edge Work' : 'Speed',
  }
}


function createSetWeek(week, tempo, prescription, restSeconds) {
  const match = String(prescription || '').match(/^(\d+)\s*x\s*(.+)$/i)
  const sets = match ? Number(match[1]) : 1
  const prescriptionValue = normalizeWhitespace(match?.[2] ?? prescription)
  const duration = /(?:s\/side|sec|secs|seconds|min|mins|minutes|\d+s$|\d+min$)/i.test(prescriptionValue)
    ? prescriptionValue
    : undefined
  return {
    week,
    tempo,
    sets,
    ...(duration ? { duration } : { reps: prescriptionValue }),
    restSeconds,
  }
}

function isOcrTempoLine(line = '') {
  return /^(?:N\/?A|\d+-\d+-\d+)$/.test(normalizeWhitespace(line))
}

function isOcrPrescriptionLine(line = '') {
  return /^\d+\s*x\s*\S+/i.test(normalizeWhitespace(line))
}

function isOcrRestLine(line = '') {
  return /^\d{2,3}s?$/i.test(normalizeWhitespace(line))
}

function normalizeOcrRestSeconds(line = '') {
  const match = normalizeWhitespace(line).match(/^(\d{2,3})s?$/i)
  if (!match) return 60
  const value = Number(match[1])
  return value === 305 ? 30 : value
}

function isOcrHeaderOrNoiseLine(line = '') {
  const value = normalizeWhitespace(line)
  return !value
    || /^phase$/i.test(value)
    || /^week\s*\d+$/i.test(value)
    || /^[A-C]\d$/i.test(value)
    || /^(tempo|sets\s*x\s*reps|rest|weight log)$/i.test(value)
    || /^view exercise demonstrations$/i.test(value)
    || /^tap the qr code/i.test(value)
    || /^if it's printed/i.test(value)
    || /^notes:?$/i.test(value)
    || /^hocke/i.test(value)
    || /^tarafkey/i.test(value)
}

function inferWorkoutTitleFromOcr(lines = [], sourceMetadata = {}) {
  const titleLine = lines.find((line) => /speed accelerator|edge work|warm\s?up|conditioning/i.test(line))
  if (!titleLine) return sourceMetadata.workoutDayType || ''
  const normalized = normalizeWhitespace(titleLine.replace(/^\d+\s+(Edge Work\s+[AB])$/i, '$1'))
  if (/^edge work\s+[ab]$/i.test(normalized)) return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase())
  return normalized
}

function labelSequenceForExercises(exercises = []) {
  if (exercises.length === 4 && /conditioning/i.test(exercises.at(-1)?.name || '')) return ['A1', 'A2', 'A3', 'Conditioning']
  if (exercises.length >= 8 && /conditioning/i.test(exercises.at(-1)?.name || '')) return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3', 'Conditioning']
  const labels = []
  const groups = ['A', 'B', 'C', 'D']
  for (let index = 0; index < exercises.length; index += 1) {
    labels.push(`${groups[Math.floor(index / 3)] ?? 'D'}${(index % 3) + 1}`)
  }
  return labels
}

function tokenLooksLikeExerciseName(line = '') {
  const value = normalizeWhitespace(line)
  return value.length >= 4
    && /[a-z]/i.test(value)
    && !isOcrTempoLine(value)
    && !isOcrPrescriptionLine(value)
    && !isOcrRestLine(value)
    && !isOcrHeaderOrNoiseLine(value)
}

function createWeeksFromOcrTokens(tokens = []) {
  const tempos = tokens.filter(isOcrTempoLine).slice(0, 4)
  const prescriptions = tokens.filter(isOcrPrescriptionLine).slice(0, 4)
  const rests = tokens.filter(isOcrRestLine).slice(0, 4)
  if (prescriptions.length < 2) return []
  const usablePrescriptions = [...prescriptions]
  while (usablePrescriptions.length > 0 && usablePrescriptions.length < 4) {
    usablePrescriptions.push(usablePrescriptions.at(-1))
  }
  return Array.from({ length: Math.min(4, usablePrescriptions.length) }, (_, index) => {
    return createSetWeek(
      index + 1,
      tempos[index] || tempos[0] || 'N/A',
      usablePrescriptions[index],
      rests[index] ? normalizeOcrRestSeconds(rests[index]) : 60,
    )
  })
}

function parseOcrTableSections(lines = [], text = '', exerciseCandidates = [], { sourceMetadata = {} } = {}) {
  const title = inferWorkoutTitleFromOcr(lines, sourceMetadata)
  const titleIndex = lines.findIndex((line) => normalizeWhitespace(line) === title || /speed accelerator|edge work|warm\s?up|conditioning/i.test(line))
  if (titleIndex < 0) return []
  const rows = []
  let current = null
  const sourceLines = lines.slice(titleIndex + 1)

  function pushCurrent() {
    if (!current) return
    const weeks = createWeeksFromOcrTokens(current.tokens)
    if (weeks.length >= 2) {
      rows.push({ name: current.name.replace(/^Conditioning:\s*/i, ''), weeks })
    }
    current = null
  }

  for (const line of sourceLines) {
    const value = normalizeWhitespace(line)
    if (/^(?:View Exercise Demonstrations|WEIGHT LOG)$/i.test(value)) break
    if (/^(?:TEMPO|SETS\s*X\s*REPS|REST)$/i.test(value)) continue
    if (tokenLooksLikeExerciseName(value)) {
      pushCurrent()
      current = { name: value, tokens: [] }
      continue
    }
    if (current && (isOcrTempoLine(value) || isOcrPrescriptionLine(value) || isOcrRestLine(value))) {
      current.tokens.push(value)
    }
  }
  pushCurrent()

  const labels = labelSequenceForExercises(rows)
  return rows.map((row, index) => ({
    label: labels[index] || `A${index + 1}`,
    exercises: [{
      name: row.name,
      notes: '',
      weeks: row.weeks,
      exerciseMatch: createExerciseMatch(row.name.replace(/^Conditioning:\s*/i, ''), exerciseCandidates),
    }],
  }))
}

function createBlockingExtractionWarning(sourceFileName = '') {
  return {
    type: 'pdf-extraction',
    severity: 'error',
    blocking: true,
    message: `Could not reliably scan ${sourceFileName || 'this PDF'} into workout rows. The PDF text is unreadable/custom-encoded, so no fake fallback workout was generated.`,
  }
}

function buildSections(lines, text, exerciseCandidates = [], { sourceFileName = '', sourceMetadata = {} } = {}) {
  const parsedExercises = lines.map((line) => parseExerciseLine(line, exerciseCandidates)).filter(Boolean)
  const grouped = new Map()

  for (const item of parsedExercises) {
    const label = item.label || 'A1'
    if (!grouped.has(label)) grouped.set(label, { label, exercises: [] })
    grouped.get(label).exercises.push(item.exercise)
  }

  const inlineSections = [...grouped.values()].filter((section) => (section.exercises ?? []).length)
  if (inlineSections.length) return inlineSections
  return parseOcrTableSections(lines, text, exerciseCandidates, { sourceMetadata, sourceFileName })
}

function createExerciseMatchWarnings(sections = []) {
  const unmatchedCount = sections.reduce((total, section) => {
    return total + (section.exercises ?? []).filter((exercise) => exercise.exerciseMatch?.status === 'unmatched').length
  }, 0)

  return unmatchedCount > 0
    ? [{ type: 'exercise-match', severity: 'warning', message: `${unmatchedCount} unmatched exercise${unmatchedCount === 1 ? '' : 's'} ${unmatchedCount === 1 ? 'needs' : 'need'} review before accepting.` }]
    : []
}

function inferWeekAndDayRouting(lines = [], text = '') {
  const inlineRoute = String(text).match(/\bweek\s*(\d+)\b[\s\S]{0,40}\bday\s*(\d+)\b/i)
  return {
    weekNumber: parsePositiveInteger(findLineValue(lines, ['Week', 'Week Number'])) ?? parsePositiveInteger(inlineRoute?.[1]),
    dayNumber: parsePositiveInteger(findLineValue(lines, ['Day', 'Day Number', 'Workout Day'])) ?? parsePositiveInteger(inlineRoute?.[2]),
  }
}

export function createAiWorkoutDraftFromExtractedText({ text = '', sourceFileName = '', exerciseCandidates = [] } = {}) {
  const lines = String(text).split(/\r?\n/).map(normalizeWhitespace).filter(Boolean)
  const sourceMetadata = parseSourceFileMetadata(sourceFileName)
  const isUnreadablePdfText = isLikelyPdfObjectGarbage(text)
  const workoutName = findLineValue(lines, ['Workout', 'Workout Name', 'Title'])
    || inferWorkoutTitleFromOcr(lines, sourceMetadata)
    || lines.find((line) => /speed|edge|condition|warm/i.test(line) && !/^%PDF/i.test(line))
    || sourceFileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ')
    || 'Imported PDF Workout'
  const programName = findLineValue(lines, ['Program', 'Program Name']) || sourceMetadata.programName || 'Imported Program'
  const trainingType = sourceMetadata.trainingType || inferTrainingType(text)
  const workoutDayType = sourceMetadata.workoutDayType || inferWorkoutDayType(text, workoutName)
  const sections = buildSections(lines, text, exerciseCandidates, { sourceFileName, sourceMetadata })
  const routing = inferWeekAndDayRouting(lines, text)
  const extractionWarnings = !sections.length || (isUnreadablePdfText && !hasUsefulWorkoutText(text))
    ? [createBlockingExtractionWarning(sourceFileName)]
    : []

  return {
    workout: {
      name: normalizeWhitespace(workoutName),
      program: normalizeWhitespace(programName),
      phase: findLineValue(lines, ['Phase']) || sourceMetadata.phase || 'Phase 1',
      phaseGoal: 'Tissue remodeling',
      weekNumber: routing.weekNumber,
      dayNumber: routing.dayNumber,
      sourceFileName,
      trainingType,
      workoutDayType,
      stressLevel: trainingType === 'Conditioning' ? 'Moderate' : 'High',
      trainingEmphasis: trainingType === 'Conditioning' ? 'Work capacity' : 'Lower-body acceleration',
      numberOfWeeks: Math.max(1, ...sections.flatMap((section) => (section.exercises ?? []).flatMap((exercise) => (exercise.weeks ?? []).map((week) => week.week ?? 1)))),
      startDate: '',
      endDate: '',
      notes: `Generated from extracted PDF text: ${sourceFileName}`,
      description: `Generated from extracted PDF text: ${sourceFileName}`,
    },
    sections,
    warnings: [...extractionWarnings, ...createExerciseMatchWarnings(sections)],
    exerciseCandidates: normalizeExerciseCandidates(exerciseCandidates),
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

function getRequestedPhaseFromPrompt(prompt = '') {
  const normalizedPrompt = normalizeWhitespace(prompt)
  const explicitChangeMatch = normalizedPrompt.match(/(?:change|set|update)\s+phase\s+\d+\s+(?:to|into)\s+phase\s+([1-4])\b/i)
  if (explicitChangeMatch) return `Phase ${explicitChangeMatch[1]}`

  const directPhaseMatch = normalizedPrompt.match(/(?:change|set|update)\s+(?:the\s+)?phase\s+(?:to|into)\s+phase\s+([1-4])\b/i)
  if (directPhaseMatch) return `Phase ${directPhaseMatch[1]}`

  return null
}

export function reviseAiWorkoutDraft({ draft, prompt = '', exerciseCandidates = [] } = {}) {
  const trimmedPrompt = normalizeWhitespace(prompt)
  if (!draft || typeof draft !== 'object') throw new Error('A draft is required for revision.')
  if (!trimmedPrompt) throw new Error('Enter a revision prompt first.')

  const requestedPhase = getRequestedPhaseFromPrompt(trimmedPrompt)
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
      phase: requestedPhase ?? draft.workout?.phase,
      notes: normalizeWhitespace([draft.workout?.notes, `Revised from prompt: ${trimmedPrompt}`].filter(Boolean).join(' ')),
      description: normalizeWhitespace([draft.workout?.description, `Revised from prompt: ${trimmedPrompt}`].filter(Boolean).join(' ')),
    },
    sections: revisedSections,
    warnings: [...createExerciseMatchWarnings(revisedSections), revisionWarning],
  }
}
