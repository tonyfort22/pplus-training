function toSafeString(value) {
  return typeof value === 'string' ? value : ''
}

function normalizeSet(setValues = {}, setIndex = 0) {
  return {
    id: toSafeString(setValues.id) || `ai-set-${setIndex + 1}`,
    tempo: toSafeString(setValues.tempo),
    effort: toSafeString(setValues.effort),
    side: toSafeString(setValues.side),
    duration: toSafeString(setValues.duration),
    distance: toSafeString(setValues.distance),
    rest: toSafeString(setValues.rest),
    reps: toSafeString(setValues.reps),
  }
}

function normalizeExercise(exercise = {}, exerciseIndex = 0) {
  const sets = Array.isArray(exercise.sets) ? exercise.sets : []

  return {
    id: toSafeString(exercise.id) || `ai-exercise-${exerciseIndex + 1}`,
    title: toSafeString(exercise.title) || `Exercise ${exerciseIndex + 1}`,
    thumbnailUrl: toSafeString(exercise.thumbnailUrl),
    isExpanded: Boolean(exercise.isExpanded),
    showInstruction: Boolean(exercise.showInstruction),
    instruction: toSafeString(exercise.instruction),
    sets: sets.map(normalizeSet),
  }
}

function normalizeSection(section = {}, sectionIndex = 0) {
  const label = toSafeString(section.label) || `A${sectionIndex + 1}`
  const exercises = Array.isArray(section.exercises) ? section.exercises : []

  return {
    id: toSafeString(section.id) || `section-${label.toLowerCase()}`,
    label,
    isExpanded: Boolean(section.isExpanded),
    showInstruction: Boolean(section.showInstruction),
    instruction: toSafeString(section.instruction),
    draftExerciseQuery: toSafeString(section.draftExerciseQuery),
    exercises: exercises.map(normalizeExercise),
  }
}

export function normalizeTrainingSections(sections) {
  if (!Array.isArray(sections)) return []
  return sections.map(normalizeSection)
}

export function validateTrainingSections(sections) {
  if (!Array.isArray(sections)) {
    return { valid: false, error: 'Training sections must be an array.' }
  }

  for (const section of sections) {
    if (!section || typeof section !== 'object') return { valid: false, error: 'Every section must be an object.' }
    if (!Array.isArray(section.exercises)) return { valid: false, error: 'Every section needs an exercises array.' }

    for (const exercise of section.exercises) {
      if (!exercise || typeof exercise !== 'object') return { valid: false, error: 'Every exercise must be an object.' }
      if (!Array.isArray(exercise.sets)) return { valid: false, error: 'Every exercise needs a sets array.' }
    }
  }

  return { valid: true, error: '' }
}

function createWarmupSection() {
  return {
    id: 'section-ai-warmup',
    label: 'Warmup',
    isExpanded: false,
    showInstruction: false,
    instruction: 'AI draft warmup. Review before saving.',
    draftExerciseQuery: '',
    exercises: [],
  }
}

function titleCaseLabel(value) {
  return toSafeString(value)
    .trim()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function sectionMatches(section, match = {}) {
  const sectionLabel = toSafeString(section?.label).toLowerCase()
  const sectionId = toSafeString(section?.id).toLowerCase()
  const matchLabel = toSafeString(match.label).toLowerCase()

  if (!matchLabel) return false
  if (isWarmupLabel(matchLabel)) {
    return isWarmupLabel(sectionLabel) || isWarmupLabel(sectionId)
  }

  return sectionLabel === matchLabel || sectionId === matchLabel
}

function isWarmupLabel(value) {
  return /\b(warmup|warm-up|warm\s+up|prep|primer)\b/.test(toSafeString(value).toLowerCase())
}

function instructionMentionsWarmupTarget(instructionLower) {
  return isWarmupLabel(instructionLower)
    || /\bactivation\s+(?:block|section)\b/.test(instructionLower)
    || /\bactivation\s+at\s+the\s+start\b/.test(instructionLower)
}

function normalizeRestValue(value) {
  const trimmed = toSafeString(value).trim()
  if (!trimmed) return ''
  const numberWords = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
  }
  const match = trimmed.match(/^(\d+|one|two|three|four|five)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes)?$/i)
  if (!match) return trimmed
  const amount = numberWords[match[1].toLowerCase()] || match[1]
  const unit = match[2]?.toLowerCase() || 'sec'
  return unit.startsWith('m') ? `${amount} min` : `${amount} sec`
}

