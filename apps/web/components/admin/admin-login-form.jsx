'use client'

import { useState } from 'react'
import { normalizeAdminNextPath } from '../../lib/admin-next-path'
import { getLocalizedHref } from '../../lib/i18n/language'
import AdminButton from './ui/admin-button'
import AdminInput from './ui/admin-input'
import AdminLabel from './ui/admin-label'

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export default function AdminLoginForm({ loginCopy, language, nextPath = '/admin' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || loginCopy.error)
      }

      window.location.assign(normalizeAdminNextPath(nextPath || payload.redirectTo))
    } catch (submitError) {
      setError(submitError?.message || loginCopy.error)
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <div className="admin-login-field-group">
          <AdminLabel className="admin-auth-sr-only" htmlFor="email">
            {loginCopy.email}
          </AdminLabel>
          <AdminInput
            id="email"
            type="email"
            placeholder={loginCopy.email}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="admin-login-field-group">
          <AdminLabel className="admin-auth-sr-only" htmlFor="password">
            {loginCopy.password}
          </AdminLabel>
          <div className="admin-login-password-shell">
            <AdminInput
              id="password"
              className="admin-login-input-password"
              type={showPassword ? 'text' : 'password'}
              placeholder={loginCopy.password}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="admin-login-password-toggle"
              aria-label={loginCopy.togglePassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              <EyeIcon />
            </button>
          </div>
        </div>

        {error ? (
          <p className="admin-login-error" role="alert">
            {error}
          </p>
        ) : null}

        <AdminButton type="submit" size="default" className="admin-auth-submit-button w-full" disabled={submitting}>
          <span>{submitting ? loginCopy.submitting : loginCopy.submit}</span>
        </AdminButton>
      </form>

      <div className="admin-login-forgot-row">
        <a href={getLocalizedHref('/admin/forgot-password', language)} className="admin-login-forgot">
          {loginCopy.forgotPassword}
        </a>
      </div>
    </>
  )
}
