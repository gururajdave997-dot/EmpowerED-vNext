import * as React from "react";
import { cn } from "@/lib/utils";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("h-9 rounded-md border border-slate-300 bg-white px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40", className)}
      {...props}
    >{children}</select>
  )
);
Select.displayName = "Select";
