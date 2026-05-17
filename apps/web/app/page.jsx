import AdminButton from '../components/admin/ui/admin-button'
import AdminCard from '../components/admin/ui/admin-card'
import AdminInput from '../components/admin/ui/admin-input'
import AdminLabel from '../components/admin/ui/admin-label'
import AdminPageShell from '../components/admin/ui/admin-page-shell'

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
  );
}

function ArrowRightIcon() {
  return (
    <svg className="admin-login-submit-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <AdminPageShell>
      <div className="admin-login-pattern" aria-hidden="true" />

      <AdminCard aria-label="Admin login" layout="auth" padding="auth">
        <form className="admin-login-form">
          <div className="admin-login-field-group">
            <AdminLabel htmlFor="email">EMAIL</AdminLabel>
            <AdminInput
              id="email"
              type="email"
              defaultValue="admin@pplus.app"
            />
          </div>

          <div className="admin-login-field-group">
            <AdminLabel htmlFor="password">PASSWORD</AdminLabel>
            <div className="admin-login-password-shell">
              <AdminInput
                id="password"
                className="admin-login-input-password"
                type="password"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="admin-login-password-toggle"
                aria-label="Toggle password visibility"
              >
                <EyeIcon />
              </button>
            </div>
          </div>

          <AdminButton type="submit" size="auth" className="w-full">
            <span>Sign in</span>
            <ArrowRightIcon />
          </AdminButton>

          <a href="#" className="admin-login-forgot">
            Forgot password?
          </a>
        </form>
      </AdminCard>
    </AdminPageShell>
  );
}
