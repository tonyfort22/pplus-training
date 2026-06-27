import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getProgramEditViewModel } from '../apps/mobile/src/train/program-edit-view-models.js'

test('getProgramEditViewModel builds the program edit surface with date sheets, add-workout sheet, and create-workout view', () => {
  const model = getProgramEditViewModel({
    id: 'prog-1',
    name: 'Spring 26 Hypertrophy',
    startDate: '2026-04-05',
    endDate: '2026-05-31',
    weeks: [
      {
        id: 'week-1',
        startDate: '2026-04-05',
        endDate: '2026-04-11',
        days: [
          { id: 'day-sun', date: '2026-04-05', workouts: [{ id: 'pw-sun', nameSnapshot: 'Upper A', estimatedDurationMinutes: 63 }] },
          { id: 'day-mon', date: '2026-04-06', workouts: [{ id: 'pw-mon', nameSnapshot: 'Lower A' }] },
          { id: 'day-tue', date: '2026-04-07', workouts: [] },
          { id: 'day-wed', date: '2026-04-08', workouts: [{ id: 'pw-wed', nameSnapshot: 'Upper B' }] },
          { id: 'day-thu', date: '2026-04-09', workouts: [{ id: 'pw-thu', nameSnapshot: 'Lower B' }] },
          { id: 'day-fri', date: '2026-04-10', workouts: [{ id: 'pw-fri', nameSnapshot: 'Shoulders & Arms' }] },
          { id: 'day-sat', date: '2026-04-11', workouts: [] },
        ],
      },
    ],
  }, { now: '2026-04-26' })

  assert.equal(model.title, 'Spring 26 Hypertrophy')
  assert.equal(model.startDateLabel, 'Apr 5')
  assert.equal(model.endDateLabel, 'May 31, 2026')
  assert.equal(model.splitDays.length, 7)
  assert.deepEqual(model.splitDays.map((day) => day.dayLabel), ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  assert.equal(model.splitDays[0].routineLabel, 'Upper A')
  assert.equal(model.splitDays[0].durationLabel, 'Est. 1h 3m')
  assert.equal(model.splitDays[2].actionLabel, '+ Add')
  assert.equal(model.splitDays[6].actionLabel, '+ Add')
  assert.equal(model.startDateSheet.title, 'Program Start Date')
  assert.equal(model.startDateSheet.doneLabel, 'Done')
  assert.equal(model.startDateSheet.options.length, 3)
  assert.deepEqual(model.startDateSheet.options.map((option) => option.label), ['Today', 'Tomorrow', 'Custom'])
  assert.deepEqual(model.startDateSheet.options.map((option) => option.valueLabel), ['Sunday, Apr 26', 'Monday, Apr 27', 'Sunday, Apr 5'])
  assert.equal(model.startDateSheet.options[2].isSelected, true)
  assert.equal(model.endDateSheet.title, 'Program End Date')
  assert.equal(model.endDateSheet.doneLabel, 'Save Changes')
  assert.equal(model.endDateSheet.variant, 'wheel')
  assert.equal(model.endDateSheet.options.length, 5)
  assert.deepEqual(model.endDateSheet.options.map((option) => option.label), [
    'May 17 (~6 weeks)',
    'May 24 (~7 weeks)',
    'May 31 (~8 weeks)',
    'Jun 7 (~9 weeks)',
    'Jun 14 (~10 weeks)',
  ])
  assert.equal(model.endDateSheet.options[2].valueLabel, 'May 31, 2026')
  assert.equal(model.endDateSheet.options[2].isSelected, true)
  assert.equal(model.addWorkoutSheet.title, 'Add Workout')
  assert.equal(model.addWorkoutSheet.createWorkoutLabel, 'Create Workout')
  assert.equal(model.addWorkoutSheet.programRoutinesLabel, 'Workouts in this Program')
  assert.deepEqual(model.addWorkoutSheet.routines.map((routine) => routine.label), ['Upper A', 'Lower A', 'Upper B', 'Lower B', 'Shoulders & Arms'])
  assert.equal(model.createWorkoutView.title, 'Routine Name')
  assert.equal(model.createWorkoutView.notesPlaceholder, 'Add notes')
  assert.equal(model.createWorkoutView.addExerciseLabel, 'Add Exercise')
  assert.equal(model.createWorkoutView.deleteLabel, 'Delete Routine')
  assert.equal(model.addExerciseSheet.title, 'Exercises')
  assert.equal(model.addExerciseSheet.searchPlaceholder, 'Search or Create Exercises')
  assert.equal(model.addExerciseSheet.addButtonLabel, 'Add')
  assert.equal(model.addExerciseSheet.exercises.length >= 3, true)
  assert.equal(model.helperNote, 'The training split repeats until the end date. Use a 7-day split to keep weekdays fixed.')
  assert.equal(model.endProgramLabel, 'End Program')
})

test('mobile app shell opens a dedicated Program Edit View from the current program sheet edit button', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'), 'utf8')
  const editViewSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/program-edit-view.js'), 'utf8')
  const sharedPickerSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/exercise-multi-select-view.js'), 'utf8')
  const openHandler = appSource.match(/function handleOpenProgramEditView\(\) \{[\s\S]*?\n\s+\}/)?.[0] || ''
  const closeHandler = appSource.match(/function handleCloseProgramEditView\(\) \{[\s\S]*?\n\s+\}/)?.[0] || ''
  const programSheetRender = appSource.match(/renderProgramSheet\(\{[\s\S]*?theme: appTheme,[\s\S]*?\}\)/)?.[0] || ''
  const programEditRender = appSource.match(/<ProgramEditView[\s\S]*?\/\>/)?.[0] || ''

  assert.match(appSource, /const \[isProgramEditViewOpen, setIsProgramEditViewOpen\] = useState\(false\);/)
  assert.match(appSource, /const programEditViewModel = useMemo\(\(\) => getProgramEditViewModel\(selectedProgramPreview \|\| trainState\), \[selectedProgramPreview, trainState\]\);/)
  assert.match(appSource, /program-edit-selection\.js/)
  assert.match(openHandler, /orchestrateOpenProgramEditView\(\{/)
  assert.doesNotMatch(openHandler, /setIsProgramSheetOpen\(false\);/)
  assert.doesNotMatch(openHandler, /setIsProgramEditViewOpen\(true\);/)
  assert.match(closeHandler, /orchestrateCloseProgramEditView\(\{/)
  assert.doesNotMatch(closeHandler, /setIsProgramEditViewOpen\(false\);/)
  assert.doesNotMatch(closeHandler, /setIsProgramSheetOpen\(true\);/)
  assert.match(programSheetRender, /onEditProgram: handleOpenProgramEditView,/)
  assert.doesNotMatch(programSheetRender, /onEditProgram:\s*\(\)\s*=>\s*\{/)
  assert.match(programEditRender, /isVisible=\{isProgramEditViewOpen\}/)
  assert.match(programEditRender, /model=\{programEditViewModel\}/)
  assert.match(programEditRender, /theme=\{appTheme\}/)
  assert.match(programEditRender, /onClose=\{handleCloseProgramEditView\}/)
  assert.match(programEditRender, /onSave=\{handleCloseProgramEditView\}/)
  assert.doesNotMatch(programEditRender, /onClose=\{\(\) => \{[\s\S]*setIsProgramEditViewOpen\(false\);[\s\S]*setIsProgramSheetOpen\(true\);[\s\S]*\}\}/)
  assert.match(sheetSource, /export function renderProgramSheet\(\{ isVisible, onClose, onEditProgram, onOpenWorkoutDetail, onOpenTrainingCalendar, model, theme \}\)/)
  assert.match(sheetSource, /<Pressable onPress=\{onEditProgram\}>/)
  assert.match(editViewSource, /useState/)
  assert.match(editViewSource, /isCreateWorkoutViewOpen/)
  assert.match(editViewSource, /onPress=\{onOpenCreateWorkout\}/)
  assert.match(editViewSource, /function handleOpenCreateWorkout\(\) \{[\s\S]*setIsAddWorkoutSheetOpen\(false\)[\s\S]*setSelectedAddWorkoutDayId\(null\)[\s\S]*InteractionManager\.runAfterInteractions\(\(\) => \{[\s\S]*setIsCreateWorkoutViewOpen\(true\)[\s\S]*\}\)[\s\S]*\}/)
  assert.match(editViewSource, /<ProgramAddWorkoutSheet[\s\S]*onOpenCreateWorkout=\{handleOpenCreateWorkout\}/)
  assert.match(editViewSource, /const \[isAddExerciseSheetOpen, setIsAddExerciseSheetOpen\] = useState\(false\)/)
  assert.match(editViewSource, /const \[selectedExerciseIds, setSelectedExerciseIds\] = useState\(\[\]\)/)
  assert.match(editViewSource, /const \[exerciseSearchQuery, setExerciseSearchQuery\] = useState\(''\)/)
  assert.match(editViewSource, /function ProgramAddExerciseSheet\(\{ isVisible, theme, sheet, selectedExerciseIds, onToggleExercise, searchQuery, onSearchChange, onAddExercises, onClose \}\)/)
  assert.match(editViewSource, /<ExerciseMultiSelectView[\s\S]*isVisible=\{isVisible\}[\s\S]*selectedExerciseIds=\{selectedExerciseIds\}[\s\S]*onToggleExercise=\{onToggleExercise\}[\s\S]*onAddExercises=\{onAddExercises\}[\s\S]*onClose=\{onClose\}/)
  assert.match(editViewSource, /function ProgramCreateWorkoutView\(\{ isVisible, theme, model, onOpenAddExercise, onClose, onSave \}\)/)
  assert.match(editViewSource, /onPress=\{onOpenAddExercise\}/)
  assert.match(editViewSource, /function handleOpenAddExercise\(\) \{[\s\S]*setIsCreateWorkoutViewOpen\(false\)[\s\S]*InteractionManager\.runAfterInteractions\(\(\) => \{[\s\S]*setIsAddExerciseSheetOpen\(true\)[\s\S]*\}\)[\s\S]*\}/)
  assert.match(editViewSource, /<ProgramCreateWorkoutView[\s\S]*onOpenAddExercise=\{handleOpenAddExercise\}/)
  assert.match(editViewSource, /<ProgramAddExerciseSheet[\s\S]*isVisible=\{isAddExerciseSheetOpen\}[\s\S]*sheet=\{model.addExerciseSheet\}[\s\S]*selectedExerciseIds=\{selectedExerciseIds\}/)
  assert.match(sharedPickerSource, /selectedExerciseIds\.includes\(exercise\.id\)/)
  assert.match(sharedPickerSource, /const actionLabel = selectedExerciseIds\.length > 0[\s\S]*`\$\{sheet\.addButtonLabel\} \$\{selectedExerciseIds\.length\}`[\s\S]*sheet\.emptySelectionLabel/)
  assert.match(sharedPickerSource, /label=\{actionLabel\}/)
  assert.match(sharedPickerSource, /Image source=\{\{ uri: exercise\.thumbnailUrl \}\}/)
  assert.doesNotMatch(editViewSource, /AppSegmentedControl/)
  assert.doesNotMatch(editViewSource, /day\.durationLabel \? <Text/)
  assert.doesNotMatch(editViewSource, /day\.durationLabel[\s\S]*<Pressable className=\"h-9 w-9 items-center justify-center rounded-full\"/)
  assert.match(editViewSource, /containerClassName=\"relative flex-1 rounded-\[20px\]\"/)
  assert.match(editViewSource, /contentClassName=\"min-h-\[54px\] justify-center px-4 py-3 pr-12\"/)
  assert.match(editViewSource, /style=\{\{ overflow: 'visible' \}\}/)
  assert.match(editViewSource, /position: 'absolute'/)
  assert.match(editViewSource, /right: -10/)
  assert.match(editViewSource, /top: -10/)
  assert.match(editViewSource, /width: 36/)
  assert.match(editViewSource, /height: 36/)
  assert.match(editViewSource, /borderRadius: 18/)
  assert.match(editViewSource, /borderWidth: 1\.5/)
  assert.match(editViewSource, /borderColor: theme\.dangerBorder/)
  assert.match(editViewSource, /backgroundColor: theme\.dangerSurface/)
  assert.match(editViewSource, /CircleMinus color=\{theme\.dangerText\} size=\{20\} strokeWidth=\{2\.6\}/)
  assert.match(editViewSource, /className=\"text-\[12px\] font-semibold uppercase\"/)
  assert.match(editViewSource, /className=\"text-\[14px\] font-semibold\"/)
  assert.match(editViewSource, /label=\{model\.endProgramLabel\}/)
  assert.match(editViewSource, /tone=\"danger\"/)
  assert.doesNotMatch(editViewSource, /label=\{model\.endProgramLabel\}[\s\S]{0,160}leftIcon=/)
  assert.doesNotMatch(editViewSource, /borderTopColor: resolvedTheme\.divider/)
  assert.match(editViewSource, /TextInput/)
  assert.match(editViewSource, /backgroundColor: 'transparent'/)
  assert.match(editViewSource, /outlineStyle: 'none'/)
  assert.match(editViewSource, /model\.title/)
  assert.match(editViewSource, /model\.notesPlaceholder/)
  assert.match(editViewSource, /model\.addExerciseLabel/)
  assert.match(editViewSource, /model\.deleteLabel/)
  assert.match(editViewSource, /END_DATE_WHEEL_ROW_HEIGHT/)
  assert.match(editViewSource, /END_DATE_WHEEL_VISIBLE_ROWS/)
  assert.match(editViewSource, /sheet\.variant === 'wheel'/)
  assert.match(editViewSource, /snapToInterval=\{END_DATE_WHEEL_ROW_HEIGHT\}/)
  assert.match(editViewSource, /onMomentumScrollEnd=/)
  assert.match(editViewSource, /showsVerticalScrollIndicator=\{false\}/)
  assert.match(editViewSource, /className="relative overflow-hidden rounded-\[28px\]"/)
  assert.match(editViewSource, /className="absolute inset-x-0 rounded-\[24px\]"/)
  assert.match(editViewSource, /className="pointer-events-none absolute inset-x-0 top-0"/)
  assert.match(editViewSource, /className="pointer-events-none absolute inset-x-0 bottom-0"/)
  assert.match(editViewSource, /END_DATE_WHEEL_FADE_STOPS/)
  assert.match(editViewSource, /END_DATE_WHEEL_FADE_STOPS\.map/)
  assert.match(editViewSource, /backgroundColor: theme\.surfaceElevated/)
  assert.doesNotMatch(editViewSource, /-mt-\[216px\]/)
  assert.doesNotMatch(editViewSource, /onPress=\{\(\) => setIsStartDateSheetOpen\(true\)\}/)
  assert.doesNotMatch(editViewSource, /onPress=\{\(\) => setIsEndDateSheetOpen\(true\)\}/)
  assert.match(editViewSource, /<View className=\"gap-3\.5\" style=\{\{ paddingHorizontal: 12 \}\}>[\s\S]*\{model\.trainingSplitLabel\}/)
  assert.match(editViewSource, /sheet\.title/)
  assert.match(editViewSource, /sheet\.doneLabel/)
  assert.match(editViewSource, /function ProgramDateOptionSheet\(\{ isVisible, theme, sheet, onSelectOption, onClose \}\)/)
  assert.match(editViewSource, /AppButton/)
  assert.match(editViewSource, /AppSelectionIndicator/)
  assert.match(editViewSource, /backgroundColor: theme\.surfaceElevated/)
  assert.match(editViewSource, /backgroundColor: theme\.overlay/)
  assert.match(editViewSource, /<ProgramDateOptionSheet[\s\S]*isVisible=\{isStartDateSheetOpen\}/)
  assert.match(editViewSource, /<ProgramDateOptionSheet[\s\S]*sheet=\{startDateSheet\}/)
  assert.match(editViewSource, /<ProgramDateOptionSheet[\s\S]*isVisible=\{isEndDateSheetOpen\}/)
  assert.match(editViewSource, /<ProgramDateOptionSheet[\s\S]*sheet=\{endDateSheet\}/)
  assert.match(editViewSource, /sheet\.options\.map/)
  assert.match(editViewSource, /option\.isSelected/)
  assert.match(editViewSource, /onSelectOption\(option\.id\)/)
  assert.match(editViewSource, /model\.helperNote/)
})
