import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import type { AnalysisSummaryState } from "@/types/report";

export function ReportStatusKpiStrip({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const metrics = createOverallDashboardMetrics(analysisSummary);
  const featureCount =
    analysisSummary.overallTestSheets?.length || analysisSummary.testSheets.length;
  const rcCount = analysisSummary.rcProgress.items.length;
  const kpis = [
    { label: "Total TC", value: metrics.totalTc.toLocaleString() },
    { label: "Pass Rate", value: `${metrics.passRate}%` },
    { label: "Jira Issues", value: analysisSummary.jiraMatchedRows.toLocaleString() },
    { label: "Features", value: featureCount.toLocaleString() },
    { label: "Jira RC", value: rcCount.toLocaleString() },
    { label: "Next Event", value: metrics.nextEvent.toLocaleString() },
  ];

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-3 shadow-sm shadow-slate-100/60">
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
          >
            <dt className="truncate text-[11px] font-medium text-slate-500">
              {kpi.label}
            </dt>
            <dd className="mt-1 text-lg font-bold text-slate-900">
              {kpi.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
