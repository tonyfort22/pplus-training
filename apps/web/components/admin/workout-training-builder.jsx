'use client'

import { useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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

function createExercise(id, title, defaultSets = []) {
  exerciseNumberSeed += 1
  return {
    id: `${id}-${exerciseNumberSeed}`,
    title,
    isExpanded: true,
    showInstruction: false,
    instruction: '',
    sets: defaultSets.map((setValues) => createSet(setValues)),
  }
}

function createSection(label, exercises = []) {
  return {
    id: `section-${label.toLowerCase()}`,
    label,
    isExpanded: true,
    showInstruction: false,
    instruction: '',
    draftExerciseQuery: '',
    exercises,
  }
}

function createInitialTrainingSections() {
  return [
    createSection('A1', [
      createExercise('exercise-skater-hops', 'Skater hops', EXERCISE_LIBRARY[0].defaultSets),
      createExercise('exercise-sled-sprint', 'Sled sprint', EXERCISE_LIBRARY[1].defaultSets),
    ]),
    createSection('A2', [
      createExercise('exercise-copenhagen-plank', 'Copenhagen plank', EXERCISE_LIBRARY[2].defaultSets),
      createExercise('exercise-spirit-bike', 'Spirit Bike sprint', EXERCISE_LIBRARY[3].defaultSets),
    ]),
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: setValues.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'border-[#1C2940] bg-[#15233A]' : 'border-[#1C2940]'}>
      <td className="w-[52px] px-2 py-2 align-middle">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[#8EA0BC] hover:text-[#EEF4FF]"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
          <span className="sr-only">Drag set row</span>
        </button>
      </td>
      <td className="px-2 py-2 align-middle text-[#8EA0BC]">{setIndex + 1}</td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.tempo} onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'tempo', event.target.value)} className="h-9 border-[#24334A] bg-[#111D30] text-[#DCE6F8]" />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.effort} onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'effort', event.target.value)} className="h-9 border-[#24334A] bg-[#111D30] text-[#DCE6F8]" />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.side} onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'side', event.target.value)} className="h-9 border-[#24334A] bg-[#111D30] text-[#DCE6F8]" />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.duration} onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'duration', event.target.value)} className="h-9 border-[#24334A] bg-[#111D30] text-[#DCE6F8]" />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.distance} onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'distance', event.target.value)} className="h-9 border-[#24334A] bg-[#111D30] text-[#DCE6F8]" />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.rest} onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'rest', event.target.value)} className="h-9 border-[#24334A] bg-[#111D30] text-[#DCE6F8]" />
      </td>
      <td className="px-2 py-2 align-middle">
        <Input value={setValues.reps} onChange={(event) => updateSetField(sectionId, exerciseId, setValues.id, 'reps', event.target.value)} className="h-9 border-[#24334A] bg-[#111D30] text-[#DCE6F8]" />
      </td>
      <td className="px-2 py-2 align-middle">
        <button
          type="button"
          onClick={() => deleteSet(sectionId, exerciseId, setValues.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[#8EA0BC] hover:text-[#EEF4FF]"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete set</span>
        </button>
      </td>
    </tr>
  )
}

export default function WorkoutTrainingBuilder() {
  const [sections, setSections] = useState(() => createInitialTrainingSections())
  const setRowSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  function addSection() {
    setSections((currentSections) => [
      ...currentSections,
      createSection(getNextSectionLabel(currentSections), []),
    ])
  }

  function handleSectionDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    setSections((currentSections) => reorderItems(currentSections, active.id, over.id))
  }

  function handleExerciseDragEnd(sectionId, { active, over }) {
    if (!over || active.id === over.id) return

    setSections((currentSections) =>
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
    setSections((currentSections) =>
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
      exercises: [...section.exercises, createExercise(exerciseLibraryItem.id, exerciseLibraryItem.title, exerciseLibraryItem.defaultSets)],
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
      <div className="flex justify-end">
        <Button type="button" onClick={addSection} className="rounded-[12px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]">
          Add section
        </Button>
      </div>

      <KanbanBoard className="gap-4" onDragEnd={handleSectionDragEnd}>
        <KanbanColumn itemIds={sections.map((section) => section.id)}>
          {sections.map((section) => (
            <KanbanItem key={section.id} id={section.id} columnId="training-sections" className="rounded-[18px] border border-[#24334A] bg-[#111827] shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
              <div className="grid gap-0">
                <div className="flex items-center justify-between gap-3 border-b border-[#24334A] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2F4563] bg-[#0F1728] text-xs font-semibold tracking-[0.18em] text-[#7DF5CD]">
                      {section.label}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#EEF4FF]">{section.label}</p>
                      <p className="text-xs text-[#8EA0BC]">{section.exercises.length} exercises</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSection(section.id, (currentSection) => ({ ...currentSection, isExpanded: !currentSection.isExpanded }))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#24334A] bg-[#0F1728] text-[#8EA0BC] hover:text-[#EEF4FF]"
                    >
                      {section.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="sr-only">Toggle {section.label}</span>
                    </button>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#24334A] bg-[#0F1728] text-[#8EA0BC]">
                      <GripVertical className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                {section.isExpanded ? (
                  <div className="grid gap-4 px-4 py-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#DCE6F8]">Exercises</label>
                      <div className="rounded-[14px] border border-[#24334A] bg-[#0F1728] p-3">
                        <div className="flex items-center gap-2 rounded-[12px] border border-[#24334A] bg-[#111D30] px-3">
                          <Search className="h-4 w-4 text-[#6F84A6]" />
                          <Input
                            value={section.draftExerciseQuery}
                            onChange={(event) => updateSection(section.id, (currentSection) => ({ ...currentSection, draftExerciseQuery: event.target.value }))}
                            placeholder="Type here..."
                            className="h-11 border-0 bg-transparent px-0 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:ring-0 focus-visible:border-0"
                          />
                        </div>
                        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#60708F]">Search exercises</p>
                        {section.draftExerciseQuery ? (
                          <div className="mt-3 grid gap-2">
                            {EXERCISE_LIBRARY.filter((exerciseOption) => exerciseOption.title.toLowerCase().includes(section.draftExerciseQuery.toLowerCase())).map((exerciseOption) => (
                              <button
                                key={exerciseOption.id}
                                type="button"
                                onClick={() => addExercise(section.id, exerciseOption)}
                                className="rounded-[12px] border border-[#24334A] bg-[#111D30] px-3 py-3 text-left text-sm text-[#DCE6F8] hover:border-[#3BE0AF] hover:text-[#EEF4FF]"
                              >
                                {exerciseOption.title}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => updateSection(section.id, (currentSection) => ({ ...currentSection, draftExerciseQuery: '' }))}
                              className="text-left text-sm font-medium text-[#7DF5CD] hover:text-[#A6F8DB]"
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
                        className="w-fit text-sm font-medium text-[#7DF5CD] hover:text-[#A6F8DB]"
                      >
                        {section.showInstruction ? 'Show less' : 'Add instruction'}
                      </button>
                      {section.showInstruction ? (
                        <Textarea
                          value={section.instruction}
                          onChange={(event) => updateSection(section.id, (currentSection) => ({ ...currentSection, instruction: event.target.value }))}
                          placeholder="Add a coaching cue for this section"
                          className="min-h-[100px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                        />
                      ) : null}
                    </div>

                    <KanbanBoard className="gap-3" onDragEnd={(event) => handleExerciseDragEnd(section.id, event)}>
                      <KanbanColumn itemIds={section.exercises.map((exercise) => exercise.id)}>
                        {section.exercises.map((exercise) => {
                          const setCountLabel = `${exercise.sets.length} set${exercise.sets.length === 1 ? '' : 's'}`

                          return (
                            <KanbanItem key={exercise.id} id={exercise.id} columnId={section.id} className="rounded-[16px] border border-[#24334A] bg-[#0F1728]">
                              <div className="grid gap-0">
                                <div className="flex items-center justify-between gap-3 border-b border-[#24334A] px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[#8EA0BC]">
                                      <GripVertical className="h-4 w-4" />
                                    </span>
                                    <div>
                                      <p className="text-sm font-semibold text-[#EEF4FF]">{exercise.title}</p>
                                      <p className="text-xs text-[#8EA0BC]">{setCountLabel}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateExercise(section.id, exercise.id, (currentExercise) => ({ ...currentExercise, isExpanded: !currentExercise.isExpanded }))}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[#8EA0BC] hover:text-[#EEF4FF]"
                                    >
                                      {exercise.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      <span className="sr-only">Toggle {exercise.title}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateSection(section.id, (currentSection) => ({ ...currentSection, exercises: currentSection.exercises.filter((currentExercise) => currentExercise.id !== exercise.id) }))}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[#8EA0BC] hover:text-[#EEF4FF]"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete {exercise.title}</span>
                                    </button>
                                  </div>
                                </div>

                                {exercise.isExpanded ? (
                                  <div className="grid gap-4 px-4 py-4">
                                    <DndContext sensors={setRowSensors} collisionDetection={closestCenter} onDragEnd={(event) => handleSetDragEnd(section.id, exercise.id, event)}>
                                      <Table className="[&_th]:border-b [&_th]:border-[#24334A] [&_td]:border-b [&_td]:border-[#1C2940]">
                                        <TableHeader>
                                          <TableRow className="border-[#24334A]">
                                            <TableHead className="w-[52px]"></TableHead>
                                            <TableHead>#</TableHead>
                                            <TableHead>Tempo</TableHead>
                                            <TableHead>Effort</TableHead>
                                            <TableHead>L/R</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Distance</TableHead>
                                            <TableHead>Rest</TableHead>
                                            <TableHead>Reps</TableHead>
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
                                      <Button type="button" variant="outline" onClick={() => addSet(section.id, exercise.id)} className="rounded-[12px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]">
                                        Add Set
                                      </Button>
                                      <button
                                        type="button"
                                        onClick={() => updateExercise(section.id, exercise.id, (currentExercise) => ({ ...currentExercise, showInstruction: !currentExercise.showInstruction }))}
                                        className="text-sm font-medium text-[#7DF5CD] hover:text-[#A6F8DB]"
                                      >
                                        {exercise.showInstruction ? 'Show less' : 'Add instruction'}
                                      </button>
                                    </div>

                                    {exercise.showInstruction ? (
                                      <Textarea
                                        value={exercise.instruction}
                                        onChange={(event) => updateExercise(section.id, exercise.id, (currentExercise) => ({ ...currentExercise, instruction: event.target.value }))}
                                        placeholder="Add a coaching cue for this exercise"
                                        className="min-h-[100px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
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
    </div>
  )
}
