'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bot, CheckCircle2, Search, Sparkles } from 'lucide-react'

import Alert from '@/components/ui/alert'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

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

const trainingTypeOptions = ['Warmup', 'Speed', 'Edge Work', 'Conditioning']
const workoutDayTypeOptions = ['Speed Accelerator A', 'Speed Accelerator B', 'Speed Accelerator C', 'Edge Work A', 'Edge Work B', 'Deload', 'Other']
const stressLevelOptions = ['High', 'Moderate', 'Low', 'Recovery']
const phaseGoalOptions = ['Tissue remodeling', 'Max strength', 'Strength-speed', 'Speed-strength', 'Work capacity', 'Lactic conditioning', 'Other']
const phaseOptions = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

const overviewInputClassName = 'h-11 rounded-[12px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20'
const overviewSelectTriggerClassName = 'ai-draft-primary-select-trigger h-11 rounded-[12px] px-4 text-sm font-medium'
const overviewSelectContentClassName = 'ai-draft-primary-select-content rounded-2xl'
const exerciseMatchSelectTriggerClassName = 'ai-draft-primary-select-trigger h-10 rounded-[12px] px-4 text-sm font-medium'
const exerciseMatchSelectContentClassName = 'ai-draft-primary-select-content rounded-2xl'
const overviewTextareaClassName = 'min-h-[118px] rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-3 text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20'

const trainingTypeRules = [
  {
    type: 'Warmup',
    keywords: ['warmup', 'warm up', 'activation', 'mobility', 'prep', 'preparation'],
  },
  {
    type: 'Speed',
    keywords: ['speed accelerator', 'speed', 'sprint', 'acceleration', 'deceleration', 'plyo', 'jump', 'power'],
  },
  {
    type: 'Edge Work',
    keywords: ['edge work', 'edgework', 'edge', 'skating', 'crossover', 'stride', 'agility'],
  },
  {
    type: 'Conditioning',
    keywords: ['conditioning', 'bike', 'run', 'heart rate', 'interval', 'tempo run', 'aerobic', 'anaerobic'],
  },
]

const sampleDraft = {
  workout: {
    name: 'Speed Accelerator A',
    program: 'Off-Season Domination 26',
    phase: 'Phase 1',
    phaseGoal: 'Tissue remodeling',
    sourceFileName: 'OSD26_P1_A.pdf',
    trainingType: 'Speed',
    workoutDayType: 'Speed Accelerator A',
    stressLevel: 'High',
    trainingEmphasis: 'Lower-body acceleration',
    numberOfWeeks: 4,
    startDate: '',
    endDate: '',
    notes: '',
  },
  sections: [
    {
      label: 'A1',
      exercises: [
        {
          name: 'Depth Drop',
          notes: 'Land at skating depth and stop on a dime.',
          weeks: [
            { week: 1, tempo: 'N/A', sets: 2, reps: '5', restSeconds: 30 },
            { week: 2, tempo: 'N/A', sets: 3, reps: '5', restSeconds: 30 },
            { week: 3, tempo: 'N/A', sets: 3, reps: '5', restSeconds: 30 },
            { week: 4, tempo: 'N/A', sets: 3, reps: '5', restSeconds: 30 },
          ],
        },
      ],
    },
    {
      label: 'A2',
      exercises: [
        {
          name: 'Bent Knee Reverse Crunch',
          notes: 'Use your abs to pull your knee via your pelvis tucking to your elbows.',
          weeks: [
            { week: 1, tempo: '2-0-0', sets: 2, reps: '8', restSeconds: 60 },
            { week: 2, tempo: '2-0-0', sets: 3, reps: '8', restSeconds: 60 },
            { week: 3, tempo: '2-0-0', sets: 3, reps: '10', restSeconds: 60 },
            { week: 4, tempo: '2-0-0', sets: 3, reps: '12', restSeconds: 60 },
          ],
        },
      ],
    },
    {
      label: 'B1',
      exercises: [
        {
          name: 'Goblet Front Foot Elevated Split Squat Hold',
          notes: 'Keep your front knee over your toe so you have a forward shin angle.',
          weeks: [
            { week: 1, tempo: 'N/A', sets: 2, duration: '20s/side', restSeconds: 30 },
            { week: 2, tempo: 'N/A', sets: 3, duration: '20s/side', restSeconds: 30 },
            { week: 3, tempo: 'N/A', sets: 3, duration: '30s/side', restSeconds: 30 },
            { week: 4, tempo: 'N/A', sets: 3, duration: '40s/side', restSeconds: 30 },
          ],
        },
      ],
    },
    {
      label: 'B2',
      exercises: [
        {
          name: '1/2 Kneel Anti-Rotation Press [Outside Leg Forward]',
          notes: "Posterior tuck your pelvis like you're trying to tuck a tail between your legs.",
          weeks: [
            { week: 1, tempo: '2-0-0', sets: 2, reps: '8/side', restSeconds: 60 },
            { week: 2, tempo: '2-0-0', sets: 3, reps: '8/side', restSeconds: 60 },
            { week: 3, tempo: '2-0-0', sets: 3, reps: '10/side', restSeconds: 60 },
            { week: 4, tempo: '2-0-0', sets: 3, reps: '12/side', restSeconds: 60 },
          ],
        },
      ],
    },
    {
      label: 'C1',
      exercises: [
        {
          name: 'Glute Ham Raise Hold',
          notes: "Posterior tuck your pelvis like you're trying to tuck a tail between your legs.",
          weeks: [
            { week: 1, tempo: 'N/A', sets: 2, duration: '20s', restSeconds: 30 },
            { week: 2, tempo: 'N/A', sets: 3, duration: '20s', restSeconds: 30 },
            { week: 3, tempo: 'N/A', sets: 3, duration: '25s', restSeconds: 30 },
            { week: 4, tempo: 'N/A', sets: 3, duration: '30s', restSeconds: 30 },
          ],
        },
      ],
    },
    {
      label: 'C2',
      exercises: [
        {
          name: '1-Leg Wall Calf Raise',
          notes: 'Step further away from the wall to make it more challenging, or closer to the wall to make it easier.',
          weeks: [
            { week: 1, tempo: '2-0-0', sets: 2, reps: '8/side', restSeconds: 30 },
            { week: 2, tempo: '2-0-0', sets: 3, reps: '8/side', restSeconds: 30 },
            { week: 3, tempo: '2-0-0', sets: 3, reps: '10/side', restSeconds: 30 },
            { week: 4, tempo: '2-0-0', sets: 3, reps: '12/side', restSeconds: 30 },
          ],
        },
      ],
    },
    {
      label: 'C3',
      exercises: [
        {
          name: 'Wall Supported Toe Raise',
          notes: 'Step further away from the wall to make it more challenging, or closer to the wall to make it easier.',
          weeks: [
            { week: 1, tempo: '2-0-0', sets: 2, reps: '8', restSeconds: 60 },
            { week: 2, tempo: '2-0-0', sets: 3, reps: '8', restSeconds: 60 },
            { week: 3, tempo: '2-0-0', sets: 3, reps: '10', restSeconds: 60 },
            { week: 4, tempo: '2-0-0', sets: 3, reps: '12', restSeconds: 60 },
          ],
        },
      ],
    },
    {
      label: 'Conditioning',
      exercises: [
        {
          name: 'Fan Bike or Run',
          alternatives: ['Fan Bike', 'Run'],
          notes: 'Heart rate should reach >90% of max every rep.',
          weeks: [
            { week: 1, tempo: 'N/A', sets: 4, duration: '1min', restSeconds: 60 },
            { week: 2, tempo: 'N/A', sets: 5, duration: '1min', restSeconds: 60 },
            { week: 3, tempo: 'N/A', sets: 6, duration: '1min', restSeconds: 60 },
            { week: 4, tempo: 'N/A', sets: 6, duration: '1min', restSeconds: 60 },
          ],
        },
      ],
    },
  ],
  warnings: [],
}

