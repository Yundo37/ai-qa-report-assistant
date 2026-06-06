import type { OverallTestSheetSummary } from "@/types/report";

const SUMMARY_ITEMS: Array<{
  key: keyof OverallTestSheetSummary["summary"];
  label: string;
}> = [
  { key: "Total", label: "Total" },
  { key: "Pass", label: "Pass" },
  { key: "Fail", label: "Fail" },
  { key: "Blocked", label: "Blocked" },
  { key: "NextEvent", label: "Next Event" },
  { key: "N/A", label: "N/A" },
];

export function OverallFeatureSummaryCard({
  testSheets,
}: {
  testSheets: OverallTestSheetSummary[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
      <h2 className="text-base font-semibold text-slate-950">
        Feature별 상세 QA Summary
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Test Sheet / Feature별 QA 상태를 상세 비교합니다.
      </p>

      {testSheets.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {testSheets.map((sheet) => (
            <article
              key={sheet.title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  {sheet.title}
                </h3>
                <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                  {sheet.rows} rows
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SUMMARY_ITEMS.map((item) => (
                  <div key={item.key} className="rounded-xl bg-slate-50 px-4 py-3">
                    <dt className="text-xs text-slate-500">{item.label}</dt>
                    <dd className="mt-1 text-xl font-semibold text-slate-950">
                      {sheet.summary[item.key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          표시할 Test Sheet Summary가 없습니다.
        </p>
      )}
    </section>
  );
}
