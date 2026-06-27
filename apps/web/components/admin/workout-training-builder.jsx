'use client'

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, Dumbbell, GripVertical, ImageIcon, Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { KanbanBoard, KanbanColumn, KanbanItem } from '@/components/ui/kanban'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Textarea from '@/components/ui/textarea'

const EXERCISE_LIBRARY = [
  {
    id: 'exercise-skater-hops',
    title: 'Skater hops',
    defaultSets: [
      { id: 'set-1', tempo: 'Explosive', effort: '7/10', side: 'Bilateral', duration: '20 sec', distance: '10 m', rest: '45 sec', reps: '6' },
      { id: 'set-2', tempo: 'Explosive', effort: '8/10', side: 'Bilateral', duration: '20 sec', distance: '10 m', rest: '45 sec', reps: '6' },
    ],
  },
  {
    id: 'exercise-sled-sprint',
    title: 'Sled sprint',
    defaultSets: [
      { id: 'set-1', tempo: 'Fast', effort: '8/10', side: 'Bilateral', duration: '15 sec', distance: '15 m', rest: '60 sec', reps: '4' },
    ],
  },
  {
    id: 'exercise-copenhagen-plank',
    title: 'Copenhagen plank',
    defaultSets: [
      { id: 'set-1', tempo: 'Control', effort: '6/10', side: 'L', duration: '30 sec', distance: '-', rest: '30 sec', reps: '1' },
      { id: 'set-2', tempo: 'Control', effort: '6/10', side: 'R', duration: '30 sec', distance: '-', rest: '30 sec', reps: '1' },
    ],
  },
  {
    id: 'exercise-spirit-bike',
    title: 'Spirit Bike sprint',
    defaultSets: [
      { id: 'set-1', tempo: 'Fast', effort: '9/10', side: 'Bilateral', duration: '10 sec', distance: '-', rest: '50 sec', reps: '5' },
    ],
  },
  {
    id: 'exercise-trap-bar-jump',
    title: 'Trap bar jump',
    defaultSets: [
      { id: 'set-1', tempo: 'Explosive', effort: '7/10', side: 'Bilateral', duration: '-', distance: '-', rest: '75 sec', reps: '5' },
    ],
  },
]

let sectionNumberSeed = 3
let exerciseNumberSeed = 5
let setNumberSeed = 20

function createSet(overrides = {}) {
  setNumberSeed += 1
  return {
    id: `set-${setNumberSeed}`,
    tempo: '',
    effort: '',
    side: '',
    duration: '',
    distance: '',
    rest: '',
    reps: '',
    ...overrides,
  }
}

function createExercise(id, title, defaultSets = [], overrides = {}) {
  exerciseNumberSeed += 1
  return {
    id: `${id}-${exerciseNumberSeed}`,
    title,
    isExpanded: overrides.isExpanded ?? false,
    showInstruction: overrides.showInstruction ?? false,
    instruction: overrides.instruction ?? '',
    thumbnailUrl: overrides.thumbnailUrl ?? '',
    sets: defaultSets.map((setValues) => createSet(setValues)),
  }
}

function createSection(label, exercises = [], overrides = {}) {
  return {
    id: `section-${label.toLowerCase()}`,
    label,
    isExpanded: overrides.isExpanded ?? false,
    showInstruction: overrides.showInstruction ?? false,
    instruction: overrides.instruction ?? '',
    draftExerciseQuery: overrides.draftExerciseQuery ?? '',
    exercises,
  }
}

export function createInitialTrainingSections() {
  return [
    createSection('A1', [
      createExercise('exercise-skater-hops', 'Skater hops', EXERCISE_LIBRARY[0].defaultSets, { isExpanded: false }),
      createExercise('exercise-sled-sprint', 'Sled sprint', EXERCISE_LIBRARY[1].defaultSets, { isExpanded: false }),
    ], { isExpanded: false }),
    createSection('A2', [
      createExercise('exercise-copenhagen-plank', 'Copenhagen plank', EXERCISE_LIBRARY[2].defaultSets, { isExpanded: false }),
      createExercise('exercise-spirit-bike', 'Spirit Bike sprint', EXERCISE_LIBRARY[3].defaultSets, { isExpanded: false }),
    ], { isExpanded: false }),
  ]
}

function reorderItems(items, activeId, overId) {
  const activeIndex = items.findIndex((item) => item.id === activeId)
  const overIndex = items.findIndex((item) => item.id === overId)

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return items

  const nextItems = [...items]
  const [activeItem] = nextItems.splice(activeIndex, 1)
  nextItems.splice(overIndex, 0, activeItem)
  return nextItems
}

function getNextSectionLabel(sections) {
  sectionNumberSeed = Math.max(sectionNumberSeed, sections.length + 1)
  const label = `A${sectionNumberSeed}`
  sectionNumberSeed += 1
  return label
}

