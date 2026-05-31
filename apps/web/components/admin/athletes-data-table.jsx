'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, MoreHorizontal, Plus } from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'

import { Filters, createFilter } from '@/components/reui/filters'
import { useToast } from '@/hooks/use-toast'
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
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
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
  const inviteDialogAthlete = athletes.find((athlete) => athlete.id === inviteDialogAthleteId) ?? null
  const createAthleteNamePreview = [createAthleteFirstName, createAthleteLastName].filter(Boolean).join(' ')

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

  return (
    <div className="admin-shell-athletes-table-example">
      <div className="flex flex-col gap-3">
        <div className="flex w-full items-center justify-between gap-3">
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
        <div className="flex w-full flex-wrap items-center justify-start gap-2">
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
      </div>

      <Dialog open={isCreateEditAthleteDialogOpen} onOpenChange={(open) => {
        setIsCreateEditAthleteDialogOpen(open)
        if (!open) {
          setAthleteDialogMode('create')
          setEditingAthleteId(null)
          setSendAthleteInvite(true)
        }
      }} modal={false}>
        <DialogContent
          pageScrollable
          className="admin-shell-athletes-invite-dialog border !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] sm:max-w-[720px]"
        >
          <div className="shrink-0 border-b !border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <DialogHeader>
              <DialogTitle>{athleteDialogMode === 'edit' ? 'Edit athlete profile' : 'Create athlete profile'}</DialogTitle>
              <DialogDescription>
                {athleteDialogMode === 'edit'
                  ? "Update the athlete's personal details, profile photo, and preferred measurements."
                  : "Add the athlete's personal details, profile photo, and preferred measurements."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="admin-shell-athletes-create-form grid gap-5 px-6 py-6">
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
                <Select value={createAthleteGender} onValueChange={setCreateAthleteGender}>
                  <SelectTrigger id="create-athlete-gender" className="h-11 rounded-[12px]">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </CreateAthleteDialogField>
              <CreateAthleteDialogField htmlFor="create-athlete-position" label="Position">
                <Select value={createAthletePosition} onValueChange={setCreateAthletePosition}>
                  <SelectTrigger id="create-athlete-position" className="h-11 rounded-[12px]">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forward">Forward</SelectItem>
                    <SelectItem value="defense">Defense</SelectItem>
                    <SelectItem value="goalie">Goalie</SelectItem>
                  </SelectContent>
                </Select>
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

          <DialogFooter className="border-t !border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end gap-3">
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
              {isSavingAthlete ? (athleteDialogMode === 'edit' ? 'Saving...' : 'Creating...') : athleteDialogMode === 'edit' ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] sm:max-w-[560px]">
          <div className="px-6 py-5">
            <DialogHeader>
              <DialogTitle>Delete athlete</DialogTitle>
              <DialogDescription>This athlete will be removed from the workspace.</DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="border-t !border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="admin-shell-athletes-table-shell">
        <Table className="admin-shell-athletes-table">
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
