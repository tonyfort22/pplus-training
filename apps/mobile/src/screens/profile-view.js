import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as data from '../../../../packages/data/src/index.js';
import { Bell, CalendarDays, CalendarRange, ChevronDown, ChevronLeft, ChevronRight, Dumbbell, HeartPulse, ImagePlus, Info, Languages, LogOut, Palette, RefreshCcw, Ruler, SlidersHorizontal, User, UserCircle2, Users } from 'lucide-react-native';
import { Image, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTheme } from '../theme/app-theme.js';
import { ExerciseLibraryView } from './exercise-library-view.js';
import { CoachAthletesSheetContent } from './coach-athletes-sheet.js';
import { AppButton, AppFieldShell, AppListRow, AppNoticeCard, AppSearchInput, AppSegmentedControl, AppSheetHeader } from '../ui/primitives.js';
import { Skeleton } from '../ui/skeleton.js';

const INITIAL_VIEW_SKELETON_DELAY_MS = 1500

const PROFILE_SECTIONS = [
  {
    id: 'training',
    title: 'TRAINING',
    items: [
      { id: 'profile', label: 'Profile', icon: 'user' },
      { id: 'athletes', label: 'Athletes', icon: 'users', roles: ['coach'] },
      { id: 'exercises', label: 'Exercises', icon: 'dumbbell' },
      { id: 'programs', label: 'Programs', icon: 'calendar-range' },
    ],
  },
  {
    id: 'preferences',
    title: 'PREFERENCES',
    items: [
      { id: 'theme', label: 'Theme', icon: 'palette' },
      { id: 'units', label: 'Units', icon: 'ruler' },
      { id: 'week-start', label: 'Week Start', icon: 'calendar-days' },
      { id: 'reminder', label: 'Reminder', icon: 'bell' },
      { id: 'languages', label: 'Languages', icon: 'languages' },
    ],
  },
  {
    id: 'connected-apps',
    title: 'Connected Apps',
    items: [
      { id: 'apple-health', label: 'Apple Health', icon: 'heart-pulse' },
    ],
  },
]

const PROFILE_DETAIL_FIELDS = [
  { id: 'first-name', label: 'First name', value: 'Thomas', type: 'text' },
  { id: 'last-name', label: 'Last name', value: 'Thibault', type: 'text' },
  { id: 'date-of-birth', label: 'Date of birth', value: '1/01/2011', type: 'date' },
  { id: 'gender', label: 'Gender', value: 'Male', type: 'dropdown' },
  { id: 'position', label: 'Position', value: 'Forward', type: 'dropdown' },
  { id: 'height', label: 'Height', value: "5'11", type: 'text' },
  { id: 'weight', label: 'Weight', value: '170-175 lb', type: 'text' },
]

const PROFILE_DETAIL_MODEL = {
  title: 'Profile',
  avatarLabel: 'Photo Upload',
  fields: PROFILE_DETAIL_FIELDS,
}

const PROFILE_GENDER_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' },
]

const PROFILE_POSITION_OPTIONS = [
  { id: 'forward', label: 'Forward' },
  { id: 'defence', label: 'Defence' },
  { id: 'goalie', label: 'Goalie' },
]

const PROFILE_UNITS_OPTIONS = [
  { id: 'imperial', label: 'Imperial' },
  { id: 'metric', label: 'Metric' },
]

function formatProfileNumberDraft(value, suffix) {
  if (value == null) return ''
  return String(value).replace(suffix, '').trim()
}

function formatPhoneNumberDraft(value) {
  if (value == null) return ''

  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 10)
  if (!digitsOnly) return ''
  if (digitsOnly.length < 4) return digitsOnly
  if (digitsOnly.length < 7) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`
  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
}

function getSafeProfileImageUri(value) {
  if (value == null) return null

  const candidate = String(value).trim()
  if (!candidate) return null

  const allowedImageUriPattern = /^(https?:\/\/|file:\/\/|content:\/\/|assets-library:\/\/|ph:\/\/|data:image\/)/i
  return allowedImageUriPattern.test(candidate) ? candidate : null
}

function parseProfileDateValue(value) {
  if (!value) return null

  const isoDateMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateMatch) {
    return new Date(Number(isoDateMatch[1]), Number(isoDateMatch[2]) - 1, Number(isoDateMatch[3]))
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function formatProfileDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatProfileDateDisplay(value) {
  const parsedDate = parseProfileDateValue(value)
  if (!parsedDate) return 'Select date'

  return parsedDate.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function convertCentimetersToImperialHeight(heightCm) {
  if (heightCm == null) return ''
  const totalInches = Math.round(Number(heightCm) / 2.54)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}.${String(inches).padStart(2, '0')}`
}

function convertKilogramsToImperialWeight(weightKg) {
  if (weightKg == null) return ''
  return String(Math.round(Number(weightKg) * 2.20462))
}

function convertHeightDraftToMetricCm(value, unitsPreference) {
  const parsedValue = parseNullableNumber(value)
  if (parsedValue == null) return null
  if (unitsPreference === 'imperial') {
    const feet = Math.trunc(parsedValue)
    const inches = Math.round((parsedValue - feet) * 100)
    return Math.round(((feet * 12) + inches) * 2.54)
  }
  return parsedValue
}

function convertWeightDraftToMetricKg(value, unitsPreference) {
  const parsedValue = parseNullableNumber(value)
  if (parsedValue == null) return null
  if (unitsPreference === 'imperial') {
    return Math.round((parsedValue / 2.20462) * 10) / 10
  }
  return parsedValue
}

function getHeightFieldLabel(unitsPreference) {
  return unitsPreference === 'imperial' ? 'Height (ft.in)' : 'Height (cm)'
}

function getWeightFieldLabel(unitsPreference) {
  return unitsPreference === 'imperial' ? 'Weight (lb)' : 'Weight (kg)'
}

function getNumericFieldPlaceholder(fieldId, unitsPreference) {
  if (fieldId === 'height') return unitsPreference === 'imperial' ? 'ex. 5.11' : 'cm'
  if (fieldId === 'weight') return unitsPreference === 'imperial' ? 'lb' : 'kg'
  return ''
}

function formatProfileIdentityBirthLabel(value) {
  const parsedDate = parseProfileDateValue(value)
  if (!parsedDate) return 'DOB pending'

  const today = new Date()
  let age = today.getFullYear() - parsedDate.getFullYear()
  const hasBirthdayPassed = today.getMonth() > parsedDate.getMonth()
    || (today.getMonth() === parsedDate.getMonth() && today.getDate() >= parsedDate.getDate())
  if (!hasBirthdayPassed) {
    age -= 1
  }

  const day = parsedDate.getDate()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const year = parsedDate.getFullYear()
  const ageLabel = age >= 0 ? `${age} year old` : 'Age pending'

  return `${day}/${month}/${year} (${ageLabel})`
}

function formatProfileIdentityHeight(athleteProfile, unitsPreference) {
  if (athleteProfile?.heightCm == null) return 'Height pending'

  if (unitsPreference === 'imperial') {
    const totalInches = Math.round(Number(athleteProfile.heightCm) / 2.54)
    const feet = Math.floor(totalInches / 12)
    const inches = totalInches % 12
    return `${feet}'${inches}"`
  }

  return `${(Number(athleteProfile.heightCm) / 100).toFixed(2)} m`
}

function formatProfileIdentityWeight(athleteProfile, unitsPreference) {
  if (athleteProfile?.weightKg == null) return 'Weight pending'

  if (unitsPreference === 'imperial') {
    return `${convertKilogramsToImperialWeight(athleteProfile.weightKg)} lbs`
  }

  return `${Math.round(Number(athleteProfile.weightKg) * 10) / 10} kg`
}

function normalizeProfileDraftValue(field, unitsPreference = 'metric') {
  if (field.id === 'height') {
    const normalizedHeight = formatProfileNumberDraft(field.value, 'cm')
    return unitsPreference === 'imperial'
      ? convertCentimetersToImperialHeight(normalizedHeight)
      : normalizedHeight
  }
  if (field.id === 'weight') {
    const normalizedWeight = formatProfileNumberDraft(field.value, 'kg')
    return unitsPreference === 'imperial'
      ? convertKilogramsToImperialWeight(normalizedWeight)
      : normalizedWeight
  }
  if (field.id === 'phone-number') return formatPhoneNumberDraft(field.value)
  return field.value || ''
}