function SortableSetRow({ sectionId, exerciseId, setIndex, setValues, updateSetField, deleteSet }) {
  const setInputClassName = "h-9 rounded-none border-transparent bg-transparent text-center text-[var(--admin-dashboard-card-text)] focus-visible:border-[var(--admin-shell-primary-button-bg)] focus-visible:ring-0"
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: setValues.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr ref={setNodeRef} style={style} className="border-[var(--admin-dashboard-card-border)]">
      <td className="w-[52px] px-2 py-2 align-middle">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-transparent text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-dashboard-card-text)]"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
          <span className="sr-only">Drag set row</span>
        </button>
      </td>
      <td className="px-2 py-2 text-center align-middle text-[var(--admin-dashboard-card-muted)]">{setIndex + 1}</td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.tempo} placeholder="-" onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'tempo', event.target.value)} className={setInputClassName} />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.effort} placeholder="-" onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'effort', event.target.value)} className={setInputClassName} />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.side} placeholder="-" onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'side', event.target.value)} className={setInputClassName} />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.duration} placeholder="-" onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'duration', event.target.value)} className={setInputClassName} />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.distance} placeholder="-" onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'distance', event.target.value)} className={setInputClassName} />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.rest} placeholder="-" onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'rest', event.target.value)} className={setInputClassName} />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.reps} placeholder="-" onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'reps', event.target.value)} className={setInputClassName} />
      </td>
      <td className="px-2 py-2 align-middle">
        <button
          type="button"
          onClick={() => deleteSet(sectionId, exerciseId, setValues.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-transparent text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-shell-primary-red-bg)]"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete set</span>
        </button>
      </td>
    </tr>
  )
}