function parseRestValue(instruction) {
  const match = instruction.match(/(?:set|make|change|update)?\s*(?:all\s+)?rest(?:\s+(?:to|as|at|should\s+be))?\s+(\d+\s*(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes)?)/i)
    || instruction.match(/(?:give|make|set)\s+(?:every|all)\s+sets?\s+(\d+\s*(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes)?)\s+rest/i)
    || instruction.match(/(?:rest|recovery)\s+(?:between\s+sets?|between\s+each\s+set)?\s*(?:should\s+be|to|at|as)\s+(\d+\s*(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes)?)/i)
    || instruction.match(/(?:put|add|give)\s+(?:them\s+)?((?:\d+|one|two|three|four|five)\s*(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes)?)\s+(?:rest|recovery)?\s*between\s+(?:each\s+)?sets?/i)
  return match ? normalizeRestValue(match[1]) : ''
}

function parseEffortValue(instruction) {
  const match = instruction.match(/(?:make|set|change|update)\s+(?:all\s+)?effort(?:\s+values?)?(?:\s+(?:to|as|at))?\s+(\d+(?:\.\d+)?)/i)
    || instruction.match(/(?:effort|intensity|rpe)(?:\s+values?)?\s+(?:should\s+be|to|at|as)\s+(\d+(?:\.\d+)?)(?:\s+(?:for|across)\s+(?:all\s+)?sets?)?/i)
    || instruction.match(/(?:set|make|change|update)\s+(?:the\s+)?(?:whole\s+)?(?:workout|session)?\s*(?:effort|intensity|rpe)(?:\s+(?:across\s+(?:the\s+)?(?:whole\s+)?(?:workout|session)))?\s*(?:to|at|as)?\s+(\d+(?:\.\d+)?)/i)
    || instruction.match(/(?:effort|intensity|rpe)\s+(?:across\s+(?:the\s+)?(?:whole\s+)?(?:workout|session))\s+(?:to|at|as)\s+(\d+(?:\.\d+)?)/i)
  return match ? match[1] : ''
}

function parseRenameSectionAction(instruction) {
  const sectionTargetPattern = '([a-z]\\d+|warmup|warm-up|warm\\s+up|prep|primer)'
  const match = instruction.match(new RegExp(`rename\\s+(?:section\\s+)?${sectionTargetPattern}\\s+to\\s+([a-z0-9][a-z0-9\\s-]*?)(?:[,.]|\\s+and\\s+|$)`, 'i'))
    || instruction.match(/call\s+(?:the\s+)?(?:section\s+)?([a-z]\d+|warmup|warm-up|warm\s+up)\s+([a-z0-9][a-z0-9\s-]*?)(?:[,.]|\s+and\s+|$)/i)
    || instruction.match(new RegExp(`change\\s+(?:section\\s+)?${sectionTargetPattern}\\s+name\\s+to\\s+([a-z0-9][a-z0-9\\s-]*?)(?:[,.]|\\s+and\\s+|$)`, 'i'))
    || instruction.match(new RegExp(`label\\s+(?:section\\s+)?${sectionTargetPattern}\\s+as\\s+([a-z0-9][a-z0-9\\s-]*?)(?:[,.]|\\s+and\\s+|$)`, 'i'))
  if (!match) return null

  return {
    type: 'rename_section',
    match: { label: titleCaseLabel(match[1]) },
    values: { label: titleCaseLabel(match[2]) },
  }
}

function trimExerciseTitle(value) {
  return titleCaseLabel(toSafeString(value).replace(/^the\s+exercise\s+/i, ''))
}

