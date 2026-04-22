import test from 'node:test'
import assert from 'node:assert/strict'
import { getProgressSurfaceModel, getPlaceholderSurfaceModel } from '../apps/mobile/src/progress/index.js'
import { getProgressSections, getPlaceholderSections } from '../apps/mobile/src/screens/surface-sections.js'

test('getProgressSections converts the progress surface model into renderable sections', () => {
  const progressModel = getProgressSurfaceModel()
  const sections = getProgressSections(progressModel)

  assert.equal(sections.length, 7)
  assert.equal(sections[0].type, 'header')
  assert.equal(sections[1].type, 'metrics-grid')
  assert.equal(sections[1].items.length, 3)
  assert.equal(sections[2].title, 'Training load')
  assert.equal(sections[3].rows[0].title, 'Quads')
  assert.equal(sections[5].type, 'body-with-rows')
  assert.equal(sections[5].title, 'Recent momentum')
  assert.equal(sections[6].type, 'body-with-rows')
  assert.equal(sections[6].title, 'Exercise breakdown')
})

test('getPlaceholderSections creates a single simple section for placeholder tabs', () => {
  const placeholder = getPlaceholderSurfaceModel('Inbox', 'Messages and reminders will live here later.')
  const sections = getPlaceholderSections(placeholder)

  assert.equal(sections.length, 1)
  assert.equal(sections[0].type, 'body')
  assert.equal(sections[0].title, 'Inbox')
  assert.equal(sections[0].body, 'Messages and reminders will live here later.')
})
