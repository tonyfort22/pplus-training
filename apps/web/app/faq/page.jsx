import { normalizePublicLanguage } from '../../lib/i18n/language'
import { getPublicPageCopy } from '../../lib/i18n/public-page-copy'
import { LandingFooter, LandingHeader } from '../landing-sections'

export const metadata = {
  title: 'FAQ | PPLUS Training',
  description: 'Answers to common questions about PPLUS Training programs, app access, pricing, and getting started.',
}

export default async function FaqPage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const language = normalizePublicLanguage(resolvedSearchParams?.lang)
  const copy = getPublicPageCopy(language)
  const faqCopy = copy.faq

  return (
    <main className="landing-page faq-page">
      <LandingHeader language={language} currentPath="/faq" copy={copy} />

      <section className="landing-section faq-hero-section" aria-labelledby="faq-heading">
        <div className="landing-shell faq-shell">
          <div className="faq-hero-copy">
            <p className="landing-pill faq-pill">{faqCopy.pill}</p>
            <h1 id="faq-heading" className="faq-hero-title">
              {faqCopy.titlePrefix} <span>{faqCopy.titleAccent}</span>
            </h1>
          </div>

          <div className="faq-accordion-list" aria-label={faqCopy.ariaLabel}>
            {faqCopy.items.map((item, index) => (
              <details key={item.question} className="faq-item" open={index === 0}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter language={language} copy={copy} />
    </main>
  )
}
