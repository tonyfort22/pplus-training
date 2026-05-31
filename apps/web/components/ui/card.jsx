import { cn } from '@/lib/utils'

function Card({ className, style, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn('rounded-xl border border-[var(--admin-dashboard-card-border)] bg-[color:var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] shadow-xs', className)}
      style={{
        backgroundColor: 'var(--admin-dashboard-card-bg)',
        backgroundImage: 'var(--admin-dashboard-card-gradient)',
        ...style,
      }}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}

function CardTitle({ className, ...props }) {
  return <div data-slot="card-title" className={cn('leading-none font-semibold', className)} {...props} />
}

function CardDescription({ className, ...props }) {
  return <div data-slot="card-description" className={cn('text-[var(--admin-dashboard-card-muted)]', className)} {...props} />
}

function CardAction({ className, ...props }) {
  return <div data-slot="card-action" className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)} {...props} />
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />
}

function CardFooter({ className, ...props }) {
  return <div data-slot="card-footer" className={cn('flex items-center px-6 pb-6', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter }
