"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

function DropdownMenuSubTrigger({ className, inset, children, ...props }) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition-colors hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)] focus:bg-[var(--admin-shell-nav-active-bg)] focus:text-[var(--admin-shell-nav-active-text)] data-[highlighted]:bg-[var(--admin-shell-nav-active-bg)] data-[highlighted]:text-[var(--admin-shell-nav-active-text)] data-[state=open]:bg-[var(--admin-shell-nav-active-bg)] data-[state=open]:text-[var(--admin-shell-nav-active-text)]",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.SubContent
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-2xl border border-[color:var(--admin-shell-border)] bg-[var(--admin-shell-surface)] p-1 text-[var(--admin-shell-text)] shadow-[var(--admin-shell-shadow)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuContent({ className, sideOffset = 4, ...props }) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-2xl border border-[color:var(--admin-shell-border)] bg-[var(--admin-shell-surface)] p-1 text-[var(--admin-shell-text)] shadow-[var(--admin-shell-shadow)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
}

function DropdownMenuItem({ className, inset, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition-colors hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)] focus:bg-[var(--admin-shell-nav-active-bg)] focus:text-[var(--admin-shell-nav-active-text)] data-[highlighted]:bg-[var(--admin-shell-nav-active-bg)] data-[highlighted]:text-[var(--admin-shell-nav-active-text)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({ className, children, checked, ...props }) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(
        "relative flex cursor-default select-none items-center rounded-xl py-2 pl-8 pr-3 text-sm outline-none transition-colors hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)] focus:bg-[var(--admin-shell-nav-active-bg)] focus:text-[var(--admin-shell-nav-active-text)] data-[highlighted]:bg-[var(--admin-shell-nav-active-bg)] data-[highlighted]:text-[var(--admin-shell-nav-active-text)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioItem({ className, children, ...props }) {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        "relative flex cursor-default select-none items-center rounded-xl py-2 pl-8 pr-3 text-sm outline-none transition-colors hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)] focus:bg-[var(--admin-shell-nav-active-bg)] focus:text-[var(--admin-shell-nav-active-text)] data-[highlighted]:bg-[var(--admin-shell-nav-active-bg)] data-[highlighted]:text-[var(--admin-shell-nav-active-text)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({ className, inset, ...props }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-shell-muted)]", inset && "pl-8", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }) {
  return <DropdownMenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-[var(--admin-shell-border)]", className)} {...props} />
}

function DropdownMenuShortcut({ className, ...props }) {
  return <span className={cn("ml-auto text-[11px] tracking-[0.12em] text-[var(--admin-shell-soft)]", className)} {...props} />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
