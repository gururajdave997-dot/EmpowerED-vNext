import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "secondary";
type Size = "default" | "sm" | "icon";

const variants: Record<Variant, string> = {
  default: "bg-brand text-white hover:bg-brand-dark",
  outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700",
  ghost: "hover:bg-slate-100 text-slate-700",
  secondary: "bg-brand-light text-brand-dark hover:bg-brand-light/70",
};
const sizes: Record<Size, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  icon: "h-9 w-9",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 disabled:pointer-events-none",
      variants[variant], sizes[size], className
    )}
    {...props}
  />
));
Button.displayName = "Button";