function getProfileIdentityModel(profile, role = 'athlete') {
  if (role === 'coach') {
    const coachFullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
    const coachDisplayName = String(profile?.displayName || '').trim()

    return {
      displayName: coachFullName || coachDisplayName || profile?.firstName || 'Coach',
      metaLabel: '',
      avatarUrl: getSafeProfileImageUri(profile?.avatarUrl),
    }
  }

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')

  return {
    displayName: fullName || profile?.firstName || 'Athlete',
    metaLabel: '',
    avatarUrl: getSafeProfileImageUri(profile?.avatarUrl),
  }
}

function getCoachNameDraftValues(profile) {
  const normalizedFirstName = String(profile?.firstName || '').trim()
  const normalizedLastName = String(profile?.lastName || '').trim()

  if (normalizedFirstName || normalizedLastName) {
    return {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
    }
  }

  const normalizedDisplayName = String(profile?.displayName || '').trim()
  if (!normalizedDisplayName || /^coach$/i.test(normalizedDisplayName)) {
    return {
      firstName: '',
      lastName: '',
    }
  }

  const displayNameParts = normalizedDisplayName.split(/\s+/).filter(Boolean)
  return {
    firstName: displayNameParts[0] || '',
    lastName: displayNameParts.slice(1).join(' '),
  }
}

function getProfileDetailModel(athleteProfile, role = 'athlete') {
  const unitsPreference = athleteProfile?.unitsPreference || 'metric'

  if (role === 'coach') {
    const coachNameDraft = getCoachNameDraftValues(athleteProfile)

    return {
      ...PROFILE_DETAIL_MODEL,
      fields: [
        { id: 'first-name', label: 'First name', value: coachNameDraft.firstName, type: 'text' },
        { id: 'last-name', label: 'Last name', value: coachNameDraft.lastName, type: 'text' },
        { id: 'phone-number', label: 'Phone number', value: athleteProfile?.phoneNumber || '', type: 'text' },
        { id: 'avatar-url', label: 'Avatar URL', value: athleteProfile?.avatarUrl || '', type: 'hidden' },
        { id: 'avatar-asset', label: 'Avatar asset', value: '', type: 'hidden' },
      ],
    }
  }

  return {
    ...PROFILE_DETAIL_MODEL,
    fields: [
      { id: 'first-name', label: 'First name', value: athleteProfile?.firstName || '', type: 'text' },
      { id: 'last-name', label: 'Last name', value: athleteProfile?.lastName || '', type: 'text' },
      { id: 'date-of-birth', label: 'Date of birth', value: athleteProfile?.dateOfBirth || '', type: 'date' },
      { id: 'gender', label: 'Gender', value: athleteProfile?.gender || '', type: 'dropdown' },
      { id: 'position', label: 'Position', value: athleteProfile?.position || '', type: 'dropdown' },
      { id: 'units-preference', label: 'Units', value: unitsPreference, type: 'segmented' },
      { id: 'height', label: getHeightFieldLabel(unitsPreference), value: athleteProfile?.heightCm != null ? `${athleteProfile.heightCm} cm` : '', type: 'text' },
      { id: 'weight', label: getWeightFieldLabel(unitsPreference), value: athleteProfile?.weightKg != null ? `${athleteProfile.weightKg} kg` : '', type: 'text' },
      { id: 'avatar-url', label: 'Avatar URL', value: athleteProfile?.avatarUrl || '', type: 'hidden' },
      { id: 'avatar-asset', label: 'Avatar asset', value: '', type: 'hidden' },
    ],
  }
}

function getProfileDraftState(profileDetailModel) {
  const unitsPreferenceField = profileDetailModel.fields.find((field) => field.id === 'units-preference')
  const unitsPreference = unitsPreferenceField?.value || 'metric'
  return Object.fromEntries(profileDetailModel.fields.map((field) => [field.id, normalizeProfileDraftValue(field, unitsPreference)]))
}

