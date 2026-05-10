import { mergePersistedSessionResult } from './session-orchestration.js';

function mergeAndSetSession({ savedSession = null, optimisticSession = null, setSession = () => {} } = {}) {
  const mergedSession = mergePersistedSessionResult({ savedSession, optimisticSession });
  setSession(mergedSession);
  return mergedSession;
}

function getNextMutationId(optimisticSessionMutationRef) {
  const mutationId = (optimisticSessionMutationRef?.current || 0) + 1;
  optimisticSessionMutationRef.current = mutationId;
  return mutationId;
}

export function createSessionPersistenceController({
  effectiveSessionStore = null,
  setSession = () => {},
  optimisticSessionMutationRef = { current: 0 },
  getSessionDebugSummary = (value) => value,
  logger = console,
} = {}) {
  async function persistSessionUpdate(nextSession) {
    if (!effectiveSessionStore) return nextSession;
    logger.info?.('[persistSessionUpdate] request', { nextSession: getSessionDebugSummary(nextSession) });
    const savedSession = await effectiveSessionStore.saveSession(nextSession);
    logger.info?.('[persistSessionUpdate] saved', { savedSession: getSessionDebugSummary(savedSession) });
    return mergeAndSetSession({ savedSession, optimisticSession: nextSession, setSession });
  }

  function persistSessionUpdateOptimistic(nextSession) {
    if (!effectiveSessionStore) {
      setSession(nextSession);
      return nextSession;
    }

    const mutationId = getNextMutationId(optimisticSessionMutationRef);

    setSession(nextSession);
    logger.info?.('[persistSessionUpdateOptimistic] request', {
      mutationId,
      nextSession: getSessionDebugSummary(nextSession),
    });
    effectiveSessionStore.saveSession(nextSession)
      .then((savedSession) => {
        if (optimisticSessionMutationRef.current !== mutationId) {
          return;
        }

        mergeAndSetSession({ savedSession, optimisticSession: nextSession, setSession });
      })
      .catch(() => {
        if (optimisticSessionMutationRef.current !== mutationId) {
          return;
        }
        setSession(nextSession);
      });

    return nextSession;
  }

  function persistSessionDeletionOptimistic(nextSession, { setId = null, exerciseId = null } = {}) {
    if (!effectiveSessionStore) {
      setSession(nextSession);
      return nextSession;
    }

    const mutationId = getNextMutationId(optimisticSessionMutationRef);

    setSession(nextSession);
    const deletePromise = exerciseId
      ? effectiveSessionStore.deleteSessionExercise(nextSession, { exerciseId })
      : effectiveSessionStore.deleteSessionSet(nextSession, { setId });

    deletePromise
      .then((savedSession) => {
        if (optimisticSessionMutationRef.current !== mutationId) {
          return;
        }

        mergeAndSetSession({ savedSession, optimisticSession: nextSession, setSession });
      })
      .catch(() => {
        if (optimisticSessionMutationRef.current !== mutationId) {
          return;
        }
        setSession(nextSession);
      });

    return nextSession;
  }

  return {
    persistSessionUpdate,
    persistSessionUpdateOptimistic,
    persistSessionDeletionOptimistic,
  };
}
