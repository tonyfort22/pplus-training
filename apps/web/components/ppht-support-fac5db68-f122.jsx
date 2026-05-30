"use client"

import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { formSchema } from '@/lib/form-schema'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Textarea from '@/components/ui/textarea'

const categoryOptions = [
  { label: 'Technical Issue', value: 'technical' },
  { label: 'Billing Question', value: 'billing' },
  { label: 'Product Inquiry', value: 'product' },
  { label: 'Account Access', value: 'account' },
  { label: 'Other', value: 'other' },
]

const dashboardInputClassName = 'support-dashboard-input h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20'
const dashboardTextareaClassName = 'support-dashboard-textarea min-h-[140px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20'

export function PphtSupportFac5db68F122() {
  const [submitError, setSubmitError] = useState(null)
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      category: '',
      description: '',
    },
  })

  const {
    formState: { isSubmitting, isSubmitSuccessful },
  } = form

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null)

    const response = await fetch('/api/support-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setSubmitError(payload?.error || 'We could not submit your support request. Please try again.')
      return
    }

    form.reset()
  })

  if (isSubmitSuccessful) {
    return (
      <div className="support-template-success">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, stiffness: 300, damping: 25 }}
          className="support-template-success-inner"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 500, damping: 15 }}
            className="support-template-success-icon"
          >
            <Check aria-hidden="true" />
          </motion.div>
          <h2>Thank you</h2>
          <p>Form submitted successfully, we will get back to you soon.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="support-template-form" noValidate>
      <FieldGroup className="support-template-grid">
        <Controller
          name="firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="support-template-field support-template-half">
              <FieldLabel htmlFor="firstName">First Name *</FieldLabel>
              <Input {...field} id="firstName" type="text" aria-invalid={fieldState.invalid} placeholder="Enter your first name" className={dashboardInputClassName} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="support-template-field support-template-half">
              <FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
              <Input {...field} id="lastName" type="text" aria-invalid={fieldState.invalid} placeholder="Enter your last name" className={dashboardInputClassName} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="support-template-field support-template-full">
              <FieldLabel htmlFor="email">Email Address *</FieldLabel>
              <Input {...field} id="email" type="email" aria-invalid={fieldState.invalid} placeholder="Enter your email address" className={dashboardInputClassName} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="category"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="support-template-field support-template-full">
              <FieldLabel htmlFor="category">Issue Category *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" className={dashboardInputClassName}>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="support-template-field support-template-full">
              <FieldLabel htmlFor="description">Issue Description *</FieldLabel>
              <Textarea {...field} id="description" aria-invalid={fieldState.invalid} placeholder="Please describe your issue in detail..." className={dashboardTextareaClassName} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="support-template-actions">
        {submitError && (
          <p role="alert" className="support-template-submit-error">
            {submitError}
          </p>
        )}
        <Button className="min-h-[40px] rounded-[12px] bg-[#3BE0AF] px-[18px] text-[#0B1120] hover:bg-[#35c89d] support-template-submit-button" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit'}</Button>
      </div>
    </form>
  )
}

export default PphtSupportFac5db68F122
