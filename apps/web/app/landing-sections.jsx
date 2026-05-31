import Image from 'next/image'
import { Mail, MapPin, Phone } from 'lucide-react'
import PublicLanguageSwitcher from '../components/public-language-switcher'
import PublicThemeToggle from '../components/public-theme-toggle'
import { DEFAULT_LANGUAGE, getLocalizedHref } from '../lib/i18n/language'
import * as landingContentFallback from './landing-content'

export const APP_STORE_DOWNLOAD_URL = 'https://apps.apple.com/'

const footerContactIcons = {
  'map-pin': MapPin,
  phone: Phone,
  mail: Mail,
}

function FooterLinkColumn({ title, links, language }) {
  return (
    <div className="landing-footer-column">
      <h3>{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <a href={getLocalizedHref(link.href, language)}>{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LandingLogo({ className = '', priority = false } = {}) {
  const logoClassName = ['landing-logo', className].filter(Boolean).join(' ')

  return (
    <span className={logoClassName} aria-hidden="true">
      <Image
        src="/landing/brand/logo-ppht-landing.png"
        alt=""
        width={290}
        height={48}
        priority={priority}
        className="landing-logo-image landing-logo-dark"
      />
      <Image
        src="/admin/logo_ppht_light_mode.svg"
        alt=""
        width={267}
        height={44}
        priority={priority}
        className="landing-logo-image landing-logo-light"
      />
    </span>
  )
}

export function LandingHeader({ language = DEFAULT_LANGUAGE, currentPath = '/', copy } = {}) {
  const navCopy = copy?.home?.nav || {
    features: 'Features',
    program: 'Program',
    faq: 'FAQ',
    support: 'Support',
  }

  return (
    <header className="landing-header">
      <div className="landing-shell landing-header-inner">
        <a href={getLocalizedHref('/', language)} className="landing-header-brand" aria-label="PPLUS Training home">
          <LandingLogo className="landing-logo-header" priority />
        </a>

        <nav className="landing-header-nav" aria-label="Primary">
          <a href={getLocalizedHref('/#features', language)}>{navCopy.features}</a>
          <a href={getLocalizedHref('/#programs', language)}>{navCopy.program}</a>
          <a href={getLocalizedHref('/faq', language)}>{navCopy.faq}</a>
          <a href={getLocalizedHref('/support', language)}>{navCopy.support}</a>
        </nav>

        <div className="landing-header-actions">
          <PublicLanguageSwitcher language={language} currentPath={currentPath} />
          <a className="landing-store-link landing-store-link-header" href={APP_STORE_DOWNLOAD_URL} aria-label="Download PPLUS Training on the App Store">
            <Image
              src="/landing/brand/app-store-badge.svg"
              alt="Download on the App Store"
              width={154}
              height={46}
            />
          </a>
        </div>
      </div>
    </header>
  )
}

export function LandingFooter({ language = DEFAULT_LANGUAGE, copy } = {}) {
  const footerCopy = copy?.home?.footer || landingContentFallback.footer

  return (
    <footer id="footer" className="landing-footer">
      <div className="landing-shell landing-footer-grid">
        <div className="landing-footer-brand-block">
          <a href={getLocalizedHref('/', language)} className="landing-footer-logo-link" aria-label="PPLUS Training home">
            <LandingLogo />
          </a>
          <p>{footerCopy.brandCopy}</p>
          <address>
            {footerCopy.contact.map((item) => {
              const Icon = footerContactIcons[item.icon]
              const contactContent = (
                <>
                  <Icon className="landing-footer-contact-icon" aria-hidden="true" />
                  <span>{item.text}</span>
                </>
              )

              if (item.href) {
                return (
                  <a
                    key={item.text}
                    className="landing-footer-contact-item"
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                  >
                    {contactContent}
                  </a>
                )
              }

              return (
                <span key={item.text} className="landing-footer-contact-item">
                  {contactContent}
                </span>
              )
            })}
          </address>
        </div>

        <FooterLinkColumn title={footerCopy.columnTitles?.features || 'Features'} links={footerCopy.featureLinks} language={language} />
        <FooterLinkColumn title={footerCopy.columnTitles?.programs || 'Programs'} links={footerCopy.programLinks} language={language} />
        <FooterLinkColumn title={footerCopy.columnTitles?.resources || 'Resources'} links={footerCopy.resourceLinks} language={language} />
      </div>

      <div className="landing-shell landing-footer-meta">
        <p>{footerCopy.copyright}</p>
        <PublicThemeToggle />
      </div>
    </footer>
  )
}
