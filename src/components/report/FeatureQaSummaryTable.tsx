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

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Feature QA
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        Feature QA Summary
      </h2>

      {rows.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="pb-3 pr-4 font-medium">Feature Name</th>
                <th className="pb-3 pr-4 font-medium">Total TC</th>
                <th className="pb-3 pr-4 font-medium">Pass</th>
                <th className="pb-3 pr-4 font-medium">Fail</th>
                <th className="pb-3 pr-4 font-medium">Blocked</th>
                <th className="pb-3 pr-4 font-medium">Next Event</th>
                <th className="pb-3 pr-4 font-medium">Pass Rate</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((row) => {
                const status =
                  row.summary.Fail > 0 || row.summary.Blocked > 0
                    ? "주의 필요"
                    : "안정";

                return (
                  <tr key={row.title}>
                    <td className="py-3 pr-4 font-semibold text-slate-950">
                      {row.title}
                    </td>
                    <td className="py-3 pr-4">{row.summary.Total || row.rows}</td>
                    <td className="py-3 pr-4 text-emerald-700">
                      {row.summary.Pass}
                    </td>
                    <td className="py-3 pr-4 text-red-700">
                      {row.summary.Fail}
                    </td>
                    <td className="py-3 pr-4 text-amber-700">
                      {row.summary.Blocked}
                    </td>
                    <td className="py-3 pr-4 text-indigo-700">
                      {row.summary.NextEvent}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-950">
                      {calculatePassRate(row.summary)}%
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          status === "안정"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          표시할 Feature QA Summary 데이터가 없습니다.
        </p>
      )}
    </section>
  );
}
