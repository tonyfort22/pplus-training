import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { createSupabaseRestIdentityRepository } from '../../../packages/data/src/identity/index.js'
import { normalizeYouTubeWatchUrl, getYouTubeVideoId } from './youtube-url.js'
import { createYoutubeMediaProvider } from './youtube-media-provider.js'

function createServiceError(message, status = 500) {
  const error = new Error(message)
  error.status = status
  return error
}

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeFileName(value, fallback) {
  return String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallback
}

function createStorageRepository() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw createServiceError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return createSupabaseRestIdentityRepository({
    url: supabaseUrl.replace(/\/$/, ''),
    anonKey: serviceRoleKey,
    accessToken: serviceRoleKey,
    fetchImpl: globalThis.fetch,
  })
}

async function uploadGeneratedMedia({ storageRepository, bucket, objectPath, filePath, contentType }) {
  const fileBuffer = new Uint8Array(await readFile(filePath))
  const uploaded = await storageRepository.uploadObject({
    bucket,
    objectPath,
    fileBuffer,
    contentType,
  })
  return uploaded?.publicUrl || null
}

export async function generateExerciseYoutubeMedia({ youtubeUrl, exerciseId = '', exerciseName = '', provider = createYoutubeMediaProvider() }) {
  const normalizedYoutubeUrl = normalizeYouTubeWatchUrl(youtubeUrl)
  const videoId = getYouTubeVideoId(normalizedYoutubeUrl)
  const safeExerciseId = sanitizeFileName(normalizeOptionalString(exerciseId) || videoId, videoId)
  const safeBaseName = sanitizeFileName(normalizeOptionalString(exerciseName) || `youtube-${videoId}`, `youtube-${videoId}`)
  const videoName = `${safeBaseName}.mp4`
  const thumbnailName = `${safeBaseName}-midpoint.jpg`
  const tempDir = await mkdtemp(join(tmpdir(), 'pplus-youtube-media-'))
  const videoPath = join(tempDir, videoName)
  const thumbnailPath = join(tempDir, thumbnailName)

  try {
    await provider.assertReady?.()
    await provider.downloadYoutubeVideo({ youtubeUrl: normalizedYoutubeUrl, outputPath: videoPath })
    const duration = await provider.getVideoDuration({ videoPath })
    await provider.extractMidpointThumbnail({
      videoPath,
      outputPath: thumbnailPath,
      duration,
    })

    const storageRepository = createStorageRepository()
    const videoObjectPath = `${safeExerciseId}/${videoName}`
    const thumbnailObjectPath = `${safeExerciseId}/${thumbnailName}`
    const videoUrl = await uploadGeneratedMedia({
      storageRepository,
      bucket: 'exercise-videos',
      objectPath: videoObjectPath,
      filePath: videoPath,
      contentType: 'video/mp4',
    })
    const thumbnailUrl = await uploadGeneratedMedia({
      storageRepository,
      bucket: 'exercise-media',
      objectPath: thumbnailObjectPath,
      filePath: thumbnailPath,
      contentType: 'image/jpeg',
    })

    if (!videoUrl || !thumbnailUrl) {
      throw createServiceError('Generated media upload did not return public URLs.', 500)
    }

    return {
      youtubeUrl: normalizedYoutubeUrl,
      videoUrl,
      thumbnailUrl,
      videoName,
      thumbnailName,
      duration,
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}
