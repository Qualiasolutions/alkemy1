import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-offset-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30 focus-visible:ring-emerald-500/30 active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        destructive:
          "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/30 focus-visible:ring-red-500/30 active:scale-[0.98]",
        outline:
          "border-2 border-emerald-500/30 bg-transparent text-[var(--color-text-primary)] hover:bg-emerald-500/10 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 focus-visible:ring-emerald-500/20 active:scale-[0.98]",
        secondary:
          "bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-md hover:bg-[var(--color-surface-elevated)] hover:shadow-lg focus-visible:ring-[var(--color-accent-primary)]/20 active:scale-[0.98]",
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-background)] hover:text-[var(--color-text-primary)] focus-visible:ring-[var(--color-accent-primary)]/20",
        link: "text-emerald-400 underline-offset-4 hover:underline hover:text-emerald-300",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-base font-semibold",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
