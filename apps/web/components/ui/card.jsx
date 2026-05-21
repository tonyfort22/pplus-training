import { cn } from '@/lib/utils'

function Card({ className, style, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn('rounded-xl border border-[#24334A] bg-[color:var(--card)] text-[#EEF4FF] shadow-xs', className)}
      style={{
        backgroundColor: 'var(--card)',
        backgroundImage: 'linear-gradient(to top, rgb(59 224 175 / 0.05), var(--card))',
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
  return <div data-slot="card-description" className={cn('text-[#8EA0BC]', className)} {...props} />
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
