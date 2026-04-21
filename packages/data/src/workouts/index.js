export function createWorkoutRepository(db) {
  return {
    db,
    async listWorkoutTemplates() {
      return [];
    },
    async getWorkoutTemplate(workoutTemplateId) {
      return {
        workoutTemplateId,
        exercises: []
      };
    }
  };
}
