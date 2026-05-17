import {
  CalendarRange,
  ChartColumn,
  Dumbbell,
  Footprints,
  House,
  Settings,
  Users,
} from 'lucide-react'

import Sidebar from '../ui/sidebar'
import SidebarLayout from '../ui/sidebar-layout'
import { adminBottomNavigation, adminNavigation, findAdminRoute } from './admin-navigation'

const iconMap = {
  'calendar-range': CalendarRange,
  'chart-column': ChartColumn,
  dumbbell: Dumbbell,
  footprints: Footprints,
  house: House,
  settings: Settings,
  users: Users,
}

function withIcons(groups = []) {
  return groups.map((group) => {
    const Icon = iconMap[group.icon]

    return {
      ...group,
      icon: Icon ? <Icon className="h-4 w-4" /> : null,
      items: group.items.map((item) => ({ ...item })),
    }
  })
}

export default function AdminShell({ currentPath = '' }) {
  const resolvedRoute = findAdminRoute(currentPath)

  if (!resolvedRoute) {
    return null
  }

  const { currentGroup, currentItem } = resolvedRoute
  const topSections = withIcons(adminNavigation)
  const bottomSections = withIcons(adminBottomNavigation)
  const pageTitle = currentItem.title
  const pageDescription = currentItem.description
  const sectionLabel = currentGroup.label

  return (
    <SidebarLayout
      sidebar={
        <Sidebar
          brandLogoSrc="/admin/logo_pplus_training.svg"
          brandLogoAlt="PPLUS Training"
          brandMark="P+"
          title="TRAINING"
          searchPlaceholder="Search for..."
          sections={topSections}
          bottomSections={bottomSections}
          currentPath={currentPath}
        />
      }
    >
      <main className="admin-shell-workspace">
        <div className="admin-shell-workspace-header">
          <span className="admin-shell-workspace-kicker">{sectionLabel}</span>
          <h1 className="admin-shell-workspace-title">{pageTitle}</h1>
          <p className="admin-shell-workspace-description">{pageDescription}</p>
        </div>

        <section className="admin-shell-workspace-panel">
          <h2 className="admin-shell-workspace-panel-title">{pageTitle} workspace</h2>
          <p className="admin-shell-workspace-panel-copy">
            This route is wired into the real admin navigation system. Build the page content for this section here instead of falling back to a single mocked showcase screen.
          </p>
        </section>
      </main>
    </SidebarLayout>
  )
}
