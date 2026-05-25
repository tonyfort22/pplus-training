export const programPlannerSeed = [
  {
    id: 'program-1',
    title: 'Program 1',
    athleteLabel: '7 athletes',
    duration: '12 weeks',
    weekCount: 2,
    goal: 'Acceleration and lower-body force production block for early off-season work.',
    description: 'Move whole day content horizontally when the training week needs a reshuffle without changing the Day 1 to Day 7 structure.',
    weeks: [
      {
        id: 'week-1',
        label: 'Week 1',
        focus: 'Linear acceleration and max strength',
        summary: 'Swap day content when the coach needs to rebalance the week.',
        daySlots: [
          {
            id: 'day-1',
            summary: 'Lower strength + primary sprint',
            focus: 'Heavy force day',
            workouts: [
              {
                id: 'week-1-day-1-workout-1',
                title: 'Acceleration Lift',
                blockLabel: 'Main Work',
                duration: '52 min',
                coachNote: 'Front-load heavy bilateral work before max velocity days.',
                sections: [
                  { id: 'w1d1s1', title: 'A1', description: 'Trap bar deadlift · 4 x 4' },
                  { id: 'w1d1s2', title: 'B1', description: 'Sled march · 4 x 15 m' },
                ],
              },
              {
                id: 'week-1-day-1-workout-2',
                title: 'Sprint Build-Ups',
                blockLabel: 'Field Work',
                duration: '24 min',
                coachNote: 'Keep contacts clean. Stop at the first sloppy rep.',
                sections: [
                  { id: 'w1d1s3', title: 'A1', description: '3-point starts · 6 reps' },
                ],
              },
            ],
          },
          {
            id: 'day-2',
            summary: 'Upper push and med-ball power',
            focus: 'Neural speed',
            workouts: [
              {
                id: 'week-1-day-2-workout-1',
                title: 'Upper Power Circuit',
                blockLabel: 'Main Work',
                duration: '38 min',
                coachNote: 'Explosive intent. No grinding reps.',
                sections: [
                  { id: 'w1d2s1', title: 'A1', description: 'Push press · 5 x 3' },
                  { id: 'w1d2s2', title: 'B1', description: 'Med-ball scoop toss · 5 x 4' },
                ],
              },
            ],
          },
          {
            id: 'day-3',
            summary: 'Active recovery and mobility',
            focus: 'Reset',
            workouts: [
              {
                id: 'week-1-day-3-workout-1',
                title: 'Mobility Flush',
                blockLabel: 'Recovery',
                duration: '30 min',
                coachNote: 'Keep it light. This is a nervous-system downshift.',
                sections: [
                  { id: 'w1d3s1', title: 'A1', description: '90/90 flow · 3 rounds' },
                ],
              },
            ],
          },
          {
            id: 'day-4',
            summary: 'COD + unilateral lower body',
            focus: 'Decel strength',
            workouts: [
              {
                id: 'week-1-day-4-workout-1',
                title: 'Change of Direction',
                blockLabel: 'Main Work',
                duration: '41 min',
                coachNote: 'Win the plant. Quiet torso.',
                sections: [
                  { id: 'w1d4s1', title: 'A1', description: '5-10-5 · 5 reps' },
                  { id: 'w1d4s2', title: 'B1', description: 'RFESS · 4 x 6/side' },
                ],
              },
            ],
          },
          {
            id: 'day-5',
            summary: 'Tempo conditioning',
            focus: 'Capacity',
            workouts: [
              {
                id: 'week-1-day-5-workout-1',
                title: 'Tempo Runs',
                blockLabel: 'Conditioning',
                duration: '28 min',
                coachNote: 'Smooth pace, nasal breathing between reps.',
                sections: [
                  { id: 'w1d5s1', title: 'A1', description: '100 m tempo · 10 reps' },
                ],
              },
            ],
          },
          {
            id: 'day-6',
            summary: 'Optional skills block',
            focus: 'Stickhandling and shot volume',
            workouts: [],
          },
          {
            id: 'day-7',
            summary: 'Full rest',
            focus: 'Off day',
            workouts: [],
          },
        ],
      },
      {
        id: 'week-2',
        label: 'Week 2',
        focus: 'Max velocity and elastic stiffness',
        summary: 'A lighter lift split after the first week load spike.',
        daySlots: [
          {
            id: 'day-1',
            summary: 'Speed exposure + jumps',
            focus: 'Fast contacts',
            workouts: [
              {
                id: 'week-2-day-1-workout-1',
                title: 'Max Velocity Build',
                blockLabel: 'Main Work',
                duration: '34 min',
                coachNote: 'Longer rest. Quality only.',
                sections: [
                  { id: 'w2d1s1', title: 'A1', description: 'Fly 20s · 6 reps' },
                ],
              },
            ],
          },
          { id: 'day-2', summary: 'Upper strength maintenance', focus: 'Press and pull balance', workouts: [] },
          { id: 'day-3', summary: 'Mobility and tissue work', focus: 'Recovery', workouts: [] },
          { id: 'day-4', summary: 'Lower elastic lift', focus: 'Reactive force', workouts: [] },
          { id: 'day-5', summary: 'Tempo bike flush', focus: 'Aerobic reset', workouts: [] },
          { id: 'day-6', summary: 'Optional puck skills', focus: 'Skill touch', workouts: [] },
          { id: 'day-7', summary: 'Full rest', focus: 'Off day', workouts: [] },
        ],
      },
    ],
  },
]
