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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Feature QA
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        Feature QA Summary
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Overall Report에 포함된 각 Test Sheet / Feature 단위 QA 결과를
        비교합니다.
      </p>

      {rows.length > 0 ? (
        <div className="mt-5 space-y-3">
          {visibleRows.map((row) => {
            const status =
              row.summary.Fail > 0 || row.summary.Blocked > 0
                ? "주의 필요"
                : "안정";

            return (
              <article
                key={row.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-950">
                      {row.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Total TC {row.summary.Total || row.rows}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-6 lg:w-[640px]">
                    <div>
                      <p className="text-xs text-slate-500">Pass</p>
                      <p className="font-semibold text-emerald-700">
                        {row.summary.Pass}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Fail</p>
                      <p className="font-semibold text-red-700">
                        {row.summary.Fail}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Blocked</p>
                      <p className="font-semibold text-amber-700">
                        {row.summary.Blocked}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Next Event</p>
                      <p className="font-semibold text-indigo-700">
                        {row.summary.NextEvent}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pass Rate</p>
                      <p className="font-semibold text-slate-950">
                        {calculatePassRate(row.summary)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          status === "안정"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {hiddenCount > 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              추가 Feature {hiddenCount}개는 Detailed QA Data에서 확인할 수
              있습니다.
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          표시할 Feature QA Summary 데이터가 없습니다.
        </p>
      )}
    </section>
  );
}
