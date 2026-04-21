export function createExerciseRepository(db) {
  return {
    db,
    async listExercises() {
      return [];
    },
    async getExerciseWithMappings(exerciseId) {
      return {
        exerciseId,
        muscleMaps: [],
        subMuscleMaps: []
      };
    }
  };
}
