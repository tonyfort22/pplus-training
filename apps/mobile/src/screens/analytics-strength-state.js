export function normalizeStrengthExerciseName(value) {
  return String(value || '').trim().toLowerCase()
}

const STRENGTH_SELECTION_STORAGE_KEY = 'pplus-analytics-strength-selection-v1'
let inMemoryStrengthSelectionStorageState = null

function createMemoryStrengthSelectionStorage(initialValue = '') {
  let storedValue = initialValue
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
}

function createBrowserStrengthSelectionStorage(key = STRENGTH_SELECTION_STORAGE_KEY) {
  return {
    async getItem() {
      return globalThis.localStorage.getItem(key)
    },
    async setItem(value) {
      globalThis.localStorage.setItem(key, value)
      return value
    },
    async removeItem() {
      globalThis.localStorage.removeItem(key)
    },
  }
}

function createSecureStoreStrengthSelectionStorage(secureStore, key = STRENGTH_SELECTION_STORAGE_KEY) {
  return {
    async getItem() {
      return secureStore.getItemAsync(key)
    },
    async setItem(value) {
      await secureStore.setItemAsync(key, value)
      return value
    },
    async removeItem() {
      await secureStore.deleteItemAsync(key)
    },
  }
}

async function loadExpoSecureStore() {
  try {
    return await import('expo-secure-store')
  } catch {
    return null
  }
}

export async function resolveStrengthSelectionStorage({ storage = null, key = STRENGTH_SELECTION_STORAGE_KEY } = {}) {
  if (storage) return storage

  if (typeof globalThis.localStorage !== 'undefined') {
    return createBrowserStrengthSelectionStorage(key)
  }

  const secureStore = await loadExpoSecureStore()
  if (secureStore?.getItemAsync && secureStore?.setItemAsync && secureStore?.deleteItemAsync) {
    return createSecureStoreStrengthSelectionStorage(secureStore, key)
  }

  if (!inMemoryStrengthSelectionStorageState) {
    inMemoryStrengthSelectionStorageState = createMemoryStrengthSelectionStorage()
  }

  return inMemoryStrengthSelectionStorageState
}

