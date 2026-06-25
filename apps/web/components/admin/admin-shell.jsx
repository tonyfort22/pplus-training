'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  BadgeCheck,
  CalendarRange,
  ChartColumn,
  ChevronRight,
  ChevronsUpDown,
  Dumbbell,
  Footprints,
  House,
  MessageCircle,
  Mic,
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
  useSidebar,
} from '@/components/ui/sidebar'
import {
  adminBottomNavigation,
  adminNavigation,
  findAdminRoute,
  getActiveExpandableAdminGroupId,
  getAdminRouteState,
  getNextExpandedAdminGroupId,
} from './admin-navigation'
import AdminThemeToggle from './admin-theme-toggle'
import { ADMIN_AI_BUTTON_CLASS_NAME } from './ui/ai-button-style'
import AthletesListView from './athletes-list-view'
import DashboardOverview from './dashboard-overview'
import ExercisesLibraryView from './exercises-library-view'
import GroupsListView from './groups-list-view'
import InvitesListView from './invites-list-view'
import ProgramsLibraryView from './programs-library-view'
import RankingsListView from './rankings-list-view'
import SettingsView from './settings-view'
import WorkoutsCalendarView from './workouts-calendar-view'
import WorkoutsLibraryView from './workouts-library-view'

const iconMap = {
  'calendar-range': CalendarRange,
  'chart-column': ChartColumn,
  dumbbell: Dumbbell,
  footprints: Footprints,
  house: House,
  'message-circle': MessageCircle,
  settings: Settings,
  users: Users,
}

const accountSwitcher = {
  name: 'Anthony Fortugno',
  email: 'tonyfortugno22@gmail.com',
  avatarUrl: '',
}

const accountMenuItems = [
  { id: 'profile', label: 'Profile', href: '/admin/settings' },
  { id: 'account', label: 'Account', href: '/admin/settings/account' },
]

const SELECTED_ADMIN_ATHLETE_STORAGE_KEY = 'pplus-admin-selected-athlete-id'

function buildAthleteQueryString(searchParams, athleteId) {
  const nextSearchParams = new URLSearchParams(searchParams?.toString() || '')

  if (athleteId) {
    nextSearchParams.set('athleteId', athleteId)
  } else {
    nextSearchParams.delete('athleteId')
  }

  const queryString = nextSearchParams.toString()
  return queryString ? `?${queryString}` : ''
}

function getAthleteInitials(athlete) {
  if (!athlete) {
    return 'AT'
  }

  const firstInitial = athlete.firstName?.trim()?.[0] || athlete.fullName?.trim()?.[0] || ''
  const lastInitial = athlete.lastName?.trim()?.[0] || ''
  const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase()

  return initials || 'AT'
}

function formatAthleteDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) {
    return 'Date of birth unavailable'
  }

  const [year, month, day] = String(dateOfBirth).split('-').map((value) => Number.parseInt(value, 10))

  if (!year || !month || !day) {
    return 'Date of birth unavailable'
  }

  return `${day}/${String(month).padStart(2, '0')}/${year}`
}

function getAthleteAge(dateOfBirth) {
  if (!dateOfBirth) {
    return null
  }

  const [year, month, day] = String(dateOfBirth).split('-').map((value) => Number.parseInt(value, 10))

  if (!year || !month || !day) {
    return null
  }

  const today = new Date()
  const birthDate = new Date(year, month - 1, day)

  if (Number.isNaN(birthDate.getTime())) {
    return null
  }

  let age = today.getFullYear() - birthDate.getFullYear()
  const hasHadBirthdayThisYear = (
    today.getMonth() > birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
  )

  if (!hasHadBirthdayThisYear) {
    age -= 1
  }

  return age >= 0 ? age : null
}

function formatAthleteBirthSummary(athlete) {
  const formattedDateOfBirth = formatAthleteDateOfBirth(athlete?.dateOfBirth)
  const age = getAthleteAge(athlete?.dateOfBirth)

  if (age === null) {
    return formattedDateOfBirth
  }

  return `${formattedDateOfBirth} (${age} year old)`
}