function parseNullableNumber(value) {
  if (value == null) return null
  const normalized = String(value).trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function buildAthleteProfileUpdatePayload(draftProfile, athleteProfile, role = 'athlete') {
  if (role === 'coach') {
    return {
      coachId: athleteProfile?.id ?? null,
      displayName: [draftProfile['first-name']?.trim() || '', draftProfile['last-name']?.trim() || ''].filter(Boolean).join(' '),
      firstName: draftProfile['first-name']?.trim() || '',
      lastName: draftProfile['last-name']?.trim() || '',
      phoneNumber: draftProfile['phone-number']?.trim() || '',
      avatarUrl: draftProfile['avatar-url']?.trim() || '',
      avatarAsset: draftProfile['avatar-asset'] ?? null,
    }
  }

  return {
    athleteId: athleteProfile?.id ?? null,
    firstName: draftProfile['first-name']?.trim() || '',
    lastName: draftProfile['last-name']?.trim() || '',
    dateOfBirth: draftProfile['date-of-birth']?.trim() || '',
    gender: draftProfile.gender?.trim() || '',
    position: draftProfile.position?.trim() || '',
    unitsPreference: draftProfile['units-preference']?.trim() || 'metric',
    heightCm: convertHeightDraftToMetricCm(draftProfile.height, draftProfile['units-preference']),
    weightKg: convertWeightDraftToMetricKg(draftProfile.weight, draftProfile['units-preference']),
    avatarUrl: draftProfile['avatar-url']?.trim() || '',
    avatarAsset: draftProfile['avatar-asset'] ?? null,
  }
}

function validateProfileDraft(draftProfile, role = 'athlete') {
  if (role === 'coach') {
    return ''
  }

  if (draftProfile.height && convertHeightDraftToMetricCm(draftProfile.height, draftProfile['units-preference']) == null) {
    return draftProfile['units-preference'] === 'imperial' ? 'Height must use feet.inches format like 5.11.' : 'Height must be a valid number in cm.'
  }

  if (draftProfile.weight && convertWeightDraftToMetricKg(draftProfile.weight, draftProfile['units-preference']) == null) {
    return draftProfile['units-preference'] === 'imperial' ? 'Weight must be a valid number in lb.' : 'Weight must be a valid number in kg.'
  }

  return ''
}

const EXERCISES_VIEW_MODEL = {
  title: 'Exercises',
  searchLabel: 'Search or Create Exercises',
}

const SEEDED_EXERCISE_LIBRARY_ITEMS = [
  {
    id: 'seeded-exercise-trap-bar-deadlift',
    name: 'Trap Bar Deadlift',
    thumbnailUrl: null,
    videoUrl: null,
    metricProfileId: 'strength_1rm',
    stimulusType: 'strength',
    movementPattern: 'hinge',
  },
  {
    id: 'seeded-exercise-sprint-start',
    name: 'Sprint [2-Point Start]',
    thumbnailUrl: null,
    videoUrl: null,
    metricProfileId: 'speed_time',
    stimulusType: 'speed',
    movementPattern: 'sprint',
  },
]

function createSeededExerciseLibraryClient() {
  return {
    async listExercises() {
      return SEEDED_EXERCISE_LIBRARY_ITEMS
    },
  }
}

function createMobileExerciseLibraryClient({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const runtimeEnv = globalThis.process?.env || env || {}
  const runtimeBootstrapOverride = runtimeEnv.EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE || env?.EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE || null

  if (runtimeBootstrapOverride === 'authenticated_coach_shell_seeded') {
    return createSeededExerciseLibraryClient()
  }

  if (!env?.EXPO_PUBLIC_SUPABASE_URL || !env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  return data.exercises.createSupabaseRestExerciseRepository({
    url: env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    fetchImpl,
  })
}

function createMobileProgramLibraryClient({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  if (!env?.EXPO_PUBLIC_SUPABASE_URL || !env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  return data.programs.createSupabaseRestProgramRepository({
    url: env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    fetchImpl,
  })
}

const PROGRAMS_VIEW_MODEL = {
  title: 'Programs',
  activeSectionTitle: 'ACTIVE PROGRAMS',
  completedSectionTitle: 'COMPLETED PROGRAMS',
  activeEmptyLabel: 'No Active Programs',
  completedEmptyLabel: 'No Completed Programs',
}

const THEME_VIEW_MODEL = {
  title: 'Theme',
  label: 'Theme',
  options: [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ],
  activeThemeId: 'dark',
  description:
    'Dark mode reduces eye strain in low-light environments. Light mode provides clearer contrast and readability in brighter surroundings.',
}

const UNITS_VIEW_MODEL = {
  title: 'Units',
  rows: [
    {
      id: 'weight-unit',
      label: 'Weight Unit',
      options: [
        { id: 'lb', label: 'lb' },
        { id: 'kg', label: 'kg' },
      ],
      activeOptionId: 'lb',
    },
    {
      id: 'distance-unit',
      label: 'Distance Unit',
      options: [
        { id: 'mi', label: 'mi' },
        { id: 'km', label: 'km' },
      ],
      activeOptionId: 'km',
    },
  ],
  description: 'These units will be used throughout the app for logging and displaying your workout data.',
}

const WEEK_START_VIEW_MODEL = {
  title: 'Week Start',
  label: 'Week starts on',
  options: [
    { id: 'sunday', label: 'Sunday' },
    { id: 'monday', label: 'Monday' },
  ],
  activeOptionId: 'sunday',
  description:
    'Choose which day your calendar week begins. This affects how weeks are displayed in your training calendar and program schedules.',
}

function getLanguageViewModel(languagePreference = 'en') {
  return {
    title: 'Languages',
    label: languagePreference === 'fr' ? 'Langue de l’app' : 'App Language',
    options: languagePreference === 'fr'
      ? [
          { id: 'en', label: 'Anglais' },
          { id: 'fr', label: 'Français' },
        ]
      : [
          { id: 'en', label: 'English' },
          { id: 'fr', label: 'French' },
        ],
    description: 'Choose the language used by the app. Full app translation will be completed later.',
  }
}

const REMINDER_VIEW_MODEL = {
  title: 'Workout Reminder',
  timezoneLabel: 'YOUR TIMEZONE',
  timezoneValue: 'America/Toronto',
  reminderTimeLabel: 'REMINDER TIME',
  buttonLabel: 'Update Reminder Time',
  description: 'We’ll send you a reminder at this time on days you have a workout scheduled.',
}

const APPLE_HEALTH_VIEW_MODEL = {
  title: 'Apple Health',
  label: 'Apple Health',
  buttonLabel: 'Manage',
  description: 'Manage the data shared between Spotr on Apple Health app or Settings › Health.',
  note: 'Note: Wearable data must be synced with Apple Health before it is available in Spotr.',
}

function formatReminderFallbackParts(date) {
  const hour = date.getHours() % 12 || 12
  const minute = String(date.getMinutes()).padStart(2, '0')
  const meridiem = date.getHours() >= 12 ? 'PM' : 'AM'

  return { hour: String(hour), minute, meridiem }
}

function buildReminderFallbackColumn(selectedValue, values) {
  const selectedIndex = values.indexOf(selectedValue)
  return values.map((value, index) => ({
    id: `${selectedValue}-${value}-${index}`,
    value,
    isSelected: index === selectedIndex,
  }))
}

function ReminderFallbackPicker({ value, theme }) {
  const resolvedTheme = theme || getAppTheme('dark')
  const parts = formatReminderFallbackParts(value)
  const hourOptions = buildReminderFallbackColumn(parts.hour, ['7', '8', '9', '10', '11'])
  const minuteOptions = buildReminderFallbackColumn(parts.minute, ['50', '55', '00', '05', '10'])
  const meridiemOptions = buildReminderFallbackColumn(parts.meridiem, ['AM', 'PM'])

  return (
    <View className="rounded-[26px] px-5 py-5" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.backgroundMuted }}>
      <View className="flex-row items-center justify-center gap-6">
        <View className="items-center gap-2">
          {hourOptions.map((option) => (
            <Text key={option.id} className="text-[32px] font-semibold" style={{ color: option.isSelected ? theme.text : theme.textSoft }}>
              {option.value}
            </Text>
          ))}
        </View>
        <Text className="self-center pb-8 text-[32px] font-semibold" style={{ color: resolvedTheme.text }}>:</Text>
        <View className="items-center gap-2">
          {minuteOptions.map((option) => (
            <Text key={option.id} className="text-[32px] font-semibold" style={{ color: option.isSelected ? theme.text : theme.textSoft }}>
              {option.value}
            </Text>
          ))}
        </View>
        <View className="items-center gap-3 pl-2">
          {meridiemOptions.map((option) => (
            <Text key={option.id} className="text-[22px] font-semibold" style={{ color: option.isSelected ? theme.text : theme.textSoft }}>
              {option.value}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}

function getVisibleProfileSections({ role }) {
  return PROFILE_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0)
}

function ProfileOptionIcon({ icon, theme }) {
  if (icon === 'user') return <User color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'users') return <Users color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'dumbbell') return <Dumbbell color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'calendar-range') return <CalendarRange color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'palette') return <Palette color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'ruler') return <Ruler color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'calendar-days') return <CalendarDays color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'bell') return <Bell color={theme.iconMuted} size={20} strokeWidth={2.2} />
  if (icon === 'languages') return <Languages color={theme.iconMuted} size={20} strokeWidth={2.2} />
  return <HeartPulse color={theme.iconMuted} size={20} strokeWidth={2.2} />
}

function ProfileOptionRow({ item, onSelect, theme }) {
  const resolvedTheme = theme || getAppTheme('dark')
  const leading = (
    <View className="h-10 w-10 items-center justify-center rounded-[14px]" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.backgroundMuted }}>
      <ProfileOptionIcon icon={item.icon} theme={resolvedTheme} />
    </View>
  )

  return (
    <AppListRow
      theme={resolvedTheme}
      title={item.label}
      onPress={() => onSelect?.(item)}
      leading={leading}
      bordered={false}
    />
  )
}

function ProfileSection({ section, onSelect, theme }) {
  const resolvedTheme = theme || getAppTheme('dark')
  return (
    <View className="gap-3">
      <Text className="text-[12px] font-semibold uppercase tracking-[1.2px]" style={{ color: resolvedTheme.textSoft }}>{section.title}</Text>
      <View className="gap-3">
        {section.items.map((item) => (
          <ProfileOptionRow key={item.id} item={item} onSelect={onSelect} theme={resolvedTheme} />
        ))}
      </View>
    </View>
  )
}

function ProfileDropdownField({ field, selectedValue, onOpen, theme }) {
  const resolvedTheme = theme || getAppTheme('dark')
  return (
    <AppFieldShell
      theme={resolvedTheme}
      onPress={() => onOpen?.(field.id)}
      trailing={<ChevronDown color={resolvedTheme.iconMuted} size={18} strokeWidth={2.2} />}
    >
      <Text className="text-[16px]" style={{ color: selectedValue ? resolvedTheme.textMuted : resolvedTheme.textSoft }}>{selectedValue || `Select ${field.label.toLowerCase()}`}</Text>
    </AppFieldShell>
  )
}

