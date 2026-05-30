'use client'

import { useState } from 'react'
import { CheckCircle2, Mail } from 'lucide-react'

import Avatar from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ADMIN_PROFILE_SEED = {
  avatarUrl: '',
  firstName: 'Anthony',
  lastName: 'Fortugno',
  email: 'tonyfortugno22@gmail.com',
}

function getActiveSettingsTab(currentPath = '') {
  if (currentPath.endsWith('/account')) return 'account'
  return 'profile'
}

function CreateAthleteDialogField({ htmlFor, label, children }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-[#DCE6F8]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ProfilePhotoUploader({ previewSrc = '', profileName = '', onFileChange = () => {}, onClearPreview = () => {} }) {
  const hasPreview = Boolean(previewSrc)

  return (
    <label className="admin-shell-athletes-create-uploader relative flex cursor-pointer flex-col items-center justify-center justify-self-start gap-4 px-6 py-2 text-center transition-colors hover:text-[#EEF4FF]">
      {hasPreview ? (
        <div className="relative">
          <Avatar
            alt={profileName || 'Admin avatar'}
            className="h-36 w-36 rounded-full border border-[#24334A] bg-[#0F1728] text-lg font-semibold text-[#DCE6F8]"
            src={previewSrc}
          />
          <button
            type="button"
            aria-label="Remove uploaded avatar"
            className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[10px] font-medium text-[#EEF4FF] shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition-colors hover:bg-[#15233A]"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onClearPreview()
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-[#2B3D57] bg-[#0D1625] text-[#8EA0BC]">
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
      <div className="space-y-1">
        <p className="text-[17px] font-medium text-[#EEF4FF]">{hasPreview ? 'Avatar uploaded' : 'Upload avatar'}</p>
        <p className="text-sm text-[#8EA0BC]">PNG, JPG up to 2MB</p>
      </div>
      <input className="sr-only" type="file" accept="image/*" onChange={onFileChange} />
    </label>
  )
}

function AdminSettingsProfileView() {
  const [profileDraft, setProfileDraft] = useState(ADMIN_PROFILE_SEED)
  const [notice, setNotice] = useState('')

  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setProfileDraft((current) => ({ ...current, avatarUrl: '' }))
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setProfileDraft((current) => {
      if (current.avatarUrl) URL.revokeObjectURL(current.avatarUrl)
      return { ...current, avatarUrl: previewUrl }
    })
    setNotice('')
  }

  function handleClearProfilePhoto() {
    setProfileDraft((current) => {
      if (current.avatarUrl) URL.revokeObjectURL(current.avatarUrl)
      return { ...current, avatarUrl: '' }
    })
    setNotice('')
  }

  function handleSaveProfile(event) {
    event.preventDefault()
    setNotice('Profile updated.')
  }

  return (
    <form className="grid w-full gap-6" onSubmit={handleSaveProfile}>
      <ProfilePhotoUploader
        previewSrc={profileDraft.avatarUrl}
        profileName={[profileDraft.firstName, profileDraft.lastName].filter(Boolean).join(' ')}
        onFileChange={handleProfilePhotoChange}
        onClearPreview={handleClearProfilePhoto}
      />

      <div className="grid w-full gap-4 md:grid-cols-2">
        <CreateAthleteDialogField htmlFor="admin-profile-first-name" label="First name">
          <Input
            id="admin-profile-first-name"
            className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
            value={profileDraft.firstName}
            placeholder="First name"
            onChange={(event) => setProfileDraft((current) => ({ ...current, firstName: event.target.value }))}
          />
        </CreateAthleteDialogField>
        <CreateAthleteDialogField htmlFor="admin-profile-last-name" label="Last name">
          <Input
            id="admin-profile-last-name"
            className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
            value={profileDraft.lastName}
            placeholder="Last name"
            onChange={(event) => setProfileDraft((current) => ({ ...current, lastName: event.target.value }))}
          />
        </CreateAthleteDialogField>
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-[14px] border border-[#2D4C4C] bg-[#0B2F2A] px-4 py-3 text-sm text-[#3BE0AF]">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      ) : null}

      <div>
        <Button type="submit" className="admin-shell-athletes-create-submit rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]">Save changes</Button>
      </div>
    </form>
  )
}

function AdminSettingsAccountView() {
  const [accountDraft, setAccountDraft] = useState({
    email: ADMIN_PROFILE_SEED.email,
    currentPassword: '',
    newPassword: '',
  })
  const [notice, setNotice] = useState('')

  function handleSaveAccount(event) {
    event.preventDefault()
    setNotice('Account updated.')
    setAccountDraft((current) => ({ ...current, currentPassword: '', newPassword: '' }))
  }

  return (
    <form className="grid w-full gap-6" onSubmit={handleSaveAccount}>
      <CreateAthleteDialogField htmlFor="admin-account-email" label="Email">
        <Input
          id="admin-account-email"
          type="email"
          className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
          value={accountDraft.email}
          placeholder="admin@email.com"
          onChange={(event) => setAccountDraft((current) => ({ ...current, email: event.target.value }))}
        />
      </CreateAthleteDialogField>

      <div className="grid w-full gap-4 md:grid-cols-2">
        <CreateAthleteDialogField htmlFor="admin-account-current-password" label="Current password">
          <Input
            id="admin-account-current-password"
            type="password"
            className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
            value={accountDraft.currentPassword}
            placeholder="Current password"
            onChange={(event) => setAccountDraft((current) => ({ ...current, currentPassword: event.target.value }))}
          />
        </CreateAthleteDialogField>
        <CreateAthleteDialogField htmlFor="admin-account-new-password" label="New password">
          <Input
            id="admin-account-new-password"
            type="password"
            className="h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
            value={accountDraft.newPassword}
            placeholder="New password"
            onChange={(event) => setAccountDraft((current) => ({ ...current, newPassword: event.target.value }))}
          />
        </CreateAthleteDialogField>
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-[14px] border border-[#2D4C4C] bg-[#0B2F2A] px-4 py-3 text-sm text-[#3BE0AF]">
          <Mail className="h-4 w-4" />
          {notice}
        </div>
      ) : null}

      <div>
        <Button type="submit" className="admin-shell-athletes-create-submit rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]">Save changes</Button>
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
        <p className="admin-shell-workspace-description">{activeTab === 'profile' ? 'Update your profile image and name shown in the admin dashboard.' : 'Update your sign-in email and password credentials.'}</p>
      </div>

      {activeTab === 'account' ? (
        <AdminSettingsAccountView />
      ) : (
        <AdminSettingsProfileView />
      )}
    </section>
  )
}
