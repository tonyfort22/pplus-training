import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { Mail, MapPin, Phone } from 'lucide-react'
import PublicLanguageSwitcher from '../components/public-language-switcher'
import PublicThemeToggle, { PublicThemeHydrator } from '../components/public-theme-toggle'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import LandingHeaderScrollFrame from './landing-header-scroll-frame'
import { DEFAULT_LANGUAGE, getLocalizedHref } from '../lib/i18n/language'
import * as landingContentFallback from './landing-content'

export const APP_STORE_DOWNLOAD_URL = 'https://apps.apple.com/'

const footerContactIcons = {
  'map-pin': MapPin,
  phone: Phone,
  mail: Mail,
}

const landingHeaderNavItems = (navCopy, language) => [
  { key: 'features', href: getLocalizedHref('/#features', language), label: navCopy.features },
  { key: 'program', href: getLocalizedHref('/#programs', language), label: navCopy.program },
  { key: 'faq', href: getLocalizedHref('/faq', language), label: navCopy.faq },
  { key: 'support', href: getLocalizedHref('/support', language), label: navCopy.support },
]

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
  const navItems = landingHeaderNavItems(navCopy, language)

  return (
    <LandingHeaderScrollFrame>
      <PublicThemeHydrator />
      <div className="landing-header-desktop landing-shell landing-header-inner">
        <a href={getLocalizedHref('/', language)} className="landing-header-brand" aria-label="PPLUS Training home">
          <LandingLogo className="landing-logo-header" priority />
        </a>

        <nav className="landing-header-nav" aria-label="Primary">
          {navItems.map((item) => (
            <a key={item.key} href={item.href}>{item.label}</a>
          ))}
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

      <div className="landing-header-mobile landing-shell">
        <a href={getLocalizedHref('/', language)} className="landing-header-brand" aria-label="PPLUS Training home">
          <LandingLogo className="landing-logo-header" priority />
        </a>

        <Sheet>
          <SheetTrigger asChild>
            <button className="landing-mobile-menu-button" type="button" aria-label="Open navigation menu">
              <Menu aria-hidden="true" />
              <span>Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="landing-mobile-menu-sheet" showCloseButton={false}>
            <SheetHeader className="landing-mobile-menu-header">
              <div className="landing-mobile-menu-header-row">
                <SheetTitle className="landing-mobile-menu-title">Menu</SheetTitle>
                <SheetClose asChild>
                  <button className="landing-mobile-menu-close" type="button" aria-label="Close navigation menu">
                    <X aria-hidden="true" />
                  </button>
                </SheetClose>
              </div>
            </SheetHeader>

            <nav className="landing-mobile-menu-nav" aria-label="Mobile primary">
              {navItems.map((item) => (
                <SheetClose key={item.key} asChild>
                  <a className="landing-mobile-menu-link" href={item.href}>{item.label}</a>
                </SheetClose>
              ))}
            </nav>

            <div className="landing-mobile-menu-actions">
              <div className="landing-mobile-menu-switcher-row">
                <PublicLanguageSwitcher language={language} currentPath={currentPath} />
                <PublicThemeToggle />
              </div>
              <SheetClose asChild>
                <a className="landing-store-link landing-mobile-store-link" href={APP_STORE_DOWNLOAD_URL} aria-label="Download PPLUS Training on the App Store">
                  <Image
                    src="/landing/brand/app-store-badge.svg"
                    alt="Download on the App Store"
                    width={154}
                    height={46}
                  />
                </a>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </LandingHeaderScrollFrame>
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
