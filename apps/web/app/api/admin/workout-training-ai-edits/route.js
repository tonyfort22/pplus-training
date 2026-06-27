import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/admin-auth-cookies'
import { createWorkoutTrainingAiEdit } from '@/lib/admin/workout-training-ai'

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
    const body = await request.json()
    const result = createWorkoutTrainingAiEdit({
      instruction: body?.instruction,
      trainingSections: body?.trainingSections,
      workoutContext: body?.workoutContext ?? {},
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      summary: result.summary,
      actions: result.actions,
      nextTrainingSections: result.nextTrainingSections,
      warnings: result.warnings,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Unable to generate workout training edits.' },
      { status: error?.status || 500 },
    )
  }
}
