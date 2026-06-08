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

function getWorkoutMeta(workout) {
  const exerciseCount = Number(workout?.exerciseCount ?? 0)
  const setCount = Number(workout?.setCount ?? 0)
  const exerciseLabel = `${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`
  const setLabel = `${setCount} set${setCount === 1 ? '' : 's'}`

  return [workout?.duration, exerciseLabel, setLabel, workout?.focusArea]
    .filter((value) => value && value !== '--')
    .join(' · ')
}

export default function WorkoutDeleteDialog({
  open,
  onOpenChange,
  workouts = [],
  isDeleting = false,
  message = '',
  onConfirm,
}) {
  const workoutCount = workouts.length
  const previewWorkouts = workouts.slice(0, 3)
  const hiddenWorkoutCount = Math.max(workoutCount - previewWorkouts.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[440px]">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[14px] bg-red-500/10 text-red-500">
            <Trash2 className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Delete workouts</DialogTitle>
          <DialogDescription>
            Delete selected workouts permanently. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">
              {workoutCount} workout{workoutCount === 1 ? '' : 's'} selected
            </p>
            <p className="mt-1 text-xs text-[var(--admin-dashboard-card-muted)]">
              This removes the selected workout templates from the library.
            </p>
          </div>

          {previewWorkouts.length > 0 ? (
            <div className="space-y-2">
              {previewWorkouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{workout.name}</p>
                    <p className="truncate text-xs text-[var(--admin-dashboard-card-muted)]">{getWorkoutMeta(workout)}</p>
                  </div>
                  <Badge className="admin-shell-workouts-status-badge admin-shell-workouts-status-badge-inactive normal-case tracking-normal">
                    Delete
                  </Badge>
                </div>
              ))}
              {hiddenWorkoutCount > 0 ? (
                <p className="px-1 text-xs font-medium text-[var(--admin-dashboard-card-muted)]">+ {hiddenWorkoutCount} more</p>
              ) : null}
            </div>
          ) : null}

          {message ? (
            <p className="admin-shell-workout-editor-message rounded-[12px] px-4 py-3 text-sm">
              {message}
            </p>
          ) : null}
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
            onClick={onConfirm}
            disabled={isDeleting || workoutCount === 0}
          >
            {isDeleting ? 'Deleting...' : 'Delete workouts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
