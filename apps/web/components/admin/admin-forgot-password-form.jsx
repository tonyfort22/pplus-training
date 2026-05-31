'use client'

import { useState } from 'react'
import { getLocalizedHref } from '../../lib/i18n/language'
import AdminButton from './ui/admin-button'
import AdminInput from './ui/admin-input'
import AdminLabel from './ui/admin-label'

export default function AdminForgotPasswordForm({ forgotCopy, language }) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || forgotCopy.error)
      }

      setSuccess(true)
    } catch (submitError) {
      setError(submitError?.message || forgotCopy.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <div className="admin-login-field-group">
          <AdminLabel className="admin-auth-sr-only" htmlFor="forgot-email">
            {forgotCopy.email}
          </AdminLabel>
          <AdminInput
            id="forgot-email"
            type="email"
            placeholder={forgotCopy.email}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {success ? (
          <p className="admin-login-success" role="status">
            {forgotCopy.success}
          </p>
        ) : null}

        {error ? (
          <p className="admin-login-error" role="alert">
            {error}
          </p>
        ) : null}

        <AdminButton type="submit" size="default" className="admin-auth-submit-button w-full" disabled={submitting}>
          <span>{submitting ? forgotCopy.submitting : forgotCopy.submit}</span>
        </AdminButton>
      </form>

      <div className="admin-login-forgot-row">
        <a href={getLocalizedHref('/admin/login', language)} className="admin-login-forgot">
          {forgotCopy.backToLogin}
        </a>
      </div>
    </>
  )
}
