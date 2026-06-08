'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Ban, ChevronDown, Copy, Download, MoreHorizontal, Send } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import Avatar from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const INVITES_TABLE_COLUMN_WIDTHS = {
  select: '44px',
  name: '300px',
  role: '150px',
  sent: '170px',
  status: '130px',
  actions: '52px',
}

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
    <div className="admin-shell-invites-name-cell">
      <Avatar alt={name} className="admin-shell-invites-avatar" initials={getInitials(name)} />
      <div className="admin-shell-invites-name-copy">
        <span className="admin-shell-invites-name-text">{name}</span>
        <span className="admin-shell-invites-name-meta">{email}</span>
      </div>
    </div>
  )
}

function InviteStatusBadge({ status }) {
  const normalizedStatus = String(status || '').trim().toLowerCase()
  const tone = status === 'Accepted' ? 'success' : status === 'Pending' ? 'warning' : 'danger'
  const className = `admin-shell-invites-status-badge admin-shell-invites-status-badge-${normalizedStatus || 'unknown'} normal-case tracking-normal`

  return (
    <Badge tone={tone} className={className}>
      {status}
    </Badge>
  )
}

function RoleCell({ role }) {
  return (
    <Badge tone="neutral" className="admin-shell-invites-role-chip normal-case tracking-normal">
      {role}
    </Badge>
  )
}

function getBulkActionEligibleInvites(selectedInvites, allowedStatuses) {
  const allowedStatusSet = new Set(allowedStatuses)
  return selectedInvites.filter((invite) => allowedStatusSet.has(invite.status))
}

function isBulkResendInviteEligible(invite) {
  return ['Pending', 'Expired'].includes(invite.status) && Boolean(invite.athleteProfileId) && Boolean(invite.email && invite.email !== '-')
}

function getBulkResendInviteSkipReason(invite) {
  if (invite.status === 'Accepted') return 'Already accepted'
  if (invite.status === 'Canceled') return 'Invite canceled'
  if (!invite.email || invite.email === '-') return 'Missing email'
  if (!invite.athleteProfileId) return 'Missing athlete profile'
  return 'Cannot resend'
}

function getBulkCancelInviteSkipReason(invite) {
  if (invite.status === 'Accepted') return 'Already accepted'
  if (invite.status === 'Canceled') return 'Already canceled'
  return 'Cannot cancel'
}

function escapeCsvValue(value) {
  const normalizedValue = value == null ? '' : String(value)
  return `"${normalizedValue.replace(/"/g, '""')}"`
}

