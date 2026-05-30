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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function NameCell({ name, email }) {
  return (
    <div className="admin-shell-athletes-name-cell">
      <Avatar alt={name} className="admin-shell-athletes-avatar" initials={getInitials(name)} />
      <div className="admin-shell-athletes-name-copy">
        <span className="admin-shell-athletes-name-text">{name}</span>
        <span className="admin-shell-athletes-name-meta">{email}</span>
      </div>
    </div>
  )
}

function StatusCell({ status }) {
  const tone = status === 'Accepted' ? 'success' : status === 'Pending' ? 'warning' : 'danger'
  const className =
    status === 'Accepted'
      ? 'border-transparent bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 normal-case tracking-normal'
      : status === 'Pending'
        ? 'border-transparent bg-amber-500/15 text-amber-300 hover:bg-amber-500/20 normal-case tracking-normal'
        : 'border-transparent bg-red-500/15 text-red-300 hover:bg-red-500/20 normal-case tracking-normal'

  return (
    <Badge tone={tone} className={className}>
      {status}
    </Badge>
  )
}

function RoleCell({ role }) {
  return (
    <Badge tone="neutral" className="border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] normal-case tracking-normal">
      {role}
    </Badge>
  )
}

function RowActionsCell({ onResendInvite = () => {}, onCancelInvite = () => {} }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="admin-shell-athletes-row-menu" aria-label="Open menu">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="admin-shell-athletes-row-menu-icon" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onResendInvite}>Resend invite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCancelInvite}>Cancel invite</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function InvitesDataTable({ searchQuery = '' }) {
  const { toastManager } = useToast()
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteDialogMode, setInviteDialogMode] = useState('create')
  const [inviteDialogAthleteId, setInviteDialogAthleteId] = useState(null)
  const [inviteAthleteFirstName, setInviteAthleteFirstName] = useState('')
  const [inviteAthleteLastName, setInviteAthleteLastName] = useState('')
  const [inviteAthleteEmail, setInviteAthleteEmail] = useState('')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isCancelInviteDialogOpen, setIsCancelInviteDialogOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  useEffect(() => {
    let cancelled = false

    async function loadInvites() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/invites', {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load invites.')
        }

        if (!cancelled) {
          setInvites(Array.isArray(payload?.invites) ? payload.invites : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setInvites([])
          setError(loadError?.message || 'Failed to load invites.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInvites()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  function resetInviteDialogState() {
    setInviteDialogMode('create')
    setInviteDialogAthleteId(null)
    setInviteAthleteFirstName('')
    setInviteAthleteLastName('')
    setInviteAthleteEmail('')
  }

  async function handleInviteDialogSubmit() {
    const trimmedFirstName = String(inviteAthleteFirstName || '').trim()
    const trimmedLastName = String(inviteAthleteLastName || '').trim()
    const normalizedInviteEmail = String(inviteAthleteEmail || '').trim().toLowerCase()

    if (!normalizedInviteEmail) {
      throw new Error('Invite email is required when sending an athlete invitation.')
    }

    if (inviteDialogMode === 'create' && (!trimmedFirstName || !trimmedLastName)) {
      throw new Error('First name and last name are required.')
    }

    setIsSubmittingInvite(true)

    const submitPromise = (async () => {
      const requestBody = inviteDialogMode === 'resend'
        ? {
            athleteId: inviteDialogAthleteId,
            inviteeEmail: normalizedInviteEmail,
          }
        : {
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            dateOfBirth: '',
            gender: 'male',
            position: 'forward',
            heightCm: null,
            weightKg: null,
            avatarUrl: '',
            avatarUpload: null,
            inviteeEmail: normalizedInviteEmail,
            sendInvite: true,
          }

      const response = await fetch(inviteDialogMode === 'resend' ? '/api/admin/invites' : '/api/admin/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || (inviteDialogMode === 'resend' ? 'Failed to send athlete invite.' : 'Failed to create athlete.'))
      }

      return payload?.athlete || null
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: inviteDialogMode === 'resend' ? 'Sending invite...' : 'Creating athlete...', data: { close: true } },
        success: (savedAthlete) => ({
          title: 'Invitation sent',
          description: inviteDialogMode === 'resend'
            ? 'Sent an athlete invitation for ' + (savedAthlete?.inviteeEmail || normalizedInviteEmail || 'this athlete') + '.'
            : 'Created a pending athlete account for ' + (savedAthlete?.inviteeEmail || normalizedInviteEmail || 'this athlete') + ' and sent the invite.',
          data: { close: true },
        }),
        error: (submitError) => ({
          title: inviteDialogMode === 'resend' ? 'Failed to send invite' : 'Failed to create athlete',
          description: submitError?.message || (inviteDialogMode === 'resend' ? 'We could not send this athlete invite right now.' : 'We could not create this athlete right now.'),
          data: { close: true },
        }),
      })

      setIsInviteDialogOpen(false)
      resetInviteDialogState()
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsSubmittingInvite(false)
    }
  }

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
        cell: ({ row }) => <NameCell name={row.original.name} email={row.original.email} />,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        meta: { label: 'Role' },
        cell: ({ row }) => <RoleCell role={row.original.role} />,
      },
      {
        accessorKey: 'sent',
        header: 'Sent',
        meta: { label: 'Sent' },
        cell: ({ row }) => <span className="admin-shell-athletes-last-active-cell">{row.original.sent}</span>,
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
            onResendInvite={() => {
              setInviteDialogMode('resend')
              setInviteDialogAthleteId(row.original.id)
              setInviteAthleteFirstName('')
              setInviteAthleteLastName('')
              setInviteAthleteEmail(row.original.email ?? '')
              setIsInviteDialogOpen(true)
            }}
            onCancelInvite={() => setIsCancelInviteDialogOpen(true)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  )

  const table = useReactTable({
    data: invites,
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

  const emptyStateMessage = error || 'No invites found.'
  const pageSizeOptions = [5, 10, 20, 30]
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)
  const pageNumbers = Array.from({ length: table.getPageCount() }, (_, index) => index)
  const skeletonRows = Array.from({ length: pagination.pageSize }, (_, rowIndex) => rowIndex)

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
          onClick={() => {
            setInviteDialogMode('create')
            setInviteDialogAthleteId(null)
            setInviteAthleteFirstName('')
            setInviteAthleteLastName('')
            setInviteAthleteEmail('')
            setIsInviteDialogOpen(true)
          }}
          className="admin-shell-athletes-invite-button bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d] rounded-[12px] min-h-[40px]"
        >
          Invite an athlete
        </Button>
      </div>

      <Dialog open={isInviteDialogOpen} onOpenChange={(open) => {
        setIsInviteDialogOpen(open)
        if (!open) {
          resetInviteDialogState()
        }
      }}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[560px]">
          <div className="border-b border-[#24334A] px-6 py-5">
            <DialogHeader>
              <DialogTitle>{inviteDialogMode === 'resend' ? 'Resend invite' : 'Invite an athlete'}</DialogTitle>
              <DialogDescription>
                {inviteDialogMode === 'resend'
                  ? 'Send another invitation for this athlete.'
                  : 'Bring a coach-managed athlete into the workspace.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-6">
            {inviteDialogMode === 'create' ? (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="invite-athlete-first-name">
                    First name
                  </label>
                  <Input
                    id="invite-athlete-first-name"
                    className="h-11 rounded-[12px] !border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                    placeholder="First name"
                    value={inviteAthleteFirstName}
                    onChange={(event) => setInviteAthleteFirstName(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="invite-athlete-last-name">
                    Last name
                  </label>
                  <Input
                    id="invite-athlete-last-name"
                    className="h-11 rounded-[12px] !border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                    placeholder="Last name"
                    value={inviteAthleteLastName}
                    onChange={(event) => setInviteAthleteLastName(event.target.value)}
                  />
                </div>
              </>
            ) : null}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="invite-athlete-email">
                Email address
              </label>
              <Input
                id="invite-athlete-email"
                className="h-11 rounded-[12px] !border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                placeholder="athlete@email.com"
                type="email"
                value={inviteAthleteEmail}
                onChange={(event) => setInviteAthleteEmail(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => {
                setIsInviteDialogOpen(false)
                resetInviteDialogState()
              }}
              disabled={isSubmittingInvite}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
              onClick={handleInviteDialogSubmit}
              disabled={isSubmittingInvite}
            >
              {isSubmittingInvite ? 'Sending...' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelInviteDialogOpen} onOpenChange={setIsCancelInviteDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[560px]">
          <div className="px-6 py-5">
            <DialogHeader>
              <DialogTitle>Cancel invite</DialogTitle>
              <DialogDescription>This invite will be canceled and removed from the invites list.</DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setIsCancelInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
            >
              Cancel invite
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
                        <Skeleton className="h-3 w-[156px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[84px] rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[88px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[112px] rounded-full" />
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
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[#8EA0BC]">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-3 py-4 text-sm text-[#8EA0BC]">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="h-9 w-[76px] rounded-[10px] !border-[#24334A] bg-[#111D30] px-3 text-sm text-[#DCE6F8]">
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
            className={`admin-shell-athletes-example-pagination-button ${pagination.pageIndex === pageNumber ? 'bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]' : ''}`}
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
