export function getProgressSurfaceModel() {
  return {
    header: {
      eyebrow: 'Progress',
      title: 'Performance & recovery',
      body: 'This is where the athlete should see results from training, not just the workouts themselves.',
    },
    metrics: [
      {
        label: 'Back Squat est. 1RM',
        value: '205 lb',
        detail: 'Up 10 lb over the last 4 weeks',
      },
      {
        label: 'Weekly load',
        value: '78',
        detail: 'Current training load score based on completed sessions',
      },
      {
        label: 'Readiness',
        value: 'Moderate',
        detail: 'Good to train, but lower body fatigue is accumulating',
      },
    ],
    trainingLoad: {
      title: 'Training load',
      body: 'The app should summarize completed session load across the week and connect it to muscles and sub-muscles through the analytics domain.',
    },
    muscleFatigue: {
      title: 'Muscle fatigue',
      body: 'This surface will show fatigue and recovery signals per muscle group once analytics are wired from the completed session data.',
      rows: [
        { title: 'Quads', body: 'High fatigue' },
        { title: 'Hamstrings', body: 'Moderate fatigue' },
        { title: 'Glutes', body: 'Moderate fatigue' },
      ],
    },
    performanceSnapshots: {
      title: 'Performance snapshots',
      body: 'This area should hold lift progress, compliance, and trend summaries over time.',
    },
  }
}

export function getPlaceholderSurfaceModel(title, body) {
  return { title, body }
}
