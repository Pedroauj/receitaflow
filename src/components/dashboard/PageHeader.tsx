import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  badgeIcon?: LucideIcon;
  badgeLabel: string;
  title: string;
  description: string;
}

const PageHeader = ({
  badgeIcon: BadgeIcon,
  badgeLabel,
  title,
  description,
}: PageHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28 }}
    className="mb-7"
  >
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.08),transparent_28%)]" />
      <div className="relative p-6 lg:p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
          {badgeLabel}
        </div>
        <h1 className="text-[28px] font-semibold leading-none tracking-tight text-foreground lg:text-[32px]">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

export default PageHeader;
