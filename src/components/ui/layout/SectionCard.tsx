export const SectionCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

export * from "./SectionCard";

