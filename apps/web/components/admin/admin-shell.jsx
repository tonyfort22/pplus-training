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
import ExercisesLibraryView from './exercises-library-view'
import GroupsListView from './groups-list-view'
import InvitesListView from './invites-list-view'
import ProgramsLibraryView from './programs-library-view'
import RankingsListView from './rankings-list-view'
import WorkoutsCalendarView from './workouts-calendar-view'
import WorkoutsLibraryView from './workouts-library-view'

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
            className="min-h-10 rounded-2xl px-3 text-[13px] font-medium text-[#dbe4ef] data-[active=true]:bg-[#2d4c4c] data-[active=true]:text-[#3BE0AF] hover:bg-[#111d30] hover:text-[#eef4ff] group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0"
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
                    className="h-8 rounded-xl px-3 text-[12px] text-[#8ea0bc] bg-transparent data-[active=true]:bg-transparent data-[active=true]:font-medium data-[active=true]:text-[#3BE0AF] hover:bg-transparent hover:text-[#3BE0AF] active:bg-transparent"
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
        className="min-h-10 rounded-2xl px-3 text-[13px] font-medium text-[#dbe4ef] data-[active=true]:bg-[#2d4c4c] data-[active=true]:text-[#3BE0AF] hover:bg-[#111d30] hover:text-[#eef4ff] group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0"
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

function SidebarWorkspaceSwitcher({
  athletes = [],
  athleteSearchQuery = '',
  onAthleteSearchQueryChange = () => {},
  selectedAthlete = null,
  onSelectAthlete = () => {},
  loadingState = 'idle',
}) {
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

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="h-14 w-full rounded-2xl border border-[#24334A] bg-[#111D30] px-3 hover:bg-[#15233a] hover:text-[#eef4ff] group-data-[collapsible=icon]:hidden">
            {selectedAthlete?.avatarUrl ? (
              <img
                src={selectedAthlete.avatarUrl}
                alt={selectedAthlete.fullName}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-[#24334A]"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B1120] ring-1 ring-[#24334A] text-[11px] font-semibold text-[#3BE0AF]">
                {getAthleteInitials(selectedAthlete)}
              </span>
            )}
            <span className="grid min-w-0 flex-1 text-left text-[13px] leading-tight">
              <span className="truncate font-semibold text-[#EEF4FF]">{workspaceSwitcher.name}</span>
              <span className="truncate text-[11px] text-[#8EA0BC]">{workspaceSwitcher.birthSummary}</span>
            </span>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-[#8EA0BC]" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={12}
          className="w-[280px] rounded-2xl border border-[#24334A] bg-[#111D30] p-2 text-[#DCE6F8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        >
          <DropdownMenuLabel>Athletes</DropdownMenuLabel>
          <div className="px-2 pb-2 pt-1">
            <Input
              value={athleteSearchQuery}
              onChange={(event) => onAthleteSearchQueryChange(event.target.value)}
              placeholder="Search athlete or shortcut"
              aria-label="Search athlete selector"
              className="h-[35px] max-h-[35px] flex-1 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
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
                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-[#24334A]"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B1120] text-[11px] font-semibold text-[#3BE0AF] ring-1 ring-[#24334A]">
                    {getAthleteInitials(athlete)}
                  </span>
                )}
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-[13px] font-medium text-[#EEF4FF]">{athlete.fullName}</span>
                  <span className="truncate text-[11px] text-[#8EA0BC]">{formatAthleteBirthSummary(athlete)}</span>
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <DropdownMenuShortcut className="ml-0 text-[11px] font-semibold tracking-[0.12em] text-[#8EA0BC]">{athlete.shortcutCode}</DropdownMenuShortcut>
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

function AdminDashboardSidebar({
  athletes = [],
  athleteSearchQuery = '',
  currentPath = '',
  loadingState = 'idle',
  onAthleteSearchQueryChange = () => {},
  onSelectAthlete = () => {},
  selectedAthlete = null,
}) {
  const topSections = [...adminNavigation, ...adminBottomNavigation]

  return (
    <Sidebar collapsible="icon" className="data-[side=left]:border-r data-[side=right]:border-l border-[#24334A]">
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
              <SidebarWorkspaceSwitcher
                athletes={athletes}
                athleteSearchQuery={athleteSearchQuery}
                loadingState={loadingState}
                onAthleteSearchQueryChange={onAthleteSearchQueryChange}
                onSelectAthlete={onSelectAthlete}
                selectedAthlete={selectedAthlete}
              />
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
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [topbarSearchQuery, setTopbarSearchQuery] = useState('')
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('')
  const [athleteLoadState, setAthleteLoadState] = useState('idle')
  const [availableAthletes, setAvailableAthletes] = useState([])
  const [selectedAthleteId, setSelectedAthleteId] = useState(() => searchParams.get('athleteId') || '')
  const resolvedRoute = findAdminRoute(currentPath)
  const shouldRenderContentOverride = Boolean(contentOverride)

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

  return (
    <SidebarProvider defaultOpen>
      <AdminDashboardSidebar
        athletes={availableAthletes}
        athleteSearchQuery={athleteSearchQuery}
        currentPath={currentPath}
        loadingState={athleteLoadState}
        onAthleteSearchQueryChange={setAthleteSearchQuery}
        onSelectAthlete={handleSelectAthlete}
        selectedAthlete={selectedAthlete}
      />
      <SidebarInset className="bg-[#0b1120] shadow-none md:m-0 md:rounded-none">
        <DashboardShellHeader searchQuery={topbarSearchQuery} onSearchQueryChange={setTopbarSearchQuery} />

        <div className="flex-1">
          <main className={['admin-shell-workspace', isDashboardOverview ? 'admin-shell-workspace-dashboard' : ''].filter(Boolean).join(' ')}>
            {!isDashboardOverview && !isAllAthletesView && !isAthleteInvitesView && !isAthleteGroupsView && !isAthleteRankingsView && !isProgramsLibraryView && !isWorkoutsLibraryView && !isWorkoutsCalendarView && !isExercisesLibraryView && (
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
