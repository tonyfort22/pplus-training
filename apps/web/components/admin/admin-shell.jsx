'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  CalendarRange,
  ChartColumn,
  ChevronRight,
  ChevronsUpDown,
  Dumbbell,
  Footprints,
  House,
  Search,
  Settings,
  Users,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { adminBottomNavigation, adminNavigation, findAdminRoute } from './admin-navigation'
import AthletesListView from './athletes-list-view'
import DashboardOverview from './dashboard-overview'
import GroupsListView from './groups-list-view'
import InvitesListView from './invites-list-view'
import ProgramsLibraryView from './programs-library-view'
import RankingsListView from './rankings-list-view'

const iconMap = {
  'calendar-range': CalendarRange,
  'chart-column': ChartColumn,
  dumbbell: Dumbbell,
  footprints: Footprints,
  house: House,
  settings: Settings,
  users: Users,
}

const accountSwitcher = {
  name: 'Anthony Fortugno',
  email: 'tonyfortugno22@gmail.com',
}

const accountMenuItems = [
  { id: 'profile', label: 'Profile' },
  { id: 'billing', label: 'Billing' },
  { id: 'settings', label: 'Settings' },
  { id: 'keyboard-shortcuts', label: 'Keyboard shortcuts' },
]

function isPathActive(currentPath = '', href = '') {
  if (!href) return false
  return currentPath === href || currentPath.startsWith(`${href}/`)
}

function getGroupState(group, currentPath) {
  const groupHref = group.href || group.defaultHref || group.items?.[0]?.href || '/'
  const hasActiveChild = group.items?.some((item) => currentPath === item.href)
  const isActive = group.current || isPathActive(currentPath, groupHref) || hasActiveChild

  return {
    groupHref,
    hasActiveChild,
    isActive,
  }
}

