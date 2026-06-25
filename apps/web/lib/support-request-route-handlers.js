import { createSupportRequestNotificationSender } from './support-request-notifications.js'
import { createSupportRequestsRepository } from './support-requests-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown support requests route error' },
    { status: error?.status || 500 },
  )
}

export function createSupportRequestRouteHandlers({
  createRepository = createSupportRequestsRepository,
  createNotificationSender = createSupportRequestNotificationSender,
} = {}) {
  return {
    async POST(request) {
      try {
        const repository = createRepository()
        const requestOrigin = new URL(request.url).origin
        const notificationSender = createNotificationSender({ appBaseUrl: requestOrigin })
        const body = await request.json()
        const supportRequest = await repository.createSupportRequest(body ?? {})

        try {
          const notificationResult = await notificationSender.sendSupportRequestNotification(supportRequest)
          if (!notificationResult?.skipped) {
            await repository.markNotificationSent(supportRequest.id)
          }
        } catch (notificationError) {
          await repository.markNotificationFailed(
            supportRequest.id,
            notificationError?.message || 'Unknown support notification error',
          )
        }

        return json(
          {
            ok: true,
            supportRequestId: supportRequest.id,
            supportConversationId: supportRequest.supportConversationId,
          },
          { status: 201 },
        )
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}

const supportRequestRouteHandlers = createSupportRequestRouteHandlers()

export async function postSupportRequest(request) {
  return supportRequestRouteHandlers.POST(request)
}
