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
  const visibleRows = rows.slice(0, 8);
  const hiddenCount = Math.max(rows.length - visibleRows.length, 0);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
          <div className="grid grid-cols-[minmax(160px,1fr)_80px_64px_76px_92px_84px] bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
            <span>Feature Name</span>
            <span>Pass Rate</span>
            <span>Fail</span>
            <span>Blocked</span>
            <span>Next Event</span>
            <span>Status</span>
          </div>
          {visibleRows.map((row) => {
            const status =
              row.summary.Fail > 0 || row.summary.Blocked > 0
                ? "주의"
                : "안정";

            return (
              <div
                key={row.title}
                className="grid grid-cols-[minmax(160px,1fr)_80px_64px_76px_92px_84px] items-center border-t border-slate-100 px-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">
                    {row.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    Total TC {row.summary.Total || row.rows}
                  </p>
                </div>
                <span className="font-semibold text-slate-950">
                  {calculatePassRate(row.summary)}%
                </span>
                <span className="font-semibold text-red-700">
                  {row.summary.Fail}
                </span>
                <span className="font-semibold text-amber-700">
                  {row.summary.Blocked}
                </span>
                <span className="font-semibold text-indigo-700">
                  {row.summary.NextEvent}
                </span>
                <span
                  className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    status === "안정"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <div className="border-t border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">
              추가 Feature {hiddenCount}개는 Detailed QA Data에서 확인할 수
              있습니다.
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 Feature QA Summary가 없습니다.
        </p>
      )}
    </section>
  );
}
