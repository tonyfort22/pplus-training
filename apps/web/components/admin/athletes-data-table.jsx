'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, MoreHorizontal } from 'lucide-react'

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
      ? 'border-transparent bg-red-500/15 text-red-300 hover:bg-red-500/20 normal-case tracking-normal'
      : status === 'Active'
        ? 'border-transparent bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 normal-case tracking-normal'
        : 'border-transparent bg-amber-500/15 text-amber-300 hover:bg-amber-500/20 normal-case tracking-normal'

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
      <label className="text-sm font-medium text-[#DCE6F8]" htmlFor={htmlFor}>
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
    <label className="admin-shell-athletes-create-uploader relative flex cursor-pointer flex-col items-center justify-center gap-4 px-6 py-2 text-center transition-colors hover:text-[#EEF4FF]">
      {hasPreview ? (
        <div className="relative">
          <Avatar
            alt={athleteName || 'Athlete avatar'}
            className="h-36 w-36 rounded-full border border-[#24334A] bg-[#0F1728] text-lg font-semibold text-[#DCE6F8]"
            src={previewSrc}
          />
          <button
            type="button"
            aria-label="Remove uploaded avatar"
            className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[10px] font-medium text-[#EEF4FF] shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition-colors hover:bg-[#15233A]"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onClearPreview()
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-[#2B3D57] bg-[#0D1625] text-[#8EA0BC]">
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
      <div className="space-y-1">
        <p className="text-[17px] font-medium text-[#EEF4FF]">{hasPreview ? 'Avatar uploaded' : 'Upload avatar'}</p>
        <p className="text-sm text-[#8EA0BC]">PNG, JPG up to 2MB</p>
      </div>
      <input className="sr-only" type="file" accept="image/*" onChange={onFileChange} />
    </label>
  )
}

export default function AthletesDataTable({ searchQuery = '' }) {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isCreateEditAthleteDialogOpen, setIsCreateEditAthleteDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
  const [createAthleteMeasurementUnit, setCreateAthleteMeasurementUnit] = useState('imperial')
  const [createAthleteProfileImage, setCreateAthleteProfileImage] = useState('')
  const [createAthleteFirstName, setCreateAthleteFirstName] = useState('')
  const [createAthleteLastName, setCreateAthleteLastName] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
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
  }, [])

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
        cell: ({ row }) => (
          <RowActionsCell
            isOpen={openRowActionMenuId === row.original.id}
            onOpenChange={(isOpen) => {
              setOpenRowActionMenuId(isOpen ? row.original.id : null)
            }}
            onEditAction={() => setPendingRowAction({ type: 'edit', athleteId: row.original.id })}
            onDeleteAction={() => setPendingRowAction({ type: 'delete', athleteId: row.original.id })}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openRowActionMenuId],
  )

  const table = useReactTable({
    data: athletes,
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
    if (openRowActionMenuId || !pendingRowAction) return

    if (pendingRowAction.type === 'edit') {
      setIsCreateEditAthleteDialogOpen(true)
    } else if (pendingRowAction.type === 'delete') {
      setIsDeleteDialogOpen(true)
    }

    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

  function handleCreateAthletePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setCreateAthleteProfileImage('')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setCreateAthleteProfileImage((currentImage) => {
      if (currentImage) URL.revokeObjectURL(currentImage)
      return previewUrl
    })
  }

  function handleClearCreateAthletePhoto() {
    setCreateAthleteProfileImage((currentImage) => {
      if (currentImage) URL.revokeObjectURL(currentImage)
      return ''
    })
  }

  const createAthleteNamePreview = [createAthleteFirstName, createAthleteLastName].filter(Boolean).join(' ')
  const emptyStateMessage = loading ? 'Loading athletes...' : error || 'No results.'

  return (
    <div className="admin-shell-athletes-table-example">
      <div className="admin-shell-athletes-example-controls flex items-center justify-between gap-3">
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
          onClick={() => setIsCreateEditAthleteDialogOpen(true)}
          className="admin-shell-athletes-invite-button bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d] rounded-[12px] min-h-[40px]"
        >
          Create athlete
        </Button>
      </div>

      <Dialog open={isCreateEditAthleteDialogOpen} onOpenChange={setIsCreateEditAthleteDialogOpen} modal={false}>
        <DialogContent
          pageScrollable
          className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[720px]"
        >
          <div className="shrink-0 border-b border-[#24334A] px-6 py-5">
            <DialogHeader>
              <DialogTitle>Create athlete profile</DialogTitle>
              <DialogDescription>
                Add the athlete's personal details, profile photo, and preferred measurements.
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
                  className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                  placeholder="First name"
                  value={createAthleteFirstName}
                  onChange={(event) => setCreateAthleteFirstName(event.target.value)}
                />
              </CreateAthleteDialogField>
              <CreateAthleteDialogField htmlFor="create-athlete-last-name" label="Last name">
                <Input
                  id="create-athlete-last-name"
                  className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
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
                className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80"
              />
            </CreateAthleteDialogField>

            <div className="admin-shell-athletes-create-row admin-shell-athletes-create-row-two-up grid gap-4 md:grid-cols-2">
              <CreateAthleteDialogField htmlFor="create-athlete-gender" label="Gender">
                <Select defaultValue="male">
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
                <Select defaultValue="forward">
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
                      className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                      placeholder={`5' 11\"`}
                    />
                  </CreateAthleteDialogField>
                  <CreateAthleteDialogField htmlFor="create-athlete-weight-imperial" label="Weight">
                    <Input
                      id="create-athlete-weight-imperial"
                      className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                      placeholder="185 lb"
                    />
                  </CreateAthleteDialogField>
                </div>
              </TabsContent>
              <TabsContent value="metric" className="grid gap-4">
                <div className="admin-shell-athletes-create-row admin-shell-athletes-create-row-two-up grid gap-4 md:grid-cols-2">
                  <CreateAthleteDialogField htmlFor="create-athlete-height-metric" label="Height">
                    <Input
                      id="create-athlete-height-metric"
                      className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                      placeholder="180 cm"
                    />
                  </CreateAthleteDialogField>
                  <CreateAthleteDialogField htmlFor="create-athlete-weight-metric" label="Weight">
                    <Input
                      id="create-athlete-weight-metric"
                      className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                      placeholder="84 kg"
                    />
                  </CreateAthleteDialogField>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setIsCreateEditAthleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="admin-shell-athletes-create-submit rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[560px]">
          <div className="border-b border-[#24334A] px-6 py-5">
            <DialogHeader>
              <DialogTitle>Invite an athlete</DialogTitle>
              <DialogDescription>Bring a coach-managed athlete into the workspace.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="invite-athlete-email">
                Email address
              </label>
              <input
                id="invite-athlete-email"
                className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none placeholder:text-[#70809E] focus:border-[#3BE0AF]"
                placeholder="athlete@email.com"
                type="email"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[560px]">
          <div className="px-6 py-5">
            <DialogHeader>
              <DialogTitle>Delete athlete</DialogTitle>
              <DialogDescription>This athlete will be removed from the workspace.</DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
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
            {table.getRowModel().rows?.length ? (
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
                <TableCell colSpan={columns.length} className="py-10 text-center text-[#8EA0BC]">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="admin-shell-athletes-example-footer">
        <div className="admin-shell-athletes-example-selection-count">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="admin-shell-athletes-example-pagination-actions">
          <button
            type="button"
            className="admin-shell-athletes-example-pagination-button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            type="button"
            className="admin-shell-athletes-example-pagination-button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
