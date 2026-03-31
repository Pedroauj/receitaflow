import { Info } from "lucide-react";
import SectionContainer from "./SectionContainer";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  maxHeight?: string;
  badge?: string;
  emptyMessage?: string;
  delay?: number;
}

function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  keyExtractor,
  maxHeight = "400px",
  badge,
  emptyMessage = "Nenhum dado disponível.",
  delay = 0,
}: DataTableProps<T>) {
  const gridTemplate = columns.map((c) => c.width || "1fr").join(" ");

  return (
    <SectionContainer noPadding delay={delay}>
      {(title || badge) && (
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            {badge && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                {badge}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div
            className="grid gap-3 bg-white/[0.03] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:px-6"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((col) => (
              <div key={col.key} className={col.className}>
                {col.label}
              </div>
            ))}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight }}>
            {data.map((row, index) => (
              <div
                key={keyExtractor(row, index)}
                className={`grid gap-3 px-5 py-3.5 text-sm text-foreground transition-colors hover:bg-white/[0.035] sm:px-6 ${
                  index % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"
                } ${index !== 0 ? "border-t border-white/5" : ""}`}
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {columns.map((col) => (
                  <div key={col.key} className={col.className}>
                    {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? "-")}
                  </div>
                ))}
              </div>
            ))}

            {data.length === 0 && (
              <div className="px-5 py-10 text-sm text-muted-foreground sm:px-6">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}

export default DataTable;
