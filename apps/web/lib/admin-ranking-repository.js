import { createAdminAthleteRepository } from './admin-athlete-repository'

function getBadgeSrc(rank) {
  if (rank === 1) return '/admin/gold_badge.svg'
  if (rank === 2) return '/admin/silver_badge.svg'
  if (rank === 3) return '/admin/bronze_badget.svg'
  return ''
}

export function createAdminRankingRepository(overrides = {}) {
  const athleteRepository = overrides.athleteRepository ?? createAdminAthleteRepository(overrides)

  return {
    async listRankings() {
      const athletes = await athleteRepository.listAthletes()

      return (Array.isArray(athletes) ? athletes : [])
        .slice()
        .sort((left, right) => {
          const percentageDelta = Number(right.workoutsPercentage ?? 0) - Number(left.workoutsPercentage ?? 0)
          if (percentageDelta !== 0) return percentageDelta

          const completedDelta = Number(right.workoutsCompleted ?? 0) - Number(left.workoutsCompleted ?? 0)
          if (completedDelta !== 0) return completedDelta

          return String(left.name ?? '').localeCompare(String(right.name ?? ''))
        })
        .map((athlete, index) => {
          const rank = index + 1
          return {
            id: athlete.id,
            rank,
            badgeSrc: getBadgeSrc(rank),
            name: athlete.name,
            ageLabel: athlete.dateOfBirth ? `${athlete.dateOfBirth} · ${athlete.status}` : athlete.status,
            avatarUrl: athlete.avatarUrl ?? '',
            program: athlete.program ?? '-',
            workoutsCompleted: athlete.workoutsCompleted ?? 0,
            workoutsTarget: athlete.workoutsTarget ?? 0,
            workoutsPercentage: athlete.workoutsPercentage ?? 0,
            lastActive: athlete.lastActive ?? 'Never',
            status: athlete.status ?? 'Inactive',
          }
        })
    },
  }
}