function parseNamedExerciseUpdateAction(instruction) {
  const restMatch = instruction.match(/(?:rest|recovery|rest\s+time)(?:\s+(?:time|for\s+sets?))?\s*(?:should\s+be|to|at|as)?\s+(\d+\s*(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes)?)\s+(?:for|in)\s+(?:all\s+sets\s+)?(?:in\s+)?(?:the\s+)?(?:exercise\s+)?([a-z0-9][a-z0-9\s'-]*?)(?:[,.]|\s+and\s+|$)/i)

  if (!restMatch) return null

  return {
    type: 'update_exercise_sets',
    match: { title: trimExerciseTitle(restMatch[2]) },
    values: { rest: normalizeRestValue(restMatch[1]) },
  }
}

function instructionHasDeleteIntent(instructionLower) {
  return /\b(delete|remove|clear|drop)\b|\btake\s+out\b|\bget\s+rid\s+of\b/.test(instructionLower)
}

function instructionHasAddIntent(instructionLower) {
  return /\b(add|create|insert|include|put)\b/.test(instructionLower)
}

export function parseWorkoutTrainingAiActions(instruction) {
  const normalizedInstruction = toSafeString(instruction).trim()
  if (!normalizedInstruction) return []

  const instructionLower = normalizedInstruction.toLowerCase()
  const actions = []
  const mentionsWarmup = instructionMentionsWarmupTarget(instructionLower)

  const namedExerciseUpdateAction = parseNamedExerciseUpdateAction(normalizedInstruction)
  if (namedExerciseUpdateAction) actions.push(namedExerciseUpdateAction)

  if (mentionsWarmup && instructionHasDeleteIntent(instructionLower)) {
    actions.push({ type: 'delete_section', match: { label: 'Warmup' } })
  } else if (mentionsWarmup && instructionHasAddIntent(instructionLower)) {
    actions.push({ type: 'add_section', section: { label: 'Warmup' }, position: 'start' })
  }

  const restValue = namedExerciseUpdateAction ? '' : parseRestValue(normalizedInstruction)
  const effortValue = parseEffortValue(normalizedInstruction)
  const setValues = {}
  if (restValue) setValues.rest = restValue
  if (effortValue) setValues.effort = effortValue
  if (Object.keys(setValues).length > 0) {
    actions.push({ type: 'update_all_sets', values: setValues })
  }

  const renameSectionAction = parseRenameSectionAction(normalizedInstruction)
  if (renameSectionAction) actions.push(renameSectionAction)

  return actions
}

function applyAddSectionAction(sections, action) {
  const label = titleCaseLabel(action.section?.label)
  const section = label.toLowerCase() === 'warmup' ? createWarmupSection() : normalizeSection({ label }, sections.length)
  const alreadyExists = sections.some((currentSection) => sectionMatches(currentSection, { label }))

  if (alreadyExists) {
    return { nextSections: sections, summary: `${label} section already exists.` }
  }

  if (action.position === 'start') {
    return { nextSections: [section, ...sections], summary: `Added a ${label.toLowerCase()} section before the current training sections.` }
  }

  return { nextSections: [...sections, section], summary: `Added ${label} section.` }
}

function applyDeleteSectionAction(sections, action) {
  const nextSections = sections.filter((section) => !sectionMatches(section, action.match))
  const deletedCount = sections.length - nextSections.length
  const label = titleCaseLabel(action.match?.label)

  return {
    nextSections,
    summary: deletedCount > 0 ? `Deleted the ${label.toLowerCase()} section.` : `No ${label.toLowerCase()} section was found to delete.`,
  }
}

function applyRenameSectionAction(sections, action) {
  let didRename = false
  const oldLabel = titleCaseLabel(action.match?.label)
  const newLabel = titleCaseLabel(action.values?.label)
  const nextSections = sections.map((section) => {
    if (!didRename && sectionMatches(section, action.match)) {
      didRename = true
      return { ...section, label: newLabel }
    }

    return section
  })

  return {
    nextSections,
    summary: didRename ? `Renamed section ${oldLabel} to ${newLabel}.` : `No ${oldLabel} section was found to rename.`,
  }
}

function applyUpdateAllSetsAction(sections, action) {
  const values = action.values || {}
  const nextSections = sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((setValues) => ({
        ...setValues,
        ...values,
      })),
    })),
  }))

  return { nextSections, summary: 'Updated all sets.' }
}

