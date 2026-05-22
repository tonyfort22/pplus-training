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

import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
import CompactFileUpload from '@/components/ui/compact-file-upload'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MultiCombobox from '@/components/ui/multi-combobox'
import WorkoutTrainingBuilder from '@/components/admin/workout-training-builder'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Textarea from '@/components/ui/textarea'

const workouts = [
  { id: 'workout-1', name: 'Phase 3 Speed Accelerator A', duration: '60 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-2', name: 'Phase 3 Speed Accelerator B', duration: '60 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-3', name: 'Phase 3 Edge Work A', duration: '25 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-4', name: 'Phase 3 Edge Work B', duration: '25 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-5', name: 'Phase 3 Speed Accelerator C', duration: '60 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-6', name: 'Phase 4 Speed Accelerator A', duration: '60 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-7', name: 'Phase 4 Speed Accelerator B', duration: '60 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-8', name: 'Phase 4 Edge Work A', duration: '25 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-9', name: 'Phase 4 Edge Work B', duration: '25 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
  { id: 'workout-10', name: 'Phase 4 Speed Accelerator C', duration: '60 min', sections: '--', exercises: '--', focusArea: '--', status: 'Active' },
]

const programOptions = [
  { value: 'program-1', label: 'Program 1' },
  { value: 'program-2', label: 'Program 2' },
  { value: 'program-3', label: 'Program 3' },
]

const trainerOptions = [
  { value: 'thibault', label: 'Thibault' },
  { value: 'anthony', label: 'Anthony' },
  { value: 'mason', label: 'Mason' },
]

const equipmentOptions = [
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'sled', label: 'Sled' },
  { value: 'spirit-bike', label: 'Spirit Bike' },
  { value: 'cable', label: 'Cable' },
  { value: 'trap-bar', label: 'Trap Bar' },
  { value: 'stability-ball', label: 'Stability Ball' },
  { value: 'bike', label: 'Bike' },
]

const categoryOptions = [
  { value: 'speed', label: 'Speed' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'strength', label: 'Strength' },
]

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const focusAreaOptions = [
  { value: 'acceleration', label: 'Acceleration' },
  { value: 'edge-work', label: 'Edge Work' },
  { value: 'conditioning', label: 'Conditioning' },
]

function createWorkoutFormValues(selectedWorkout = null) {
  return {
    name: selectedWorkout?.name ?? '',
    duration: selectedWorkout?.duration ?? '',
    thumbnailName: '',
    program: '',
    trainer: '',
    equipmentNeeded: [],
    category: '',
    difficulty: '',
    status: selectedWorkout?.status?.toLowerCase?.() ?? 'active',
    focusArea: selectedWorkout?.focusArea && selectedWorkout.focusArea !== '--' ? selectedWorkout.focusArea.toLowerCase().replace(/\s+/g, '-') : '',
    description: '',
  }
}

function StatusCell({ status }) {
  return (
    <Badge tone="success" className="border-transparent bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 normal-case tracking-normal">
      {status}
    </Badge>
  )
}

function RowActionsCell({
  isOpen = false,
  onOpenChange = () => {},
  onEditAction = () => {},
  onDuplicateAction = () => {},
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
            onDuplicateAction()
            onOpenChange(false)
          }}
        >
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label className="text-sm font-medium text-[#DCE6F8]" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

