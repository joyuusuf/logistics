import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald",
  {
    variants: {
      variant: {
        primary: "bg-emerald text-white hover:bg-emerald-deep shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        navy: "bg-navy text-white hover:bg-navy-soft",
        secondary: "bg-white text-ink border border-line hover:bg-surface hover:border-line-strong",
        ghost: "text-ink-soft hover:bg-surface hover:text-ink",
        outline: "border border-navy/20 text-navy hover:bg-navy/5",
        danger: "bg-danger text-white hover:bg-danger/90",
        "danger-ghost": "text-danger hover:bg-danger-tint",
        link: "text-emerald-deep underline-offset-4 hover:underline px-0 h-auto",
        amber: "bg-amber text-navy hover:bg-amber/90",
        light: "bg-white text-navy hover:bg-white/90",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, asChild, loading, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { buttonVariants };
