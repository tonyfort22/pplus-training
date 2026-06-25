'use client'

import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const ADMIN_PROFILE_SEED = {
  avatarUrl: '',
  name: '',
  firstName: '',
  lastName: '',
  phone: '',
  avatarUpload: null,
}

const ADMIN_ACCOUNT_SEED = {
  email: '',
  currentPassword: '',
  password: '',
  confirmPassword: '',
}

const settingsFieldInputClassName = 'h-11 rounded-[12px] border-[var(--admin-shell-control-border)] bg-[var(--admin-shell-control-bg)] px-4 text-sm text-[var(--admin-shell-text)] placeholder:text-[var(--admin-shell-soft)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20 disabled:cursor-not-allowed disabled:opacity-70'
const settingsProfileFieldInputClassName = 'h-11 rounded-[12px] border-[var(--admin-shell-control-border)] bg-[var(--admin-shell-control-bg)] px-4 text-sm text-[var(--admin-shell-text)] placeholder:text-[var(--admin-shell-soft)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20 disabled:cursor-not-allowed disabled:opacity-70'

function getActiveSettingsTab(currentPath = '') {
  if (currentPath.endsWith('/account')) return 'account'
  return 'profile'
}

function CreateAthleteDialogField({ htmlFor, label, children }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-[var(--admin-shell-text)]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SettingsProfileField({ htmlFor, label, children, className = '' }) {
  return (
    <div className={`grid gap-2 ${className}`.trim()}>
      <label className="text-sm font-medium text-[var(--admin-shell-text)]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SettingsField({ htmlFor, label, children }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-[var(--admin-shell-text)]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Unable to read avatar file.'))
    reader.readAsDataURL(file)
  })
}

function ProfilePhotoUploader({ previewSrc = '', profileName = '', onAvatarChange }) {
  const fileInputRef = useRef(null)
  const [hasPreviewError, setHasPreviewError] = useState(false)
  const canRenderPreview = Boolean(previewSrc) && !hasPreviewError

  useEffect(() => {
    setHasPreviewError(false)
  }, [previewSrc])

  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const dataUrl = await readFileAsDataUrl(file)
    onAvatarChange?.({
      dataUrl,
      fileName: file.name || 'profile.jpg',
      contentType: file.type || 'image/jpeg',
    })
  }

  return (
    <div className="relative flex flex-col items-center justify-center justify-self-start gap-4 px-0 py-1 text-center">
      {canRenderPreview ? (
        <img
          alt={profileName || 'Coach avatar'}
          className="admin-settings-profile-avatar h-48 w-48 rounded-full border border-[var(--admin-shell-control-border)] bg-[var(--admin-shell-avatar-bg)] text-xl font-semibold text-[var(--admin-shell-avatar-text)] object-cover"
          src={previewSrc}
          onError={() => setHasPreviewError(true)}
        />
      ) : (
        <div className="flex h-48 w-48 items-center justify-center rounded-full border border-dashed border-[var(--admin-shell-control-border)] bg-[var(--admin-shell-avatar-bg)] text-[var(--admin-shell-avatar-text)]" aria-label={profileName ? `Avatar fallback for ${profileName}` : 'Coach avatar fallback'}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-12 w-12">
            <circle cx="12" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M6.5 18.25c1.35-2.45 3.35-3.75 5.5-3.75s4.15 1.3 5.5 3.75"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.6"
            />
          </svg>
        </div>
      )}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleAvatarFileChange}
        />
        <Button
          type="button"
          className="min-h-[36px] rounded-[12px] border border-[#3BE0AF]/40 bg-[#3BE0AF]/10 px-4 text-sm font-semibold text-[#06b486] hover:bg-[#3BE0AF]/15"
          onClick={() => fileInputRef.current?.click()}
        >
          Change avatar
        </Button>
      </div>
    </div>
  )
}

function getProfileDisplayName(profileDraft = ADMIN_PROFILE_SEED) {
  return [profileDraft.firstName, profileDraft.lastName].filter(Boolean).join(' ').trim() || profileDraft.name || ''
}

