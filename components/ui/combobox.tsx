"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export interface ComboboxOption {
  value: string
  label: string
  keywords?: string[]
  disabled?: boolean
  style?: React.CSSProperties
}

function Combobox({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  className,
  contentClassName,
  size = "default",
  searchThreshold = 8,
}: {
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  id?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  contentClassName?: string
  size?: "sm" | "default"
  searchThreshold?: number
}) {
  const t = useTranslations("common")
  const placeholderText = placeholder ?? t("select")
  const searchPlaceholderText = searchPlaceholder ?? t("searchPlaceholder")
  const emptyTextText = emptyText ?? t("noResults")

  const [open, setOpen] = React.useState(false)
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const selected = options.find((o) => o.value === current)
  const showSearch = options.length > searchThreshold

  function commit(next: string) {
    if (!isControlled) setInternal(next)
    onValueChange?.(next)
    setOpen(false)
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-slot="combobox-trigger"
          data-size={size}
          data-placeholder={selected ? undefined : ""}
          className={cn(
            "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pe-2 ps-2.5 text-start text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-7 dark:bg-input/30 dark:hover:bg-input/50",
            className
          )}
        >
          <span className="line-clamp-1 flex-1">
            {selected ? selected.label : placeholderText}
          </span>
          <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn("w-(--radix-popover-trigger-width) p-0", contentClassName)}
        >
          <Command
            filter={(itemValue, search, keywords) => {
              const haystack = [itemValue, ...(keywords ?? [])]
                .join(" ")
                .toLowerCase()
              return haystack.includes(search.toLowerCase()) ? 1 : 0
            }}
          >
            {showSearch ? (
              <CommandInput placeholder={searchPlaceholderText} />
            ) : null}
            <CommandList>
              <CommandEmpty>{emptyTextText}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    keywords={[o.label, ...(o.keywords ?? [])]}
                    disabled={o.disabled}
                    style={o.style}
                    onSelect={() => commit(o.value)}
                  >
                    <CheckIcon
                      className={cn(
                        "size-4",
                        o.value === current ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{o.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}

export { Combobox }
