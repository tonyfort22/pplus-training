"use client"

import { useMemo, useState } from "react"
import { Check, ChevronDown, Plus, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { ScrollArea } from "@/components/ui/scroll-area"

const DEFAULT_OPERATORS = {
  select: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "empty", label: "is empty" },
    { value: "not_empty", label: "is not empty" },
  ],
  text: [
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "is", label: "is exactly" },
    { value: "empty", label: "is empty" },
    { value: "not_empty", label: "is not empty" },
  ],
  custom: [
    { value: "is", label: "is" },
    { value: "before", label: "before" },
    { value: "after", label: "after" },
    { value: "between", label: "between" },
    { value: "empty", label: "is empty" },
    { value: "not_empty", label: "is not empty" },
  ],
}


const filterMenuContentClassName = "border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-1 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)]"
const filterMenuItemClassName = "rounded-xl focus:bg-[var(--admin-shell-nav-active-bg)] focus:text-[var(--admin-shell-nav-active-text)] data-[highlighted]:bg-[var(--admin-shell-nav-active-bg)] data-[highlighted]:text-[var(--admin-shell-nav-active-text)]"
const filterControlButtonClassName = "bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] text-[0.8rem] font-medium shadow-none hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)]"
const filterControlMutedButtonClassName = "bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)] shadow-none hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)]"
const filterChipClassName = "overflow-hidden rounded-[12px] border border-[color:var(--admin-dashboard-chart-header-divider)] bg-[var(--admin-dashboard-control-bg)] [&>*]:h-10 [&>*]:border-0 [&>*]:bg-[var(--admin-dashboard-control-bg)] [&>*]:text-[var(--admin-dashboard-card-text)] [&>*]:hover:bg-[var(--admin-shell-nav-active-bg)] [&>*]:hover:text-[var(--admin-shell-nav-active-text)]"
const filterChipDividerClassName = "border-[color:var(--admin-dashboard-chart-header-divider)]"
const filterChipLabelClassName = "rounded-l-[12px] bg-[var(--admin-dashboard-card-bg)] px-3 text-[var(--admin-dashboard-card-text)]"
const filterValueShellClassName = "flex min-h-10 items-center gap-2 bg-[var(--admin-dashboard-control-bg)] px-3 py-1"
const filterInputClassName = "h-8 w-36 rounded-[10px] !border-0 bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] shadow-none placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:!border-0 focus-visible:ring-0"
const filterSearchInputClassName = "h-9 rounded-none border-0 bg-transparent px-2 pl-8 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] shadow-none focus-visible:ring-0"
const filterMutedIconClassName = "size-4 text-[var(--admin-dashboard-card-muted)]"

function createFilter(field, operator = "is", values = []) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    field,
    operator,
    values,
  }
}

function getFieldType(field) {
  return field?.type || "select"
}

function getOperators(field) {
  return field?.operators?.length ? field.operators : DEFAULT_OPERATORS[getFieldType(field)] || DEFAULT_OPERATORS.select
}

function getOperatorLabel(field, operator) {
  return getOperators(field).find((item) => item.value === operator)?.label || operator.replace(/_/g, " ")
}

function isOperatorValueFree(operator) {
  return operator === "empty" || operator === "not_empty"
}

function FilterRemoveButton({ onClick }) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={onClick}
      className={cn("rounded-r-[12px] !border-0 !border-l", filterChipDividerClassName, filterControlMutedButtonClassName)}
      style={{ borderColor: 'var(--admin-dashboard-chart-header-divider)' }}
    >
      <X className="size-4" />
    </Button>
  )
}

