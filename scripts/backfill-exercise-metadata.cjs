const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')

  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

function classifyEquipment(name) {
  const lowerName = String(name || '').toLowerCase()
  const paddedName = ` ${lowerName} `
  const rules = [
    ['Trap Bar', ['trap bar']],
    ['Dumbbell', [' db ', 'db ', ' db', 'dumbbell']],
    ['Kettlebell', [' kb ', 'kb ', ' kb', 'kettlebell']],
    ['Landmine', ['landmine']],
    ['Cable', ['cable', 'pulldown']],
    ['Band', ['band ', ' band', 'banded', 'resisted']],
    ['Barbell', ['barbell', ' bb ', 'bb ', ' bb']],
    ['Medicine Ball', ['med ball', 'medicine ball', ' mb ', 'mb ']],
    ['Sled', ['sled', 'prowler']],
    ['Pull-Up Bar', ['pull up', 'chin up']],
    ['Wall', ['wall']],
    ['Bench', ['bench']],
  ]

  for (const [label, needles] of rules) {
    if (needles.some((needle) => paddedName.includes(needle) || lowerName.includes(needle.trim()))) {
      return label
    }
  }

  return 'Bodyweight'
}

function classifyStimulusType(name) {
  const lowerName = String(name || '').toLowerCase()

  if (['stretch', 'mobility', 'pnf', 'hip flexor', 't-spine', 'ankle mobility', 'pec mobility'].some((term) => lowerName.includes(term))) {
    return 'Mobility'
  }

  if (['pogo', 'jump', 'bound', 'hop', 'rebound', 'skater', 'push press'].some((term) => lowerName.includes(term))) {
    return 'Power'
  }

  if (['sprint', 'run', 'shuttle', 'backpedal', 'shuffle', 'crossover', 'turn', 'accel', 'decel'].some((term) => lowerName.includes(term))) {
    return 'Speed'
  }

  if (['hip lift', 'abduction', 'activation', 'iso', 'hold', 'raise', 'clamshell'].some((term) => lowerName.includes(term))) {
    return 'Activation'
  }

  if (['plank', 'dead bug', 'leg lowers', 'rollout', 'rotation'].some((term) => lowerName.includes(term))) {
    return 'Core'
  }

  return 'Strength'
}

function classifyMovementPattern(name) {
  const lowerName = String(name || '').toLowerCase()

  if (['stretch', 'mobility', 'pnf'].some((term) => lowerName.includes(term))) {
    return 'Mobility'
  }

  if (['row', 'pulldown', 'pull up', 'chin up'].some((term) => lowerName.includes(term))) {
    return 'Pull'
  }

  if (['bench', 'press', 'push up', 'raise'].some((term) => lowerName.includes(term))) {
    return 'Push'
  }

  if (['rdl', 'deadlift', 'hip lift', 'bridge'].some((term) => lowerName.includes(term))) {
    return 'Hinge'
  }

  if (lowerName.includes('squat')) {
    return 'Squat'
  }

  if (['lunge', 'split squat', 'step up'].some((term) => lowerName.includes(term))) {
    return 'Lunge'
  }

  if (['jump', 'bound', 'pogo', 'hop', 'rebound'].some((term) => lowerName.includes(term))) {
    return 'Jump'
  }

  if (['sprint', 'run', 'shuttle', 'backpedal', 'shuffle', 'crossover', 'turn', 'skater'].some((term) => lowerName.includes(term))) {
    return 'Locomotion'
  }

  if (['plank', 'dead bug', 'leg lowers', 'get up'].some((term) => lowerName.includes(term))) {
    return 'Core'
  }

  return 'General'
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${text}`)
  }

  return payload
}

async function main() {
  loadEnv()

  const base = process.env.SUPABASE_URL.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const selectParams = new URLSearchParams({
    select: 'id,name,default_equipment,movement_pattern,stimulus_type',
    order: 'name.asc',
    limit: '300',
  })

  const exercises = await requestJson(`${base}/rest/v1/exercises?${selectParams.toString()}`, {
    method: 'GET',
    headers,
  })

  let updatedCount = 0
  const equipmentCounts = {}
  const movementPatternCounts = {}
  const stimulusTypeCounts = {}

  for (const exercise of exercises) {
    const nextEquipment = classifyEquipment(exercise.name)
    const nextMovementPattern = classifyMovementPattern(exercise.name)
    const nextStimulusType = classifyStimulusType(exercise.name)

    equipmentCounts[nextEquipment] = (equipmentCounts[nextEquipment] || 0) + 1
    movementPatternCounts[nextMovementPattern] = (movementPatternCounts[nextMovementPattern] || 0) + 1
    stimulusTypeCounts[nextStimulusType] = (stimulusTypeCounts[nextStimulusType] || 0) + 1

    const isSame =
      exercise.default_equipment === nextEquipment &&
      exercise.movement_pattern === nextMovementPattern &&
      exercise.stimulus_type === nextStimulusType

    if (isSame) continue

    const updateParams = new URLSearchParams({ id: `eq.${exercise.id}` })
    await requestJson(`${base}/rest/v1/exercises?${updateParams.toString()}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        default_equipment: nextEquipment,
        movement_pattern: nextMovementPattern,
        stimulus_type: nextStimulusType,
      }),
    })

    updatedCount += 1
  }

  console.log(JSON.stringify({
    totalExercises: exercises.length,
    updatedCount,
    equipmentCounts,
    movementPatternCounts,
    stimulusTypeCounts,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
