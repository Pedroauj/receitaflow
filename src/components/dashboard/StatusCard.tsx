import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type StatusVariant = "success" | "error" | "warning" | "info" | "neutral";

const variantMap: Record<StatusVariant, { border: string; bg: string; text: string; sub: string }> = {
  success: {
    border: "border-success/30",
    bg: "bg-success/10",
    text: "text-success-foreground",
    sub: "text-success-foreground/70",
  },
  error: {
    border: "border-destructive/30",
    bg: "bg-destructive/10",
    text: "text-destructive",
    sub: "text-destructive/70",
  },
  warning: {
    border: "border-warning/30",
    bg: "bg-warning/10",
    text: "text-warning-foreground",
    sub: "text-warning-foreground/70",
  },
  info: {
    border: "border-primary/25",
    bg: "bg-primary/10",
    text: "text-primary",
    sub: "text-primary/70",
  },
  neutral: {
    border: "border-border",
    bg: "bg-muted/30",
    text: "text-muted-foreground",
    sub: "text-muted-foreground/70",
  },
};

interface StatusCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  variant?: StatusVariant;
  badge?: string;
  children?: React.ReactNode;
}

const StatusCard = ({ icon: Icon, title, description, variant = "neutral", badge, children }: StatusCardProps) => {
  const v = variantMap[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-[22px] border ${v.border} ${v.bg} p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${v.text}`} />
          <div>
            <p className={`text-sm font-semibold ${v.text}`}>{title}</p>
            {description && <p className={`mt-1 text-xs leading-5 ${v.sub}`}>{description}</p>}
          </div>
        </div>
        {badge && (
          <span className={`rounded-full border ${v.border} ${v.bg} px-3 py-1.5 text-xs font-semibold ${v.text}`}>
            {badge}
          </span>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  );
};

export type { StatusVariant };
export default StatusCard;
