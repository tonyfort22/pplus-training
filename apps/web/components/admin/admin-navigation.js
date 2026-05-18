export const adminNavigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'house',
    href: '/admin/dashboard',
    defaultHref: '/admin/dashboard',
    title: 'Overview',
    description: 'Here is an overview of your platform.',
  },
  {
    id: 'athletes',
    label: 'Athletes',
    icon: 'users',
    href: '/admin/athletes',
    defaultHref: '/admin/athletes',
    title: 'All athletes',
    description: 'Browse athlete, invite, group, and rankings admin views from one place.',
    items: [
      {
        id: 'athletes-all',
        label: 'All athletes',
        href: '/admin/athletes',
        title: 'All athletes',
        description: 'Browse athlete, invite, group, and rankings admin views from one place.',
      },
      {
        id: 'athletes-invites',
        label: 'Invites',
        href: '/admin/athletes/invites',
        title: 'Athlete invites',
        description: 'Browse the invite list and invitation modal reference state.',
      },
      {
        id: 'athletes-groups',
        label: 'Groups',
        href: '/admin/athletes/groups',
        title: 'Athlete groups',
        description: 'Browse the athlete groups table reference view.',
      },
      {
        id: 'athletes-rankings',
        label: 'Rankings',
        href: '/admin/athletes/rankings',
        title: 'Athlete rankings',
        description: 'Browse the athlete rankings table reference view.',
      },
    ],
  },
  {
    id: 'programs',
    label: 'Programs',
    icon: 'calendar-range',
    href: '/admin/programs',
    defaultHref: '/admin/programs',
    title: 'Program library',
    description: 'Manage the program library, assignments, and reusable program templates.',
    items: [
      {
        id: 'programs-library',
        label: 'Library',
        href: '/admin/programs',
        title: 'Program library',
        description: 'Manage the program library, assignments, and reusable program templates.',
      },
      {
        id: 'programs-assigned',
        label: 'Assigned',
        href: '/admin/programs/assigned',
        title: 'Assigned programs',
        description: 'Review which programs are assigned, active, scheduled, or due for changes.',
      },
      {
        id: 'programs-templates',
        label: 'Templates',
        href: '/admin/programs/templates',
        title: 'Program templates',
        description: 'Manage reusable program structures that coaches can apply across athletes.',
      },
    ],
  },
  {
    id: 'workouts',
    label: 'Workouts',
    icon: 'dumbbell',
    href: '/admin/workouts',
    defaultHref: '/admin/workouts',
    title: 'Workout library',
    description: 'Browse the workout library, calendar, live sessions, and workout templates.',
    items: [
      {
        id: 'workouts-library',
        label: 'Library',
        href: '/admin/workouts',
        title: 'Workout library',
        description: 'Browse the workout library, calendar, live sessions, and workout templates.',
      },
      {
        id: 'workouts-calendar',
        label: 'Calendar',
        href: '/admin/workouts/calendar',
        title: 'Workout calendar',
        description: 'Review scheduled workouts, calendar alignment, and upcoming workload.',
      },
      {
        id: 'workouts-sessions',
        label: 'Sessions',
        href: '/admin/workouts/sessions',
        title: 'Workout sessions',
        description: 'Inspect live and completed sessions, session outcomes, and workout execution.',
      },
      {
        id: 'workouts-templates',
        label: 'Templates',
        href: '/admin/workouts/templates',
        title: 'Workout templates',
        description: 'Maintain repeatable workout templates for faster programming workflows.',
      },
    ],
  },
  {
    id: 'exercises',
    label: 'Exercises',
    icon: 'footprints',
    href: '/admin/exercises',
    defaultHref: '/admin/exercises',
    title: 'Exercise library',
    description: 'Maintain exercise entries, categories, and media used across the training system.',
    items: [
      {
        id: 'exercises-library',
        label: 'Library',
        href: '/admin/exercises',
        title: 'Exercise library',
        description: 'Maintain exercise entries, categories, and media used across the training system.',
      },
      {
        id: 'exercises-categories',
        label: 'Categories',
        href: '/admin/exercises/categories',
        title: 'Exercise categories',
        description: 'Control exercise grouping, classification, and organization for the library.',
      },
      {
        id: 'exercises-media',
        label: 'Media',
        href: '/admin/exercises/media',
        title: 'Exercise media',
        description: 'Manage video and media assets that power the exercise library experience.',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'chart-column',
    href: '/admin/analytics',
    defaultHref: '/admin/analytics',
    title: 'Analytics overview',
    description: 'Review athlete, program, session, and compliance reporting from the admin side.',
    items: [
      {
        id: 'analytics-overview',
        label: 'Overview',
        href: '/admin/analytics',
        title: 'Analytics overview',
        description: 'Review athlete, program, session, and compliance reporting from the admin side.',
      },
      {
        id: 'analytics-athletes',
        label: 'Athletes',
        href: '/admin/analytics/athletes',
        title: 'Athlete analytics',
        description: 'Analyze athlete-level trends, outcomes, and reporting breakdowns.',
      },
      {
        id: 'analytics-programs',
        label: 'Programs',
        href: '/admin/analytics/programs',
        title: 'Program analytics',
        description: 'Inspect program-level reporting, adherence, and programming performance.',
      },
      {
        id: 'analytics-sessions',
        label: 'Sessions',
        href: '/admin/analytics/sessions',
        title: 'Session analytics',
        description: 'Review training session metrics, output, and session-level trends.',
      },
      {
        id: 'analytics-compliance',
        label: 'Compliance',
        href: '/admin/analytics/compliance',
        title: 'Compliance analytics',
        description: 'Track completion, compliance, and adherence signals across the system.',
      },
    ],
  },
]

export const adminBottomNavigation = [
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    href: '/admin/settings',
    defaultHref: '/admin/settings',
    title: 'Profile',
    description: 'Manage workspace settings, team access, preferences, integrations, and admin tools.',
    items: [
      {
        id: 'settings-profile',
        label: 'Profile',
        href: '/admin/settings',
        title: 'Profile',
        description: 'Manage workspace settings, team access, preferences, integrations, and admin tools.',
      },
      {
        id: 'settings-workspace',
        label: 'Workspace',
        href: '/admin/settings/workspace',
        title: 'Workspace',
        description: 'Configure workspace-level settings, branding, and admin workspace defaults.',
      },
      {
        id: 'settings-team',
        label: 'Team',
        href: '/admin/settings/team',
        title: 'Team',
        description: 'Manage staff access, team structure, and admin-side collaboration settings.',
      },
      {
        id: 'settings-preferences',
        label: 'Preferences',
        href: '/admin/settings/preferences',
        title: 'Preferences',
        description: 'Adjust dashboard preferences, defaults, and admin-facing display behavior.',
      },
      {
        id: 'settings-integrations',
        label: 'Integrations',
        href: '/admin/settings/integrations',
        title: 'Integrations',
        description: 'Review and manage external integrations connected to the admin workspace.',
      },
      {
        id: 'settings-admin-tools',
        label: 'Admin Tools',
        href: '/admin/settings/admin-tools',
        title: 'Admin Tools',
        description: 'Open higher-trust admin tooling for diagnostics, support, and maintenance flows.',
      },
    ],
  },
]

const navigationGroups = [...adminNavigation, ...adminBottomNavigation]

export function findAdminRoute(currentPath = '') {
  for (const group of navigationGroups) {
    if (group.href === currentPath) {
      const currentItem = group.items?.find((item) => item.href === currentPath) ?? group.items?.[0] ?? group
      return {
        currentGroup: group,
        currentItem,
      }
    }

    const itemMatch = group.items?.find((item) => item.href === currentPath)
    if (itemMatch) {
      return {
        currentGroup: group,
        currentItem: itemMatch,
      }
    }
  }

  return null
}

export function buildAdminPath(section, subsection) {
  return subsection ? `/admin/${section}/${subsection}` : `/admin/${section}`
}
