import { motion } from "framer-motion";

interface SummaryCardProps {
  label: string;
  value: string | number;
  index?: number;
}

const SummaryCard = ({ label, value, index = 0 }: SummaryCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: index * 0.03 }}
    className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15"
  >
    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
  </motion.div>
);

export default SummaryCard;
