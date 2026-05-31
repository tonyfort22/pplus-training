import Image from 'next/image'
import { CircleCheckBig, Dumbbell, Flame, Medal, Trophy, Users, Zap } from 'lucide-react'
import LandingFeatureShowcase from './landing-feature-showcase'
import { APP_STORE_DOWNLOAD_URL, LandingFooter, LandingHeader } from './landing-sections'
import { normalizePublicLanguage } from '../lib/i18n/language'
import { getPublicPageCopy } from '../lib/i18n/public-page-copy'

const heroIcons = [
  { id: 'top-left', icon: Dumbbell, className: 'landing-hero-icon-top-left' },
  { id: 'mid-left', icon: Flame, className: 'landing-hero-icon-mid-left' },
  { id: 'bottom-left', icon: Zap, className: 'landing-hero-icon-bottom-left' },
  { id: 'top-right', icon: Trophy, className: 'landing-hero-icon-top-right' },
  { id: 'mid-right', icon: Users, className: 'landing-hero-icon-mid-right' },
  { id: 'bottom-right', icon: Medal, className: 'landing-hero-icon-bottom-right' },
]

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const language = normalizePublicLanguage(resolvedSearchParams?.lang)
  const copy = getPublicPageCopy(language)
  const homeCopy = copy.home
  const [heroLineOne, heroLineTwo] = homeCopy.hero.heading.split(' / ')

  return (
    <main className="landing-page">
      <LandingHeader language={language} currentPath="/" copy={copy} />

      <section id="hero" className="landing-section landing-hero">
        <div className="landing-shell landing-hero-inner">
          <div className="landing-hero-icon-cloud" aria-hidden="true">
            {heroIcons.map((icon) => {
              const Icon = icon.icon

              return (
                <div key={icon.id} className={`landing-hero-icon-box ${icon.className}`}>
                  <Icon />
                </div>
              )
            })}
          </div>

          <div className="landing-hero-copy">
            <p className="landing-pill">
              <Trophy className="landing-pill-icon" aria-hidden="true" />
              {homeCopy.hero.pill}
            </p>
            <h1 className="landing-hero-title">
              <span>{heroLineOne}</span>
              <span className="landing-hero-title-accent">{heroLineTwo}</span>
            </h1>
            <p className="landing-hero-description">{homeCopy.hero.copy}</p>
            <div className="landing-hero-actions">
              <a className="landing-store-link" href={APP_STORE_DOWNLOAD_URL} aria-label="Download PPLUS Training on the App Store">
                <Image
                  src="/landing/brand/app-store-badge.svg"
                  alt="Download on the App Store"
                  width={184}
                  height={56}
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section landing-features-section">
        <div className="landing-shell landing-features-stack">
          <div className="landing-section-heading landing-section-heading-centered landing-features-heading">
            <p className="landing-pill landing-features-pill">{homeCopy.featuresSection.label}</p>
            <h2>{homeCopy.featuresSection.heading}</h2>
          </div>
          <LandingFeatureShowcase features={homeCopy.features} />
        </div>
      </section>

      <section id="programs" className="landing-section landing-programs-section">
        <div className="landing-shell">
          <div className="landing-section-heading landing-section-heading-centered landing-programs-heading">
            <p className="landing-pill landing-programs-pill">{homeCopy.programsSection.label}</p>
            <h2>{homeCopy.programsSection.heading}</h2>
          </div>

          <div className="landing-program-grid">
            {homeCopy.programs.map((program) => (
              <article key={program.title} className="landing-program-card">
                <span className="landing-program-icon" aria-hidden="true">
                  <Dumbbell />
                </span>
                <h3>{program.title}</h3>
                <p>{program.description}</p>
                <ul className="landing-program-list">
                  {program.bullets.map((bullet) => (
                    <li key={`${program.title}-${bullet}`} className="landing-program-list-item">
                      <CircleCheckBig className="landing-program-list-icon" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter language={language} copy={copy} />
    </main>
  )
}
