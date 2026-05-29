import Image from 'next/image'
import { CircleCheckBig, Dumbbell, Flame, Medal, Trophy, Users, Zap } from 'lucide-react'
import LandingFeatureShowcase from './landing-feature-showcase'
import { features, featuresSection, hero, programs, programsSection } from './landing-content'
import { APP_STORE_DOWNLOAD_URL, LandingFooter, LandingHeader } from './landing-sections'

const heroIcons = [
  { id: 'top-left', icon: Dumbbell, className: 'landing-hero-icon-top-left' },
  { id: 'mid-left', icon: Flame, className: 'landing-hero-icon-mid-left' },
  { id: 'bottom-left', icon: Zap, className: 'landing-hero-icon-bottom-left' },
  { id: 'top-right', icon: Trophy, className: 'landing-hero-icon-top-right' },
  { id: 'mid-right', icon: Users, className: 'landing-hero-icon-mid-right' },
  { id: 'bottom-right', icon: Medal, className: 'landing-hero-icon-bottom-right' },
]

export default function HomePage() {
  const [heroLineOne, heroLineTwo] = hero.heading.split(' / ')

  return (
    <main className="landing-page">
      <LandingHeader />

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
              {hero.pill}
            </p>
            <h1 className="landing-hero-title">
              <span>{heroLineOne}</span>
              <span className="landing-hero-title-accent">{heroLineTwo}</span>
            </h1>
            <p className="landing-hero-description">{hero.copy}</p>
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
            <p>{featuresSection.label}</p>
            <h2>{featuresSection.heading}</h2>
          </div>
          <LandingFeatureShowcase features={features} />
        </div>
      </section>

      <section id="programs" className="landing-section landing-programs-section">
        <div className="landing-shell">
          <div className="landing-section-heading landing-section-heading-centered landing-programs-heading">
            <p>{programsSection.label}</p>
            <h2>{programsSection.heading}</h2>
          </div>

          <div className="landing-program-grid">
            {programs.map((program) => (
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

      <LandingFooter />
    </main>
  )
}
