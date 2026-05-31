'use client'

import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

import Avatar from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ADMIN_PROFILE_SEED = {
  avatarUrl: '',
  name: '',
  phone: '',
  avatarUpload: null,
}

const ADMIN_ACCOUNT_SEED = {
  email: 'tonyfortugno22@gmail.com',
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

function SettingsProfileField({ htmlFor, label, children }) {
  return (
    <div className="grid gap-2">
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
  const hasPreview = Boolean(previewSrc)

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
      {hasPreview ? (
        <Avatar
          alt={profileName || 'Coach avatar'}
          className="h-36 w-36 rounded-full border border-[var(--admin-shell-control-border)] bg-[var(--admin-shell-avatar-bg)] text-lg font-semibold text-[var(--admin-shell-avatar-text)]"
          src={previewSrc}
        />
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-[var(--admin-shell-control-border)] bg-[var(--admin-shell-avatar-bg)] text-[var(--admin-shell-avatar-text)]">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9">
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
        <p className="text-[17px] font-medium text-[var(--admin-shell-text-strong)]">Coach avatar</p>
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
        <p className="text-xs text-[var(--admin-shell-muted)]">PNG, JPG, or WEBP.</p>
      </div>
    </div>
  )
}

function AdminSettingsProfileView() {
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
          name: profileDraft.name,
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
        phone: payload.profile?.phone || '',
        avatarUpload: null,
      })
      setNotice('Profile updated.')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to save profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <form className="grid w-full gap-6" onSubmit={handleSaveProfile} aria-describedby="admin-profile-status-notice">
      <ProfilePhotoUploader previewSrc={profileDraft.avatarUrl} profileName={profileDraft.name} onAvatarChange={handleAvatarChange} />

      <div className="grid w-full gap-4 md:grid-cols-2">
        <SettingsProfileField htmlFor="admin-profile-name" label="Name">
          <Input
            id="admin-profile-name"
            className={settingsProfileFieldInputClassName}
            value={profileDraft.name}
            placeholder="Coach name"
            onChange={(event) => handleDraftChange('name', event.target.value)}
          />
        </SettingsProfileField>
        <SettingsProfileField htmlFor="admin-profile-phone" label="Phone">
          <Input
            id="admin-profile-phone"
            type="tel"
            className={settingsProfileFieldInputClassName}
            value={profileDraft.phone}
            placeholder="Coach phone"
            onChange={(event) => handleDraftChange('phone', event.target.value)}
          />
        </SettingsProfileField>
      </div>

      <div id="admin-profile-status-notice" className="flex w-full items-start gap-2 rounded-[14px] border border-[#3BE0AF]/30 bg-[#3BE0AF]/10 px-4 py-3 text-sm leading-6 text-[var(--admin-shell-text)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#06b486]" />
        <span>{errorMessage || notice || (isLoadingProfile ? 'Loading your connected coach profile.' : 'Edit the connected coach profile fields and save changes to Supabase.')}</span>
      </div>

      <div>
        <Button type="submit" disabled={isLoadingProfile || isSavingProfile} className="admin-shell-athletes-create-submit min-h-[40px] rounded-[12px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#3BE0AF] disabled:cursor-not-allowed disabled:opacity-60">
          {isSavingProfile ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function AdminSettingsAccountView() {
  const accountDraft = ADMIN_ACCOUNT_SEED

  return (
    <form className="grid w-full gap-6" aria-describedby="admin-account-disabled-notice">
      <div className="grid w-full gap-4">
        <SettingsField htmlFor="admin-account-email" label="Email">
          <Input
            id="admin-account-email"
            type="email"
            className={settingsFieldInputClassName}
            value={accountDraft.email}
            placeholder="admin@email.com"
            disabled
            readOnly
          />
        </SettingsField>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-2">
        <SettingsField htmlFor="admin-account-current-password" label="Current password">
          <Input
            id="admin-account-current-password"
            type="password"
            className={settingsFieldInputClassName}
            value=""
            placeholder="Current password"
            disabled
            readOnly
          />
        </SettingsField>
        <SettingsField htmlFor="admin-account-confirm-password" label="Confirm password">
          <Input
            id="admin-account-confirm-password"
            type="password"
            className={settingsFieldInputClassName}
            value=""
            placeholder="Confirm password"
            disabled
            readOnly
          />
        </SettingsField>
      </div>

      <div id="admin-account-disabled-notice" className="flex w-full items-start gap-2 rounded-[14px] border border-[#3BE0AF]/30 bg-[#3BE0AF]/10 px-4 py-3 text-sm leading-6 text-[var(--admin-shell-text)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#06b486]" />
        <span>Account changes are unavailable in this admin shell until a current authenticated account update API is connected. The view is read-only to avoid fake saves.</span>
      </div>

      <div>
        <Button type="button" disabled className="admin-shell-athletes-create-submit min-h-[40px] rounded-[12px] bg-[#3BE0AF] text-[#0B1120] opacity-60 hover:bg-[#3BE0AF] disabled:cursor-not-allowed">Account actions unavailable</Button>
      </div>
    </form>
  )
}

export default function AdminSettingsView({ currentPath = '/admin/settings' }) {
  const activeTab = getActiveSettingsTab(currentPath)

  return (
    <section className="grid gap-6">
      <div className="admin-shell-workspace-header">
        <h1 className="admin-shell-athletes-page-title">{activeTab === 'account' ? 'Account' : 'Profile'}</h1>
        <p className="admin-shell-workspace-description">{activeTab === 'profile' ? 'Edit the approved coach profile fields: avatar, name, and phone.' : 'View the current admin sign-in email. Account updates are unavailable until connected to the authenticated account API.'}</p>
      </div>

      {activeTab === 'account' ? (
        <AdminSettingsAccountView />
      ) : (
        <AdminSettingsProfileView />
      )}
    </section>
  )
}