async function requestAdminAthletes() {
  const response = await fetch('/api/admin/athletes', {
    method: 'GET',
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load admin athletes.')
  }

  return Array.isArray(payload.athletes) ? payload.athletes : []
}

async function requestAdminCoachProfile() {
  const response = await fetch('/admin/api/settings/profile', {
    method: 'GET',
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load admin coach profile.')
  }

  return payload.profile || null
}

function getAccountInitials(profile = accountSwitcher) {
  const nameParts = String(profile?.name || '').trim().split(/\s+/).filter(Boolean)
  const firstInitial = nameParts[0]?.[0] || ''
  const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.[0] || '' : ''
  const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase()

  return initials || 'AF'
}

function AccountAvatar({ profile, className = '', fallbackClassName = '' }) {
  return profile?.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt={profile.name ? `${profile.name} profile image` : 'Admin profile image'}
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <span className={fallbackClassName}>{getAccountInitials(profile)}</span>
  )
}

function AdminFloatingMicButton() {
  return (
    <button
      type="button"
      aria-label="Record admin voice command"
      className={`admin-dashboard-floating-mic-button fixed bottom-[40px] right-[40px] z-50 h-14 w-14 rounded-[16px] ${ADMIN_AI_BUTTON_CLASS_NAME} inline-flex items-center justify-center transition`}
    >
      <Mic className="size-5" aria-hidden="true" />
    </button>
  )
}

function getGroupState(group, currentPath) {
  return getAdminRouteState(group, currentPath)
}

function AdminSidebarNavItem({ currentPath = '', group, isExpanded = false, onExpandedChange = () => {} }) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const Icon = iconMap[group.icon]
  const { currentItem, groupHref, isActive } = getGroupState(group, currentPath)

  if (group.items?.length) {
    return (
      <SidebarMenuItem>
        <details
          className="group/admin-sidebar-item"
          open={isExpanded}
          onToggle={(event) => onExpandedChange(event.currentTarget.open)}
        >
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className="admin-dashboard-sidebar-nav-button min-h-10 rounded-2xl px-3 text-[13px] font-medium hover:!bg-transparent active:!bg-transparent data-[active=true]:!bg-transparent hover:!text-[var(--admin-shell-primary-button-bg)] data-[active=true]:!text-[var(--admin-shell-primary-button-bg)] hover:[&_svg]:!text-[var(--admin-shell-primary-button-bg)] data-[active=true]:[&_svg]:!text-[var(--admin-shell-primary-button-bg)] group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0"
            tooltip={isCollapsed ? group.label : undefined}
          >
            <summary className="list-none [&::-webkit-details-marker]:hidden">
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              <span className="group-data-[collapsible=icon]:hidden">{group.label}</span>
              {!isCollapsed ? <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform group-open/admin-sidebar-item:rotate-90" /> : null}
            </summary>
          </SidebarMenuButton>

          <SidebarMenuSub className="admin-dashboard-sidebar-subnav ml-3 mt-1 pl-3">
            {group.items.map((item) => {
              const itemCurrent = item.current || currentItem?.id === item.id
              return (
                <SidebarMenuSubItem key={item.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={itemCurrent}
                    className="admin-dashboard-sidebar-subnav-button h-8 rounded-xl px-3 text-[12px] bg-transparent hover:!bg-transparent active:!bg-transparent data-[active=true]:!bg-transparent hover:!text-[var(--admin-shell-primary-button-bg)] data-[active=true]:!text-[var(--admin-shell-primary-button-bg)] data-[active=true]:font-medium"
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
        className="admin-dashboard-sidebar-nav-button min-h-10 rounded-2xl px-3 text-[13px] font-medium hover:!bg-transparent active:!bg-transparent data-[active=true]:!bg-transparent hover:!text-[var(--admin-shell-primary-button-bg)] data-[active=true]:!text-[var(--admin-shell-primary-button-bg)] hover:[&_svg]:!text-[var(--admin-shell-primary-button-bg)] data-[active=true]:[&_svg]:!text-[var(--admin-shell-primary-button-bg)] group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0"
        tooltip={isCollapsed ? group.label : undefined}
      >
        <Link href={groupHref} target={group.external ? '_blank' : undefined} rel={group.external ? 'noreferrer' : undefined}>
          {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
          <span className="group-data-[collapsible=icon]:hidden">{group.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function DashboardShellHeader({ searchQuery = '', onSearchQueryChange = () => {}, accountProfile = accountSwitcher }) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout(event) {
    event?.preventDefault()
    setIsLoggingOut(true)

    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
      })
    } finally {
      router.replace('/admin/login')
      router.refresh()
    }
  }

  return (
    <header className="admin-dashboard-topbar px-6 py-[18px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger
            className="admin-dashboard-sidebar-trigger relative z-30 h-8 w-8 shrink-0 rounded-md"
            aria-label="Toggle sidebar"
          />
          <div className="admin-dashboard-topbar-search flex min-w-0 flex-1 items-center gap-2">
            <Input
              className="admin-dashboard-topbar-search-input h-[35px] max-h-[35px] flex-1 rounded-[12px] px-4 text-sm focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
              placeholder="Search athletes, programs, or groups"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              aria-label="Search athletes, programs, or groups"
            />
            <Button
              type="button"
              size="lg"
              aria-label="Submit search"
              className="admin-dashboard-topbar-search-button h-[35px] max-h-[35px] rounded-[12px] px-4"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <AdminThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open top account menu"
              className="rounded-full transition-all hover:opacity-90"
            >
              <AccountAvatar
                profile={accountProfile}
                className="admin-dashboard-topbar-avatar h-8 w-8"
                fallbackClassName="admin-dashboard-topbar-avatar flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold leading-none"
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="bottom"
            align="end"
            sideOffset={12}
            className="admin-dashboard-dropdown-content w-[220px] rounded-2xl p-2"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accountMenuItems.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function SidebarBrandLogo() {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Link
      href="/"
      aria-label="Go to PPLUS home"
      className="flex items-center justify-start px-3 py-[14px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
    >
      {isCollapsed ? (
        <img className="h-6 w-auto" src="/admin/logo_pplus_mark_green.svg" alt="P+" />
      ) : (
        <>
          <img className="admin-dashboard-sidebar-logo admin-dashboard-sidebar-logo-dark h-5 w-auto" src="/admin/logo_pplus_training.svg" alt="PPLUS Training" />
          <img className="admin-dashboard-sidebar-logo admin-dashboard-sidebar-logo-light h-5 w-auto" src="/admin/logo_ppht_light_mode.svg" alt="PPLUS Training" />
        </>
      )}
    </Link>
  )
}

function SidebarWorkspaceSwitcher({
  athletes = [],
  athleteSearchQuery = '',
  onAthleteSearchQueryChange = () => {},
  selectedAthlete = null,
  onSelectAthlete = () => {},
  loadingState = 'idle',
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const filteredAthletes = athletes.filter((athlete) => {
    const normalizedQuery = athleteSearchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return true
    }

    return athlete.fullName.toLowerCase().includes(normalizedQuery)
      || athlete.shortcutCode.toLowerCase().includes(normalizedQuery)
  })

  const workspaceSwitcher = {
    name: selectedAthlete?.fullName || 'Select athlete',
    birthSummary: formatAthleteBirthSummary(selectedAthlete),
  }

  if (isCollapsed) {
    return null
  }

  return (
    <SidebarMenuItem className="admin-dashboard-sidebar-workspace-item">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="admin-dashboard-sidebar-switcher h-14 w-full rounded-2xl px-3">
            {selectedAthlete?.avatarUrl ? (
              <img
                src={selectedAthlete.avatarUrl}
                alt={selectedAthlete.fullName}
                className="admin-dashboard-sidebar-avatar h-8 w-8 shrink-0 rounded-full object-cover ring-1"
              />
            ) : (
              <span className="admin-dashboard-sidebar-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 text-[11px] font-semibold">
                {getAthleteInitials(selectedAthlete)}
              </span>
            )}
            <span className="grid min-w-0 flex-1 text-left text-[13px] leading-tight">
              <span className="admin-dashboard-sidebar-primary-text truncate font-semibold">{workspaceSwitcher.name}</span>
              <span className="admin-dashboard-sidebar-secondary-text truncate text-[11px]">{workspaceSwitcher.birthSummary}</span>
            </span>
            <ChevronsUpDown className="admin-dashboard-sidebar-secondary-text ml-auto h-4 w-4 shrink-0" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={12}
          className="admin-dashboard-dropdown-content admin-dashboard-sidebar-dropdown-content w-[280px] rounded-2xl p-2"
        >
          <DropdownMenuLabel>Athletes</DropdownMenuLabel>
          <div className="px-2 pb-2 pt-1">
            <Input
              value={athleteSearchQuery}
              onChange={(event) => onAthleteSearchQueryChange(event.target.value)}
              placeholder="Search athlete or shortcut"
              aria-label="Search athlete selector"
              className="admin-dashboard-topbar-search-input h-[35px] max-h-[35px] flex-1 rounded-[12px] px-4 text-sm focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
            />
          </div>
          <DropdownMenuSeparator />
          {loadingState === 'loading' ? (
            <DropdownMenuItem disabled>
              <span>Loading athletes…</span>
            </DropdownMenuItem>
          ) : filteredAthletes.length ? (
            filteredAthletes.map((athlete) => (
              <DropdownMenuItem key={athlete.id} onSelect={() => onSelectAthlete(athlete.id)} className="gap-3 rounded-xl px-3 py-2">
                {athlete.avatarUrl ? (
                  <img
                    src={athlete.avatarUrl}
                    alt={athlete.fullName}
                    className="admin-dashboard-sidebar-avatar h-8 w-8 shrink-0 rounded-full object-cover ring-1"
                  />
                ) : (
                  <span className="admin-dashboard-sidebar-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1">
                    {getAthleteInitials(athlete)}
                  </span>
                )}
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="admin-dashboard-sidebar-primary-text truncate text-[13px] font-medium">{athlete.fullName}</span>
                  <span className="admin-dashboard-sidebar-secondary-text truncate text-[11px]">{formatAthleteBirthSummary(athlete)}</span>
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <DropdownMenuShortcut className="admin-dashboard-sidebar-secondary-text ml-0 text-[11px] font-semibold tracking-[0.12em]">{athlete.shortcutCode}</DropdownMenuShortcut>
                  {selectedAthlete?.id === athlete.id ? <BadgeCheck className="h-4 w-4 shrink-0 text-[#3BE0AF]" /> : null}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              <span>No athletes match this search.</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function SidebarAccountSwitcher({ accountProfile = accountSwitcher }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="admin-dashboard-sidebar-account-button h-14 w-full rounded-2xl px-3 group-data-[collapsible=icon]:hidden">
              <AccountAvatar
                profile={accountProfile}
                className="admin-dashboard-sidebar-account-avatar h-8 w-8"
                fallbackClassName="admin-dashboard-sidebar-account-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold leading-none"
              />
              <span className="grid min-w-0 flex-1 text-left text-[13px] leading-tight group-data-[collapsible=icon]:hidden">
                <span className="admin-dashboard-sidebar-primary-text truncate font-semibold">{accountProfile.name}</span>
                <span className="admin-dashboard-sidebar-secondary-text truncate text-[11px]">{accountProfile.email}</span>
              </span>
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#3BE0AF] group-data-[collapsible=icon]:hidden" />
              <ChevronsUpDown className="admin-dashboard-sidebar-secondary-text h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={12}
            className="admin-dashboard-dropdown-content admin-dashboard-sidebar-dropdown-content w-[220px] rounded-2xl p-2"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accountMenuItems.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AdminDashboardSidebar({
  athletes = [],
  athleteSearchQuery = '',
  accountProfile = accountSwitcher,
  currentPath = '',
  loadingState = 'idle',
  onAthleteSearchQueryChange = () => {},
  onSelectAthlete = () => {},
  selectedAthlete = null,
}) {
  const topSections = [...adminNavigation, ...adminBottomNavigation]
  const activeExpandableGroupId = getActiveExpandableAdminGroupId(currentPath)
  const [expandedSidebarGroupId, setExpandedSidebarGroupId] = useState(activeExpandableGroupId)

  useEffect(() => {
    setExpandedSidebarGroupId(activeExpandableGroupId)
  }, [activeExpandableGroupId])

  return (
    <Sidebar collapsible="icon" className="admin-dashboard-sidebar !border-r-0 !border-l-0 border-r-0 border-l-0">
      <SidebarHeader className="admin-dashboard-sidebar-header gap-4 px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarBrandLogo />
      </SidebarHeader>

      <SidebarContent className="admin-dashboard-sidebar-content px-3 pb-20 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="admin-dashboard-sidebar-group-label px-3 pb-2 pt-0 text-[11px] font-medium uppercase tracking-[0.12em] group-data-[collapsible=icon]:hidden">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarWorkspaceSwitcher
                athletes={athletes}
                athleteSearchQuery={athleteSearchQuery}
                loadingState={loadingState}
                onAthleteSearchQueryChange={onAthleteSearchQueryChange}
                onSelectAthlete={onSelectAthlete}
                selectedAthlete={selectedAthlete}
              />
              {topSections.map((group) => (
                <AdminSidebarNavItem
                  key={group.id}
                  group={group}
                  currentPath={currentPath}
                  isExpanded={expandedSidebarGroupId === group.id}
                  onExpandedChange={(isOpen) => setExpandedSidebarGroupId((currentGroupId) => (
                    getNextExpandedAdminGroupId(currentGroupId, group.id, isOpen)
                  ))}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="admin-dashboard-sidebar-separator mx-5" />
      <SidebarFooter className="admin-dashboard-sidebar-footer px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarAccountSwitcher accountProfile={accountProfile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default function AdminShell({ currentPath = '', contentOverride = null }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [topbarSearchQuery, setTopbarSearchQuery] = useState('')
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('')
  const [accountProfile, setAccountProfile] = useState(accountSwitcher)
  const [athleteLoadState, setAthleteLoadState] = useState('idle')
  const [availableAthletes, setAvailableAthletes] = useState([])
  const [selectedAthleteId, setSelectedAthleteId] = useState(() => searchParams.get('athleteId') || '')
  const resolvedRoute = findAdminRoute(currentPath)
  const shouldRenderContentOverride = Boolean(contentOverride)

  useEffect(() => {
    let active = true

    async function loadCoachProfile() {
      try {
        const profile = await requestAdminCoachProfile()

        if (!active || !profile) {
          return
        }

        setAccountProfile({
          ...accountSwitcher,
          name: profile.name || accountSwitcher.name,
          email: profile.email || accountSwitcher.email,
          avatarUrl: profile.avatarUrl || '',
        })
      } catch (error) {
        if (active) {
          setAccountProfile(accountSwitcher)
        }
      }
    }

    loadCoachProfile()
    window.addEventListener('pplus-admin-profile-updated', loadCoachProfile)

    return () => {
      active = false
      window.removeEventListener('pplus-admin-profile-updated', loadCoachProfile)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadAthletes() {
      setAthleteLoadState('loading')

      try {
        const athletes = await requestAdminAthletes()

        if (!active) {
          return
        }

        setAvailableAthletes(athletes)
        setAthleteLoadState('ready')
      } catch (error) {
        if (!active) {
          return
        }

        setAvailableAthletes([])
        setAthleteLoadState('error')
      }
    }

    loadAthletes()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const athleteIdFromUrl = searchParams.get('athleteId') || ''

    if (athleteIdFromUrl && athleteIdFromUrl !== selectedAthleteId) {
      setSelectedAthleteId(athleteIdFromUrl)
    }
  }, [searchParams, selectedAthleteId])

  useEffect(() => {
    if (!availableAthletes.length) {
      return
    }

    const athleteIdFromUrl = searchParams.get('athleteId') || ''
    const athleteExists = (athleteId) => availableAthletes.some((athlete) => athlete.id === athleteId)

    if (athleteIdFromUrl && athleteExists(athleteIdFromUrl)) {
      if (selectedAthleteId !== athleteIdFromUrl) {
        setSelectedAthleteId(athleteIdFromUrl)
      }
      return
    }

    const storedAthleteId = typeof window !== 'undefined'
      ? window.localStorage.getItem(SELECTED_ADMIN_ATHLETE_STORAGE_KEY) || ''
      : ''

    const fallbackAthleteId = athleteExists(storedAthleteId)
      ? storedAthleteId
      : availableAthletes[0]?.id || ''

    if (!fallbackAthleteId) {
      return
    }

    if (fallbackAthleteId !== selectedAthleteId) {
      setSelectedAthleteId(fallbackAthleteId)
    }

    const nextQueryString = buildAthleteQueryString(searchParams, fallbackAthleteId)
    router.replace(`${pathname}${nextQueryString}`, { scroll: false })
  }, [availableAthletes, pathname, router, searchParams, selectedAthleteId])

  useEffect(() => {
    if (!selectedAthleteId || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SELECTED_ADMIN_ATHLETE_STORAGE_KEY, selectedAthleteId)
  }, [selectedAthleteId])

  const selectedAthlete = useMemo(() => {
    return availableAthletes.find((athlete) => athlete.id === selectedAthleteId) ?? null
  }, [availableAthletes, selectedAthleteId])

  function handleSelectAthlete(nextAthleteId) {
    setSelectedAthleteId(nextAthleteId)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SELECTED_ADMIN_ATHLETE_STORAGE_KEY, nextAthleteId)
    }

    const nextQueryString = buildAthleteQueryString(searchParams, nextAthleteId)
    router.replace(`${pathname}${nextQueryString}`, { scroll: false })
  }

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
  const isWorkoutsLibraryView = currentPath === '/admin/workouts'
  const isWorkoutsCalendarView = currentPath === '/admin/workouts/calendar'
  const isExercisesLibraryView = currentPath === '/admin/exercises'
  const isSettingsView = currentPath === '/admin/settings'
    || currentPath === '/admin/settings/account'

  return (
    <SidebarProvider defaultOpen>
      <AdminDashboardSidebar
        athletes={availableAthletes}
        athleteSearchQuery={athleteSearchQuery}
        accountProfile={accountProfile}
        currentPath={currentPath}
        loadingState={athleteLoadState}
        onAthleteSearchQueryChange={setAthleteSearchQuery}
        onSelectAthlete={handleSelectAthlete}
        selectedAthlete={selectedAthlete}
      />
      <SidebarInset className="admin-dashboard-shell-inset shadow-none md:m-0 md:rounded-none">
        <DashboardShellHeader searchQuery={topbarSearchQuery} onSearchQueryChange={setTopbarSearchQuery} accountProfile={accountProfile} />

        <div className="flex-1">
          <main className={['admin-shell-workspace', isDashboardOverview ? 'admin-shell-workspace-dashboard' : ''].filter(Boolean).join(' ')}>
            {!isDashboardOverview && !isAllAthletesView && !isAthleteInvitesView && !isAthleteGroupsView && !isAthleteRankingsView && !isProgramsLibraryView && !isWorkoutsLibraryView && !isWorkoutsCalendarView && !isExercisesLibraryView && !isSettingsView && (
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
            ) : isWorkoutsLibraryView ? (
              <WorkoutsLibraryView searchQuery={topbarSearchQuery} />
            ) : isWorkoutsCalendarView ? (
              <WorkoutsCalendarView selectedAthleteId={selectedAthleteId} />
            ) : isExercisesLibraryView ? (
              <ExercisesLibraryView searchQuery={topbarSearchQuery} />
            ) : isSettingsView ? (
              <SettingsView currentPath={currentPath} />
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
        <AdminFloatingMicButton />
      </SidebarInset>
    </SidebarProvider>
  )
}
