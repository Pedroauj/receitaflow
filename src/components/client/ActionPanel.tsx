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
  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98)_0%,rgba(10,13,22,0.98)_100%)] shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_28%)]" />

    <div className="relative p-6 lg:p-7">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>

      {infoText && (
        <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="text-sm leading-7 text-slate-400">{infoText}</p>
        </div>
      )}

      {children}
    </div>
  </div>
);

export default ActionPanel;
