import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { assertAdminApiRequest } from '@/lib/admin-auth-cookies'
import { createAdminExerciseRepository } from '@/lib/admin-exercise-repository'
import { createAiWorkoutDraftFromExtractedText, extractWorkoutTextFromPdfFile } from '@/lib/ai-workout-draft-pdf'

function handleRouteError(error) {
  return NextResponse.json(
    { error: error?.message || 'Unknown admin AI workout draft route error' },
    { status: error?.status || 500 },
  )
}

export async function POST(request) {
  try {
    await assertAdminApiRequest(cookies)
    const formData = await request.formData()
    const files = formData.getAll('files')
    const uploadedFiles = files.length ? files : [formData.get('file')]

    if (!uploadedFiles.length || uploadedFiles.some((file) => !file || typeof file.arrayBuffer !== 'function')) {
      return NextResponse.json({ error: 'Upload a workout PDF first.' }, { status: 400 })
    }

    const invalidFile = uploadedFiles.find((file) => file.type !== 'application/pdf')
    if (invalidFile) {
      return NextResponse.json({ error: 'Upload PDF files only.' }, { status: 400 })
    }

    const repository = createAdminExerciseRepository()
    const exerciseCandidates = await repository.listExercises()
    const drafts = []
    const extractedTextPreviews = []

    for (const file of uploadedFiles) {
      const extractedText = await extractWorkoutTextFromPdfFile(file)
      extractedTextPreviews.push(extractedText.slice(0, 2000))
      drafts.push(createAiWorkoutDraftFromExtractedText({
        text: extractedText,
        sourceFileName: file.name,
        exerciseCandidates,
      }))
    }

    return NextResponse.json({ drafts, extractedTextPreview: extractedTextPreviews.join('\n\n---\n\n') }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