export default function WorkoutsDataTable({ searchQuery = '' }) {
  const [isCreateWorkoutDialogOpen, setIsCreateWorkoutDialogOpen] = useState(false)
  const [workoutDialogMode, setWorkoutDialogMode] = useState('create')
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null)
  const [workoutFormValues, setWorkoutFormValues] = useState(() => createWorkoutFormValues())
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  function openCreateWorkoutDialog() {
    setWorkoutDialogMode('create')
    setSelectedWorkoutId(null)
    setWorkoutFormValues(createWorkoutFormValues())
    setIsCreateWorkoutDialogOpen(true)
  }

  function openEditWorkoutDialog(workoutId) {
    const selectedWorkout = workouts.find((workout) => workout.id === workoutId)

    if (!selectedWorkout) return

    setWorkoutDialogMode('edit')
    setSelectedWorkoutId(workoutId)
    setWorkoutFormValues(createWorkoutFormValues(selectedWorkout))
    setIsCreateWorkoutDialogOpen(true)
  }

  function openDuplicateWorkoutDialog(workoutId) {
    const selectedWorkout = workouts.find((workout) => workout.id === workoutId)

    if (!selectedWorkout) return

    setWorkoutDialogMode('duplicate')
    setSelectedWorkoutId(workoutId)
    setWorkoutFormValues(createWorkoutFormValues(selectedWorkout))
    setIsCreateWorkoutDialogOpen(true)
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
        header: 'Workout',
        meta: { label: 'Workout' },
      },
      {
        accessorKey: 'sections',
        header: 'Sections',
        meta: { label: 'Sections' },
      },
      {
        accessorKey: 'exercises',
        header: 'Exercises',
        meta: { label: 'Exercises' },
      },
      {
        accessorKey: 'focusArea',
        header: 'Focus Area',
        meta: { label: 'Focus Area' },
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        meta: { label: 'Duration' },
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
            onEditAction={() => setPendingRowAction({ type: 'edit', workoutId: row.original.id })}
            onDuplicateAction={() => setPendingRowAction({ type: 'duplicate', workoutId: row.original.id })}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openRowActionMenuId],
  )

  const table = useReactTable({
    data: workouts,
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
      openEditWorkoutDialog(pendingRowAction.workoutId)
    } else if (pendingRowAction.type === 'duplicate') {
      openDuplicateWorkoutDialog(pendingRowAction.workoutId)
    }

    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

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
          onClick={openCreateWorkoutDialog}
          className="admin-shell-athletes-invite-button bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d] rounded-[12px] min-h-[40px]"
        >
          Create a workout
        </Button>
      </div>

      <Dialog
        open={isCreateWorkoutDialogOpen}
        onOpenChange={(isOpen) => {
          setIsCreateWorkoutDialogOpen(isOpen)
        }}
        modal={false}
      >
        <DialogContent
          pageScrollable
          className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[760px]"
        >
          <div className="shrink-0 border-b border-[#24334A] px-6 py-5">
            <DialogHeader>
              <DialogTitle>{workoutDialogMode === 'edit' ? 'Edit workout' : workoutDialogMode === 'duplicate' ? 'Duplicate workout' : 'Workout'}</DialogTitle>
              <DialogDescription>
                {workoutDialogMode === 'edit'
                  ? `Update ${workoutFormValues.name || selectedWorkoutId || 'this workout'} below.`
                  : workoutDialogMode === 'duplicate'
                    ? `Duplicate ${workoutFormValues.name || selectedWorkoutId || 'this workout'} into a new workout.`
                    : 'Fill out the information below.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-6">
            <Tabs defaultValue="details" className="grid gap-5">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="create-workout-name">Name</FieldLabel>
                    <input
                      id="create-workout-name"
                      type="text"
                      value={workoutFormValues.name}
                      onChange={(event) => setWorkoutFormValues((current) => ({ ...current, name: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none placeholder:text-[#70809E] focus:border-[#3BE0AF]"
                      placeholder="Enter workout name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="create-workout-duration">Duration</FieldLabel>
                    <input
                      id="create-workout-duration"
                      type="text"
                      value={workoutFormValues.duration}
                      onChange={(event) => setWorkoutFormValues((current) => ({ ...current, duration: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none placeholder:text-[#70809E] focus:border-[#3BE0AF]"
                      placeholder="60 min"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-thumbnail">Thumbnail</FieldLabel>
                  <CompactFileUpload
                    id="create-workout-thumbnail"
                    buttonLabel="Choose File"
                    helperText="Drop files here or click to browse (max 3 files)"
                    fileName={workoutFormValues.thumbnailName}
                    onFileChange={(file) => setWorkoutFormValues((current) => ({ ...current, thumbnailName: file?.name ?? '' }))}
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-program">Program</FieldLabel>
                  <Select value={workoutFormValues.program} onValueChange={(value) => setWorkoutFormValues((current) => ({ ...current, program: value }))}>
                    <SelectTrigger id="create-workout-program" className="h-11 rounded-[12px]">
                      <SelectValue placeholder="Choose some options..." />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="create-workout-trainer">Trainer</FieldLabel>
                    <Select value={workoutFormValues.trainer} onValueChange={(value) => setWorkoutFormValues((current) => ({ ...current, trainer: value }))}>
                      <SelectTrigger id="create-workout-trainer" className="h-11 rounded-[12px]">
                        <SelectValue placeholder="Select trainer" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="create-workout-equipment">Equipment needed</FieldLabel>
                    <MultiCombobox
                      id="create-workout-equipment"
                      placeholder="Choose some options..."
                      searchPlaceholder="Search equipment..."
                      maxVisibleBadges={3}
                      options={equipmentOptions}
                      selectedValues={workoutFormValues.equipmentNeeded}
                      onSelectedValuesChange={(equipmentNeeded) => setWorkoutFormValues((current) => ({ ...current, equipmentNeeded }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="create-workout-category">Category</FieldLabel>
                    <Select value={workoutFormValues.category} onValueChange={(value) => setWorkoutFormValues((current) => ({ ...current, category: value }))}>
                      <SelectTrigger id="create-workout-category" className="h-11 rounded-[12px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="create-workout-difficulty">Difficulty</FieldLabel>
                    <Select value={workoutFormValues.difficulty} onValueChange={(value) => setWorkoutFormValues((current) => ({ ...current, difficulty: value }))}>
                      <SelectTrigger id="create-workout-difficulty" className="h-11 rounded-[12px]">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="create-workout-status">Status</FieldLabel>
                    <Select value={workoutFormValues.status} onValueChange={(value) => setWorkoutFormValues((current) => ({ ...current, status: value }))}>
                      <SelectTrigger id="create-workout-status" className="h-11 rounded-[12px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="create-workout-focus-area">Focus area</FieldLabel>
                    <Select value={workoutFormValues.focusArea} onValueChange={(value) => setWorkoutFormValues((current) => ({ ...current, focusArea: value }))}>
                      <SelectTrigger id="create-workout-focus-area" className="h-11 rounded-[12px]">
                        <SelectValue placeholder="Select focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        {focusAreaOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-description">Description</FieldLabel>
                  <Textarea
                    id="create-workout-description"
                    value={workoutFormValues.description}
                    onChange={(event) => setWorkoutFormValues((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-[140px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                    placeholder="Add a short description for this workout"
                  />
                </div>
              </TabsContent>

              <TabsContent value="training" className="grid gap-5">
                <WorkoutTrainingBuilder />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="shrink-0 border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setIsCreateWorkoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
            >
              Create
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
                  <TableHead key={header.id} className={header.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}>
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
                    <TableCell key={cell.id} className={cell.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[#8EA0BC]">
                  No workouts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4 text-sm text-[#8EA0BC]">
        <div>{table.getFilteredRowModel().rows.length} workout(s)</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
