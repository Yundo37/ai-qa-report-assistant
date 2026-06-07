import type {
  AnalysisSummaryState,
  OverallQaSummary,
  TestSheetSummary,
} from "@/types/report";

type FeatureRow = {
  title: string;
  rows: number;
  summary: OverallQaSummary;
};

function toOverallSummary(summary: TestSheetSummary["summary"]): OverallQaSummary {
  return {
    Total: summary.Total ?? 0,
    Pass: summary.Pass ?? 0,
    Fail: summary.Fail ?? 0,
    Blocked: summary.Blocked ?? 0,
    NextEvent: summary.NextEvent ?? 0,
    "N/A": summary["N/A"] ?? 0,
  };
}

function calculatePassRate(summary: OverallQaSummary) {
  const denominator =
    summary.Pass + summary.Fail + summary.Blocked + summary.NextEvent;
  return denominator > 0 ? Math.round((summary.Pass / denominator) * 100) : 0;
}

export function FeatureQaSummaryTable({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const rows: FeatureRow[] =
    analysisSummary.overallTestSheets ??
    analysisSummary.testSheets.map((sheet) => ({
      title: sheet.title,
      rows: sheet.rows,
      summary: toOverallSummary(sheet.summary),
    }));
  const visibleRows = rows.slice(0, 6);
  const hiddenCount = Math.max(rows.length - visibleRows.length, 0);

  return (
    <section className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Feature QA
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Feature QA Summary
          </h2>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
          {rows.length} features
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1fr)_54px_54px_58px_56px] bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
            <span>Feature</span>
            <span>Total</span>
            <span>Pass</span>
            <span>Remain</span>
            <span>Risk</span>
          </div>
          {visibleRows.map((row) => {
            const passRate = calculatePassRate(row.summary);
            const remaining =
              row.summary.Fail + row.summary.Blocked + row.summary.NextEvent;
            const highRisk = row.summary.Fail + row.summary.Blocked;

            return (
              <div
                key={row.title}
                className="grid grid-cols-[minmax(0,1fr)_54px_54px_58px_56px] items-center border-t border-slate-100 px-3 py-2 text-xs"
              >
                <span className="truncate font-semibold text-slate-950">
                  {row.title}
                </span>
                <span className="font-semibold text-slate-700">
                  {row.summary.Total || row.rows}
                </span>
                <span className="font-semibold text-indigo-700">
                  {passRate}%
                </span>
                <span className="font-semibold text-amber-700">
                  {remaining}
                </span>
                <span className="font-semibold text-red-700">{highRisk}</span>
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <div className="border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
              + {hiddenCount} more feature(s) in Detailed QA Data.
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No Feature QA Summary to display.
        </p>
      )}
    </section>
  );
}
