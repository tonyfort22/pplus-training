export const hero = {
  pill: 'The Best Hockey Training App',
  eyebrow: 'ELITE HOCKEY TRAINING',
  heading: 'Off-Ice Work / On-Ice Results',
  copy:
    'PPLUS Training helps hockey athletes stay locked in off the ice with guided trainings, simple tracking, and a clear plan built for long-term development.',
}

export const featuresSection = {
  label: 'FEATURES',
  heading: 'Built for Better Off-Ice Training',
}

export const features = [
  {
    slug: 'training-programs',
    title: 'Training Programs',
    description:
      'Give athletes a clear off-ice plan with structured programs, scheduled workouts, and week-by-week progression built to support real hockey development.',
    image: '/landing/features/phone-dashboard.png',
    alt: 'PPLUS Training app dashboard and training program overview',
  },
  {
    slug: 'workout-tracking',
    title: 'Workout Tracking',
    description:
      'Log every session with guided exercises, sets, reps, and workout flow that make it easy for athletes to stay focused and consistent.',
    image: '/landing/features/phone-workout-tracking.png',
    alt: 'PPLUS Training guided workout tracking screen',
  },
  {
    slug: 'progress-tracking',
    title: 'Progress Tracking',
    description:
      'Track completed sessions, strength progress, and training consistency over time so athletes can see the work they’re putting in and keep building momentum.',
    image: '/landing/features/phone-progress-tracking.png',
    alt: 'PPLUS Training athlete progress tracking screen',
  },
  {
    slug: 'recovery-insights',
    title: 'Recovery Insights',
    description:
      'Connect training and recovery by giving athletes a better view of workload, consistency, and readiness so they can train hard without losing the bigger picture.',
    image: '/landing/features/phone-recovery-insights.png',
    alt: 'PPLUS Training recovery insights screen',
  },
]

export const programsSection = {
  label: 'PROGRAMS',
  heading: 'Programs Built for Hockey Development',
}

export const programs = [
  {
    title: 'P+ Off-Season',
    description:
      'This is the secret sauce. Do this program and completely dominate your next training camp.',
    bullets: ['10 weeks', '40+ workouts', '100+ exercises'],
  },
  {
    title: 'P+ Skills',
    description:
      'Follow along our skills video series while recording your best scores.',
    bullets: ['1-4 weeks', '20+ workouts', '40+ exercises'],
  },
  {
    title: 'P+ Advanced',
    description:
      'Follow along our tips and tricks video series while recording your best scores.',
    bullets: ['1-4 weeks', '30+ workouts', '50+ exercises'],
  },
]

export const footer = {
  brandCopy:
    'PPLUS Training helps hockey athletes stay locked in off the ice with guided training, simple tracking, and a clear plan built for long-term development.',
  contact: [
    { icon: 'map-pin', text: '80 boulevard Brien, Repentigny, QC', href: 'https://www.google.com/maps/search/?api=1&query=80%20boulevard%20Brien%2C%20Repentigny%2C%20QC', external: true },
    { icon: 'phone', text: '(514) 915-2722', href: 'tel:+15149152722' },
    { icon: 'mail', text: 'anthony.fortugno@performeplus.com' },
  ],
  featureLinks: features.map((feature) => ({
    label: feature.title,
    href: '/#features',
  })),
  programLinks: programs.map((program) => ({
    label: program.title,
    href: '/#programs',
  })),
  resourceLinks: [
    { label: 'Support', href: '/support' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Sign In', href: '/admin/login' },
  ],
  copyright: '2026 PPLUS Training. All rights reserved',
}
