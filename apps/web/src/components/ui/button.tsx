import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button Component - Story 15-20: Premium Button Styling
 *
 * Design System Specifications:
 * - Border radius: 10px (--radius-md)
 * - Smooth transitions: 150ms
 * - Primary: Coral shadow, hover lift, active scale
 * - Ghost: Subtle hover, coral focus ring
 * - Disabled: 50% opacity, no hover effects
 */
const buttonVariants = cva(
  // Base styles with premium feel
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[10px] text-sm font-medium",
    // Smooth 150ms transitions for all states
    "transition-all duration-150 ease-out",
    // Focus-visible with coral ring
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[rgb(var(--color-primary-500))] focus-visible:ring-offset-2",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    // SVG sizing
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Primary - Coral with shadow, lift on hover, scale on active
        default: [
          "bg-primary text-primary-foreground",
          // Coral shadow at rest
          "shadow-[0_2px_8px_rgba(255,107,107,0.25)]",
          // Hover: lift + increased shadow
          "hover:bg-primary/90 hover:-translate-y-0.5",
          "hover:shadow-[0_4px_12px_rgba(255,107,107,0.35)]",
          // Active: scale down
          "active:translate-y-0 active:scale-[0.98] active:shadow-[0_1px_4px_rgba(255,107,107,0.2)]",
        ],
        // Destructive - Red with similar effects
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-[0_2px_8px_rgba(239,68,68,0.25)]",
          "hover:bg-destructive/90 hover:-translate-y-0.5",
          "hover:shadow-[0_4px_12px_rgba(239,68,68,0.35)]",
          "active:translate-y-0 active:scale-[0.98]",
        ],
        // Outline - Border with hover fill
        outline: [
          "border border-[rgb(var(--color-border-default))] bg-background",
          "hover:bg-[rgb(var(--color-bg-hover))] hover:border-[rgb(var(--color-border-strong))]",
          "active:scale-[0.98]",
        ],
        // Secondary - Subtle background
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 hover:-translate-y-0.5",
          "active:translate-y-0 active:scale-[0.98]",
        ],
        // Ghost - Transparent with subtle hover
        ghost: [
          "hover:bg-[rgb(var(--color-bg-hover))]",
          "active:scale-[0.98]",
        ],
        // Link - Underline on hover
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