function buildComparableStrengthExerciseName(value) {
  return normalizeStrengthExerciseName(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(barbell|dumbbell|db|kettlebell|kb|bb)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasComparableStrengthExerciseAlias(leftName, rightName) {
  const normalizedLeftName = buildComparableStrengthExerciseName(leftName)
  const normalizedRightName = buildComparableStrengthExerciseName(rightName)
  if (!normalizedLeftName || !normalizedRightName) return false
  if (normalizedLeftName === normalizedRightName) return true

  const leftTokens = normalizedLeftName.split(' ').filter(Boolean)
  const rightTokens = normalizedRightName.split(' ').filter(Boolean)
  const shorterName = normalizedLeftName.length <= normalizedRightName.length ? normalizedLeftName : normalizedRightName
  const longerName = shorterName === normalizedLeftName ? normalizedRightName : normalizedLeftName
  const shorterTokens = shorterName === normalizedLeftName ? leftTokens : rightTokens
  const longerTokens = shorterName === normalizedLeftName ? rightTokens : leftTokens

  if (shorterTokens.length < 2 || longerTokens.length < 2) return false

  return longerName.startsWith(`${shorterName} `)
    || longerName.endsWith(` ${shorterName}`)
    || longerName.includes(` ${shorterName} `)
}

export function getInitialStrengthSelectionIds({ defaultStrengthExerciseIds = [], strengthCards = [] } = {}) {
  if (defaultStrengthExerciseIds.length) {
    return defaultStrengthExerciseIds.slice(0, 2)
  }

  return strengthCards.map((card) => card.exerciseId || card.id).slice(0, 2)
}

export function copyAppliedToDraft(appliedStrengthExerciseIds = []) {
  return [...appliedStrengthExerciseIds]
}

export function toggleStrengthExerciseDraft({ draftStrengthExerciseIds = [], exerciseId, maxSelections = 4 } = {}) {
  if (!exerciseId) return [...draftStrengthExerciseIds]

  const isSelected = draftStrengthExerciseIds.includes(exerciseId)
  if (isSelected) {
    return draftStrengthExerciseIds.filter((selectedExerciseId) => selectedExerciseId !== exerciseId)
  }

  if (draftStrengthExerciseIds.length >= maxSelections) {
    return [...draftStrengthExerciseIds]
  }

  return [...draftStrengthExerciseIds, exerciseId]
}

export function applyStrengthExerciseDraft(draftStrengthExerciseIds = []) {
  return [...new Set(draftStrengthExerciseIds)]
}

export function getDefaultSyncedStrengthSelection({ hasAppliedCustomStrengthFilter = false, defaultStrengthExerciseIds = [] } = {}) {
  if (hasAppliedCustomStrengthFilter) return null

  const nextSelectionIds = applyStrengthExerciseDraft(defaultStrengthExerciseIds)
  return {
    appliedStrengthExerciseIds: nextSelectionIds,
    draftStrengthExerciseIds: nextSelectionIds,
  }
}

export function getInitialStrengthSelectionState({ defaultStrengthExerciseIds = [] } = {}) {
  const nextDefaultSelectionIds = applyStrengthExerciseDraft(defaultStrengthExerciseIds)
  return {
    appliedStrengthExerciseIds: nextDefaultSelectionIds,
    draftStrengthExerciseIds: copyAppliedToDraft(nextDefaultSelectionIds),
    appliedStrengthExercises: [],
    hasAppliedCustomStrengthFilter: false,
  }
}

function sanitizeAppliedStrengthExercises(appliedStrengthExercises = []) {
  return appliedStrengthExercises
    .map((exercise) => ({
      id: String(exercise?.id || '').trim(),
      name: String(exercise?.name || '').trim(),
      thumbnailUrl: exercise?.thumbnailUrl || null,
      metricExerciseId: exercise?.metricExerciseId || null,
    }))
    .filter((exercise) => exercise.id && exercise.name)
}

function parseStoredStrengthSelectionSnapshot(rawValue) {
  if (!rawValue) return {}

  try {
    const parsedValue = JSON.parse(rawValue)
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {}
  } catch {
    return {}
  }
}

export async function readStoredStrengthSelectionState({ storage, selectionKey, defaultStrengthExerciseIds = [] } = {}) {
  const normalizedSelectionKey = String(selectionKey || '').trim()
  if (!normalizedSelectionKey) {
    return getInitialStrengthSelectionState({ defaultStrengthExerciseIds })
  }

  const rawValue = await storage?.getItem?.()
  const snapshotBySelectionKey = parseStoredStrengthSelectionSnapshot(rawValue)
  const persistedSelectionState = snapshotBySelectionKey[normalizedSelectionKey] || null
  if (!persistedSelectionState) {
    return getInitialStrengthSelectionState({ defaultStrengthExerciseIds })
  }

  const nextAppliedStrengthExerciseIds = applyStrengthExerciseDraft(persistedSelectionState.appliedStrengthExerciseIds || [])
  return {
    appliedStrengthExerciseIds: nextAppliedStrengthExerciseIds,
    draftStrengthExerciseIds: copyAppliedToDraft(nextAppliedStrengthExerciseIds),
    appliedStrengthExercises: sanitizeAppliedStrengthExercises(persistedSelectionState.appliedStrengthExercises || []),
    hasAppliedCustomStrengthFilter: Boolean(persistedSelectionState.hasAppliedCustomStrengthFilter),
  }
}

export async function writeStoredStrengthSelectionState({ storage, selectionKey, appliedStrengthExerciseIds = [], appliedStrengthExercises = [], hasAppliedCustomStrengthFilter = false } = {}) {
  const normalizedSelectionKey = String(selectionKey || '').trim()
  if (!normalizedSelectionKey || !storage?.setItem) return

  const rawValue = await storage.getItem()
  const snapshotBySelectionKey = parseStoredStrengthSelectionSnapshot(rawValue)
  snapshotBySelectionKey[normalizedSelectionKey] = {
    appliedStrengthExerciseIds: applyStrengthExerciseDraft(appliedStrengthExerciseIds),
    appliedStrengthExercises: sanitizeAppliedStrengthExercises(appliedStrengthExercises),
    hasAppliedCustomStrengthFilter: Boolean(hasAppliedCustomStrengthFilter),
  }

  await storage.setItem(JSON.stringify(snapshotBySelectionKey))
}

export async function clearStoredStrengthSelectionState({ storage, selectionKey } = {}) {
  const normalizedSelectionKey = String(selectionKey || '').trim()
  if (!normalizedSelectionKey || !storage?.setItem) return

  const rawValue = await storage.getItem()
  const snapshotBySelectionKey = parseStoredStrengthSelectionSnapshot(rawValue)
  delete snapshotBySelectionKey[normalizedSelectionKey]

  if (Object.keys(snapshotBySelectionKey).length === 0) {
    await storage.removeItem?.()
    return
  }

  await storage.setItem(JSON.stringify(snapshotBySelectionKey))
}

export function reconcileStrengthExerciseSelectionIds(exerciseIds, {
  strengthExerciseOptionById,
  strengthExerciseOptionByMetricExerciseId,
  metricCardByLibraryId,
  metricCardByExerciseName,
  strengthExerciseOptionByName,
} = {}) {
  const nextExerciseIds = []
  const seenExerciseIds = new Set()

  for (const exerciseId of exerciseIds || []) {
    if (!exerciseId) continue

    const exactExercise = strengthExerciseOptionById?.get(exerciseId) || null
    const linkedMetricExercise = strengthExerciseOptionByMetricExerciseId?.get(exerciseId) || null
    const metricCard = exactExercise
      ? metricCardByLibraryId?.get(exactExercise.metricExerciseId || exactExercise.id)
        || metricCardByExerciseName?.get(normalizeStrengthExerciseName(exactExercise.name))
        || null
      : metricCardByLibraryId?.get(exerciseId) || null
    const matchedExercise = exactExercise
      || linkedMetricExercise
      || strengthExerciseOptionByName?.get(normalizeStrengthExerciseName(metricCard?.exerciseName))
      || null

    if (!matchedExercise?.id || seenExerciseIds.has(matchedExercise.id)) continue

    seenExerciseIds.add(matchedExercise.id)
    nextExerciseIds.push(matchedExercise.id)
  }

  return nextExerciseIds
}

export function reconcileAppliedStrengthExerciseSelectionIds(exerciseIds, {
  strengthExerciseOptionById,
  strengthExerciseOptionByMetricExerciseId,
  metricCardByLibraryId,
  metricCardByExerciseName,
} = {}) {
  const nextExerciseIds = []
  const seenExerciseIds = new Set()

  for (const exerciseId of exerciseIds || []) {
    if (!exerciseId) continue

    const exactExercise = strengthExerciseOptionById?.get(exerciseId) || null
    const linkedMetricExercise = strengthExerciseOptionByMetricExerciseId?.get(exerciseId) || null
    const metricCard = exactExercise
      ? metricCardByLibraryId?.get(exactExercise.metricExerciseId || exactExercise.id)
        || metricCardByExerciseName?.get(normalizeStrengthExerciseName(exactExercise.name))
        || null
      : metricCardByLibraryId?.get(exerciseId)
        || metricCardByExerciseName?.get(normalizeStrengthExerciseName(linkedMetricExercise?.name))
        || null

    const matchedMetricExerciseId = exactExercise?.metricExerciseId
      || linkedMetricExercise?.metricExerciseId
      || metricCard?.exerciseId
      || metricCard?.id
      || null

    if (!matchedMetricExerciseId || seenExerciseIds.has(matchedMetricExerciseId)) continue

    seenExerciseIds.add(matchedMetricExerciseId)
    nextExerciseIds.push(matchedMetricExerciseId)
  }

  return nextExerciseIds
}

function findMetricCardForExerciseOption(exercise, strengthCards = []) {
  if (!exercise) return null

  const exactMetricCard = strengthCards.find((card) => (card.exerciseId || card.id) === exercise.metricExerciseId)
    || strengthCards.find((card) => (card.exerciseId || card.id) === exercise.id)
    || null
  if (exactMetricCard) return exactMetricCard

  const normalizedExerciseName = normalizeStrengthExerciseName(exercise.name)
  const exactNameMetricCard = strengthCards.find((card) => normalizeStrengthExerciseName(card.exerciseName) === normalizedExerciseName) || null
  if (exactNameMetricCard) return exactNameMetricCard

  const comparableExerciseName = buildComparableStrengthExerciseName(exercise.name)
  if (!comparableExerciseName) return null

  const comparableMetricCard = strengthCards.find((card) => buildComparableStrengthExerciseName(card.exerciseName) === comparableExerciseName)
    || strengthCards.find((card) => {
      return hasComparableStrengthExerciseAlias(exercise.name, card.exerciseName)
    })
    || null

  return comparableMetricCard
}

export function buildStrengthExerciseOptions({ strengthExerciseLibraryItems = [], strengthCards = [] } = {}) {
  if (!strengthExerciseLibraryItems.length) {
    return strengthCards.map((card) => ({
      id: card.exerciseId || card.id,
      name: card.exerciseName,
      thumbnailUrl: card.thumbnailUrl || null,
      metricExerciseId: card.exerciseId || card.id,
    }))
  }

  const enrichedStrengthExerciseLibraryItems = strengthExerciseLibraryItems.map((exercise) => {
    const metricCard = findMetricCardForExerciseOption(exercise, strengthCards)
    return {
      ...exercise,
      metricExerciseId: metricCard?.exerciseId || metricCard?.id || null,
    }
  })

  const seenMetricExerciseIds = new Set(enrichedStrengthExerciseLibraryItems.map((exercise) => exercise.metricExerciseId).filter(Boolean))
  const seenExerciseIds = new Set(enrichedStrengthExerciseLibraryItems.map((exercise) => exercise.id))
  const seenComparableNames = new Set(enrichedStrengthExerciseLibraryItems.map((exercise) => buildComparableStrengthExerciseName(exercise.name)).filter(Boolean))
  const missingMetricExercises = strengthCards
    .map((card) => ({
      id: card.exerciseId || card.id,
      name: card.exerciseName,
      thumbnailUrl: card.thumbnailUrl || null,
      metricExerciseId: card.exerciseId || card.id,
    }))
    .filter((exercise) => !seenMetricExerciseIds.has(exercise.metricExerciseId)
      && !seenExerciseIds.has(exercise.id)
      && !seenComparableNames.has(buildComparableStrengthExerciseName(exercise.name)))

  return [...enrichedStrengthExerciseLibraryItems, ...missingMetricExercises]
}

export function buildVisibleStrengthCards({
  appliedStrengthExerciseIds = [],
  strengthExerciseOptions = [],
  strengthCards = [],
  appliedStrengthExercises = [],
} = {}) {
  const fallbackAppliedStrengthExercises = sanitizeAppliedStrengthExercises(appliedStrengthExercises)
  const mergedStrengthExerciseOptions = [...strengthExerciseOptions]
  const seenStrengthExerciseOptionIds = new Set(strengthExerciseOptions.map((exercise) => exercise.id))
  for (const exercise of fallbackAppliedStrengthExercises) {
    if (seenStrengthExerciseOptionIds.has(exercise.id)) continue
    seenStrengthExerciseOptionIds.add(exercise.id)
    mergedStrengthExerciseOptions.push(exercise)
  }

  const strengthExerciseOptionById = new Map(mergedStrengthExerciseOptions.map((exercise) => [exercise.id, exercise]))
  const strengthExerciseOptionByMetricExerciseId = new Map(
    mergedStrengthExerciseOptions
      .filter((exercise) => exercise.metricExerciseId)
      .map((exercise) => [exercise.metricExerciseId, exercise])
  )
  const strengthExerciseOptionByComparableName = new Map(
    mergedStrengthExerciseOptions
      .map((exercise) => [buildComparableStrengthExerciseName(exercise.name), exercise])
      .filter(([name]) => name)
  )
  const metricCardByExerciseId = new Map(strengthCards.map((card) => [card.exerciseId || card.id, card]))

  return appliedStrengthExerciseIds
    .map((exerciseId) => {
      const metricCard = metricCardByExerciseId.get(exerciseId) || null
      const selectedExercise = strengthExerciseOptionById.get(exerciseId)
        || strengthExerciseOptionByMetricExerciseId.get(exerciseId)
        || strengthExerciseOptionByComparableName.get(buildComparableStrengthExerciseName(metricCard?.exerciseName))
        || metricCard
        || null
      if (!selectedExercise) return null

      const resolvedMetricCard = findMetricCardForExerciseOption(selectedExercise, strengthCards)
      if (!resolvedMetricCard) {
        return {
          id: selectedExercise.metricExerciseId || selectedExercise.id,
          exerciseId: selectedExercise.id,
          exerciseName: selectedExercise.name,
          videoUrl: selectedExercise.videoUrl || null,
          thumbnailUrl: selectedExercise.thumbnailUrl || null,
          oneRepMaxValueLabel: '--',
          sourcePerformanceTagLabel: 'No logged strength sets yet',
          metricLabel: '1RM',
          isMetricMissing: true,
        }
      }

      return {
        ...resolvedMetricCard,
        exerciseId: selectedExercise.id || resolvedMetricCard.exerciseId || resolvedMetricCard.id,
        exerciseName: selectedExercise.name || resolvedMetricCard.exerciseName,
        videoUrl: selectedExercise.videoUrl || resolvedMetricCard.videoUrl || null,
        thumbnailUrl: selectedExercise.thumbnailUrl || resolvedMetricCard.thumbnailUrl || null,
      }
    })
    .filter(Boolean)
}
