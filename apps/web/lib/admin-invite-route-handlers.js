import { createAdminAthleteRepository } from './admin-athlete-repository.js'
import { createAdminInviteRepository } from './admin-invite-repository.js'

function json(payload, init = {}) {
  return Response.json(payload, init)
}

function handleRouteError(error) {
  return json(
    { error: error?.message || 'Unknown admin invites route error' },
    { status: error?.status || 500 },
  )
}

function getBulkResendInviteSkipReason(invite) {
  if (invite.status === 'Accepted') return 'Already accepted'
  if (invite.status === 'Canceled') return 'Invite canceled'
  if (!invite.email || invite.email === '-') return 'Missing email'
  if (!invite.athleteProfileId) return 'Missing athlete profile'
  return 'Cannot resend'
}

function isBulkResendInviteEligible(invite) {
  return ['Pending', 'Expired'].includes(invite.status) && Boolean(invite.athleteProfileId) && Boolean(invite.email && invite.email !== '-')
}

export function createAdminInviteRouteHandlers({
  createInviteRepository = createAdminInviteRepository,
  createAthleteRepository = createAdminAthleteRepository,
} = {}) {
  return {
    async GET() {
      try {
        const repository = createInviteRepository()
        const invites = await repository.listInvites()
        return json({ invites })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async POST(request) {
      try {
        const body = await request.json()

        if (body?.action === 'resend') {
          const inviteRepository = createInviteRepository()
          const athleteRepository = createAthleteRepository()
          const inviteRows = await inviteRepository.listInvitesByIds({ inviteIds: body.inviteIds })
          const resentInvites = []
          const skippedInvites = []

          for (const invite of inviteRows) {
            if (!isBulkResendInviteEligible(invite)) {
              skippedInvites.push({ ...invite, reason: getBulkResendInviteSkipReason(invite) })
              continue
            }

            const athlete = await athleteRepository.sendAthleteInvite({
              athleteId: invite.athleteProfileId,
              inviteeEmail: invite.email,
            })
            resentInvites.push({ invite, athlete })
          }

          return json({ result: { resentInvites, skippedInvites } })
        }

        const repository = createAthleteRepository()
        const athlete = await repository.sendAthleteInvite(body ?? {})
        return json({ athlete }, { status: 201 })
      } catch (error) {
        return handleRouteError(error)
      }
    },

    async PATCH(request) {
      try {
        const repository = createInviteRepository()
        const body = await request.json()
        if (Array.isArray(body?.inviteIds)) {
          const result = await repository.cancelInvites({ inviteIds: body.inviteIds })
          return json({ result })
        }
        const invite = await repository.cancelInvite(body ?? {})
        return json({ invite })
      } catch (error) {
        return handleRouteError(error)
      }
    },
  }
}
