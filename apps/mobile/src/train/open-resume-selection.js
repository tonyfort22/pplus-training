export async function orchestrateOpenOrResumeSession({
  effectiveSessionStore = null,
  session = null,
  selectedProgramWorkoutId = null,
  startedAt = new Date().toISOString(),
  setIsWorkoutSheetOpen = () => {},
  setSession = () => {},
  setActiveTrainTab = () => {},
} = {}) {
  if (!effectiveSessionStore) {
    return {
      outcome: 'blocked-missing-store',
      nextSession: null,
    };
  }

  setIsWorkoutSheetOpen(false);

  const currentSessionProgramWorkoutId = session?.programWorkoutId || session?.id || null;
  if (session?.id && currentSessionProgramWorkoutId === selectedProgramWorkoutId) {
    const resumedSession = await effectiveSessionStore.resumeSession(session.id);
    if (resumedSession) {
      setSession(resumedSession);
    }
    setActiveTrainTab('session');
    return {
      outcome: 'resumed-existing-session',
      nextSession: resumedSession || null,
      currentSessionProgramWorkoutId,
    };
  }

  const result = await effectiveSessionStore.startSession({
    startedAt,
    programWorkoutId: selectedProgramWorkoutId,
  });
  const nextSession = result?.session;
  setSession(nextSession);
  setActiveTrainTab('session');
  return {
    outcome: 'started-new-session',
    nextSession: nextSession || null,
    currentSessionProgramWorkoutId,
  };
}
