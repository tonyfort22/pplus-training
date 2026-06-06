const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
])

function createYoutubeUrlError(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

function parseYoutubeUrl(input) {
  const trimmed = typeof input === 'string' ? input.trim() : ''
  if (!trimmed) {
    throw createYoutubeUrlError('YouTube link is required.')
  }

  const parseCandidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`

  let parsed
  try {
    parsed = new URL(parseCandidate)
  } catch {
    throw createYoutubeUrlError('Invalid YouTube URL.')
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, 'www.')
  if (!YOUTUBE_HOSTS.has(host)) {
    throw createYoutubeUrlError('Unsupported YouTube URL.')
  }

  return parsed
}

function normalizeVideoId(value) {
  const videoId = String(value || '').trim()
  if (!/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) {
    throw createYoutubeUrlError('YouTube video ID is missing.')
  }
  return videoId
}

export function getYouTubeVideoId(input) {
  const parsed = parseYoutubeUrl(input)
  const host = parsed.hostname.toLowerCase()
  const pathParts = parsed.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    return normalizeVideoId(pathParts[0])
  }

  if (parsed.searchParams.has('v')) {
    return normalizeVideoId(parsed.searchParams.get('v'))
  }

  if (pathParts[0] === 'shorts' || pathParts[0] === 'embed' || pathParts[0] === 'live') {
    return normalizeVideoId(pathParts[1])
  }

  throw createYoutubeUrlError('YouTube video ID is missing.')
}

export function normalizeYouTubeWatchUrl(input) {
  const videoId = getYouTubeVideoId(input)
  return `https://www.youtube.com/watch?v=${videoId}`
}
