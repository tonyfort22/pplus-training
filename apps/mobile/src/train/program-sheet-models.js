export function getProgramSheetModel(trainState) {
  const totalWeeks = trainState.program.totalWeeks
  const currentWeek = trainState.program.currentWeek

  return {
    title: "Spring '26 Hypertrophy",
    dateRangeLabel: 'Apr 5, 2026 - May 30, 2026',
    editLabel: 'Edit',
    progressSegments: Array.from({ length: totalWeeks }, (_, index) => ({
      id: `program-sheet-week-${index + 1}`,
      isComplete: index + 1 < currentWeek,
      isCurrent: index + 1 === currentWeek,
    })),
    stats: [
      {
        id: 'program-week-stat',
        icon: 'calendar',
        label: `Week ${currentWeek} of ${totalWeeks}`,
      },
      {
        id: 'program-workout-stat',
        icon: 'barbell',
        label: `${trainState.program.completedWorkouts} of ${trainState.program.totalWorkouts} Workouts`,
      },
    ],
    routines: [
      { id: 'routine-upper-a', label: 'Upper A' },
      { id: 'routine-lower-a', label: 'Lower A' },
      { id: 'routine-upper-b', label: 'Upper B' },
      { id: 'routine-lower-b', label: 'Lower B' },
      { id: 'routine-shoulders-arms', label: 'Shoulders & Arms' },
    ],
    weeks: createProgramScheduleWeeks(),
  }
}

function createProgramScheduleWeeks() {
  return [
    {
      id: 'week-1',
      title: 'Week 1',
      dateRangeLabel: 'Apr 5 - Apr 11',
      topDividerLabel: 'Rest Day',
      bottomDividerLabel: 'Rest Day',
      entries: [
        { id: 'week-1-mon', dayLabel: 'Mon', workoutLabel: 'Lower A', durationLabel: '1 min', status: 'done' },
        { id: 'week-1-tue', dayLabel: 'Tue', workoutLabel: 'Upper B', durationLabel: '0 min', status: 'done' },
        { id: 'week-1-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 1h 4m', status: 'missed' },
        { id: 'week-1-thu', dayLabel: 'Thu', workoutLabel: 'Shoulders & Arms', durationLabel: '1h', status: 'done' },
        { id: 'week-1-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 57 min', status: 'missed' },
      ],
    },
    {
      id: 'week-2',
      title: 'Week 2',
      dateRangeLabel: 'Apr 12 - Apr 18',
      topDividerLabel: 'Rest Day',
      bottomDividerLabel: 'Rest Day',
      entries: [
        { id: 'week-2-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: '58 min', status: 'done' },
        { id: 'week-2-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: '1h 2m', status: 'done' },
        { id: 'week-2-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 1h 1m', status: 'missed' },
        { id: 'week-2-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: '55 min', status: 'done' },
        { id: 'week-2-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 52 min', status: 'missed' },
      ],
    },
    {
      id: 'week-3',
      title: 'Week 3',
      dateRangeLabel: 'Apr 19 - Apr 25',
      topDividerLabel: 'Rest Day',
      bottomDividerLabel: 'Rest Day',
      entries: [
        { id: 'week-3-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: '47 min', status: 'done' },
        { id: 'week-3-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Scheduled today', status: 'done' },
        { id: 'week-3-wed', dayLabel: 'Wed', workoutLabel: 'Recovery + mobility', durationLabel: 'Est. 32 min', status: 'missed' },
        { id: 'week-3-thu', dayLabel: 'Thu', workoutLabel: 'Upper B', durationLabel: 'Est. 58 min', status: 'missed' },
        { id: 'week-3-fri', dayLabel: 'Fri', workoutLabel: 'Lower B', durationLabel: 'Est. 1h 3m', status: 'missed' },
      ],
    },
    {
      id: 'week-4',
      title: 'Week 4',
      dateRangeLabel: 'Apr 26 - May 2',
      topDividerLabel: 'Rest Day',
      bottomDividerLabel: 'Rest Day',
      entries: [
        { id: 'week-4-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 56 min', status: 'missed' },
        { id: 'week-4-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 1h 1m', status: 'missed' },
        { id: 'week-4-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 58 min', status: 'missed' },
        { id: 'week-4-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 59 min', status: 'missed' },
        { id: 'week-4-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 52 min', status: 'missed' },
      ],
    },
    {
      id: 'week-5',
      title: 'Week 5',
      dateRangeLabel: 'May 3 - May 9',
      topDividerLabel: 'Rest Day',
      bottomDividerLabel: 'Rest Day',
      entries: [
        { id: 'week-5-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 57 min', status: 'missed' },
        { id: 'week-5-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 1h', status: 'missed' },
        { id: 'week-5-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 59 min', status: 'missed' },
        { id: 'week-5-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 1h 2m', status: 'missed' },
        { id: 'week-5-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 53 min', status: 'missed' },
      ],
    },
    {
      id: 'week-6',
      title: 'Week 6',
      dateRangeLabel: 'May 10 - May 16',
      topDividerLabel: 'Rest Day',
      bottomDividerLabel: 'Rest Day',
      entries: [
        { id: 'week-6-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 55 min', status: 'missed' },
        { id: 'week-6-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 1h 3m', status: 'missed' },
        { id: 'week-6-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 58 min', status: 'missed' },
        { id: 'week-6-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 1h 1m', status: 'missed' },
        { id: 'week-6-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 54 min', status: 'missed' },
      ],
    },
    {
      id: 'week-7',
      title: 'Week 7',
      dateRangeLabel: 'May 17 - May 23',
      topDividerLabel: 'Rest Day',
      bottomDividerLabel: 'Rest Day',
      entries: [
        { id: 'week-7-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 54 min', status: 'missed' },
        { id: 'week-7-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 59 min', status: 'missed' },
        { id: 'week-7-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 57 min', status: 'missed' },
        { id: 'week-7-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 1h', status: 'missed' },
        { id: 'week-7-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 51 min', status: 'missed' },
      ],
    },
    {
      id: 'week-8',
      title: 'Week 8',
      dateRangeLabel: 'May 24 - May 30',
      topDividerLabel: 'Rest Day',
      bottomDividerLabel: 'Rest Day',
      entries: [
        { id: 'week-8-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 52 min', status: 'missed' },
        { id: 'week-8-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 58 min', status: 'missed' },
        { id: 'week-8-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 56 min', status: 'missed' },
        { id: 'week-8-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 59 min', status: 'missed' },
        { id: 'week-8-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 50 min', status: 'missed' },
      ],
    },
  ]
}
