import type { CountSummary } from "@/types/report";

export function SummaryCard({
  title,
  summary,
  rows,
  emptyMessage = "집계된 데이터가 없습니다.",
}: {
  title: string;
  summary: CountSummary;
  rows?: number;
  emptyMessage?: string;
}) {
  const entries = Object.entries(summary);
  const displayLabel = (label: string) => {
    if (label === "Remaining") return "잔여 이슈";
    if (label === "Resolved") return "해결 완료";
    if (label === "Excluded / Non-Bug") {
      return "Excluded / Non-Bug (제외 이슈)";
    }

    return label;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        {typeof rows === "number" && (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
            {rows} rows
          </span>
        )}
      </div>

      {entries.length > 0 ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {entries.map(([label, count]) => (
            <div key={label} className="rounded-xl bg-white px-4 py-3">
              <dt className="truncate text-xs text-slate-500">
                {displayLabel(label)}
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-950">
                {count}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}
    </div>
  );
}
