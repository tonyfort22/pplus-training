"use client"

import { Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import Textarea from '@/components/ui/textarea'

const replyTextareaClassName = 'support-dashboard-textarea min-h-[140px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20'

export function SupportConversationReply({ conversationId, copy }) {
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
        throw new Error(payload?.error || copy.submitError)
      }

      setReplyText('')
      setIsSubmitSuccessful(true)
    } catch (error) {
      setSubmitError(error?.message || copy.submitError)
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
          <h2>{copy.successTitle}</h2>
          <p>{copy.successBody}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="support-template-form" noValidate>
      <div className="support-template-grid">
        <div className="support-template-field support-template-full">
          <label htmlFor="support-reply">{copy.label}</label>
          <Textarea
            id="support-reply"
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder={copy.placeholder}
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
          {isSubmitting ? copy.submitSubmitting : copy.submitIdle}
        </Button>
      </div>
    </form>
  )
}

export default SupportConversationReply
