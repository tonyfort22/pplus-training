'use client'

import { Info } from 'lucide-react'

import Avatar from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ADMIN_PROFILE_SEED = {
  avatarUrl: '',
  name: '',
  phone: '',
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

function ProfilePhotoUploader({ previewSrc = '', profileName = '' }) {
  const hasPreview = Boolean(previewSrc)

  return (
    <div className="relative flex cursor-not-allowed flex-col items-center justify-center justify-self-start gap-4 px-0 py-1 text-center opacity-85">
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
      <div className="space-y-1">
        <p className="text-[17px] font-medium text-[var(--admin-shell-text-strong)]">Coach avatar</p>
        <p className="text-sm text-[var(--admin-shell-muted)]">Avatar updates are unavailable in this admin view.</p>
      </div>
    </div>
  )
}

function AdminSettingsProfileView() {
  const profileDraft = ADMIN_PROFILE_SEED

  return (
    <form className="grid w-full gap-6" aria-describedby="admin-profile-disabled-notice">
      <ProfilePhotoUploader previewSrc={profileDraft.avatarUrl} profileName={profileDraft.name} />

      <div className="grid w-full gap-4 md:grid-cols-2">
        <SettingsProfileField htmlFor="admin-profile-name" label="Name">
          <Input
            id="admin-profile-name"
            className={settingsProfileFieldInputClassName}
            value={profileDraft.name}
            placeholder="Coach name"
            disabled
            readOnly
          />
        </SettingsProfileField>
        <SettingsProfileField htmlFor="admin-profile-phone" label="Phone">
          <Input
            id="admin-profile-phone"
            type="tel"
            className={settingsProfileFieldInputClassName}
            value={profileDraft.phone}
            placeholder="Coach phone"
            disabled
            readOnly
          />
        </SettingsProfileField>
      </div>

      <div id="admin-profile-disabled-notice" className="flex w-full items-start gap-2 rounded-[14px] border border-[#3BE0AF]/30 bg-[#3BE0AF]/10 px-4 py-3 text-sm leading-6 text-[var(--admin-shell-text)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#06b486]" />
        <span>Profile editing is unavailable in this admin shell until a current authenticated coach profile API is connected. The view is read-only to avoid fake saves.</span>
      </div>

      <div>
        <Button type="button" disabled className="admin-shell-athletes-create-submit min-h-[40px] rounded-[12px] bg-[#3BE0AF] text-[#0B1120] opacity-60 hover:bg-[#3BE0AF] disabled:cursor-not-allowed">Save changes unavailable</Button>
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
        <p className="admin-shell-workspace-description">{activeTab === 'profile' ? 'View the approved coach profile fields: avatar, name, and phone.' : 'View the current admin sign-in email. Account updates are unavailable until connected to the authenticated account API.'}</p>
      </div>

      {activeTab === 'account' ? (
        <AdminSettingsAccountView />
      ) : (
        <AdminSettingsProfileView />
      )}
    </section>
  )
}
