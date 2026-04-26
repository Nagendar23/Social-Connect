import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-24 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[color,border-color,box-shadow,background-color] duration-200 outline-none placeholder:text-muted-foreground/90 hover:border-border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }