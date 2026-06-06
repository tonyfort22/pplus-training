import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { assertAdminApiRequest } from '@/lib/admin-auth-cookies'
import { createAdminExerciseRepository } from '@/lib/admin-exercise-repository'
import { reviseAiWorkoutDraft } from '@/lib/ai-workout-draft-pdf'

function handleRouteError(error) {
  return NextResponse.json(
    { error: error?.message || 'Unknown admin AI workout draft revise route error' },
    { status: error?.status || 500 },
  )
}

export async function POST(request) {
  try {
    await assertAdminApiRequest(cookies)
    const body = await request.json()
    const draft = body?.draft
    const prompt = body?.prompt

    if (!draft || typeof draft !== 'object') {
      return NextResponse.json({ error: 'A draft is required for revision.' }, { status: 400 })
    }

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Enter a revision prompt first.' }, { status: 400 })
    }

    const repository = createAdminExerciseRepository()
    const exerciseCandidates = await repository.listExercises()
    const revisedDraft = reviseAiWorkoutDraft({ draft, prompt, exerciseCandidates })

    return NextResponse.json({ draft: revisedDraft }, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
