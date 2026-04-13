import type { LucideIcon } from "lucide-react";

interface ActionPanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  infoText?: string;
  children: React.ReactNode;
}

const ActionPanel = ({
  icon: Icon,
  title,
  description,
  infoText,
  children,
}: ActionPanelProps) => (
  <div className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_28%)]" />

    <div className="relative p-6 lg:p-7">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {infoText && (
        <div className="mb-6 rounded-2xl border border-primary/12 bg-primary/[0.05] p-4">
          <p className="text-sm leading-7 text-muted-foreground">{infoText}</p>
        </div>
      )}

      {children}
    </div>
  </div>
);

export default ActionPanel;
