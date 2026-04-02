import { motion } from "framer-motion";

export const PageContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-full">
      <div className="mx-auto px-6 py-6" style={{ maxWidth: 1560 }}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export * from "./PageContainer";
