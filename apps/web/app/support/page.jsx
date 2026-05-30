import { PphtSupportFac5db68F122 } from '@/components/ppht-support-fac5db68-f122'
import { SupportConversationReply } from '@/components/support-conversation-reply'
import { LandingFooter, LandingHeader } from '../landing-sections'

export default async function SupportPage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const conversationId = resolvedSearchParams?.conversationId

  return (
    <main className="landing-page support-page support-template-page">
      <LandingHeader />

      <section className="landing-section landing-features-section support-template-section">
        <div className="landing-shell landing-features-stack support-template-stack">
          <div className="landing-section-heading landing-section-heading-centered landing-features-heading support-template-heading-on-image">
            <p>SUPPORT</p>
            <h2>Get in Touch</h2>
            <span>We're here to help! Please describe your issue below.</span>
          </div>

          <div className="support-template-card">
            {conversationId ? <SupportConversationReply conversationId={conversationId} /> : <PphtSupportFac5db68F122 />}
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  )
}
