export function createSessionRepository(db) {
  return {
    db,
    async createSessionFromProgramWorkout(programWorkoutId) {
      return {
        programWorkoutId,
        sessionId: null
      };
    },
    async getSessionById(sessionId) {
      return {
        sessionId,
        exercises: []
      };
    }
  };
}