export default function WorkoutTrainingBuilder({
  sections = createInitialTrainingSections(),
  onSectionsChange = () => {},
  readOnly = false,
}) {
  const setRowSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  function updateSections(updater) {
    const nextSections = typeof updater === 'function' ? updater(sections) : updater
    onSectionsChange(nextSections)
  }

  function addSection() {
    updateSections((currentSections) => [
      ...currentSections,
      createSection(getNextSectionLabel(currentSections), []),
    ])
  }

  function handleSectionDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    updateSections((currentSections) => reorderItems(currentSections, active.id, over.id))
  }

  function handleExerciseDragEnd(sectionId, { active, over }) {
    if (!over || active.id === over.id) return

    updateSections((currentSections) =>
      currentSections.map((section) => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          exercises: reorderItems(section.exercises, active.id, over.id),
        }
      }),
    )
  }

  function handleSetDragEnd(sectionId, exerciseId, { active, over }) {
    if (!over || active.id === over.id) return

    updateExercise(sectionId, exerciseId, (exercise) => ({
      ...exercise,
      sets: reorderItems(exercise.sets, active.id, over.id),
    }))
  }

  function updateSection(sectionId, updater) {
    updateSections((currentSections) =>
      currentSections.map((section) => (section.id === sectionId ? updater(section) : section)),
    )
  }

  function updateExercise(sectionId, exerciseId, updater) {
    updateSection(sectionId, (section) => ({
      ...section,
      exercises: section.exercises.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise)),
    }))
  }

  function addExercise(sectionId, exerciseLibraryItem) {
    updateSection(sectionId, (section) => ({
      ...section,
      draftExerciseQuery: '',
      exercises: [...section.exercises, createExercise(exerciseLibraryItem.id, exerciseLibraryItem.title, exerciseLibraryItem.defaultSets, { thumbnailUrl: exerciseLibraryItem.thumbnailUrl ?? '' })],
    }))
  }

  function addSet(sectionId, exerciseId) {
    updateExercise(sectionId, exerciseId, (exercise) => ({
      ...exercise,
      sets: [...exercise.sets, createSet()],
    }))
  }

  function deleteSet(sectionId, exerciseId, setId) {
    updateExercise(sectionId, exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((setValues) => setValues.id !== setId),
    }))
  }

  function updateSetField(sectionId, exerciseId, setId, field, value) {
    updateExercise(sectionId, exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((setValues) => (setValues.id === setId ? { ...setValues, [field]: value } : setValues)),
    }))
  }

  return (
    <div className="grid gap-4">
      {sections.length === 0 ? (
        <Empty className="border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)]">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-shell-primary-button-bg)]">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>No sections yet</EmptyTitle>
            <EmptyDescription className="text-[var(--admin-dashboard-card-muted)]">Add a section to this workout.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={addSection} disabled={readOnly} className="min-h-[40px] w-full justify-center rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-transparent text-center text-[var(--admin-shell-primary-button-bg)] hover:bg-[var(--admin-shell-primary-green-light-bg)] hover:text-[var(--admin-shell-primary-button-bg)]">
              <Plus className="size-4 text-[var(--admin-shell-primary-button-bg)]" aria-hidden="true" />
              Add a section
            </Button>
            <Button type="button" variant="outline" disabled={readOnly} className="min-h-[40px] rounded-[12px]">
              Import PDF
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <Button type="button" onClick={addSection} disabled={readOnly} className="min-h-[40px] w-full justify-center rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-transparent text-center text-[var(--admin-shell-primary-button-bg)] hover:bg-[var(--admin-shell-primary-green-light-bg)] hover:text-[var(--admin-shell-primary-button-bg)]">
            <Plus className="size-4 text-[var(--admin-shell-primary-button-bg)]" aria-hidden="true" />
            Add section
          </Button>

          <KanbanBoard className="gap-4" onDragEnd={handleSectionDragEnd}>
            <KanbanColumn itemIds={sections.map((section) => section.id)}>
              {sections.map((section) => (
                <KanbanItem key={section.id} id={section.id} columnId="training-sections" className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] shadow-none">
                  <div className="grid gap-0">
                <div className={`flex items-center justify-between gap-3 px-4 py-4 ${section.isExpanded ? 'border-b border-[var(--admin-dashboard-card-border)]' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{section.label}</p>
                    <p className="text-xs text-[var(--admin-dashboard-card-muted)]">{section.exercises.length} exercises</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSection(section.id, (currentSection) => ({ ...currentSection, isExpanded: !currentSection.isExpanded }))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-transparent text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-dashboard-card-text)]"
                    >
                      {section.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="sr-only">Toggle {section.label}</span>
                    </button>
                    <span className="inline-flex items-center justify-center text-[var(--admin-dashboard-card-muted)]">
                      <GripVertical className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                {section.isExpanded ? (
                  <div className="grid gap-4 px-4 py-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]">Exercises</label>
                      <div className="grid gap-3">
                        <div className="flex items-center gap-2 rounded-[12px] border border-[var(--admin-dashboard-card-border)] px-3 focus-within:border-[var(--admin-shell-primary-button-bg)]">
                          <Search className="h-4 w-4 text-[var(--admin-dashboard-card-muted)]" />
                          <Input
                            value={section.draftExerciseQuery}
                            onChange={(event) => updateSection(section.id, (currentSection) => ({ ...currentSection, draftExerciseQuery: event.target.value }))}
                            placeholder="Search exercise by name..."
                            className="h-11 border-0 bg-transparent px-0 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:ring-0 focus-visible:border-0"
                          />
                        </div>
                        {section.draftExerciseQuery ? (
                          <div className="mt-3 grid gap-2">
                            {EXERCISE_LIBRARY.filter((exerciseOption) => exerciseOption.title.toLowerCase().includes(section.draftExerciseQuery.toLowerCase())).map((exerciseOption) => (
                              <button
                                key={exerciseOption.id}
                                type="button"
                                onClick={() => addExercise(section.id, exerciseOption)}
                                className="rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-3 py-3 text-left text-sm text-[var(--admin-dashboard-card-text)] hover:border-[var(--admin-shell-accent)] hover:text-[var(--admin-dashboard-card-text)]"
                              >
                                {exerciseOption.title}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => updateSection(section.id, (currentSection) => ({ ...currentSection, draftExerciseQuery: '' }))}
                              className="text-left text-sm font-medium text-[var(--admin-shell-primary-button-bg)] hover:text-[var(--admin-shell-primary-button-bg)]"
                            >
                              Show less
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => updateSection(section.id, (currentSection) => ({ ...currentSection, showInstruction: !currentSection.showInstruction }))}
                        className="w-fit text-sm font-medium text-[var(--admin-shell-primary-button-bg)] hover:text-[var(--admin-shell-primary-button-bg)]"
                      >
                        {section.showInstruction ? 'Show less' : 'Add instruction'}
                      </button>
                      {section.showInstruction ? (
                        <Textarea
                          value={section.instruction}
                          onChange={(event) => updateSection(section.id, (currentSection) => ({ ...currentSection, instruction: event.target.value }))}
                          placeholder="Add a coaching cue for this section"
                          className="min-h-[100px] rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[#3BE0AF]/20"
                        />
                      ) : null}
                    </div>

                    <KanbanBoard className="gap-3" onDragEnd={(event) => handleExerciseDragEnd(section.id, event)}>
                      <KanbanColumn itemIds={section.exercises.map((exercise) => exercise.id)}>
                        {section.exercises.map((exercise) => {
                          const setCountLabel = `${exercise.sets.length} set${exercise.sets.length === 1 ? '' : 's'}`

                          return (
                            <KanbanItem key={exercise.id} id={exercise.id} columnId={section.id} className="rounded-[16px] border border-[var(--admin-dashboard-card-border)]">
                              <div className="grid gap-0">
                                <div className={`flex items-center justify-between gap-3 px-4 py-4 ${exercise.isExpanded ? 'border-b border-[var(--admin-dashboard-card-border)]' : ''}`}>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      className="inline-flex h-9 w-9 items-center justify-center text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-dashboard-card-text)]"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                      <span className="sr-only">Drag exercise</span>
                                    </button>
                                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--admin-dashboard-card-border)] bg-transparent text-[var(--admin-dashboard-card-muted)]">
                                      {exercise.thumbnailUrl ? (
                                        <img
                                          src={exercise.thumbnailUrl}
                                          alt=""
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <ImageIcon className="h-4 w-4" />
                                      )}
                                    </span>
                                    <div>
                                      <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{exercise.title}</p>
                                      <p className="text-xs text-[var(--admin-dashboard-card-muted)]">{setCountLabel}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateExercise(section.id, exercise.id, (currentExercise) => ({ ...currentExercise, isExpanded: !currentExercise.isExpanded }))}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-transparent text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-dashboard-card-text)]"
                                    >
                                      {exercise.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      <span className="sr-only">Toggle {exercise.title}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateSection(section.id, (currentSection) => ({ ...currentSection, exercises: currentSection.exercises.filter((currentExercise) => currentExercise.id !== exercise.id) }))}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-transparent text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-shell-primary-red-bg)]"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete {exercise.title}</span>
                                    </button>
                                  </div>
                                </div>

                                {exercise.isExpanded ? (
                                  <div className="grid gap-4 px-4 py-4">
                                    <DndContext sensors={setRowSensors} collisionDetection={closestCenter} onDragEnd={(event) => handleSetDragEnd(section.id, exercise.id, event)}>
                                      <Table className="[&_th]:border-b [&_th]:border-[var(--admin-dashboard-card-border)] [&_td]:border-b [&_td]:border-[var(--admin-dashboard-card-border)]">
                                        <TableHeader>
                                          <TableRow className="border-[var(--admin-dashboard-card-border)]">
                                            <TableHead className="w-[52px]"></TableHead>
                                            <TableHead className="text-center">#</TableHead>
                                            <TableHead className="text-center">Tempo</TableHead>
                                            <TableHead className="text-center">Effort</TableHead>
                                            <TableHead className="text-center">L/R</TableHead>
                                            <TableHead className="text-center">Duration</TableHead>
                                            <TableHead className="text-center">Distance</TableHead>
                                            <TableHead className="text-center">Rest</TableHead>
                                            <TableHead className="text-center">Reps</TableHead>
                                            <TableHead className="w-[56px]"></TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <SortableContext items={exercise.sets.map((setValues) => setValues.id)} strategy={verticalListSortingStrategy}>
                                          <TableBody>
                                            {exercise.sets.map((setValues, setIndex) => (
                                              <SortableSetRow
                                                key={setValues.id}
                                                sectionId={section.id}
                                                exerciseId={exercise.id}
                                                setIndex={setIndex}
                                                setValues={setValues}
                                                updateSetField={updateSetField}
                                                deleteSet={deleteSet}
                                              />
                                            ))}
                                          </TableBody>
                                        </SortableContext>
                                      </Table>
                                    </DndContext>

                                    <div className="flex items-center justify-between gap-3">
                                      <Button type="button" variant="outline" onClick={() => addSet(section.id, exercise.id)} className="rounded-[12px] border-[var(--admin-dashboard-card-border)] bg-transparent text-[var(--admin-shell-primary-button-bg)] hover:bg-[var(--admin-shell-primary-green-light-bg)] hover:text-[var(--admin-shell-primary-button-bg)]">
                                        <Plus className="h-4 w-4" />
                                        Add Set
                                      </Button>
                                      <button
                                        type="button"
                                        onClick={() => updateExercise(section.id, exercise.id, (currentExercise) => ({ ...currentExercise, showInstruction: !currentExercise.showInstruction }))}
                                        className="text-sm font-medium text-[var(--admin-shell-primary-button-bg)] hover:text-[var(--admin-shell-primary-button-bg)]"
                                      >
                                        {exercise.showInstruction ? 'Show less' : 'Add instruction'}
                                      </button>
                                    </div>

                                    {exercise.showInstruction ? (
                                      <Textarea
                                        value={exercise.instruction}
                                        onChange={(event) => updateExercise(section.id, exercise.id, (currentExercise) => ({ ...currentExercise, instruction: event.target.value }))}
                                        placeholder="Add a coaching cue for this exercise"
                                        className="min-h-[100px] rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[#3BE0AF]/20"
                                      />
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </KanbanItem>
                          )
                        })}
                      </KanbanColumn>
                    </KanbanBoard>
                  </div>
                ) : null}
              </div>
            </KanbanItem>
          ))}
        </KanbanColumn>
      </KanbanBoard>
        </>
      )}
    </div>
  )
}
