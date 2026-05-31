'use client'

import { useEffect, useState } from 'react'

import WorkoutTrainingBuilder from '@/components/admin/workout-training-builder'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Textarea from '@/components/ui/textarea'

function FieldLabel({ children, htmlFor }) {
  return (
    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

function FieldInput({ id, value, onChange, placeholder = '' }) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] outline-none placeholder:text-[var(--admin-dashboard-card-muted)] focus:border-[#3BE0AF]"
      placeholder={placeholder}
    />
  )
}

const WORKOUT_TEMPLATE_SAVE_UNAVAILABLE_MESSAGE = 'No workout template save endpoint is wired yet.'

function UnsupportedFieldNote() {
  return <p className="text-xs text-[var(--admin-dashboard-card-muted)]">This field is visible for layout parity, but it does not save in v1.</p>
}

export default function WorkoutEditorDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  detailsValues,
  onDetailsChange,
  trainingSections,
  onTrainingSectionsChange,
  showTrainingTab = true,
  primaryActionLabel,
  onPrimaryAction,
  onDelete = null,
  focusAreaOptions = [],
  statusOptions = [],
  saveDisclaimer = '',
  errorMessage = '',
}) {
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (!open || !showTrainingTab) {
      setActiveTab('details')
      return
    }

    setActiveTab('details')
  }, [mode, open, showTrainingTab])

  function updateDetailsField(field, value) {
    onDetailsChange((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        pageScrollable
        className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)] sm:max-w-[760px]"
      >
        <div className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-5 px-6 py-6">
          {saveDisclaimer ? (
            <p className="rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-muted)]">
              {saveDisclaimer}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="admin-shell-workout-editor-message rounded-[12px] px-4 py-3 text-sm">
              {errorMessage}
            </p>
          ) : null}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="grid gap-5 admin-shell-athletes-create-tabs">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {showTrainingTab ? <TabsTrigger value="training">Training</TabsTrigger> : null}
            </TabsList>

            <TabsContent value="details" className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-name">Name</FieldLabel>
                  <FieldInput
                    id="create-workout-name"
                    value={detailsValues.name}
                    onChange={(value) => updateDetailsField('name', value)}
                    placeholder="Enter workout name"
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-duration">Duration</FieldLabel>
                  <FieldInput
                    id="create-workout-duration"
                    value={detailsValues.duration}
                    onChange={(value) => updateDetailsField('duration', value)}
                    placeholder="60 min"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="create-workout-thumbnail">Thumbnail</FieldLabel>
                <CompactFileUpload
                  id="create-workout-thumbnail"
                  buttonLabel="Choose file"
                  helperText="Drop a workout thumbnail here or click to browse. This field is not saved until workout template writes are wired."
                  fileName={detailsValues.thumbnailName}
                  onFileChange={(file) => updateDetailsField('thumbnailName', file?.name ?? '')}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-status">Status</FieldLabel>
                  <Select value={detailsValues.status} onValueChange={(value) => updateDetailsField('status', value)}>
                    <SelectTrigger id="create-workout-status" className="h-11 rounded-[12px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(statusOptions.length ? statusOptions : [
                        { value: 'active', label: 'Active' },
                        { value: 'draft', label: 'Draft' },
                        { value: 'archived', label: 'Archived' },
                      ]).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-focus-area">Focus area</FieldLabel>
                  <Select value={detailsValues.focusArea} onValueChange={(value) => updateDetailsField('focusArea', value)}>
                    <SelectTrigger id="create-workout-focus-area" className="h-11 rounded-[12px]">
                      <SelectValue placeholder="Select focus area" />
                    </SelectTrigger>
                    <SelectContent>
                      {focusAreaOptions.length ? focusAreaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      )) : (
                        <SelectItem value="none">No focus areas available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="create-workout-description">Description</FieldLabel>
                <Textarea
                  id="create-workout-description"
                  value={detailsValues.description}
                  onChange={(event) => updateDetailsField('description', event.target.value)}
                  className="min-h-[140px] rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                  placeholder="Add a short description for this workout"
                />
              </div>

              <div className="grid gap-2 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3">
                <FieldLabel>Unsupported template fields</FieldLabel>
                <UnsupportedFieldNote />
              </div>
            </TabsContent>

            {showTrainingTab ? (
              <TabsContent value="training" className="grid gap-5">
                <WorkoutTrainingBuilder sections={trainingSections} onSectionsChange={onTrainingSectionsChange} />
              </TabsContent>
            ) : null}
          </Tabs>
        </div>

        <DialogFooter className="shrink-0 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {onDelete ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-[12px] min-h-[40px]"
                onClick={onDelete}
              >
                Delete
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
              onClick={onPrimaryAction}
              disabled={!onPrimaryAction}
            >
              {primaryActionLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
