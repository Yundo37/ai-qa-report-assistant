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
    { label: "RC Versions", value: rcCount.toLocaleString() },
    { label: "Next Event", value: metrics.nextEvent.toLocaleString() },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
          >
            <dt className="truncate text-xs font-medium text-slate-500">
              {kpi.label}
            </dt>
            <dd className="mt-2 text-2xl font-bold text-slate-950">
              {kpi.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
