'use client'

import { Trash2 } from 'lucide-react'

import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function getExerciseMeta(exercise) {
  const muscleLabel = Array.isArray(exercise?.muscleNames) && exercise.muscleNames.length > 0
    ? exercise.muscleNames.join(', ')
    : exercise?.muscle || 'Unassigned muscle'
  const equipmentLabel = Array.isArray(exercise?.equipmentNeeded) && exercise.equipmentNeeded.length > 0
    ? exercise.equipmentNeeded.join(', ')
    : exercise?.equipment || 'No equipment'

  return [muscleLabel, equipmentLabel, exercise?.status]
    .filter(Boolean)
    .join(' · ')
}

export default function ExerciseDeleteDialog({
  open,
  onOpenChange,
  exercises = [],
  exerciseName = '',
  isDeleting = false,
  errorMessage = '',
  onConfirmDelete = () => {},
}) {
  const fallbackExercise = exerciseName ? [{ id: 'pending-delete', name: exerciseName }] : []
  const resolvedExercises = exercises.length > 0 ? exercises : fallbackExercise
  const exerciseCount = resolvedExercises.length
  const previewExercises = resolvedExercises.slice(0, 4)
  const hiddenExerciseCount = Math.max(exerciseCount - previewExercises.length, 0)
  const isBulkDelete = exerciseCount > 1
  const deleteButtonLabel = isBulkDelete ? 'Delete exercises' : 'Delete exercise'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[460px]">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[14px] bg-red-500/10 text-red-500">
            <Trash2 className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>{isBulkDelete ? 'Delete exercises' : 'Delete exercise'}</DialogTitle>
          <DialogDescription>
            {isBulkDelete ? 'Delete selected exercises permanently from the library.' : 'This exercise will be permanently deleted.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">
              {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'} selected
            </p>
            <p className="mt-1 text-xs text-[var(--admin-dashboard-card-muted)]">
              This cannot be undone.
            </p>
          </div>

          {previewExercises.length > 0 ? (
            <div className="space-y-2">
              {previewExercises.map((exercise) => (
                <div key={exercise.id || exercise.name} className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{exercise.name}</p>
                    <p className="truncate text-xs text-[var(--admin-dashboard-card-muted)]">{getExerciseMeta(exercise)}</p>
                  </div>
                  <Badge className="admin-shell-workouts-status-badge admin-shell-workouts-status-badge-inactive normal-case tracking-normal">
                    Delete
                  </Badge>
                </div>
              ))}
              {hiddenExerciseCount > 0 ? (
                <p className="px-1 text-xs font-medium text-[var(--admin-dashboard-card-muted)]">+ {hiddenExerciseCount} more</p>
              ) : null}
            </div>
          ) : null}

          {errorMessage ? <p className="admin-shell-workout-editor-message rounded-[12px] px-4 py-3 text-sm">{errorMessage}</p> : null}
        </div>

        <DialogFooter className="sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-[12px] min-h-[40px]"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
            onClick={onConfirmDelete}
            disabled={isDeleting || exerciseCount === 0}
          >
            {isDeleting ? 'Deleting...' : deleteButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
