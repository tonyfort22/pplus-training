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
    description: 'Browse the programs library table reference view.',
    items: [
      {
        id: 'programs-library',
        label: 'Library',
        href: '/admin/programs',
        title: 'Program library',
        description: 'Browse the programs library table reference view.',
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
    description: 'Browse the workout library and calendar.',
    items: [
      {
        id: 'workouts-library',
        label: 'Library',
        href: '/admin/workouts',
        title: 'Workout library',
        description: 'Browse the workout library and calendar.',
      },
      {
        id: 'workouts-calendar',
        label: 'Calendar',
        href: '/admin/workouts/calendar',
        title: 'Workout calendar',
        description: 'Review scheduled workouts, calendar alignment, and upcoming workload.',
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
    description: 'Maintain exercise entries used across the training system.',
    items: [
      {
        id: 'exercises-library',
        label: 'Library',
        href: '/admin/exercises',
        title: 'Exercise library',
        description: 'Maintain exercise entries used across the training system.',
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: 'message-circle',
    href: '/admin/support',
    defaultHref: '/admin/support',
    title: 'Support dashboard',
    description: 'Open the support inbox dashboard in a separate window.',
    external: true,
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
    description: 'Manage your profile and account settings.',
    items: [
      {
        id: 'settings-profile',
        label: 'Profile',
        href: '/admin/settings',
        title: 'Profile',
        description: 'Manage your admin profile photo and display name.',
      },
      {
        id: 'settings-account',
        label: 'Account',
        href: '/admin/settings/account',
        title: 'Account',
        description: 'Update admin sign-in email and password credentials.',
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
