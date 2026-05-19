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
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(99,102,241,0.85),rgba(139,92,246,0.75))] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(99,102,241,0.25)] transition-all duration-200 hover:opacity-95 hover:shadow-[0_14px_36px_rgba(99,102,241,0.35)] disabled:cursor-not-allowed disabled:opacity-50",
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
