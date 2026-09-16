import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

function FormCard({
  className,
  contentClassName,
  ...props
}: React.ComponentProps<"div"> & { contentClassName?: string }) {
  return (
    <Card className={cn("max-w-sm", className)}>
      <CardContent className={cn("grid gap-4", contentClassName)} {...props} />
    </Card>
  )
}

export { FormCard }
