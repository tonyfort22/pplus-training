import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildProgramsExportRows,
  buildProgramsExportCsv,
  getProgramsExportFileName,
  programExportColumns,
} from '../apps/web/lib/admin-programs-export.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const programsDataTablePath = resolve(repoRoot, 'apps/web/components/admin/programs-data-table.jsx')

test('programs export builds quoted CSV with all testing-ready admin columns', () => {
  assert.deepEqual(programExportColumns, [
    'Program ID',
    'Athlete ID',
    'Assigned athlete IDs',
    'Coach ID',
    'Program type',
    'Program',
    'Athletes',
    'Week count',
    'Duration',
    'Workouts',
    'Exercises',
    'Created date',
    'Created at',
    'Start date',
    'End date',
    'Description',
    'Status',
  ])

  const csv = buildProgramsExportCsv([
    {
      id: 'program-1',
      athleteId: 'athlete-1',
      assignedAthleteIds: ['athlete-1', 'athlete-2'],
      coachId: 'coach-1',
      programType: 'Assigned',
      name: 'Power, Speed "Elite"',
      athletesLabel: 'Tony Fortugno',
      weekCount: 10,
      duration: '10 weeks',
      workouts: '40',
      exercises: '287',
      createdDate: '2026-04-25',
      createdAt: '2026-04-25T16:00:00.000Z',
      startDate: '2026-05-01',
      endDate: '2026-07-10',
      description: 'Phase 1, testing',
      status: 'Active',
    },
  ])

  assert.equal(csv, [
    '"Program ID","Athlete ID","Assigned athlete IDs","Coach ID","Program type","Program","Athletes","Week count","Duration","Workouts","Exercises","Created date","Created at","Start date","End date","Description","Status"',
    '"program-1","athlete-1","athlete-1; athlete-2","coach-1","Assigned","Power, Speed ""Elite""","Tony Fortugno","10","10 weeks","40","287","2026-04-25","2026-04-25T16:00:00.000Z","2026-05-01","2026-07-10","Phase 1, testing","Active"',
  ].join('\n'))
})

test('programs export row shape preserves assignment and hidden database identifiers', () => {
  assert.deepEqual(buildProgramsExportRows([
    {
      id: 'program-assigned-1',
      athleteId: 'athlete-primary-1',
      athleteIds: ['athlete-primary-1', 'athlete-sibling-1'],
      assignedAthleteIds: ['athlete-primary-1', 'athlete-sibling-1'],
      coachId: 'coach-1',
      programType: 'Assigned',
      name: 'Assigned speed block',
      athletesLabel: 'Avery Adams + 1 more',
      weekCount: 6,
      duration: '6 weeks',
      workouts: '18',
      exercises: '96',
      createdDate: '2026-06-01',
      createdAt: '2026-06-01T14:15:00.000Z',
      startDate: '2026-06-08',
      endDate: '2026-07-19',
      description: 'Includes acceleration work',
      status: 'Active',
    },
    {
      id: 'program-unassigned-1',
      athleteId: null,
      athleteIds: [],
      assignedAthleteIds: [],
      coachId: 'coach-1',
      programType: 'Unassigned',
      name: 'Template shell',
      athletesLabel: 'Unassigned',
      weekCount: 4,
      duration: '4 weeks',
      workouts: '0',
      exercises: '0',
      createdDate: '2026-06-02',
      createdAt: '2026-06-02T14:15:00.000Z',
      startDate: '',
      endDate: '',
      description: '',
      status: 'Draft',
    },
  ]), [
    [
      'program-assigned-1',
      'athlete-primary-1',
      'athlete-primary-1; athlete-sibling-1',
      'coach-1',
      'Assigned',
      'Assigned speed block',
      'Avery Adams + 1 more',
      6,
      '6 weeks',
      '18',
      '96',
      '2026-06-01',
      '2026-06-01T14:15:00.000Z',
      '2026-06-08',
      '2026-07-19',
      'Includes acceleration work',
      'Active',
    ],
    [
      'program-unassigned-1',
      null,
      '',
      'coach-1',
      'Unassigned',
      'Template shell',
      'Unassigned',
      4,
      '4 weeks',
      '0',
      '0',
      '2026-06-02',
      '2026-06-02T14:15:00.000Z',
      '',
      '',
      '',
      'Draft',
    ],
  ])
})

test('programs export filename is stable and date-scoped', () => {
  assert.equal(getProgramsExportFileName(new Date('2026-06-08T15:45:00.000Z')), 'pplus-programs-export-2026-06-08.csv')
})

test('programs table uses shared export helpers and keeps the workflow test-ready', () => {
  const programsSource = readFileSync(programsDataTablePath, 'utf8')

  assert.match(programsSource, /from '@\/lib\/admin-programs-export'/)
  assert.match(programsSource, /buildProgramsExportCsv,[\s\S]*downloadProgramsExportFile,[\s\S]*getProgramsExportFileName,[\s\S]*programExportColumns,/)
  assert.match(programsSource, /const exportProgramsFileName = getProgramsExportFileName\(\)/)
  assert.match(programsSource, /aria-label="Program bulk actions"[\s\S]*disabled=\{selectedProgramCount === 0\}/)
  assert.match(programsSource, /<DropdownMenuLabel>\{selectedProgramCount > 0 \? 'Bulk actions' : 'Select programs first'\}<\/DropdownMenuLabel>/)
  assert.match(programsSource, /<DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" disabled=\{selectedProgramCount === 0\}[\s\S]*handleExportSelectedPrograms\(\)/)
  assert.match(programsSource, /function handleConfirmExportPrograms\(\) \{[\s\S]*if \(exportProgramsDisabled\) return[\s\S]*setIsExportingPrograms\(true\)[\s\S]*buildProgramsExportCsv\(exportProgramsToReview\)[\s\S]*fileName: exportProgramsFileName[\s\S]*text\/csv;charset=utf-8[\s\S]*Programs export ready[\s\S]*setIsExportProgramSheetOpen\(false\)[\s\S]*setSelectedExportProgramIds\(\[\]\)[\s\S]*setRowSelection\(\{\}\)/)
  assert.match(programsSource, /disabled=\{exportProgramsDisabled\}[\s\S]*onClick=\{handleConfirmExportPrograms\}[\s\S]*\{isExportingPrograms \? 'Preparing CSV\.\.\.' : 'Download CSV'\}/)
  assert.doesNotMatch(programsSource, /function exportPrograms\(selectedPrograms\)/)
  assert.doesNotMatch(programsSource, /new Blob\(\[csvRows\.join/)
})
