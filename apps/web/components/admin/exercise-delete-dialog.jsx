'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ExerciseDeleteDialog({
  open,
  onOpenChange,
  exerciseName = '',
  isDeleting = false,
  errorMessage = '',
  onConfirmDelete = () => {},
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Delete exercise</DialogTitle>
          <DialogDescription>This exercise will be permanently deleted.</DialogDescription>
        </DialogHeader>
        {exerciseName ? <p className="text-sm text-[var(--admin-dashboard-card-muted)]">{exerciseName}</p> : null}
        {errorMessage ? <p className="admin-shell-workout-editor-message rounded-[12px] px-4 py-3 text-sm">{errorMessage}</p> : null}
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
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete exercise'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
