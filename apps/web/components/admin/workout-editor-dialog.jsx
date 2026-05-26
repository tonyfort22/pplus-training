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

function FieldLabel({ children, htmlFor }) {
  return (
    <label className="text-sm font-medium text-[#DCE6F8]" htmlFor={htmlFor}>
      {children}
    </label>
  )
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
        className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[760px]"
      >
        <div className="shrink-0 border-b border-[#24334A] px-6 py-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-5 px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="grid gap-5">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {showTrainingTab ? <TabsTrigger value="training">Training</TabsTrigger> : null}
            </TabsList>

            <TabsContent value="details" className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-name">Name</FieldLabel>
                  <input
                    id="create-workout-name"
                    type="text"
                    value={detailsValues.name}
                    onChange={(event) => updateDetailsField('name', event.target.value)}
                    className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none placeholder:text-[#70809E] focus:border-[#3BE0AF]"
                    placeholder="Enter workout name"
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-duration">Duration</FieldLabel>
                  <input
                    id="create-workout-duration"
                    type="text"
                    value={detailsValues.duration}
                    onChange={(event) => updateDetailsField('duration', event.target.value)}
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
                  fileName={detailsValues.thumbnailName}
                  onFileChange={(file) => updateDetailsField('thumbnailName', file?.name ?? '')}
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="create-workout-program">Program</FieldLabel>
                <Select value={detailsValues.program} onValueChange={(value) => updateDetailsField('program', value)}>
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
                  <Select value={detailsValues.trainer} onValueChange={(value) => updateDetailsField('trainer', value)}>
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
                    selectedValues={detailsValues.equipmentNeeded}
                    onSelectedValuesChange={(equipmentNeeded) => updateDetailsField('equipmentNeeded', equipmentNeeded)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="create-workout-category">Category</FieldLabel>
                  <Select value={detailsValues.category} onValueChange={(value) => updateDetailsField('category', value)}>
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
                  <Select value={detailsValues.difficulty} onValueChange={(value) => updateDetailsField('difficulty', value)}>
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
                  <Select value={detailsValues.status} onValueChange={(value) => updateDetailsField('status', value)}>
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
                  <Select value={detailsValues.focusArea} onValueChange={(value) => updateDetailsField('focusArea', value)}>
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
                  value={detailsValues.description}
                  onChange={(event) => updateDetailsField('description', event.target.value)}
                  className="min-h-[140px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                  placeholder="Add a short description for this workout"
                />
              </div>
            </TabsContent>

            {showTrainingTab ? (
              <TabsContent value="training" className="grid gap-5">
                <WorkoutTrainingBuilder sections={trainingSections} onSectionsChange={onTrainingSectionsChange} />
              </TabsContent>
            ) : null}
          </Tabs>
        </div>

        <DialogFooter className="shrink-0 border-t border-[#24334A] px-6 py-5 sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {onDelete ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
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
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
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
