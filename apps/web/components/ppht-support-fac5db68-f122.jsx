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

const dashboardInputClassName = 'support-dashboard-input h-11 rounded-[12px] border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20'
const dashboardTextareaClassName = 'support-dashboard-textarea min-h-[140px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20'
const supportSelectTriggerStyle = { borderColor: 'var(--support-dashboard-input-border)' }

export function PphtSupportFac5db68F122({ copy }) {
  const [submitError, setSubmitError] = useState(null)
  const categoryOptions = copy.categories
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
      setSubmitError(payload?.error || copy.submitError)
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
          <h2>{copy.successTitle}</h2>
          <p>{copy.successBody}</p>
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
              <FieldLabel htmlFor="firstName">{copy.labels.firstName}</FieldLabel>
              <Input {...field} id="firstName" type="text" aria-invalid={fieldState.invalid} placeholder={copy.placeholders.firstName} className={dashboardInputClassName} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="support-template-field support-template-half">
              <FieldLabel htmlFor="lastName">{copy.labels.lastName}</FieldLabel>
              <Input {...field} id="lastName" type="text" aria-invalid={fieldState.invalid} placeholder={copy.placeholders.lastName} className={dashboardInputClassName} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="support-template-field support-template-full">
              <FieldLabel htmlFor="email">{copy.labels.email}</FieldLabel>
              <Input {...field} id="email" type="email" aria-invalid={fieldState.invalid} placeholder={copy.placeholders.email} className={dashboardInputClassName} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="category"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="support-template-field support-template-full">
              <FieldLabel htmlFor="category">{copy.labels.category}</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" className={dashboardInputClassName} style={supportSelectTriggerStyle}>
                  <SelectValue placeholder={copy.placeholders.category} />
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
              <FieldLabel htmlFor="description">{copy.labels.description}</FieldLabel>
              <Textarea {...field} id="description" aria-invalid={fieldState.invalid} placeholder={copy.placeholders.description} className={dashboardTextareaClassName} />
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
        <Button className="min-h-[40px] rounded-[12px] bg-[var(--admin-shell-primary-button-bg)] px-[18px] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] support-template-submit-button" disabled={isSubmitting}>{isSubmitting ? copy.submitSubmitting : copy.submitIdle}</Button>
      </div>
    </form>
  )
}

export default PphtSupportFac5db68F122
