import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/admin-auth-cookies'
import {
  createWorkoutTrainingVoiceTranscript,
  getWorkoutTrainingVoiceTranscriber,
} from '@/lib/admin/workout-training-ai-voice'

export const runtime = 'nodejs'

async function requireAdminAccessToken() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(PPLUS_ADMIN_ACCESS_TOKEN_COOKIE)?.value
  if (!accessToken) {
    const error = new Error('Unauthorized admin request.')
    error.status = 401
    throw error
  }
  return accessToken
}

export async function POST(request) {
  try {
    await requireAdminAccessToken()
    const formData = await request.formData()
    const result = await createWorkoutTrainingVoiceTranscript({
      audioFile: formData.get('audio'),
      transcribeAudio: getWorkoutTrainingVoiceTranscriber(),
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ transcript: result.transcript })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Unable to transcribe workout voice instruction.' },
      { status: error?.status || 500 },
    )
  }
}
