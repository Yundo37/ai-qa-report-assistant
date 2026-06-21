import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
import type { SummaryMetricStripItem } from "@/components/report/ai-summary/types";

type SummaryMetricStripProps = {
  items: SummaryMetricStripItem[];
  variant: "deterministic" | "compact";
};

export function SummaryMetricStrip({ items, variant }: SummaryMetricStripProps) {
  const containerClassName =
    variant === "deterministic"
      ? "grid grid-cols-5 gap-2 rounded-b-3xl border-x border-b border-indigo-100 bg-white/85 p-3 shadow-sm"
      : "grid grid-cols-5 gap-2 border-t border-indigo-100 bg-white/85 p-3";
  const itemClassName =
    variant === "deterministic"
      ? "flex min-w-0 items-center gap-3 rounded-2xl bg-indigo-50/45 px-3 py-2"
      : "flex min-w-0 items-center gap-2.5 rounded-2xl bg-indigo-50/45 px-2.5 py-1.5";
  const slotClassName =
    variant === "deterministic"
      ? "size-9 rounded-xl bg-white/85 bg-none shadow-sm ring-1 ring-indigo-100"
      : "size-8 rounded-xl bg-white/85 bg-none shadow-sm ring-1 ring-indigo-100";
  const imageClassName = variant === "deterministic" ? "size-7" : "size-6";

  return (
    <div className={containerClassName}>
      {items.map((item) => (
        <div key={item.label} className={itemClassName}>
          <ReportAssetSlot
            type={item.slotType}
            className={slotClassName}
            imageClassName={imageClassName}
          />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-slate-500">
              {item.label}
            </p>
            <p className="mt-0.5 text-base font-bold text-slate-950">
              {item.value.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
