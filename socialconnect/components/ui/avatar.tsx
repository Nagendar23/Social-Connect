import * as React from "react"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full border border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, src, ...props }: React.ComponentProps<"img">) {
  if (!src) return null;
  
  return (
    <img
      src={src}
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover z-10", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "absolute inset-0 flex size-full items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }