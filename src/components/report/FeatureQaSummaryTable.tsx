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

function isFeatureQaSheetTitle(title: string) {
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, "");
  const excludedKeywords = [
    "jira",
    "\uC9C0\uB77C",
    "issuesheet",
    "jirasummary",
    "issuesummary",
    "\uC774\uC288\uC9D1\uACC4",
    "\uC774\uC288\uC2DC\uD2B8",
  ];

  return !excludedKeywords.some((keyword) =>
    normalizedTitle.includes(keyword)
  );
}

export function FeatureQaSummaryTable({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const sourceRows: FeatureRow[] =
    analysisSummary.overallTestSheets ??
    analysisSummary.testSheets.map((sheet) => ({
      title: sheet.title,
      rows: sheet.rows,
      summary: toOverallSummary(sheet.summary),
    }));
  const rows = sourceRows.filter((row) => isFeatureQaSheetTitle(row.title));

  return (
    <section className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-bold leading-5 tracking-tight text-slate-950">
          기능별 QA 요약
        </h2>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium leading-5 text-slate-500">
          {rows.length}개 기능
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1fr)_60px_60px_60px] bg-slate-50 px-4 py-2 text-center text-[10px] font-semibold text-slate-500">
            <span className="text-left">기능</span>
            <span className="text-center">Total</span>
            <span className="text-center">Pass</span>
            <span className="text-center">잔여</span>
          </div>
          {rows.map((row) => {
            const passRate = calculatePassRate(row.summary);
            const remaining =
              row.summary.Fail + row.summary.Blocked + row.summary.NextEvent;
            const passValueClass =
              passRate < 60 ? "text-rose-700" : "text-indigo-700";
            const remainingValueClass =
              remaining >= 10 ? "text-rose-700" : "text-amber-700";

            return (
              <div
                key={row.title}
                className="grid grid-cols-[minmax(0,1fr)_60px_60px_60px] items-center border-t border-slate-100 px-4 py-2 text-xs"
              >
                <span className="min-w-0 truncate font-semibold text-slate-950">
                  {row.title}
                </span>
                <span className="text-center font-semibold text-slate-700">
                  {row.summary.Total || row.rows}
                </span>
                <span
                  className={`text-center font-semibold ${passValueClass}`}
                >
                  {passRate}%
                </span>
                <span
                  className={`text-center font-semibold ${remainingValueClass}`}
                >
                  {remaining}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 기능별 QA 요약 데이터가 없습니다.
        </p>
      )}
    </section>
  );
}
