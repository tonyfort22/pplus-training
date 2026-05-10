export function orchestrateOpenProgramEditView({
  setIsProgramSheetOpen,
  setIsProgramEditViewOpen,
}) {
  setIsProgramSheetOpen(false);
  setIsProgramEditViewOpen(true);

  return {
    outcome: 'opened-program-edit-view',
  };
}

export function orchestrateCloseProgramEditView({
  setIsProgramEditViewOpen,
  setIsProgramSheetOpen,
}) {
  setIsProgramEditViewOpen(false);
  setIsProgramSheetOpen(true);

  return {
    outcome: 'closed-program-edit-view',
  };
}
