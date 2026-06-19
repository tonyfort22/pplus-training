import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyWorkoutTrainingAiActions,
  createWorkoutTrainingAiEdit,
  parseWorkoutTrainingAiActions,
} from '../apps/web/lib/admin/workout-training-ai.js'

const baseSections = [
  {
    id: 'section-ai-warmup',
    label: 'Warmup',
    isExpanded: false,
    showInstruction: false,
    instruction: 'Existing warmup',
    draftExerciseQuery: '',
    exercises: [],
  },
  {
    id: 'section-a1',
    label: 'A1',
    isExpanded: false,
    showInstruction: false,
    instruction: '',
    draftExerciseQuery: '',
    exercises: [
      {
        id: 'exercise-lying-medball-squeeze',
        title: 'Lying Medball Squeeze',
        isExpanded: true,
        instruction: '',
        showInstruction: false,
        sets: [
          { id: 'set-1', tempo: '0-5-0', effort: '1', side: '', duration: '', distance: '', rest: '60 sec', reps: '4' },
          { id: 'set-2', tempo: '0-5-0', effort: '2', side: '', duration: '', distance: '', rest: '60 sec', reps: '5' },
        ],
      },
    ],
  },
]

test('delete warmup instruction removes existing warmup section instead of adding one', () => {
  const result = createWorkoutTrainingAiEdit({
    instruction: 'Delete warmup section.',
    trainingSections: baseSections,
    workoutContext: { name: 'Test workout' },
  })

  assert.equal(result.ok, true)
  assert.equal(result.summary, 'Deleted the warmup section.')
  assert.deepEqual(result.actions, [{ type: 'delete_section', match: { label: 'Warmup' } }])
  assert.deepEqual(result.nextTrainingSections.map((section) => section.label), ['A1'])
  assert.equal(result.nextTrainingSections.some((section) => section.label.toLowerCase() === 'warmup'), false)
})

test('delete warmup instruction keeps plan unchanged when no warmup section exists', () => {
  const result = createWorkoutTrainingAiEdit({
    instruction: 'Remove warmup section',
    trainingSections: [baseSections[1]],
    workoutContext: { name: 'Test workout' },
  })

  assert.equal(result.ok, true)
  assert.equal(result.summary, 'No warmup section was found to delete.')
  assert.deepEqual(result.actions, [{ type: 'delete_section', match: { label: 'Warmup' } }])
  assert.deepEqual(result.nextTrainingSections.map((section) => section.label), ['A1'])
})

test('parser returns structured actions for combined delete section and set rest instruction', () => {
  const actions = parseWorkoutTrainingAiActions('Delete warmup section and set all rest to 45 sec.')

  assert.deepEqual(actions, [
    { type: 'delete_section', match: { label: 'Warmup' } },
    { type: 'update_all_sets', values: { rest: '45 sec' } },
  ])
})

test('parser supports add warmup, all effort updates, and section rename actions', () => {
  const actions = parseWorkoutTrainingAiActions('Add warmup section, make all effort values 7, and rename A1 to Activation.')

  assert.deepEqual(actions, [
    { type: 'add_section', section: { label: 'Warmup' }, position: 'start' },
    { type: 'update_all_sets', values: { effort: '7' } },
    { type: 'rename_section', match: { label: 'A1' }, values: { label: 'Activation' } },
  ])
})

