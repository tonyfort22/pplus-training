import { createSupabaseRestIdentityRepository } from '../../../../../../packages/data/src/identity/index.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function createRouteError(message, status = 500) {
  const error = new Error(message)
  error.status = status
  return error
}

function normalizeRequiredString(value, fieldLabel) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed) {
    throw createRouteError(`${fieldLabel} is required.`, 400)
  }
  return trimmed
}

function createUploadId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function sanitizeFileName(value, fallback) {
  return String(value || fallback).replace(/[^a-zA-Z0-9._-]/g, '-')
}

function getMediaConfig(kind) {
  if (kind === 'thumbnail') {
    return {
      bucket: 'exercise-media',
      defaultContentType: 'image/png',
      defaultFileName: 'thumbnail.png',
      allowedContentTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
    }
  }

  if (kind === 'video') {
    return {
      bucket: 'exercise-videos',
      defaultContentType: 'video/mp4',
      defaultFileName: 'video.mp4',
      allowedContentTypes: new Set(['video/mp4']),
    }
  }

  throw createRouteError('Unsupported exercise media type.', 400)
}

function createStorageRepository() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRouteError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return createSupabaseRestIdentityRepository({
    url: supabaseUrl.replace(/\/$/, ''),
    anonKey: serviceRoleKey,
    accessToken: serviceRoleKey,
    fetchImpl: globalThis.fetch,
  })
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown exercise media upload error' },
    { status: error?.status || 500 },
  )
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const kind = normalizeRequiredString(formData.get('kind'), 'Media type')
    const file = formData.get('file')

    if (!(file instanceof File)) {
      throw createRouteError('Media file is required.', 400)
    }

    const mediaConfig = getMediaConfig(kind)
    const contentType = file.type || mediaConfig.defaultContentType
    if (!mediaConfig.allowedContentTypes.has(contentType)) {
      throw createRouteError(`Unsupported ${kind} content type: ${contentType}`, 400)
    }

    const exerciseId = normalizeRequiredString(formData.get('exerciseId') || createUploadId(), 'Exercise ID')
    const objectPath = `${exerciseId}/${sanitizeFileName(file.name, mediaConfig.defaultFileName)}`
    const fileBuffer = new Uint8Array(await file.arrayBuffer())

    const identityRepository = createStorageRepository()
    const uploadedMedia = await identityRepository.uploadObject({
      bucket: mediaConfig.bucket,
      objectPath,
      fileBuffer,
      contentType,
    })

    return json({
      kind,
      bucket: mediaConfig.bucket,
      objectPath,
      publicUrl: uploadedMedia?.publicUrl || null,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
