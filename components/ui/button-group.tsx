import * as React from "react"

import { cn } from "@/lib/utils"

function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="button-group"
      role="group"
      className={cn(
        "inline-flex items-center [&>*]:!rounded-none [&>*:first-child]:!rounded-s-lg [&>*:last-child]:!rounded-e-lg [&>*:not(:first-child)]:-ms-px",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
