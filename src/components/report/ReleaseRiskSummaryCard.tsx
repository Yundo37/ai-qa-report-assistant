import type { AnalysisSummaryState, RemainingIssue } from "@/types/report";

function countByPriority(issues: RemainingIssue[]) {
  return issues.reduce(
    (summary, issue) => {
      if (issue.priority === "Highest") summary.Highest += 1;
      if (issue.priority === "High") summary.High += 1;
      if (issue.priority === "Medium") summary.Medium += 1;
      if (issue.priority === "Low") summary.Low += 1;
      if (issue.priority === "Lowest") summary.Lowest += 1;
      return summary;
    },
    { Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0 }
  );
}

export function ReleaseRiskSummaryCard({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const fallbackPriority = countByPriority(analysisSummary.remainingIssues);
  const remainingPriority =
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary;
  const highest = remainingPriority?.Highest ?? fallbackPriority.Highest;
  const high = remainingPriority?.High ?? fallbackPriority.High;
  const medium = remainingPriority?.Medium ?? fallbackPriority.Medium;
  const low = remainingPriority?.Low ?? fallbackPriority.Low;
  const lowest = remainingPriority?.Lowest ?? fallbackPriority.Lowest;
  const remainingTotal =
    analysisSummary.qaIssueOverview?.remaining?.total ??
    analysisSummary.remainingIssues.length;
  const blocked =
    analysisSummary.overallQaSummary?.Blocked ??
    analysisSummary.qaTotal.Blocked ??
    0;
  const nextEvent =
    analysisSummary.overallQaSummary?.NextEvent ??
    analysisSummary.qaTotal.NextEvent ??
    0;
  const reopened = analysisSummary.rcProgress?.reopenedIssues ?? 0;

  const items = [
    {
      label: "Remaining Total",
      value: remainingTotal,
      help: "현재 남아 있는 이슈",
      className: "border-slate-200 bg-slate-50 text-slate-900",
    },
    {
      label: "High / Highest",
      value: highest + high,
      help: "우선 확인 필요",
      className: "border-red-300 bg-red-50 text-red-700 ring-1 ring-red-100",
    },
    {
      label: "Medium",
      value: medium,
      help: "주의 관찰",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Low / Lowest",
      value: low + lowest,
      help: "보조 확인",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Blocked",
      value: blocked,
      help: "진행 차단 TC",
      className: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
      label: "Next Event",
      value: nextEvent,
      help: "후속 확인 항목",
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    {
      label: "Reopened",
      value: reopened,
      help: "재오픈 이슈",
      className: "border-slate-200 bg-white text-slate-900",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Release Risk
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Release Risk Summary
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Remaining Issue와 QA 진행 상태를 기준으로 릴리즈 확인 포인트를
            요약합니다.
          </p>
        </div>
        <p className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs leading-5 text-indigo-700">
          Next Event는 현재 릴리즈 실패가 아닌 후속 확인 항목입니다.
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border px-4 py-4 ${item.className}`}
          >
            <dt className="text-xs font-medium opacity-80">{item.label}</dt>
            <dd className="mt-2 text-3xl font-bold">
              {item.value.toLocaleString()}
            </dd>
            <p className="mt-2 text-xs opacity-75">{item.help}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
