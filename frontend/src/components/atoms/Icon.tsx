import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const iconVariants = cva("inline-flex items-center justify-center shrink-0", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
    },
    variant: {
      default: "text-foreground",
      primary: "text-primary",
      secondary: "text-secondary",
      muted: "text-muted-foreground",
      destructive: "text-destructive",
      success: "text-green-600",
      warning: "text-yellow-600",
      info: "text-blue-600",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export interface IconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconVariants> {
  icon: LucideIcon;
  label?: string;
}

const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ className, size, variant, icon: IconComponent, label, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(iconVariants({ size, variant }), className)}
        role="img"
        aria-label={label}
        {...props}
      >
        <IconComponent className="h-full w-full" aria-hidden="true" />
      </span>
    );
  }
);

Icon.displayName = "Icon";

export { Icon, iconVariants };
