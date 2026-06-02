'use client'

import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import CompactFileUpload from '@/components/ui/compact-file-upload'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import MultiCombobox from '@/components/ui/multi-combobox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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

function formatDropdownSelectLabel(options = [], value = '', placeholder = 'Select option') {
  return options.find((option) => option.value === value)?.label || placeholder
}

function DropdownSelectField({ id, value, options = [], placeholder, onValueChange, disabled = false }) {
  const selectedLabel = formatDropdownSelectLabel(options, value, placeholder)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id={id}
          type="button"
          className="admin-shell-exercise-select-trigger admin-shell-athletes-example-columns-button admin-shell-athletes-create-select-trigger w-full"
          aria-label={placeholder}
          disabled={disabled}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={option.value === value ? 'text-[var(--admin-shell-accent)]' : ''}
            onSelect={() => onValueChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
  onThumbnailFileChange = () => {},
  onVideoFileChange = () => {},
  onPrimaryAction = null,
}) {
  function updateField(field, value) {
    onValuesChange((current) => ({
      ...current,
      [field]: value,
    }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="admin-shell-exercises-create-sheet !max-w-[var(--container-lg)] gap-0 border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)]"
      >
        <div className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
          <SheetHeader className="p-0 pr-10">
            <SheetTitle>{mode === 'edit' ? 'Edit exercise' : 'Create exercise'}</SheetTitle>
            <SheetDescription>
              {mode === 'edit' ? 'Update out the information below.' : 'Fill out the information below.'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-5">
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
                  <FieldInput id="exercise-sets" value={values.sets} onChange={(value) => updateField('sets', value)} placeholder="4" />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-reps">Reps</FieldLabel>
                  <FieldInput id="exercise-reps" value={values.reps} onChange={(value) => updateField('reps', value)} placeholder="8" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-distance">Distance</FieldLabel>
                  <FieldInput id="exercise-distance" value={values.distance} onChange={(value) => updateField('distance', value)} placeholder="20 m" />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-weights">Weights</FieldLabel>
                  <FieldInput id="exercise-weights" value={values.weights} onChange={(value) => updateField('weights', value)} placeholder="40 lb" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-duration">Duration</FieldLabel>
                  <FieldInput id="exercise-duration" value={values.duration} onChange={(value) => updateField('duration', value)} placeholder="30 sec" />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-rest">Rest</FieldLabel>
                  <FieldInput id="exercise-rest" value={values.rest} onChange={(value) => updateField('rest', value)} placeholder="60 sec" />
                </div>
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="exercise-tempo">Tempo</FieldLabel>
                <FieldInput id="exercise-tempo" value={values.tempo} onChange={(value) => updateField('tempo', value)} placeholder="3-1-1-0" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-category">Category</FieldLabel>
                  <DropdownSelectField
                    id="exercise-category"
                    value={values.category}
                    options={categoryOptions}
                    placeholder="Select category"
                    onValueChange={(value) => updateField('category', value)}
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-difficulty">Difficulty</FieldLabel>
                  <DropdownSelectField
                    id="exercise-difficulty"
                    value={values.difficulty}
                    options={difficultyOptions}
                    placeholder="Select difficulty"
                    onValueChange={(value) => updateField('difficulty', value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-status">Status</FieldLabel>
                  <DropdownSelectField
                    id="exercise-status"
                    value={values.status}
                    options={statusOptions}
                    placeholder="Select status"
                    onValueChange={(value) => updateField('status', value)}
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-equipment">Equipments needed</FieldLabel>
                  <MultiCombobox
                    id="exercise-equipment"
                    className="admin-shell-exercise-combobox"
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
                  <DropdownSelectField
                    id="exercise-primary-muscle"
                    value={values.primaryMuscleId}
                    options={muscleOptions}
                    placeholder="Select primary muscle"
                    onValueChange={(value) => updateField('primaryMuscleId', value)}
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="exercise-secondary-muscles">Secondary muscles</FieldLabel>
                  <MultiCombobox
                    id="exercise-secondary-muscles"
                    className="admin-shell-exercise-combobox"
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
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
