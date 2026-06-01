"use client"

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function buildVariantLabels(count) {
  return Array.from({ length: count }, (_, index) => `__variant${index}`)
}

function buildModifiers(variantClassnames, datesPerVariant) {
  const variantLabels = buildVariantLabels(variantClassnames.length)

  const modifiers = variantLabels.reduce((acc, key, index) => {
    acc[key] = datesPerVariant[index] ?? []
    return acc
  }, {})

  const modifiersClassNames = variantLabels.reduce((acc, key, index) => {
    acc[key] = variantClassnames[index]
    return acc
  }, {})

  return [modifiers, modifiersClassNames]
}

function categorizeDatesPerVariant(weightedDates, variantCount) {
  if (!Array.isArray(weightedDates) || weightedDates.length === 0 || variantCount <= 0) {
    return Array.from({ length: Math.max(variantCount, 0) }, () => [])
  }

  const sortedEntries = [...weightedDates]
    .filter((entry) => entry?.date instanceof Date && !Number.isNaN(entry.date.getTime()) && Number.isFinite(entry.weight))
    .sort((a, b) => a.weight - b.weight)

  if (sortedEntries.length === 0) {
    return Array.from({ length: variantCount }, () => [])
  }

  const categorizedRecord = Array.from({ length: variantCount }, () => [])
  const minNumber = sortedEntries[0].weight
  const maxNumber = sortedEntries[sortedEntries.length - 1].weight
  const range = minNumber === maxNumber ? 1 : (maxNumber - minNumber) / variantCount

  sortedEntries.forEach((entry) => {
    const category = Math.min(Math.floor((entry.weight - minNumber) / range), variantCount - 1)
    categorizedRecord[category].push(entry.date)
  })

  return categorizedRecord
}

function CalendarHeatmap({
  variantClassnames = [],
  datesPerVariant,
  weightedDates,
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  const variantCount = variantClassnames.length
  const categorizedDates = datesPerVariant ?? categorizeDatesPerVariant(weightedDates ?? [], variantCount)
  const [modifiers, modifiersClassNames] = buildModifiers(variantClassnames, categorizedDates)

  return (
    <DayPicker
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      showOutsideDays={showOutsideDays}
      navLayout="around"
      className={cn('p-0', className)}
      classNames={{
        months: 'flex w-full flex-col gap-4 min-[1180px]:flex-row min-[1180px]:flex-wrap',
        month: 'relative w-full space-y-3 rounded-[14px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-3',
        month_caption: 'flex items-center justify-center px-7 pb-4',
        caption_label: 'text-base font-bold leading-none text-[var(--admin-dashboard-card-text)]',
        nav: 'hidden',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-3 top-3 size-6 rounded-md bg-transparent p-0 text-[var(--admin-dashboard-card-muted)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-3 top-3 size-6 rounded-md bg-transparent p-0 text-[var(--admin-dashboard-card-muted)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'grid grid-cols-7',
        weekday: 'w-full rounded-md text-center text-sm font-bold leading-none text-[var(--admin-dashboard-card-muted)]',
        week: 'mt-1 grid w-full grid-cols-7',
        day: 'relative block aspect-square w-full overflow-hidden rounded-[7px] p-0 text-center text-sm leading-none',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute inset-0 flex h-full w-full items-center justify-center rounded-[7px] border border-transparent p-0 text-sm font-medium leading-none text-[var(--admin-dashboard-card-text)] hover:border-[color:var(--admin-dashboard-card-border)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]',
        ),
        today: '[&>button]:border-[color:var(--admin-shell-accent)] [&>button]:text-[var(--admin-dashboard-card-text)]',
        outside: 'opacity-25',
        disabled: 'opacity-100',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...iconProps }) => (
          orientation === 'left'
            ? <ChevronLeft className="size-4" aria-hidden="true" {...iconProps} />
            : <ChevronRight className="size-4" aria-hidden="true" {...iconProps} />
        ),
      }}
      {...props}
    />
  )
}

CalendarHeatmap.displayName = 'CalendarHeatmap'

export { CalendarHeatmap }
