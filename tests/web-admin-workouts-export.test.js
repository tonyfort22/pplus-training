import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildWorkoutsExportRows,
  buildWorkoutsExportCsv,
  getWorkoutsExportFileName,
  workoutExportColumns,
} from '../apps/web/lib/admin-workouts-export.js'

test('workouts export builds quoted CSV with all testing-ready admin columns', () => {
  assert.deepEqual(workoutExportColumns, [
    'Workout template ID',
    'Coach ID',
    'Workout name',
    'Description',
    'Category',
    'Focus area',
    'Training type',
    'Duration minutes',
    'Display duration',
    'Sections',
    'Exercises',
    'Sets',
    'Thumbnail URL',
    'Background color',
    'Text color',
    'Created at',
    'Updated at',
    'Status',
  ])

  const csv = buildWorkoutsExportCsv([
    {
      id: 'workout-1',
      coachId: 'coach-1',
      name: 'Speed, Power "A"',
      description: 'High tempo\nkeep crisp',
      category: 'On ice',
      focusAreaRaw: 'speed',
      trainingType: 'speed',
      estimatedDurationMinutes: 45,
      duration: '45 min',
      sections: 2,
      exerciseCount: 6,
      setCount: 18,
      thumbnailUrl: 'https://example.com/thumb.png',
      backgroundColor: '#111827',
      textColor: '#f8fafc',
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-08T15:45:00Z',
      status: 'Active',
    },
  ])

  assert.equal(
    csv,
    '"Workout template ID","Coach ID","Workout name","Description","Category","Focus area","Training type","Duration minutes","Display duration","Sections","Exercises","Sets","Thumbnail URL","Background color","Text color","Created at","Updated at","Status"\n' +
      '"workout-1","coach-1","Speed, Power ""A""","High tempo\nkeep crisp","On ice","speed","speed","45","45 min","2","6","18","https://example.com/thumb.png","#111827","#f8fafc","2026-06-01T10:00:00Z","2026-06-08T15:45:00Z","Active"',
  )
})

test('workouts export row shape preserves hidden ids counts colors and raw taxonomy fields', () => {
  assert.deepEqual(buildWorkoutsExportRows([
    {
      id: 'template-speed-1',
      coachId: 'coach-1',
      name: 'Acceleration block',
      description: 'First-step speed emphasis',
      category: 'On ice',
      focusAreaRaw: 'speed',
      focusArea: 'Speed',
      trainingType: 'speed-development',
      estimatedDurationMinutes: 50,
      duration: '50 min',
      sections: 3,
      exerciseCount: 7,
      setCount: 22,
      thumbnailUrl: 'https://example.com/workout.png',
      backgroundColor: '#003F1D',
      textColor: '#D9EDDF',
      createdAt: '2026-06-01T13:30:00.000Z',
      updatedAt: '2026-06-03T09:15:00.000Z',
      status: 'Active',
      trainingSections: [{ id: 'section-1' }, { id: 'section-2' }, { id: 'section-3' }],
    },
    {
      id: 'template-empty-1',
      coachId: 'coach-2',
      name: 'Draft shell',
      description: '',
      category: '',
      focusArea: 'General',
      trainingType: '',
      estimatedDurationMinutes: '',
      duration: '--',
      sections: '--',
      exerciseCount: 0,
      setCount: 0,
      thumbnailUrl: '',
      backgroundColor: '',
      textColor: '',
      createdAt: '2026-06-05T13:30:00.000Z',
      updatedAt: '',
      status: 'Draft',
      trainingSections: [],
    },
  ]), [
    [
      'template-speed-1',
      'coach-1',
      'Acceleration block',
      'First-step speed emphasis',
      'On ice',
      'speed',
      'speed-development',
      50,
      '50 min',
      3,
      7,
      22,
      'https://example.com/workout.png',
      '#003F1D',
      '#D9EDDF',
      '2026-06-01T13:30:00.000Z',
      '2026-06-03T09:15:00.000Z',
      'Active',
    ],
    [
      'template-empty-1',
      'coach-2',
      'Draft shell',
      '',
      '',
      'General',
      '',
      '',
      '--',
      '--',
      0,
      0,
      '',
      '',
      '',
      '2026-06-05T13:30:00.000Z',
      '',
      'Draft',
    ],
  ])
})

test('workouts export filename is stable and date-scoped', () => {
  assert.equal(getWorkoutsExportFileName(new Date('2026-06-08T15:45:00.000Z')), 'pplus-workouts-export-2026-06-08.csv')
})
