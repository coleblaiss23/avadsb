import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scope-cyan)]/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--scope-cyan)] text-[#0e1116] hover:bg-[var(--scope-cyan-dim)] hover:text-slate-100",
        secondary:
          "bg-[var(--ink-elevated)] text-slate-100 border border-[var(--ink-border)] hover:border-[var(--bezel)]",
        outline:
          "border border-[var(--ink-border)] bg-transparent text-[var(--ink-text)] hover:border-[var(--bezel)]",
        ghost: "text-[var(--ink-muted)] hover:bg-[var(--ink-elevated)] hover:text-[var(--ink-text)]",
        destructive: "bg-[var(--signal-red)] text-[#1a0c0a] hover:bg-[#d4483c]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-11 rounded-sm px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
