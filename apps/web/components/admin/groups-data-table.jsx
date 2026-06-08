'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Archive, BookOpen, ChevronDown, Download, MoreHorizontal, Plus, RotateCcw, Trash2, UserPlus } from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Textarea from '@/components/ui/textarea'
import { Filters } from '@/components/reui/filters'
import { useToast } from '@/hooks/use-toast'
import {
  buildGroupsExportCsv,
  downloadGroupsExportFile,
  getGroupsExportFileName,
  groupExportColumns,
} from '@/lib/admin-groups-export'

function getAthleteInitials(name = '') {
  const initials = String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return initials || 'PP'
}

function GroupAvatarStack({ athletes = [] }) {
  const visibleAthletes = Array.isArray(athletes) ? athletes.slice(0, 4) : []
  const overflowCount = Array.isArray(athletes) && athletes.length > visibleAthletes.length ? athletes.length - visibleAthletes.length : 0

  if (!visibleAthletes.length) {
    return (
      <div className="flex -space-x-2" aria-label="No athlete memberships yet">
        <Avatar className="size-8 border-2 border-[var(--admin-dashboard-card-bg)] bg-[var(--admin-dashboard-card-soft)] text-[10px] text-[var(--admin-dashboard-card-muted)]">
          <AvatarFallback>--</AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="flex -space-x-2" aria-label={`${athletes.length} group athlete${athletes.length === 1 ? '' : 's'}`}>
      {visibleAthletes.map((athlete) => (
        <Avatar key={athlete.id || athlete.name} className="size-8 border-2 border-[var(--admin-dashboard-card-bg)] bg-[var(--admin-dashboard-card-soft)] text-[10px] text-[var(--admin-dashboard-card-text)] hover:z-10">
          <AvatarImage src={athlete.avatarUrl} alt={athlete.name} className="border-2 border-[var(--admin-dashboard-card-bg)] hover:z-10" />
          <AvatarFallback>{getAthleteInitials(athlete.name)}</AvatarFallback>
        </Avatar>
      ))}
      {overflowCount ? (
        <span className="relative inline-flex size-8 items-center justify-center rounded-full border-2 border-[var(--admin-dashboard-card-bg)] bg-[var(--admin-dashboard-card-muted)] text-[10px] font-semibold text-[var(--admin-dashboard-card-bg)] hover:z-10">
          +{overflowCount}
        </span>
      ) : null}
    </div>
  )
}

function GroupCell({ name, athletes = [], description = '' }) {
  return (
    <div className="admin-shell-athletes-name-copy gap-2">
      <span className="admin-shell-athletes-name-text">{name}</span>
      <GroupAvatarStack athletes={athletes} />
      {description ? <span className="line-clamp-2 text-xs text-[var(--admin-dashboard-card-soft)]">{description}</span> : null}
    </div>
  )
}

function AccessCell({ access }) {
  return (
    <Badge tone="neutral" className="admin-shell-groups-access-badge normal-case tracking-normal">
      {access}
    </Badge>
  )
}

function StatusCell({ status }) {
  const isArchived = status === 'Archived'
  return (
    <Badge
      tone={isArchived ? 'warning' : 'success'}
      className={
        isArchived
          ? 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-pending normal-case tracking-normal'
          : 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-active normal-case tracking-normal'
      }
    >
      {status}
    </Badge>
  )
}

function GroupDialogField({ htmlFor, label, children }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

function RowActionsCell({
  isOpen = false,
  onOpenChange = () => {},
  onEditAction = () => {},
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
        <DropdownMenuItem onSelect={() => { onEditAction(); onOpenChange(false) }}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { onDeleteAction(); onOpenChange(false) }}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function createGroupFormValues(group = null) {
  return {
    name: group?.name ?? '',
    description: group?.description ?? '',
    accessLevel: group?.accessLevel ?? 'private',
    athleteIds: Array.isArray(group?.athleteIds) ? group.athleteIds : [],
  }
}

function normalizeGroupFilterValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function parseGroupAthleteCount(value) {
  if (value === null || value === undefined || value === '') return null
  const normalizedValue = Number(value)
  return Number.isFinite(normalizedValue) ? normalizedValue : null
}

const groupFilterRangeInputClassName = 'h-8 w-28 !border-0 bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] shadow-none placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:!border-0 focus-visible:ring-0'
const groupFilterRangeSeparatorClassName = 'text-xs text-[var(--admin-dashboard-card-muted)]'

function GroupRangeFilterValue({ values = [], onChange = () => {}, operator = 'between' }) {
  const [firstValue = '', secondValue = ''] = values
  const singleValuePlaceholder = operator === 'greater_than' ? 'Min' : operator === 'less_than' ? 'Max' : 'Value'

  if (operator === 'between') {
    return (
      <div className="flex items-center gap-2">
        <Input type="number" value={firstValue} onChange={(event) => onChange([event.target.value, secondValue])} placeholder="Min" className={groupFilterRangeInputClassName} />
        <span className={groupFilterRangeSeparatorClassName}>to</span>
        <Input type="number" value={secondValue} onChange={(event) => onChange([firstValue, event.target.value])} placeholder="Max" className={groupFilterRangeInputClassName} />
      </div>
    )
  }

  return <Input type="number" value={firstValue} onChange={(event) => onChange([event.target.value])} placeholder={singleValuePlaceholder} className={groupFilterRangeInputClassName} />
}

const groupFilterFields = [
  {
    key: 'status',
    label: 'Status',
    field: 'status',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  {
    key: 'access',
    label: 'Access',
    field: 'access',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'private', label: 'Private' },
      { value: 'public', label: 'Public' },
    ],
  },
  {
    key: 'athleteCount',
    label: 'Athlete count',
    field: 'athleteCount',
    type: 'custom',
    defaultOperator: 'between',
    operators: [
      { value: 'between', label: 'between' },
      { value: 'greater_than', label: 'greater than' },
      { value: 'less_than', label: 'less than' },
      { value: 'empty', label: 'is empty' },
      { value: 'not_empty', label: 'is not empty' },
    ],
    customRenderer: ({ values, onChange, operator }) => <GroupRangeFilterValue values={values} onChange={onChange} operator={operator} />,
  },
]

function groupMatchesFilter(group, filter) {
  if (!filter?.field) return true
  const values = Array.isArray(filter.values) ? filter.values : []
  const primaryValue = values[0]
  const secondaryValue = values[1]

  switch (filter.field) {
    case 'status': {
      const groupStatus = normalizeGroupFilterValue(group.statusValue || group.status)
      if (filter.operator === 'empty') return !group.statusValue && !group.status
      if (filter.operator === 'not_empty') return Boolean(group.statusValue || group.status)
      const selectedStatus = normalizeGroupFilterValue(primaryValue)
      if (!selectedStatus) return true
      if (filter.operator === 'is_not') return groupStatus !== selectedStatus
      return groupStatus === selectedStatus
    }
    case 'access': {
      const groupAccess = normalizeGroupFilterValue(group.accessLevel || group.access)
      if (filter.operator === 'empty') return !group.accessLevel && !group.access
      if (filter.operator === 'not_empty') return Boolean(group.accessLevel || group.access)
      const selectedAccess = normalizeGroupFilterValue(primaryValue)
      if (!selectedAccess) return true
      if (filter.operator === 'is_not') return groupAccess !== selectedAccess
      return groupAccess === selectedAccess
    }
    case 'athleteCount': {
      const groupAthleteCount = parseGroupAthleteCount(group.athleteCount)
      const minCount = parseGroupAthleteCount(primaryValue)
      const maxCount = parseGroupAthleteCount(secondaryValue)
      if (filter.operator === 'empty') return group.athleteCount === null || group.athleteCount === undefined
      if (filter.operator === 'not_empty') return group.athleteCount !== null && group.athleteCount !== undefined
      if (groupAthleteCount === null) return false
      if (filter.operator === 'greater_than') return minCount === null ? true : groupAthleteCount > minCount
      if (filter.operator === 'less_than') return minCount === null ? true : groupAthleteCount < minCount
      if (minCount !== null && maxCount !== null) return groupAthleteCount >= minCount && groupAthleteCount <= maxCount
      if (minCount !== null) return groupAthleteCount >= minCount
      if (maxCount !== null) return groupAthleteCount <= maxCount
      return true
    }
    default:
      return true
  }
}

function groupMatchesFilters(group, filters) {
  return filters.every((filter) => groupMatchesFilter(group, filter))
}

export default function GroupsDataTable({ searchQuery = '' }) {
  const { toastManager } = useToast()
  const [groups, setGroups] = useState([])
  const [athleteOptions, setAthleteOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateEditGroupDialogOpen, setIsCreateEditGroupDialogOpen] = useState(false)
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false)
  const [isAddAthletesSheetOpen, setIsAddAthletesSheetOpen] = useState(false)
  const [isRestoreGroupsSheetOpen, setIsRestoreGroupsSheetOpen] = useState(false)
  const [isRestoringGroups, setIsRestoringGroups] = useState(false)
  const [isArchiveGroupsDialogOpen, setIsArchiveGroupsDialogOpen] = useState(false)
  const [isArchivingGroups, setIsArchivingGroups] = useState(false)
  const [isExportGroupsSheetOpen, setIsExportGroupsSheetOpen] = useState(false)
  const [isExportingGroups, setIsExportingGroups] = useState(false)
  const [isAssignProgramSheetOpen, setIsAssignProgramSheetOpen] = useState(false)
  const [selectedAssignProgramId, setSelectedAssignProgramId] = useState('')
  const [programOptions, setProgramOptions] = useState([])
  const [isAssigningProgram, setIsAssigningProgram] = useState(false)
  const [selectedBulkAthleteIds, setSelectedBulkAthleteIds] = useState([])
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('')
  const [isAddingAthletesToGroups, setIsAddingAthletesToGroups] = useState(false)
  const [isBulkActionsMenuOpen, setIsBulkActionsMenuOpen] = useState(false)
  const [groupDialogMode, setGroupDialogMode] = useState('create')
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [groupFormValues, setGroupFormValues] = useState(() => createGroupFormValues())
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [groupFilters, setGroupFilters] = useQueryState(
    'groupFilters',
    parseAsJson((value) => (Array.isArray(value) ? value : [])).withDefault([]),
  )
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  useEffect(() => {
    let cancelled = false
    async function loadGroups() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/admin/groups', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || 'Failed to load groups.')
        if (!cancelled) {
          setGroups(Array.isArray(payload?.groups) ? payload.groups : [])
          setAthleteOptions(Array.isArray(payload?.athleteOptions) ? payload.athleteOptions : [])
          setProgramOptions(Array.isArray(payload?.programOptions) ? payload.programOptions : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setGroups([])
          setAthleteOptions([])
          setProgramOptions([])
          setError(loadError?.message || 'Failed to load groups.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadGroups()
    return () => { cancelled = true }
  }, [refreshKey])

  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId) ?? null, [groups, selectedGroupId])

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="admin-shell-athletes-checkbox-cell">
          <Checkbox className="admin-shell-athletes-checkbox-input" checked={table.getIsAllPageRowsSelected()} onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)} aria-label="Select all" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="admin-shell-athletes-checkbox-cell">
          <Checkbox className="admin-shell-athletes-checkbox-input" checked={row.getIsSelected()} onChange={(event) => row.toggleSelected(event.target.checked)} aria-label="Select row" />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Group',
      meta: { label: 'Group' },
      cell: ({ row }) => <GroupCell name={row.original.name} athletes={row.original.athletes} description={row.original.description} />,
    },
    {
      accessorKey: 'athleteCountLabel',
      header: 'Athletes',
      meta: { label: 'Athletes' },
      cell: ({ row }) => <span className="admin-shell-athletes-program-cell">{row.original.athleteCountLabel}</span>,
    },
    {
      accessorKey: 'access',
      header: 'Access',
      meta: { label: 'Access' },
      cell: ({ row }) => <AccessCell access={row.original.access} />,
    },
    {
      accessorKey: 'updated',
      header: 'Updated',
      meta: { label: 'Updated' },
      cell: ({ row }) => <span className="admin-shell-athletes-last-active-cell">{row.original.updated}</span>,
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
      cell: ({ row }) => (
        <RowActionsCell
          isOpen={openRowActionMenuId === row.original.id}
          onOpenChange={(isOpen) => setOpenRowActionMenuId(isOpen ? row.original.id : null)}
          onEditAction={() => setPendingRowAction({ type: 'edit', groupId: row.original.id })}
          onDeleteAction={() => setPendingRowAction({ type: 'delete', groupId: row.original.id })}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ], [openRowActionMenuId])

  const filteredGroups = useMemo(() => {
    const normalizedFilters = Array.isArray(groupFilters) ? groupFilters : []
    return groups.filter((group) => groupMatchesFilters(group, normalizedFilters))
  }, [groupFilters, groups])

  const table = useReactTable({
    data: filteredGroups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: { rowSelection, columnFilters, columnVisibility, pagination },
  })

  const selectedGroupCount = table.getSelectedRowModel().rows.length
  const selectedBulkGroups = table.getSelectedRowModel().rows.map((row) => row.original)
  const selectedBulkGroupIds = selectedBulkGroups.map((group) => group.id).filter(Boolean)
  const selectedAssignProgram = programOptions.find((program) => program.id === selectedAssignProgramId) ?? null
  const assignProgramDisabled = selectedGroupCount === 0 || !selectedAssignProgramId || isAssigningProgram
  const exportGroupsFileName = getGroupsExportFileName()
  const exportGroupsDisabled = selectedGroupCount === 0 || isExportingGroups
  const restoreEligibleGroups = selectedBulkGroups.filter((group) => normalizeGroupFilterValue(group.statusValue || group.status) === 'archived')
  const restoreSkippedGroups = selectedBulkGroups.filter((group) => normalizeGroupFilterValue(group.statusValue || group.status) !== 'archived')
  const archiveEligibleGroups = selectedBulkGroups.filter((group) => normalizeGroupFilterValue(group.statusValue || group.status) !== 'archived')
  const archiveSkippedGroups = selectedBulkGroups.filter((group) => normalizeGroupFilterValue(group.statusValue || group.status) === 'archived')
  const normalizedAthleteSearchQuery = athleteSearchQuery.trim().toLowerCase()
  const filteredBulkAthleteOptions = athleteOptions.filter((athlete) => {
    if (!normalizedAthleteSearchQuery) return true
    return String(athlete.name || '').toLowerCase().includes(normalizedAthleteSearchQuery)
  })

  function handleBulkActionsMenuOpenChange(open) {
    if (open && selectedGroupCount === 0) {
      setIsBulkActionsMenuOpen(false)
      return
    }

    setIsBulkActionsMenuOpen(open)
  }

  function handleOpenRestoreGroupsSheet() {
    if (selectedGroupCount === 0 || isRestoringGroups) return

    setIsBulkActionsMenuOpen(false)
    setIsRestoreGroupsSheetOpen(true)
  }

  async function handleConfirmRestoreGroups() {
    if (restoreEligibleGroups.length === 0 || isRestoringGroups) return

    setIsRestoringGroups(true)
    setError('')
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          groupIds: restoreEligibleGroups.map((group) => group.id),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Failed to restore groups.')
      return payload?.result ?? {}
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Restoring groups...', data: { close: true } },
        success: (result) => ({
          title: 'Groups restored',
          description: `${result?.restoredCount ?? restoreEligibleGroups.length} group${(result?.restoredCount ?? restoreEligibleGroups.length) === 1 ? '' : 's'} restored.${result?.skippedCount ? ` ${result.skippedCount} skipped.` : ''}`,
          data: { close: true },
        }),
        error: (restoreError) => ({
          title: 'Failed to restore groups',
          description: restoreError?.message || 'We could not restore these groups right now.',
          data: { close: true },
        }),
      })

      setIsRestoreGroupsSheetOpen(false)
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsRestoringGroups(false)
    }
  }

  function handleOpenArchiveGroupsDialog() {
    if (selectedGroupCount === 0 || isArchivingGroups) return

    setIsBulkActionsMenuOpen(false)
    setIsArchiveGroupsDialogOpen(true)
  }

  async function handleConfirmArchiveGroups() {
    if (archiveEligibleGroups.length === 0 || isArchivingGroups) return

    setIsArchivingGroups(true)
    setError('')
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          groupIds: archiveEligibleGroups.map((group) => group.id),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Failed to archive groups.')
      return payload?.result ?? {}
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Archiving groups...', data: { close: true } },
        success: (result) => ({
          title: 'Groups archived',
          description: `${result?.archivedCount ?? archiveEligibleGroups.length} group${(result?.archivedCount ?? archiveEligibleGroups.length) === 1 ? '' : 's'} archived.${result?.skippedCount ? ` ${result.skippedCount} skipped.` : ''}`,
          data: { close: true },
        }),
        error: (archiveError) => ({
          title: 'Failed to archive groups',
          description: archiveError?.message || 'We could not archive these groups right now.',
          data: { close: true },
        }),
      })

      setIsArchiveGroupsDialogOpen(false)
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsArchivingGroups(false)
    }
  }

  function handleOpenExportGroupsSheet() {
    if (exportGroupsDisabled) return

    setIsBulkActionsMenuOpen(false)
    setIsExportGroupsSheetOpen(true)
  }

  function handleAssignProgramSheetOpenChange(open) {
    setIsAssignProgramSheetOpen(open)

    if (!open) {
      setIsBulkActionsMenuOpen(false)
      setSelectedAssignProgramId('')
    }
  }

  function handleOpenAssignProgramSheet() {
    if (selectedGroupCount === 0 || isAssigningProgram) return

    setIsBulkActionsMenuOpen(false)
    setSelectedAssignProgramId('')
    setIsAssignProgramSheetOpen(true)
  }

  async function handleAssignProgramToGroupsSubmit() {
    if (assignProgramDisabled) return

    setIsAssigningProgram(true)
    setError('')
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign-program',
          groupIds: selectedBulkGroupIds,
          sourceProgramId: selectedAssignProgramId,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Failed to assign program to groups.')
      return payload?.result ?? {}
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Assigning program...', data: { close: true } },
        success: (result) => ({
          title: 'Program assigned',
          description: `${selectedAssignProgram?.name || 'Program'} assigned to ${result?.groupsUpdated ?? selectedBulkGroupIds.length} group${(result?.groupsUpdated ?? selectedBulkGroupIds.length) === 1 ? '' : 's'} and ${result?.athletesUpdated ?? result?.createdProgramsCount ?? 0} athlete${(result?.athletesUpdated ?? result?.createdProgramsCount ?? 0) === 1 ? '' : 's'}.`,
          data: { close: true },
        }),
        error: (assignError) => ({
          title: 'Failed to assign program',
          description: assignError?.message || 'We could not assign this program to these groups right now.',
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

  function handleConfirmExportGroups() {
    if (exportGroupsDisabled) return

    setIsExportingGroups(true)

    try {
      const csv = buildGroupsExportCsv(selectedBulkGroups)
      downloadGroupsExportFile({
        content: csv,
        fileName: exportGroupsFileName,
        mimeType: 'text/csv;charset=utf-8',
      })
      toastManager.show({
        title: 'Groups export ready',
        description: `${selectedGroupCount} group${selectedGroupCount === 1 ? '' : 's'} exported.`,
        variant: 'success',
        data: { close: true },
      })
      setIsExportGroupsSheetOpen(false)
      setRowSelection({})
    } catch (exportError) {
      toastManager.show({
        title: 'Failed to export groups',
        description: exportError?.message || 'We could not generate this groups export right now.',
        variant: 'error',
        data: { close: true },
      })
    } finally {
      setIsExportingGroups(false)
    }
  }

  useEffect(() => {
    if (selectedGroupCount === 0) {
      setIsBulkActionsMenuOpen(false)
    }
  }, [selectedGroupCount])

  useEffect(() => {
    table.getColumn('name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  useEffect(() => {
    if (openRowActionMenuId || !pendingRowAction) return
    if (pendingRowAction.type === 'edit') {
      openEditGroupDialog(pendingRowAction.groupId)
    } else if (pendingRowAction.type === 'delete') {
      setSelectedGroupId(pendingRowAction.groupId)
      setIsDeleteGroupDialogOpen(true)
    }
    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

  function openCreateGroupDialog() {
    setGroupDialogMode('create')
    setSelectedGroupId(null)
    setGroupFormValues(createGroupFormValues())
    setIsCreateEditGroupDialogOpen(true)
  }

  function openEditGroupDialog(groupId) {
    const group = groups.find((item) => item.id === groupId) ?? null
    setGroupDialogMode('edit')
    setSelectedGroupId(groupId)
    setGroupFormValues(createGroupFormValues(group))
    setIsCreateEditGroupDialogOpen(true)
  }

  function updateGroupFormValue(key, value) {
    setGroupFormValues((currentValues) => ({ ...currentValues, [key]: value }))
  }

  function toggleAthleteMembership(athleteId) {
    setGroupFormValues((currentValues) => {
      const hasAthlete = currentValues.athleteIds.includes(athleteId)
      return {
        ...currentValues,
        athleteIds: hasAthlete ? currentValues.athleteIds.filter((currentId) => currentId !== athleteId) : [...currentValues.athleteIds, athleteId],
      }
    })
  }

  async function handleGroupSubmit() {
    setIsSavingGroup(true)
    setError('')
    try {
      const response = await fetch('/api/admin/groups', {
        method: groupDialogMode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupDialogMode === 'edit' ? { action: 'update', groupId: selectedGroupId, ...groupFormValues } : groupFormValues),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to save group.')
      setIsCreateEditGroupDialogOpen(false)
      setSelectedGroupId(null)
      setGroupDialogMode('create')
      setGroupFormValues(createGroupFormValues())
      setRefreshKey((currentValue) => currentValue + 1)
    } catch (submitError) {
      setError(submitError?.message || 'Failed to save group.')
    } finally {
      setIsSavingGroup(false)
    }
  }

  async function handleDeleteGroup() {
    if (!selectedGroupId) return
    setIsDeletingGroup(true)
    setError('')
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', groupId: selectedGroupId }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to delete group.')
      setIsDeleteGroupDialogOpen(false)
      setSelectedGroupId(null)
      setRefreshKey((currentValue) => currentValue + 1)
    } catch (deleteError) {
      setError(deleteError?.message || 'Failed to delete group.')
    } finally {
      setIsDeletingGroup(false)
    }
  }

  function handleAddAthletesSheetOpenChange(open) {
    setIsAddAthletesSheetOpen(open)

    if (!open) {
      setIsBulkActionsMenuOpen(false)
      setSelectedBulkAthleteIds([])
      setAthleteSearchQuery('')
    }
  }

  function toggleSelectedBulkAthleteId(athleteId) {
    setSelectedBulkAthleteIds((currentIds) => (
      currentIds.includes(athleteId)
        ? currentIds.filter((currentId) => currentId !== athleteId)
        : [...currentIds, athleteId]
    ))
  }

  async function handleAddAthletesToGroupsSubmit() {
    if (selectedBulkAthleteIds.length === 0 || selectedBulkGroupIds.length === 0 || isAddingAthletesToGroups) return

    setIsAddingAthletesToGroups(true)
    setError('')
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-athletes',
          groupIds: selectedBulkGroupIds,
          athleteIds: selectedBulkAthleteIds,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Failed to add athletes to groups.')
      return payload?.result ?? {}
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Adding athletes to groups...', data: { close: true } },
        success: (result) => ({
          title: 'Athletes added to groups',
          description: `${result?.athletesAdded ?? selectedBulkAthleteIds.length} athlete${selectedBulkAthleteIds.length === 1 ? '' : 's'} added to ${result?.groupsUpdated ?? selectedBulkGroupIds.length} group${selectedBulkGroupIds.length === 1 ? '' : 's'}.`,
          data: { close: true },
        }),
        error: (submitError) => ({
          title: 'Failed to add athletes to groups',
          description: submitError?.message || 'We could not add these athletes to groups right now.',
          data: { close: true },
        }),
      })

      setIsAddAthletesSheetOpen(false)
      setIsBulkActionsMenuOpen(false)
      setSelectedBulkAthleteIds([])
      setAthleteSearchQuery('')
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsAddingAthletesToGroups(false)
    }
  }

  const emptyStateMessage = error || (groupFilters.length > 0 ? 'No groups match the current filters.' : 'No groups found.')
  const pageSizeOptions = [5, 10, 20, 30]
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)
  const pageNumbers = Array.from({ length: table.getPageCount() }, (_, index) => index)
  const skeletonRows = Array.from({ length: pagination.pageSize }, (_, rowIndex) => rowIndex)

  return (
    <div className="admin-shell-athletes-table-example">
      <div className="flex flex-col gap-3">
        <div className="flex w-full flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2">
            <Filters
              filters={groupFilters}
              fields={groupFilterFields}
              onChange={setGroupFilters}
              trigger={
                <Button type="button" variant="outline" className="admin-shell-athletes-filter-trigger rounded-[12px] min-h-[40px] shadow-none">
                  <Plus className="size-4" />
                  Add filter
                </Button>
              }
            />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3">
            <DropdownMenu open={isBulkActionsMenuOpen} onOpenChange={handleBulkActionsMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <button type="button" className="admin-shell-athletes-example-columns-button" disabled={selectedGroupCount === 0} aria-label="Group bulk actions">
                  {selectedGroupCount > 0 ? `Bulk actions (${selectedGroupCount})` : 'Bulk actions'}
                  <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[190px]">
                <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" onSelect={(event) => {
                  event.preventDefault()
                  setIsBulkActionsMenuOpen(false)
                  setSelectedBulkAthleteIds([])
                  setAthleteSearchQuery('')
                  setIsAddAthletesSheetOpen(true)
                }}>
                  <UserPlus className="size-4" aria-hidden="true" />
                  Add athletes
                </DropdownMenuItem>
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" onSelect={(event) => {
                  event.preventDefault()
                  handleOpenRestoreGroupsSheet()
                }}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="admin-shell-athletes-bulk-menu-item"
                  disabled={exportGroupsDisabled}
                  aria-label="Open groups export workflow"
                  onSelect={(event) => {
                    event.preventDefault()
                    handleOpenExportGroupsSheet()
                  }}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" onSelect={(event) => {
                  event.preventDefault()
                  handleOpenAssignProgramSheet()
                }}>
                  <BookOpen className="size-4" aria-hidden="true" />
                  Assign program
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item admin-shell-athletes-bulk-menu-item-danger" onSelect={(event) => {
                  event.preventDefault()
                  handleOpenArchiveGroupsDialog()
                }}>
                  <Archive className="size-4" aria-hidden="true" />
                  Archive
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
                {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                  <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                    {column.columnDef.meta?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" onClick={openCreateGroupDialog} className="admin-shell-athletes-invite-button self-start rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] md:self-auto">Create group</Button>
          </div>
        </div>
      </div>

      <Sheet open={isAddAthletesSheetOpen} onOpenChange={handleAddAthletesSheetOpenChange}>
        <SheetContent side="right" className="admin-shell-groups-add-athletes-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle className="text-[var(--admin-dashboard-card-text)]">Add athletes</SheetTitle>
            <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
              Choose athletes to add to {selectedGroupCount} selected groups.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <section className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Selected groups</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">{selectedGroupCount} groups selected</p>
                </div>
                <div className="mt-4 grid gap-2">
                  {selectedBulkGroups.slice(0, 3).map((group) => (
                    <div key={group.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2">
                      <span className="truncate text-sm font-medium text-[var(--admin-dashboard-card-text)]">{group.name}</span>
                      <span className="shrink-0 text-xs text-[var(--admin-dashboard-card-muted)]">{group.athleteCountLabel ?? `${group.athleteCount ?? group.athletes?.length ?? 0} athletes`}</span>
                    </div>
                  ))}
                  {selectedGroupCount > 3 ? (
                    <p className="text-xs font-medium text-[var(--admin-shell-primary-button-bg)]">+ {selectedGroupCount - 3} more</p>
                  ) : null}
                </div>
              </section>

              <section className="grid gap-3">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Athletes list</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Select one or more athletes to add to these groups.</p>
                </div>
                <Input
                  className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                  placeholder="Search athletes..."
                  value={athleteSearchQuery}
                  onChange={(event) => setAthleteSearchQuery(event.target.value)}
                />
                <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {filteredBulkAthleteOptions.length > 0 ? (
                    filteredBulkAthleteOptions.map((athlete) => {
                      const isAthleteSelected = selectedBulkAthleteIds.includes(athlete.id)
                      return (
                        <button
                          type="button"
                          key={athlete.id}
                          className={`flex items-center gap-3 rounded-[14px] border px-3 py-3 text-left transition-colors ${isAthleteSelected ? 'border-[var(--admin-shell-primary-button-bg)] bg-[#3BE0AF]/10 hover:bg-[#3BE0AF]/10' : 'border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] hover:bg-[#3BE0AF]/10'}`}
                          onClick={() => toggleSelectedBulkAthleteId(athlete.id)}
                        >
                          <Checkbox
                            className="admin-shell-athletes-checkbox-input"
                            checked={isAthleteSelected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleSelectedBulkAthleteId(athlete.id)}
                            aria-label={`Select ${athlete.name}`}
                          />
                          <Avatar className="size-9 border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[11px] text-[var(--admin-dashboard-card-text)]">
                            <AvatarImage src={athlete.avatarUrl} alt={athlete.name} />
                            <AvatarFallback>{getAthleteInitials(athlete.name)}</AvatarFallback>
                          </Avatar>
                          <span className="grid min-w-0 gap-0.5">
                            <span className="truncate text-sm font-medium text-[var(--admin-dashboard-card-text)]">{athlete.name}</span>
                            <span className="text-xs text-[var(--admin-dashboard-card-muted)]">{isAthleteSelected ? 'Will be added' : 'Available to add'}</span>
                          </span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-3 py-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                      No athletes found.
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-[var(--admin-dashboard-card-muted)]">{selectedBulkAthleteIds.length} athletes selected</p>
              </section>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              onClick={() => setIsAddAthletesSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={isAddingAthletesToGroups || selectedBulkAthleteIds.length === 0 || selectedGroupCount === 0}
              onClick={handleAddAthletesToGroupsSubmit}
            >
              {isAddingAthletesToGroups ? 'Adding...' : 'Add athletes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isArchiveGroupsDialogOpen} onOpenChange={setIsArchiveGroupsDialogOpen}>
        <DialogContent className="admin-shell-groups-archive-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Archive groups</DialogTitle>
            <DialogDescription>Review the selected groups before moving them out of active workflows.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-3 rounded-[18px] border border-red-500/25 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                  <Archive className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">
                    {archiveEligibleGroups.length} group{archiveEligibleGroups.length === 1 ? '' : 's'} will be archived
                  </p>
                  <p className="mt-1 text-sm text-[var(--admin-dashboard-card-muted)]">
                    Archived groups are hidden from active group workflows but can be restored later.
                  </p>
                  {archiveSkippedGroups.length > 0 ? (
                    <p className="mt-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                      {archiveSkippedGroups.length} selected group{archiveSkippedGroups.length === 1 ? '' : 's'} already archived
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {archiveEligibleGroups.length > 0 ? (
              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Ready to archive</div>
                <div className="grid max-h-[220px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {archiveEligibleGroups.map((group) => (
                    <div key={`archive-${group.id}`} className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{group.name}</p>
                        <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">{group.athleteCountLabel ?? `${group.athleteCount ?? group.athletes?.length ?? 0} athletes`}</p>
                      </div>
                      <StatusCell status={group.status} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                No selected groups can be archived. Only active groups can be archived.
              </div>
            )}

            {archiveSkippedGroups.length > 0 ? (
              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Already archived</div>
                <div className="grid max-h-[160px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {archiveSkippedGroups.map((group) => (
                    <div key={`archive-skip-${group.id}`} className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{group.name}</p>
                        <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">Already archived</p>
                      </div>
                      <StatusCell status={group.status} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px]"
              onClick={() => setIsArchiveGroupsDialogOpen(false)}
              disabled={isArchivingGroups}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
              disabled={archiveEligibleGroups.length === 0 || isArchivingGroups}
              onClick={handleConfirmArchiveGroups}
            >
              {isArchivingGroups ? 'Archiving...' : `Archive ${archiveEligibleGroups.length} group${archiveEligibleGroups.length === 1 ? '' : 's'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={isRestoreGroupsSheetOpen} onOpenChange={setIsRestoreGroupsSheetOpen}>
        <SheetContent side="right" className="admin-shell-groups-restore-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle>Restore groups</SheetTitle>
            <SheetDescription>Review the selected groups before restoring them to active status.</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <div className="grid gap-3 rounded-[20px] border border-[var(--admin-shell-primary-button-bg)]/30 bg-[#3BE0AF]/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3BE0AF]/15 text-[var(--admin-shell-primary-button-bg)]">
                    <RotateCcw className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">
                      {restoreEligibleGroups.length} group{restoreEligibleGroups.length === 1 ? '' : 's'} will be restored
                    </p>
                    <p className="mt-1 text-sm text-[var(--admin-dashboard-card-muted)]">
                      Restored groups return to active status and become available in admin workflows again.
                    </p>
                    {restoreSkippedGroups.length > 0 ? (
                      <p className="mt-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                        {restoreSkippedGroups.length} selected group{restoreSkippedGroups.length === 1 ? '' : 's'} already active
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {restoreEligibleGroups.length > 0 ? (
                <div className="grid gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Ready to restore</div>
                  <div className="grid gap-2">
                    {restoreEligibleGroups.map((group) => (
                      <div key={`restore-${group.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{group.name}</p>
                          <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">{group.athleteCountLabel ?? `${group.athleteCount ?? group.athletes?.length ?? 0} athletes`}</p>
                        </div>
                        <StatusCell status={group.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                  No selected groups can be restored. Only archived groups can be restored.
                </div>
              )}

              {restoreSkippedGroups.length > 0 ? (
                <div className="grid gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Already active</div>
                  <div className="grid gap-2">
                    {restoreSkippedGroups.map((group) => (
                      <div key={`restore-skip-${group.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{group.name}</p>
                          <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">Already active</p>
                        </div>
                        <StatusCell status={group.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              onClick={() => setIsRestoreGroupsSheetOpen(false)}
              disabled={isRestoringGroups}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={restoreEligibleGroups.length === 0 || isRestoringGroups}
              onClick={handleConfirmRestoreGroups}
            >
              {isRestoringGroups ? 'Restoring...' : `Restore ${restoreEligibleGroups.length} group${restoreEligibleGroups.length === 1 ? '' : 's'}`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isExportGroupsSheetOpen} onOpenChange={setIsExportGroupsSheetOpen}>
        <SheetContent side="right" className="admin-shell-groups-export-sheet border-l border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle>Export groups</SheetTitle>
            <SheetDescription>
              Review the selected groups before downloading a CSV export.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <div className="grid gap-3 rounded-[20px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Selected groups</p>
                  <p className="text-2xl font-semibold text-[var(--admin-dashboard-card-text)]">{selectedGroupCount}</p>
                </div>
                <div className="grid gap-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Format</span>
                    <span className="font-medium text-[var(--admin-dashboard-card-text)]">CSV</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Filename</span>
                    <span className="truncate font-medium text-[var(--admin-dashboard-card-text)]">{exportGroupsFileName}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Included columns</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {groupExportColumns.map((column) => (
                    <div key={column} className="rounded-[14px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2 text-sm font-medium text-[var(--admin-dashboard-card-text)]">
                      {column}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Selected group preview</div>
                <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {selectedBulkGroups.map((group) => (
                    <div key={`export-${group.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{group.name}</p>
                        <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">{group.athleteCountLabel ?? `${group.athleteCount ?? group.athletes?.length ?? 0} athletes`}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-sm text-[var(--admin-dashboard-card-muted)] sm:inline">{group.updated}</span>
                        <StatusCell status={group.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
              onClick={() => setIsExportGroupsSheetOpen(false)}
              disabled={isExportingGroups}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={exportGroupsDisabled}
              onClick={handleConfirmExportGroups}
            >
              {isExportingGroups ? 'Preparing CSV...' : 'Download CSV'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isAssignProgramSheetOpen} onOpenChange={handleAssignProgramSheetOpenChange}>
        <SheetContent side="right" className="admin-shell-groups-assign-program-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle className="text-[var(--admin-dashboard-card-text)]">Assign program</SheetTitle>
            <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
              Choose a program to assign to {selectedGroupCount} selected groups.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <section className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Selected groups</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">{selectedGroupCount} groups selected</p>
                </div>
                <div className="mt-4 grid gap-2">
                  {selectedBulkGroups.slice(0, 3).map((group) => (
                    <div key={`assign-${group.id}`} className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2">
                      <span className="truncate text-sm font-medium text-[var(--admin-dashboard-card-text)]">{group.name}</span>
                      <span className="shrink-0 text-xs text-[var(--admin-dashboard-card-muted)]">{group.athleteCountLabel ?? `${group.athleteCount ?? group.athletes?.length ?? 0} athletes`}</span>
                    </div>
                  ))}
                  {selectedGroupCount > 3 ? (
                    <p className="text-xs font-medium text-[var(--admin-shell-primary-button-bg)]">+ {selectedGroupCount - 3} more</p>
                  ) : null}
                </div>
              </section>

              <section className="grid gap-3">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Program</h3>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">This clones the selected program into every athlete in the selected groups.</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="admin-shell-athletes-example-columns-button admin-shell-athletes-create-select-trigger w-full" aria-label="Program">
                      <span className="truncate">{selectedAssignProgram?.name ?? 'Select a program'}</span>
                      <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
                    {programOptions.length > 0 ? (
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
              disabled={isAssigningProgram}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={assignProgramDisabled}
              onClick={handleAssignProgramToGroupsSubmit}
            >
              {isAssigningProgram ? 'Assigning...' : 'Assign program'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isCreateEditGroupDialogOpen} onOpenChange={setIsCreateEditGroupDialogOpen}>
        <SheetContent side="right" className="admin-shell-groups-create-sheet border-l border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle>{groupDialogMode === 'edit' ? 'Edit group' : 'Create a group'}</SheetTitle>
            <SheetDescription>{groupDialogMode === 'edit' ? 'Update the information below.' : 'Fill out the information below.'}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <GroupDialogField htmlFor="create-group-name" label="Name">
                  <Input id="create-group-name" className="h-11 rounded-[12px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20" placeholder="Off-season forwards" value={groupFormValues.name} onChange={(event) => updateGroupFormValue('name', event.target.value)} />
                </GroupDialogField>
                <GroupDialogField htmlFor="create-group-access-level" label="Access">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button id="create-group-access-level" type="button" className="admin-shell-athletes-example-columns-button admin-shell-athletes-create-select-trigger w-full">
                        <span>{groupFormValues.accessLevel === 'public' ? 'Public' : 'Private'}</span>
                        <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      <DropdownMenuItem onSelect={() => updateGroupFormValue('accessLevel', 'private')}>Private</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => updateGroupFormValue('accessLevel', 'public')}>Public</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </GroupDialogField>
              </div>
              <GroupDialogField htmlFor="create-group-description" label="Description">
                <Textarea id="create-group-description" className="min-h-[120px] rounded-[12px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20" placeholder="Optional notes about who belongs in this group." value={groupFormValues.description} onChange={(event) => updateGroupFormValue('description', event.target.value)} />
              </GroupDialogField>
              <div className="grid gap-3">
                <div>
                  <h3 className="text-sm font-medium text-[var(--admin-dashboard-card-text)]">Athletes list</h3>
                  <p className="mt-1 text-sm text-[var(--admin-dashboard-card-muted)]">Add or remove athletes from this group.</p>
                  <p className="mt-1 text-xs text-[var(--admin-dashboard-card-muted)]">{groupFormValues.athleteIds.length === 1 ? '1 athlete added' : `${groupFormValues.athleteIds.length} athletes added`}</p>
                </div>
                <div className="max-h-[280px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {athleteOptions.length ? (
                    <ItemGroup className="gap-0">
                      {athleteOptions.map((athlete, index) => {
                        const isSelectedAthlete = groupFormValues.athleteIds.includes(athlete.id)

                        return (
                          <div key={athlete.id}>
                            <Item className="rounded-none px-0 py-3 text-[var(--admin-dashboard-card-text)] shadow-none transition-colors hover:bg-transparent">
                              <ItemMedia>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-shell-avatar-bg)] text-sm font-semibold text-[var(--admin-dashboard-card-text)]">
                                  {getAthleteInitials(athlete.name)}
                                </div>
                              </ItemMedia>
                              <ItemContent className="gap-1">
                                <ItemTitle className="text-[var(--admin-dashboard-card-text)]">{athlete.name}</ItemTitle>
                                <ItemDescription className="text-[var(--admin-dashboard-card-muted)]">{isSelectedAthlete ? 'Added to group' : 'Available to add'}</ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleAthleteMembership(athlete.id)}
                                  className="h-9 w-9 rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
                                >
                                  {isSelectedAthlete ? <Trash2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                  <span className="sr-only">{isSelectedAthlete ? 'Remove athlete from group' : 'Add athlete to group'}</span>
                                </Button>
                              </ItemActions>
                            </Item>
                            {index != athleteOptions.length - 1 ? <ItemSeparator className="bg-[var(--admin-dashboard-card-border)]" /> : null}
                          </div>
                        )
                      })}
                    </ItemGroup>
                  ) : (
                    <div className="rounded-[12px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-4 text-sm text-[var(--admin-dashboard-card-muted)]">No athletes available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="shrink-0 border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]" onClick={() => setIsCreateEditGroupDialogOpen(false)}>Cancel</Button>
            <Button type="button" disabled={isSavingGroup} className="admin-shell-groups-create-submit rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]" onClick={handleGroupSubmit}>{isSavingGroup ? 'Saving...' : groupDialogMode === 'edit' ? 'Save changes' : 'Create group'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Delete group</DialogTitle>
            <DialogDescription>This group will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-row sm:justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px]" onClick={() => setIsDeleteGroupDialogOpen(false)} disabled={isDeletingGroup}>Cancel</Button>
            <Button type="button" disabled={isDeletingGroup} className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500" onClick={handleDeleteGroup}>{isDeletingGroup ? 'Deleting...' : 'Delete group'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="admin-shell-athletes-table-shell">
        <Table className="admin-shell-athletes-table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? skeletonRows.map((rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className={rowIndex % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}>
                <TableCell>
                  <Skeleton className="h-4 w-4 rounded-[4px]" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[110px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[72px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-[88px] rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[88px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-[96px] rounded-full" />
                </TableCell>
                <TableCell className="admin-shell-athletes-actions-cell">
                  <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                </TableCell>
              </TableRow>
            )) : table.getRowModel().rows?.length ? table.getRowModel().rows.map((row, index) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined} className={index % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} className="admin-shell-athletes-empty-state h-24 text-center">{emptyStateMessage}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="admin-shell-athletes-pagination-bar flex items-center justify-end gap-3 py-4 text-sm">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="admin-shell-athletes-page-size-select h-9 w-[76px] rounded-[10px] px-3 text-sm">
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
