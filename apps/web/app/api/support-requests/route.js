import { createSupportRequestNotificationSender } from '@/lib/support-request-notifications'
import { createSupportRequestsRepository } from '@/lib/support-requests-repository'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown support requests route error' },
    { status: error?.status || 500 },
  )
}

export async function POST(request) {
  try {
    const repository = createSupportRequestsRepository()
    const requestOrigin = new URL(request.url).origin
    const notificationSender = createSupportRequestNotificationSender({ appBaseUrl: requestOrigin })
    const body = await request.json()
    const supportRequest = await repository.createSupportRequest(body ?? {})

    try {
      const notificationResult = await notificationSender.sendSupportRequestNotification(supportRequest)
      if (!notificationResult?.skipped) {
        await repository.markNotificationSent(supportRequest.id)
      }
    } catch (notificationError) {
      await repository.markNotificationFailed(supportRequest.id, notificationError?.message || 'Unknown support notification error')
    }

    return json(
      { ok: true, supportRequestId: supportRequest.id },
      { status: 201 },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
