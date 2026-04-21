export function createIdentityRepository(db) {
  return {
    db,
    async getUserById(id) {
      return { id, role: 'athlete' };
    }
  };
}
