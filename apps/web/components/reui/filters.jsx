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
      className="rounded-r-[12px] !border-0 !border-l !border-[#24334A] bg-[#111D30] text-[#8EA0BC] shadow-none hover:bg-[#15233A] hover:text-[#EEF4FF]"
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
          className="rounded-none !border-0 !border-l !border-r !border-[#24334A] bg-[#111D30] px-3 text-[#8EA0BC] shadow-none hover:bg-[#15233A] hover:text-[#EEF4FF]"
        >
          {getOperatorLabel(field, operator)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit rounded-2xl border border-[#24334A] bg-[#111D30] p-1 text-[#DCE6F8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
        {getOperators(field).map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => onChange(item.value)}
            className="flex items-center justify-between gap-3 rounded-xl focus:bg-[#15233A] focus:text-[#EEF4FF]"
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="max-w-[180px] justify-between gap-2 rounded-none !border-0 bg-[#111D30] px-3 text-[#DCE6F8] shadow-none hover:bg-[#15233A] hover:text-[#EEF4FF]"
        >
          <span className="truncate">{selectedLabels.length ? selectedLabels.join(", ") : field.placeholder || "Select..."}</span>
          <ChevronDown className="size-4 text-[#8EA0BC]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] rounded-2xl border border-[#24334A] bg-[#111D30] p-1 text-[#DCE6F8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
        <DropdownMenuGroup>
          {(field.options || []).map((option) => {
            const checked = selectedValues.includes(option.value)
            return (
              <DropdownMenuCheckboxItem
                key={String(option.value)}
                checked={checked}
                className="rounded-xl focus:bg-[#15233A] focus:text-[#EEF4FF]"
                onCheckedChange={(nextChecked) => {
                  onChange(nextChecked ? [option.value] : [])
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
      className="h-8 w-36 rounded-[10px] !border-0 bg-[#0F1728] text-[#DCE6F8] shadow-none placeholder:text-[#70809E] focus-visible:!border-0 focus-visible:ring-0"
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
              <Button variant="outline" className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]">
                <Plus className="size-4" />
                Add filter
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px] rounded-2xl border border-[#24334A] bg-[#111D30] p-1 text-[#DCE6F8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            {showSearchInput ? (
              <>
                <div className="relative">
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Filter..."
                    className="h-9 rounded-none border-0 bg-transparent px-2 pl-8 text-sm text-[#DCE6F8] placeholder:text-[#70809E] shadow-none focus-visible:ring-0"
                  />
                  <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-[#70809E]" />
                  {enableShortcut ? <Kbd className="absolute right-2 top-1/2 -translate-y-1/2 border border-[#24334A] bg-[#0F1728]">{shortcutLabel}</Kbd> : null}
                </div>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <ScrollArea className="max-h-80">
              {filteredFields.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[#8EA0BC]">No filters found.</div>
              ) : (
                filteredFields.map((field) => {
                  const hasOptions = Array.isArray(field.options) && field.options.length > 0 && !field.customRenderer
                  if (hasOptions) {
                    return (
                      <DropdownMenuSub key={field.key}>
                        <DropdownMenuSubTrigger className="rounded-xl focus:bg-[#15233A] data-[state=open]:bg-[#15233A]">
                          <span>{field.label}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-[220px] rounded-2xl border border-[#24334A] bg-[#111D30] p-1 text-[#DCE6F8] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
                          <DropdownMenuLabel>{field.label}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(field.options || []).map((option) => (
                            <DropdownMenuItem
                              key={String(option.value)}
                              onClick={() => onChange([...filters, createFilter(field.key, field.defaultOperator || "is", [option.value])])}
                              className="rounded-xl focus:bg-[#15233A] focus:text-[#EEF4FF]"
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
                      className="rounded-xl focus:bg-[#15233A] focus:text-[#EEF4FF]"
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
            className="overflow-hidden rounded-[12px] border border-[#24334A] bg-[#111D30] [&>*]:h-10 [&>*]:border-0 [&>*]:bg-[#111D30] [&>*]:text-[#DCE6F8] [&>*]:hover:bg-[#15233A] [&>*]:hover:text-[#EEF4FF]"
          >
            <ButtonGroupText className="rounded-l-[12px] bg-[#0F1728] px-3 text-[#DCE6F8]">
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
            <div className="flex min-h-10 items-center gap-2 bg-[#111D30] px-3 py-1">
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
