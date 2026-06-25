'use client'

import { Bot, ChevronDown, Upload } from 'lucide-react'

import { ADMIN_AI_BUTTON_CLASS_NAME, ADMIN_AI_BUTTON_STYLE } from '@/components/admin/ui/ai-button-style'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { MediaPlayer, MediaPlayerControls, MediaPlayerVideo } from '@/components/ui/media-player'
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

function ExerciseGeneratedMediaPreview({
  values,
  onThumbnailFileChange = () => {},
  onVideoFileChange = () => {},
  isSaving = false,
}) {
  const hasThumbnail = Boolean(values.thumbnailUrl)
  const hasVideo = Boolean(values.videoUrl)
  const hasGeneratedMedia = hasThumbnail || hasVideo

  if (!hasGeneratedMedia) return null

  return (
    <Accordion
      type="single"
      collapsible
      className="admin-shell-exercises-media-preview overflow-hidden rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)]"
    >
      <AccordionItem value="medias-preview">
        <AccordionTrigger className="px-4 py-4">
          <span className="flex flex-col gap-1">
            <span>Medias preview</span>
            <span className="text-xs font-normal text-[var(--admin-dashboard-card-muted)]">
              Generated thumbnail and MP4 preview
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-5">
          {hasThumbnail ? (
            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--admin-dashboard-card-muted)]">Thumbnail</p>
              <div className="overflow-hidden rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)]">
                <div className="group relative aspect-[21/9] w-full overflow-hidden bg-[var(--admin-shell-surface-muted)]">
                  <img
                    src={values.thumbnailUrl}
                    alt={values.name ? `${values.name} thumbnail preview` : 'Exercise thumbnail preview'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
                    <input
                      id="exercise-thumbnail-cover-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={isSaving}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) onThumbnailFileChange(file)
                        event.target.value = ''
                      }}
                    />
                    <label
                      htmlFor="exercise-thumbnail-cover-upload"
                      aria-disabled={isSaving}
                      className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-white/90 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
                    >
                      <Upload className="size-4" aria-hidden="true" />
                      Change Thumbnail
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-[var(--admin-dashboard-card-muted)]">
                  <span className="truncate" title={values.thumbnailName || values.thumbnailUrl}>
                    {values.thumbnailName || 'Generated thumbnail'}
                  </span>
                  <span>Cover preview</span>
                </div>
              </div>
            </div>
          ) : null}

          {hasVideo ? (
            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--admin-dashboard-card-muted)]">Video MP4</p>
              <MediaPlayer>
                <MediaPlayerVideo poster={values.thumbnailUrl || ''} aria-label={values.name ? `${values.name} video preview` : 'Exercise video preview'}>
                  <source src={values.videoUrl} type="video/mp4" />
                </MediaPlayerVideo>
                <MediaPlayerControls videoUrl={values.videoUrl} />
              </MediaPlayer>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-xs text-[var(--admin-dashboard-card-muted)]">
                <span className="truncate" title={values.videoName || values.videoUrl}>
                  {values.videoName || 'Generated MP4'}
                </span>
                <input
                  id="exercise-video-mp4-upload"
                  type="file"
                  accept="video/mp4"
                  className="sr-only"
                  disabled={isSaving}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) onVideoFileChange(file)
                    event.target.value = ''
                  }}
                />
                <label
                  htmlFor="exercise-video-mp4-upload"
                  aria-disabled={isSaving}
                  className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--admin-dashboard-card-border)] px-3 text-xs font-medium text-[var(--admin-dashboard-card-text)] transition-colors hover:border-[var(--admin-shell-accent)] hover:text-[var(--admin-shell-accent)] aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  Replace MP4
                </label>
              </div>
            </div>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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
  isGeneratingYoutubeMedia = false,
  onGenerateYoutubeMedia = () => {},
  onThumbnailFileChange = () => {},
  onVideoFileChange = () => {},
  onPrimaryAction = null,
  onEditWithAi = () => {},
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
        className="admin-shell-exercises-create-sheet !w-[min(1280px,calc(100vw-48px))] !max-w-[min(1280px,calc(100vw-48px))] gap-0 border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)]"
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
                <FieldLabel htmlFor="exercise-youtube-link">YouTube link</FieldLabel>
                <InputGroup className="admin-shell-exercise-youtube-input-group h-11 rounded-[12px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] has-disabled:bg-[var(--admin-dashboard-control-bg)] has-disabled:opacity-100 has-[[data-slot=input-group-control]:focus-visible]:border-[var(--admin-shell-accent)] has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                  <InputGroupInput
                    id="exercise-youtube-link"
                    value={values.youtubeLink || ''}
                    onChange={(event) => updateField('youtubeLink', event.target.value)}
                    placeholder="Paste a YouTube link"
                    className="h-full px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)]"
                  />
                  <InputGroupAddon align="inline-end" className="pr-2.5">
                    <InputGroupButton
                      type="button"
                      size="sm"
                      className={`h-8 rounded-[10px] px-3 text-sm font-medium ${ADMIN_AI_BUTTON_CLASS_NAME}`}
                      style={ADMIN_AI_BUTTON_STYLE}
                      onClick={onGenerateYoutubeMedia}
                      disabled={isSaving || isGeneratingYoutubeMedia || !values.youtubeLink?.trim()}
                    >
                      <Bot className="size-4" aria-hidden="true" />
                      {isGeneratingYoutubeMedia ? 'Creating medias...' : 'Generate content with AI'}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="exercise-video-url">MP4 media URL</FieldLabel>
                <FieldInput
                  id="exercise-video-url"
                  value={values.videoUrl || ''}
                  onChange={(value) => updateField('videoUrl', value)}
                  placeholder="https://example.supabase.co/storage/v1/object/public/exercise-videos/example.mp4"
                  disabled={isSaving}
                />
              </div>

              <ExerciseGeneratedMediaPreview
                values={values}
                onThumbnailFileChange={onThumbnailFileChange}
                onVideoFileChange={onVideoFileChange}
                isSaving={isSaving}
              />

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
            variant="outline"
            className={`rounded-[12px] min-h-[40px] ${ADMIN_AI_BUTTON_CLASS_NAME}`}
            style={ADMIN_AI_BUTTON_STYLE}
            onClick={onEditWithAi}
            disabled={isSaving}
          >
            <Bot className="size-4" aria-hidden="true" />
            Edit with AI
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
