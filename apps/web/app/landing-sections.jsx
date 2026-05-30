import Image from 'next/image'
import { Mail, MapPin, Phone } from 'lucide-react'
import { footer } from './landing-content'

export const APP_STORE_DOWNLOAD_URL = 'https://apps.apple.com/'

const footerContactIcons = {
  'map-pin': MapPin,
  phone: Phone,
  mail: Mail,
}

function FooterLinkColumn({ title, links }) {
  return (
    <div className="landing-footer-column">
      <h3>{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-shell landing-header-inner">
        <a href="/" className="landing-header-brand" aria-label="PPLUS Training home">
          <Image
            src="/landing/brand/logo-ppht-landing.png"
            alt="PPLUS Training logo"
            width={290}
            height={48}
            priority
            className="landing-logo landing-logo-header"
          />
        </a>

        <nav className="landing-header-nav" aria-label="Primary">
          <a href="/#features">Features</a>
          <a href="/#programs">Program</a>
          <a href="/faq">FAQ</a>
          <a href="/support">Support</a>
        </nav>

        <div className="landing-header-actions">
          <a href="/admin/login" className="landing-signin-link">Sign In</a>
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

export function LandingFooter() {
  return (
    <footer id="footer" className="landing-footer">
      <div className="landing-shell landing-footer-grid">
        <div className="landing-footer-brand-block">
          <Image
            src="/landing/brand/logo-ppht-landing.png"
            alt="PPLUS Training logo"
            width={290}
            height={48}
            className="landing-logo"
          />
          <p>{footer.brandCopy}</p>
          <address>
            {footer.contact.map((item) => {
              const Icon = footerContactIcons[item.icon]

              return (
                <span key={item.text} className="landing-footer-contact-item">
                  <Icon className="landing-footer-contact-icon" aria-hidden="true" />
                  <span>{item.text}</span>
                </span>
              )
            })}
          </address>
        </div>

        <FooterLinkColumn title="Features" links={footer.featureLinks} />
        <FooterLinkColumn title="Programs" links={footer.programLinks} />
        <FooterLinkColumn title="Resources" links={footer.resourceLinks} />
      </div>

      <div className="landing-shell landing-footer-meta">
        <p>{footer.copyright}</p>
      </div>
    </footer>
  )
}
