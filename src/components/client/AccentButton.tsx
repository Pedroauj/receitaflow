import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AccentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const AccentButton = forwardRef<HTMLButtonElement, AccentButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border-0 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary)/0.75))] px-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.25)] transition-all duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

AccentButton.displayName = "AccentButton";

export default AccentButton;
