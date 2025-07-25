import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary hover:shadow-lg hover:shadow-primary/20 border border-primary/20",
        destructive:
          "bg-destructive/90 backdrop-blur-sm text-white shadow-md shadow-destructive/15 hover:bg-destructive hover:shadow-lg hover:shadow-destructive/20 border border-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-white/20 bg-white/10 backdrop-blur-md shadow-sm hover:bg-white/20 hover:border-white/30 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10",
        secondary:
          "bg-secondary/80 backdrop-blur-sm text-secondary-foreground shadow-sm border border-secondary/30 hover:bg-secondary/90 hover:shadow-md",
        ghost:
          "hover:bg-white/10 hover:backdrop-blur-sm hover:text-accent-foreground dark:hover:bg-white/5 border border-transparent hover:border-white/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
