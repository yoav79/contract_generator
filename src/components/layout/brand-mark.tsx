import { FileText } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600"
        aria-hidden
      >
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold text-slate-950 sm:text-base">
          Contract Generator
        </p>
        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
          Plataforma legal
        </span>
      </div>
    </div>
  );
}
