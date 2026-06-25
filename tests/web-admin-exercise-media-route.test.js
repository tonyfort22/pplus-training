import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { POST } from '../apps/web/app/api/admin/exercise-media/route.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const exerciseMediaRoutePath = resolve(repoRoot, 'apps/web/app/api/admin/exercise-media/route.js')
const exerciseEditorDialogPath = resolve(repoRoot, 'apps/web/components/admin/exercise-editor-dialog.jsx')
const exercisesDataTablePath = resolve(repoRoot, 'apps/web/components/admin/exercises-data-table.jsx')

function source(path) {
  assert.equal(existsSync(path), true, `${path} should exist`)
  return readFileSync(path, 'utf8')
}

function formUploadRequest({ kind = 'video', fileName = 'sled push.mp4', contentType = 'video/mp4', body = 'mp4-bytes', exerciseId = 'exercise-1' } = {}) {
  const formData = new FormData()
  formData.append('kind', kind)
  formData.append('file', new File([body], fileName, { type: contentType }))
  if (exerciseId) formData.append('exerciseId', exerciseId)

  return new Request('http://localhost/api/admin/exercise-media', {
    method: 'POST',
    body: formData,
  })
}

async function withUploadRouteEnvAndFetch(run) {
  const previousUrl = process.env.SUPABASE_URL
  const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const calls = []

  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: url.toString(), options })
    return new Response(JSON.stringify({ Key: 'uploaded-object' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  try {
    return await run(calls)
  } finally {
    if (previousUrl === undefined) {
      delete process.env.SUPABASE_URL
    } else {
      process.env.SUPABASE_URL = previousUrl
    }
    if (previousServiceRoleKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRoleKey
    }
    globalThis.fetch = previousFetch
  }
}

test('admin exercise media route uploads mp4 videos to the exercise-videos bucket and returns a preview URL', async () => {
  await withUploadRouteEnvAndFetch(async (calls) => {
    const response = await POST(formUploadRequest())
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://example.supabase.co/storage/v1/object/exercise-videos/exercise-1/sled-push.mp4')
    assert.equal(calls[0].options.method, 'POST')
    assert.equal(calls[0].options.headers.Authorization, 'Bearer service-role-key')
    assert.equal(calls[0].options.headers['Content-Type'], 'video/mp4')
    assert.equal(calls[0].options.headers['x-upsert'], 'true')
    assert.ok(calls[0].options.body instanceof Uint8Array)
    assert.deepEqual(body, {
      kind: 'video',
      bucket: 'exercise-videos',
      objectPath: 'exercise-1/sled-push.mp4',
      publicUrl: 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/sled-push.mp4',
    })
  })
})

test('admin exercise media route uploads thumbnails to the exercise-media bucket and rejects unsupported preview media', async () => {
  await withUploadRouteEnvAndFetch(async (calls) => {
    const thumbnailResponse = await POST(formUploadRequest({
      kind: 'thumbnail',
      fileName: 'cover image.webp',
      contentType: 'image/webp',
      body: 'image-bytes',
    }))
    const thumbnailBody = await thumbnailResponse.json()

    assert.equal(thumbnailResponse.status, 200)
    assert.equal(calls[0].url, 'https://example.supabase.co/storage/v1/object/exercise-media/exercise-1/cover-image.webp')
    assert.equal(calls[0].options.headers['Content-Type'], 'image/webp')
    assert.equal(thumbnailBody.publicUrl, 'https://example.supabase.co/storage/v1/object/public/exercise-media/exercise-1/cover-image.webp')

    const unsupportedResponse = await POST(formUploadRequest({
      kind: 'video',
      fileName: 'demo.mov',
      contentType: 'video/quicktime',
    }))
    const unsupportedBody = await unsupportedResponse.json()

    assert.equal(unsupportedResponse.status, 400)
    assert.deepEqual(unsupportedBody, { error: 'Unsupported video content type: video/quicktime' })
    assert.equal(calls.length, 1)
  })
})

test('exercise media upload and preview UI uses the upload route before showing thumbnail and mp4 previews', () => {
  const routeSource = source(exerciseMediaRoutePath)
  const editorSource = source(exerciseEditorDialogPath)
  const tableSource = source(exercisesDataTablePath)

  assert.match(routeSource, /formData\.get\('kind'\)/)
  assert.match(routeSource, /formData\.get\('file'\)/)
  assert.match(routeSource, /bucket:\s*'exercise-videos'/)
  assert.match(routeSource, /bucket:\s*'exercise-media'/)
  assert.match(routeSource, /allowedContentTypes:\s*new Set\(\['video\/mp4'\]\)/)

  assert.match(tableSource, /async function uploadExerciseMediaFile\(\{ kind, file, exerciseId = '' \}\)/)
  assert.match(tableSource, /fetch\('\/api\/admin\/exercise-media'/)
  assert.match(tableSource, /formData\.append\('kind', kind\)/)
  assert.match(tableSource, /formData\.append\('file', file\)/)
  assert.match(tableSource, /handleVideoFileChange/)
  assert.match(tableSource, /handleThumbnailFileChange/)
  assert.match(tableSource, /videoUpload:\s*null/)
  assert.match(tableSource, /thumbnailUpload:\s*null/)

  assert.match(editorSource, /onThumbnailFileChange = \(\) => \{\}/)
  assert.match(editorSource, /onVideoFileChange = \(\) => \{\}/)
  assert.match(editorSource, /id="exercise-thumbnail-cover-upload"/)
  assert.match(editorSource, /accept="image\/png,image\/jpeg,image\/webp"/)
  assert.match(editorSource, /onThumbnailFileChange\(file\)/)
  assert.match(editorSource, /id="exercise-video-mp4-upload"/)
  assert.match(editorSource, /accept="video\/mp4"/)
  assert.match(editorSource, /onVideoFileChange\(file\)/)
  assert.match(editorSource, /<source src=\{values\.videoUrl\} type="video\/mp4" \/>/)
  assert.match(editorSource, /MediaPlayerControls videoUrl=\{values\.videoUrl\}/)
})
