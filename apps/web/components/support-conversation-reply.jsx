"use client"

import { Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import Textarea from '@/components/ui/textarea'

const replyTextareaClassName = 'support-dashboard-textarea min-h-[140px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20'

export function SupportConversationReply({ conversationId }) {
  const [replyText, setReplyText] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedReply = replyText.trim()
    if (!trimmedReply || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch(`/api/support/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: trimmedReply }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.message) {
        throw new Error(payload?.error || 'We could not send your reply. Please try again.')
      }

      setReplyText('')
      setIsSubmitSuccessful(true)
    } catch (error) {
      setSubmitError(error?.message || 'We could not send your reply. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitSuccessful) {
    return (
      <div className="support-template-success">
        <div className="support-template-success-inner">
          <div className="support-template-success-icon">
            <Check aria-hidden="true" />
          </div>
          <h2>Your reply was sent</h2>
          <p>PPLUS Support has been notified and will follow up soon.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="support-template-form" noValidate>
      <div className="support-template-grid">
        <div className="support-template-field support-template-full">
          <label htmlFor="support-reply">Continue your support conversation</label>
          <Textarea
            id="support-reply"
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder="Type your reply..."
            className={replyTextareaClassName}
          />
        </div>
      </div>
      <div className="support-template-actions">
        {submitError ? (
          <p role="alert" className="support-template-submit-error">
            {submitError}
          </p>
        ) : null}
        <Button
          className="min-h-[40px] rounded-[12px] bg-[#3BE0AF] px-[18px] text-[#0B1120] hover:bg-[#35c89d] support-template-submit-button"
          disabled={!replyText.trim() || isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send reply'}
        </Button>
      </div>
    </form>
  )
}

export default SupportConversationReply