function ProfileDropdownSheet({ visible, title, options, selectedValue, onSelect, onClose, theme }) {
  const resolvedTheme = theme || getAppTheme('dark')
  return (
    <Modal transparent visible={Boolean(visible)} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: resolvedTheme.overlay }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View className="rounded-t-[28px] px-5 pb-8 pt-5" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.backgroundMuted }}>
          <View className="mb-5 h-1.5 w-14 self-center rounded-full" style={{ backgroundColor: resolvedTheme.border }} />
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[24px] font-semibold" style={{ color: resolvedTheme.text }}>{title}</Text>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }} onPress={onClose}>
              <ChevronDown color={resolvedTheme.iconMuted} size={18} strokeWidth={2.2} />
            </Pressable>
          </View>
          <View className="gap-3">
            {options.map((option) => {
              const isSelected = String(option.label).toLowerCase() === String(selectedValue).toLowerCase()
              return (
                <Pressable
                  key={option.id}
                  className="rounded-[18px] px-4 py-4" style={{ borderWidth: 1, borderColor: isSelected ? resolvedTheme.accentBorder : resolvedTheme.border, backgroundColor: isSelected ? resolvedTheme.accentSurface : resolvedTheme.surface }}
                  onPress={() => onSelect?.(option.label)}
                >
                  <Text className="text-[16px] font-medium" style={{ color: isSelected ? resolvedTheme.accentText : resolvedTheme.textMuted }}>{option.label}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>
    </Modal>
  )
}

function ProfileChoicePillField({ field, options, selectedValue, onChange, theme }) {
  const activeId = options.find((option) => String(option.label).toLowerCase() === String(selectedValue).toLowerCase())?.id || null

  return (
    <AppSegmentedControl
      theme={theme}
      options={options}
      activeId={activeId}
      onChange={(optionId) => {
        const nextOption = options.find((option) => option.id === optionId)
        if (!nextOption) return
        onChange?.(field.id, field.id === 'units-preference' ? String(nextOption.label).toLowerCase() : nextOption.label)
      }}
    />
  )
}

function ProfileField({ field, onChange, onOpenDatePicker, onOpenDropdown, unitsPreference, theme }) {
  const resolvedTheme = theme || getAppTheme('dark')
  const segmentedOptions = field.id === 'position' ? PROFILE_POSITION_OPTIONS : PROFILE_UNITS_OPTIONS

  return (
    <View className="gap-2">
      <Text className="text-[15px] font-semibold" style={{ color: resolvedTheme.text }}>{field.label}</Text>
      {field.type === 'date' ? (
        <AppFieldShell
          theme={resolvedTheme}
          onPress={() => onOpenDatePicker?.(field.id)}
          trailing={<CalendarDays color={resolvedTheme.iconMuted} size={18} strokeWidth={2.2} />}
        >
          <Text className="text-[16px]" style={{ color: field.value ? resolvedTheme.textMuted : resolvedTheme.textSoft }}>{formatProfileDateDisplay(field.value)}</Text>
        </AppFieldShell>
      ) : field.type === 'dropdown' ? (
        <ProfileDropdownField field={field} selectedValue={field.value} onOpen={onOpenDropdown} theme={resolvedTheme} />
      ) : field.type === 'segmented' ? (
        <ProfileChoicePillField field={field} options={field.id === 'gender' ? PROFILE_GENDER_OPTIONS : segmentedOptions} selectedValue={field.value} onChange={onChange} theme={resolvedTheme} />
      ) : (
        <AppFieldShell theme={resolvedTheme}>
          <TextInput
            className="px-0 py-0 text-[16px]"
            style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: resolvedTheme.textMuted }}
            value={field.value}
            testID={`profile-${field.id}-input`}
            keyboardType={field.id === 'height' || field.id === 'weight' ? 'decimal-pad' : field.id === 'phone-number' ? 'phone-pad' : 'default'}
            textContentType={field.id === 'phone-number' ? 'telephoneNumber' : 'none'}
            autoComplete={field.id === 'phone-number' ? 'tel' : 'off'}
            placeholder={field.id === 'phone-number' ? '(555) 555-5555' : getNumericFieldPlaceholder(field.id, unitsPreference)}
            placeholderTextColor={resolvedTheme.textSoft}
            onChangeText={(nextValue) => onChange?.(field.id, nextValue)}
          />
        </AppFieldShell>
      )}
    </View>
  )
}

function ProfileDetailsSkeleton({ theme }) {
  const resolvedTheme = theme || getAppTheme('dark')

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
      <View className="gap-5">
        <Skeleton className="h-36 w-36 self-center rounded-full" theme={resolvedTheme} />
        <View className="gap-2">
          <Skeleton className="h-4 w-28 rounded-full" theme={resolvedTheme} />
          <Skeleton className="h-14 rounded-[18px]" theme={resolvedTheme} />
        </View>
        <View className="gap-2">
          <Skeleton className="h-4 w-28 rounded-full" theme={resolvedTheme} />
          <Skeleton className="h-14 rounded-[18px]" theme={resolvedTheme} />
        </View>
        <View className="gap-2">
          <Skeleton className="h-4 w-36 rounded-full" theme={resolvedTheme} />
          <Skeleton className="h-14 rounded-[18px]" theme={resolvedTheme} />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-20 rounded-full" theme={resolvedTheme} />
            <Skeleton className="h-14 rounded-[18px]" theme={resolvedTheme} />
          </View>
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-24 rounded-full" theme={resolvedTheme} />
            <Skeleton className="h-14 rounded-[18px]" theme={resolvedTheme} />
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-24 rounded-full" theme={resolvedTheme} />
            <Skeleton className="h-14 rounded-[18px]" theme={resolvedTheme} />
          </View>
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-24 rounded-full" theme={resolvedTheme} />
            <Skeleton className="h-14 rounded-[18px]" theme={resolvedTheme} />
          </View>
        </View>
        <Skeleton className="h-14 rounded-[18px]" theme={resolvedTheme} />
      </View>
    </ScrollView>
  )
}

