import type { OverallQaSummary } from "@/types/report";

const SUMMARY_ITEMS: Array<{
  key: keyof OverallQaSummary;
  label: string;
}> = [
  { key: "Total", label: "Total" },
  { key: "Pass", label: "Pass" },
  { key: "Fail", label: "Fail" },
  { key: "Blocked", label: "Blocked" },
  { key: "NextEvent", label: "Next Event" },
  { key: "N/A", label: "N/A" },
];

export function OverallQaSummaryCard({
  summary,
}: {
  summary: OverallQaSummary;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
      <h2 className="text-base font-semibold text-slate-950">
        Overall QA Summary
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        선택된 모든 Test Sheet의 QA Check 결과를 합산한 전체 요약입니다.
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {SUMMARY_ITEMS.map((item) => (
          <div key={item.key} className="rounded-xl bg-white px-4 py-3">
            <dt className="text-xs text-slate-500">{item.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-950">
              {summary[item.key]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
