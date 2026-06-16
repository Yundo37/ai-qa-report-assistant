import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
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

function formatRiskPercentage(value: number, total: number) {
  if (total <= 0) return "0.0%";

  return `${((value / total) * 100).toFixed(1)}%`;
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
  const totalTestCases =
    analysisSummary.overallQaSummary?.Total ?? analysisSummary.qaTotal.Total ?? 0;
  const highRisk = highest + high;
  const lowRisk = low + lowest;
  const releaseRiskNote =
    "Reopened / Next Event\uB294 \uD6C4\uC18D \uD655\uC778 \uD56D\uBAA9\uC73C\uB85C \uAD00\uB9AC\uD569\uB2C8\uB2E4.";
  const priorityItems = [
    {
      label: "High / Highest",
      value: highRisk,
      percentage: formatRiskPercentage(highRisk, remainingTotal),
      className: "border-red-200 bg-red-50 text-red-700",
    },
    {
      label: "Medium",
      value: medium,
      percentage: formatRiskPercentage(medium, remainingTotal),
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Low / Lowest",
      value: lowRisk,
      percentage: formatRiskPercentage(lowRisk, remainingTotal),
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  ];
  const supportItems = [
    {
      label: "Blocked",
      value: blocked,
      percentage: formatRiskPercentage(blocked, totalTestCases),
      className: "text-orange-700",
      slotType: "risk-blocked" as const,
    },
    {
      label: "Next Event",
      value: nextEvent,
      percentage: formatRiskPercentage(nextEvent, totalTestCases),
      className: "text-indigo-700",
      slotType: "risk-next-event" as const,
    },
  ];

  return (
    <section className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold leading-5 tracking-tight text-slate-950">
          릴리즈 리스크 요약
        </h2>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold leading-5 text-slate-500">
          전체 {remainingTotal}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {priorityItems.map((item) => (
          <div
            key={item.label}
            className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center ${item.className}`}
          >
            <p className="text-[11px] font-semibold leading-tight">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold leading-none">{item.value}</p>
            <p className="mt-1 text-[11px] font-semibold opacity-70">
              {item.percentage}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {supportItems.map((item) => (
          <div
            key={item.label}
            className="flex min-w-0 items-center gap-2.5 text-indigo-600"
          >
            <ReportAssetSlot
              type={item.slotType}
              className="size-7 shrink-0 rounded-md bg-transparent bg-none shadow-none"
              imageClassName="size-6 opacity-80"
            />
            <div className="min-w-0 leading-none">
              <p className="text-[11px] font-semibold text-slate-500">
                {item.label}
              </p>
              <div className={`mt-1 flex items-baseline gap-1.5 ${item.className}`}>
                <span className="text-base font-bold leading-none">
                  {item.value}
                </span>
                <span className="text-[10px] font-semibold leading-none opacity-75">
                  {item.percentage}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-indigo-50/45 px-2.5 py-1 text-[10px] leading-4 text-slate-400">
        <ReportAssetSlot
          type="risk-note"
          className="size-4 shrink-0 rounded-md bg-transparent bg-none shadow-none"
          imageClassName="size-3.5 opacity-65"
        />
        <p>{releaseRiskNote}</p>
      </div>
    </section>
  );
}
