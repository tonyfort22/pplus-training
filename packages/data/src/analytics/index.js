export function createAnalyticsRepository(db) {
  return {
    db,
    async getAthleteProgressSummary(athleteId) {
      return {
        athleteId,
        fatigue: [],
        performance: []
      };
    }
  };
}