function FilterOperatorDropdown({ field, operator, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("rounded-none !border-0 !border-l !border-r px-3", filterChipDividerClassName, filterControlMutedButtonClassName)}
          style={{ borderColor: 'var(--admin-dashboard-chart-header-divider)' }}
        >
          {getOperatorLabel(field, operator)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn("w-fit min-w-fit rounded-2xl", filterMenuContentClassName)}>
        {getOperators(field).map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn("flex items-center justify-between gap-3", filterMenuItemClassName)}
          >
            <span>{item.label}</span>
            <Check className={cn("size-4", item.value === operator ? "opacity-100" : "opacity-0")} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FilterSelectValue({ field, values, onChange }) {
  const selectedValues = Array.isArray(values) ? values : []
  const selectedLabels = (field.options || []).filter((option) => selectedValues.includes(option.value)).map((option) => option.label)
  const allowsMultipleValues = field.allowMultipleValues === true

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("max-w-[180px] justify-between gap-2 rounded-none !border-0 px-3", filterControlButtonClassName)}
        >
          <span className="truncate">{selectedLabels.length ? selectedLabels.join(", ") : field.placeholder || "Select..."}</span>
          <ChevronDown className={filterMutedIconClassName} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn("w-[220px] rounded-2xl", filterMenuContentClassName)}>
        <DropdownMenuGroup>
          {(field.options || []).map((option) => {
            const checked = selectedValues.includes(option.value)
            return (
              <DropdownMenuCheckboxItem
                key={String(option.value)}
                checked={checked}
                className={filterMenuItemClassName}
                onCheckedChange={(nextChecked) => {
                  if (!allowsMultipleValues) {
                    onChange(nextChecked ? [option.value] : [])
                    return
                  }

                  const nextValues = nextChecked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((selectedValue) => selectedValue !== option.value)

                  onChange([...new Set(nextValues)])
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FilterTextValue({ field, values, onChange }) {
  const currentValue = values?.[0] ?? ""
  return (
    <Input
      value={currentValue}
      onChange={(event) => onChange([event.target.value])}
      placeholder={field.placeholder || "Enter value..."}
      className={filterInputClassName}
    />
  )
}

function FilterValueRenderer({ field, filter, onChange }) {
  if (isOperatorValueFree(filter.operator)) return null

  if (typeof field.customRenderer === "function") {
    return field.customRenderer({
      field,
      values: filter.values,
      onChange,
      operator: filter.operator,
    })
  }

  if (getFieldType(field) === "text") {
    return <FilterTextValue field={field} values={filter.values} onChange={onChange} />
  }

  return <FilterSelectValue field={field} values={filter.values} onChange={onChange} />
}

function FilterValuePreview({ field, filter }) {
  if (isOperatorValueFree(filter.operator)) return null

  if (typeof field.customValueRenderer === "function") {
    return field.customValueRenderer(filter.values, field.options || [])
  }

  if (getFieldType(field) === "text") {
    return <span className="truncate">{filter.values?.[0] || field.placeholder || "Enter value..."}</span>
  }

  const labels = (field.options || []).filter((option) => filter.values?.includes(option.value)).map((option) => option.label)
  return <span className="truncate">{labels.length ? labels.join(", ") : field.placeholder || "Select..."}</span>
}

export function Filters({
  filters,
  fields,
  onChange,
  className,
  trigger,
  showSearchInput = true,
  allowMultiple = false,
  enableShortcut = false,
  shortcutLabel = "F",
}) {
  const [searchInput, setSearchInput] = useState("")
  const flatFields = useMemo(() => fields.filter((field) => field?.key && field.type !== "separator"), [fields])
  const fieldsMap = useMemo(
    () => flatFields.reduce((accumulator, field) => {
      accumulator[field.key] = field
      return accumulator
    }, {}),
    [flatFields],
  )

  const selectableFields = useMemo(() => {
    return flatFields.filter((field) => {
      if (allowMultiple) return true
      return !filters.some((filter) => filter.field === field.key)
    })
  }, [allowMultiple, filters, flatFields])

  const filteredFields = useMemo(() => {
    return selectableFields.filter((field) => !searchInput || field.label?.toLowerCase().includes(searchInput.toLowerCase()))
  }, [searchInput, selectableFields])

  function addFilterForField(field) {
    if (!field?.key) return
    const defaultOperator = field.defaultOperator || (getFieldType(field) === "text" ? "contains" : "is")
    const defaultValues = getFieldType(field) === "text" ? [""] : []
    onChange([...filters, createFilter(field.key, defaultOperator, defaultValues)])
  }

  function updateFilter(filterId, updates) {
    onChange(filters.map((filter) => (filter.id === filterId ? { ...filter, ...updates } : filter)))
  }

  function removeFilter(filterId) {
    onChange(filters.filter((filter) => filter.id !== filterId))
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-start gap-2", className)}>
      {selectableFields.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {trigger || (
              <Button variant="outline" className={cn("rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)]", filterControlButtonClassName)}>
                <Plus className="size-4" />
                Add filter
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={cn("w-[220px] rounded-2xl", filterMenuContentClassName)}>
            {showSearchInput ? (
              <>
                <div className="relative">
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Filter..."
                    className={filterSearchInputClassName}
                  />
                  <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-dashboard-card-muted)]" />
                  {enableShortcut ? <Kbd className="absolute right-2 top-1/2 -translate-y-1/2 border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-muted)]">{shortcutLabel}</Kbd> : null}
                </div>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <ScrollArea className="max-h-80">
              {filteredFields.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[var(--admin-dashboard-card-muted)]">No filters found.</div>
              ) : (
                filteredFields.map((field) => {
                  const hasOptions = Array.isArray(field.options) && field.options.length > 0 && !field.customRenderer
                  if (hasOptions) {
                    return (
                      <DropdownMenuSub key={field.key}>
                        <DropdownMenuSubTrigger className={cn(filterMenuItemClassName, "data-[state=open]:bg-[var(--admin-shell-nav-active-bg)] data-[state=open]:text-[var(--admin-shell-nav-active-text)]")}>
                          <span>{field.label}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className={cn("w-[220px] rounded-2xl", filterMenuContentClassName)}>
                          <DropdownMenuLabel>{field.label}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(field.options || []).map((option) => (
                            <DropdownMenuItem
                              key={String(option.value)}
                              onClick={() => onChange([...filters, createFilter(field.key, field.defaultOperator || "is", [option.value])])}
                              className={filterMenuItemClassName}
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )
                  }

                  return (
                    <DropdownMenuItem
                      key={field.key}
                      onClick={() => addFilterForField(field)}
                      className={filterMenuItemClassName}
                    >
                      {field.label}
                    </DropdownMenuItem>
                  )
                })
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {filters.map((filter) => {
        const field = fieldsMap[filter.field]
        if (!field) return null

        return (
          <ButtonGroup
            key={filter.id}
            className={filterChipClassName}
          >
            <ButtonGroupText className={filterChipLabelClassName}>
              {field.label}
            </ButtonGroupText>
            <FilterOperatorDropdown
              field={field}
              operator={filter.operator}
              onChange={(nextOperator) => {
                updateFilter(filter.id, {
                  operator: nextOperator,
                  values: isOperatorValueFree(nextOperator) ? [] : filter.values,
                })
              }}
            />
            <div className={filterValueShellClassName}>
              <FilterValueRenderer field={field} filter={filter} onChange={(values) => updateFilter(filter.id, { values })} />
            </div>
            <FilterRemoveButton onClick={() => removeFilter(filter.id)} />
          </ButtonGroup>
        )
      })}
    </div>
  )
}

export { createFilter }
