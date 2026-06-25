import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const youtubeUrlPath = resolve(repoRoot, 'apps/web/lib/youtube-url.js')
const youtubeMediaServicePath = resolve(repoRoot, 'apps/web/lib/exercise-youtube-media-service.js')
const youtubeMediaProviderPath = resolve(repoRoot, 'apps/web/lib/youtube-media-provider.js')
const youtubeMediaRoutePath = resolve(repoRoot, 'apps/web/app/api/admin/exercise-youtube-media/route.js')
const exerciseEditorDialogPath = resolve(repoRoot, 'apps/web/components/admin/exercise-editor-dialog.jsx')
const exercisesDataTablePath = resolve(repoRoot, 'apps/web/components/admin/exercises-data-table.jsx')
const pageTestManifestPath = resolve(repoRoot, 'apps/web/testing/page-test-manifest.js')

function source(path) {
  assert.equal(existsSync(path), true, `${path} should exist`)
  return readFileSync(path, 'utf8')
}

test('normalizes YouTube URLs to canonical watch URLs without playlist or tracking params', async () => {
  const { normalizeYouTubeWatchUrl, getYouTubeVideoId } = await import(`${youtubeUrlPath}?t=${Date.now()}`)

  assert.equal(
    normalizeYouTubeWatchUrl('youtube.com/watch?v=TUqhDRNI0QQ&list=PLAMIllZnMikAwa4F7-MyZuakXREOPiu2T&index=1'),
    'https://www.youtube.com/watch?v=TUqhDRNI0QQ',
  )
  assert.equal(
    normalizeYouTubeWatchUrl('  https://www.youtube.com/watch?v=TUqhDRNI0QQ&list=PLAMIllZnMikAwa4F7-MyZuakXREOPiu2T&index=1  '),
    'https://www.youtube.com/watch?v=TUqhDRNI0QQ',
  )
  assert.equal(
    normalizeYouTubeWatchUrl('https://youtu.be/TUqhDRNI0QQ?si=abc123'),
    'https://www.youtube.com/watch?v=TUqhDRNI0QQ',
  )
  assert.equal(
    normalizeYouTubeWatchUrl('https://www.youtube.com/shorts/TUqhDRNI0QQ?feature=share'),
    'https://www.youtube.com/watch?v=TUqhDRNI0QQ',
  )
  assert.equal(getYouTubeVideoId('https://www.youtube.com/embed/TUqhDRNI0QQ?list=abc'), 'TUqhDRNI0QQ')
  assert.throws(() => normalizeYouTubeWatchUrl(''), /YouTube link is required/)
  assert.throws(() => normalizeYouTubeWatchUrl('https://example.com/watch?v=TUqhDRNI0QQ'), /Unsupported YouTube URL/)
})

test('exercise YouTube media route delegates to a production-ready service boundary', () => {
  const routeSource = source(youtubeMediaRoutePath)
  const serviceSource = source(youtubeMediaServicePath)
  const providerSource = source(youtubeMediaProviderPath)

  assert.match(routeSource, /generateExerciseYoutubeMedia/)
  assert.match(routeSource, /POST\(request\)/)
  assert.match(routeSource, /youtubeUrl/)
  assert.match(routeSource, /exerciseId/)
  assert.match(routeSource, /exerciseName/)

  assert.match(serviceSource, /normalizeYouTubeWatchUrl/)
  assert.match(serviceSource, /createYoutubeMediaProvider/)
  assert.match(serviceSource, /uploadObject/)
  assert.match(serviceSource, /exercise-videos/)
  assert.match(serviceSource, /exercise-media/)
  assert.match(serviceSource, /videoUrl/)
  assert.match(serviceSource, /thumbnailUrl/)
  assert.match(serviceSource, /finally[\s\S]*rm/)

  assert.match(providerSource, /yt-dlp/)
  assert.match(providerSource, /ffmpeg/)
  assert.match(providerSource, /ffprobe/)
  assert.match(providerSource, /extractMidpointThumbnail/)
  assert.match(providerSource, /Number\(duration\) \/ 2/)
})

test('exercise editor button triggers YouTube media generation and shows progress', () => {
  const editorSource = source(exerciseEditorDialogPath)
  const tableSource = source(exercisesDataTablePath)

  assert.match(editorSource, /onGenerateYoutubeMedia = \(\) => \{\}/)
  assert.match(editorSource, /isGeneratingYoutubeMedia = false/)
  assert.match(editorSource, /onClick=\{onGenerateYoutubeMedia\}/)
  assert.match(editorSource, /disabled=\{[\s\S]*isGeneratingYoutubeMedia[\s\S]*!values\.youtubeLink\?\.trim\(\)/)
  assert.match(editorSource, /isGeneratingYoutubeMedia \? 'Creating medias\.\.\.' : 'Generate content with AI'/)
  assert.match(editorSource, /<Bot className="size-4" aria-hidden="true" \/>/)

  assert.match(tableSource, /isGeneratingExerciseYoutubeMedia/)
  assert.match(tableSource, /handleGenerateExerciseYoutubeMedia/)
  assert.match(tableSource, /fetch\('\/api\/admin\/exercise-youtube-media'/)
  assert.match(tableSource, /youtubeLink: payload\.youtubeUrl/)
  assert.match(tableSource, /videoUrl: payload\.videoUrl/)
  assert.match(tableSource, /videoName: payload\.videoName/)
  assert.match(tableSource, /thumbnailUrl: payload\.thumbnailUrl/)
  assert.match(tableSource, /thumbnailName: payload\.thumbnailName/)
  assert.match(tableSource, /onGenerateYoutubeMedia=\{handleGenerateExerciseYoutubeMedia\}/)
  assert.match(tableSource, /isGeneratingYoutubeMedia=\{isGeneratingExerciseYoutubeMedia\}/)
})

test('remaining YouTube helper API route is explicitly classified as legacy/helper', async () => {
  if (!existsSync(youtubeMediaRoutePath)) {
    return
  }

  const { getWebApiRouteClassifications, WEB_API_ROUTE_CLASSES, WEB_ROUTE_AREAS, WEB_ROUTE_AUTH_STATES } = await import(
    `${pageTestManifestPath}?t=${Date.now()}`
  )
  const classifications = getWebApiRouteClassifications()
  const youtubeHelperRoute = classifications.find((route) => route.path === '/api/admin/exercise-youtube-media')

  assert.ok(youtubeHelperRoute, 'present YouTube helper route must be classified')
  assert.equal(youtubeHelperRoute.classification, WEB_API_ROUTE_CLASSES.LEGACY_HELPER)
  assert.equal(youtubeHelperRoute.area, WEB_ROUTE_AREAS.ADMIN_PRODUCT)
  assert.equal(youtubeHelperRoute.authState, WEB_ROUTE_AUTH_STATES.PROTECTED)
  assert.equal(youtubeHelperRoute.sourceFile, 'apps/web/app/api/admin/exercise-youtube-media/route.js')
  assert.deepEqual(youtubeHelperRoute.existingTestFiles, ['tests/web-exercise-youtube-media.test.js'])
})
