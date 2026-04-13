import { FileCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface UploadZoneProps {
  id: string;
  file: File | null;
  title: string;
  description: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  icon: LucideIcon;
  multiple?: boolean;
}

const UploadZone = ({
  id,
  file,
  title,
  description,
  accept,
  onChange,
  onDrop,
  icon: Icon,
  multiple,
}: UploadZoneProps) => (
  <label
    className="relative block cursor-pointer overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-colors hover:border-primary/20"
    onDragOver={(e) => e.preventDefault()}
    onDrop={onDrop}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_28%)]" />

    <div className="relative">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="rounded-[22px] border border-dashed border-primary/15 bg-primary/[0.04] px-6 py-14 text-center transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.07]">
        {file ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10">
              <FileCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{file.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Arquivo carregado. Clique para trocar.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border border-primary/15 bg-primary/8">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              Arraste ou clique para selecionar
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          </>
        )}
      </div>

      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        multiple={multiple}
        onChange={onChange}
      />
    </div>
  </label>
);

export default UploadZone;
