import { PphtSupportFac5db68F122 } from '@/components/ppht-support-fac5db68-f122'
import { SupportConversationReply } from '@/components/support-conversation-reply'
import { normalizePublicLanguage } from '../../lib/i18n/language'
import { getPublicPageCopy } from '../../lib/i18n/public-page-copy'
import { LandingFooter, LandingHeader } from '../landing-sections'

export default async function SupportPage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const conversationId = resolvedSearchParams?.conversationId
  const language = normalizePublicLanguage(resolvedSearchParams?.lang)
  const copy = getPublicPageCopy(language)
  const supportCopy = copy.support

  const currentPath = conversationId ? `/support?conversationId=${encodeURIComponent(conversationId)}` : '/support'

  return (
    <main className="landing-page support-page support-template-page">
      <LandingHeader language={language} currentPath={currentPath} copy={copy} />

      <section className="landing-section landing-features-section support-template-section">
        <div className="landing-shell landing-features-stack support-template-stack">
          <div className="landing-section-heading landing-section-heading-centered landing-features-heading support-template-heading-on-image">
            <p className="landing-pill support-template-pill">{supportCopy.pill}</p>
            <h2>{supportCopy.headingPrefix} <span>{supportCopy.headingAccent}</span></h2>
          </div>

          <div className="support-template-card">
            {conversationId ? <SupportConversationReply conversationId={conversationId} copy={supportCopy.reply} /> : <PphtSupportFac5db68F122 copy={supportCopy.form} />}
          </div>
        </div>
      </section>

      <LandingFooter language={language} copy={copy} />
    </main>
  )
}
