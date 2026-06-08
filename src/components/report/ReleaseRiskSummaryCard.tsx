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
      ? "High / Highest Remaining issues need release follow-up."
      : medium > 0 || blocked > 0
        ? "Medium Remaining or Blocked items need review."
        : "No major risk signal is visible in the top risk metrics.";
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
      slotType: "risk-blocked" as const,
    },
    {
      label: "Next Event",
      value: nextEvent,
      className: "bg-indigo-50 text-indigo-700",
      slotType: "risk-next-event" as const,
    },
  ];

  return (
    <section className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Release Risk
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Release Risk Summary
          </h2>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          Total {remainingTotal}
        </span>
      </div>

      <p
        className={`mt-4 rounded-2xl border px-3 py-3 text-sm font-semibold leading-6 ${conclusionClass}`}
      >
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
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[11px] font-semibold opacity-80">
                {item.label}
              </p>
              <ReportAssetSlot
                type={item.slotType}
                className="size-6 rounded-lg bg-white/75 bg-none shadow-sm ring-1 ring-white/80"
                imageClassName="size-4"
              />
            </div>
            <p className="mt-1 text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-start gap-2 pt-3 text-xs leading-5 text-slate-400">
        <ReportAssetSlot
          type="risk-note"
          className="mt-0.5 size-5 rounded-lg bg-violet-50 bg-none shadow-sm ring-1 ring-violet-100"
          imageClassName="size-3.5"
        />
        <p>
          Reopened {reopened.toLocaleString()} / Next Event is tracked as
          follow-up, not as direct release failure.
        </p>
      </div>
    </section>
  );
}
