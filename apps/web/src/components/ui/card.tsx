import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card Component Variants
 *
 * Story 15-19: Apply Style Guide Card Styling
 *
 * Base card uses premium styling:
 * - 16px border radius (--radius-lg)
 * - Subtle shadow at rest
 * - Smooth 200ms transitions
 *
 * Interactive cards (with `interactive` variant) add:
 * - Hover: border color change, shadow increase, subtle lift
 * - Focus-visible: focus ring for accessibility
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Make card interactive with hover/focus states */
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      data-card="true"
      className={cn(
        // Base card styling - premium feel
        "rounded-[16px] border bg-card text-card-foreground",
        // Subtle shadow at rest (light mode)
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]",
        // Warm border color (light mode)
        "border-[rgb(var(--color-border-subtle))]",
        // Dark mode adjustments
        "dark:border-[rgb(var(--color-border-default))]",
        "dark:bg-[rgb(var(--color-bg-secondary))]",
        // Smooth transitions for all states
        "transition-all duration-200 ease-out",
        // Interactive variant - hover and focus states
        interactive && [
          "cursor-pointer",
          // Hover: border change, shadow increase, subtle lift
          "hover:border-[rgb(var(--color-border-strong))]",
          "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]",
          "hover:-translate-y-0.5",
          // Focus-visible for keyboard navigation
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[rgb(var(--color-primary-500))]",
          "focus-visible:ring-offset-2",
        ],
        className
      )}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)} // p-6 = 24px (--space-6)
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
