import { cn } from '@/lib/utils'

function Field({ className, ...props }) {
  return <div data-slot="field" className={cn('grid gap-2', className)} {...props} />
}

function FieldGroup({ className, ...props }) {
  return <div data-slot="field-group" className={cn('grid gap-4', className)} {...props} />
}

function FieldContent({ className, ...props }) {
  return <div data-slot="field-content" className={cn('grid gap-1.5', className)} {...props} />
}

function FieldLabel({ className, ...props }) {
  return (
    <label
      data-slot="field-label"
      className={cn('text-sm font-medium leading-none text-foreground', className)}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }) {
  return <p data-slot="field-description" className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function FieldError({ className, errors, children, ...props }) {
  const message = children ?? errors?.find(Boolean)?.message

  if (!message) {
    return null
  }

  return (
    <p data-slot="field-error" className={cn('text-sm font-medium text-destructive', className)} {...props}>
      {message}
    </p>
  )
}

function FieldSeparator({ className, ...props }) {
  return <div data-slot="field-separator" className={cn('h-px w-full bg-border', className)} {...props} />
}

export { Field, FieldGroup, FieldContent, FieldLabel, FieldDescription, FieldError, FieldSeparator }
