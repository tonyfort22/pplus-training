import AdminForgotPasswordForm from '../../../components/admin/admin-forgot-password-form'
import AdminCard from '../../../components/admin/ui/admin-card'
import AdminPageShell from '../../../components/admin/ui/admin-page-shell'
import { getLocalizedHref, normalizePublicLanguage } from '../../../lib/i18n/language'
import { getPublicPageCopy } from '../../../lib/i18n/public-page-copy'

export default async function ForgotPasswordPage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const language = normalizePublicLanguage(resolvedSearchParams?.lang)
  const copy = getPublicPageCopy(language)
  const loginCopy = copy.login
  const forgotCopy = copy.login.form.forgot

  return (
    <AdminPageShell>
      <div className="admin-login-pattern" aria-hidden="true" />

      <div className="admin-auth-frame">
        <input id="auth-theme-dark" className="admin-auth-theme-input" type="radio" name="auth-theme" defaultChecked />
        <input id="auth-theme-light" className="admin-auth-theme-input" type="radio" name="auth-theme" />

        <section className="admin-auth-marketing" aria-label="PPLUS Training marketing">
          <div className="admin-auth-marketing-inner">
            <div className="admin-auth-marketing-badge">
              <img src="/admin/auth_trophy.svg" alt="" aria-hidden="true" />
              <span>{loginCopy.badge}</span>
            </div>

            <div className="admin-auth-marketing-copy">
              <p className="admin-auth-marketing-kicker">{loginCopy.kicker}</p>
              <div className="admin-auth-marketing-headline">
                <h2>{loginCopy.headline.lineOne}</h2>
                <h2 className="admin-auth-marketing-headline-accent">{loginCopy.headline.lineTwo}</h2>
              </div>
              <p className="admin-auth-marketing-description">{loginCopy.description}</p>
            </div>

            <img className="admin-auth-app-store-badge" src="/admin/auth_app_store_badge.svg" alt="Download on the App Store" />
          </div>
        </section>

        <AdminCard aria-label="Forgot password" className="admin-auth-signin-shell" layout="auth" padding="auth">
          <div className="admin-auth-theme-toggle-row">
            <img className="admin-auth-theme-toggle" src="/admin/auth_theme_toggle.svg" alt="" aria-hidden="true" />
            <img className="admin-auth-theme-toggle admin-auth-theme-toggle-light" src="/admin/auth_theme_toggle_light.svg" alt="" aria-hidden="true" />
            <label className="admin-auth-theme-hit admin-auth-theme-hit-light" htmlFor="auth-theme-light" aria-label="Switch to light mode" />
            <label className="admin-auth-theme-hit admin-auth-theme-hit-dark" htmlFor="auth-theme-dark" aria-label="Switch to dark mode" />
          </div>

          <div className="admin-auth-signin-body">
            <div className="admin-auth-signin-logo-row">
              <a href={getLocalizedHref('/', language)} className="admin-auth-signin-logo-link" aria-label="PPLUS Training home">
                <img className="admin-auth-signin-logo admin-auth-signin-logo-dark" src="/admin/logo_pplus_training.svg" alt="PPLUS Training" />
                <img className="admin-auth-signin-logo admin-auth-signin-logo-light" src="/admin/logo_ppht_light_mode.svg" alt="PPLUS Training" />
              </a>
            </div>

            <div className="admin-auth-flow">
              <div className="admin-auth-title-row">
                <h1 className="admin-auth-title">{forgotCopy.title}</h1>
                <p className="admin-auth-description">{forgotCopy.description}</p>
              </div>

              <AdminForgotPasswordForm forgotCopy={forgotCopy} language={language} />
            </div>
          </div>
        </AdminCard>
      </div>
    </AdminPageShell>
  )
}
