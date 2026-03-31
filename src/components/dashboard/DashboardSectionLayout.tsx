import { motion } from "framer-motion";

interface DashboardSectionLayoutProps {
  /** Executive panel at the top */
  executive?: React.ReactNode;
  /** Grid of highlight cards */
  highlights?: React.ReactNode;
  /** Main content area (metrics, charts, etc.) */
  children: React.ReactNode;
  /** Optional sidebar content alongside main */
  aside?: React.ReactNode;
  /** Bottom section (tables, alerts, etc.) */
  footer?: React.ReactNode;
  /** Main/aside grid ratio */
  asideRatio?: string;
}

const DashboardSectionLayout = ({
  executive,
  highlights,
  children,
  aside,
  footer,
  asideRatio = "1.45fr_0.95fr",
}: DashboardSectionLayoutProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-5"
  >
    {executive}

    {highlights && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{highlights}</div>}

    {aside ? (
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(320px, 1fr))` }}
      >
        <div
          className="grid gap-5 xl:grid-cols-[var(--ratio)]"
          style={{ "--ratio": asideRatio.replace("_", "_") } as React.CSSProperties}
        >
          {children}
          {aside}
        </div>
      </div>
    ) : (
      children
    )}

    {footer}
  </motion.div>
);

export default DashboardSectionLayout;
