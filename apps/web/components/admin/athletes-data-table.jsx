'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { BookOpen, ChevronDown, Download, MoreHorizontal, Plus, Send, Trash2, UsersRound } from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'

import { Filters, createFilter } from '@/components/reui/filters'
import { useToast } from '@/hooks/use-toast'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Avatar from '@/components/ui/avatar'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ATHLETE_TABLE_COLUMN_WIDTHS = {
  select: '44px',
  name: '260px',
  program: '210px',
  workoutsPercentage: '170px',
  lastActive: '145px',
  status: '120px',
  actions: '52px',
}

const BULK_EXPORT_FIELD_GROUPS = [
  {
    id: 'athlete-profile',
    label: 'Athlete profile',
    description: 'Core athlete profile table fields.',
    fields: [
      'id',
      'user_id',
      'coach_id',
      'first_name',
      'last_name',
      'date_of_birth',
      'sport',
      'position',
      'handedness',
      'gender',
      'height_cm',
      'weight_kg',
      'avatar_url',
      'units_preference',
      'weight_unit_preference',
      'distance_unit_preference',
      'theme_preference',
      'status',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'invitation',
    label: 'Invitation',
    description: 'Athlete invitation and email delivery fields.',
    fields: [
      'id',
      'coach_id',
      'invitee_email',
      'expires_at',
      'used_at',
      'revoked_at',
      'sent_at',
      'athlete_profile_id',
      'created_by_user_id',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'current-program',
    label: 'Current program',
    description: 'Latest assigned program fields for the athlete.',
    fields: [
      'id',
      'athlete_id',
      'coach_id',
      'name',
      'description',
      'start_date',
      'end_date',
      'status',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'planned-workouts',
    label: 'Planned workouts',
    description: 'Program workout rows attached to the athlete.',
    fields: [
      'id',
      'athlete_id',
      'coach_id',
      'program_id',
      'program_phase_id',
      'program_day_id',
      'workout_template_id',
      'name_snapshot',
      'notes',
      'import_source',
      'import_source_file_name',
      'bg_color',
      'text_color',
      'status',
      'sort_order',
      'scheduled_date',
      'scheduled_start_time',
      'scheduled_end_time',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'workout-sessions',
    label: 'Workout sessions',
    description: 'Completed and in-progress workout session fields.',
    fields: [
      'id',
      'athlete_id',
      'coach_id',
      'program_id',
      'program_day_id',
      'program_workout_id',
      'workout_template_id',
      'name_snapshot',
      'status',
      'started_at',
      'completed_at',
      'elapsed_seconds',
      'notes',
      'perceived_difficulty',
      'total_exercises_count',
      'completed_exercises_count',
      'total_sets_count',
      'completed_sets_count',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'load-summaries',
    label: 'Load summaries',
    description: 'Computed training load summary fields.',
    fields: [
      'id',
      'athlete_id',
      'workout_session_id',
      'completed_sets',
      'completed_reps',
      'volume_load',
      'effort_adjusted_load',
      'session_difficulty',
      'log_date',
      'created_at',
    ],
  },
  {
    id: 'groups',
    label: 'Groups',
    description: 'Group and membership fields connected to the athlete.',
    fields: [
      'athlete_group_id',
      'group_name',
      'group_description',
      'access_level',
      'group_status',
      'created_by_user_id',
      'archived_at',
      'group_created_at',
      'group_updated_at',
      'membership_id',
      'added_by_user_id',
      'membership_created_at',
      'membership_updated_at',
    ],
  },
]

const DEFAULT_BULK_EXPORT_FIELDS = BULK_EXPORT_FIELD_GROUPS.map((fieldGroup) => fieldGroup.id)

function getBulkExportFieldValue(athlete, groupId, fieldName) {
  if (groupId === 'athlete-profile') {
    const profileFields = {
      id: athlete.id,
      user_id: athlete.userId,
      coach_id: athlete.coachId,
      first_name: athlete.firstName,
      last_name: athlete.lastName,
      date_of_birth: athlete.dateOfBirth,
      sport: athlete.sport,
      position: athlete.position,
      handedness: athlete.handedness,
      gender: athlete.gender,
      height_cm: athlete.heightCm,
      weight_kg: athlete.weightKg,
      avatar_url: athlete.avatarUrl,
      units_preference: athlete.unitsPreference,
      weight_unit_preference: athlete.weightUnitPreference,
      distance_unit_preference: athlete.distanceUnitPreference,
      theme_preference: athlete.themePreference,
      status: athlete.status,
      created_at: athlete.createdAt,
      updated_at: athlete.updatedAt,
    }
    return profileFields[fieldName]
  }

  if (groupId === 'invitation') {
    const invitationFields = {
      invitee_email: athlete.inviteeEmail,
      athlete_profile_id: athlete.id,
      sent_at: athlete.hasInvite ? 'stored invitation' : '',
    }
    return invitationFields[fieldName]
  }

  if (groupId === 'current-program') {
    const currentProgramFields = {
      athlete_id: athlete.id,
      name: athlete.program,
      status: athlete.program && athlete.program !== '-' ? 'Assigned' : '',
    }
    return currentProgramFields[fieldName]
  }

  if (groupId === 'planned-workouts') {
    const plannedWorkoutFields = {
      athlete_id: athlete.id,
      status: athlete.workoutsTarget > 0 ? 'Planned' : '',
      name_snapshot: athlete.program,
    }
    return plannedWorkoutFields[fieldName]
  }

  if (groupId === 'workout-sessions') {
    const workoutSessionFields = {
      athlete_id: athlete.id,
      status: athlete.workoutsCompleted > 0 ? 'Completed sessions' : '',
      completed_sets_count: athlete.workoutsCompleted,
    }
    return workoutSessionFields[fieldName]
  }

  if (groupId === 'load-summaries') {
    const loadSummaryFields = {
      athlete_id: athlete.id,
      completed_sets: athlete.workoutsCompleted,
    }
    return loadSummaryFields[fieldName]
  }

  return ''
}

function formatBulkExportCsvValue(value) {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function buildBulkExportCsv(athletesToExport, selectedFieldGroupIds) {
  const selectedGroups = BULK_EXPORT_FIELD_GROUPS.filter((fieldGroup) => selectedFieldGroupIds.includes(fieldGroup.id))
  const exportColumns = selectedGroups.flatMap((fieldGroup) => (
    fieldGroup.fields.map((fieldName) => ({
      groupId: fieldGroup.id,
      fieldName,
      header: `${fieldGroup.id}.${fieldName}`,
    }))
  ))
  const headers = ['export_row', 'athlete_name', ...exportColumns.map((column) => column.header)]
  const rows = athletesToExport.map((athlete, index) => [
    index + 1,
    athlete.name,
    ...exportColumns.map((column) => getBulkExportFieldValue(athlete, column.groupId, column.fieldName)),
  ])

  return [headers, ...rows]
    .map((row) => row.map(formatBulkExportCsvValue).join(','))
    .join('\n')
}

function downloadBulkExportFile({ content, fileName, mimeType }) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatAthleteDateOfBirthSummary(dateOfBirth) {
  if (!dateOfBirth) return 'Date of birth unavailable'

  const date = new Date(`${dateOfBirth}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return 'Date of birth unavailable'

  const now = new Date()
  let age = now.getUTCFullYear() - date.getUTCFullYear()
  const monthDelta = now.getUTCMonth() - date.getUTCMonth()
  const dayDelta = now.getUTCDate() - date.getUTCDate()

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1
  }

  const label = date.toLocaleDateString('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })

  return `${label} (${age} year old)`
}

function formatHeightCmToImperial(heightCm) {
  if (!heightCm || Number.isNaN(Number(heightCm))) return ''
  const totalInches = Math.round(Number(heightCm) / 2.54)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}' ${inches}\"`
}

function formatWeightKgToImperial(weightKg) {
  if (!weightKg || Number.isNaN(Number(weightKg))) return ''
  return `${Math.round(Number(weightKg) * 2.20462)} lb`
}

function formatHeightCmToMetric(heightCm) {
  if (!heightCm || Number.isNaN(Number(heightCm))) return ''
  return `${Math.round(Number(heightCm))} cm`
}

function formatWeightKgToMetric(weightKg) {
  if (!weightKg || Number.isNaN(Number(weightKg))) return ''
  return `${Math.round(Number(weightKg))} kg`
}

function normalizeAthleteGender(gender) {
  const normalizedGender = String(gender ?? '').trim().toLowerCase()

  if (normalizedGender === 'female') return 'female'
  if (normalizedGender === 'other' || normalizedGender === 'non-binary' || normalizedGender === 'nonbinary') return 'other'
  return 'male'
}

function normalizeAthletePosition(position) {
  const normalizedPosition = String(position ?? '').trim().toLowerCase()

  if (normalizedPosition.startsWith('def')) return 'defense'
  if (normalizedPosition.startsWith('goal')) return 'goalie'
  return 'forward'
}

function parseMetricInput(value) {
  const normalizedValue = String(value ?? '').trim().toLowerCase()
  if (!normalizedValue) return null
  const numericValue = Number(normalizedValue.replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : null
}

function parseImperialHeightToCm(value) {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) return null

  const feetInchesMatch = normalizedValue.match(/^(\d+)\s*'\s*(\d{1,2})?\s*(?:\"|in)?$/)
  if (feetInchesMatch) {
    const feet = Number(feetInchesMatch[1] || 0)
    const inches = Number(feetInchesMatch[2] || 0)
    const totalInches = feet * 12 + inches
    return totalInches > 0 ? Math.round(totalInches * 2.54) : null
  }

  const parts = normalizedValue.split(/\s+/).filter(Boolean)
  if (parts.length === 2) {
    const feet = Number(parts[0])
    const inches = Number(parts[1])
    if (Number.isFinite(feet) && Number.isFinite(inches)) {
      const totalInches = feet * 12 + inches
      return totalInches > 0 ? Math.round(totalInches * 2.54) : null
    }
  }

  return null
}

function parseImperialWeightToKg(value) {
  const normalizedValue = String(value ?? '').trim().toLowerCase()
  if (!normalizedValue) return null
  const pounds = Number(normalizedValue.replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(pounds) ? Math.round((pounds / 2.20462) * 10) / 10 : null
}

function formatCreateAthleteGenderLabel(value) {
  if (value === 'female') return 'Female'
  if (value === 'other') return 'Other'
  return 'Male'
}

function formatCreateAthletePositionLabel(value) {
  if (value === 'defense') return 'Defense'
  if (value === 'goalie') return 'Goalie'
  return 'Forward'
}

function NameCell({ name, avatarUrl = '', dateOfBirth = null }) {
  return (
    <div className="admin-shell-athletes-name-cell">
      <Avatar alt={name} className="admin-shell-athletes-avatar" initials={getInitials(name)} src={avatarUrl || undefined} />
      <div className="admin-shell-athletes-name-copy">
        <span className="admin-shell-athletes-name-text">{name}</span>
        <span className="admin-shell-athletes-name-meta">{formatAthleteDateOfBirthSummary(dateOfBirth)}</span>
      </div>
    </div>
  )
}

function WorkoutsCell({ workoutsCompleted, workoutsTarget, workoutsPercentage }) {
  return (
    <div className="admin-shell-athletes-workouts-cell">
      <div className="admin-shell-athletes-workouts-header">
        <span className="admin-shell-athletes-workouts-label">{workoutsCompleted}/{workoutsTarget}</span>
        <span className="admin-shell-athletes-workouts-percent">{workoutsPercentage}%</span>
      </div>
      <Progress className="admin-shell-athletes-workouts-progress" value={workoutsPercentage} />
    </div>
  )
}

function StatusCell({ status }) {
  const tone = status === 'Inactive' ? 'danger' : status === 'Active' ? 'success' : 'warning'
  const className =
    status === 'Inactive'
      ? 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-inactive normal-case tracking-normal'
      : status === 'Active'
        ? 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-active normal-case tracking-normal'
        : 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-pending normal-case tracking-normal'

  return (
    <Badge tone={tone} className={className}>
      {status}
    </Badge>
  )
}

function RowActionsCell({
  isOpen = false,
  onOpenChange = () => {},
  onEditAction = () => {},
  onSendInviteAction = null,
  inviteActionLabel = 'Send invite',
  onDeleteAction = () => {},
}) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="admin-shell-athletes-row-menu" aria-label="Open menu">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="admin-shell-athletes-row-menu-icon" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => {
            onEditAction()
            onOpenChange(false)
          }}
        >
          Edit
        </DropdownMenuItem>
        {typeof onSendInviteAction === 'function' ? (
          <DropdownMenuItem
            onSelect={() => {
              onSendInviteAction()
              onOpenChange(false)
            }}
          >
            {inviteActionLabel}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onSelect={() => {
            onDeleteAction()
            onOpenChange(false)
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CreateAthleteDialogField({ htmlFor, label, children }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

function CreateAthletePhotoUploader({
  previewSrc = '',
  athleteName = '',
  onFileChange = () => {},
  onClearPreview = () => {},
}) {
  const hasPreview = Boolean(previewSrc)

  return (
    <label className="admin-shell-athletes-create-uploader relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 px-6 py-2 text-center transition-colors hover:text-[var(--admin-shell-text-strong)]">
      <div className="relative h-[120px] w-[120px] self-center">
        {hasPreview ? (
          <>
            <img
              alt={athleteName || 'Athlete avatar'}
              className="h-full w-full rounded-[360px] border !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-lg font-semibold text-[var(--admin-dashboard-card-text)] object-cover"
              src={previewSrc}
            />
            <button
              type="button"
              aria-label="Remove uploaded avatar"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-sm font-medium text-[var(--admin-shell-text-strong)] shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition-colors hover:bg-[var(--admin-dashboard-control-hover-bg)]"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onClearPreview()
              }}
            >
              ×
            </button>
          </>
        ) : (
          <div className="admin-shell-athletes-create-uploader-empty flex h-full w-full items-center justify-center rounded-[360px]">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9">
              <circle cx="12" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M6.5 18.25c1.35-2.45 3.35-3.75 5.5-3.75s4.15 1.3 5.5 3.75"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.6"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[17px] font-medium text-[var(--admin-shell-text-strong)]">{hasPreview ? 'Avatar uploaded' : 'Upload avatar'}</p>
        <p className="text-sm text-[var(--admin-dashboard-card-muted)]">PNG, JPG up to 2MB</p>
      </div>
      <input className="sr-only" type="file" accept="image/*" onChange={onFileChange} />
    </label>
  )
}

function normalizeAthleteStatus(status) {
  const normalizedStatus = String(status ?? '').trim().toLowerCase()
  return normalizedStatus === 'active' ? 'active' : 'inactive'
}

function normalizeAthleteFilterValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function parseAthleteMetricValue(value) {
  if (value === null || value === undefined || value === '') return null
  const normalizedValue = Number(value)
  return Number.isFinite(normalizedValue) ? normalizedValue : null
}

function parseAthleteDateValue(value) {
  if (!value) return null
  const parsedDate = new Date(`${value}T12:00:00Z`)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getTime()
}

const athleteFilterRangeInputClassName = 'h-8 w-28 !border-0 bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] shadow-none placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:!border-0 focus-visible:ring-0'
const athleteFilterRangeSeparatorClassName = 'text-xs text-[var(--admin-dashboard-card-muted)]'

function AthleteRangeFilterValue({
  values = [],
  onChange = () => {},
  operator = 'between',
  type = 'number',
  startPlaceholder = 'Min',
  endPlaceholder = 'Max',
}) {
  const [firstValue = '', secondValue = ''] = values
  const singleValuePlaceholder =
    operator === 'before' ? 'Before' : operator === 'after' ? 'After' : operator === 'greater_than' ? 'Min' : operator === 'less_than' ? 'Max' : 'Value'

  if (operator === 'between') {
    return (
      <div className="flex items-center gap-2">
        <Input
          type={type}
          value={firstValue}
          onChange={(event) => onChange([event.target.value, secondValue])}
          placeholder={startPlaceholder}
          className={athleteFilterRangeInputClassName}
        />
        <span className={athleteFilterRangeSeparatorClassName}>to</span>
        <Input
          type={type}
          value={secondValue}
          onChange={(event) => onChange([firstValue, event.target.value])}
          placeholder={endPlaceholder}
          className={athleteFilterRangeInputClassName}
        />
      </div>
    )
  }

  return (
    <Input
      type={type}
      value={firstValue}
      onChange={(event) => onChange([event.target.value])}
      placeholder={singleValuePlaceholder}
          className={athleteFilterRangeInputClassName}
    />
  )
}

const athleteFilterFields = [
  {
    key: 'status',
    label: 'Status',
    field: 'status',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    key: 'dateOfBirth',
    label: 'Date of birth',
    field: 'dateOfBirth',
    type: 'custom',
    defaultOperator: 'between',
    operators: [
      { value: 'between', label: 'between' },
      { value: 'before', label: 'before' },
      { value: 'after', label: 'after' },
      { value: 'empty', label: 'is empty' },
      { value: 'not_empty', label: 'is not empty' },
    ],
    customRenderer: ({ values, onChange, operator }) => (
      <AthleteRangeFilterValue
        values={values}
        onChange={onChange}
        operator={operator}
        type="date"
        startPlaceholder="Start date"
        endPlaceholder="End date"
      />
    ),
  },
  {
    key: 'gender',
    label: 'Gender',
    field: 'gender',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'position',
    label: 'Position',
    field: 'position',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'forward', label: 'Forward' },
      { value: 'defense', label: 'Defense' },
      { value: 'goalie', label: 'Goalie' },
    ],
  },
  {
    key: 'height',
    label: 'Height (cm)',
    field: 'height',
    type: 'custom',
    defaultOperator: 'between',
    operators: [
      { value: 'between', label: 'between' },
      { value: 'greater_than', label: 'greater than' },
      { value: 'less_than', label: 'less than' },
      { value: 'empty', label: 'is empty' },
      { value: 'not_empty', label: 'is not empty' },
    ],
    customRenderer: ({ values, onChange, operator }) => (
      <AthleteRangeFilterValue values={values} onChange={onChange} operator={operator} startPlaceholder="Min cm" endPlaceholder="Max cm" />
    ),
  },
  {
    key: 'weight',
    label: 'Weight (kg)',
    field: 'weight',
    type: 'custom',
    defaultOperator: 'between',
    operators: [
      { value: 'between', label: 'between' },
      { value: 'greater_than', label: 'greater than' },
      { value: 'less_than', label: 'less than' },
      { value: 'empty', label: 'is empty' },
      { value: 'not_empty', label: 'is not empty' },
    ],
    customRenderer: ({ values, onChange, operator }) => (
      <AthleteRangeFilterValue values={values} onChange={onChange} operator={operator} startPlaceholder="Min kg" endPlaceholder="Max kg" />
    ),
  },
]

function athleteMatchesFilter(athlete, filter) {
  if (!filter?.field) return true

  const values = Array.isArray(filter.values) ? filter.values : []
  const primaryValue = values[0]
  const secondaryValue = values[1]

  switch (filter.field) {
    case 'status': {
      const athleteStatus = normalizeAthleteStatus(athlete.status)
      if (filter.operator === 'empty') return !athlete.status
      if (filter.operator === 'not_empty') return Boolean(athlete.status)
      const selectedStatus = normalizeAthleteFilterValue(primaryValue)
      if (!selectedStatus) return true
      if (filter.operator === 'is_not') return athleteStatus !== selectedStatus
      return athleteStatus === selectedStatus
    }
    case 'gender': {
      const athleteGender = normalizeAthleteFilterValue(athlete.gender)
      if (filter.operator === 'empty') return !athlete.gender
      if (filter.operator === 'not_empty') return Boolean(athlete.gender)
      const selectedGender = normalizeAthleteFilterValue(primaryValue)
      if (!selectedGender) return true
      if (filter.operator === 'is_not') return athleteGender !== selectedGender
      return athleteGender === selectedGender
    }
    case 'position': {
      const athletePosition = normalizeAthleteFilterValue(athlete.position)
      if (filter.operator === 'empty') return !athlete.position
      if (filter.operator === 'not_empty') return Boolean(athlete.position)
      const selectedPosition = normalizeAthleteFilterValue(primaryValue)
      if (!selectedPosition) return true
      if (filter.operator === 'is_not') return athletePosition !== selectedPosition
      return athletePosition === selectedPosition
    }
    case 'dateOfBirth': {
      const athleteDate = parseAthleteDateValue(athlete.dateOfBirth)
      const startDate = parseAthleteDateValue(primaryValue)
      const endDate = parseAthleteDateValue(secondaryValue)
      if (filter.operator === 'empty') return !athlete.dateOfBirth
      if (filter.operator === 'not_empty') return Boolean(athlete.dateOfBirth)
      if (!athleteDate) return false
      if (filter.operator === 'before') return startDate ? athleteDate < startDate : true
      if (filter.operator === 'after') return startDate ? athleteDate > startDate : true
      if (startDate && endDate) return athleteDate >= startDate && athleteDate <= endDate
      if (startDate) return athleteDate >= startDate
      if (endDate) return athleteDate <= endDate
      return true
    }
    case 'height': {
      const athleteHeight = parseAthleteMetricValue(athlete.heightCm)
      const minHeight = parseAthleteMetricValue(primaryValue)
      const maxHeight = parseAthleteMetricValue(secondaryValue)
      if (filter.operator === 'empty') return athlete.heightCm === null || athlete.heightCm === undefined
      if (filter.operator === 'not_empty') return athlete.heightCm !== null && athlete.heightCm !== undefined
      if (athleteHeight === null) return false
      if (filter.operator === 'greater_than') return minHeight === null ? true : athleteHeight > minHeight
      if (filter.operator === 'less_than') return minHeight === null ? true : athleteHeight < minHeight
      if (minHeight !== null && maxHeight !== null) return athleteHeight >= minHeight && athleteHeight <= maxHeight
      if (minHeight !== null) return athleteHeight >= minHeight
      if (maxHeight !== null) return athleteHeight <= maxHeight
      return true
    }
    case 'weight': {
      const athleteWeight = parseAthleteMetricValue(athlete.weightKg)
      const minWeight = parseAthleteMetricValue(primaryValue)
      const maxWeight = parseAthleteMetricValue(secondaryValue)
      if (filter.operator === 'empty') return athlete.weightKg === null || athlete.weightKg === undefined
      if (filter.operator === 'not_empty') return athlete.weightKg !== null && athlete.weightKg !== undefined
      if (athleteWeight === null) return false
      if (filter.operator === 'greater_than') return minWeight === null ? true : athleteWeight > minWeight
      if (filter.operator === 'less_than') return minWeight === null ? true : athleteWeight < minWeight
      if (minWeight !== null && maxWeight !== null) return athleteWeight >= minWeight && athleteWeight <= maxWeight
      if (minWeight !== null) return athleteWeight >= minWeight
      if (maxWeight !== null) return athleteWeight <= maxWeight
      return true
    }
    default:
      return true
  }
}

function athleteMatchesFilters(athlete, filters) {
  return filters.every((filter) => athleteMatchesFilter(athlete, filter))
}

export function AthletesDataTable({ searchQuery = '' }) {
  const { toastManager } = useToast()
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [athleteFilters, setAthleteFilters] = useQueryState(
    'filters',
    parseAsJson((value) => (Array.isArray(value) ? value : [])).withDefault([]),
  )
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isCreateEditAthleteDialogOpen, setIsCreateEditAthleteDialogOpen] = useState(false)
  const [athleteDialogMode, setAthleteDialogMode] = useState('create')
  const [editingAthleteId, setEditingAthleteId] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingAthleteId, setDeletingAthleteId] = useState(null)
  const [isDeletingAthlete, setIsDeletingAthlete] = useState(false)
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
  const [isBulkActionsMenuOpen, setIsBulkActionsMenuOpen] = useState(false)
  const [isBulkInviteSheetOpen, setIsBulkInviteSheetOpen] = useState(false)
  const [bulkInviteEmailsByAthleteId, setBulkInviteEmailsByAthleteId] = useState({})
  const [isSendingBulkInvites, setIsSendingBulkInvites] = useState(false)
  const [isBulkExportSheetOpen, setIsBulkExportSheetOpen] = useState(false)
  const [bulkExportFields, setBulkExportFields] = useState(DEFAULT_BULK_EXPORT_FIELDS)
  const [isExportingAthletes, setIsExportingAthletes] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isDeletingSelectedAthletes, setIsDeletingSelectedAthletes] = useState(false)
  const [isAddToGroupsSheetOpen, setIsAddToGroupsSheetOpen] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [isAddingToGroups, setIsAddingToGroups] = useState(false)
  const [groupOptions, setGroupOptions] = useState([])
  const [groupSearchQuery, setGroupSearchQuery] = useState('')
  const [isAssignProgramSheetOpen, setIsAssignProgramSheetOpen] = useState(false)
  const [selectedAssignProgramId, setSelectedAssignProgramId] = useState('')
  const [programOptions, setProgramOptions] = useState([])
  const [isLoadingAssignPrograms, setIsLoadingAssignPrograms] = useState(false)
  const [isAssigningProgram, setIsAssigningProgram] = useState(false)

  const [createAthleteMeasurementUnit, setCreateAthleteMeasurementUnit] = useState('imperial')
  const [createAthleteProfileImage, setCreateAthleteProfileImage] = useState('')
  const [createAthleteFirstName, setCreateAthleteFirstName] = useState('')
  const [createAthleteLastName, setCreateAthleteLastName] = useState('')
  const [createAthleteDateOfBirth, setCreateAthleteDateOfBirth] = useState('')
  const [createAthleteGender, setCreateAthleteGender] = useState('male')
  const [createAthletePosition, setCreateAthletePosition] = useState('forward')
  const [createAthleteHeightImperial, setCreateAthleteHeightImperial] = useState('')
  const [createAthleteWeightImperial, setCreateAthleteWeightImperial] = useState('')
  const [createAthleteHeightMetric, setCreateAthleteHeightMetric] = useState('')
  const [createAthleteWeightMetric, setCreateAthleteWeightMetric] = useState('')
  const [createAthleteInviteEmail, setCreateAthleteInviteEmail] = useState('')
  const [inviteAthleteEmail, setInviteAthleteEmail] = useState('')
  const [inviteDialogAthleteId, setInviteDialogAthleteId] = useState(null)
  const [createAthleteProfileImageUpload, setCreateAthleteProfileImageUpload] = useState(null)
  const [sendAthleteInvite, setSendAthleteInvite] = useState(true)
  const [isSavingAthlete, setIsSavingAthlete] = useState(false)
  const [isSendingRowInvite, setIsSendingRowInvite] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  useEffect(() => {
    let cancelled = false

    async function loadAthletes() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/athletes', {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load athletes.')
        }

        if (!cancelled) {
          setAthletes(Array.isArray(payload?.athletes) ? payload.athletes : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setAthletes([])
          setError(loadError?.message || 'Failed to load athletes.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAthletes()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="admin-shell-athletes-checkbox-cell">
            <Checkbox
              className="admin-shell-athletes-checkbox-input"
              checked={table.getIsAllPageRowsSelected()}
              onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="admin-shell-athletes-checkbox-cell">
            <Checkbox
              className="admin-shell-athletes-checkbox-input"
              checked={row.getIsSelected()}
              onChange={(event) => row.toggleSelected(event.target.checked)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        meta: { label: 'Name' },
        cell: ({ row }) => <NameCell name={row.original.name} avatarUrl={row.original.avatarUrl} dateOfBirth={row.original.dateOfBirth} />,
      },
      {
        accessorKey: 'program',
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => <span className="admin-shell-athletes-program-cell">{row.original.program}</span>,
      },
      {
        accessorKey: 'workoutsPercentage',
        header: 'Workouts',
        meta: { label: 'Workouts' },
        cell: ({ row }) => (
          <WorkoutsCell
            workoutsCompleted={row.original.workoutsCompleted}
            workoutsTarget={row.original.workoutsTarget}
            workoutsPercentage={row.original.workoutsPercentage}
          />
        ),
      },
      {
        accessorKey: 'lastActive',
        header: 'Last active',
        meta: { label: 'Last active' },
        cell: ({ row }) => <span className="admin-shell-athletes-last-active-cell">{row.original.lastActive}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { label: 'Status' },
        cell: ({ row }) => <StatusCell status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const canSendInvite = row.original.status !== 'Active'
          const inviteActionLabel = row.original.hasInvite ? 'Resend invite' : 'Send invite'

          return (
            <RowActionsCell
              isOpen={openRowActionMenuId === row.original.id}
              onOpenChange={(isOpen) => {
                setOpenRowActionMenuId(isOpen ? row.original.id : null)
              }}
              onEditAction={() => setPendingRowAction({ type: 'edit', athleteId: row.original.id })}
              onSendInviteAction={canSendInvite ? () => setPendingRowAction({ type: 'sendInvite', athleteId: row.original.id }) : null}
              inviteActionLabel={inviteActionLabel}
              onDeleteAction={() => setPendingRowAction({ type: 'delete', athleteId: row.original.id })}
            />
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openRowActionMenuId],
  )

  const filteredAthletes = useMemo(() => {
    const normalizedFilters = Array.isArray(athleteFilters) ? athleteFilters : []
    return athletes.filter((athlete) => athleteMatchesFilters(athlete, normalizedFilters))
  }, [athleteFilters, athletes])

  useEffect(() => {
    if (!isAddToGroupsSheetOpen) return

    let cancelled = false

    async function loadGroupOptions() {
      try {
        const response = await fetch('/api/admin/groups', {
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load groups.')
        }

        if (!cancelled) {
          setGroupOptions(Array.isArray(payload?.groups) ? payload.groups : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setGroupOptions([])
        }
      }
    }

    loadGroupOptions()

    return () => {
      cancelled = true
    }
  }, [isAddToGroupsSheetOpen])

  useEffect(() => {
    if (!isAssignProgramSheetOpen) return

    let cancelled = false

    async function loadAssignProgramOptions() {
      setIsLoadingAssignPrograms(true)

      try {
        const response = await fetch('/api/admin/programs', {
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load programs.')
        }

        if (!cancelled) {
          setProgramOptions(Array.isArray(payload?.programs) ? payload.programs : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setProgramOptions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAssignPrograms(false)
        }
      }
    }

    loadAssignProgramOptions()

    return () => {
      cancelled = true
    }
  }, [isAssignProgramSheetOpen])

  const table = useReactTable({
    data: filteredAthletes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      rowSelection,
      columnFilters,
      columnVisibility,
      pagination,
    },
  })

  useEffect(() => {
    table.getColumn('name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }))
  }, [athleteFilters, searchQuery])

  useEffect(() => {
    if (openRowActionMenuId || !pendingRowAction) return

    if (pendingRowAction.type === 'edit') {
      setAthleteDialogMode('edit')
      setEditingAthleteId(pendingRowAction.athleteId)
      setIsCreateEditAthleteDialogOpen(true)
    } else if (pendingRowAction.type === 'sendInvite') {
      const pendingInviteAthlete = athletes.find((athlete) => athlete.id === pendingRowAction.athleteId) ?? null
      if (pendingInviteAthlete?.hasInvite) {
        void handleSendAthleteInvite(pendingRowAction.athleteId)
      } else {
        setInviteDialogAthleteId(pendingRowAction.athleteId)
        setInviteAthleteEmail('')
        setIsInviteDialogOpen(true)
      }
    } else if (pendingRowAction.type === 'delete') {
      setDeletingAthleteId(pendingRowAction.athleteId)
      setIsDeleteDialogOpen(true)
    }

    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

  function handleCreateAthletePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setCreateAthleteProfileImage('')
      setCreateAthleteProfileImageUpload(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      setCreateAthleteProfileImage(dataUrl)
      setCreateAthleteProfileImageUpload({
        dataUrl,
        fileName: file.name || 'profile.jpg',
        contentType: file.type || 'image/jpeg',
      })
    }
    reader.readAsDataURL(file)
  }

  function handleClearCreateAthletePhoto() {
    setCreateAthleteProfileImage('')
    setCreateAthleteProfileImageUpload(null)
  }

  function resetCreateAthleteForm() {
    setCreateAthleteFirstName('')
    setCreateAthleteLastName('')
    setCreateAthleteDateOfBirth('')
    setCreateAthleteGender('male')
    setCreateAthletePosition('forward')
    setCreateAthleteHeightImperial('')
    setCreateAthleteWeightImperial('')
    setCreateAthleteHeightMetric('')
    setCreateAthleteWeightMetric('')
    setCreateAthleteMeasurementUnit('imperial')
    setCreateAthleteInviteEmail('')
    setInviteAthleteEmail('')
    setInviteDialogAthleteId(null)
    setCreateAthleteProfileImageUpload(null)
    setSendAthleteInvite(true)
    setCreateAthleteProfileImage('')
  }

  function populateCreateAthleteFormFromAthlete(athlete) {
    setCreateAthleteFirstName(athlete.firstName ?? '')
    setCreateAthleteLastName(athlete.lastName ?? '')
    setCreateAthleteDateOfBirth(athlete.dateOfBirth ?? '')
    setCreateAthleteGender(normalizeAthleteGender(athlete.gender))
    setCreateAthletePosition(normalizeAthletePosition(athlete.position))
    setCreateAthleteProfileImage(athlete.avatarUrl ?? '')
    setCreateAthleteProfileImageUpload(null)
    setCreateAthleteHeightMetric(formatHeightCmToMetric(athlete.heightCm))
    setCreateAthleteWeightMetric(formatWeightKgToMetric(athlete.weightKg))
    setCreateAthleteHeightImperial(formatHeightCmToImperial(athlete.heightCm))
    setCreateAthleteWeightImperial(formatWeightKgToImperial(athlete.weightKg))
  }

  const selectedAthlete = athletes.find((athlete) => athlete.id === editingAthleteId) ?? null
  const deletingAthlete = athletes.find((athlete) => athlete.id === deletingAthleteId) ?? null
  const inviteDialogAthlete = athletes.find((athlete) => athlete.id === inviteDialogAthleteId) ?? null
  const createAthleteNamePreview = [createAthleteFirstName, createAthleteLastName].filter(Boolean).join(' ')

  async function handleDeleteAthlete() {
    if (!deletingAthleteId) return

    setIsDeletingAthlete(true)
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/athletes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: deletingAthleteId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete athlete.')
      }
      return payload?.result || null
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Deleting athlete...', data: { close: true } },
        success: { title: 'Athlete deleted', description: `${deletingAthlete?.name || 'This athlete'} was removed from the workspace.`, data: { close: true } },
        error: (deleteError) => ({
          title: 'Failed to delete athlete',
          description: deleteError?.message || 'We could not delete this athlete right now.',
          data: { close: true },
        }),
      })
      setIsDeleteDialogOpen(false)
      setDeletingAthleteId(null)
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsDeletingAthlete(false)
    }
  }

  async function handleSendAthleteInvite(athleteId, inviteeEmail = '') {
    setIsSendingRowInvite(true)

    const submitPromise = (async () => {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, inviteeEmail }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send athlete invite.')
      }

      return payload?.athlete || null
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Sending invite...', data: { close: true } },
        success: (athlete) => ({
          title: athlete?.hasInvite ? 'Invitation sent' : 'Invitation updated',
          description: 'Sent an athlete invitation for ' + (athlete?.inviteeEmail || athlete?.name || 'this athlete') + '.',
          data: { close: true },
        }),
        error: (submitError) => ({
          title: 'Failed to send invite',
          description: submitError?.message || 'We could not send this athlete invite right now.',
          data: { close: true },
        }),
      })

      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsSendingRowInvite(false)
    }
  }

  function buildCreateEditAthletePayload() {
    const firstName = String(createAthleteFirstName || '').trim()
    const lastName = String(createAthleteLastName || '').trim()
    const normalizedInviteEmail = String(createAthleteInviteEmail || '').trim().toLowerCase()

    if (!firstName || !lastName) {
      throw new Error('First name and last name are required.')
    }

    if (athleteDialogMode === 'create' && sendAthleteInvite && !normalizedInviteEmail) {
      throw new Error('Invite email is required when sending an athlete invitation.')
    }

    const heightCm = createAthleteMeasurementUnit === 'metric'
      ? parseMetricInput(createAthleteHeightMetric)
      : parseImperialHeightToCm(createAthleteHeightImperial)

    const weightKg = createAthleteMeasurementUnit === 'metric'
      ? parseMetricInput(createAthleteWeightMetric)
      : parseImperialWeightToKg(createAthleteWeightImperial)

    return {
      athleteId: editingAthleteId,
      firstName,
      lastName,
      dateOfBirth: String(createAthleteDateOfBirth || '').trim(),
      gender: createAthleteGender,
      position: createAthletePosition,
      heightCm,
      weightKg,
      avatarUrl: createAthleteProfileImageUpload ? '' : (createAthleteProfileImage || selectedAthlete?.avatarUrl || ''),
      avatarUpload: createAthleteProfileImageUpload,
      inviteeEmail: normalizedInviteEmail,
      sendInvite: athleteDialogMode === 'create' ? sendAthleteInvite : false,
    }
  }

  async function handleCreateEditAthleteSubmit() {
    setIsSavingAthlete(true)

    const submitPromise = (async () => {
      const requestBody = buildCreateEditAthletePayload()
      const response = await fetch('/api/admin/athletes', {
        method: athleteDialogMode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || (athleteDialogMode === 'edit' ? 'Failed to save athlete.' : 'Failed to create athlete.'))
      }

      return {
        athlete: payload?.athlete || null,
        requestBody,
      }
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: athleteDialogMode === 'edit' ? 'Saving athlete...' : 'Creating athlete...', data: { close: true } },
        success: (savedAthlete) => ({
          title: athleteDialogMode === 'edit' ? 'Athlete updated' : savedAthlete?.requestBody?.sendInvite ? 'Invitation sent' : 'Athlete created',
          description: athleteDialogMode === 'edit'
            ? 'Changes saved for ' + (savedAthlete?.athlete?.name || [savedAthlete?.requestBody?.firstName, savedAthlete?.requestBody?.lastName].filter(Boolean).join(' ')) + '.'
            : savedAthlete?.requestBody?.sendInvite
              ? 'Created a pending athlete account for ' + (savedAthlete?.athlete?.inviteeEmail || savedAthlete?.requestBody?.inviteeEmail || 'this athlete') + ' and sent the invite.'
              : 'Created an inactive athlete account for ' + (savedAthlete?.athlete?.name || [savedAthlete?.requestBody?.firstName, savedAthlete?.requestBody?.lastName].filter(Boolean).join(' ') || 'this athlete') + '. You can send the invite later.',
          data: { close: true },
        }),
        error: (submitError) => ({
          title: athleteDialogMode === 'edit' ? 'Failed to save athlete' : 'Failed to create athlete',
          description: submitError?.message || (athleteDialogMode === 'edit' ? 'We could not save this athlete right now.' : 'Creating an athlete from web admin requires a real email only when you send the invite now.'),
          data: { close: true },
        }),
      })

      setIsCreateEditAthleteDialogOpen(false)
      setAthleteDialogMode('create')
      setEditingAthleteId(null)
      setSendAthleteInvite(true)
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsSavingAthlete(false)
    }
  }

  useEffect(() => {
    if (!isCreateEditAthleteDialogOpen) return

    if (athleteDialogMode === 'edit' && selectedAthlete) {
      populateCreateAthleteFormFromAthlete(selectedAthlete)
      return
    }

    if (athleteDialogMode === 'create') {
      resetCreateAthleteForm()
    }
  }, [athleteDialogMode, isCreateEditAthleteDialogOpen, selectedAthlete])

  const emptyStateMessage = error || (athleteFilters.length > 0 ? 'No athletes match the current filters.' : 'No results.')
  const skeletonRows = Array.from({ length: pagination.pageSize }, (_, rowIndex) => rowIndex)
  const pageSizeOptions = [5, 10, 20, 30]
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)
  const pageNumbers = Array.from({ length: table.getPageCount() }, (_, index) => index)
  const selectedAthleteCount = table.getSelectedRowModel().rows.length

  useEffect(() => {
    if (selectedAthleteCount === 0) {
      setIsBulkActionsMenuOpen(false)
    }
  }, [selectedAthleteCount])

  const selectedAthleteRows = table.getSelectedRowModel().rows
  const selectedAthletes = selectedAthleteRows.map((row) => row.original)
  const selectedInviteAthletes = selectedAthletes.filter((athlete) => athlete.status !== 'Active')
  const selectedInviteReadyCount = selectedInviteAthletes.filter((athlete) => athlete.hasInvite).length
  const selectedInviteNeedsEmailCount = selectedInviteAthletes.length - selectedInviteReadyCount
  const selectedBulkInvitePayloads = selectedInviteAthletes.map((athlete) => ({
    athleteId: athlete.id,
    inviteeEmail: athlete.hasInvite ? '' : String(bulkInviteEmailsByAthleteId[athlete.id] ?? '').trim().toLowerCase(),
    needsEmail: !athlete.hasInvite,
  }))
  const selectedExportActiveCount = selectedAthletes.filter((athlete) => athlete.status === 'Active').length
  const selectedExportInactiveCount = selectedAthleteCount - selectedExportActiveCount
  const bulkInviteSendDisabled = selectedInviteAthletes.length === 0
    || isSendingBulkInvites
    || selectedBulkInvitePayloads.some((payload) => payload.needsEmail && !payload.inviteeEmail)
  const bulkExportDisabled = isExportingAthletes || selectedAthleteCount === 0 || bulkExportFields.length === 0
  const selectedAssignProgram = programOptions.find((program) => program.id === selectedAssignProgramId) ?? null
  const normalizedGroupSearchQuery = groupSearchQuery.trim().toLowerCase()
  const filteredGroupOptions = groupOptions.filter((group) => {
    if (!normalizedGroupSearchQuery) return true
    return String(group.name ?? '').toLowerCase().includes(normalizedGroupSearchQuery)
  })

  function handleBulkActionsMenuOpenChange(open) {
    if (open && selectedAthleteCount === 0) {
      setIsBulkActionsMenuOpen(false)
      return
    }

    setIsBulkActionsMenuOpen(open)
  }

  function handleBulkInviteSheetOpenChange(open) {
    setIsBulkInviteSheetOpen(open)

    if (!open) {
      setIsBulkActionsMenuOpen(false)
      setBulkInviteEmailsByAthleteId({})
    }
  }

  function resetBulkExportState() {
    setBulkExportFields(DEFAULT_BULK_EXPORT_FIELDS)
  }

  function handleBulkExportSheetOpenChange(open) {
    setIsBulkExportSheetOpen(open)

    if (!open) {
      setIsBulkActionsMenuOpen(false)
      resetBulkExportState()
    }
  }

  function toggleBulkExportField(fieldId) {
    setBulkExportFields((currentFields) => (
      currentFields.includes(fieldId)
        ? currentFields.filter((currentField) => currentField !== fieldId)
        : [...currentFields, fieldId]
    ))
  }

  function updateBulkInviteEmail(athleteId, email) {
    setBulkInviteEmailsByAthleteId((currentEmails) => ({
      ...currentEmails,
      [athleteId]: email,
    }))
  }

  async function handleBulkInviteSubmit() {
    if (bulkInviteSendDisabled) return

    setIsSendingBulkInvites(true)

    const submitPromise = (async () => {
      const sentAthletes = await Promise.all(selectedBulkInvitePayloads.map(async (invitePayload) => {
        const response = await fetch('/api/admin/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteId: invitePayload.athleteId, inviteeEmail: invitePayload.inviteeEmail }),
        })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to send athlete invite.')
        }

        return payload?.athlete || null
      }))

      return sentAthletes.filter(Boolean)
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Sending invites...', data: { close: true } },
        success: (sentAthletes) => ({
          title: 'Invitations sent',
          description: `${sentAthletes.length} athlete invite${sentAthletes.length === 1 ? '' : 's'} sent.`,
          data: { close: true },
        }),
        error: (submitError) => ({
          title: 'Failed to send invites',
          description: submitError?.message || 'We could not send these athlete invites right now.',
          data: { close: true },
        }),
      })

      setIsBulkInviteSheetOpen(false)
      setIsBulkActionsMenuOpen(false)
      setBulkInviteEmailsByAthleteId({})
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsSendingBulkInvites(false)
    }
  }

  function handleBulkExportSubmit() {
    if (bulkExportDisabled) return

    setIsExportingAthletes(true)

    try {
      const timestamp = new Date().toISOString().slice(0, 10)

      const csv = buildBulkExportCsv(selectedAthletes, bulkExportFields)
      downloadBulkExportFile({
        content: csv,
        fileName: `pplus-athletes-export-${timestamp}.csv`,
        mimeType: 'text/csv;charset=utf-8',
      })

      toastManager.show({
        title: 'Athletes export ready',
        description: `${selectedAthleteCount} athlete${selectedAthleteCount === 1 ? '' : 's'} exported.`,
        variant: 'success',
        data: { close: true },
      })
      setIsBulkExportSheetOpen(false)
      setIsBulkActionsMenuOpen(false)
      setRowSelection({})
      resetBulkExportState()
    } catch (exportError) {
      toastManager.show({
        title: 'Failed to export athletes',
        description: exportError?.message || 'We could not generate this athlete export right now.',
        variant: 'error',
        data: { close: true },
      })
    } finally {
      setIsExportingAthletes(false)
    }
  }

  async function handleBulkDeleteAthletes() {
    if (selectedAthleteCount === 0 || isDeletingSelectedAthletes) return

    const selectedAthleteIds = selectedAthletes.map((athlete) => athlete.id).filter(Boolean)
    if (selectedAthleteIds.length === 0) return

    setIsDeletingSelectedAthletes(true)
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/athletes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteIds: selectedAthleteIds }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete selected athletes.')
      }

      return payload?.result || null
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Deleting athletes...', data: { close: true } },
        success: { title: 'Athletes deleted', description: `${selectedAthleteCount} athlete${selectedAthleteCount === 1 ? '' : 's'} removed from the workspace.`, data: { close: true } },
        error: (deleteError) => ({
          title: 'Failed to delete athletes',
          description: deleteError?.message || 'We could not delete these athletes right now.',
          data: { close: true },
        }),
      })

      setIsBulkDeleteDialogOpen(false)
      setIsBulkActionsMenuOpen(false)
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsDeletingSelectedAthletes(false)
    }
  }

  function handleAddToGroupsSheetOpenChange(open) {
    setIsAddToGroupsSheetOpen(open)

    if (!open) {
      setIsBulkActionsMenuOpen(false)
      setSelectedGroupIds([])
      setGroupSearchQuery('')
    }
  }

  function toggleSelectedGroupId(groupId) {
    setSelectedGroupIds((currentIds) => (
      currentIds.includes(groupId)
        ? currentIds.filter((currentId) => currentId !== groupId)
        : [...currentIds, groupId]
    ))
  }

  async function handleAddToGroupsSubmit() {
    if (selectedGroupIds.length === 0 || selectedAthleteCount === 0) return

    const selectedAthleteIds = selectedAthletes.map((athlete) => athlete.id).filter(Boolean)
    if (selectedAthleteIds.length === 0) return

    setIsAddingToGroups(true)

    const submitPromise = (async () => {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-athletes',
          groupIds: selectedGroupIds,
          athleteIds: selectedAthleteIds,
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to add athletes to groups.')
      }

      return payload?.result ?? {}
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Adding to groups...', data: { close: true } },
        success: (result) => ({
          title: 'Athletes added to groups',
          description: `${result?.athletesAdded ?? selectedAthleteIds.length} athlete${selectedAthleteIds.length === 1 ? '' : 's'} added to ${result?.groupsUpdated ?? selectedGroupIds.length} group${selectedGroupIds.length === 1 ? '' : 's'}.`,
          data: { close: true },
        }),
        error: (submitError) => ({
          title: 'Failed to add to groups',
          description: submitError?.message || 'We could not add these athletes to groups right now.',
          data: { close: true },
        }),
      })

      setIsAddToGroupsSheetOpen(false)
      setIsBulkActionsMenuOpen(false)
      setSelectedGroupIds([])
      setGroupSearchQuery('')
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsAddingToGroups(false)
    }
  }

  function handleAssignProgramSheetOpenChange(open) {
    setIsAssignProgramSheetOpen(open)

    if (!open) {
      setIsBulkActionsMenuOpen(false)
    }
  }

  async function handleAssignProgramSubmit() {
    if (!selectedAssignProgram || selectedAthleteCount === 0) return

    const selectedAthleteIds = selectedAthletes.map((athlete) => athlete.id).filter(Boolean)
    if (selectedAthleteIds.length === 0) return

    setIsAssigningProgram(true)

    const submitPromise = (async () => {
      const response = await fetch('/api/admin/programs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAssignProgram.id,
          athleteIds: selectedAthleteIds,
          name: selectedAssignProgram.name,
          startDate: selectedAssignProgram.startDate ?? '',
          endDate: selectedAssignProgram.endDate ?? '',
          description: selectedAssignProgram.description ?? '',
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to assign program.')
      }

      return payload?.program || selectedAssignProgram
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Assigning program...', data: { close: true } },
        success: (program) => ({
          title: 'Program assigned',
          description: `${program?.name || selectedAssignProgram.name} assigned to ${selectedAthleteIds.length} athlete${selectedAthleteIds.length === 1 ? '' : 's'}.`,
          data: { close: true },
        }),
        error: (submitError) => ({
          title: 'Failed to assign program',
          description: submitError?.message || 'We could not assign this program right now.',
          data: { close: true },
        }),
      })

      setIsAssignProgramSheetOpen(false)
      setIsBulkActionsMenuOpen(false)
      setSelectedAssignProgramId('')
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsAssigningProgram(false)
    }
  }

  return (
    <div className="admin-shell-athletes-table-example">
      <div className="flex flex-col gap-3">
        <div className="flex w-full flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2">
            <Filters
              filters={athleteFilters}
              fields={athleteFilterFields}
              onChange={setAthleteFilters}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="admin-shell-athletes-filter-trigger rounded-[12px] min-h-[40px] shadow-none"
                >
                  <Plus className="size-4" />
                  Add filter
                </Button>
              }
            />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3">
            <DropdownMenu open={isBulkActionsMenuOpen} onOpenChange={handleBulkActionsMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="admin-shell-athletes-example-columns-button"
                  disabled={selectedAthleteCount === 0}
                  aria-label="Bulk actions"
                >
                  {selectedAthleteCount > 0 ? `Bulk actions (${selectedAthleteCount})` : 'Bulk actions'}
                  <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[190px]">
                <DropdownMenuItem
                  className="admin-shell-athletes-bulk-menu-item"
                  onSelect={(event) => {
                    event.preventDefault()
                    setIsBulkActionsMenuOpen(false)
                    setSelectedAssignProgramId('')
                    setIsAssignProgramSheetOpen(true)
                  }}
                >
                  <BookOpen className="size-4" aria-hidden="true" />
                  Assign program
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="admin-shell-athletes-bulk-menu-item"
                  onSelect={(event) => {
                    event.preventDefault()
                    setIsBulkActionsMenuOpen(false)
                    setSelectedGroupIds([])
                    setGroupSearchQuery('')
                    setIsAddToGroupsSheetOpen(true)
                  }}
                >
                  <UsersRound className="size-4" aria-hidden="true" />
                  Add to groups
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="admin-shell-athletes-bulk-menu-item"
                  onSelect={(event) => {
                    event.preventDefault()
                    setIsBulkActionsMenuOpen(false)
                    setBulkInviteEmailsByAthleteId({})
                    setIsBulkInviteSheetOpen(true)
                  }}
                >
                  <Send className="size-4" aria-hidden="true" />
                  Send invite
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="admin-shell-athletes-bulk-menu-item"
                  onSelect={(event) => {
                    event.preventDefault()
                    setIsBulkActionsMenuOpen(false)
                    resetBulkExportState()
                    setIsBulkExportSheetOpen(true)
                  }}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="admin-shell-athletes-bulk-menu-item admin-shell-athletes-bulk-menu-item-danger"
                  onSelect={(event) => {
                    event.preventDefault()
                    setIsBulkActionsMenuOpen(false)
                    setIsBulkDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="admin-shell-athletes-example-columns-button">
                  Columns
                  <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checkIconClassName="text-[var(--admin-shell-primary-button-bg)]"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.columnDef.meta?.label ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              onClick={() => {
                setAthleteDialogMode('create')
                setEditingAthleteId(null)
                setSendAthleteInvite(true)
                setIsCreateEditAthleteDialogOpen(true)
              }}
              className="admin-shell-athletes-invite-button self-start rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] md:self-auto"
            >
              Create athlete
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={isAddToGroupsSheetOpen} onOpenChange={handleAddToGroupsSheetOpenChange}>
        <SheetContent side="right" className="admin-shell-athletes-add-groups-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle className="text-[var(--admin-dashboard-card-text)]">Add to groups</SheetTitle>
            <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
              Choose one or more groups for {selectedAthleteCount} selected athletes.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <section className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Selected athletes</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">{selectedAthleteCount} athletes selected</p>
                </div>
                <div className="mt-4 grid gap-2">
                  {selectedAthletes.slice(0, 3).map((athlete) => (
                    <div key={athlete.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2">
                      <span className="truncate text-sm font-medium text-[var(--admin-dashboard-card-text)]">{athlete.name}</span>
                      <span className="shrink-0 text-xs text-[var(--admin-dashboard-card-muted)]">{athlete.program || '-'}</span>
                    </div>
                  ))}
                  {selectedAthleteCount > 3 ? (
                    <p className="text-xs font-medium text-[var(--admin-shell-primary-button-bg)]">+ {selectedAthleteCount - 3} more</p>
                  ) : null}
                </div>
              </section>

              <section className="grid gap-3">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Groups</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Select one or more groups to add these athletes to.</p>
                </div>
                <Input
                  className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                  placeholder="Search groups..."
                  value={groupSearchQuery}
                  onChange={(event) => setGroupSearchQuery(event.target.value)}
                />
                <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {filteredGroupOptions.length > 0 ? (
                    filteredGroupOptions.map((group) => {
                      const isGroupSelected = selectedGroupIds.includes(group.id)
                      return (
                        <button
                          type="button"
                          key={group.id}
                          className={`flex items-center gap-3 rounded-[14px] border px-3 py-3 text-left transition-colors ${isGroupSelected ? 'border-[var(--admin-shell-primary-button-bg)] bg-[#3BE0AF]/10 hover:bg-[#3BE0AF]/10' : 'border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] hover:bg-[#3BE0AF]/10'}`}
                          onClick={() => toggleSelectedGroupId(group.id)}
                        >
                          <Checkbox
                            className="admin-shell-athletes-checkbox-input"
                            checked={isGroupSelected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleSelectedGroupId(group.id)}
                            aria-label={`Select ${group.name}`}
                          />
                          <span className="grid min-w-0 gap-0.5">
                            <span className="truncate text-sm font-medium text-[var(--admin-dashboard-card-text)]">{group.name}</span>
                            <span className="text-xs text-[var(--admin-dashboard-card-muted)]">{group.athleteCountLabel ?? `${group.athleteCount ?? group.athletes?.length ?? 0} athletes`}</span>
                          </span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-3 py-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                      No groups found.
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-[var(--admin-dashboard-card-muted)]">{selectedGroupIds.length} groups selected</p>
              </section>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              onClick={() => setIsAddToGroupsSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={isAddingToGroups || selectedGroupIds.length === 0 || selectedAthleteCount === 0}
              onClick={handleAddToGroupsSubmit}
            >
              {isAddingToGroups ? 'Adding...' : 'Add to groups'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isBulkInviteSheetOpen} onOpenChange={handleBulkInviteSheetOpenChange}>
        <SheetContent side="right" className="admin-shell-athletes-bulk-invite-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle className="text-[var(--admin-dashboard-card-text)]">Send invites</SheetTitle>
            <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
              Prepare invitations for {selectedInviteAthletes.length} selected inactive athletes.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <section className="grid gap-3 rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Invite readiness</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Review who can receive an invite now and who needs an email first.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-3">
                    <p className="text-lg font-semibold text-[var(--admin-dashboard-card-text)]">{selectedInviteReadyCount}</p>
                    <p className="text-xs text-[var(--admin-dashboard-card-muted)]">Ready to resend</p>
                  </div>
                  <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-3">
                    <p className="text-lg font-semibold text-[var(--admin-dashboard-card-text)]">{selectedInviteNeedsEmailCount}</p>
                    <p className="text-xs text-[var(--admin-dashboard-card-muted)]">Need email</p>
                  </div>
                  <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-3">
                    <p className="text-lg font-semibold text-[var(--admin-dashboard-card-text)]">{selectedAthleteCount - selectedInviteAthletes.length}</p>
                    <p className="text-xs text-[var(--admin-dashboard-card-muted)]">Skipped active</p>
                  </div>
                </div>
              </section>

              <section className="grid gap-3">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Selected athletes</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Existing invited athletes can be resent. New invitees need an email before sending.</p>
                </div>
                <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {selectedInviteAthletes.length > 0 ? (
                    selectedInviteAthletes.map((athlete) => (
                      <div key={athlete.id} className="grid gap-3 rounded-[16px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{athlete.name}</p>
                            <p className="truncate text-xs text-[var(--admin-dashboard-card-muted)]">{athlete.program || 'No program assigned'}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${athlete.hasInvite ? 'border-[var(--admin-shell-primary-button-bg)] bg-[#3BE0AF]/10 text-[var(--admin-shell-primary-button-bg)]' : 'border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-muted)]'}`}>
                            {athlete.hasInvite ? 'Ready to resend' : 'Needs email'}
                          </span>
                        </div>
                        {!athlete.hasInvite ? (
                          <Input
                            className="h-10 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                            placeholder="athlete@email.com"
                            type="email"
                            value={bulkInviteEmailsByAthleteId[athlete.id] ?? ''}
                            onChange={(event) => updateBulkInviteEmail(athlete.id, event.target.value)}
                          />
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-3 py-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                      No inactive athletes selected.
                    </div>
                  )}
                </div>
              </section>

              <p className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-xs text-[var(--admin-dashboard-card-muted)]">
                Ready athletes will send immediately. Athletes without stored invite emails need an email before testing.
              </p>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              onClick={() => setIsBulkInviteSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={bulkInviteSendDisabled}
              onClick={handleBulkInviteSubmit}
            >
              {isSendingBulkInvites ? 'Sending...' : 'Send invites'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isBulkExportSheetOpen} onOpenChange={handleBulkExportSheetOpenChange}>
        <SheetContent side="right" className="admin-shell-athletes-export-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle className="text-[var(--admin-dashboard-card-text)]">Export athletes</SheetTitle>
            <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
              Choose what to include for {selectedAthleteCount} selected athletes.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <section className="grid gap-3 rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Export summary</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Review the selected roster before choosing export options.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-3">
                    <p className="text-lg font-semibold text-[var(--admin-dashboard-card-text)]">{selectedAthleteCount}</p>
                    <p className="text-xs text-[var(--admin-dashboard-card-muted)]">Selected</p>
                  </div>
                  <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-3">
                    <p className="text-lg font-semibold text-[var(--admin-dashboard-card-text)]">{selectedExportActiveCount}</p>
                    <p className="text-xs text-[var(--admin-dashboard-card-muted)]">Active</p>
                  </div>
                  <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-3">
                    <p className="text-lg font-semibold text-[var(--admin-dashboard-card-text)]">{selectedExportInactiveCount}</p>
                    <p className="text-xs text-[var(--admin-dashboard-card-muted)]">Inactive</p>
                  </div>
                </div>
              </section>

              <section className="grid gap-3">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Export format</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">This export downloads as a CSV file.</p>
                </div>
                <div className="rounded-[14px] border border-[var(--admin-shell-primary-button-bg)] bg-[#3BE0AF]/10 px-4 py-3 text-left">
                  <span className="block text-sm font-semibold text-[var(--admin-dashboard-card-text)]">CSV</span>
                  <span className="mt-1 block text-xs text-[var(--admin-dashboard-card-muted)]">Spreadsheet-friendly athlete rows</span>
                </div>
              </section>

              <section className="grid gap-3">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Included fields</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Open a group to see every possible field from the database.</p>
                </div>
                <Accordion type="multiple" className="grid gap-2">
                  {BULK_EXPORT_FIELD_GROUPS.map((fieldGroup) => (
                    <AccordionItem
                      key={fieldGroup.id}
                      value={fieldGroup.id}
                      className={`overflow-hidden rounded-[14px] border transition-colors ${bulkExportFields.includes(fieldGroup.id) ? 'border-[var(--admin-shell-primary-button-bg)] bg-[#3BE0AF]/10' : 'border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)]'}`}
                    >
                      <AccordionTrigger className="px-3 py-3 hover:bg-[#3BE0AF]/10">
                        <span className="flex min-w-0 flex-1 items-start gap-3">
                          <Checkbox
                            className="admin-shell-athletes-checkbox-input mt-0.5"
                            checked={bulkExportFields.includes(fieldGroup.id)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => {
                              event.stopPropagation()
                              toggleBulkExportField(fieldGroup.id)
                            }}
                            aria-label={`Include ${fieldGroup.label} fields`}
                          />
                          <span className="grid min-w-0 gap-0.5">
                            <span className="text-sm font-medium text-[var(--admin-dashboard-card-text)]">{fieldGroup.label}</span>
                            <span className="text-xs leading-5 text-[var(--admin-dashboard-card-muted)]">{fieldGroup.description}</span>
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 pt-0">
                        <div className="flex flex-wrap gap-2 pl-8">
                          {fieldGroup.fields.map((fieldName) => (
                            <span key={fieldName} className="rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-2.5 py-1 text-xs font-medium text-[var(--admin-dashboard-card-muted)]">
                              {fieldName}
                            </span>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              <section className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Selected athletes preview</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">First rows that will be included.</p>
                </div>
                <div className="mt-4 grid gap-2">
                  {selectedAthletes.slice(0, 3).map((athlete) => (
                    <div key={athlete.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2">
                      <span className="truncate text-sm font-medium text-[var(--admin-dashboard-card-text)]">{athlete.name}</span>
                      <span className="shrink-0 text-xs text-[var(--admin-dashboard-card-muted)]">{athlete.program || athlete.status || '-'}</span>
                    </div>
                  ))}
                  {selectedAthleteCount > 3 ? (
                    <p className="text-xs font-medium text-[var(--admin-shell-primary-button-bg)]">+ {selectedAthleteCount - 3} more</p>
                  ) : null}
                </div>
              </section>

            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              onClick={() => setIsBulkExportSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] disabled:opacity-60"
              disabled={bulkExportDisabled}
              onClick={handleBulkExportSubmit}
            >
              {isExportingAthletes ? 'Exporting...' : 'Export athletes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isAssignProgramSheetOpen} onOpenChange={handleAssignProgramSheetOpenChange}>
        <SheetContent side="right" className="admin-shell-athletes-assign-program-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle className="text-[var(--admin-dashboard-card-text)]">Assign program</SheetTitle>
            <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
              Choose a program for {selectedAthleteCount} selected athletes.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <section className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Selected athletes</h3>
                    <p className="text-sm text-[var(--admin-dashboard-card-muted)]">{selectedAthleteCount} athletes selected</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {selectedAthletes.slice(0, 3).map((athlete) => (
                    <div key={athlete.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2">
                      <span className="truncate text-sm font-medium text-[var(--admin-dashboard-card-text)]">{athlete.name}</span>
                      <span className="shrink-0 text-xs text-[var(--admin-dashboard-card-muted)]">{athlete.program || '-'}</span>
                    </div>
                  ))}
                  {selectedAthleteCount > 3 ? (
                    <p className="text-xs font-medium text-[var(--admin-shell-primary-button-bg)]">+ {selectedAthleteCount - 3} more</p>
                  ) : null}
                </div>
              </section>

              <section className="grid gap-3">
                <span className="text-sm font-medium text-[var(--admin-dashboard-card-text)]">Program</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="admin-shell-athletes-example-columns-button admin-shell-athletes-create-select-trigger w-full" aria-label="Program">
                      <span className="truncate">{selectedAssignProgram?.name ?? 'Select a program'}</span>
                      <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
                    {isLoadingAssignPrograms ? (
                      <DropdownMenuItem disabled>Loading programs...</DropdownMenuItem>
                    ) : programOptions.length > 0 ? (
                      programOptions.map((program) => (
                        <DropdownMenuItem key={program.id} onSelect={() => setSelectedAssignProgramId(program.id)}>
                          <div className="grid gap-0.5">
                            <span className="text-sm font-medium">{program.name}</span>
                            <span className="text-xs text-[var(--admin-dashboard-card-muted)]">{`${program.workouts ?? program.workoutCount ?? 0} workouts`}</span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>No programs available</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </section>

            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              onClick={() => setIsAssignProgramSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={isAssigningProgram || !selectedAssignProgramId || selectedAthleteCount === 0}
              onClick={handleAssignProgramSubmit}
            >
              {isAssigningProgram ? 'Assigning...' : 'Assign program'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isCreateEditAthleteDialogOpen} onOpenChange={(open) => {
        setIsCreateEditAthleteDialogOpen(open)
        if (!open) {
          setAthleteDialogMode('create')
          setEditingAthleteId(null)
          setSendAthleteInvite(true)
        }
      }}>
        <SheetContent side="right" className="admin-shell-athletes-create-sheet border-l !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b !border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle className="text-[var(--admin-dashboard-card-text)]">{athleteDialogMode === 'edit' ? 'Edit athlete profile' : 'Create athlete profile'}</SheetTitle>
            <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
              {athleteDialogMode === 'edit'
                ? 'Update the information below.'
                : 'Fill out the information below.'}
            </SheetDescription>
          </SheetHeader>

          <div className="admin-shell-athletes-create-sheet-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="admin-shell-athletes-create-form grid gap-5">
            <CreateAthletePhotoUploader
              athleteName={createAthleteNamePreview}
              previewSrc={createAthleteProfileImage}
              onFileChange={handleCreateAthletePhotoChange}
              onClearPreview={handleClearCreateAthletePhoto}
            />

            <div className="admin-shell-athletes-create-row admin-shell-athletes-create-row-two-up grid gap-4 md:grid-cols-2">
              <CreateAthleteDialogField htmlFor="create-athlete-first-name" label="First name">
                <Input
                  id="create-athlete-first-name"
                  className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                  placeholder="First name"
                  value={createAthleteFirstName}
                  onChange={(event) => setCreateAthleteFirstName(event.target.value)}
                />
              </CreateAthleteDialogField>
              <CreateAthleteDialogField htmlFor="create-athlete-last-name" label="Last name">
                <Input
                  id="create-athlete-last-name"
                  className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                  placeholder="Last name"
                  value={createAthleteLastName}
                  onChange={(event) => setCreateAthleteLastName(event.target.value)}
                />
              </CreateAthleteDialogField>
            </div>

            <CreateAthleteDialogField htmlFor="create-athlete-date-of-birth" label="Date of birth">
              <Input
                id="create-athlete-date-of-birth"
                type="date"
                value={createAthleteDateOfBirth}
                onChange={(event) => setCreateAthleteDateOfBirth(event.target.value)}
                className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80"
              />
            </CreateAthleteDialogField>

            <div className="admin-shell-athletes-create-row admin-shell-athletes-create-row-two-up grid gap-4 md:grid-cols-2">
              <CreateAthleteDialogField htmlFor="create-athlete-gender" label="Gender">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button id="create-athlete-gender" type="button" className="admin-shell-athletes-example-columns-button admin-shell-athletes-create-select-trigger w-full" aria-label="Gender">
                      <span className="truncate">{formatCreateAthleteGenderLabel(createAthleteGender)}</span>
                      <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
                    <DropdownMenuItem onSelect={() => setCreateAthleteGender('male')}>Male</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setCreateAthleteGender('female')}>Female</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setCreateAthleteGender('other')}>Other</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CreateAthleteDialogField>
              <CreateAthleteDialogField htmlFor="create-athlete-position" label="Position">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button id="create-athlete-position" type="button" className="admin-shell-athletes-example-columns-button admin-shell-athletes-create-select-trigger w-full" aria-label="Position">
                      <span className="truncate">{formatCreateAthletePositionLabel(createAthletePosition)}</span>
                      <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
                    <DropdownMenuItem onSelect={() => setCreateAthletePosition('forward')}>Forward</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setCreateAthletePosition('defense')}>Defense</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setCreateAthletePosition('goalie')}>Goalie</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CreateAthleteDialogField>
            </div>

            <Tabs
              defaultValue="imperial"
              value={createAthleteMeasurementUnit}
              onValueChange={setCreateAthleteMeasurementUnit}
              className="admin-shell-athletes-create-tabs grid gap-4"
            >
              <TabsList>
                <TabsTrigger value="imperial">Imperial</TabsTrigger>
                <TabsTrigger value="metric">Metric</TabsTrigger>
              </TabsList>
              <TabsContent value="imperial" className="grid gap-4">
                <div className="admin-shell-athletes-create-row admin-shell-athletes-create-row-two-up grid gap-4 md:grid-cols-2">
                  <CreateAthleteDialogField htmlFor="create-athlete-height-imperial" label="Height">
                    <Input
                      id="create-athlete-height-imperial"
                      className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                      placeholder={`5' 11\"`}
                      value={createAthleteHeightImperial}
                      onChange={(event) => setCreateAthleteHeightImperial(event.target.value)}
                    />
                  </CreateAthleteDialogField>
                  <CreateAthleteDialogField htmlFor="create-athlete-weight-imperial" label="Weight">
                    <Input
                      id="create-athlete-weight-imperial"
                      className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                      placeholder="185 lb"
                      value={createAthleteWeightImperial}
                      onChange={(event) => setCreateAthleteWeightImperial(event.target.value)}
                    />
                  </CreateAthleteDialogField>
                </div>
                {athleteDialogMode === 'create' ? (
                  <label className="flex items-center gap-3 text-sm font-medium text-[var(--admin-dashboard-card-text)]">
                    <Checkbox
                      className="admin-shell-athletes-checkbox-input"
                      checked={sendAthleteInvite}
                      onChange={(event) => setSendAthleteInvite(event.target.checked)}
                    />
                    <span>Send an invite to this athlete</span>
                  </label>
                ) : null}
              </TabsContent>
              <TabsContent value="metric" className="grid gap-4">
                <div className="admin-shell-athletes-create-row admin-shell-athletes-create-row-two-up grid gap-4 md:grid-cols-2">
                  <CreateAthleteDialogField htmlFor="create-athlete-height-metric" label="Height">
                    <Input
                      id="create-athlete-height-metric"
                      className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                      placeholder="180 cm"
                      value={createAthleteHeightMetric}
                      onChange={(event) => setCreateAthleteHeightMetric(event.target.value)}
                    />
                  </CreateAthleteDialogField>
                  <CreateAthleteDialogField htmlFor="create-athlete-weight-metric" label="Weight">
                    <Input
                      id="create-athlete-weight-metric"
                      className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                      placeholder="84 kg"
                      value={createAthleteWeightMetric}
                      onChange={(event) => setCreateAthleteWeightMetric(event.target.value)}
                    />
                  </CreateAthleteDialogField>
                </div>
                {athleteDialogMode === 'create' ? (
                  <label className="flex items-center gap-3 text-sm font-medium text-[var(--admin-dashboard-card-text)]">
                    <Checkbox
                      className="admin-shell-athletes-checkbox-input"
                      checked={sendAthleteInvite}
                      onChange={(event) => setSendAthleteInvite(event.target.checked)}
                    />
                    <span>Send an invite to this athlete</span>
                  </label>
                ) : null}
              </TabsContent>
            </Tabs>

            {athleteDialogMode === 'create' ? (
              sendAthleteInvite ? (
              <CreateAthleteDialogField htmlFor="create-athlete-invite-email" label="Email">
                <Input
                  id="create-athlete-invite-email"
                  type="email"
                  className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                  placeholder="athlete@email.com"
                  value={createAthleteInviteEmail}
                  onChange={(event) => setCreateAthleteInviteEmail(event.target.value)}
                />
              </CreateAthleteDialogField>
              ) : null
            ) : null}
            </div>
          </div>

          <div className="admin-shell-athletes-create-sheet-footer shrink-0 border-t !border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
                onClick={() => setIsCreateEditAthleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="admin-shell-athletes-create-submit rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
                onClick={handleCreateEditAthleteSubmit}
                disabled={isSavingAthlete}
              >
                {isSavingAthlete ? (athleteDialogMode === 'edit' ? 'Saving...' : 'Creating...') : athleteDialogMode === 'edit' ? 'Save changes' : 'Create athlete'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isInviteDialogOpen} onOpenChange={(open) => {
        setIsInviteDialogOpen(open)
        if (!open) {
          setInviteDialogAthleteId(null)
          setInviteAthleteEmail('')
        }
      }}>
        <DialogContent className="admin-shell-athletes-invite-dialog border !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] sm:max-w-[560px]">
          <div className="border-b !border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <DialogHeader>
              <DialogTitle>{inviteDialogAthlete?.hasInvite ? 'Resend invite' : 'Invite an athlete'}</DialogTitle>
              <DialogDescription>Bring a coach-managed athlete into the workspace{inviteDialogAthlete?.name ? ' for ' + inviteDialogAthlete.name : ''}.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="invite-athlete-email">
                Email address
              </label>
              <input
                id="invite-athlete-email"
                className="h-11 rounded-[12px] border !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] outline-none placeholder:text-[var(--admin-dashboard-card-muted)] focus:border-[var(--admin-shell-accent)]"
                placeholder="athlete@email.com"
                type="email"
                value={inviteAthleteEmail}
                onChange={(event) => setInviteAthleteEmail(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="border-t !border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={isSendingRowInvite}
              onClick={() => {
                void handleSendAthleteInvite(inviteDialogAthleteId, inviteAthleteEmail)
                setIsInviteDialogOpen(false)
                setInviteDialogAthleteId(null)
                setInviteAthleteEmail('')
              }}
            >
              {isSendingRowInvite ? 'Sending...' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Delete athletes</DialogTitle>
            <DialogDescription>These athletes will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-3 text-sm text-[var(--admin-dashboard-card-muted)]">
            <p className="font-medium text-[var(--admin-dashboard-card-text)]">{selectedAthleteCount} athlete{selectedAthleteCount === 1 ? '' : 's'} selected</p>
            {selectedAthletes.slice(0, 3).map((athlete) => (
              <p key={athlete.id}>{athlete.name}</p>
            ))}
            {selectedAthleteCount > 3 ? (
              <p>+ {selectedAthleteCount - 3} more</p>
            ) : null}
          </div>
          <DialogFooter className="sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px]"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              disabled={isDeletingSelectedAthletes}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
              onClick={handleBulkDeleteAthletes}
              disabled={isDeletingSelectedAthletes || selectedAthleteCount === 0}
            >
              {isDeletingSelectedAthletes ? 'Deleting...' : 'Delete athletes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Delete athlete</DialogTitle>
            <DialogDescription>This athlete will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px]"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingAthlete}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
              onClick={handleDeleteAthlete}
              disabled={isDeletingAthlete}
            >
              {isDeletingAthlete ? 'Deleting...' : 'Delete athlete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="admin-shell-athletes-table-shell">
        <Table className="admin-shell-athletes-table">
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
              <col
                key={column.id}
                style={{ width: ATHLETE_TABLE_COLUMN_WIDTHS[column.id] ?? 'auto' }}
              />
            ))}
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              skeletonRows.map((rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className={rowIndex % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}>
                  <TableCell>
                    <Skeleton className="h-4 w-4 rounded-[4px]" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[140px]" />
                        <Skeleton className="h-3 w-[96px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[84px]" />
                      <Skeleton className="h-2 w-[132px] rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[88px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[132px] rounded-full" />
                  </TableCell>
                  <TableCell className="admin-shell-athletes-actions-cell">
                    <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={index % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="admin-shell-athletes-row-even">
                <TableCell colSpan={columns.length} className="admin-shell-athletes-empty-state py-10 text-center">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="admin-shell-athletes-pagination-bar flex items-center justify-end gap-3 py-4 text-sm">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="h-9 w-[76px] rounded-[10px] px-3 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>{pageStart} - {pageEnd} of {totalRows}</span>
        <button
          type="button"
          aria-label="Go to previous page"
          className="admin-shell-athletes-example-pagination-button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ‹
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={`page-${pageNumber}`}
            type="button"
            className={`admin-shell-athletes-example-pagination-button ${pagination.pageIndex === pageNumber ? 'admin-shell-athletes-example-pagination-button-active' : ''}`}
            onClick={() => table.setPageIndex(pageNumber)}
          >
            {pageNumber + 1}
          </button>
        ))}
        <button
          type="button"
          aria-label="Go to next page"
          className="admin-shell-athletes-example-pagination-button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          ›
        </button>
      </div>
    </div>
  )
}

export default AthletesDataTable
