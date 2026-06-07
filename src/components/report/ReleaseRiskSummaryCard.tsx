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
  const highRisk = highest + high;
  const lowRisk = low + lowest;
  const riskMessage =
    highRisk > 0
      ? "High / Highest Remaining 이슈가 남아 있어 배포 전 후속 확인이 필요합니다."
      : medium > 0 || blocked > 0
        ? "Medium Remaining 또는 Blocked 항목을 중심으로 추가 확인이 필요합니다."
        : "상단 리스크 지표 기준 주요 위험 신호가 크지 않습니다.";
  const conclusionClass =
    highRisk > 0
      ? "border-red-200 bg-red-50 text-red-700"
      : medium > 0 || blocked > 0
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const priorityItems = [
    {
      label: "High / Highest",
      value: highRisk,
      className: "border-red-200 bg-red-50 text-red-700",
    },
    {
      label: "Medium",
      value: medium,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Low / Lowest",
      value: lowRisk,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  ];
  const supportItems = [
    {
      label: "Blocked",
      value: blocked,
      className: "bg-orange-50 text-orange-700",
    },
    {
      label: "Next Event",
      value: nextEvent,
      className: "bg-indigo-50 text-indigo-700",
    },
  ];

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
          Release Risk
        </p>
        <h2 className="text-xl font-bold tracking-tight text-slate-950">
          Release Risk Summary
        </h2>
        <p className="text-sm leading-6 text-slate-500">
          Remaining 우선순위와 QA 진행 상태를 기준으로 배포 전 확인 포인트를
          요약합니다.
        </p>
      </div>

      <p className={`mt-4 rounded-2xl border px-3 py-3 text-sm font-semibold leading-6 ${conclusionClass}`}>
        {riskMessage}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {priorityItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border px-3 py-3 ${item.className}`}
          >
            <p className="truncate text-xs font-semibold">{item.label}</p>
            <p className="mt-2 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {supportItems.map((item) => (
          <div
            key={item.label}
            className={`min-w-0 rounded-2xl px-3 py-2.5 ${item.className}`}
          >
            <p className="truncate text-[11px] font-semibold opacity-80">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        Remaining Total {remainingTotal.toLocaleString()} · Reopened{" "}
        {reopened.toLocaleString()} · Next Event는 현재 릴리즈 실패가 아닌 후속
        확인 항목입니다.
      </p>
    </section>
  );
}
