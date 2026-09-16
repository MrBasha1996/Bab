import * as React from "react"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

function FilterChip({
  className,
  children,
  onRemove,
  ...props
}: React.ComponentProps<"span"> & { onRemove?: () => void }) {
  const t = useTranslations("common")
  return (
    <span
      data-slot="filter-chip"
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1 rounded-4xl border border-border bg-transparent ps-2 pe-1 text-xs font-medium whitespace-nowrap text-foreground",
        className
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("removeFilter")}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  )
}

export { FilterChip }
