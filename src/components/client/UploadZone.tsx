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
    className="relative block cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,0.98)_0%,rgba(10,13,22,0.98)_100%)] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition-all duration-200 hover:border-violet-500/25 hover:shadow-[0_18px_48px_rgba(0,0,0,0.32)]"
    onDragOver={(e) => e.preventDefault()}
    onDrop={onDrop}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32%)]" />

    <div className="relative">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>

      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
        multiple={multiple}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/8 px-4 py-3">
          <FileCheck className="h-5 w-5 shrink-0 text-violet-300" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-white/10 px-6 py-10 text-center transition-all duration-200 hover:border-violet-500/25 hover:bg-violet-500/5">
          <Icon className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <p className="text-sm font-medium text-slate-300">Arraste ou clique para selecionar</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      )}
    </div>
  </label>
);

export default UploadZone;
