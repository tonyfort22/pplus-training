"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export default function MultiCombobox({
  className,
  emptyLabel = "No options found.",
  id,
  maxVisibleBadges = 3,
  onSelectedValuesChange = () => {},
  options = [],
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  selectedValues = [],
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef(null)

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)
    return () => window.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  const selectedOptions = options.filter((option) => selectedValues.includes(option.value))
  const hiddenCount = selectedOptions.length - maxVisibleBadges
  const visibleSelectedOptions = isExpanded ? selectedOptions : selectedOptions.slice(0, maxVisibleBadges)

  function toggleValue(value) {
    if (selectedValues.includes(value)) {
      onSelectedValuesChange(selectedValues.filter((item) => item !== value))
      return
    }

    onSelectedValuesChange([...selectedValues, value])
  }

  function removeValue(value) {
    onSelectedValuesChange(selectedValues.filter((item) => item !== value))
  }

  useEffect(() => {
    if (selectedOptions.length <= maxVisibleBadges && isExpanded) {
      setIsExpanded(false)
    }
  }, [isExpanded, maxVisibleBadges, selectedOptions.length])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[12px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-3 py-2 text-left text-sm text-[var(--admin-dashboard-card-text)] outline-none transition focus:border-[var(--admin-shell-accent)] focus:ring-2 focus:ring-[var(--admin-input-focus)]"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {selectedOptions.length ? (
            <>
              {visibleSelectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-shell-nav-active-bg)] px-2.5 py-1 text-xs font-medium text-[var(--admin-shell-nav-active-text)]"
                >
                  {option.label}
                  <span
                    role="button"
                    tabIndex={0}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--admin-shell-nav-active-text)] hover:bg-[var(--admin-shell-control-hover-bg)]"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeValue(option.value)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        event.stopPropagation()
                        removeValue(option.value)
                      }
                    }}
                  >
                    <XIcon className="h-3 w-3" />
                  </span>
                </span>
              ))}
              {!isExpanded && hiddenCount > 0 ? (
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex items-center rounded-full border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-shell-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--admin-dashboard-card-muted)]"
                  onClick={(event) => {
                    event.stopPropagation()
                    setIsExpanded(true)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      event.stopPropagation()
                      setIsExpanded(true)
                    }
                  }}
                >
                  +{hiddenCount} more
                </span>
              ) : null}
              {isExpanded && hiddenCount > 0 ? (
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex items-center rounded-full border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-shell-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--admin-dashboard-card-muted)]"
                  onClick={(event) => {
                    event.stopPropagation()
                    setIsExpanded(false)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      event.stopPropagation()
                      setIsExpanded(false)
                    }
                  }}
                >
                  Show less
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-[var(--admin-dashboard-card-muted)]">{placeholder}</span>
          )}
        </div>
        <ChevronDownIcon className={cn("h-4 w-4 shrink-0 text-[var(--admin-dashboard-card-muted)] transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-2 shadow-[var(--admin-shell-shadow)]">
          <div className="mb-2 flex items-center gap-2 rounded-[10px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-3 py-2">
            <SearchIcon className="h-4 w-4 text-[var(--admin-dashboard-card-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-[var(--admin-dashboard-card-text)] outline-none placeholder:text-[var(--admin-dashboard-card-soft)]"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-sm text-[var(--admin-dashboard-card-text)] transition hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)] focus:bg-[var(--admin-shell-nav-active-bg)] focus:text-[var(--admin-shell-nav-active-text)]"
                    onClick={() => toggleValue(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <CheckIcon className="h-4 w-4 text-[var(--admin-shell-accent)]" /> : null}
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-2 text-sm text-[var(--admin-dashboard-card-muted)]">{emptyLabel}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
