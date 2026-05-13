export function orchestrateOpenProgramSheet({
  trainState = null,
  program = null,
  sourceSurface = null,
  closeProfileView = () => {},
  programSheetClient = null,
  setProgramSheetReturnSurface = () => {},
  setSelectedProgramPreview = () => {},
  setIsProgramSheetOpen = () => {},
} = {}) {
  const currentProgramId = program?.id || trainState?.program?.id || null;
  const initialProgramPreview = program || (
    currentProgramId
      ? { id: currentProgramId, name: trainState?.program?.name || '' }
      : null
  );

  setProgramSheetReturnSurface(sourceSurface);
  setSelectedProgramPreview(initialProgramPreview);

  if (sourceSurface === 'profile-view') {
    closeProfileView();
  }

  setIsProgramSheetOpen(true);

  if (!currentProgramId) {
    return {
      outcome: 'opened-without-program-id',
      currentProgramId: null,
    };
  }

  programSheetClient?.getProgramById?.(currentProgramId)
    .then((resolvedProgram) => {
      if (!resolvedProgram?.id) return;
      setSelectedProgramPreview((current) => {
        if (program?.id) {
          if (!current?.id || current.id !== currentProgramId) return current;
          return {
            ...current,
            ...resolvedProgram,
          };
        }

        if (currentProgramId !== trainState?.program?.id) return current;
        return {
          ...(current || { id: currentProgramId }),
          ...resolvedProgram,
        };
      });
    })
    .catch(() => {});

  return {
    outcome: 'opened-and-hydrating',
    currentProgramId,
  };
}

export function orchestrateCloseProgramSheet({
  programSheetReturnSurface = null,
  setIsProgramSheetOpen = () => {},
  setIsProfileViewOpen = () => {},
  setProgramSheetReturnSurface = () => {},
  setSelectedProgramPreview = () => {},
} = {}) {
  setIsProgramSheetOpen(false);

  if (programSheetReturnSurface === 'profile-view') {
    setIsProfileViewOpen(true);
  }

  setProgramSheetReturnSurface(null);
  setSelectedProgramPreview(null);

  return {
    outcome: 'closed-program-sheet',
    programSheetReturnSurface,
  };
}
