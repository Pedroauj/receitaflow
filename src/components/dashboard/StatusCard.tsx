import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type StatusVariant = "success" | "error" | "warning" | "info" | "neutral";

const variantMap: Record<StatusVariant, { border: string; bg: string; text: string; sub: string }> = {
  success: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    sub: "text-emerald-200/80",
  },
  error: {
    border: "border-red-500/20",
    bg: "bg-red-500/10",
    text: "text-red-300",
    sub: "text-red-200/80",
  },
  warning: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    sub: "text-amber-200/80",
  },
  info: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    sub: "text-blue-200/80",
  },
  neutral: {
    border: "border-white/10",
    bg: "bg-white/[0.03]",
    text: "text-muted-foreground",
    sub: "text-muted-foreground/80",
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
      className={`rounded-3xl border ${v.border} ${v.bg} p-4`}
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
