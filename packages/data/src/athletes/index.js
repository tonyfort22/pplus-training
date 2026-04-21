export function createAthleteRepository(db) {
  return {
    db,
    async listAthletes() {
      return [];
    },
    async getAthleteDashboard(athleteId) {
      return {
        athleteId,
        todayWorkout: null,
        activeProgram: null,
        recentSessions: []
      };
    }
  };
}
