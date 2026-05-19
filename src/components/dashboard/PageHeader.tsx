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
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(19,27,52,0.96)_0%,rgba(10,14,28,0.98)_45%,rgba(7,10,20,1)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_28%)]" />
      <div className="relative p-6 lg:p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
          {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
          {badgeLabel}
        </div>
        <h1 className="text-[28px] font-semibold leading-none tracking-tight text-white lg:text-[32px]">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

export default PageHeader;
