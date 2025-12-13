import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component - Story 15-21: Focus States, Story 16-19: Input Refinements
 *
 * Premium input styling with coral focus glow:
 * - 10px border radius for consistency with buttons
 * - Coral focus glow (soft shadow) on :focus-visible
 * - Hover state with stronger border
 * - Warm border colors
 * - Smooth transitions
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles with refined padding (12px 16px equivalent)
          "flex h-11 w-full rounded-[10px] border bg-background px-4 py-3",
          "text-base md:text-sm",
          // Warm border color
          "border-[rgb(var(--color-border-default))]",
          // Transitions
          "transition-all duration-150 ease-out",
          // Hover state: stronger border
          "hover:border-[rgb(var(--color-border-strong))]",
          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder: muted color
          "placeholder:text-[rgb(var(--color-text-muted))]",
          // Focus-visible: coral glow effect
          "focus-visible:outline-none",
          "focus-visible:border-[rgb(var(--color-primary-500))]",
          "focus-visible:shadow-[0_0_0_3px_rgba(255,107,107,0.15)]",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[rgb(var(--color-bg-muted))]",
          // Error state: red border (via aria-invalid)
          "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:border-red-500",
          "aria-[invalid=true]:focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
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