function ProfileDetailsView({ onBack, athleteProfile, onSaveProfile, isSavingProfile = false, saveNotice = '', role = 'athlete', theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const profileDetailModel = getProfileDetailModel(athleteProfile, role)
  const [draftProfile, setDraftProfile] = useState(() => getProfileDraftState(profileDetailModel))
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('')
  const [isSaveNoticeVisible, setIsSaveNoticeVisible] = useState(false)
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const [activeDropdownFieldId, setActiveDropdownFieldId] = useState(null)
  const [datePickerValue, setDatePickerValue] = useState(() => parseProfileDateValue(draftProfile['date-of-birth']) || new Date())
  const [isAvatarImageLoading, setIsAvatarImageLoading] = useState(false)
  const [isInitialSkeletonVisible, setIsInitialSkeletonVisible] = useState(true)

  useEffect(() => {
    const initialSkeletonTimer = setTimeout(() => {
      setIsInitialSkeletonVisible(false)
    }, INITIAL_VIEW_SKELETON_DELAY_MS)

    return () => clearTimeout(initialSkeletonTimer)
  }, [])

  useEffect(() => {
    const nextDraftState = getProfileDraftState(profileDetailModel)
    setDraftProfile(nextDraftState)
    setDatePickerValue(parseProfileDateValue(nextDraftState['date-of-birth']) || new Date())
    setActiveDropdownFieldId(null)
  }, [athleteProfile])

  const visibleSaveSuccessMessage = saveNotice || saveSuccessMessage

  useEffect(() => {
    if (saveNotice) {
      setIsSaveNoticeVisible(true)
    }
  }, [saveNotice])

  useEffect(() => {
    if (!isSaveNoticeVisible || !visibleSaveSuccessMessage) return undefined

    const hideProfileSaveNoticeTimer = setTimeout(() => {
      setIsSaveNoticeVisible(false)
      setSaveSuccessMessage('')
    }, 3000)

    return () => clearTimeout(hideProfileSaveNoticeTimer)
  }, [isSaveNoticeVisible, visibleSaveSuccessMessage])

  function handleFieldChange(fieldId, nextValue) {
    setDraftProfile((current) => {
      const nextDraft = {
        ...current,
        [fieldId]: fieldId === 'phone-number' ? formatPhoneNumberDraft(nextValue) : nextValue,
      }

      if (fieldId === 'units-preference') {
        nextDraft.height = convertHeightDraftToMetricCm(current.height, current['units-preference']) != null
          ? normalizeProfileDraftValue({ id: 'height', value: `${convertHeightDraftToMetricCm(current.height, current['units-preference'])} cm` }, nextValue)
          : ''
        nextDraft.weight = convertWeightDraftToMetricKg(current.weight, current['units-preference']) != null
          ? normalizeProfileDraftValue({ id: 'weight', value: `${convertWeightDraftToMetricKg(current.weight, current['units-preference'])} kg` }, nextValue)
          : ''
      }

      return nextDraft
    })
    setSaveErrorMessage('')
    setSaveSuccessMessage('')
    setIsSaveNoticeVisible(false)
  }

  function handleOpenDropdown(fieldId) {
    setActiveDropdownFieldId(fieldId)
  }

  function handleSelectDropdownOption(nextValue) {
    if (!activeDropdownFieldId) return
    handleFieldChange(activeDropdownFieldId, nextValue)
    setActiveDropdownFieldId(null)
  }

  function handleCloseDropdown() {
    setActiveDropdownFieldId(null)
  }

  async function handleAvatarUpload() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult?.granted) {
      setSaveErrorMessage('Photo library access is required to update the avatar.')
      return
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (pickerResult?.canceled) {
      return
    }

    const asset = pickerResult?.assets?.[0]
    if (!asset?.uri) {
      setSaveErrorMessage('Could not read that photo. Try another image.')
      return
    }

    const nextAvatarUrl = asset.uri
    setDraftProfile((current) => ({
      ...current,
      'avatar-url': nextAvatarUrl,
      'avatar-asset': {
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `${role}-avatar-${Date.now()}.jpg`,
      },
    }))
    setSaveErrorMessage('')
    setSaveSuccessMessage('')
  }

  function handleOpenDatePicker() {
    setDatePickerValue(parseProfileDateValue(draftProfile['date-of-birth']) || new Date())
    setIsDatePickerVisible(true)
  }

  function handleDateChange(_event, selectedDate) {
    if (Platform.OS !== 'ios') {
      setIsDatePickerVisible(false)
    }

    if (!selectedDate) return

    const nextDateValue = formatProfileDateValue(selectedDate)
    setDatePickerValue(selectedDate)
    setDraftProfile((current) => ({
      ...current,
      'date-of-birth': nextDateValue,
    }))
    setSaveErrorMessage('')
    setSaveSuccessMessage('')
  }

  async function handleSave() {
    const validationError = validateProfileDraft(draftProfile, role)
    if (validationError) {
      setSaveErrorMessage(validationError)
      setSaveSuccessMessage('')
      return
    }

    const activeProfileUpdate = buildAthleteProfileUpdatePayload(draftProfile, athleteProfile, role)
    setSaveErrorMessage('')

    try {
      await onSaveProfile?.(activeProfileUpdate)
      setSaveSuccessMessage('Profile updated.')
      setIsSaveNoticeVisible(true)
    } catch (error) {
      setSaveErrorMessage(error?.message || 'Something went sideways while saving the profile.')
      setSaveSuccessMessage('')
      setIsSaveNoticeVisible(false)
    }
  }

  const unitsPreference = draftProfile['units-preference'] || 'metric'
  const safeDraftAvatarUri = getSafeProfileImageUri(draftProfile['avatar-url'])
  const hasAvatar = Boolean(safeDraftAvatarUri)

  useEffect(() => {
    setIsAvatarImageLoading(Boolean(safeDraftAvatarUri))
  }, [safeDraftAvatarUri])

  const fields = profileDetailModel.fields.map((field) => {
    if (field.id === 'height') {
      return {
        ...field,
        label: getHeightFieldLabel(unitsPreference),
        value: draftProfile[field.id] ?? field.value,
      }
    }

    if (field.id === 'weight') {
      return {
        ...field,
        label: getWeightFieldLabel(unitsPreference),
        value: draftProfile[field.id] ?? field.value,
      }
    }

    return {
      ...field,
      value: draftProfile[field.id] ?? field.value,
    }
  })
  const visibleFields = fields.filter((field) => field.type !== 'hidden')
  const activeDropdownField = visibleFields.find((field) => field.id === activeDropdownFieldId) || null
  const activeDropdownOptions = activeDropdownFieldId === 'gender'
    ? PROFILE_GENDER_OPTIONS
    : activeDropdownFieldId === 'position'
      ? PROFILE_POSITION_OPTIONS
      : []
  const detailRows = role === 'coach'
    ? []
    : [visibleFields.slice(3, 5), visibleFields.slice(5, 6), visibleFields.slice(6, 8)]
  const hasProfileChanges = profileDetailModel.fields.some((field) => (draftProfile[field.id] ?? '') !== normalizeProfileDraftValue(field, draftProfile['units-preference'] || 'metric'))
  const isSaveDisabled = isSavingProfile || !hasProfileChanges

  if (isInitialSkeletonVisible) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
        <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
          <AppSheetHeader theme={resolvedTheme} title={profileDetailModel.title} onBack={onBack} />
          <ProfileDetailsSkeleton theme={resolvedTheme} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={profileDetailModel.title} onBack={onBack} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
          <View className="gap-5">
            <Pressable className="self-center" onPress={handleAvatarUpload}>
              <View className="h-36 w-36 items-center justify-center overflow-hidden rounded-full" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
                {hasAvatar ? (
                  <>
                    <Image
                      source={{ uri: safeDraftAvatarUri }}
                      className="h-full w-full"
                      resizeMode="cover"
                      onLoadStart={() => setIsAvatarImageLoading(true)}
                      onLoadEnd={() => setIsAvatarImageLoading(false)}
                    />
                    {isAvatarImageLoading ? (
                      <Skeleton className="absolute inset-0 rounded-full" theme={resolvedTheme} />
                    ) : null}
                  </>
                ) : (
                  <>
                    <ImagePlus color={resolvedTheme.iconMuted} size={44} strokeWidth={2} />
                    <Text className="mt-3 text-[13px] font-medium" style={{ color: resolvedTheme.textSoft }}>{profileDetailModel.avatarLabel}</Text>
                  </>
                )}
              </View>
            </Pressable>

            <ProfileField field={fields[0]} onChange={handleFieldChange} onOpenDatePicker={handleOpenDatePicker} onOpenDropdown={handleOpenDropdown} unitsPreference={unitsPreference} theme={resolvedTheme} />
            <ProfileField field={fields[1]} onChange={handleFieldChange} onOpenDatePicker={handleOpenDatePicker} onOpenDropdown={handleOpenDropdown} unitsPreference={unitsPreference} theme={resolvedTheme} />
            <ProfileField field={fields[2]} onChange={handleFieldChange} onOpenDatePicker={handleOpenDatePicker} onOpenDropdown={handleOpenDropdown} unitsPreference={unitsPreference} theme={resolvedTheme} />

            {detailRows.map((row, index) => (
              <View key={`profile-detail-row-${index + 1}`} className="flex-row gap-3">
                {row.map((field) => (
                  <View key={field.id} className="flex-1">
                    <ProfileField field={field} onChange={handleFieldChange} onOpenDatePicker={handleOpenDatePicker} onOpenDropdown={handleOpenDropdown} unitsPreference={unitsPreference} theme={resolvedTheme} />
                  </View>
                ))}
              </View>
            ))}

            <ProfileDropdownSheet
              visible={Boolean(activeDropdownFieldId)}
              title={activeDropdownField?.label || ''}
              options={activeDropdownOptions}
              selectedValue={draftProfile[activeDropdownFieldId] || ''}
              onSelect={handleSelectDropdownOption}
              onClose={handleCloseDropdown}
            />

            <Modal transparent visible={isDatePickerVisible} animationType="fade" onRequestClose={() => setIsDatePickerVisible(false)}>
              <View className="flex-1 justify-end" style={{ backgroundColor: resolvedTheme.overlay }}>
                <Pressable className="flex-1" onPress={() => setIsDatePickerVisible(false)} />
                <View className="rounded-t-[28px] px-3 pb-8 pt-5" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
                  <View className="mb-5 h-1.5 w-14 self-center rounded-full" style={{ backgroundColor: resolvedTheme.border }} />
                  <DateTimePicker value={datePickerValue} mode="date" display="spinner" textColor={resolvedTheme.text} themeVariant={resolvedTheme.id} onChange={handleDateChange} />
                  {Platform.OS === 'ios' ? (
                    <Pressable className="mt-3 items-center rounded-[14px] py-3" style={{ borderWidth: 1, borderColor: resolvedTheme.accentBorder, backgroundColor: resolvedTheme.accentSurface }} onPress={() => setIsDatePickerVisible(false)}>
                      <Text className="text-[15px] font-semibold" style={{ color: resolvedTheme.accentText }}>Done</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </Modal>

            {saveErrorMessage ? (
              <AppNoticeCard theme={resolvedTheme} body={saveErrorMessage} tone="danger" />
            ) : null}

            {isSaveNoticeVisible && visibleSaveSuccessMessage ? (
              <AppNoticeCard theme={resolvedTheme} body={visibleSaveSuccessMessage} tone="accent" />
            ) : null}

            <Pressable
              className="items-center justify-center overflow-hidden rounded-[18px] py-4"
              style={{
                backgroundColor: isSaveDisabled ? resolvedTheme.backgroundMuted : resolvedTheme.accentSurface,
                borderWidth: 1,
                borderColor: isSaveDisabled ? resolvedTheme.borderStrong : resolvedTheme.accentBorder,
                shadowColor: resolvedTheme.cardShadow,
                shadowOpacity: isSaveDisabled ? 0.14 : 0.28,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 10,
              }}
              onPress={handleSave}
              disabled={isSaveDisabled}
              testID="profile-save-button"
            >
              <Text className="text-[18px] font-semibold" style={{ color: isSaveDisabled ? resolvedTheme.textSoft : resolvedTheme.accentText }}>{isSavingProfile ? 'Saving...' : 'Save Profile'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

function ExercisesView({ onBack, exercises, isLoading = false, error = '', searchQuery = '', onSearchChange, onOpenExerciseDetail, theme }) {
  return (
    <ExerciseLibraryView
      title={EXERCISES_VIEW_MODEL.title}
      searchPlaceholder={EXERCISES_VIEW_MODEL.searchLabel}
      onBack={onBack}
      exercises={exercises}
      isLoading={isLoading}
      error={error}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onPressExercise={onOpenExerciseDetail}
      theme={theme}
    />
  )
}

function formatProgramDateRange(program) {
  if (!program?.startDate && !program?.endDate) return 'Dates not set'
  if (program?.startDate && program?.endDate) return `${program.startDate} → ${program.endDate}`
  return program?.startDate || program?.endDate || 'Dates not set'
}

function formatProgramSummary(program) {
  const details = []
  if (program?.weeksCount) details.push(`${program.weeksCount} weeks`)
  if (program?.workoutsCount) details.push(`${program.workoutsCount} workouts`)
  details.push(formatProgramDateRange(program))
  return details.filter(Boolean).join(' • ')
}

function ProgramListSkeletonRows({ theme }) {
  const resolvedTheme = theme || getAppTheme('dark')

  return (
    <View>
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={`program-skeleton-${index}`}
          className="flex-row items-center gap-3 py-3"
          style={index < 5 ? { borderBottomWidth: 1, borderBottomColor: resolvedTheme.border } : null}
        >
          <Skeleton className="h-12 w-12 rounded-[14px]" theme={resolvedTheme} />
          <Skeleton className="h-5 flex-1 rounded-full" theme={resolvedTheme} style={{ maxWidth: index % 2 === 0 ? 190 : 150 }} />
          <Skeleton className="h-8 w-8 rounded-full" theme={resolvedTheme} />
        </View>
      ))}
    </View>
  )
}

function ProgramsView({ onBack, programs, isLoading = false, error = '', onOpenProgramDetail, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const [isInitialProgramsSkeletonVisible, setIsInitialProgramsSkeletonVisible] = useState(true)
  const activePrograms = programs.filter((program) => String(program.status).toLowerCase() === 'active')
  const completedPrograms = programs.filter((program) => String(program.status).toLowerCase() !== 'active')
  const shouldShowProgramsSkeleton = isLoading || isInitialProgramsSkeletonVisible

  useEffect(() => {
    const skeletonTimer = setTimeout(() => {
      setIsInitialProgramsSkeletonVisible(false)
    }, INITIAL_VIEW_SKELETON_DELAY_MS)

    return () => clearTimeout(skeletonTimer)
  }, [])

  function ProgramListIcon({ theme }) {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-[14px]" style={{ backgroundColor: theme.backgroundMuted, borderWidth: 1, borderColor: theme.border }}>
        <CalendarRange color={theme.iconMuted} size={24} strokeWidth={2.1} />
      </View>
    )
  }

  function renderProgramRows(items, emptyLabel) {
    if (error) {
      return (
        <AppNoticeCard theme={resolvedTheme} body={error} tone="danger" centered />
      )
    }

    if (items.length === 0) {
      return (
        <AppNoticeCard theme={resolvedTheme} body={emptyLabel} centered />
      )
    }

    return (
      <View>
        {items.map((program, index) => (
          <AppListRow
            key={program.id}
            theme={resolvedTheme}
            title={program.name}
            onPress={() => onOpenProgramDetail?.(program)}
            leading={<ProgramListIcon theme={resolvedTheme} />}
            trailing={<ChevronRight color={resolvedTheme.iconMuted} size={20} strokeWidth={2.2} />}
            bordered={index < items.length - 1}
          />
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={PROGRAMS_VIEW_MODEL.title} onBack={onBack} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="gap-8">
            <View className="gap-3">
              <Text className="text-[12px] font-semibold uppercase tracking-[1.2px]" style={{ color: resolvedTheme.textSoft }}>{PROGRAMS_VIEW_MODEL.activeSectionTitle}</Text>
              {shouldShowProgramsSkeleton ? (
                <ProgramListSkeletonRows theme={resolvedTheme} />
              ) : null}
              {!shouldShowProgramsSkeleton ? renderProgramRows(activePrograms, PROGRAMS_VIEW_MODEL.activeEmptyLabel) : null}
            </View>

            <View className="gap-3">
              <Text className="text-[12px] font-semibold uppercase tracking-[1.2px]" style={{ color: resolvedTheme.textSoft }}>{PROGRAMS_VIEW_MODEL.completedSectionTitle}</Text>
              {shouldShowProgramsSkeleton ? (
                <ProgramListSkeletonRows theme={resolvedTheme} />
              ) : null}
              {!shouldShowProgramsSkeleton ? renderProgramRows(completedPrograms, PROGRAMS_VIEW_MODEL.completedEmptyLabel) : null}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

function ThemeView({ onBack, themePreference = 'dark', onChangeThemePreference, theme }) {
  const resolvedTheme = theme || getAppTheme('dark')
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={THEME_VIEW_MODEL.title} onBack={onBack} />

        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-4">
            <Text className="text-[24px] font-semibold" style={{ color: resolvedTheme.text }}>{THEME_VIEW_MODEL.label}</Text>
            <View className="flex-row rounded-[18px] p-1" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
              {THEME_VIEW_MODEL.options.map((option) => {
                const isSelected = option.id === themePreference
                return (
                  <Pressable
                    key={option.id}
                    className="rounded-[14px] px-5 py-2.5"
                    style={isSelected ? { backgroundColor: resolvedTheme.accentSurface, borderWidth: 1, borderColor: resolvedTheme.accentBorder } : null}
                    onPress={() => onChangeThemePreference?.(option.id)}
                  >
                    <Text className="text-[15px] font-semibold" style={{ color: isSelected ? theme.accentText : theme.textSoft }}>{option.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Text className="max-w-[340px] text-[15px] leading-[24px]" style={{ color: resolvedTheme.textSoft }}>{THEME_VIEW_MODEL.description}</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

function UnitsView({ onBack, weightUnitPreference = 'lb', distanceUnitPreference = 'km', onChangeWeightUnitPreference, onChangeDistanceUnitPreference, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const unitsSegmentedControlWidth = 132

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={UNITS_VIEW_MODEL.title} onBack={onBack} />

        <View className="gap-6">
          {UNITS_VIEW_MODEL.rows.map((row) => {
            const activeOptionId = row.id === 'weight-unit' ? weightUnitPreference : distanceUnitPreference
            return (
              <View key={row.id} className="flex-row items-center justify-between gap-4">
                <Text className="text-[22px] font-semibold" style={{ color: resolvedTheme.text }}>{row.label}</Text>
                <View
                  className="w-[132px] flex-row rounded-[18px] p-1"
                  style={{ width: unitsSegmentedControlWidth, borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}
                >
                  {row.options.map((option) => {
                    const isSelected = option.id === activeOptionId
                    return (
                      <Pressable
                        key={option.id}
                        className="flex-1 items-center justify-center rounded-[14px] px-5 py-2.5"
                        style={isSelected ? { backgroundColor: resolvedTheme.accentSurface, borderWidth: 1, borderColor: resolvedTheme.accentBorder } : null}
                        onPress={() => row.id === 'weight-unit'
                          ? onChangeWeightUnitPreference?.(option.id)
                          : onChangeDistanceUnitPreference?.(option.id)}
                      >
                        <Text className="text-center text-[15px] font-semibold" style={{ color: isSelected ? theme.accentText : theme.textSoft }}>{option.label}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )
          })}

          <Text className="max-w-[360px] text-[15px] leading-[24px]" style={{ color: resolvedTheme.textSoft }}>{UNITS_VIEW_MODEL.description}</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

function WeekStartView({ onBack, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={WEEK_START_VIEW_MODEL.title} onBack={onBack} />

        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-4">
            <Text className="text-[22px] font-semibold" style={{ color: resolvedTheme.text }}>{WEEK_START_VIEW_MODEL.label}</Text>
            <View className="flex-row rounded-[18px] p-1" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
              {WEEK_START_VIEW_MODEL.options.map((option) => {
                const isSelected = option.id === WEEK_START_VIEW_MODEL.activeOptionId
                return (
                  <Pressable
                    key={option.id}
                    className="rounded-[14px] px-5 py-2.5"
                    style={isSelected ? { backgroundColor: resolvedTheme.accentSurface, borderWidth: 1, borderColor: resolvedTheme.accentBorder } : null}
                  >
                    <Text className="text-[15px] font-semibold" style={{ color: isSelected ? theme.accentText : theme.textSoft }}>{option.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Text className="max-w-[360px] text-[15px] leading-[24px]" style={{ color: resolvedTheme.textSoft }}>{WEEK_START_VIEW_MODEL.description}</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

function LanguagesView({ onBack, languagePreference = 'en', onChangeLanguagePreference, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const languageViewModel = getLanguageViewModel(languagePreference)

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={languageViewModel.title} onBack={onBack} />

        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-4">
            <Text className="text-[22px] font-semibold" style={{ color: resolvedTheme.text }}>{languageViewModel.label}</Text>
            <View className="flex-row rounded-[18px] p-1" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
              {languageViewModel.options.map((option) => {
                const isSelected = option.id === languagePreference
                return (
                  <Pressable
                    key={option.id}
                    className="rounded-[14px] px-5 py-2.5"
                    style={isSelected ? { backgroundColor: resolvedTheme.accentSurface, borderWidth: 1, borderColor: resolvedTheme.accentBorder } : null}
                    onPress={() => onChangeLanguagePreference?.(option.id)}
                  >
                    <Text className="text-[15px] font-semibold" style={{ color: isSelected ? resolvedTheme.accentText : resolvedTheme.textSoft }}>{option.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Text className="max-w-[360px] text-[15px] leading-[24px]" style={{ color: resolvedTheme.textSoft }}>{languageViewModel.description}</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

function ReminderView({ onBack, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const [reminderTime, setReminderTime] = useState(() => {
    const nextReminderTime = new Date()
    nextReminderTime.setHours(9, 0, 0, 0)
    return nextReminderTime
  })

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={REMINDER_VIEW_MODEL.title} onBack={onBack} />

        <View className="gap-8">
          <View className="gap-3">
            <Text className="text-[12px] font-semibold uppercase tracking-[1.2px]" style={{ color: resolvedTheme.textSoft }}>{REMINDER_VIEW_MODEL.timezoneLabel}</Text>
            <Pressable className="flex-row items-center rounded-[20px] px-4 py-4" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
              <Text className="flex-1 text-[17px]" style={{ color: resolvedTheme.text }}>{REMINDER_VIEW_MODEL.timezoneValue}</Text>
              <View className="h-9 w-9 items-center justify-center rounded-full" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.backgroundMuted }}>
                <RefreshCcw color={resolvedTheme.iconMuted} size={16} strokeWidth={2.2} />
              </View>
            </Pressable>
          </View>

          <View className="gap-4">
            <Text className="text-[12px] font-semibold uppercase tracking-[1.2px]" style={{ color: resolvedTheme.textSoft }}>{REMINDER_VIEW_MODEL.reminderTimeLabel}</Text>
            {Platform.OS === 'web' ? (
              <ReminderFallbackPicker value={reminderTime} theme={resolvedTheme} />
            ) : (
              <View className="overflow-hidden rounded-[26px] px-2 py-3" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.backgroundMuted }}>
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  themeVariant={resolvedTheme.id}
                  textColor={resolvedTheme.text}
                  accentColor={resolvedTheme.accentText}
                  onChange={(_, nextValue) => {
                    if (nextValue) setReminderTime(nextValue)
                  }}
                />
              </View>
            )}
          </View>

          <Pressable
            className="items-center justify-center overflow-hidden rounded-[18px] py-4"
            style={{
              backgroundColor: resolvedTheme.accentSurface,
              borderWidth: 1,
              borderColor: resolvedTheme.accentBorder,
              shadowColor: resolvedTheme.cardShadow,
              shadowOpacity: 0.28,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 10,
            }}
          >
            <Text className="text-[18px] font-semibold" style={{ color: resolvedTheme.accentText }}>{REMINDER_VIEW_MODEL.buttonLabel}</Text>
          </Pressable>

          <Text className="max-w-[360px] text-[15px] leading-[24px]" style={{ color: resolvedTheme.textSoft }}>{REMINDER_VIEW_MODEL.description}</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}


function AppleHealthView({ onBack, theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <AppSheetHeader theme={resolvedTheme} title={APPLE_HEALTH_VIEW_MODEL.title} onBack={onBack} />

        <View className="gap-4">
          <View className="flex-row items-start justify-between gap-4">
            <Text className="flex-1 text-[24px] font-semibold" style={{ color: resolvedTheme.text }}>{APPLE_HEALTH_VIEW_MODEL.label}</Text>
            <Pressable className="rounded-full px-5 py-2" style={{ borderWidth: 1, borderColor: resolvedTheme.accentBorder, backgroundColor: resolvedTheme.accentSurface }}>
              <Text className="text-[15px] font-semibold" style={{ color: resolvedTheme.accentText }}>{APPLE_HEALTH_VIEW_MODEL.buttonLabel}</Text>
            </Pressable>
          </View>

          <Text className="max-w-[340px] text-[15px] leading-[24px]" style={{ color: resolvedTheme.textSoft }}>{APPLE_HEALTH_VIEW_MODEL.description}</Text>
          <Text className="max-w-[340px] text-[15px] leading-[24px]" style={{ color: resolvedTheme.textSoft }}>{APPLE_HEALTH_VIEW_MODEL.note}</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

function ProfileSignOutButton({ onSignOut, theme }) {
  return (
    <AppButton
      theme={theme}
      label="Sign Out"
      tone="danger"
      onPress={onSignOut}
      leftIcon={<LogOut color={theme.dangerText} size={18} strokeWidth={2.4} />}
      style={{ marginTop: 32 }}
    />
  )
}

function ProfileViewContent({ onClose, onSignOut, athleteProfile, onSaveProfile, isSavingProfile = false, saveNotice = '', role = 'athlete', athletes = [], selectedAthleteId = null, isAthletesLoading = false, onAthleteActionTarget, onOpenExerciseDetail, onOpenProgramDetail, themePreference = 'dark', onChangeThemePreference, weightUnitPreference = 'lb', distanceUnitPreference = 'km', onChangeWeightUnitPreference, onChangeDistanceUnitPreference, languagePreference = 'en', onChangeLanguagePreference, theme }) {
  const insets = useSafeAreaInsets()
  const [activeScreen, setActiveScreen] = useState('menu')
  const [exerciseLibraryState, setExerciseLibraryState] = useState({ items: [], isLoading: false, error: '' })
  const [programLibraryState, setProgramLibraryState] = useState({ items: [], isLoading: false, error: '' })
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('')
  const resolvedTheme = theme || getAppTheme(themePreference)
  const profileIdentity = getProfileIdentityModel(athleteProfile, role)
  const safeProfileAvatarUri = getSafeProfileImageUri(profileIdentity.avatarUrl)
  const hasProfileAvatar = Boolean(safeProfileAvatarUri)
  const profileSections = getVisibleProfileSections({ role })
  const filteredExercises = exerciseLibraryState.items.filter((exercise) => {
    const normalizedQuery = exerciseSearchQuery.trim().toLowerCase()
    if (!normalizedQuery) return true
    return exercise.name.toLowerCase().includes(normalizedQuery)
  })

  useEffect(() => {
    if (activeScreen !== 'exercises') return

    const exerciseClient = createMobileExerciseLibraryClient()
    if (!exerciseClient) {
      setExerciseLibraryState({ items: [], isLoading: false, error: 'Exercise library is unavailable right now.' })
      return
    }

    let isActive = true
    setExerciseLibraryState((current) => ({ ...current, isLoading: true, error: '' }))

    exerciseClient.listExercises()
      .then((items) => {
        if (!isActive) return
        setExerciseLibraryState({ items, isLoading: false, error: '' })
      })
      .catch((error) => {
        if (!isActive) return
        setExerciseLibraryState({ items: [], isLoading: false, error: error?.message || 'Unable to load exercises.' })
      })

    return () => {
      isActive = false
    }
  }, [activeScreen])

  useEffect(() => {
    if (activeScreen !== 'programs') return

    const programClient = createMobileProgramLibraryClient()
    if (!programClient) {
      setProgramLibraryState({ items: [], isLoading: false, error: 'Program library is unavailable right now.' })
      return
    }

    let isActive = true
    setProgramLibraryState((current) => ({ ...current, isLoading: true, error: '' }))
    const loadPrograms = role === 'coach'
      ? () => programClient.listPrograms()
      : () => athleteProfile?.id
          ? programClient.listProgramsForAthlete(athleteProfile.id)
          : Promise.resolve([])

    loadPrograms()
      .then((items) => {
        if (!isActive) return
        setProgramLibraryState({ items, isLoading: false, error: '' })
      })
      .catch((error) => {
        if (!isActive) return
        setProgramLibraryState({ items: [], isLoading: false, error: error?.message || 'Unable to load programs.' })
      })

    return () => {
      isActive = false
    }
  }, [activeScreen, athleteProfile?.id, role])


  function handleThemeSelection(nextThemePreference) {
    onChangeThemePreference?.(nextThemePreference)
    setActiveScreen((current) => (current === 'theme' ? 'theme' : current))
  }

  function handleProfileAthleteAction(targetKey, payload) {
    onAthleteActionTarget?.(targetKey, payload)
    if (targetKey === 'coach-athlete-select' || targetKey === 'coach-athlete-invite') {
      onClose?.()
    }
  }

  if (activeScreen === 'profile-details') {
    return <ProfileDetailsView onBack={() => setActiveScreen('menu')} athleteProfile={athleteProfile} onSaveProfile={onSaveProfile} isSavingProfile={isSavingProfile} saveNotice={saveNotice} role={role} theme={resolvedTheme} />
  }

  if (activeScreen === 'exercises') {
    return <ExercisesView onBack={() => setActiveScreen('menu')} exercises={filteredExercises} isLoading={exerciseLibraryState.isLoading} error={exerciseLibraryState.error} searchQuery={exerciseSearchQuery} onSearchChange={setExerciseSearchQuery} onOpenExerciseDetail={onOpenExerciseDetail} theme={resolvedTheme} />
  }

  if (activeScreen === 'athletes') {
    return <CoachAthletesSheetContent onClose={() => setActiveScreen('menu')} athletes={athletes} selectedAthleteId={selectedAthleteId} isLoading={isAthletesLoading} onActionTarget={handleProfileAthleteAction} theme={resolvedTheme} />
  }

  if (activeScreen === 'programs') {
    return <ProgramsView onBack={() => setActiveScreen('menu')} programs={programLibraryState.items} isLoading={programLibraryState.isLoading} error={programLibraryState.error} onOpenProgramDetail={onOpenProgramDetail} theme={resolvedTheme} />
  }

  if (activeScreen === 'theme') {
    return <ThemeView onBack={() => setActiveScreen('menu')} themePreference={themePreference} onChangeThemePreference={handleThemeSelection} theme={resolvedTheme} />
  }

  if (activeScreen === 'units') {
    return <UnitsView onBack={() => setActiveScreen('menu')} weightUnitPreference={weightUnitPreference} distanceUnitPreference={distanceUnitPreference} onChangeWeightUnitPreference={onChangeWeightUnitPreference} onChangeDistanceUnitPreference={onChangeDistanceUnitPreference} theme={resolvedTheme} />
  }

  if (activeScreen === 'week-start') {
    return <WeekStartView onBack={() => setActiveScreen('menu')} theme={resolvedTheme} />
  }

  if (activeScreen === 'reminder') {
    return <ReminderView onBack={() => setActiveScreen('menu')} theme={resolvedTheme} />
  }

  if (activeScreen === 'languages') {
    return <LanguagesView onBack={() => setActiveScreen('menu')} languagePreference={languagePreference} onChangeLanguagePreference={onChangeLanguagePreference} theme={resolvedTheme} />
  }

  if (activeScreen === 'apple-health') {
    return <AppleHealthView onBack={() => setActiveScreen('menu')} theme={resolvedTheme} />
  }

  function handleSelectOption(item) {
    if (item?.id === 'profile') {
      setActiveScreen('profile-details')
      return
    }

    if (item?.id === 'athletes') {
      setActiveScreen('athletes')
      return
    }

    if (item?.id === 'exercises') {
      setActiveScreen('exercises')
    }

    if (item?.id === 'programs') {
      setActiveScreen('programs')
    }

    if (item?.id === 'theme') {
      setActiveScreen('theme')
    }

    if (item?.id === 'units') {
      setActiveScreen('units')
    }

    if (item?.id === 'week-start') {
      setActiveScreen('week-start')
    }

    if (item?.id === 'reminder') {
      setActiveScreen('reminder')
    }

    if (item?.id === 'languages') {
      setActiveScreen('languages')
    }

    if (item?.id === 'apple-health') {
      setActiveScreen('apple-health')
    }
  }

  return (
    <SafeAreaView
      className="flex-1"
      testID="profile-settings-screen"
      accessibilityLabel="Profile settings screen"
      style={{ backgroundColor: resolvedTheme.background }}
    >
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <View className="mb-8 flex-row items-center justify-between">
          <Pressable className="h-11 w-11 items-center justify-center rounded-[16px]" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }} onPress={onClose} testID="profile-close-button">
            <ChevronLeft color={resolvedTheme.icon} size={20} strokeWidth={2.6} />
          </Pressable>
          <View className="w-11" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="gap-8">
            <View className="items-center gap-3 pb-2">
              <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-full" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
                {hasProfileAvatar ? (
                  <Image source={{ uri: safeProfileAvatarUri }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <UserCircle2 color={resolvedTheme.iconMuted} size={68} strokeWidth={1.8} />
                )}
              </View>
              <Text className="text-[32px] font-bold" style={{ color: resolvedTheme.text }}>{profileIdentity.displayName}</Text>
              {profileIdentity.metaLabel ? (
                <Text className="text-[15px]" style={{ color: resolvedTheme.textSoft }}>{profileIdentity.metaLabel}</Text>
              ) : null}
            </View>
            {profileSections.map((section) => (
              <ProfileSection key={section.id} section={section} onSelect={handleSelectOption} theme={resolvedTheme} />
            ))}
            <ProfileSignOutButton onSignOut={onSignOut} theme={resolvedTheme} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export function ProfileView({ isVisible, onClose, onSignOut, athleteProfile, onSaveProfile, isSavingProfile = false, saveNotice = '', role = 'athlete', athletes = [], selectedAthleteId = null, isAthletesLoading = false, onAthleteActionTarget, onOpenExerciseDetail, onOpenProgramDetail, themePreference = 'dark', onChangeThemePreference, weightUnitPreference = 'lb', distanceUnitPreference = 'km', onChangeWeightUnitPreference, onChangeDistanceUnitPreference, languagePreference = 'en', onChangeLanguagePreference, theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <ProfileViewContent onClose={onClose} onSignOut={onSignOut} athleteProfile={athleteProfile} onSaveProfile={onSaveProfile} isSavingProfile={isSavingProfile} saveNotice={saveNotice} role={role} athletes={athletes} selectedAthleteId={selectedAthleteId} isAthletesLoading={isAthletesLoading} onAthleteActionTarget={onAthleteActionTarget} onOpenExerciseDetail={onOpenExerciseDetail} onOpenProgramDetail={onOpenProgramDetail} themePreference={themePreference} onChangeThemePreference={onChangeThemePreference} weightUnitPreference={weightUnitPreference} distanceUnitPreference={distanceUnitPreference} onChangeWeightUnitPreference={onChangeWeightUnitPreference} onChangeDistanceUnitPreference={onChangeDistanceUnitPreference} languagePreference={languagePreference} onChangeLanguagePreference={onChangeLanguagePreference} theme={theme} />
      </SafeAreaProvider>
    </Modal>
  )
}
