export function createProgramRepository(db) {
  return {
    db,
    async listPrograms() {
      return [];
    },
    async getAssignedProgramForAthlete(athleteId) {
      return {
        athleteId,
        weeks: []
      };
    }
  };
}
