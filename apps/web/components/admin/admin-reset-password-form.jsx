'use client'

import { useEffect, useState } from 'react'
import { getLocalizedHref } from '../../lib/i18n/language'
import AdminButton from './ui/admin-button'
import AdminInput from './ui/admin-input'
import AdminLabel from './ui/admin-label'

export default function AdminResetPasswordForm({ resetCopy, language }) {
  const [accessToken, setAccessToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const token = hashParams.get('access_token')

    if (!token || hashParams.get('type') !== 'recovery') {
      setError(resetCopy.missingToken)
      return
    }

    setAccessToken(token)
  }, [resetCopy.missingToken])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!accessToken) {
      setError(resetCopy.missingToken)
      return
    }

    if (password.length < 6) {
      setError(resetCopy.tooShort)
      return
    }

    if (password !== confirmPassword) {
      setError(resetCopy.mismatch)
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, password }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || resetCopy.error)
      }

      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      window.location.assign(payload.redirectTo || '/admin/login?passwordReset=1')
    } catch (submitError) {
      setError(submitError?.message || resetCopy.error)
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <div className="admin-login-field-group">
          <AdminLabel className="admin-auth-sr-only" htmlFor="new-password">
            {resetCopy.password}
          </AdminLabel>
          <AdminInput
            id="new-password"
            type="password"
            placeholder={resetCopy.password}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="admin-login-field-group">
          <AdminLabel className="admin-auth-sr-only" htmlFor="confirm-password">
            {resetCopy.confirmPassword}
          </AdminLabel>
          <AdminInput
            id="confirm-password"
            type="password"
            placeholder={resetCopy.confirmPassword}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error ? (
          <p className="admin-login-error" role="alert">
            {error}
          </p>
        ) : null}

        <AdminButton type="submit" size="default" className="admin-auth-submit-button w-full" disabled={submitting || !accessToken}>
          <span>{submitting ? resetCopy.submitting : resetCopy.submit}</span>
        </AdminButton>
      </form>

      <div className="admin-login-forgot-row">
        <a href={getLocalizedHref('/admin/forgot-password', language)} className="admin-login-forgot">
          {resetCopy.requestNewLink}
        </a>
      </div>
    </>
  )
}
