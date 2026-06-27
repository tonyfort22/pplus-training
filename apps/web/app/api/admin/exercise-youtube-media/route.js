import { generateExerciseYoutubeMedia } from '../../../../lib/exercise-youtube-media-service.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function createRouteError(message, status = 500) {
  const error = new Error(message)
  error.status = status
  return error
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown YouTube media generation error' },
    { status: error?.status || 500 },
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const youtubeUrl = typeof body?.youtubeUrl === 'string' ? body.youtubeUrl : ''
    const exerciseId = typeof body?.exerciseId === 'string' ? body.exerciseId : ''
    const exerciseName = typeof body?.exerciseName === 'string' ? body.exerciseName : ''

    if (!youtubeUrl.trim()) {
      throw createRouteError('YouTube link is required.', 400)
    }

    const generatedMedia = await generateExerciseYoutubeMedia({
      youtubeUrl,
      exerciseId,
      exerciseName,
    })

    return json(generatedMedia)
  } catch (error) {
    return handleRouteError(error)
  }
}
