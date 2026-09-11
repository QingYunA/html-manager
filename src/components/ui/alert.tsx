import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-md border px-3.5 py-2.5 text-xs [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg~*]:pl-6",
  {
    variants: {
      variant: {
        default: "bg-muted/30 border-border text-foreground",
        destructive: "bg-destructive/10 border-destructive/30 text-destructive",
        warning:
          "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