function buildInvitesExportCsv(selectedInvites) {
  const headers = [
    'Invite ID',
    'Invitee email',
    'Athlete profile ID',
    'Name',
    'Role',
    'Status',
    'Sent',
    'Created at',
    'Expires at',
    'Used at',
    'Revoked at',
  ]
  const rows = selectedInvites.map((invite) => [
    invite.id,
    invite.email,
    invite.athleteProfileId,
    invite.name,
    invite.role,
    invite.status,
    invite.sent,
    invite.createdAt,
    invite.expiresAt,
    invite.usedAt,
    invite.revokedAt,
  ])

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

function getInvitesExportFileName(date = new Date()) {
  return `pplus-invites-export-${date.toISOString().slice(0, 10)}.csv`
}

function downloadInvitesExportFile({ content, fileName, mimeType }) {
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

function RowActionsCell({ onResendInvite = () => {}, onCancelInvite = () => {}, canCancel = false }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="admin-shell-invites-row-menu" aria-label="Open menu">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="admin-shell-invites-row-menu-icon" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onResendInvite}>Resend invite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!canCancel} onSelect={onCancelInvite}>Cancel invite</DropdownMenuItem>
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
  const [isBulkActionsMenuOpen, setIsBulkActionsMenuOpen] = useState(false)
  const [isBulkResendSheetOpen, setIsBulkResendSheetOpen] = useState(false)
  const [isBulkCancelDialogOpen, setIsBulkCancelDialogOpen] = useState(false)
  const [isCancelInviteDialogOpen, setIsCancelInviteDialogOpen] = useState(false)
  const [cancelInviteTarget, setCancelInviteTarget] = useState(null)
  const [isExportInvitesSheetOpen, setIsExportInvitesSheetOpen] = useState(false)
  const [isResendingBulkInvites, setIsResendingBulkInvites] = useState(false)
  const [isCancelingBulkInvites, setIsCancelingBulkInvites] = useState(false)
  const [isExportingInvites, setIsExportingInvites] = useState(false)
  const [isCancelingInvite, setIsCancelingInvite] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
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

  function handleOpenCancelInviteDialog(invite) {
    if (!invite || isCancelingInvite) return

    setCancelInviteTarget(invite)
    setIsCancelInviteDialogOpen(true)
  }

  async function handleConfirmCancelInvite() {
    if (!cancelInviteTarget?.id || isCancelingInvite) return

    setIsCancelingInvite(true)
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: cancelInviteTarget.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to cancel invite.')
      }
      return payload?.invite || null
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Canceling invite...', data: { close: true } },
        success: { title: 'Invite canceled', description: 'This athlete invitation was revoked.', data: { close: true } },
        error: (cancelError) => ({
          title: 'Failed to cancel invite',
          description: cancelError?.message || 'We could not cancel this invite right now.',
          data: { close: true },
        }),
      })
      setIsCancelInviteDialogOpen(false)
      setCancelInviteTarget(null)
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsCancelingInvite(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="admin-shell-invites-checkbox-cell">
            <Checkbox
              className="admin-shell-athletes-checkbox-input"
              checked={table.getIsAllPageRowsSelected()}
              onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="admin-shell-invites-checkbox-cell">
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
        cell: ({ row }) => <span className="admin-shell-invites-join-date-cell">{row.original.sent}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { label: 'Status' },
        cell: ({ row }) => <InviteStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RowActionsCell
            canCancel={row.original.status === 'Pending' || row.original.status === 'Expired'}
            onResendInvite={() => {
              setInviteDialogMode('resend')
              setInviteDialogAthleteId(row.original.athleteProfileId)
              setInviteAthleteFirstName('')
              setInviteAthleteLastName('')
              setInviteAthleteEmail(row.original.email ?? '')
              setIsInviteDialogOpen(true)
            }}
            onCancelInvite={() => handleOpenCancelInviteDialog(row.original)}
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
  const selectedInviteCount = table.getSelectedRowModel().rows.length
  const selectedInvites = table.getSelectedRowModel().rows.map((row) => row.original)
  const bulkResendEligibleInvites = selectedInvites.filter((invite) => isBulkResendInviteEligible(invite))
  const bulkResendSkippedInvites = selectedInvites.filter((invite) => !isBulkResendInviteEligible(invite))
  const bulkCancelEligibleInvites = getBulkActionEligibleInvites(selectedInvites, ['Pending', 'Expired'])
  const bulkCancelSkippedInvites = selectedInvites.filter((invite) => !['Pending', 'Expired'].includes(invite.status))
  const selectedInviteEmails = selectedInvites.map((invite) => invite.email).filter((email) => email && email !== '-')
  const inviteExportColumns = [
    'Invite ID',
    'Invitee email',
    'Athlete profile ID',
    'Name',
    'Role',
    'Status',
    'Sent',
    'Created at',
    'Expires at',
    'Used at',
    'Revoked at',
  ]
  const exportInvitesFileName = getInvitesExportFileName()
  const exportInvitesDisabled = selectedInviteCount === 0 || isExportingInvites

  useEffect(() => {
    if (selectedInviteCount === 0) {
      setIsBulkActionsMenuOpen(false)
    }
  }, [selectedInviteCount])

  function handleBulkActionsMenuOpenChange(open) {
    if (open && selectedInviteCount === 0) {
      setIsBulkActionsMenuOpen(false)
      return
    }

    setIsBulkActionsMenuOpen(open)
  }

  function handleOpenBulkResendSheet() {
    if (selectedInviteCount === 0 || isResendingBulkInvites) return

    setIsBulkActionsMenuOpen(false)
    setIsBulkResendSheetOpen(true)
  }

  async function handleConfirmBulkResendInvites() {
    if (bulkResendEligibleInvites.length === 0 || isResendingBulkInvites) return

    setIsResendingBulkInvites(true)
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend',
          inviteIds: bulkResendEligibleInvites.map((invite) => invite.id),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to resend invite.')
      }
      return payload?.result?.resentInvites || []
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Resending invites...', data: { close: true } },
        success: (resentInvites) => ({
          title: 'Invites resent',
          description: `${resentInvites.length} invite email${resentInvites.length === 1 ? '' : 's'} sent.`,
          data: { close: true },
        }),
        error: (resendError) => ({
          title: 'Failed to resend invites',
          description: resendError?.message || 'We could not resend these invites right now.',
          data: { close: true },
        }),
      })
      setIsBulkResendSheetOpen(false)
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsResendingBulkInvites(false)
    }
  }

  function handleOpenBulkCancelDialog() {
    if (selectedInviteCount === 0 || isCancelingBulkInvites) return

    setIsBulkActionsMenuOpen(false)
    setIsBulkCancelDialogOpen(true)
  }

  async function handleConfirmBulkCancelInvites() {
    if (bulkCancelEligibleInvites.length === 0 || isCancelingBulkInvites) return

    setIsCancelingBulkInvites(true)
    const submitPromise = (async () => {
      const response = await fetch('/api/admin/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteIds: bulkCancelEligibleInvites.map((invite) => invite.id) }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to cancel invites.')
      }
      return payload?.result || null
    })()

    try {
      await toastManager.promise(submitPromise, {
        loading: { title: 'Canceling invites...', data: { close: true } },
        success: { title: 'Invites canceled', description: `${bulkCancelEligibleInvites.length} invite${bulkCancelEligibleInvites.length === 1 ? '' : 's'} revoked.`, data: { close: true } },
        error: (cancelError) => ({
          title: 'Failed to cancel invites',
          description: cancelError?.message || 'We could not cancel these invites right now.',
          data: { close: true },
        }),
      })
      setIsBulkCancelDialogOpen(false)
      setRowSelection({})
      setRefreshKey((currentValue) => currentValue + 1)
    } finally {
      setIsCancelingBulkInvites(false)
    }
  }

  function handleCopyInviteEmails() {
    if (selectedInviteEmails.length === 0) return

    navigator.clipboard.writeText(selectedInviteEmails.join('\n'))
      .then(() => {
        toastManager.show({
          title: 'Copied invite emails',
          description: `Copied ${selectedInviteEmails.length} invite email${selectedInviteEmails.length === 1 ? '' : 's'} to your clipboard.`,
          variant: 'success',
          data: { close: true },
        })
        setIsBulkActionsMenuOpen(false)
      })
      .catch((copyError) => {
        toastManager.show({
          title: 'Failed to copy emails',
          description: copyError?.message || 'We could not copy these emails right now.',
          variant: 'error',
          data: { close: true },
        })
      })
  }

  function handleOpenExportInvitesSheet() {
    if (exportInvitesDisabled) return

    setIsBulkActionsMenuOpen(false)
    setIsExportInvitesSheetOpen(true)
  }

  function handleConfirmExportInvites() {
    if (exportInvitesDisabled) return

    setIsExportingInvites(true)

    try {
      const csv = buildInvitesExportCsv(selectedInvites)
      downloadInvitesExportFile({
        content: csv,
        fileName: exportInvitesFileName,
        mimeType: 'text/csv;charset=utf-8',
      })
      toastManager.show({
        title: 'Invites export ready',
        description: `${selectedInviteCount} invite${selectedInviteCount === 1 ? '' : 's'} exported.`,
        variant: 'success',
        data: { close: true },
      })
      setIsExportInvitesSheetOpen(false)
      setRowSelection({})
    } catch (exportError) {
      toastManager.show({
        title: 'Failed to export invites',
        description: exportError?.message || 'We could not generate this invite export right now.',
        variant: 'error',
        data: { close: true },
      })
    } finally {
      setIsExportingInvites(false)
    }
  }

  return (
    <div className="admin-shell-invites-table-example">
      <div className="admin-shell-invites-example-controls flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2" />
        <div className="flex shrink-0 items-center justify-end gap-3">
          <DropdownMenu open={isBulkActionsMenuOpen} onOpenChange={handleBulkActionsMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="admin-shell-invites-example-columns-button disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={selectedInviteCount === 0}
                aria-disabled={selectedInviteCount === 0}
                aria-label="Invite bulk actions"
              >
                {selectedInviteCount > 0 ? `Bulk actions (${selectedInviteCount})` : 'Bulk actions'}
                <ChevronDown className="admin-shell-invites-example-columns-icon" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[190px]">
              <DropdownMenuItem
                className="admin-shell-athletes-bulk-menu-item"
                disabled={isResendingBulkInvites || getBulkActionEligibleInvites(selectedInvites, ['Pending', 'Expired']).length === 0}
                onSelect={(event) => {
                  event.preventDefault()
                  handleOpenBulkResendSheet()
                }}
              >
                <Send className="size-4" aria-hidden="true" />
                Resend invites
              </DropdownMenuItem>
              <DropdownMenuItem
                className="admin-shell-athletes-bulk-menu-item"
                disabled={exportInvitesDisabled}
                aria-label="Open invite export workflow"
                onSelect={(event) => {
                  event.preventDefault()
                  handleOpenExportInvitesSheet()
                }}
              >
                <Download className="size-4" aria-hidden="true" />
                Export invites
              </DropdownMenuItem>
              <DropdownMenuItem
                className="admin-shell-athletes-bulk-menu-item"
                disabled={selectedInviteEmails.length === 0}
                aria-label="Copy selected invite emails"
                onSelect={(event) => {
                  event.preventDefault()
                  handleCopyInviteEmails()
                }}
              >
                <Copy className="size-4" aria-hidden="true" />
                Copy emails
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="admin-shell-athletes-bulk-menu-item admin-shell-athletes-bulk-menu-item-danger"
                disabled={isCancelingBulkInvites || bulkCancelEligibleInvites.length === 0}
                onSelect={(event) => {
                  event.preventDefault()
                  handleOpenBulkCancelDialog()
                }}
              >
                <Ban className="size-4" aria-hidden="true" />
                Cancel invites
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="admin-shell-invites-example-columns-button">
                Columns
                <ChevronDown className="admin-shell-invites-example-columns-icon" aria-hidden="true" />
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
            className="admin-shell-invites-invite-button bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] rounded-[12px] min-h-[40px]"
          >
            Invite an athlete
          </Button>
        </div>
      </div>

      <Sheet open={isInviteDialogOpen} onOpenChange={(open) => {
        setIsInviteDialogOpen(open)
        if (!open) {
          resetInviteDialogState()
        }
      }}>
        <SheetContent side="right" className="admin-shell-invites-invite-sheet border-l border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle>{inviteDialogMode === 'resend' ? 'Resend invite' : 'Invite an athlete'}</SheetTitle>
            <SheetDescription>
              {inviteDialogMode === 'resend'
                ? 'Send another invitation for this athlete.'
                : 'Fill out the information below.'}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              {inviteDialogMode === 'create' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="invite-athlete-first-name">
                      First name
                    </label>
                    <Input
                      id="invite-athlete-first-name"
                      className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[#3BE0AF]/20"
                      placeholder="First name"
                      value={inviteAthleteFirstName}
                      onChange={(event) => setInviteAthleteFirstName(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="invite-athlete-last-name">
                      Last name
                    </label>
                    <Input
                      id="invite-athlete-last-name"
                      className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[#3BE0AF]/20"
                      placeholder="Last name"
                      value={inviteAthleteLastName}
                      onChange={(event) => setInviteAthleteLastName(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="invite-athlete-email">
                  Email
                </label>
                <Input
                  id="invite-athlete-email"
                  className="h-11 rounded-[12px] !border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[#3BE0AF]/20"
                  placeholder="athlete@email.com"
                  type="email"
                  value={inviteAthleteEmail}
                  onChange={(event) => setInviteAthleteEmail(event.target.value)}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
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
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              onClick={handleInviteDialogSubmit}
              disabled={isSubmittingInvite}
            >
              {isSubmittingInvite ? 'Sending...' : 'Send invite'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isCancelInviteDialogOpen} onOpenChange={(open) => {
        setIsCancelInviteDialogOpen(open)
        if (!open) {
          setCancelInviteTarget(null)
        }
      }}>
        <DialogContent className="admin-shell-invites-cancel-dialog border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Cancel invite</DialogTitle>
            <DialogDescription>Review this invite before revoking the athlete access link.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-3 rounded-[18px] border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                  <Ban className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">This invite link will be revoked</p>
                  <p className="mt-1 text-sm text-[var(--admin-dashboard-card-muted)]">This action cannot be undone for this invite link.</p>
                </div>
              </div>
            </div>

            {cancelInviteTarget ? (
              <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                <NameCell name={cancelInviteTarget.name} email={cancelInviteTarget.email} />
                <InviteStatusBadge status={cancelInviteTarget.status} />
              </div>
            ) : (
              <div className="rounded-[18px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                Select an invite to cancel.
              </div>
            )}
          </div>

          <DialogFooter className="sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px]"
              onClick={() => {
                setIsCancelInviteDialogOpen(false)
                setCancelInviteTarget(null)
              }}
              disabled={isCancelingInvite}
            >
              Keep invite
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500 text-white hover:bg-red-500/90"
              disabled={!cancelInviteTarget?.id || isCancelingInvite}
              onClick={handleConfirmCancelInvite}
            >
              {isCancelingInvite ? 'Canceling...' : 'Cancel invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={isBulkResendSheetOpen} onOpenChange={setIsBulkResendSheetOpen}>
        <SheetContent side="right" className="admin-shell-invites-bulk-resend-sheet border-l border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle>Resend invites</SheetTitle>
            <SheetDescription>Review the selected invites before sending another invitation email.</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <div className="rounded-[18px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">
                  {bulkResendEligibleInvites.length} invite{bulkResendEligibleInvites.length === 1 ? '' : 's'} will be resent
                </p>
                {bulkResendSkippedInvites.length > 0 ? (
                  <p className="mt-1 text-sm text-[var(--admin-dashboard-card-muted)]">
                    {bulkResendSkippedInvites.length} selected invite{bulkResendSkippedInvites.length === 1 ? '' : 's'} cannot be resent
                  </p>
                ) : null}
              </div>

              {bulkResendEligibleInvites.length > 0 ? (
                <div className="grid gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Ready to resend</div>
                  <div className="grid gap-2">
                    {bulkResendEligibleInvites.map((invite) => (
                      <div key={`resend-${invite.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{invite.name}</p>
                          <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">{invite.email}</p>
                        </div>
                        <InviteStatusBadge status={invite.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[18px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                  No selected invites can be resent. Only pending or expired invites with an email can be resent.
                </div>
              )}

              {bulkResendSkippedInvites.length > 0 ? (
                <div className="grid gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Cannot resend</div>
                  <div className="grid gap-2">
                    {bulkResendSkippedInvites.map((invite) => (
                      <div key={`skip-${invite.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{invite.name}</p>
                          <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">{invite.email && invite.email !== '-' ? invite.email : 'No email'}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <InviteStatusBadge status={invite.status} />
                          <span className="text-xs text-[var(--admin-dashboard-card-muted)]">{getBulkResendInviteSkipReason(invite)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
              onClick={() => setIsBulkResendSheetOpen(false)}
              disabled={isResendingBulkInvites}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={bulkResendEligibleInvites.length === 0 || isResendingBulkInvites}
              onClick={handleConfirmBulkResendInvites}
            >
              {isResendingBulkInvites ? 'Resending...' : `Resend ${bulkResendEligibleInvites.length} invite${bulkResendEligibleInvites.length === 1 ? '' : 's'}`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isBulkCancelDialogOpen} onOpenChange={setIsBulkCancelDialogOpen}>
        <DialogContent className="admin-shell-invites-bulk-cancel-dialog border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Cancel invites</DialogTitle>
            <DialogDescription>Review the selected invites before revoking athlete access links.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-3 rounded-[18px] border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                  <Ban className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">
                    {bulkCancelEligibleInvites.length} invite{bulkCancelEligibleInvites.length === 1 ? '' : 's'} will be canceled
                  </p>
                  <p className="mt-1 text-sm text-[var(--admin-dashboard-card-muted)]">
                    This action cannot be undone for the selected invite links.
                  </p>
                  {bulkCancelSkippedInvites.length > 0 ? (
                    <p className="mt-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                      {bulkCancelSkippedInvites.length} selected invite{bulkCancelSkippedInvites.length === 1 ? '' : 's'} cannot be canceled
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {bulkCancelEligibleInvites.length > 0 ? (
              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Will be canceled</div>
                <div className="grid max-h-[220px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {bulkCancelEligibleInvites.map((invite) => (
                    <div key={`cancel-${invite.id}`} className="flex items-center justify-between gap-3 rounded-[14px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{invite.name}</p>
                        <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">{invite.email && invite.email !== '-' ? invite.email : 'No email'}</p>
                      </div>
                      <InviteStatusBadge status={invite.status} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[18px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                No selected invites can be canceled. Only pending or expired invites can be canceled.
              </div>
            )}

            {bulkCancelSkippedInvites.length > 0 ? (
              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Cannot cancel</div>
                <div className="grid max-h-[160px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {bulkCancelSkippedInvites.map((invite) => (
                    <div key={`cancel-skip-${invite.id}`} className="flex items-center justify-between gap-3 rounded-[14px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{invite.name}</p>
                        <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">{invite.email && invite.email !== '-' ? invite.email : 'No email'}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <InviteStatusBadge status={invite.status} />
                        <span className="text-xs text-[var(--admin-dashboard-card-muted)]">{getBulkCancelInviteSkipReason(invite)}</span>
                      </div>
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
              onClick={() => setIsBulkCancelDialogOpen(false)}
              disabled={isCancelingBulkInvites}
            >
              Keep invites
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500 text-white hover:bg-red-500/90"
              disabled={bulkCancelEligibleInvites.length === 0 || isCancelingBulkInvites}
              onClick={handleConfirmBulkCancelInvites}
            >
              {isCancelingBulkInvites ? 'Canceling...' : `Cancel ${bulkCancelEligibleInvites.length} invite${bulkCancelEligibleInvites.length === 1 ? '' : 's'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isExportInvitesSheetOpen} onOpenChange={setIsExportInvitesSheetOpen}>
        <SheetContent side="right" className="admin-shell-invites-export-sheet border-l border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle>Export invites</SheetTitle>
            <SheetDescription>
              Review the selected invites before downloading a CSV export.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <div className="grid gap-3 rounded-[20px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Selected invites</p>
                  <p className="text-2xl font-semibold text-[var(--admin-dashboard-card-text)]">{selectedInviteCount}</p>
                </div>
                <div className="grid gap-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Format</span>
                    <span className="font-medium text-[var(--admin-dashboard-card-text)]">CSV</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Filename</span>
                    <span className="truncate font-medium text-[var(--admin-dashboard-card-text)]">{exportInvitesFileName}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Included columns</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {inviteExportColumns.map((column) => (
                    <div key={column} className="rounded-[14px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2 text-sm font-medium text-[var(--admin-dashboard-card-text)]">
                      {column}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Selected invite preview</div>
                <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {selectedInvites.map((invite) => (
                    <div key={`export-${invite.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                      <NameCell name={invite.name} email={invite.email} />
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-sm text-[var(--admin-dashboard-card-muted)] sm:inline">Sent {invite.sent}</span>
                        <InviteStatusBadge status={invite.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-sm text-[var(--admin-dashboard-card-muted)]">
                This export includes invite emails and IDs. Share it carefully.
              </div>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
              onClick={() => setIsExportInvitesSheetOpen(false)}
              disabled={isExportingInvites}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
              disabled={exportInvitesDisabled}
              onClick={handleConfirmExportInvites}
            >
              {isExportingInvites ? 'Preparing CSV...' : 'Download CSV'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="admin-shell-invites-table-shell">
        <Table className="admin-shell-invites-table">
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
              <col
                key={column.id}
                style={{ width: INVITES_TABLE_COLUMN_WIDTHS[column.id] ?? 'auto' }}
              />
            ))}
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.id === 'actions' ? 'admin-shell-invites-actions-cell' : ''}
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
                <TableRow key={`skeleton-${rowIndex}`} className={rowIndex % 2 === 0 ? 'admin-shell-invites-row-even' : 'admin-shell-invites-row-odd'}>
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
                  <TableCell className="admin-shell-invites-actions-cell">
                    <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={index % 2 === 0 ? 'admin-shell-invites-row-even' : 'admin-shell-invites-row-odd'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === 'actions' ? 'admin-shell-invites-actions-cell' : ''}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="admin-shell-invites-empty-state h-24 text-center">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="admin-shell-invites-pagination-bar flex items-center justify-end gap-3 py-4 text-sm">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="admin-shell-invites-rows-select h-9 w-[76px] rounded-[10px] px-3 text-sm">
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
          className="admin-shell-invites-example-pagination-button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ‹
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={`page-${pageNumber}`}
            type="button"
            className={`admin-shell-invites-example-pagination-button ${pagination.pageIndex === pageNumber ? 'admin-shell-invites-example-pagination-button-active' : ''}`}
            onClick={() => table.setPageIndex(pageNumber)}
          >
            {pageNumber + 1}
          </button>
        ))}
        <button
          type="button"
          aria-label="Go to next page"
          className="admin-shell-invites-example-pagination-button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          ›
        </button>
      </div>
    </div>
  )
}
