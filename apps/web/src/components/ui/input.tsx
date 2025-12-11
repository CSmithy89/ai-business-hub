import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component - Story 15-21: Focus States
 *
 * Premium input styling with coral focus ring:
 * - 10px border radius for consistency with buttons
 * - Coral focus ring on :focus-visible
 * - Smooth transitions
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-[10px] border bg-background px-3 py-2",
          "text-base md:text-sm",
          // Border color
          "border-[rgb(var(--color-border-default))]",
          // Transitions
          "transition-all duration-150 ease-out",
          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Focus-visible: coral ring
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))] focus-visible:ring-offset-2",
          "focus-visible:border-[rgb(var(--color-primary-500))]",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
