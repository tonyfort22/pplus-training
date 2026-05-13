export function orchestrateCoachAthleteWorkspaceOpen({
  payload = null,
  selectedCoachAthleteId = null,
  setSelectedCoachAthleteId = () => {},
  setIsCoachAthletesSheetOpen = () => {},
  setIsCoachAthleteWorkspaceOpen = () => {},
} = {}) {
  const nextAthleteId = payload?.athleteId ?? selectedCoachAthleteId;
  setSelectedCoachAthleteId(nextAthleteId);
  setIsCoachAthletesSheetOpen(false);
  setIsCoachAthleteWorkspaceOpen(true);

  return {
    outcome: 'opened-coach-athlete-workspace',
    nextAthleteId,
  };
}

export function orchestrateCoachAthleteSelect({
  payload = null,
  selectedCoachAthleteId = null,
  setSelectedCoachAthleteId = () => {},
  setIsCoachAthletesSheetOpen = () => {},
  setIsCoachAthleteWorkspaceOpen = () => {},
  setCoachMetricNotice = () => {},
  setCoachMetricError = () => {},
} = {}) {
  const nextAthleteId = payload?.athleteId ?? selectedCoachAthleteId;
  setSelectedCoachAthleteId(nextAthleteId);
  setIsCoachAthletesSheetOpen(false);
  setIsCoachAthleteWorkspaceOpen(false);
  setCoachMetricNotice('');
  setCoachMetricError('');

  return {
    outcome: 'selected-coach-athlete',
    nextAthleteId,
  };
}