function AdminSidebarNavItem({ currentPath = '', group }) {
  const Icon = iconMap[group.icon]
  const { groupHref, isActive } = getGroupState(group, currentPath)
  const showSubtabs = isActive || (currentPath === '/admin/dashboard' && group.id === 'athletes')

  if (group.items?.length) {
    return (
      <SidebarMenuItem>
        <details className="group/admin-sidebar-item" open={showSubtabs}>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className="min-h-10 rounded-2xl px-3 text-[13px] font-medium text-[#dbe4ef] data-[active=true]:bg-[#111d30] data-[active=true]:text-[#eef4ff] hover:bg-[#111d30] hover:text-[#eef4ff] group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0"
            tooltip={group.label}
          >
            <summary className="list-none [&::-webkit-details-marker]:hidden">
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              <span className="group-data-[collapsible=icon]:hidden">{group.label}</span>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform group-open/admin-sidebar-item:rotate-90 group-data-[collapsible=icon]:hidden" />
            </summary>
          </SidebarMenuButton>

          <SidebarMenuSub className="ml-3 mt-1 border-l border-[#24334a] pl-3">
            {group.items.map((item) => {
              const itemCurrent = item.current || currentPath === item.href
              return (
                <SidebarMenuSubItem key={item.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={itemCurrent}
                    className="h-8 rounded-xl px-3 text-[12px] text-[#8ea0bc] data-[active=true]:bg-[#111d30] data-[active=true]:font-medium data-[active=true]:text-[#eef4ff] hover:bg-[#111d30] hover:text-[#eef4ff]"
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </details>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="min-h-10 rounded-2xl px-3 text-[13px] font-medium text-[#dbe4ef] data-[active=true]:bg-[#111d30] data-[active=true]:text-[#eef4ff] hover:bg-[#111d30] hover:text-[#eef4ff] group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0"
        tooltip={group.label}
      >
        <Link href={groupHref}>
          {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
          <span className="group-data-[collapsible=icon]:hidden">{group.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function DashboardShellHeader({ searchQuery = '', onSearchQueryChange = () => {} }) {
  return (
    <header className="admin-dashboard-topbar border-b border-[#24334A] bg-[rgba(10,18,33,0.3)] px-6 py-[18px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger
            className="relative z-30 h-8 w-8 shrink-0 rounded-md border border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
            aria-label="Toggle sidebar"
          />
          <div className="admin-dashboard-topbar-search flex min-w-0 flex-1 items-center gap-2">
            <Input
              className="h-[35px] max-h-[35px] flex-1 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
              placeholder="Search athletes, programs, or groups"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              aria-label="Search athletes, programs, or groups"
            />
            <Button
              type="button"
              size="lg"
              aria-label="Submit search"
              className="h-[35px] max-h-[35px] rounded-[12px] border border-[#3BE0AF] bg-[#3BE0AF] px-4 text-[#0B1120] hover:bg-[#35c89d]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open top account menu"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E0FCF0] text-[12px] font-bold leading-none text-[#06D6A0] transition-all hover:opacity-90"
            >
              AF
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="bottom"
            align="end"
            sideOffset={12}
            className="w-[220px] rounded-2xl border border-[#24334A] bg-[#111D30] p-2 text-[#DCE6F8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accountMenuItems.map((item) => (
              <DropdownMenuItem key={item.id}>
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function SidebarBrandLogo() {
  return (
    <div className="flex items-center justify-start px-3 py-[14px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
      <img className="h-5 w-auto group-data-[collapsible=icon]:hidden" src="/admin/logo_pplus_training.svg" alt="PPLUS Training" />
      <img className="hidden h-6 w-auto group-data-[collapsible=icon]:block" src="/admin/logo_pplus_mark_green.svg" alt="P+" />
    </div>
  )
}

function SidebarWorkspaceSwitcher() {
  const workspaceSwitcher = {
    name: 'PPLUS Training',
    plan: 'Admin workspace',
  }

  const shortcutItems = [
    { id: 'dashboard', label: 'Dashboard', shortcut: '⌘B' },
    { id: 'new-program', label: 'New program', shortcut: '⌘N' },
    { id: 'open-profile', label: 'Open profile', shortcut: '⌘P' },
  ]

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="h-14 w-full rounded-2xl border border-[#24334A] bg-[#111D30] px-3 hover:bg-[#15233a] hover:text-[#eef4ff] group-data-[collapsible=icon]:hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B1120] ring-1 ring-[#24334A]">
              <img className="h-5 w-auto" src="/admin/logo_pplus_training.svg" alt="PPLUS Training" />
            </span>
            <span className="grid min-w-0 flex-1 text-left text-[13px] leading-tight">
              <span className="truncate font-semibold text-[#EEF4FF]">{workspaceSwitcher.name}</span>
              <span className="truncate text-[11px] text-[#8EA0BC]">{workspaceSwitcher.plan}</span>
            </span>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-[#8EA0BC]" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={12}
          className="w-[220px] rounded-2xl border border-[#24334A] bg-[#111D30] p-2 text-[#DCE6F8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        >
          <DropdownMenuLabel>Shortcuts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {shortcutItems.map((item) => (
            <DropdownMenuItem key={item.id}>
              <span>{item.label}</span>
              <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="pt-2 text-[11px] normal-case tracking-normal text-[#70809E]">Shortcut items</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function SidebarAccountSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="h-14 w-full rounded-2xl border border-[#24334A] bg-[#111D30] px-3 hover:bg-[#15233a] hover:text-[#eef4ff] group-data-[collapsible=icon]:hidden">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3BE0AF] text-[12px] font-bold leading-none text-[#0B1120]">
                AF
              </span>
              <span className="grid min-w-0 flex-1 text-left text-[13px] leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-[#EEF4FF]">{accountSwitcher.name}</span>
                <span className="truncate text-[11px] text-[#8EA0BC]">{accountSwitcher.email}</span>
              </span>
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#3BE0AF] group-data-[collapsible=icon]:hidden" />
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#8EA0BC] group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={12}
            className="w-[220px] rounded-2xl border border-[#24334A] bg-[#111D30] p-2 text-[#DCE6F8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accountMenuItems.map((item) => (
              <DropdownMenuItem key={item.id}>
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AdminDashboardSidebar({ currentPath = '' }) {
  const topSections = [...adminNavigation, ...adminBottomNavigation]

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-4 px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarBrandLogo />
      </SidebarHeader>

      <SidebarContent className="px-3 pb-20 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 pb-2 pt-0 text-[11px] font-medium uppercase tracking-[0.12em] text-[#6F809D] group-data-[collapsible=icon]:hidden">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarWorkspaceSwitcher />
              {topSections.map((group) => (
                <AdminSidebarNavItem key={group.id} group={group} currentPath={currentPath} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-5 bg-[#24334a]" />
      <SidebarFooter className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarAccountSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default function AdminShell({ currentPath = '', contentOverride = null }) {
  const [topbarSearchQuery, setTopbarSearchQuery] = useState('')
  const resolvedRoute = findAdminRoute(currentPath)
  const shouldRenderContentOverride = Boolean(contentOverride)

  if (!resolvedRoute) {
    return null
  }

  const { currentGroup, currentItem } = resolvedRoute
  const pageTitle = currentItem.title
  const pageDescription = currentItem.description
  const sectionLabel = currentGroup.label
  const isDashboardOverview = currentPath === '/admin/dashboard'
  const isAllAthletesView = currentPath === '/admin/athletes'
  const isAthleteInvitesView = currentPath === '/admin/athletes/invites'
  const isAthleteGroupsView = currentPath === '/admin/athletes/groups'
  const isAthleteRankingsView = currentPath === '/admin/athletes/rankings'
  const isProgramsLibraryView = currentPath === '/admin/programs'

  return (
    <SidebarProvider defaultOpen>
      <AdminDashboardSidebar currentPath={currentPath} />
      <SidebarInset className="bg-[#0b1120] shadow-none md:m-0 md:rounded-none">
        <DashboardShellHeader searchQuery={topbarSearchQuery} onSearchQueryChange={setTopbarSearchQuery} />

        <div className="flex-1">
          <main className={['admin-shell-workspace', isDashboardOverview ? 'admin-shell-workspace-dashboard' : ''].filter(Boolean).join(' ')}>
            {!isDashboardOverview && !isAllAthletesView && !isAthleteInvitesView && !isAthleteGroupsView && !isAthleteRankingsView && !isProgramsLibraryView && (
              <div className="admin-shell-workspace-header">
                <span className="admin-shell-workspace-kicker">{sectionLabel}</span>
                <h1 className="admin-shell-workspace-title">{pageTitle}</h1>
                <p className="admin-shell-workspace-description">{pageDescription}</p>
              </div>
            )}

            {isDashboardOverview ? (
              <DashboardOverview />
            ) : isAllAthletesView ? (
              <AthletesListView searchQuery={topbarSearchQuery} />
            ) : isAthleteInvitesView ? (
              <InvitesListView searchQuery={topbarSearchQuery} />
            ) : isAthleteGroupsView ? (
              <GroupsListView searchQuery={topbarSearchQuery} />
            ) : isAthleteRankingsView ? (
              <RankingsListView searchQuery={topbarSearchQuery} />
            ) : isProgramsLibraryView ? (
              shouldRenderContentOverride ? (
                <>{contentOverride}</>
              ) : (
                <ProgramsLibraryView searchQuery={topbarSearchQuery} />
              )
            ) : (
              <section className="admin-shell-workspace-panel">
                <h2 className="admin-shell-workspace-panel-title">{pageTitle} workspace</h2>
                <p className="admin-shell-workspace-panel-copy">
                  This route is wired into the real admin navigation system. Build the page content for this section here instead of falling back to a single mocked showcase screen.
                </p>
              </section>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
