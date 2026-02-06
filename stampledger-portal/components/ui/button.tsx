import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-cta to-cta-light text-white hover:from-cta-hover hover:to-cta shadow-sm hover:shadow-md focus-visible:ring-cta",
        primary: "bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-dark hover:to-primary shadow-sm hover:shadow-md focus-visible:ring-primary",
        secondary: "border border-primary/20 text-primary hover:bg-primary hover:text-white bg-white",
        outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 bg-white",
        ghost: "hover:bg-gray-100 text-gray-700",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-gradient-to-r from-accent to-accent-light text-white hover:from-accent-dark hover:to-accent shadow-sm hover:shadow-md",
        teal: "bg-gradient-to-r from-secondary to-secondary-light text-white hover:from-secondary-dark hover:to-secondary shadow-sm hover:shadow-md",
        danger: "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-sm hover:shadow-md focus-visible:ring-red-500",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-lg",
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
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
