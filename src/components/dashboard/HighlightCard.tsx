import { motion } from "framer-motion";

type ColorVariant = "emerald" | "amber" | "red" | "blue" | "primary" | "neutral";

const colorMap: Record<ColorVariant, { border: string; bg: string; text: string; sub: string }> = {
  emerald: {
    border: "border-success/30",
    bg: "bg-success/10",
    text: "text-success-foreground",
    sub: "text-success-foreground/70",
  },
  amber: {
    border: "border-warning/30",
    bg: "bg-warning/10",
    text: "text-warning-foreground",
    sub: "text-warning-foreground/70",
  },
  red: {
    border: "border-destructive/30",
    bg: "bg-destructive/10",
    text: "text-destructive",
    sub: "text-destructive/70",
  },
  blue: {
    border: "border-primary/25",
    bg: "bg-primary/10",
    text: "text-primary",
    sub: "text-primary/70",
  },
  primary: {
    border: "border-primary/25",
    bg: "bg-primary/10",
    text: "text-primary",
    sub: "text-primary/70",
  },
  neutral: {
    border: "border-border",
    bg: "bg-muted/30",
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
      className={`rounded-[22px] border ${c.border} ${c.bg} p-4`}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${c.text}`}>{value}</p>
      {description && <p className={`mt-1 text-xs ${c.sub}`}>{description}</p>}
    </motion.div>
  );
};

export type { ColorVariant };
export default HighlightCard;
