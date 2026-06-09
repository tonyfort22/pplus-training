import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildExercisesExportCsv,
  exerciseExportColumns,
  getExercisesExportFileName,
} from '../apps/web/lib/admin-exercises-export.js'

test('exercises export builds quoted CSV with all testing-ready admin columns', () => {
  assert.deepEqual(exerciseExportColumns, [
    'Exercise ID',
    'Exercise name',
    'Description',
    'Primary muscle',
    'Secondary muscles',
    'Equipment',
    'Movement types',
    'Movement pattern',
    'Category',
    'Difficulty',
    'Total sets',
    'Default sets',
    'Default reps',
    'Default duration',
    'Default distance',
    'Default weight',
    'Default rest',
    'Default tempo',
    'Thumbnail URL',
    'Video URL',
    'Created at',
    'Status',
  ])

  const csv = buildExercisesExportCsv([
    {
      id: 'exercise-1',
      name: 'Skater, Jump "A"',
      description: 'Explode\nland soft',
      muscleNames: ['Glutes', 'Quads'],
      equipmentNeeded: ['Dumbbell', 'Cable'],
      movementTypeValues: ['Lower body', 'Power'],
      movementPattern: 'squat',
      category: 'strength',
      difficulty: 'advanced',
      totalSetCount: 12,
      sets: '3',
      reps: '8',
      duration: '30s',
      distance: '10m',
      weights: '25lb',
      rest: '60s',
      tempo: '2-1-X',
      thumbnailUrl: 'https://example.com/thumb.png',
      videoUrl: 'https://example.com/video.mp4',
      createdAt: '2026-06-01T10:00:00Z',
      status: 'active',
    },
  ])

  assert.equal(
    csv,
    '"Exercise ID","Exercise name","Description","Primary muscle","Secondary muscles","Equipment","Movement types","Movement pattern","Category","Difficulty","Total sets","Default sets","Default reps","Default duration","Default distance","Default weight","Default rest","Default tempo","Thumbnail URL","Video URL","Created at","Status"\n' +
      '"exercise-1","Skater, Jump ""A""","Explode\nland soft","Glutes","Quads","Dumbbell, Cable","Lower body, Power","squat","strength","advanced","12","3","8","30s","10m","25lb","60s","2-1-X","https://example.com/thumb.png","https://example.com/video.mp4","2026-06-01T10:00:00Z","active"',
  )
})

test('exercises export falls back from arrays to scalar fields and uses stable date filename', () => {
  const csv = buildExercisesExportCsv([
    {
      id: 'exercise-2',
      name: 'Push up',
      muscle: 'Chest',
      equipment: 'Bodyweight',
      status: 'draft',
    },
  ])

  assert.match(csv, /"exercise-2","Push up","","Chest","","Bodyweight"/)
  assert.equal(getExercisesExportFileName(new Date('2026-06-08T15:45:00.000Z')), 'pplus-exercises-export-2026-06-08.csv')
})
