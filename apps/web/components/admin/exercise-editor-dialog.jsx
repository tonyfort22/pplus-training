'use client'

import { useEffect, useState } from 'react'

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
import MultiCombobox from '@/components/ui/multi-combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Textarea from '@/components/ui/textarea'
import AvatarFileUpload from '@/components/ui/avatar-file-upload'

function FieldLabel({ children, htmlFor }) {
  return (
    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

function FieldInput({ id, value, onChange, placeholder = '', disabled = false }) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] outline-none placeholder:text-[var(--admin-dashboard-card-muted)] focus:border-[var(--admin-shell-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}

function UnsupportedFieldNote() {
  return <p className="text-xs text-[var(--admin-dashboard-card-muted)]">This field is visible for layout parity, but it does not save in v1.</p>
}

export default function ExerciseEditorDialog({
  open,
  onOpenChange,
  mode = 'create',
  values,
  onValuesChange,
  equipmentOptions = [],
  muscleOptions = [],
  categoryOptions = [],
  difficultyOptions = [],
  statusOptions = [],
  errorMessage = '',
  isSaving = false,
  saveDisclaimer = '',
  onThumbnailFileChange = () => {},
  onVideoFileChange = () => {},
  onPrimaryAction = null,
}) {
  const [activeTab, setActiveTab] = useState('details')
  const isV1UnsupportedFieldDisabled = true

  useEffect(() => {
    if (!open) {
      setActiveTab('details')
    }
  }, [open, mode])

  function updateField(field, value) {
    onValuesChange((current) => ({
      ...current,
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
            <DialogTitle>{mode === 'edit' ? 'Edit exercise' : 'Create exercise'}</DialogTitle>
            <DialogDescription>
              {mode === 'edit'
                ? 'Update the exercise details, media, and muscle configuration.'
                : 'Create a new exercise with media, metrics, and muscle configuration.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-5 px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="grid gap-5 admin-shell-athletes-create-tabs">
            <TabsList className="admin-shell-exercise-dialog-tabs-list">
              <TabsTrigger value="details" className="admin-shell-exercise-dialog-tabs-trigger">Details</TabsTrigger>
              <TabsTrigger value="muscles" className="admin-shell-exercise-dialog-tabs-trigger">Muscles</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="grid gap-5">
              <div className="grid gap-2">
                <FieldLabel htmlFor="exercise-name">Name</FieldLabel>
                <FieldInput id="exercise-name" value={values.name} onChange={(value) => updateField('name', value)} placeholder="Enter exercise name" />
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="exercise-video">Video</FieldLabel>
                <CompactFileUpload
                  id="exercise-video"
                  accept="video/mp4"
                  buttonLabel="Upload video"
                  helperText={values.videoUrl ? 'Replace saved video' : 'MP4 upload'}
                  fileName={values.videoName || values.videoUrl || ''}
                  onFileChange={onVideoFileChange}
                  disabled={isSaving}
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="exercise-thumbnail">Thumbnail</FieldLabel>
                <AvatarFileUpload
                  id="exercise-thumbnail"
                  label="Thumbnail"
                  helperText={values.thumbnailUrl ? 'Replace saved thumbnail' : 'Avatar upload'}
                  fileName={values.thumbnailName || values.thumbnailUrl || ''}
                  previewLabel={values.name || 'Exercise thumbnail'}
                  onFileChange={onThumbnailFileChange}
                  disabled={isSaving}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-sets">Sets</FieldLabel>
                  <FieldInput id="exercise-sets" value={values.sets} onChange={(value) => updateField('sets', value)} placeholder="4" disabled={isV1UnsupportedFieldDisabled} />
                  <UnsupportedFieldNote />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-reps">Reps</FieldLabel>
                  <FieldInput id="exercise-reps" value={values.reps} onChange={(value) => updateField('reps', value)} placeholder="8" disabled={isV1UnsupportedFieldDisabled} />
                  <UnsupportedFieldNote />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-distance">Distance</FieldLabel>
                  <FieldInput id="exercise-distance" value={values.distance} onChange={(value) => updateField('distance', value)} placeholder="20 m" disabled={isV1UnsupportedFieldDisabled} />
                  <UnsupportedFieldNote />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-weights">Weights</FieldLabel>
                  <FieldInput id="exercise-weights" value={values.weights} onChange={(value) => updateField('weights', value)} placeholder="40 lb" disabled={isV1UnsupportedFieldDisabled} />
                  <UnsupportedFieldNote />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-duration">Duration</FieldLabel>
                  <FieldInput id="exercise-duration" value={values.duration} onChange={(value) => updateField('duration', value)} placeholder="30 sec" disabled={isV1UnsupportedFieldDisabled} />
                  <UnsupportedFieldNote />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-rest">Rest</FieldLabel>
                  <FieldInput id="exercise-rest" value={values.rest} onChange={(value) => updateField('rest', value)} placeholder="60 sec" disabled={isV1UnsupportedFieldDisabled} />
                  <UnsupportedFieldNote />
                </div>
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="exercise-tempo">Tempo</FieldLabel>
                <FieldInput id="exercise-tempo" value={values.tempo} onChange={(value) => updateField('tempo', value)} placeholder="3-1-1-0" disabled={isV1UnsupportedFieldDisabled} />
                <UnsupportedFieldNote />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-category">Category</FieldLabel>
                  <Select value={values.category} onValueChange={(value) => updateField('category', value)}>
                    <SelectTrigger id="exercise-category" className="h-11 rounded-[12px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-difficulty">Difficulty</FieldLabel>
                  <Select value={values.difficulty} onValueChange={(value) => updateField('difficulty', value)}>
                    <SelectTrigger id="exercise-difficulty" className="h-11 rounded-[12px]">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-status">Status</FieldLabel>
                  <Select value={values.status} onValueChange={(value) => updateField('status', value)} disabled={isV1UnsupportedFieldDisabled}>
                    <SelectTrigger id="exercise-status" className="h-11 rounded-[12px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <UnsupportedFieldNote />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-equipment">Equipments needed</FieldLabel>
                  <MultiCombobox
                    id="exercise-equipment"
                    placeholder="Choose some options..."
                    searchPlaceholder="Search equipment..."
                    maxVisibleBadges={3}
                    options={equipmentOptions}
                    selectedValues={values.equipmentNeeded}
                    onSelectedValuesChange={(equipmentNeeded) => updateField('equipmentNeeded', equipmentNeeded)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-primary-muscle">Primary muscle</FieldLabel>
                  <Select value={values.primaryMuscleId} onValueChange={(value) => updateField('primaryMuscleId', value)}>
                    <SelectTrigger id="exercise-primary-muscle" className="h-11 rounded-[12px]">
                      <SelectValue placeholder="Select primary muscle" />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-secondary-muscles">Secondary muscles</FieldLabel>
                  <MultiCombobox
                    id="exercise-secondary-muscles"
                    placeholder="Choose some options..."
                    searchPlaceholder="Search muscles..."
                    maxVisibleBadges={3}
                    options={muscleOptions}
                    selectedValues={values.secondaryMuscleIds}
                    onSelectedValuesChange={(secondaryMuscleIds) => updateField('secondaryMuscleIds', secondaryMuscleIds)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="exercise-description">Description</FieldLabel>
                <Textarea
                  id="exercise-description"
                  value={values.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className="min-h-[140px] rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[#3BE0AF]/20"
                  placeholder="Add a short description for this exercise"
                />
              </div>

              {saveDisclaimer ? (
                <div className="rounded-[16px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-sm leading-6 text-[var(--admin-dashboard-card-muted)]">
                  <p className="font-medium text-[var(--admin-shell-text-strong)]">What actually saves in v1</p>
                  <p className="mt-2">{saveDisclaimer}</p>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="muscles" className="grid gap-4">
              <div className="rounded-[16px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-sm leading-6 text-[var(--admin-dashboard-card-muted)]">
                <p className="font-medium text-[var(--admin-shell-text-strong)]">Current muscle-mapping reality</p>
                <p className="mt-2">
                  V1 saves honest primary and secondary role mappings into <code>exercise_muscle_maps</code> from the Details tab.
                </p>
                <p className="mt-2">
                  The database already supports <code>exercise_muscle_maps</code> and <code>exercise_sub_muscle_maps</code> with role,
                  sort order, and <code>contribution_percent</code>.
                </p>
                <p className="mt-2">
                  But weighted contribution inputs stay informational for now. Primary muscle alone is not enough for the planned algorithm. To make
                  that honest, we would also need explicit <code>contribution_percent</code> values for secondary and optional sub-muscle rows, or a
                  separate template rules table that derives them.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="shrink-0 gap-3 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end">
          {errorMessage ? <p className="mr-auto text-sm text-[#F38BA8]">{errorMessage}</p> : null}
          <Button
            type="button"
            variant="outline"
            className="rounded-[12px] min-h-[40px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
            onClick={onPrimaryAction}
            disabled={isSaving}
          >
            {isSaving ? (mode === 'edit' ? 'Saving...' : 'Creating...') : mode === 'edit' ? 'Save changes' : 'Create exercise'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