function exerciseMatches(exercise, match = {}) {
  const exerciseTitle = toSafeString(exercise?.title).toLowerCase()
  const exerciseId = toSafeString(exercise?.id).toLowerCase()
  const matchTitle = toSafeString(match.title).toLowerCase()

  if (!matchTitle) return false
  return exerciseTitle === matchTitle || exerciseId === matchTitle || exerciseTitle.includes(matchTitle)
}

function applyUpdateExerciseSetsAction(sections, action) {
  const values = action.values || {}
  const targetTitle = titleCaseLabel(action.match?.title)
  let didUpdate = false

  const nextSections = sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((exercise) => {
      if (!exerciseMatches(exercise, action.match)) return exercise

      didUpdate = true
      return {
        ...exercise,
        sets: exercise.sets.map((setValues) => ({
          ...setValues,
          ...values,
        })),
      }
    }),
  }))

  return {
    nextSections,
    summary: didUpdate ? `Updated all sets for ${targetTitle}.` : `No ${targetTitle} exercise was found to update.`,
  }
}

export function applyWorkoutTrainingAiActions(sections, actions) {
  const normalizedSections = normalizeTrainingSections(sections)
  const summaries = []
  const warnings = []
  let nextTrainingSections = normalizedSections

  for (const action of actions) {
    let result = null

    if (action.type === 'add_section') result = applyAddSectionAction(nextTrainingSections, action)
    if (action.type === 'delete_section') result = applyDeleteSectionAction(nextTrainingSections, action)
    if (action.type === 'rename_section') result = applyRenameSectionAction(nextTrainingSections, action)
    if (action.type === 'update_all_sets') result = applyUpdateAllSetsAction(nextTrainingSections, action)
    if (action.type === 'update_exercise_sets') result = applyUpdateExerciseSetsAction(nextTrainingSections, action)

    if (result) {
      nextTrainingSections = result.nextSections
      summaries.push(result.summary)
    } else {
      warnings.push(`Unsupported action: ${action.type}`)
    }
  }

  return { nextTrainingSections, summaries, warnings }
}

export function createWorkoutTrainingAiEdit({ instruction, trainingSections, workoutContext = {} }) {
  const normalizedInstruction = toSafeString(instruction).trim()
  const normalizedSections = normalizeTrainingSections(trainingSections)
  const validation = validateTrainingSections(normalizedSections)

  if (!normalizedInstruction) {
    return {
      ok: false,
      error: 'Describe the workout changes you want AI to make.',
      summary: '',
      actions: [],
      nextTrainingSections: normalizedSections,
      warnings: [],
    }
  }

  if (!validation.valid) {
    return {
      ok: false,
      error: validation.error,
      summary: '',
      actions: [],
      nextTrainingSections: normalizedSections,
      warnings: [],
    }
  }

  const workoutName = toSafeString(workoutContext.name)
  const actions = parseWorkoutTrainingAiActions(normalizedInstruction)

  if (actions.length === 0) {
    return {
      ok: true,
      summary: 'No deterministic edit matched this instruction yet. The current training plan is unchanged.',
      actions,
      nextTrainingSections: normalizedSections,
      warnings: ['This structured action pass supports add/delete/rename section, all-set rest/effort edits, and named-exercise set edits while the real AI generator is still offline.'],
      workoutName,
    }
  }

  const appliedEdit = applyWorkoutTrainingAiActions(normalizedSections, actions)

  return {
    ok: true,
    summary: appliedEdit.summaries.join(' '),
    actions,
    nextTrainingSections: appliedEdit.nextTrainingSections,
    warnings: [
      ...appliedEdit.warnings,
      'AI generation is not connected yet; this deterministic preview handled the recognized instruction.',
    ],
    workoutName,
  }
}
