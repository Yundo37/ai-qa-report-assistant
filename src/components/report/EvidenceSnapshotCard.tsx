import type { AnalysisSummaryState } from "@/types/report";

export function EvidenceSnapshotCard({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const features =
    analysisSummary.overallTestSheets?.length || analysisSummary.testSheets.length;
  const rcCount = analysisSummary.rcProgress.items.length;
  const highRisk =
    (analysisSummary.qaIssueOverview?.remaining?.prioritySummary.Highest ?? 0) +
    (analysisSummary.qaIssueOverview?.remaining?.prioritySummary.High ?? 0);
  const items = [
    {
      label: "Test Cases",
      value:
        analysisSummary.overallQaSummary?.Total ??
        analysisSummary.qaTotal.Total ??
        0,
    },
    { label: "Features", value: features },
    { label: "Jira Issues", value: analysisSummary.jiraMatchedRows },
    { label: "Remaining", value: analysisSummary.remainingIssues.length },
    { label: "High Risk", value: highRisk },
    { label: "RC Count", value: rcCount },
  ];

  return (
    <section className="h-full min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Evidence Snapshot
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        데이터 근거 요약
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        이번 리포트에 사용된 QA / Jira 데이터 기준입니다.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5"
          >
            <dt className="truncate text-xs font-medium text-slate-500">
              {item.label}
            </dt>
            <dd className="mt-1 text-xl font-bold text-slate-950">
              {item.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
