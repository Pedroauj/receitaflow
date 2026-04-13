import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface InfoCard {
  label: string;
  value: string;
}

interface ClientPageHeaderProps {
  badgeIcon?: LucideIcon;
  badgeLabel: string;
  title: string;
  description: string;
  infoCards?: InfoCard[];
}

const ClientPageHeader = ({
  badgeIcon: BadgeIcon,
  badgeLabel,
  title,
  description,
  infoCards,
}: ClientPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="mb-7"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.08),transparent_28%)]" />

        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/50 text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div>
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

          {infoCards && infoCards.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[420px]">
              {infoCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border bg-muted/30 p-4 backdrop-blur-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                    {card.label}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ClientPageHeader;
