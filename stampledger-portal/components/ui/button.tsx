import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-cta text-white hover:bg-cta-hover shadow-md hover:shadow-lg focus-visible:ring-cta",
        secondary: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
        outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50",
        ghost: "hover:bg-gray-100 text-gray-700",
        link: "text-cta underline-offset-4 hover:underline",
        accent: "bg-accent text-white hover:bg-accent-dark shadow-md hover:shadow-lg",
        teal: "bg-secondary text-white hover:bg-secondary-dark shadow-md hover:shadow-lg",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
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