test('parser matches close warmup request phrases without exact command words', () => {
  assert.deepEqual(parseWorkoutTrainingAiActions('Take out the warm up block.'), [
    { type: 'delete_section', match: { label: 'Warmup' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Put a warm up at the beginning.'), [
    { type: 'add_section', section: { label: 'Warmup' }, position: 'start' },
  ])
})

test('parser matches close rest request phrases', () => {
  assert.deepEqual(parseWorkoutTrainingAiActions('Give every set 75 seconds rest.'), [
    { type: 'update_all_sets', values: { rest: '75 sec' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Rest should be 2 minutes across the workout.'), [
    { type: 'update_all_sets', values: { rest: '2 min' } },
  ])
})

test('parser matches close effort and rename request phrases', () => {
  assert.deepEqual(parseWorkoutTrainingAiActions('Intensity should be 8 for all sets.'), [
    { type: 'update_all_sets', values: { effort: '8' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Call section A1 Edge Work.'), [
    { type: 'rename_section', match: { label: 'A1' }, values: { label: 'Edge Work' } },
  ])
})

test('parser matches deeper warmup and prep aliases safely', () => {
  assert.deepEqual(parseWorkoutTrainingAiActions('Remove the prep block from this workout.'), [
    { type: 'delete_section', match: { label: 'Warmup' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Add a primer section before everything else.'), [
    { type: 'add_section', section: { label: 'Warmup' }, position: 'start' },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Get rid of activation at the start.'), [
    { type: 'delete_section', match: { label: 'Warmup' } },
  ])
})

test('parser matches deeper rest and recovery timing phrases', () => {
  assert.deepEqual(parseWorkoutTrainingAiActions('Recovery between sets should be 30s.'), [
    { type: 'update_all_sets', values: { rest: '30 sec' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Put 90 sec between each set.'), [
    { type: 'update_all_sets', values: { rest: '90 sec' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Give them one minute recovery between sets.'), [
    { type: 'update_all_sets', values: { rest: '1 min' } },
  ])
})

test('parser matches deeper effort and RPE phrases', () => {
  assert.deepEqual(parseWorkoutTrainingAiActions('Set RPE across the whole workout to 6.5.'), [
    { type: 'update_all_sets', values: { effort: '6.5' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Make the whole session effort 9.'), [
    { type: 'update_all_sets', values: { effort: '9' } },
  ])
})

test('parser matches deeper section rename phrases', () => {
  assert.deepEqual(parseWorkoutTrainingAiActions('Change A1 name to First Step Quickness.'), [
    { type: 'rename_section', match: { label: 'A1' }, values: { label: 'First Step Quickness' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Label warm up as Prep Work.'), [
    { type: 'rename_section', match: { label: 'Warm Up' }, values: { label: 'Prep Work' } },
  ])
})

test('parser matches named exercise rest update phrases', () => {
  assert.deepEqual(parseWorkoutTrainingAiActions('Change the sets rest time to 90 seconds for all sets in the exercise Lying Medball Squeeze.'), [
    { type: 'update_exercise_sets', match: { title: 'Lying Medball Squeeze' }, values: { rest: '90 sec' } },
  ])

  assert.deepEqual(parseWorkoutTrainingAiActions('Set rest to 90 seconds for Lying Medball Squeeze.'), [
    { type: 'update_exercise_sets', match: { title: 'Lying Medball Squeeze' }, values: { rest: '90 sec' } },
  ])
})

test('action applier updates only the targeted exercise sets', () => {
  const sections = [
    {
      ...baseSections[1],
      exercises: [
        baseSections[1].exercises[0],
        {
          id: 'exercise-other',
          title: 'Other Exercise',
          sets: [{ id: 'other-set-1', rest: '60 sec', effort: '3' }],
        },
      ],
    },
  ]

  const result = applyWorkoutTrainingAiActions(sections, [
    { type: 'update_exercise_sets', match: { title: 'Lying Medball Squeeze' }, values: { rest: '90 sec' } },
  ])

  assert.deepEqual(result.nextTrainingSections[0].exercises[0].sets.map((setValues) => setValues.rest), ['90 sec', '90 sec'])
  assert.deepEqual(result.nextTrainingSections[0].exercises[1].sets.map((setValues) => setValues.rest), ['60 sec'])
  assert.deepEqual(result.summaries, ['Updated all sets for Lying Medball Squeeze.'])
})

test('action applier can delete, rename, and update all sets in one pass', () => {
  const result = applyWorkoutTrainingAiActions(baseSections, [
    { type: 'delete_section', match: { label: 'Warmup' } },
    { type: 'rename_section', match: { label: 'A1' }, values: { label: 'Activation' } },
    { type: 'update_all_sets', values: { rest: '45 sec', effort: '7' } },
  ])

  assert.deepEqual(result.nextTrainingSections.map((section) => section.label), ['Activation'])
  assert.deepEqual(
    result.nextTrainingSections[0].exercises[0].sets.map((setValues) => ({ rest: setValues.rest, effort: setValues.effort })),
    [
      { rest: '45 sec', effort: '7' },
      { rest: '45 sec', effort: '7' },
    ],
  )
  assert.deepEqual(result.summaries, [
    'Deleted the warmup section.',
    'Renamed section A1 to Activation.',
    'Updated all sets.',
  ])
})

test('create edit returns actions and combined summary for structured multi-action instructions', () => {
  const result = createWorkoutTrainingAiEdit({
    instruction: 'Delete warmup section and set all rest to 45 sec.',
    trainingSections: baseSections,
    workoutContext: { name: 'Test workout' },
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.actions, [
    { type: 'delete_section', match: { label: 'Warmup' } },
    { type: 'update_all_sets', values: { rest: '45 sec' } },
  ])
  assert.equal(result.summary, 'Deleted the warmup section. Updated all sets.')
  assert.deepEqual(result.nextTrainingSections.map((section) => section.label), ['A1'])
  assert.deepEqual(result.nextTrainingSections[0].exercises[0].sets.map((setValues) => setValues.rest), ['45 sec', '45 sec'])
})
