import { createAdminAthleteRepository } from './admin-athlete-repository'

const RANKING_SOURCE_DESCRIPTION = 'Rankings are derived from live athlete workout progress: completion percentage first, completed workouts second, then athlete name.'

function getBadgeSrc(rank) {
  if (rank === 1) return '/admin/gold_badge.svg'
  if (rank === 2) return '/admin/silver_badge.svg'
  if (rank === 3) return '/admin/bronze_badget.svg'
  return ''
}

function formatAgeLabel(dateOfBirth) {
  if (!dateOfBirth) return 'Date of birth unavailable'

  const date = new Date(`${dateOfBirth}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return 'Date of birth unavailable'

  const now = new Date()
  let age = now.getUTCFullYear() - date.getUTCFullYear()
  const monthDelta = now.getUTCMonth() - date.getUTCMonth()
  const dayDelta = now.getUTCDate() - date.getUTCDate()

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1
  }

  return `${age} year old`
}

function mapAthleteToRanking(athlete, index) {
  const rank = index + 1

  return {
    id: athlete.id,
    rank,
    badgeSrc: getBadgeSrc(rank),
    name: athlete.name || athlete.fullName || 'Unnamed athlete',
    ageLabel: formatAgeLabel(athlete.dateOfBirth),
    avatarUrl: athlete.avatarUrl || '',
    program: athlete.program || '-',
    workoutsCompleted: athlete.workoutsCompleted ?? 0,
    workoutsTarget: athlete.workoutsTarget ?? 0,
    workoutsPercentage: athlete.workoutsPercentage ?? 0,
    lastActive: athlete.lastActive || 'Never',
    status: athlete.status || 'Inactive',
  }
}

export function createAdminRankingRepository(overrides = {}) {
  const athleteRepository = overrides.athleteRepository ?? createAdminAthleteRepository(overrides)

  return {
    async listRankings() {
      const athletes = await athleteRepository.listAthletes()
      const rankedAthletes = [...(Array.isArray(athletes) ? athletes : [])]
        .sort((first, second) => {
          const percentageDelta = (second.workoutsPercentage ?? 0) - (first.workoutsPercentage ?? 0)
          if (percentageDelta !== 0) return percentageDelta

          const completedDelta = (second.workoutsCompleted ?? 0) - (first.workoutsCompleted ?? 0)
          if (completedDelta !== 0) return completedDelta

          return String(first.name || first.fullName || '').localeCompare(String(second.name || second.fullName || ''))
        })
        .map(mapAthleteToRanking)

      return {
        source: 'athlete_workout_progress',
        sourceDescription: RANKING_SOURCE_DESCRIPTION,
        rankings: rankedAthletes,
      }
    },
  }
}
