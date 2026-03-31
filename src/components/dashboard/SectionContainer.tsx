import { motion } from "framer-motion";

interface SectionContainerProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  delay?: number;
}

const SectionContainer = ({
  title,
  subtitle,
  badge,
  headerRight,
  children,
  className = "",
  noPadding = false,
  delay = 0,
}: SectionContainerProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(16,16,18,0.94))] shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl ${
      noPadding ? "" : "p-5 sm:p-6"
    } ${className}`}
  >
    {(title || headerRight) && (
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between ${noPadding ? "px-5 py-4 sm:px-6" : "mb-5"}`}>
        <div>
          {title && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {title}
            </p>
          )}
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
              {badge}
            </span>
          )}
          {headerRight}
        </div>
      </div>
    )}
    {children}
  </motion.div>
);

export default SectionContainer;