function createExerciseMatch(exerciseName) {
  const exactMatch = exerciseMatchOptions.find((option) => option.toLowerCase() === String(exerciseName).toLowerCase())
  if (exactMatch) {
    return { status: 'matched', exerciseId: exactMatch, exerciseName: exactMatch }
  }

  return { status: 'suggested', exerciseId: '', exerciseName: '' }
}

function collectDraftTrainingText(draft) {
  const workout = draft?.workout ?? {}
  const sectionText = (draft?.sections ?? []).flatMap((section) => {
    return [
      section.label,
      section.title,
      section.instructions,
      ...(section.exercises ?? []).flatMap((exercise) => [
        exercise.name,
        exercise.notes,
        ...(exercise.alternatives ?? []),
      ]),
    ]
  })

  return [
    workout.name,
    workout.program,
    workout.phase,
    workout.sourceFileName,
    workout.notes,
    ...sectionText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function inferTrainingTypeFromDraft(draft) {
  const explicitType = draft?.workout?.trainingType
  if (trainingTypeOptions.includes(explicitType)) return explicitType

  const normalizedText = collectDraftTrainingText(draft)

  if (normalizedText.includes('speed accelerator')) {
    return 'Speed'
  }

  const matchedRule = trainingTypeRules.find((rule) => {
    return rule.keywords.some((keyword) => normalizedText.includes(keyword))
  })

  return matchedRule?.type ?? 'Speed'
}

function getWorkoutDayTypeDefaults(workoutDayType) {
  if (workoutDayType === 'Speed Accelerator A') {
    return { trainingType: 'Speed', stressLevel: 'High', trainingEmphasis: 'Lower-body acceleration' }
  }

  if (workoutDayType === 'Speed Accelerator B') {
    return { trainingType: 'Speed', stressLevel: 'Moderate', trainingEmphasis: 'Upper-body armor / hypertrophy' }
  }

  if (workoutDayType === 'Speed Accelerator C') {
    return { trainingType: 'Speed', stressLevel: 'High', trainingEmphasis: 'Total-body high stress' }
  }

  if (workoutDayType === 'Edge Work A' || workoutDayType === 'Edge Work B') {
    return { trainingType: 'Edge Work', stressLevel: 'Low', trainingEmphasis: 'Recovery / mobility / aerobic' }
  }

  if (workoutDayType === 'Deload') {
    return { stressLevel: 'Recovery' }
  }

  return {}
}

function parseSampleRoutingFromFileName(sourceFileName = '') {
  const weekMatch = String(sourceFileName).match(/week[-_\s]*(\d+)/i)
  const dayMatch = String(sourceFileName).match(/day[-_\s]*(\d+)/i)

  return {
    weekNumber: weekMatch ? Number(weekMatch[1]) : null,
    dayNumber: dayMatch ? Number(dayMatch[1]) : null,
  }
}

export function createSampleAiWorkoutDraft(file = null, index = 0) {
  const sourceFileName = file?.name || sampleDraft.workout.sourceFileName
  const sampleRouting = parseSampleRoutingFromFileName(sourceFileName)
  const forceUnmatchedExerciseFixture = sourceFileName.toLowerCase().includes('unmatched')
  const baseDraftName = sampleDraft.workout.name
  const draftName = index > 0 ? `${baseDraftName.replace(/\s+[A-Z]$/, '')} ${String.fromCharCode(65 + index)}` : baseDraftName
  const draftWithFileName = {
    ...sampleDraft,
    workout: {
      ...sampleDraft.workout,
      name: draftName,
      sourceFileName,
      weekNumber: sampleRouting.weekNumber,
      dayNumber: sampleRouting.dayNumber,
    },
  }

  return {
    ...draftWithFileName,
    workout: {
      ...draftWithFileName.workout,
      trainingType: inferTrainingTypeFromDraft(draftWithFileName),
    },
    sections: sampleDraft.sections.map((section, sectionIndex) => ({
      ...section,
      exercises: section.exercises.map((exercise, exerciseIndex) => ({
        ...exercise,
        exerciseMatch: forceUnmatchedExerciseFixture && sectionIndex === 0 && exerciseIndex === 0
          ? { status: 'unmatched', exerciseId: '', exerciseName: '' }
          : exercise.exerciseMatch ?? createExerciseMatch(exercise.name),
      })),
    })),
  }
}

export function createSampleAiWorkoutDrafts(files = []) {
  const fileList = files.length ? files : [null]
  return fileList.map((file, index) => createSampleAiWorkoutDraft(file, index))
}

function createOverviewDraftState(draft) {
  return {
    workoutName: draft?.workout?.name ?? '',
    phase: draft?.workout?.phase ?? 'Phase 1',
    phaseGoal: draft?.workout?.phaseGoal ?? 'Tissue remodeling',
    trainingType: draft?.workout?.trainingType ?? 'Speed',
    workoutDayType: draft?.workout?.workoutDayType ?? 'Speed Accelerator A',
    stressLevel: draft?.workout?.stressLevel ?? 'High',
    trainingEmphasis: draft?.workout?.trainingEmphasis ?? '',
    programName: draft?.workout?.program ?? '',
    numberOfWeeks: String(draft?.workout?.numberOfWeeks ?? 4),
    startDate: draft?.workout?.startDate ?? '',
    endDate: draft?.workout?.endDate ?? '',
    description: draft?.workout?.description ?? draft?.workout?.notes ?? '',
  }
}

function getExerciseCount(sections = []) {
  return sections.reduce((total, section) => total + (section.exercises?.length ?? 0), 0)
}

function getTotalSetCount(sections = []) {
  return sections.reduce((sectionTotal, section) => {
    return sectionTotal + (section.exercises ?? []).reduce((exerciseTotal, exercise) => {
      return exerciseTotal + (exercise.weeks ?? []).reduce((weekTotal, week) => weekTotal + Number(week.sets ?? 0), 0)
    }, 0)
  }, 0)
}

function getSectionBlockMetadata(sections = [], sectionIndex) {
  const section = sections[sectionIndex] ?? {}
  const label = String(section.label ?? '')
  const blockMatch = label.match(/^([A-Z]+)(\d+)$/i)

  if (!blockMatch) {
    return {
      blockLabel: label || 'Unlabeled',
      supersetLabels: label || 'Single section',
      isSuperset: false,
    }
  }

  const blockLabel = blockMatch[1].toUpperCase()
  const blockSections = sections.filter((candidateSection) => {
    return String(candidateSection.label ?? '').toUpperCase().startsWith(blockLabel)
  })
  const supersetLabels = blockSections.map((blockSection) => blockSection.label).join('/')

  return {
    blockLabel,
    supersetLabels,
    isSuperset: blockSections.length > 1,
  }
}

function createSectionDraftState(sections = []) {
  return sections.map((section, sectionIndex) => {
    const sectionBlockMetadata = getSectionBlockMetadata(sections, sectionIndex)

    return {
      label: section.label ?? '',
      blockLabel: sectionBlockMetadata.blockLabel,
      supersetLabels: sectionBlockMetadata.supersetLabels,
      instructions: section.instructions ?? section.notes ?? section.blockLabel ?? '',
    }
  })
}

function createExerciseDraftState(sections = []) {
  return sections.map((section) => ({
    exercises: (section.exercises ?? []).map((exercise) => ({
      name: exercise.name ?? '',
      notes: exercise.notes ?? '',
    })),
  }))
}

function getExerciseKey(sectionLabel, exerciseName) {
  return `${sectionLabel}:${exerciseName}`
}

function buildAcceptedAiWorkoutDraft({ activeDraft, overviewDraft, sections, sectionDrafts, exerciseDrafts, getSelectedMatch }) {
  return {
    ...activeDraft,
    workout: {
      ...activeDraft.workout,
      name: overviewDraft.workoutName,
      program: overviewDraft.programName,
      phase: overviewDraft.phase,
      phaseGoal: overviewDraft.phaseGoal,
      trainingType: overviewDraft.trainingType,
      workoutDayType: overviewDraft.workoutDayType,
      stressLevel: overviewDraft.stressLevel,
      trainingEmphasis: overviewDraft.trainingEmphasis,
      numberOfWeeks: Number(overviewDraft.numberOfWeeks),
      startDate: overviewDraft.startDate,
      endDate: overviewDraft.endDate,
      description: overviewDraft.description,
      notes: overviewDraft.description,
    },
    sections: sections.map((section, sectionIndex) => {
      const reviewedSectionLabel = sectionDrafts[sectionIndex]?.label ?? section.label
      const reviewedBlockLabel = sectionDrafts[sectionIndex]?.blockLabel ?? getSectionBlockMetadata(sections, sectionIndex).blockLabel
      const reviewedSectionInstructions = sectionDrafts[sectionIndex]?.instructions ?? section.instructions ?? section.notes ?? ''

      return {
        ...section,
        label: reviewedSectionLabel,
        blockLabel: reviewedBlockLabel,
        instructions: reviewedSectionInstructions,
        exercises: (section.exercises ?? []).map((exercise, exerciseIndex) => {
          const reviewedExerciseName = exerciseDrafts[sectionIndex]?.exercises?.[exerciseIndex]?.name ?? exercise.name
          const reviewedExerciseNotes = exerciseDrafts[sectionIndex]?.exercises?.[exerciseIndex]?.notes ?? exercise.notes ?? ''
          const selectedExerciseMatch = getSelectedMatch(section.label, exercise)
          const selectedExistingMatch = selectedExerciseMatch && selectedExerciseMatch === exercise.exerciseMatch?.exerciseName

          return {
            ...exercise,
            name: reviewedExerciseName,
            notes: reviewedExerciseNotes,
            exerciseMatch: {
              ...exercise.exerciseMatch,
              status: selectedExerciseMatch ? 'matched' : (exercise.exerciseMatch?.status ?? 'suggested'),
              exerciseId: selectedExistingMatch ? exercise.exerciseMatch?.exerciseId : selectedExerciseMatch || exercise.exerciseMatch?.exerciseId || '',
              exerciseName: selectedExerciseMatch || exercise.exerciseMatch?.exerciseName || '',
            },
          }
        }),
      }
    }),
  }
}

function formatPrescription(week = {}) {
  return week.reps ?? week.duration ?? '--'
}

function formatRest(restSeconds) {
  if (restSeconds === null || restSeconds === undefined || restSeconds === '') return '--'
  return `${restSeconds}s`
}

function getMatchBadgeClass(status) {
  if (status === 'matched') return 'border-[#3BE0AF]/30 bg-[#3BE0AF]/10 text-[#06B686]'
  if (status === 'unmatched' || status === 'missing') return 'border-red-500/30 bg-red-500/10 text-red-500'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-500'
}

function getReviewedMatchStatus(exercise, selectedMatch) {
  if (selectedMatch) return 'matched'
  return exercise.exerciseMatch?.status ?? 'suggested'
}

function getMatchHelperText(matchStatus) {
  if (matchStatus === 'matched') return 'Matched to an existing PPLUS exercise'
  if (matchStatus === 'unmatched' || matchStatus === 'missing') return 'Needs an exercise match before accepting'
  return 'Review suggested match before accepting'
}

function SummaryCard({ label, value, helper, featured = false }) {
  return (
    <Card className="rounded-[18px]">
      <CardHeader className={featured ? 'flex min-h-[108px] flex-col justify-center p-4' : 'p-4'}>
        <CardDescription className="text-xs font-medium uppercase tracking-[0.14em]">{label}</CardDescription>
        <CardTitle className={`${featured ? 'text-5xl font-semibold tracking-[-0.05em]' : 'text-lg'} text-[var(--admin-dashboard-card-text)]`}>
          {value}
        </CardTitle>
      </CardHeader>
      {helper ? <CardContent className="px-4 pb-4 text-sm text-[var(--admin-dashboard-card-muted)]">{helper}</CardContent> : null}
    </Card>
  )
}

function WeekTable({ weeks = [] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--admin-dashboard-card-border)]">
      <Table>
        <TableHeader className="[&_tr]:border-[color:var(--admin-dashboard-card-border)]">
          <TableRow>
            <TableHead>Week</TableHead>
            <TableHead>Tempo</TableHead>
            <TableHead>Sets</TableHead>
            <TableHead>Reps / Duration</TableHead>
            <TableHead>Rest</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:border-[color:var(--admin-dashboard-card-border)]">
          {weeks.map((week) => (
            <TableRow key={week.week}>
              <TableCell className="font-medium text-[var(--admin-dashboard-card-text)]">Week {week.week}</TableCell>
              <TableCell>{week.tempo ?? 'N/A'}</TableCell>
              <TableCell>{week.sets ?? '--'}</TableCell>
              <TableCell>{formatPrescription(week)}</TableCell>
              <TableCell>{formatRest(week.restSeconds)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ExerciseCard({ sectionIndex, exerciseIndex, sectionLabel, exercise, exerciseDraft, selectedMatch, onMatchChange, onExerciseNameChange, onExerciseNotesChange }) {
  const matchStatus = getReviewedMatchStatus(exercise, selectedMatch)
  const matchHelperText = getMatchHelperText(matchStatus)

  return (
    <Card className="rounded-[18px]">
      <CardHeader className="flex-row items-start justify-between gap-4 p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-[#3BE0AF]/30 bg-[#3BE0AF]/10 px-2 py-1 text-xs font-medium text-[#06B686] normal-case tracking-normal">
              {sectionLabel}
            </Badge>
            <Badge className={`rounded-full px-2 py-1 text-xs font-medium normal-case tracking-normal ${getMatchBadgeClass(matchStatus)}`}>
              {matchStatus === 'unmatched' ? 'Unmatched' : matchStatus === 'matched' ? 'Matched' : matchStatus === 'missing' ? 'Missing' : 'Suggested match'}
            </Badge>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`ai-draft-exercise-name-${sectionIndex}-${exerciseIndex}`}>Extracted exercise name</Label>
            <Input
              id={`ai-draft-exercise-name-${sectionIndex}-${exerciseIndex}`}
              value={exerciseDraft.name}
              onChange={(event) => onExerciseNameChange(event.target.value)}
              className={overviewInputClassName}
            />
          </div>
          <p className="text-sm text-[var(--admin-dashboard-card-muted)]">{matchHelperText}</p>
          {exercise.alternatives?.length ? (
            <CardDescription>Alternatives: {exercise.alternatives.join(', ')}</CardDescription>
          ) : null}
        </div>
        <div className="min-w-[240px]">
          <Select value={selectedMatch} onValueChange={onMatchChange}>
            <SelectTrigger className={exerciseMatchSelectTriggerClassName}>
              <SelectValue placeholder="Choose existing exercise" />
            </SelectTrigger>
            <SelectContent className={exerciseMatchSelectContentClassName}>
              {exerciseMatchOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <div className="grid gap-2">
          <Label htmlFor={`ai-draft-exercise-notes-${sectionIndex}-${exerciseIndex}`}>Exercise notes</Label>
          <Textarea
            id={`ai-draft-exercise-notes-${sectionIndex}-${exerciseIndex}`}
            value={exerciseDraft.notes}
            onChange={(event) => onExerciseNotesChange(event.target.value)}
            className={overviewTextareaClassName}
          />
        </div>
        <WeekTable weeks={exercise.weeks} />
      </CardContent>
    </Card>
  )
}
export default function AiWorkoutDraftSheet({
  open,
  onOpenChange,
  title = 'AI workout draft',
  draft = null,
  drafts = [],
  onCancel = () => {},
  onAccept = () => {},
  onAcceptAllRemaining = async () => {},
  isAccepting = false,
  destinationPreview = null,
}) {
  const sourceDraftList = useMemo(() => {
    if (drafts.length) return drafts
    if (draft) return [draft]
    return createSampleAiWorkoutDrafts()
  }, [draft, drafts])
  const [draftListOverride, setDraftListOverride] = useState(null)
  const draftList = draftListOverride ?? sourceDraftList
  const [activeDraftIndex, setActiveDraftIndex] = useState(0)
  const [revisionPrompt, setRevisionPrompt] = useState('')
  const [revisionError, setRevisionError] = useState('')
  const [isRevisingDraft, setIsRevisingDraft] = useState(false)
  const [isAcceptingDraft, setIsAcceptingDraft] = useState(false)
  const [exerciseMatches, setExerciseMatches] = useState({})

  useEffect(() => {
    setDraftListOverride(sourceDraftList)
    setActiveDraftIndex(0)
    setRevisionPrompt('')
    setRevisionError('')
  }, [open, sourceDraftList])

  function getDraftDestinationPreview(draftItem) {
    return typeof destinationPreview === 'function'
      ? destinationPreview(draftItem)
      : destinationPreview
  }

  const activeDraft = draftList[Math.min(activeDraftIndex, draftList.length - 1)] ?? createSampleAiWorkoutDraft()
  const activeDestinationPreview = getDraftDestinationPreview(activeDraft)
  const { workout, sections = [], warnings = [] } = activeDraft
  const [overviewDraft, setOverviewDraft] = useState(() => createOverviewDraftState(activeDraft))
  const [sectionDrafts, setSectionDrafts] = useState(() => createSectionDraftState(sections))
  const [exerciseDrafts, setExerciseDrafts] = useState(() => createExerciseDraftState(sections))

  useEffect(() => {
    setOverviewDraft(createOverviewDraftState(activeDraft))
    setSectionDrafts(createSectionDraftState(sections))
    setExerciseDrafts(createExerciseDraftState(sections))
  }, [activeDraft, sections])

  const exerciseCount = useMemo(() => getExerciseCount(sections), [sections])
  const totalSetCount = useMemo(() => getTotalSetCount(sections), [sections])
  const reviewedMatchCounts = useMemo(() => {
    const counts = {
      unmatched: 0,
      suggested: 0,
      matched: 0,
      missing: 0,
    }

    sections.forEach((section) => {
      ;(section.exercises ?? []).forEach((exercise) => {
        const selectedMatch = getSelectedMatch(section.label, exercise)
        const matchStatus = getReviewedMatchStatus(exercise, selectedMatch)
        counts[matchStatus] += 1
      })
    })

    return counts
  }, [sections, exerciseMatches])
  const blockingUnmatchedCount = reviewedMatchCounts.unmatched + reviewedMatchCounts.missing
  const hasBlockingUnmatchedExercises = blockingUnmatchedCount > 0
  const rawJson = useMemo(() => JSON.stringify(activeDraft, null, 2), [activeDraft])

  function getSelectedMatch(sectionLabel, exercise) {
    const key = getExerciseKey(sectionLabel, exercise.name)
    return exerciseMatches[key] ?? exercise.exerciseMatch?.exerciseName ?? ''
  }

  function handleMatchChange(sectionLabel, exerciseName, nextMatch) {
    const key = getExerciseKey(sectionLabel, exerciseName)
    setExerciseMatches((currentMatches) => ({ ...currentMatches, [key]: nextMatch }))
  }

  function handleOverviewChange(field, value) {
    if (field === 'workoutDayType') {
      setOverviewDraft((currentDraft) => ({
        ...currentDraft,
        ...getWorkoutDayTypeDefaults(value),
        workoutDayType: value,
      }))
      return
    }

    setOverviewDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
  }

  function handleDraftTabChange(nextDraftIndex) {
    setActiveDraftIndex(Number(nextDraftIndex))
  }

  function handleSectionDraftChange(sectionIndex, field, value) {
    setSectionDrafts((currentDrafts) => currentDrafts.map((sectionDraft, draftIndex) => {
      if (draftIndex !== sectionIndex) return sectionDraft

      return {
        ...sectionDraft,
        [field]: value,
      }
    }))
  }

  function handleExerciseDraftChange(sectionIndex, exerciseIndex, field, value) {
    setExerciseDrafts((currentDrafts) => currentDrafts.map((sectionDraft, draftSectionIndex) => {
      if (draftSectionIndex !== sectionIndex) return sectionDraft

      return {
        ...sectionDraft,
        exercises: (sectionDraft.exercises ?? []).map((exerciseDraft, draftExerciseIndex) => {
          if (draftExerciseIndex !== exerciseIndex) return exerciseDraft
          return { ...exerciseDraft, [field]: value }
        }),
      }
    }))
  }

  async function handleReviseDraft() {
    const trimmedPrompt = revisionPrompt.trim()
    if (!trimmedPrompt) {
      setRevisionError('Enter a revision prompt first.')
      return
    }

    setRevisionError('')
    setIsRevisingDraft(true)
    try {
      const response = await fetch('/api/admin/ai-workout-drafts/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: activeDraft, prompt: revisionPrompt }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error || 'Unable to revise this AI workout draft.')
      const revisedDraft = body.draft
      if (!revisedDraft) throw new Error('The revision route did not return a draft.')

      setDraftListOverride((currentDrafts) => currentDrafts.map((draftItem, draftIndex) => (
        draftIndex === activeDraftIndex ? revisedDraft : draftItem
      )))
      setExerciseMatches({})
      setRevisionPrompt('')
    } catch (error) {
      setRevisionError(error?.message || 'Unable to revise this AI workout draft.')
    } finally {
      setIsRevisingDraft(false)
    }
  }

  function buildAcceptedAiWorkoutDraftForItem(draftItem, draftIndex) {
    const draftSections = draftItem?.sections ?? []
    const isActiveItem = draftIndex === Math.min(activeDraftIndex, draftList.length - 1)

    return buildAcceptedAiWorkoutDraft({
      activeDraft: draftItem,
      overviewDraft: isActiveItem ? overviewDraft : createOverviewDraftState(draftItem),
      sections: draftSections,
      sectionDrafts: isActiveItem ? sectionDrafts : createSectionDraftState(draftSections),
      exerciseDrafts: isActiveItem ? exerciseDrafts : createExerciseDraftState(draftSections),
      getSelectedMatch: isActiveItem ? getSelectedMatch : (_sectionLabel, exercise) => exercise?.exerciseMatch?.exerciseName ?? '',
    })
  }

  async function handleAcceptDraft() {
    if (isAcceptingDraft) return
    if (hasBlockingUnmatchedExercises) return
    const acceptedDraft = buildAcceptedAiWorkoutDraftForItem(activeDraft, Math.min(activeDraftIndex, draftList.length - 1))

    setIsAcceptingDraft(true)
    try {
      await onAccept(acceptedDraft)
    } finally {
      setIsAcceptingDraft(false)
    }
  }

  async function handleAcceptAllRemaining() {
    if (isAcceptingDraft) return
    if (hasBlockingUnmatchedExercises) return

    const acceptedDrafts = draftList.map((draftItem, draftIndex) => buildAcceptedAiWorkoutDraftForItem(draftItem, draftIndex))

    setIsAcceptingDraft(true)
    try {
      await onAcceptAllRemaining(acceptedDrafts)
    } finally {
      setIsAcceptingDraft(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[min(1280px,calc(100vw-48px))] !max-w-[min(1280px,calc(100vw-48px))] border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] p-0"
      >
        <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5 pr-14">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#06B686]">
                <Sparkles className="size-4" aria-hidden="true" />
                AI Workout Draft
              </div>
              <SheetTitle className="text-2xl font-semibold text-[var(--admin-dashboard-card-text)]">{workout.name}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                <span>{workout.phase}</span>
                <span>·</span>
                <span>{workout.trainingType}</span>
              </SheetDescription>
              {activeDestinationPreview?.message ? (
                <div className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${activeDestinationPreview?.isFallback ? 'border-amber-400/50 bg-amber-500/10 text-amber-600' : 'border-[#3BE0AF]/40 bg-[#3BE0AF]/10 text-[#06B686]'}`}>
                  <span className="sr-only">{activeDestinationPreview?.isFallback ? 'Using clicked lane:' : 'Will place into:'}</span>
                  {activeDestinationPreview?.message}
                </div>
              ) : null}
              {activeDestinationPreview?.appendWarning ? (
                <div className="inline-flex w-fit items-center rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                  {activeDestinationPreview.appendWarning}
                </div>
              ) : null}
            </div>
            <div />
          </div>
          {draftList.length > 1 ? (
            <Tabs value={String(activeDraftIndex)} onValueChange={handleDraftTabChange} className="admin-ai-draft-line-tabs -mx-6 mt-5 mb-[-21px] px-6">
              <TabsList className="h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-x-0 border-t-0 border-b border-[var(--admin-dashboard-card-border)] bg-transparent p-0 text-[var(--admin-dashboard-card-muted)]">
                {draftList.map((draftItem, draftIndex) => {
                  const draftDestinationPreview = getDraftDestinationPreview(draftItem)

                  return (
                  <TabsTrigger
                    key={`${draftItem.workout.sourceFileName}-${draftIndex}`}
                    value={String(draftIndex)}
                    aria-label={`Review ${draftItem.workout.name} landing in ${draftDestinationPreview?.shortLabel ?? 'selected lane'}`}
                    className="min-w-fit flex-none rounded-none border-b-2 border-transparent bg-transparent px-0 py-3 text-left text-sm font-medium text-[var(--admin-dashboard-card-muted)] shadow-none hover:text-[#06B686] data-[state=active]:border-[#3BE0AF] data-[state=active]:bg-transparent data-[state=active]:text-[#06B686] data-[state=active]:shadow-none"
                  >
                    <span className="flex flex-col items-start gap-1">
                      <span>{draftItem.workout.name}</span>
                      {draftDestinationPreview?.shortLabel ? (
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${draftDestinationPreview?.isFallback ? 'text-amber-600' : 'text-[#06B686]'}`}>
                          {draftDestinationPreview.shortLabel}
                        </span>
                      ) : null}
                      {draftDestinationPreview?.existingWorkoutCount > 0 ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">
                          {`${draftDestinationPreview.existingWorkoutCount} existing`}
                        </span>
                      ) : null}
                    </span>
                  </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          ) : null}
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard label="Program" value={workout.program} helper={workout.phase} />
              <SummaryCard label="Sections" value={sections.length} featured />
              <SummaryCard label="Exercises" value={exerciseCount} featured />
              <SummaryCard label="Sets" value={totalSetCount} featured />
              <SummaryCard label="Match Issues" value={blockingUnmatchedCount} helper={reviewedMatchCounts.suggested ? `${reviewedMatchCounts.suggested} suggested match${reviewedMatchCounts.suggested === 1 ? '' : 'es'}` : 'All exercise matches resolved'} featured />
            </div>

            {blockingUnmatchedCount > 0 ? (
              <Alert tone="warning" title="Unmatched exercises need review">
                {`${blockingUnmatchedCount} exercise${blockingUnmatchedCount === 1 ? '' : 's'} still ${blockingUnmatchedCount === 1 ? 'needs' : 'need'} an existing PPLUS exercise match before Accept. Review the Exercise Matches tab before accepting.`}
              </Alert>
            ) : null}

            <Tabs defaultValue="overview" className="grid gap-5 admin-shell-athletes-create-tabs">
              <TabsList className="w-full max-w-[720px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)]">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="matches">Exercise Matches</TabsTrigger>
                <TabsTrigger value="raw-json">Raw JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-5">
                <Card className="rounded-[18px]">
                  <CardHeader className="p-5">
                    <CardTitle className="text-lg">Workout details</CardTitle>
                    <CardDescription>Review and edit the import metadata before any final database write.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 px-5 pb-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-workout-name">Workout name</Label>
                      <Input
                        id="ai-draft-workout-name"
                        value={overviewDraft.workoutName}
                        onChange={(event) => handleOverviewChange('workoutName', event.target.value)}
                        className={overviewInputClassName}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-phase">Phase</Label>
                      <Select value={overviewDraft.phase} onValueChange={(value) => handleOverviewChange('phase', value)}>
                        <SelectTrigger id="ai-draft-phase" className={overviewSelectTriggerClassName}>
                          <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
                        <SelectContent className={overviewSelectContentClassName}>
                          {phaseOptions.map((phase) => (
                            <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-phase-goal">Phase goal</Label>
                      <Select value={overviewDraft.phaseGoal} onValueChange={(value) => handleOverviewChange('phaseGoal', value)}>
                        <SelectTrigger id="ai-draft-phase-goal" className={overviewSelectTriggerClassName}>
                          <SelectValue placeholder="Select phase goal" />
                        </SelectTrigger>
                        <SelectContent className={overviewSelectContentClassName}>
                          {phaseGoalOptions.map((phaseGoal) => (
                            <SelectItem key={phaseGoal} value={phaseGoal}>{phaseGoal}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-training-type">Training type</Label>
                      <Select value={overviewDraft.trainingType} onValueChange={(value) => handleOverviewChange('trainingType', value)}>
                        <SelectTrigger id="ai-draft-training-type" className={overviewSelectTriggerClassName}>
                          <SelectValue placeholder="Select training type" />
                        </SelectTrigger>
                        <SelectContent className={overviewSelectContentClassName}>
                          {trainingTypeOptions.map((trainingType) => (
                            <SelectItem key={trainingType} value={trainingType}>{trainingType}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-workout-day-type">Workout day type</Label>
                      <Select value={overviewDraft.workoutDayType} onValueChange={(value) => handleOverviewChange('workoutDayType', value)}>
                        <SelectTrigger id="ai-draft-workout-day-type" className={overviewSelectTriggerClassName}>
                          <SelectValue placeholder="Select workout day type" />
                        </SelectTrigger>
                        <SelectContent className={overviewSelectContentClassName}>
                          {workoutDayTypeOptions.map((workoutDayType) => (
                            <SelectItem key={workoutDayType} value={workoutDayType}>{workoutDayType}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-stress-level">Stress level</Label>
                      <Select value={overviewDraft.stressLevel} onValueChange={(value) => handleOverviewChange('stressLevel', value)}>
                        <SelectTrigger id="ai-draft-stress-level" className={overviewSelectTriggerClassName}>
                          <SelectValue placeholder="Select stress level" />
                        </SelectTrigger>
                        <SelectContent className={overviewSelectContentClassName}>
                          {stressLevelOptions.map((stressLevel) => (
                            <SelectItem key={stressLevel} value={stressLevel}>{stressLevel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="ai-draft-training-emphasis">Training emphasis</Label>
                      <Input
                        id="ai-draft-training-emphasis"
                        value={overviewDraft.trainingEmphasis}
                        onChange={(event) => handleOverviewChange('trainingEmphasis', event.target.value)}
                        placeholder="Lower-body acceleration"
                        className={overviewInputClassName}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[18px]">
                  <CardHeader className="p-5">
                    <CardTitle className="text-lg">Program details</CardTitle>
                    <CardDescription>Only needed if no existing program matches this import.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 px-5 pb-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-program-name">Program name</Label>
                      <Input
                        id="ai-draft-program-name"
                        value={overviewDraft.programName}
                        onChange={(event) => handleOverviewChange('programName', event.target.value)}
                        placeholder="Only needed if no existing program matches this import"
                        className={overviewInputClassName}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-number-of-weeks">Number of weeks</Label>
                      <Input
                        id="ai-draft-number-of-weeks"
                        type="number"
                        min="1"
                        value={overviewDraft.numberOfWeeks}
                        onChange={(event) => handleOverviewChange('numberOfWeeks', event.target.value)}
                        className={overviewInputClassName}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-start-date">Start date</Label>
                      <Input
                        id="ai-draft-start-date"
                        type="date"
                        value={overviewDraft.startDate}
                        onChange={(event) => handleOverviewChange('startDate', event.target.value)}
                        className={overviewInputClassName}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ai-draft-end-date">End date</Label>
                      <Input
                        id="ai-draft-end-date"
                        type="date"
                        value={overviewDraft.endDate}
                        onChange={(event) => handleOverviewChange('endDate', event.target.value)}
                        className={overviewInputClassName}
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="ai-draft-description">Description</Label>
                      <Textarea
                        id="ai-draft-description"
                        value={overviewDraft.description}
                        onChange={(event) => handleOverviewChange('description', event.target.value)}
                        placeholder="Only needed if no existing program matches this import"
                        className={overviewTextareaClassName}
                      />
                    </div>
                  </CardContent>
                </Card>

                {warnings.length > 0 ? (
                  <Alert tone="warning" title="Warnings">
                    {warnings.map((warning) => warning.message ?? warning).join(' ')}
                  </Alert>
                ) : (
                  <div className="flex items-start gap-3 rounded-[16px] border border-[#3BE0AF]/20 bg-[#3BE0AF]/10 p-4 text-sm text-[var(--admin-dashboard-card-text)]">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#06B686]" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">No warnings in this draft.</p>
                      <p className="mt-1 text-[var(--admin-dashboard-card-muted)]">Review the sections and exercise matches, then accept when it looks right.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sections">
                <Accordion type="multiple" defaultValue={sections.map((section) => section.label)} className="overflow-hidden rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)]">
                  {sections.map((section, sectionIndex) => {
                    const sectionDraft = sectionDrafts[sectionIndex] ?? createSectionDraftState([section])[0]

                    return (
                    <AccordionItem key={section.label} value={section.label}>
                      <AccordionTrigger>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="rounded-full border border-[#3BE0AF]/30 bg-[#3BE0AF]/10 px-2 py-1 text-xs font-medium text-[#06B686] normal-case tracking-normal">{sectionDraft.label}</Badge>
                          <span>Block {sectionDraft.blockLabel} · Superset pair {sectionDraft.supersetLabels}</span>
                          <span className="text-sm font-normal text-[var(--admin-dashboard-card-muted)]">
                            {section.exercises?.map((exercise) => exercise.name).join(', ')}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <Card className="rounded-[16px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)]">
                          <CardContent className="grid gap-4 p-4 md:grid-cols-2">
                            <div className="grid gap-2">
                              <Label htmlFor={`ai-draft-section-label-${sectionIndex}`}>Section label</Label>
                              <Input
                                id={`ai-draft-section-label-${sectionIndex}`}
                                value={sectionDraft.label}
                                onChange={(event) => handleSectionDraftChange(sectionIndex, 'label', event.target.value)}
                                className={overviewInputClassName}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`ai-draft-block-label-${sectionIndex}`}>Block label</Label>
                              <Input
                                id={`ai-draft-block-label-${sectionIndex}`}
                                value={sectionDraft.blockLabel}
                                onChange={(event) => handleSectionDraftChange(sectionIndex, 'blockLabel', event.target.value)}
                                className={overviewInputClassName}
                              />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                              <Label htmlFor={`ai-draft-section-instructions-${sectionIndex}`}>Section instructions</Label>
                              <Textarea
                                id={`ai-draft-section-instructions-${sectionIndex}`}
                                value={sectionDraft.instructions}
                                onChange={(event) => handleSectionDraftChange(sectionIndex, 'instructions', event.target.value)}
                                className={overviewTextareaClassName}
                              />
                            </div>
                          </CardContent>
                        </Card>
                        {section.exercises?.map((exercise, exerciseIndex) => {
                          const exerciseDraft = exerciseDrafts[sectionIndex]?.exercises?.[exerciseIndex] ?? { name: exercise.name ?? '', notes: exercise.notes ?? '' }

                          return (
                          <ExerciseCard
                            key={exercise.name}
                            sectionIndex={sectionIndex}
                            exerciseIndex={exerciseIndex}
                            sectionLabel={sectionDraft.label}
                            exercise={exercise}
                            exerciseDraft={exerciseDraft}
                            selectedMatch={getSelectedMatch(section.label, exercise)}
                            onMatchChange={(nextMatch) => handleMatchChange(section.label, exercise.name, nextMatch)}
                            onExerciseNameChange={(nextName) => handleExerciseDraftChange(sectionIndex, exerciseIndex, 'name', nextName)}
                            onExerciseNotesChange={(nextNotes) => handleExerciseDraftChange(sectionIndex, exerciseIndex, 'notes', nextNotes)}
                          />
                          )
                        })}
                      </AccordionContent>
                    </AccordionItem>
                    )
                  })}
                </Accordion>
              </TabsContent>

              <TabsContent value="matches" className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                  <Search className="size-4" aria-hidden="true" />
                  {hasBlockingUnmatchedExercises
                    ? 'Choose matches below to unlock Accept.'
                    : 'All exercise matches resolved. Accept is unlocked.'}
                </div>
                <div className="grid gap-3">
                  {sections.flatMap((section) => section.exercises?.map((exercise) => ({ section, exercise })) ?? []).map(({ section, exercise }) => {
                    const selectedMatch = getSelectedMatch(section.label, exercise)
                    const matchStatus = getReviewedMatchStatus(exercise, selectedMatch)
                    const matchLabel = matchStatus === 'unmatched' ? 'Unmatched' : matchStatus === 'matched' ? 'Matched' : matchStatus === 'missing' ? 'Missing' : 'Suggested match'
                    const matchHelperText = getMatchHelperText(matchStatus)

                    return (
                    <Card key={`${section.label}-${exercise.name}`} className="rounded-[16px]">
                      <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_320px] md:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-2 py-1 text-xs font-medium normal-case tracking-normal">{section.label}</Badge>
                            <Badge className={`rounded-full px-2 py-1 text-xs font-medium normal-case tracking-normal ${getMatchBadgeClass(matchStatus)}`}>{matchLabel}</Badge>
                            <span className="font-medium text-[var(--admin-dashboard-card-text)]">{exercise.name}</span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--admin-dashboard-card-muted)]">{matchHelperText}</p>
                        </div>
                        <Select value={selectedMatch} onValueChange={(nextMatch) => handleMatchChange(section.label, exercise.name, nextMatch)}>
                          <SelectTrigger className="h-10 rounded-[12px]">
                            <SelectValue placeholder="Choose existing exercise" />
                          </SelectTrigger>
                          <SelectContent>
                            {exerciseMatchOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="raw-json">
                <pre className="max-h-[520px] overflow-auto rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-xs leading-6 text-[var(--admin-dashboard-card-text)]">
                  {rawJson}
                </pre>
              </TabsContent>
            </Tabs>

            <Separator className="bg-[var(--admin-dashboard-card-border)]" />

            <Card className="rounded-[18px]">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><Bot className="size-5 text-[#06B686]" aria-hidden="true" />Revise with AI</CardTitle>
                <CardDescription>Optional. Tell the importer what to change, then regenerate this temporary draft.</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {revisionError ? (
                  <Alert variant="destructive" className="mb-3">
                    {revisionError}
                  </Alert>
                ) : null}
                <Textarea
                  value={revisionPrompt}
                  onChange={(event) => setRevisionPrompt(event.target.value)}
                  placeholder="Example: Change Conditioning to Run only and remove Fan Bike alternative."
                  className="min-h-[96px] rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-3 text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)]"
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
          <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-[12px] min-h-[40px] border-[#3BE0AF]/40 bg-[#3BE0AF]/10 text-[#06B686] hover:bg-[#3BE0AF]/15 hover:text-[#06B686]"
            onClick={handleReviseDraft}
            disabled={isRevisingDraft}
          >
            <Bot className="size-4" aria-hidden="true" />
            {isRevisingDraft ? 'Revising…' : 'Revise with AI'}
          </Button>
          {draftList.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#3BE0AF]/40 bg-[#3BE0AF]/10 text-[#06B686] hover:bg-[#3BE0AF]/15 hover:text-[#06B686]"
              onClick={handleAcceptAllRemaining}
              disabled={isAccepting || isAcceptingDraft || hasBlockingUnmatchedExercises}
              title={hasBlockingUnmatchedExercises ? 'Match all exercises before accepting these drafts.' : undefined}
            >
              {isAccepting || isAcceptingDraft ? 'Accepting all…' : 'Accept All Remaining'}
            </Button>
          ) : null}
          <Button
            type="button"
            className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
            onClick={handleAcceptDraft}
            disabled={isAccepting || isAcceptingDraft || hasBlockingUnmatchedExercises}
            title={hasBlockingUnmatchedExercises ? 'Match all exercises before accepting this draft.' : undefined}
          >
            {hasBlockingUnmatchedExercises ? 'Resolve matches to accept' : isAccepting || isAcceptingDraft ? 'Accepting…' : 'Accept Draft'}
          </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