function AdminSettingsProfileView() {
  const { toastManager } = useToast()
  const [profileDraft, setProfileDraft] = useState(ADMIN_PROFILE_SEED)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setIsLoadingProfile(true)
      setErrorMessage('')
      try {
        const response = await fetch('/admin/api/settings/profile', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to load profile.')
        }
        if (!isMounted) return
        setProfileDraft({
          avatarUrl: payload.profile?.avatarUrl || '',
          name: payload.profile?.name || '',
          firstName: payload.profile?.firstName || '',
          lastName: payload.profile?.lastName || '',
          phone: payload.profile?.phone || '',
          avatarUpload: null,
        })
      } catch (error) {
        if (isMounted) setErrorMessage(error?.message || 'Unable to load profile.')
      } finally {
        if (isMounted) setIsLoadingProfile(false)
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [])

  function handleDraftChange(field, value) {
    setNotice('')
    setErrorMessage('')
    setProfileDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
  }

  function handleAvatarChange(avatarUpload) {
    setNotice('')
    setErrorMessage('')
    setProfileDraft((currentDraft) => ({
      ...currentDraft,
      avatarUrl: avatarUpload.dataUrl,
      avatarUpload,
    }))
  }

  async function handleSaveProfile(event) {
    event.preventDefault()
    setIsSavingProfile(true)
    setNotice('')
    setErrorMessage('')

    try {
      const response = await fetch('/admin/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileDraft.firstName,
          lastName: profileDraft.lastName,
          phone: profileDraft.phone,
          avatarUrl: profileDraft.avatarUrl,
          avatarUpload: profileDraft.avatarUpload,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to save profile.')
      }
      setProfileDraft({
        avatarUrl: payload.profile?.avatarUrl || '',
        name: payload.profile?.name || '',
        firstName: payload.profile?.firstName || '',
        lastName: payload.profile?.lastName || '',
        phone: payload.profile?.phone || '',
        avatarUpload: null,
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pplus-admin-profile-updated', { detail: payload.profile }))
      }
      setNotice('Profile updated.')
      toastManager.show({
        title: 'Profile saved',
        description: 'Your profile changes are live.',
        variant: 'success',
      })
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to save profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const profileStatusMessage = errorMessage || notice || (isLoadingProfile ? 'Loading your connected coach profile.' : '')

  return (
    <form className="admin-settings-profile-form grid w-full gap-6" onSubmit={handleSaveProfile} aria-describedby="admin-profile-status-notice">
      <ProfilePhotoUploader previewSrc={profileDraft.avatarUrl} profileName={getProfileDisplayName(profileDraft)} onAvatarChange={handleAvatarChange} />

      <div className="grid w-full gap-4 md:grid-cols-2">
        <SettingsProfileField htmlFor="admin-profile-first-name" label="First name">
          <Input
            id="admin-profile-first-name"
            className={`admin-settings-profile-first-name ${settingsProfileFieldInputClassName}`}
            value={profileDraft.firstName}
            placeholder="First name"
            onChange={(event) => handleDraftChange('firstName', event.target.value)}
          />
        </SettingsProfileField>
        <SettingsProfileField htmlFor="admin-profile-last-name" label="Last name">
          <Input
            id="admin-profile-last-name"
            className={`admin-settings-profile-last-name ${settingsProfileFieldInputClassName}`}
            value={profileDraft.lastName}
            placeholder="Last name"
            onChange={(event) => handleDraftChange('lastName', event.target.value)}
          />
        </SettingsProfileField>
        <SettingsProfileField htmlFor="admin-profile-phone" label="Phone number" className="md:col-span-2">
          <Input
            id="admin-profile-phone"
            type="tel"
            className={`admin-settings-profile-phone ${settingsProfileFieldInputClassName}`}
            value={profileDraft.phone}
            placeholder="Phone number"
            onChange={(event) => handleDraftChange('phone', event.target.value)}
          />
        </SettingsProfileField>
      </div>

      {profileStatusMessage ? (
        <div id="admin-profile-status-notice" className="flex w-full items-start gap-2 rounded-[14px] border border-[var(--admin-shell-accent)]/30 bg-[var(--admin-shell-accent)]/10 px-4 py-3 text-sm leading-6 text-[var(--admin-shell-text)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#06b486]" />
          <span>{profileStatusMessage}</span>
        </div>
      ) : null}

      <div>
        <Button type="submit" disabled={isLoadingProfile || isSavingProfile} className="admin-settings-profile-submit admin-shell-athletes-create-submit min-h-[40px] rounded-[12px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] disabled:cursor-not-allowed disabled:opacity-60">
          {isSavingProfile ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function AdminSettingsAccountView() {
  const { toastManager } = useToast()
  const [accountDraft, setAccountDraft] = useState(ADMIN_ACCOUNT_SEED)
  const [isLoadingAccount, setIsLoadingAccount] = useState(true)
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadAccount() {
      setIsLoadingAccount(true)
      setErrorMessage('')
      try {
        const response = await fetch('/admin/api/settings/account', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to load account.')
        }
        if (!isMounted) return
        setAccountDraft({
          email: payload.account?.email || '',
          currentPassword: '',
          password: '',
          confirmPassword: '',
        })
      } catch (error) {
        if (isMounted) setErrorMessage(error?.message || 'Unable to load account.')
      } finally {
        if (isMounted) setIsLoadingAccount(false)
      }
    }

    loadAccount()
    return () => {
      isMounted = false
    }
  }, [])

  function handleAccountDraftChange(field, value) {
    setNotice('')
    setErrorMessage('')
    setAccountDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
  }

  async function handleSaveAccount(event) {
    event.preventDefault()
    setIsSavingAccount(true)
    setNotice('')
    setErrorMessage('')

    try {
      const response = await fetch('/admin/api/settings/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountDraft.email,
          currentPassword: accountDraft.currentPassword,
          password: accountDraft.password,
          confirmPassword: accountDraft.confirmPassword,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to save account.')
      }
      setAccountDraft({
        email: payload.account?.email || accountDraft.email,
        currentPassword: '',
        password: '',
        confirmPassword: '',
      })
      setNotice('Account updated.')
      toastManager.show({
        title: 'Account saved',
        description: 'Your account changes are saved.',
        variant: 'success',
      })
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to save account.')
    } finally {
      setIsSavingAccount(false)
    }
  }

  const accountStatusMessage = errorMessage || notice || (isLoadingAccount ? 'Loading your authenticated account.' : '')
  const hasAccountError = Boolean(errorMessage)
  const accountStatusClassName = hasAccountError
    ? 'flex w-full items-start gap-2 rounded-[14px] border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm leading-6 text-[#b91c1c] dark:text-[#fecaca]'
    : 'flex w-full items-start gap-2 rounded-[14px] border border-[var(--admin-shell-accent)]/30 bg-[var(--admin-shell-accent)]/10 px-4 py-3 text-sm leading-6 text-[var(--admin-shell-text)]'
  const accountStatusIconClassName = hasAccountError
    ? 'mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]'
    : 'mt-0.5 h-4 w-4 shrink-0 text-[#06b486]'

  return (
    <form className="admin-settings-account-form grid w-full gap-6" onSubmit={handleSaveAccount} aria-describedby={accountStatusMessage ? 'admin-account-status-notice' : undefined}>
      <div className="grid w-full gap-4">
        <SettingsField htmlFor="admin-account-email" label="Email">
          <Input
            id="admin-account-email"
            type="email"
            className={`admin-settings-account-email ${settingsFieldInputClassName}`}
            value={accountDraft.email}
            placeholder="admin@email.com"
            onChange={(event) => handleAccountDraftChange('email', event.target.value)}
          />
        </SettingsField>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-3">
        <SettingsField htmlFor="admin-account-current-password" label="Current password">
          <Input
            id="admin-account-current-password"
            type="password"
            className={`admin-settings-account-current-password ${settingsFieldInputClassName}`}
            value={accountDraft.currentPassword}
            placeholder="Current password"
            onChange={(event) => handleAccountDraftChange('currentPassword', event.target.value)}
          />
        </SettingsField>
        <SettingsField htmlFor="admin-account-new-password" label="New password">
          <Input
            id="admin-account-new-password"
            type="password"
            className={`admin-settings-account-new-password ${settingsFieldInputClassName}`}
            value={accountDraft.password}
            placeholder="New password"
            onChange={(event) => handleAccountDraftChange('password', event.target.value)}
          />
        </SettingsField>
        <SettingsField htmlFor="admin-account-confirm-password" label="Confirm password">
          <Input
            id="admin-account-confirm-password"
            type="password"
            className={`admin-settings-account-confirm-password ${settingsFieldInputClassName}`}
            value={accountDraft.confirmPassword}
            placeholder="Confirm password"
            onChange={(event) => handleAccountDraftChange('confirmPassword', event.target.value)}
          />
        </SettingsField>
      </div>

      {accountStatusMessage ? (
        <div id="admin-account-status-notice" role={hasAccountError ? 'alert' : 'status'} aria-label={hasAccountError ? 'Account validation error' : 'Account status'} className={accountStatusClassName}>
          <Info className={accountStatusIconClassName} />
          <span>{accountStatusMessage}</span>
        </div>
      ) : null}

      <div>
        <Button type="submit" disabled={isLoadingAccount || isSavingAccount} className="admin-settings-account-submit admin-shell-athletes-create-submit min-h-[40px] rounded-[12px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] disabled:cursor-not-allowed disabled:opacity-60">
          {isSavingAccount ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

export default function AdminSettingsView({ currentPath = '/admin/settings' }) {
  const activeTab = getActiveSettingsTab(currentPath)

  return (
    <section className="admin-settings-shell grid gap-6">
      <div className="admin-settings-header admin-shell-workspace-header">
        <h1 className="admin-settings-title admin-shell-athletes-page-title">{activeTab === 'account' ? 'Account' : 'Profile'}</h1>
        <p className="admin-shell-workspace-description">{activeTab === 'profile' ? 'Edit the approved coach profile fields: avatar, name, and phone.' : 'Update the current admin sign-in email or set a new password.'}</p>
      </div>

      {activeTab === 'account' ? (
        <AdminSettingsAccountView />
      ) : (
        <AdminSettingsProfileView />
      )}
    </section>
  )
}
