import { motion } from "framer-motion";

type ColorVariant = "emerald" | "amber" | "red" | "blue" | "primary" | "neutral";

const colorMap: Record<ColorVariant, { border: string; bg: string; text: string; sub: string }> = {
  emerald: {
    border: "border-emerald-500/15",
    bg: "bg-emerald-500/8",
    text: "text-emerald-300",
    sub: "text-emerald-200/80",
  },
  amber: {
    border: "border-amber-500/15",
    bg: "bg-amber-500/8",
    text: "text-amber-300",
    sub: "text-amber-200/80",
  },
  red: {
    border: "border-red-500/15",
    bg: "bg-red-500/8",
    text: "text-red-300",
    sub: "text-red-200/80",
  },
  blue: {
    border: "border-blue-500/15",
    bg: "bg-blue-500/8",
    text: "text-blue-300",
    sub: "text-blue-200/80",
  },
  primary: {
    border: "border-primary/15",
    bg: "bg-primary/8",
    text: "text-primary",
    sub: "text-primary/80",
  },
  neutral: {
    border: "border-white/10",
    bg: "bg-white/[0.03]",
    text: "text-foreground",
    sub: "text-muted-foreground",
  },
};

interface HighlightCardProps {
  label: string;
  value: string | number;
  description?: string;
  color?: ColorVariant;
  index?: number;
}

const HighlightCard = ({ label, value, description, color = "neutral", index = 0 }: HighlightCardProps) => {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`rounded-3xl border ${c.border} ${c.bg} p-4`}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${c.text}`}>{value}</p>
      {description && <p className={`mt-1 text-xs ${c.sub}`}>{description}</p>}
    </motion.div>
  );
};

export type { ColorVariant };
export default HighlightCard;
